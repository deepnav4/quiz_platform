import { useState } from 'react';

/**
 * Participant names who picked a specific option.
 * Names are hidden by default and revealed on hover/click of the bar area.
 * Includes a subtle tooltip-style reveal with pop-in animation.
 */
export default function OptionVoteChips({ voters = [], barColor = '#5769E7' }) {
  const [expanded, setExpanded] = useState(false);

  if (!voters.length) return null;

  return (
    <div
      className="relative mt-2"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Collapsed: show count hint */}
      {!expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-body font-semibold transition-all duration-200 cursor-pointer hover:shadow-sm"
          style={{ backgroundColor: `${barColor}15`, color: barColor }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          {voters.length} voter{voters.length !== 1 ? 's' : ''} — hover to see
        </button>
      )}

      {/* Expanded: show all voter chips */}
      {expanded && (
        <div className="flex flex-wrap gap-1.5 animate-fade-in-up">
          {voters.map((v, i) => (
            <span
              key={v.userId || i}
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-body font-semibold shadow-sm transition-all duration-300"
              style={{
                backgroundColor: `${barColor}18`,
                color: barColor,
                animationDelay: `${i * 40}ms`,
              }}
            >
              {/* Avatar circle with first letter */}
              <span
                className="inline-flex w-4.5 h-4.5 items-center justify-center rounded-full text-[9px] font-bold text-white shrink-0"
                style={{ backgroundColor: barColor, width: '18px', height: '18px' }}
              >
                {(v.name || '?').charAt(0).toUpperCase()}
              </span>
              {v.name || 'Player'}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
