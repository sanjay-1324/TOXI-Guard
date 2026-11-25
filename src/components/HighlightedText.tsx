import React from 'react';
import { HighlightedToken } from '../types';

interface HighlightedTextProps {
  text: string;
  highlights: HighlightedToken[];
  selectedToken?: HighlightedToken | null;
  onSelectToken?: (token: HighlightedToken) => void;
}

export function HighlightedText({
  text,
  highlights,
  selectedToken,
  onSelectToken,
}: HighlightedTextProps) {
  if (!text) {
    return (
      <span className="text-slate-400 italic">
        Enter a comment to inspect highlighted tokens.
      </span>
    );
  }

  if (highlights.length === 0) {
    return <span className="text-slate-800 leading-relaxed">{text}</span>;
  }

  const sorted = [...highlights].sort((a, b) => a.startIndex - b.startIndex);
  const segments: React.ReactNode[] = [];
  let cursor = 0;

  sorted.forEach((token, idx) => {
    if (token.startIndex > cursor) {
      segments.push(
        <span key={`plain-${idx}`}>{text.slice(cursor, token.startIndex)}</span>
      );
    }
    const isSelected =
      selectedToken &&
      selectedToken.startIndex === token.startIndex &&
      selectedToken.endIndex === token.endIndex;
    const isHigh = token.weight >= 0.8;

    segments.push(
      <button
        key={`tok-${idx}`}
        type="button"
        onClick={() => onSelectToken?.(token)}
        title={`${token.normalized} (${token.language}): ${token.gloss}`}
        className={`inline px-1 py-0.5 mx-0.5 rounded font-medium underline decoration-2 underline-offset-2 transition-colors cursor-pointer ${
          isHigh
            ? 'bg-red-50 text-red-900 decoration-red-500 hover:bg-red-100'
            : 'bg-amber-50 text-amber-900 decoration-amber-500 hover:bg-amber-100'
        } ${isSelected ? 'ring-2 ring-slate-900' : ''}`}
      >
        {text.slice(token.startIndex, token.endIndex)}
      </button>
    );
    cursor = token.endIndex;
  });

  if (cursor < text.length) {
    segments.push(<span key="tail">{text.slice(cursor)}</span>);
  }

  return <p className="text-base leading-relaxed text-slate-900">{segments}</p>;
}
