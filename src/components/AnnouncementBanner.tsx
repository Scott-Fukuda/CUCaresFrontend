import React from 'react';
import { useQuery } from '@tanstack/react-query';
import * as api from '../api';
import { Announcement } from '../types';

/**
 * What the banner says until an admin saves something else.
 *
 * Also what it falls back to when the announcement endpoint can't be reached —
 * an older backend without the route, or a blip — so the launch announcement
 * doesn't depend on a deploy landing first.
 */
export const DEFAULT_ANNOUNCEMENT: Announcement = {
  enabled: true,
  message: 'CampusCares is now on the App Store — download the iPhone app',
  link: 'https://apps.apple.com/us/app/campuscares/id6806674513',
};

export const ANNOUNCEMENT_QUERY_KEY = ['announcement'];

/** Decides what to render from whatever the query came back with. */
export const resolveAnnouncement = (
  data: Announcement | undefined,
  isError: boolean
): Announcement | null => {
  // The endpoint is unreachable: show the built-in announcement rather than nothing.
  if (isError || !data) return DEFAULT_ANNOUNCEMENT;

  // An admin turned it off. Respect that — never fall back over a deliberate off.
  if (!data.enabled) return null;

  // Enabled but blank would render an empty bar.
  if (!data.message.trim()) return DEFAULT_ANNOUNCEMENT;

  return data;
};

/**
 * The site-wide banner. Self-fetching so it can sit in both the signed-in and
 * signed-out trees without threading props through either.
 */
const AnnouncementBanner: React.FC = () => {
  const { data, isError, isLoading } = useQuery({
    queryKey: ANNOUNCEMENT_QUERY_KEY,
    queryFn: api.getAnnouncement,
    staleTime: 5 * 60_000,
  });

  // Nothing until the first answer, so the banner doesn't flash the default and
  // then swap to the admin's message.
  if (isLoading) return null;

  const announcement = resolveAnnouncement(data, isError);
  if (!announcement) return null;

  const { message, link } = announcement;

  return (
    <div className="campus-cares-banner">
      <div className="banner-content">
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer">
            <span className="banner-badge">{message}</span>
          </a>
        ) : (
          <span className="banner-badge">{message}</span>
        )}
      </div>
    </div>
  );
};

export default AnnouncementBanner;
