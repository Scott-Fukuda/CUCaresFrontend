import React, { useState } from 'react';
import { Quote } from '../../types';
import { missionQuotes } from '../../data/initialData';

interface MissionQuoteProps {
  /** Overridable so the component can be rendered with a fixed list in tests. */
  quotes?: Quote[];
}

const pickRandomQuote = (quotes: Quote[]): Quote | null =>
  quotes.length === 0 ? null : quotes[Math.floor(Math.random() * quotes.length)];

const MissionQuote: React.FC<MissionQuoteProps> = ({ quotes = missionQuotes }) => {
  // Lazy initialiser so the quote is picked once when the page loads, rather
  // than on every re-render — otherwise it would change as the user edits the
  // opportunity, opens dialogs, etc.
  const [quote] = useState<Quote | null>(() => pickRandomQuote(quotes));

  if (!quote) return null;

  return (
    <figure className="mt-12 mb-4 mx-auto max-w-2xl px-6 text-center">
      <div className="mx-auto mb-6 h-px w-16 bg-gray-300" />
      <blockquote className="text-lg italic leading-relaxed text-gray-700">
        &ldquo;{quote.text}&rdquo;
      </blockquote>
      {quote.author && (
        <figcaption className="mt-3 text-sm font-semibold text-cornell-red">
          &mdash; {quote.author}
        </figcaption>
      )}
    </figure>
  );
};

export default MissionQuote;
