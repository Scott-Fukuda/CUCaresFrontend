import { describe, it, expect } from 'vitest';
import { rankFriendsGoingOpportunities, scoreOpportunity, buildFeedPositions } from './useFriendsGoingOpportunities';
import { Opportunity, User } from '../types';

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

  it('buildFeedPositions ignores multiopp entries', () => {
    const m = buildFeedPositions([
      { id: 9, is_multiopp: true }, { id: 1, is_multiopp: false },
    ]);
    expect(m.get(9)).toBeUndefined();
    expect(m.get(1)).toBe(1);
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
