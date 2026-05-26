import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getResults, getQuestionResult } from '../api/result.js';

export default function ResultsPage() {
  const { sessionId } = useParams();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    getResults(sessionId)
      .then(d => setResults(d.results || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

  async function viewDetail(questionId) {
    try {
      const d = await getQuestionResult(sessionId, questionId);
      setDetail(d.result);
    } catch (err) { alert(err.message); }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: 600, margin: '20px auto' }}>
      <h1>Results</h1>
      <Link to={`/session/${sessionId}/leaderboard`}><button style={{ marginBottom: 16, padding: '8px 16px' }}>View Leaderboard</button></Link>

      {results.length === 0 ? <p>No results yet.</p> : results.map(r => (
        <div key={r.id || r.questionId} style={{ border: '1px solid #ddd', padding: 12, marginBottom: 8, borderRadius: 4 }}>
          <strong>{r.question?.text || `Question`}</strong>
          <br/>
          <small>
            {r.correctResponses}/{r.totalResponses} correct ({Math.round(r.correctionRate)}%)
          </small>
          <br/>
          <button onClick={() => viewDetail(r.questionId)} style={{ fontSize: 12, marginTop: 4 }}>View Details</button>
        </div>
      ))}

      {detail && (
        <div style={{ marginTop: 20, padding: 16, border: '2px solid #007bff', borderRadius: 6 }}>
          <h3>Question Detail</h3>
          <p>{detail.question?.text}</p>
          <p>{detail.correctResponses}/{detail.totalResponses} correct ({Math.round(detail.correctionRate)}%)</p>
          {detail.resultData && (
            <ul>
              {Object.entries(detail.resultData).map(([id, opt]) => (
                <li key={id} style={{ color: opt.isCorrect ? 'green' : 'inherit' }}>
                  {opt.text}: {opt.count} responses {opt.isCorrect && '✓'}
                </li>
              ))}
            </ul>
          )}
          <button onClick={() => setDetail(null)}>Close</button>
        </div>
      )}
    </div>
  );
}
