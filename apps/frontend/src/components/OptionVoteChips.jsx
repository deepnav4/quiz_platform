/** Names of participants who picked each option — minimal pop-in animation */
export default function OptionVoteChips({ voters = [] }) {
  if (!voters.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {voters.map((v) => (
        <span
          key={v.userId}
          className="inline-flex items-center rounded-full bg-menti-brand/15 text-menti-brand px-2.5 py-0.5 text-xs font-body font-semibold animate-vote-pop"
          title={`${v.name} chose this`}
        >
          {v.name}
        </span>
      ))}
    </div>
  );
}
