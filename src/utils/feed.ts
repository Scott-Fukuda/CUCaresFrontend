import { Opportunity, User, MultiOpp, FeedOrderItem, FeedItem } from '../types';

export interface BuildFeedItemsArgs {
  opportunities: Opportunity[];
  multiopps: MultiOpp[];
  currentUser: User | null;
  feedOrder: FeedOrderItem[];
  /**
   * Multiopps an admin has hidden from the feed. Pass null when the list could
   * not be loaded (the /feed-order endpoint requires auth) — every multiopp is
   * then hidden rather than risking showing one that is meant to stay hidden.
   */
  invisibleMultioppIds: number[] | null;
  now?: Date;
}

/**
 * Builds the ordered opportunity/multiopp feed shared by the Opportunities and
 * Explore pages: approved and upcoming standalone opps plus visible multiopps,
 * sorted by the admin feed order and then chronologically.
 */
export const buildFeedItems = ({
  opportunities,
  multiopps,
  currentUser,
  feedOrder,
  invisibleMultioppIds,
  now = new Date(),
}: BuildFeedItemsArgs): FeedItem[] => {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  // Filter standalone opps (approved, upcoming, visible, not part of a multiopp)
  const standaloneOpps = opportunities
    .map((opp) => {
      const [year, month, day] = opp.date.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      const [hours, minutes] = opp.time.split(':').map(Number);
      const fullDateTime = new Date(year, month - 1, day, hours, minutes);
      return { ...opp, localDate, fullDateTime };
    })
    .filter((opp) => {
      if (!opp.approved) return false;
      if (opp.localDate.getTime() < today.getTime()) return false;
      if (opp.multiopp) return false;
      if (!opp.visibility || opp.visibility.length === 0) return true;
      if (!currentUser) return false;
      if (currentUser.admin) return true;
      const userOrgIds = currentUser.organizationIds || [];
      return opp.visibility.some((orgId) => userOrgIds.includes(orgId));
    });

  // Filter visible multiopps (excluding invisible ones set by admin)
  const invisibleSet = new Set(invisibleMultioppIds ?? []);
  const visibleMultiOpps = invisibleMultioppIds === null ? [] : multiopps.filter((m) => {
    if (invisibleSet.has(m.id)) return false;
    if (!m.visibility || m.visibility.length === 0) return true;
    if (!currentUser) return false;
    if (currentUser.admin) return true;
    const userOrgIds = currentUser.organizationIds || [];
    return m.visibility.some((orgId) => userOrgIds.includes(orgId));
  });

  // Build position lookup from feedOrder — key: `${is_multiopp}-${id}`
  const positionMap = new Map<string, number>(
    feedOrder.map((item, index) => [`${item.is_multiopp}-${item.id}`, index])
  );

  const oppItems: FeedItem[] = standaloneOpps.map((opp) => ({ kind: 'opp', data: opp }));
  const multiItems: FeedItem[] = visibleMultiOpps.map((m) => ({ kind: 'multiopp', data: m }));

  return [...oppItems, ...multiItems].sort((a, b) => {
    const keyA = `${a.kind === 'multiopp'}-${a.data.id}`;
    const keyB = `${b.kind === 'multiopp'}-${b.data.id}`;
    const posA = positionMap.get(keyA) ?? Infinity;
    const posB = positionMap.get(keyB) ?? Infinity;
    if (posA !== posB) return posA - posB;
    // Fallback: chronological by first date
    const dateA = a.kind === 'opp'
      ? (a.data as typeof standaloneOpps[0]).fullDateTime.getTime()
      : new Date(a.data.date).getTime();
    const dateB = b.kind === 'opp'
      ? (b.data as typeof standaloneOpps[0]).fullDateTime.getTime()
      : new Date(b.data.date).getTime();
    return dateA - dateB;
  });
};
