import { describe, it, expect } from 'vitest';
import { buildFeedItems } from './feed';
import { Opportunity, User, MultiOpp } from '../types';

const NOW = new Date('2026-08-07T12:00:00');

const user = (over: Partial<User> & { id: number }): User =>
  ({ name: `U${over.id}`, email: '', interests: [], friendIds: [], organizationIds: [],
     points: 0, car_seats: 0, subscribed: false, registered: true, ...over } as User);

const opp = (over: Partial<Opportunity> & { id: number }): Opportunity =>
  ({ name: `opp${over.id}`, description: '', date: '2026-08-20', time: '12:00:00',
     duration: 1, total_slots: 10, imageUrl: '', points: 10, causes: [], tags: [],
     address: '', comments: [], qualifications: [], visibility: [], approved: true,
     allow_carpool: false, carpool_id: '', involved_users: [], ...over } as Opportunity);

const multi = (over: Partial<MultiOpp> & { id: number }): MultiOpp =>
  ({ name: `multi${over.id}`, date: '2026-08-20', time: '12:00:00', days_of_week: [],
     week_recurrences: 1, visibility: [], opportunities: [], ...over } as MultiOpp);

const ids = (items: ReturnType<typeof buildFeedItems>) =>
  items.map((i) => `${i.kind}-${i.data.id}`);

/** For assertions about membership rather than ordering. */
const idSet = (items: ReturnType<typeof buildFeedItems>) => ids(items).sort();

const build = (over: Partial<Parameters<typeof buildFeedItems>[0]> = {}) =>
  buildFeedItems({ opportunities: [], multiopps: [], currentUser: null,
                   feedOrder: [], invisibleMultioppIds: [], now: NOW, ...over });

describe('hidden multiopps', () => {
  it('drops multiopps an admin has hidden', () => {
    const r = build({
      multiopps: [multi({ id: 1 }), multi({ id: 2 })],
      invisibleMultioppIds: [2],
    });
    expect(ids(r)).toEqual(['multiopp-1']);
  });

  it('drops every multiopp when the hidden list is unavailable', () => {
    const r = build({
      opportunities: [opp({ id: 5 })],
      multiopps: [multi({ id: 1 }), multi({ id: 2 })],
      invisibleMultioppIds: null,
    });
    expect(ids(r)).toEqual(['opp-5']);
  });

  it('hiding a multiopp does not hide standalone opps with the same id', () => {
    const r = build({
      opportunities: [opp({ id: 2 })],
      multiopps: [multi({ id: 2 })],
      invisibleMultioppIds: [2],
    });
    expect(ids(r)).toEqual(['opp-2']);
  });
});

describe('org visibility', () => {
  it('hides org-restricted items from signed-out visitors', () => {
    const r = build({
      opportunities: [opp({ id: 1, visibility: [7] }), opp({ id: 2 })],
      multiopps: [multi({ id: 3, visibility: [7] }), multi({ id: 4 })],
    });
    expect(idSet(r)).toEqual(['multiopp-4', 'opp-2']);
  });

  it('shows org-restricted items to members and admins', () => {
    const restricted = { opportunities: [opp({ id: 1, visibility: [7] })],
                         multiopps: [multi({ id: 3, visibility: [7] })] };
    const member = build({ ...restricted, currentUser: user({ id: 9, organizationIds: [7] }) });
    const outsider = build({ ...restricted, currentUser: user({ id: 9, organizationIds: [8] }) });
    const admin = build({ ...restricted, currentUser: user({ id: 9, admin: true }) });
    expect(idSet(member)).toEqual(['multiopp-3', 'opp-1']);
    expect(idSet(outsider)).toEqual([]);
    expect(idSet(admin)).toEqual(['multiopp-3', 'opp-1']);
  });
});

describe('opportunity filtering', () => {
  it('drops unapproved, past, and multiopp-owned opportunities', () => {
    const r = build({
      opportunities: [
        opp({ id: 1, approved: false }),
        opp({ id: 2, date: '2026-08-06' }),
        opp({ id: 3, multiopp: multi({ id: 99 }) }),
        opp({ id: 4 }),
      ],
    });
    expect(ids(r)).toEqual(['opp-4']);
  });

  it('keeps opportunities happening later today', () => {
    const r = build({ opportunities: [opp({ id: 1, date: '2026-08-07', time: '18:00:00' })] });
    expect(ids(r)).toEqual(['opp-1']);
  });
});

describe('ordering', () => {
  it('follows the admin feed order, then falls back to chronological', () => {
    const r = build({
      opportunities: [opp({ id: 1, date: '2026-08-25' }), opp({ id: 2, date: '2026-08-10' })],
      multiopps: [multi({ id: 3 })],
      feedOrder: [{ id: 3, is_multiopp: true }, { id: 1, is_multiopp: false }],
    });
    expect(ids(r)).toEqual(['multiopp-3', 'opp-1', 'opp-2']);
  });
});
