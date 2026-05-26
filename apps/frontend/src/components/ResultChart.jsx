export default function ResultChart({ result }) {
  if (!result) return null;

  const optionEntries = result.resultData ? Object.entries(result.resultData) : [];

  return (
    <div style={{ padding: 12, border: '1px solid #ddd', borderRadius: 4 }}>
      <p><strong>{result.question?.text || 'Question'}</strong></p>
      <p>{result.correctResponses}/{result.totalResponses} correct ({Math.round(result.correctionRate)}%)</p>
      {optionEntries.length > 0 && (
        <div>
          {optionEntries.map(([id, opt]) => {
            const pct = result.totalResponses > 0 ? Math.round((opt.count / result.totalResponses) * 100) : 0;
            return (
              <div key={id} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: opt.isCorrect ? 'green' : 'inherit' }}>{opt.text} {opt.isCorrect && '✓'}</span>
                  <span>{opt.count} ({pct}%)</span>
                </div>
                <div style={{ background: '#eee', borderRadius: 4, height: 12 }}>
                  <div style={{ background: opt.isCorrect ? '#4CAF50' : '#2196F3', width: `${pct}%`, height: '100%', borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
