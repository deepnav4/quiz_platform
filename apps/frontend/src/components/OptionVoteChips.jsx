/** Compact voter name chips under each option bar */
export default function OptionVoteChips({ voters = [], barColor = '#5769E7' }) {
  if (!voters.length) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {voters.map((v, i) => (
        <span
          key={v.userId || i}
          className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-body font-semibold animate-vote-pop"
          style={{
            backgroundColor: `${barColor}20`,
            color: barColor,
          }}
        >
          {v.name || 'Player'}
        </span>
      ))}
    </div>
  );
}
