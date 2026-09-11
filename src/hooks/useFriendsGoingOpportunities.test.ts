import { describe, it, expect } from 'vitest';
import {
  rankFriendsGoing,
  rankFriendsGoingMultiOppSessions,
  rankFriendsGoingOpportunities,
  scoreOpportunity,
  buildFeedPositions,
  feedKey,
} from './useFriendsGoingOpportunities';
import { MultiOpp, Opportunity, User } from '../types';

const NOW = new Date('2026-08-07T12:00:00');

const user = (id: number, registered = true): User =>
  ({ id, name: `U${id}`, email: '', interests: [], friendIds: [], organizationIds: [],
     points: 0, car_seats: 0, subscribed: false, registered } as User);

const opp = (over: Partial<Opportunity> & { id: number }): Opportunity =>
  ({ name: `opp${over.id}`, description: '', date: '2026-08-20', time: '12:00:00',
     duration: 1, total_slots: 10, imageUrl: '', points: 10, causes: [], tags: [],
     address: '', comments: [], qualifications: [], visibility: [],
     allow_carpool: false, carpool_id: '', involved_users: [], ...over } as Opportunity);

describe('ranking', () => {
  it('ranks more friends first', () => {
    const a = opp({ id: 1, involved_users: [user(2)] });
    const b = opp({ id: 2, involved_users: [user(2), user(3), user(4)] });
    const r = rankFriendsGoingOpportunities([a, b], new Set([2, 3, 4]), [], NOW);
    expect(r.map((x) => x.opportunity.id)).toEqual([2, 1]);
  });

  it('points can no longer outrank friends (the old bug)', () => {
    const manyFriends = opp({ id: 1, points: 0, involved_users: [user(2), user(3), user(4)] });
    const highPoints = opp({ id: 2, points: 60, involved_users: [user(2)] });
    const r = rankFriendsGoingOpportunities([manyFriends, highPoints], new Set([2, 3, 4]), [], NOW);
    expect(r[0].opportunity.id).toBe(1);
  });

  it('admin feed order breaks near-ties', () => {
    const low = opp({ id: 1, involved_users: [user(2)] });
    const high = opp({ id: 2, involved_users: [user(3)] });
    const feed = [{ id: 2, is_multiopp: false }, { id: 1, is_multiopp: false }];
    const r = rankFriendsGoingOpportunities([low, high], new Set([2, 3]), feed, NOW);
    expect(r[0].opportunity.id).toBe(2);
  });

  it('buildFeedPositions keys multiopps separately from opps', () => {
    const m = buildFeedPositions([
      { id: 9, is_multiopp: true }, { id: 9, is_multiopp: false },
    ]);
    expect(m.get(feedKey(9, true))).toBe(0);
    expect(m.get(feedKey(9))).toBe(1);
  });

  it('excludes opportunities with no friends going', () => {
    const r = rankFriendsGoingOpportunities([opp({ id: 1, involved_users: [user(99)] })], new Set([2]), [], NOW);
    expect(r).toHaveLength(0);
  });

  it('unregistered friends do not count, but a hosting friend does', () => {
    const notGoing = opp({ id: 1, involved_users: [user(2, false)] });
    const hosting = opp({ id: 2, host_id: 3, involved_users: [user(3, false)] });
    expect(rankFriendsGoingOpportunities([notGoing], new Set([2]), [], NOW)).toHaveLength(0);
    expect(rankFriendsGoingOpportunities([hosting], new Set([3]), [], NOW)).toHaveLength(1);
  });

  it('non-friend signals stay bounded (max 28)', () => {
    const maxed = opp({ id: 1, date: '2026-08-07', time: '12:00:00', total_slots: 1,
      points: 1000, involved_users: [user(2)] });
    const feed = [{ id: 1, is_multiopp: false }];
    const s = scoreOpportunity(maxed, [user(2)], NOW, buildFeedPositions(feed));
    expect(s).toBeGreaterThan(20);
    expect(s).toBeLessThanOrEqual(20 + 28 + 0.001);
  });
});

const series = (id: number, name = `series${id}`): MultiOpp =>
  ({ id, name, date: '2026-08-20', time: '12:00:00', days_of_week: [],
     week_recurrences: 4, opportunities: [] } as MultiOpp);

