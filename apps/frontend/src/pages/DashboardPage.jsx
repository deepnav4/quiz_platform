import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getQuizzes, deleteQuiz } from '../api/quiz.js';
import { createSession } from '../api/session.js';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getQuizzes()
      .then(data => setQuizzes(data.quizzes || data || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this quiz? This cannot be undone.')) return;
    try {
      await deleteQuiz(id);
      setQuizzes(prev => prev.filter(q => q.id !== id));
    } catch (err) { setError(err.message); }
  };

  const handleStartSession = async (quizId) => {
    try {
      const data = await createSession({ quizId });
      navigate(`/session/${data.session?.id || data.id}/waiting`);
    } catch (err) { setError(err.message); }
  };

  if (authLoading) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-menti-border border-t-menti-brand rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8 sm:py-12 bg-menti-bg min-h-[80vh]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading font-semibold text-2xl sm:text-3xl text-menti-text">My Quizzes</h1>
          <p className="font-body text-sm text-menti-text-weak mt-1">Manage and launch your interactive quizzes</p>
        </div>
        <Link to="/quiz/create" className="inline-flex items-center gap-2 bg-menti-brand text-white px-6 py-3 rounded-full font-body font-semibold text-sm hover:bg-menti-brand-hover transition-colors duration-200 self-start">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create Quiz
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-50 border border-menti-coral/20">
          <p className="font-body text-sm text-menti-coral">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-menti-border border-t-menti-brand rounded-full animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && quizzes.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📝</div>
          <h2 className="font-heading font-semibold text-xl text-menti-text mb-2">No quizzes yet</h2>
          <p className="font-body text-sm text-menti-text-weak mb-6">Create your first quiz and start engaging your audience!</p>
          <Link to="/quiz/create" className="inline-block bg-menti-brand text-white px-8 py-3 rounded-full font-body font-semibold text-sm hover:bg-menti-brand-hover transition-colors duration-200">
            Create your first quiz
          </Link>
        </div>
      )}

      {/* Quiz Grid */}
      {!loading && quizzes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map(quiz => (
            <article key={quiz.id} className="bg-menti-surface rounded-2xl p-6 border border-menti-border-weak hover:shadow-lg transition-shadow duration-300 flex flex-col">
              <h3 className="font-heading font-semibold text-lg text-menti-text mb-1 line-clamp-1">{quiz.title}</h3>
              <p className="font-body text-sm text-menti-text-weak mb-4 line-clamp-2 flex-1">{quiz.description || 'No description'}</p>
              <div className="flex gap-2 flex-wrap mb-4">
                <span className="bg-menti-brand-weakest text-menti-brand rounded-full px-3 py-1 text-xs font-body font-semibold">
                  {quiz.questions?.length || 0} questions
                </span>
                {quiz.isAIGenerated && (
                  <span className="bg-violet-50 text-violet-600 rounded-full px-3 py-1 text-xs font-body font-semibold">AI Generated</span>
                )}
              </div>
              <div className="flex gap-2 pt-3 border-t border-menti-border-weak">
                <Link to={`/quiz/${quiz.id}/edit`} className="border border-menti-border rounded-full px-4 py-2 font-body text-sm text-menti-text-primary hover:bg-menti-surface-sunken transition-colors duration-200">Edit</Link>
                <button onClick={() => handleStartSession(quiz.id)} className="bg-menti-brand text-white rounded-full px-4 py-2 font-body text-sm font-semibold hover:bg-menti-brand-hover transition-colors duration-200 cursor-pointer">Start</button>
                <button onClick={() => handleDelete(quiz.id)} className="ml-auto font-body text-sm text-menti-coral hover:text-red-600 transition-colors duration-200 cursor-pointer">Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
