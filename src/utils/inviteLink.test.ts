import { describe, it, expect } from 'vitest';
import {
  buildInvitePath,
  buildInviteUrl,
  isInvitePath,
  parseInvitePath,
} from './inviteLink';

describe('building an invite link', () => {
  it('encodes the organization and the opportunity in the path', () => {
    expect(buildInvitePath(3, 583)).toBe('/invite/3/583');
  });

  it('makes a full URL to put on a flyer', () => {
    expect(buildInviteUrl('https://www.campuscares.us', 3, 583)).toBe(
      'https://www.campuscares.us/invite/3/583'
    );
  });

  it('does not double the slash when the origin has a trailing one', () => {
    expect(buildInviteUrl('http://localhost:5173/', 3, 583)).toBe(
      'http://localhost:5173/invite/3/583'
    );
  });
});

describe('reading an invite link', () => {
  it('round-trips what it built', () => {
    expect(parseInvitePath(buildInvitePath(3, 583))).toEqual({ orgId: 3, opportunityId: 583 });
  });

  it('tolerates a trailing slash', () => {
    expect(parseInvitePath('/invite/3/583/')).toEqual({ orgId: 3, opportunityId: 583 });
  });

  it('rejects ids that are not positive integers', () => {
    // These arrive from a URL anyone can edit; passing NaN to the API is worse
    // than refusing the link.
    expect(parseInvitePath('/invite/abc/583')).toBeNull();
    expect(parseInvitePath('/invite/3/abc')).toBeNull();
    expect(parseInvitePath('/invite/-1/583')).toBeNull();
    expect(parseInvitePath('/invite/0/583')).toBeNull();
    expect(parseInvitePath('/invite/3.5/583')).toBeNull();
    expect(parseInvitePath('/invite/ 3/583')).toBeNull();
  });

  it('rejects the wrong shape or a different route', () => {
    expect(parseInvitePath('/invite/3')).toBeNull();
    expect(parseInvitePath('/invite/3/583/extra')).toBeNull();
    expect(parseInvitePath('/opportunity/583')).toBeNull();
    expect(parseInvitePath('/')).toBeNull();
    expect(parseInvitePath('')).toBeNull();
  });

  it('answers whether a path is an invite at all', () => {
    expect(isInvitePath('/invite/3/583')).toBe(true);
    expect(isInvitePath('/opportunity/583')).toBe(false);
  });
});
