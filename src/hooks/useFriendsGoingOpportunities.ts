import { useMemo } from 'react';
import { FeedOrderItem, FriendshipsResponse, Opportunity, User } from '../types';

export interface FriendsGoingOpportunity {
  opportunity: Opportunity;
  friendsGoing: User[];
  score: number;
}

/**
 * The most a single signal can contribute to an opportunity's score.
 *
 * Every signal below is normalised to 0..1 and then multiplied by its weight,
 * so a signal can never contribute more than the number listed here. That keeps
 * the ranking predictable: the non-friend signals together top out at 28, which
 * is worth slightly more than one extra friend. A well-curated, urgent, nearly
 * full event with one friend can therefore edge out a distant event with two —
 * but nothing outranks a genuinely more social opportunity by much.
 */
export const SIGNAL_WEIGHTS = {
  friend: 20, // per friend going — deliberately the dominant signal
  feedOrder: 8, // admin's ordering on the Feed Order page
  recency: 6, // how soon the event is
  fillRate: 4, // how full it is — scarcity/urgency
  popularity: 4, // how many people signed up — social proof
  intimacy: 3, // smaller events feel more personal
  points: 3, // longer time commitment (see POINTS_SATURATION)
};

const FEED_ORDER_HORIZON = 10; // positions past this get no curation bonus
const RECENCY_HORIZON_DAYS = 14; // events further out than this get no recency bonus
const POPULARITY_SATURATION = 20; // signups at which social proof maxes out
const INTIMACY_MAX_SLOTS = 30; // events bigger than this get no intimacy bonus
// api.ts derives points as `opp.duration || 0` — 1 minute = 1 point — so this is
// really a proxy for event length. 240 = a 4-hour event, which keeps the signal
// discriminating across realistic durations instead of pinning at the cap.
const POINTS_SATURATION = 240;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

const getEventDate = (opp: Opportunity): Date => new Date(`${opp.date}T${opp.time}`);

const countRegistered = (opp: Opportunity): number =>
  (opp.involved_users ?? []).filter((u) => u.registered).length;

/**
 * Maps a standalone opportunity id to its position in the admin-curated feed.
 * Multiopp entries are skipped — this section only ever ranks standalone opps.
 */
export const buildFeedPositions = (feedOrder: FeedOrderItem[]): Map<number, number> => {
  const positions = new Map<number, number>();
  feedOrder.forEach((item, index) => {
    if (!item.is_multiopp) positions.set(item.id, index);
  });
  return positions;
};

export const scoreOpportunity = (
  opp: Opportunity,
  friendsGoing: User[],
  now: Date,
  feedPositions: Map<number, number>
): number => {
  const registeredCount = countRegistered(opp);
  let score = 0;

  // 1. Friends going — the reason this section exists.
  score += friendsGoing.length * SIGNAL_WEIGHTS.friend;

  // 2. Admin curation: whatever the admin dragged to the top of the Feed Order
  //    page is what they want promoted, so honour it here too.
  const position = feedPositions.get(opp.id);
  if (position !== undefined) {
    score += SIGNAL_WEIGHTS.feedOrder * clamp01(1 - position / FEED_ORDER_HORIZON);
  }

  // 3. Recency — decays smoothly instead of a cliff at day 7, so a 6-day-out
  //    event doesn't massively outrank an 8-day-out one.
  const daysUntil = (getEventDate(opp).getTime() - now.getTime()) / MS_PER_DAY;
  score += SIGNAL_WEIGHTS.recency * clamp01(1 - daysUntil / RECENCY_HORIZON_DAYS);

  if (opp.total_slots > 0) {
    // 4. Scarcity — the fuller it is, the more urgent it is to grab a slot.
    score += SIGNAL_WEIGHTS.fillRate * clamp01(registeredCount / opp.total_slots);

    // 5. Intimacy — a friend at a 6-person event matters more than at a 200-person one.
    score += SIGNAL_WEIGHTS.intimacy * clamp01(1 - opp.total_slots / INTIMACY_MAX_SLOTS);
  }

  // 6. Social proof — saturates so a huge turnout can't run away with the ranking.
  score += SIGNAL_WEIGHTS.popularity * clamp01(registeredCount / POPULARITY_SATURATION);

  // 7. Length — normalised. Raw points would otherwise dominate everything:
  //    a 60-point event beat three friends under the previous scheme.
  score += SIGNAL_WEIGHTS.points * clamp01(opp.points / POINTS_SATURATION);

  return score;
};

/** Pure ranking step, exported so it can be tested without a React renderer. */
export const rankFriendsGoingOpportunities = (
  opportunities: Opportunity[],
  friendIds: Set<number>,
  feedOrder: FeedOrderItem[],
  now: Date = new Date()
): FriendsGoingOpportunity[] => {
  const feedPositions = buildFeedPositions(feedOrder);

  return opportunities
    .map((opp) => {
      const friendsGoing = (opp.involved_users ?? []).filter(
        (user) => friendIds.has(user.id) && (user.registered === true || opp.host_id === user.id)
      );
      return {
        opportunity: opp,
        friendsGoing,
        score: scoreOpportunity(opp, friendsGoing, now, feedPositions),
      };
    })
    .filter((item) => item.friendsGoing.length > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Break ties by the soonest event date
      return getEventDate(a.opportunity).getTime() - getEventDate(b.opportunity).getTime();
    });
};

/**
 * Derives the opportunities that the current user's friends have signed up for.
 *
 * `opportunities` should already be filtered to the ones the user is allowed to
 * see (approved, upcoming, visibility-checked) — this hook only layers the
 * friend logic and the ranking on top of that list.
 */
export const useFriendsGoingOpportunities = (
  opportunities: Opportunity[],
  friendshipsData: FriendshipsResponse | null | undefined,
  currentUser: User | null,
  feedOrder: FeedOrderItem[] = []
): FriendsGoingOpportunity[] =>
  useMemo(() => {
    if (!currentUser || !friendshipsData) return [];

    const friendIds = new Set(
      friendshipsData.users
        .filter((u) => u.friendship_status === 'friends')
        .map((u) => u.user_id)
    );
    if (friendIds.size === 0) return [];

    return rankFriendsGoingOpportunities(opportunities, friendIds, feedOrder);
  }, [opportunities, friendshipsData, currentUser, feedOrder]);

export default useFriendsGoingOpportunities;
