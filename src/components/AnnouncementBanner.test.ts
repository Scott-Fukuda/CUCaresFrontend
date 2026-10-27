import { describe, it, expect } from 'vitest';
import { DEFAULT_ANNOUNCEMENT, resolveAnnouncement } from './AnnouncementBanner';

describe('what the banner shows', () => {
  it('shows the admin message when one is published', () => {
    const published = { enabled: true, message: 'Volunteer fair Friday', link: 'https://x.test' };
    expect(resolveAnnouncement(published, false)).toEqual(published);
  });

  it('shows nothing when an admin has turned it off', () => {
    expect(resolveAnnouncement({ enabled: false, message: 'Old news', link: '' }, false)).toBeNull();
  });

  it('respects "off" even though the fallback exists', () => {
    // The fallback is for a broken endpoint, never for a deliberate off switch.
    expect(resolveAnnouncement({ enabled: false, message: '', link: '' }, false)).toBeNull();
  });

  it('falls back to the App Store announcement when the endpoint fails', () => {
    // An older backend without the route shouldn't mean no announcement.
    expect(resolveAnnouncement(undefined, true)).toEqual(DEFAULT_ANNOUNCEMENT);
    expect(resolveAnnouncement(undefined, false)).toEqual(DEFAULT_ANNOUNCEMENT);
  });

  it('falls back rather than rendering an empty bar', () => {
    expect(resolveAnnouncement({ enabled: true, message: '   ', link: '' }, false)).toEqual(
      DEFAULT_ANNOUNCEMENT
    );
  });

  it('points the default at the App Store listing', () => {
    expect(DEFAULT_ANNOUNCEMENT.link).toBe(
      'https://apps.apple.com/us/app/campuscares/id6806674513'
    );
    expect(DEFAULT_ANNOUNCEMENT.enabled).toBe(true);
    expect(DEFAULT_ANNOUNCEMENT.message).toMatch(/app store/i);
  });
});
