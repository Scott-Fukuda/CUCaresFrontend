import { useMemo } from 'react';
import { FeedOrderItem, FriendshipsResponse, MultiOpp, Opportunity, User } from '../types';

/**
 * One card in the section: a standalone opportunity, or the single session of a
 * multiopp series that the section picked to represent that series.
 */
export interface FriendsGoingOpportunity {
  opportunity: Opportunity;
  /** Set when `opportunity` is one session of a multiopp series. */
  multiopp?: MultiOpp;
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
 * Feed-order lookup key. Ids are only unique within their kind, so the key has
 * to carry both — same shape OpportunitiesPage uses to order the main feed.
 */
export const feedKey = (id: number, isMultiOpp = false): string => `${isMultiOpp}-${id}`;

/** Maps every feed entry, standalone or multiopp, to its admin-curated position. */
export const buildFeedPositions = (feedOrder: FeedOrderItem[]): Map<string, number> => {
  const positions = new Map<string, number>();
  feedOrder.forEach((item, index) => {
    positions.set(feedKey(item.id, item.is_multiopp), index);
  });
  return positions;
};

/**
 * Scores one opportunity. For a multiopp this is called with the series'
 * representative session plus `key` pointing at the series' own feed position,
 * so admin curation of the series still counts.
 */
export const scoreOpportunity = (
  opp: Opportunity,
  friendsGoing: User[],
  now: Date,
  feedPositions: Map<string, number>,
  key: string = feedKey(opp.id)
): number => {
  const registeredCount = countRegistered(opp);
  let score = 0;

  // 1. Friends going — the reason this section exists.
  score += friendsGoing.length * SIGNAL_WEIGHTS.friend;

  // 2. Admin curation: whatever the admin dragged to the top of the Feed Order
  //    page is what they want promoted, so honour it here too.
  const position = feedPositions.get(key);
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

/** Friends signed up for one opportunity. A friend hosting counts as going. */
const friendsIn = (opp: Opportunity, friendIds: Set<number>): User[] =>
  (opp.involved_users ?? []).filter(
    (user) => friendIds.has(user.id) && (user.registered === true || opp.host_id === user.id)
  );

const byScoreThenSoonest = (a: FriendsGoingOpportunity, b: FriendsGoingOpportunity): number => {
  if (b.score !== a.score) return b.score - a.score;
  // Break ties by the soonest event date
  return getEventDate(a.opportunity).getTime() - getEventDate(b.opportunity).getTime();
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
    .map((opp): FriendsGoingOpportunity => {
      const friendsGoing = friendsIn(opp, friendIds);
      return {
        opportunity: opp,
        friendsGoing,
        score: scoreOpportunity(opp, friendsGoing, now, feedPositions),
      };
    })
    .filter((item) => item.friendsGoing.length > 0)
    .sort(byScoreThenSoonest);
};

/**
 * Picks the one session per multiopp series worth showing.
 *
 * The feed shows a series as a single card, so six Soup Kitchen recurrences must
 * not become six entries here. Rather than showing the series card — which never
 * says which session the friend actually picked — each series contributes its
 * best-scoring session, ranked exactly like a standalone opp except that the
 * admin feed position comes from the series. Because friends are the dominant
 * signal, that lands on the session with the most friends in it, and every part
 * of the entry (avatars, caption, date) then describes that one session.
 *
 * `sessions` are the child opportunities of the given multiopps — already
 * filtered to the approved, upcoming ones the user may see. They come from the
 * main opportunities list rather than `multiopp.opportunities`, because only
 * the former carries the `registered` flag each friend check depends on.
 */
export const rankFriendsGoingMultiOppSessions = (
  multiopps: MultiOpp[],
  sessions: Opportunity[],
  friendIds: Set<number>,
  feedOrder: FeedOrderItem[],
  now: Date = new Date()
): FriendsGoingOpportunity[] => {
  const feedPositions = buildFeedPositions(feedOrder);

  const sessionsById = new Map<number, Opportunity[]>();
  sessions.forEach((session) => {
    const id = session.multiopp_id ?? session.multiopp?.id;
    if (id === undefined || id === null) return;
    const group = sessionsById.get(id);
    if (group) group.push(session);
    else sessionsById.set(id, [session]);
  });

  return multiopps
    .map((multiopp): FriendsGoingOpportunity | null => {
      const candidates = (sessionsById.get(multiopp.id) ?? [])
        .map((session): FriendsGoingOpportunity => {
          const friendsGoing = friendsIn(session, friendIds);
          return {
            opportunity: session,
            multiopp,
            friendsGoing,
            score: scoreOpportunity(
              session,
              friendsGoing,
              now,
              feedPositions,
              feedKey(multiopp.id, true)
            ),
          };
        })
        .filter((item) => item.friendsGoing.length > 0)
        .sort(byScoreThenSoonest);

      return candidates[0] ?? null;
    })
    .filter((item): item is FriendsGoingOpportunity => item !== null)
    .sort(byScoreThenSoonest);
};

/** Standalone opportunities and one session per multiopp series, in one ranking. */
export const rankFriendsGoing = (
  opportunities: Opportunity[],
  multiopps: MultiOpp[],
  multioppSessions: Opportunity[],
  friendIds: Set<number>,
  feedOrder: FeedOrderItem[],
  now: Date = new Date()
): FriendsGoingOpportunity[] =>
  [
    ...rankFriendsGoingOpportunities(opportunities, friendIds, feedOrder, now),
    ...rankFriendsGoingMultiOppSessions(multiopps, multioppSessions, friendIds, feedOrder, now),
  ].sort(byScoreThenSoonest);

/**
 * Derives the opportunities the current user's friends have signed up for,
 * including one representative session per multiopp series.
 *
 * `opportunities`, `multiopps` and `multioppSessions` should already be filtered
 * to the ones the user is allowed to see (approved, upcoming, visibility-checked)
 * — this hook only layers the friend logic and the ranking on top of those lists.
 */
export const useFriendsGoingOpportunities = (
  opportunities: Opportunity[],
  friendshipsData: FriendshipsResponse | null | undefined,
  currentUser: User | null,
  feedOrder: FeedOrderItem[] = [],
  multiopps: MultiOpp[] = [],
  multioppSessions: Opportunity[] = []
): FriendsGoingOpportunity[] =>
  useMemo(() => {
    if (!currentUser || !friendshipsData) return [];

    const friendIds = new Set(
      friendshipsData.users
        .filter((u) => u.friendship_status === 'friends')
        .map((u) => u.user_id)
    );
    if (friendIds.size === 0) return [];

    return rankFriendsGoing(opportunities, multiopps, multioppSessions, friendIds, feedOrder);
  }, [opportunities, friendshipsData, currentUser, feedOrder, multiopps, multioppSessions]);

export default useFriendsGoingOpportunities;
