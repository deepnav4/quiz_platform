/** Full-screen or inline leaderboard — shared by host and participants */
export default function LiveLeaderboard({ leaderboard = [], title = 'Leaderboard', subtitle }) {
  return (
    <div className="animate-fade-in-up">
      <h3 className="font-heading font-semibold text-xl sm:text-2xl text-menti-text text-center mb-1">
        {title}
      </h3>
      {subtitle && (
        <p className="font-body text-sm text-menti-text-weak text-center mb-6">{subtitle}</p>
      )}
      {leaderboard.length === 0 ? (
        <p className="font-body text-sm text-menti-text-weak text-center py-8">No scores yet.</p>
      ) : (
        <ul className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
          {leaderboard.map((entry) => (
            <li
              key={entry.userId}
              className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl transition-all duration-300 animate-fade-in-up ${
                entry.rank <= 3 ? 'bg-menti-brand-weakest' : 'bg-menti-surface-sunken'
              }`}
              style={{ animationDelay: `${Math.min(entry.rank, 8) * 40}ms` }}
            >
              <span
                className={`font-hero text-lg w-8 text-center shrink-0 ${
                  entry.rank === 1
                    ? 'text-yellow-500'
                    : entry.rank === 2
                      ? 'text-gray-400'
                      : entry.rank === 3
                        ? 'text-amber-600'
                        : 'text-menti-text-weak'
                }`}
              >
                #{entry.rank}
              </span>
              <div className="w-9 h-9 rounded-full bg-menti-brand-weakest flex items-center justify-center shrink-0 overflow-hidden">
                {entry.avatar ? (
                  <img src={entry.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-body text-sm font-semibold text-menti-brand">
                    {entry.name?.charAt(0)?.toUpperCase()}
                  </span>
                )}
              </div>
              <p className="flex-1 font-body text-sm font-semibold text-menti-text truncate">
                {entry.name}
              </p>
              <span className="font-hero text-lg text-menti-brand shrink-0">{entry.totalScore}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
