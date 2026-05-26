import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getQuizzes, deleteQuiz } from '../api/quiz.js';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { navigate('/login'); return; }
    if (user) {
      getQuizzes().then(d => setQuizzes(d.quizzes || [])).catch(console.error).finally(() => setLoading(false));
    }
  }, [user, authLoading]);

  if (authLoading || loading) return <div>Loading...</div>;

  async function handleDelete(id) {
    if (!confirm('Delete this quiz?')) return;
    await deleteQuiz(id);
    setQuizzes(q => q.filter(x => x.id !== id));
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h1>My Quizzes</h1>
      <Link to="/quiz/create"><button style={{ padding: '8px 16px', marginBottom: 20 }}>+ Create Quiz</button></Link>
      {quizzes.length === 0 ? <p>No quizzes yet. Create one!</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {quizzes.map(q => (
            <li key={q.id} style={{ border: '1px solid #ddd', padding: 12, marginBottom: 8, borderRadius: 4 }}>
              <strong>{q.title}</strong> {q.description && <span>— {q.description}</span>}
              <br/>
              <small>{q._count?.questions || 0} questions · {q._count?.sessions || 0} sessions</small>
              <br/>
              <Link to={`/quiz/${q.id}/edit`}><button style={{ marginTop: 6, marginRight: 6 }}>Edit</button></Link>
              <button onClick={() => handleDelete(q.id)} style={{ marginTop: 6, color: 'red' }}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
