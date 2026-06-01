import OptionVoteChips from './OptionVoteChips.jsx';

const BAR_COLORS = ['#5769E7', '#8B5CF6', '#D97706', '#0D9488', '#E11D48', '#6366F1'];

export default function HostVoteBars({
  options = [],
  totalVotes = 0,
  revealed = false,
  votesByOption = {},
}) {
  if (!options.length) return null;

  return (
    <div className="space-y-3">
      {options.map((opt, i) => {
        const count = opt.count ?? 0;
        const percent =
          opt.percent ?? (totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0);
        const isCorrect = revealed && opt.isCorrect === true;
        const isWrongVoted = revealed && opt.isCorrect === false && count > 0;
        const accent = BAR_COLORS[i % BAR_COLORS.length];
        const fill = isCorrect ? '#3B8552' : isWrongVoted ? '#C74E4C' : accent;
        const voters = votesByOption[opt.id] || opt.voters || [];

        return (
          <div
            key={opt.id || i}
            className={`rounded-xl border p-3 transition-colors ${
              isCorrect
                ? 'border-menti-positive/50 bg-green-50/60'
                : isWrongVoted
                  ? 'border-menti-coral/30 bg-red-50/40'
                  : 'border-menti-border-weak bg-menti-surface-sunken/50'
            }`}
          >
            <div className="flex items-start gap-3 mb-2">
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                style={{ backgroundColor: fill }}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-body text-sm text-menti-text-primary leading-snug">
                  {opt.text}
                  {isCorrect && (
                    <span className="ml-2 text-xs font-semibold text-menti-positive">Correct</span>
                  )}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-heading text-lg font-semibold leading-none text-menti-text">
                  {percent}%
                </p>
                <p className="font-body text-xs text-menti-text-weak">
                  {count} {count === 1 ? 'vote' : 'votes'}
                </p>
              </div>
            </div>

            <div className="h-2 rounded-full bg-menti-border-weak overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${count > 0 ? Math.max(percent, 3) : 0}%`,
                  backgroundColor: fill,
                }}
              />
            </div>

            {voters.length > 0 && (
              <div className="mt-2">
                <OptionVoteChips voters={voters} barColor={fill} />
              </div>
            )}
          </div>
        );
      })}

      {totalVotes === 0 && (
        <p className="py-8 text-center font-body text-sm text-menti-text-weak">
          Waiting for participants to answer…
        </p>
      )}
    </div>
  );
}

export function truncateQuestion(text, max = 52) {
  if (!text) return '';
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}
