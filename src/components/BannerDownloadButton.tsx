import React, { useState } from 'react';

interface BannerDownloadButtonProps {
  // Ref to the banner <img> so we download whatever is actually on screen
  // (the banners fall back to /backup.jpeg when the main image fails to load).
  imageRef: { current: HTMLImageElement | null };
  // Used to name the downloaded file.
  name: string;
}

// Download button that fades in when hovering the banner image.
// Expects to be rendered inside a container with the `group` and `relative` classes.
const BannerDownloadButton: React.FC<BannerDownloadButtonProps> = ({ imageRef, name }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    const imageUrl = imageRef.current?.src;
    if (!imageUrl) return;

    setIsDownloading(true);
    try {
      // Banners are usually hosted cross-origin (S3), where the `download`
      // attribute is ignored, so fetch the bytes and save them from a blob URL.
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
      const blob = await response.blob();

      const extension = (blob.type.split('/')[1] || 'jpg').split('+')[0];
      const safeName = (name || 'banner').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `${safeName || 'banner'}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      // CORS or network failure - fall back to opening the image in a new tab
      // so the user can still save it manually.
      window.open(imageUrl, '_blank', 'noopener,noreferrer');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      title="Download banner image"
      aria-label="Download banner image"
      className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-2 rounded-lg bg-black/50 hover:bg-black/70 text-white text-sm font-semibold backdrop-blur-sm opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity disabled:opacity-100 disabled:cursor-not-allowed"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
      </svg>
      {isDownloading ? 'Downloading...' : 'Download'}
    </button>
  );
};

export default BannerDownloadButton;
