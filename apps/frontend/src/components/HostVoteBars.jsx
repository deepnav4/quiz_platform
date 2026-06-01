import OptionVoteChips from './OptionVoteChips.jsx';

const BAR_COLORS = [
  'bg-menti-brand',
  'bg-violet-500',
  'bg-amber-500',
  'bg-teal-500',
  'bg-rose-500',
  'bg-indigo-500',
];

/**
 * Host-only live vote bars (% + count). Correct/incorrect styling when revealed.
 */
export default function HostVoteBars({
  options = [],
  totalVotes = 0,
  revealed = false,
  votesByOption = {},
}) {
  if (!options.length) return null;

  return (
    <div className="flex flex-col gap-4">
      {options.map((opt, i) => {
        const count = opt.count ?? 0;
        const percent = opt.percent ?? 0;
        const isCorrect = revealed && opt.isCorrect === true;
        const isWrongOption = revealed && opt.isCorrect === false && count > 0;
        const barColor = BAR_COLORS[i % BAR_COLORS.length];
        const voters = votesByOption[opt.id] || opt.voters || [];

        return (
          <div
            key={opt.id}
            className={`rounded-xl p-4 transition-all duration-500 ${
              isCorrect
                ? 'bg-green-50 border-2 border-menti-positive'
                : isWrongOption
                  ? 'bg-red-50/40 border border-menti-coral/30'
                  : 'bg-menti-surface-sunken border border-transparent'
            }`}
          >
            <div className="flex items-start gap-2 mb-2">
              <span className="inline-flex w-7 h-7 shrink-0 items-center justify-center rounded-full bg-menti-brand-weakest text-menti-brand text-xs font-bold">
                {String.fromCharCode(65 + i)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2 items-start">
                  <p className="font-body text-sm font-semibold text-menti-text-primary">
                    {opt.text}
                    {isCorrect && (
                      <span className="ml-2 text-menti-positive text-xs font-bold">✓ Correct</span>
                    )}
                  </p>
                  <span className="font-body text-xs text-menti-text-weak shrink-0">
                    {count} vote{count !== 1 ? 's' : ''} · {percent}%
                  </span>
                </div>
              </div>
            </div>

            <div className="h-3 bg-menti-border-weak rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
                style={{ width: `${Math.max(percent, count > 0 ? 4 : 0)}%` }}
              />
            </div>

            <OptionVoteChips voters={voters} />
          </div>
        );
      })}
      {totalVotes === 0 && (
        <p className="font-body text-xs text-menti-text-weak text-center py-2">Waiting for answers…</p>
      )}
    </div>
  );
}
