import OptionVoteChips from './OptionVoteChips.jsx';

/**
 * Vibrant palette — each option gets a unique color.
 * Used for bar fill, letter badge, and voter chip tinting.
 */
const BAR_COLORS = [
  '#5769E7', // blue
  '#8B5CF6', // violet
  '#F59E0B', // amber
  '#14B8A6', // teal
  '#F43F5E', // rose
  '#6366F1', // indigo
  '#10B981', // emerald
  '#EC4899', // pink
];

/**
 * Host-only live vote bars.
 *  - Colored fill bars that grow in real-time as votes arrive.
 *  - Percentage + vote count displayed.
 *  - On hover, voter names appear (via OptionVoteChips).
 *  - After reveal (timeUp), correct options get green styling + ✓ badge.
 */
export default function HostVoteBars({
  options = [],
  totalVotes = 0,
  revealed = false,
  votesByOption = {},
}) {
  if (!options.length) return null;

  return (
    <div className="flex flex-col gap-5">
      {options.map((opt, i) => {
        const count = opt.count ?? 0;
        const percent =
          opt.percent ?? (totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0);
        const barPct = Math.max(percent, count > 0 ? 6 : 0); // min 6% so there's always a visible sliver
        const isCorrect = revealed && opt.isCorrect === true;
        const isWrongVoted = revealed && opt.isCorrect === false && count > 0;
        const color = BAR_COLORS[i % BAR_COLORS.length];
        const voters = votesByOption[opt.id] || opt.voters || [];

        // Determine bar color based on state
        const fillColor = isCorrect ? '#22C55E' : isWrongVoted ? '#EF4444' : color;
        const bgTint = isCorrect
          ? 'bg-green-50 border-2 border-green-400'
          : isWrongVoted
            ? 'bg-red-50/60 border border-red-300/50'
            : 'bg-[#F7F6F4] border border-[#EBEAE8]';

        return (
          <div
            key={opt.id || i}
            className={`group rounded-xl p-4 transition-all duration-500 hover:shadow-md ${bgTint}`}
          >
            {/* Header row: letter badge + option text + percentage */}
            <div className="flex items-start gap-3 mb-3">
              {/* Letter badge */}
              <span
                className="inline-flex w-8 h-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold shadow-sm"
                style={{ backgroundColor: fillColor }}
              >
                {String.fromCharCode(65 + i)}
              </span>

              {/* Option text */}
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm font-semibold text-[#302E2C] leading-snug">
                  {opt.text}
                  {isCorrect && (
                    <span className="ml-2 inline-flex items-center gap-1 text-green-600 text-xs font-bold">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Correct
                    </span>
                  )}
                  {isWrongVoted && (
                    <span className="ml-2 text-red-400 text-xs font-bold">✕ Wrong</span>
                  )}
                </p>
              </div>

              {/* Percentage + count */}
              <div className="text-right shrink-0">
                <p
                  className="font-hero text-xl leading-none transition-all duration-500"
                  style={{ color: fillColor }}
                >
                  {percent}%
                </p>
                <p className="font-body text-[11px] text-[#888888] mt-0.5">
                  {count} vote{count !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Bar */}
            <div className="relative h-10 rounded-full bg-[#EBEAE8] overflow-hidden shadow-inner">
              <div
                className="absolute inset-y-0 left-0 rounded-full flex items-center justify-end pr-3"
                style={{
                  width: `${barPct}%`,
                  backgroundColor: fillColor,
                  transition: 'width 0.7s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.5s ease',
                  minWidth: count > 0 ? '2rem' : 0,
                }}
              >
                {barPct >= 18 && (
                  <span className="text-white text-xs font-bold font-body drop-shadow-sm">
                    {percent}%
                  </span>
                )}
              </div>
              {barPct < 18 && count > 0 && (
                <span
                  className="absolute inset-y-0 flex items-center text-xs font-bold font-body pl-2"
                  style={{ left: `${barPct}%`, color: fillColor }}
                >
                  {percent}%
                </span>
              )}
            </div>

            {/* Voter names (hover to reveal) */}
            <OptionVoteChips voters={voters} barColor={fillColor} />
          </div>
        );
      })}

      {/* Empty state */}
      {totalVotes === 0 && (
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-2 bg-[#F7F6F4] rounded-full px-5 py-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-body text-sm text-[#888888]">
              Waiting for participants to answer…
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
