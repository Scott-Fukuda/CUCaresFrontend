/**
 * Shareable invite links: one URL (or QR code) that joins someone to an
 * organization and drops them on a specific opportunity.
 *
 * The link is an ordinary in-app route, which is what makes the signed-out case
 * work: an unauthenticated visitor following it is sent to sign up, the path is
 * remembered by the same machinery that handles any other deep link (see
 * `authRedirect`), and they land back here once they have an account.
 */

export const INVITE_PATH_PREFIX = '/invite';

export interface InviteTarget {
  orgId: number;
  opportunityId: number;
}

export const buildInvitePath = (orgId: number, opportunityId: number): string =>
  `${INVITE_PATH_PREFIX}/${orgId}/${opportunityId}`;

/** The full URL to print on a flyer. `origin` is usually `window.location.origin`. */
export const buildInviteUrl = (origin: string, orgId: number, opportunityId: number): string =>
  `${origin.replace(/\/+$/, '')}${buildInvitePath(orgId, opportunityId)}`;

const parseId = (raw: string | undefined): number | null => {
  if (!raw || !/^\d+$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value > 0 ? value : null;
};

/**
 * Reads an invite route, or returns null for anything that isn't one.
 *
 * Ids come from a URL a stranger can edit, so anything but two positive
 * integers is rejected rather than passed on to the API as NaN.
 */
export const parseInvitePath = (pathname: string): InviteTarget | null => {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length !== 3) return null;
  if (`/${segments[0]}` !== INVITE_PATH_PREFIX) return null;

  const orgId = parseId(segments[1]);
  const opportunityId = parseId(segments[2]);
  if (orgId === null || opportunityId === null) return null;

  return { orgId, opportunityId };
};

export const isInvitePath = (pathname: string): boolean => parseInvitePath(pathname) !== null;