/** A session of series `multiopp_id`, as the opps list returns it. */
const session = (over: Partial<Opportunity> & { id: number; multiopp_id: number }): Opportunity =>
  opp(over);

describe('multiopp series', () => {
  it('surfaces the session a friend is in, not the whole series', () => {
    const sessions = [
      session({ id: 10, multiopp_id: 5, date: '2026-08-20', involved_users: [] }),
      session({ id: 11, multiopp_id: 5, date: '2026-08-27', involved_users: [user(2)] }),
    ];
    const r = rankFriendsGoingMultiOppSessions([series(5)], sessions, new Set([2]), [], NOW);
    expect(r).toHaveLength(1);
    expect(r[0].opportunity.id).toBe(11);
    expect(r[0].multiopp?.id).toBe(5);
    expect(r[0].friendsGoing.map((f) => f.id)).toEqual([2]);
  });

  it('shows only one session per series, the most social one', () => {
    const sessions = [
      session({ id: 10, multiopp_id: 5, date: '2026-08-20', involved_users: [user(2)] }),
      session({ id: 11, multiopp_id: 5, date: '2026-08-27', involved_users: [user(2), user(3)] }),
      session({ id: 12, multiopp_id: 5, date: '2026-09-03', involved_users: [user(2)] }),
    ];
    const r = rankFriendsGoingMultiOppSessions([series(5)], sessions, new Set([2, 3]), [], NOW);
    expect(r).toHaveLength(1);
    // Two friends beats the two sooner sessions that have one apiece
    expect(r[0].opportunity.id).toBe(11);
    expect(r[0].friendsGoing.map((f) => f.id)).toEqual([2, 3]);
  });

  it('never credits a session with friends who are in a different one', () => {
    const sessions = [
      session({ id: 10, multiopp_id: 5, date: '2026-08-20', involved_users: [user(2)] }),
      session({ id: 11, multiopp_id: 5, date: '2026-08-27', involved_users: [user(3)] }),
    ];
    const r = rankFriendsGoingMultiOppSessions([series(5)], sessions, new Set([2, 3]), [], NOW);
    expect(r).toHaveLength(1);
    expect(r[0].friendsGoing.map((f) => f.id)).toEqual([2]);
  });

  it('ignores sessions of other series and series with no friends', () => {
    const sessions = [
      session({ id: 10, multiopp_id: 6, involved_users: [user(2)] }),
      session({ id: 11, multiopp_id: 5, involved_users: [user(99)] }),
    ];
    const r = rankFriendsGoingMultiOppSessions([series(5)], sessions, new Set([2]), [], NOW);
    expect(r).toHaveLength(0);
  });

  it('honours the admin feed position of the series, not the session', () => {
    const sessions = [session({ id: 10, multiopp_id: 5, involved_users: [user(2)] })];
    const seriesFeed = [{ id: 5, is_multiopp: true }];
    const sessionFeed = [{ id: 10, is_multiopp: false }];
    const promoted = rankFriendsGoingMultiOppSessions([series(5)], sessions, new Set([2]), seriesFeed, NOW);
    const plain = rankFriendsGoingMultiOppSessions([series(5)], sessions, new Set([2]), [], NOW);
    const wrongKey = rankFriendsGoingMultiOppSessions([series(5)], sessions, new Set([2]), sessionFeed, NOW);
    expect(promoted[0].score).toBeGreaterThan(plain[0].score);
    expect(wrongKey[0].score).toBe(plain[0].score);
  });

  it('ranks sessions and standalone opps in one list', () => {
    const standalone = opp({ id: 1, involved_users: [user(2)] });
    const sessions = [
      session({ id: 10, multiopp_id: 5, involved_users: [user(2), user(3)] }),
    ];
    const r = rankFriendsGoing([standalone], [series(5)], sessions, new Set([2, 3]), [], NOW);
    expect(r.map((x) => x.opportunity.id)).toEqual([10, 1]);
    expect(r[0].multiopp?.id).toBe(5);
    expect(r[1].multiopp).toBeUndefined();
  });
});
