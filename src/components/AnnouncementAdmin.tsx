import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from '../api';
import { Announcement } from '../types';
import { ANNOUNCEMENT_QUERY_KEY, DEFAULT_ANNOUNCEMENT } from './AnnouncementBanner';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/** Admin control for the site-wide banner: what it says, and whether it shows. */
const AnnouncementAdmin: React.FC = () => {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ANNOUNCEMENT_QUERY_KEY,
    queryFn: api.getAnnouncement,
  });

  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Seed the form from the server once it answers. If nothing has ever been
  // saved, offer the built-in announcement as a starting point rather than a
  // blank form.
  useEffect(() => {
    if (!data) return;
    const seed: Announcement = data.message.trim() ? data : { ...DEFAULT_ANNOUNCEMENT, enabled: data.enabled };
    setEnabled(seed.enabled);
    setMessage(seed.message);
    setLink(seed.link);
  }, [data]);

  const handleSave = async () => {
    setSaveState('saving');
    setErrorMessage(null);
    try {
      const saved = await api.updateAnnouncement({ enabled, message: message.trim(), link: link.trim() });
      queryClient.setQueryData(ANNOUNCEMENT_QUERY_KEY, saved);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2500);
    } catch (e: any) {
      setErrorMessage(e?.message || 'Could not save the announcement.');
      setSaveState('error');
    }
  };

  const canSave = saveState !== 'saving' && (!enabled || message.trim().length > 0);

  return (
    <div className="mb-8 bg-white p-6 rounded-lg shadow-lg border">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Announcement banner</h2>
      <p className="text-gray-600 mb-6">
        Shows at the top of the home and opportunities pages, for signed-in and signed-out
        visitors alike.
      </p>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <>
          <label className="flex items-center gap-3 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="form-checkbox h-5 w-5 text-cornell-red"
            />
            <span className="font-medium text-gray-900">
              {enabled ? 'Banner is showing' : 'Banner is hidden'}
            </span>
          </label>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="CampusCares is now on the App Store — download the iPhone app"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link <span className="font-normal text-gray-500">(optional)</span>
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://apps.apple.com/us/app/campuscares/id6806674513"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty for a message that isn't clickable.
            </p>
          </div>

          {/* Same markup and styles as the real banner */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
            {enabled && message.trim() ? (
              <div className="campus-cares-banner" style={{ marginBottom: 0 }}>
                <div className="banner-content">
                  <span className="banner-badge">{message}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {enabled ? 'Add a message to show the banner.' : 'The banner is hidden.'}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="bg-cornell-red text-white px-6 py-2 rounded-lg hover:bg-red-800 transition-colors font-semibold disabled:bg-red-300 disabled:cursor-not-allowed"
            >
              {saveState === 'saving' ? 'Saving...' : 'Save'}
            </button>
            {saveState === 'saved' && (
              <span className="text-sm text-green-600 font-semibold">Saved</span>
            )}
            {saveState === 'error' && errorMessage && (
              <span className="text-sm text-red-600 font-semibold">{errorMessage}</span>
            )}
            {enabled && !message.trim() && (
              <span className="text-sm text-gray-500">A message is required to show the banner.</span>
            )}
          </div>

          {isError && (
            <p className="text-sm text-amber-700 mt-3">
              Couldn't read the current announcement from the server. Visitors are seeing the
              built-in App Store message until this saves successfully.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default AnnouncementAdmin;
