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
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchQuizzes();
    }
  }, [user]);

  async function fetchQuizzes() {
    setLoading(true);
    try {
      const data = await getQuizzes();
      setQuizzes(data.quizzes || data || []);
    } catch (err) {
      setError(err.message || 'Failed to load quizzes.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(quizId) {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await deleteQuiz(quizId);
      setQuizzes((prev) => prev.filter((q) => q._id !== quizId));
    } catch (err) {
      setError(err.message || 'Failed to delete quiz.');
    }
  }

  async function handleStartSession(quizId) {
    try {
      const data = await createSession({ quizId });
      const sessionId = data.session?._id || data._id;
      navigate(`/session/${sessionId}/host`);
    } catch (err) {
      setError(err.message || 'Failed to start session.');
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-menti-brand-weakest border-t-menti-brand rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-heading font-semibold text-3xl text-menti-text">
          My Quizzes
        </h1>
        <Link
          to="/quiz/create"
          className="bg-menti-brand text-white px-6 py-3 rounded-full font-body font-semibold hover:bg-menti-brand-hover transition-colors"
        >
          + Create Quiz
        </Link>
      </div>

      {error && (
        <p className="text-menti-coral text-sm mb-4 font-body">{error}</p>
      )}

      {/* Empty State */}
      {quizzes.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl mb-4 block">📝</span>
          <h2 className="font-heading font-semibold text-2xl text-menti-text mb-2">
            No quizzes yet
          </h2>
          <p className="font-body text-menti-text-weak mb-6 max-w-sm mx-auto">
            Create your first quiz and start engaging your audience with interactive questions.
          </p>
          <Link
            to="/quiz/create"
            className="inline-block bg-menti-brand text-white px-6 py-3 rounded-full font-body font-semibold hover:bg-menti-brand-hover transition-colors"
          >
            Create your first quiz
          </Link>
        </div>
      ) : (
        /* Quiz Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz._id}
              className="bg-menti-surface rounded-2xl p-6 border border-menti-border-weak hover:shadow-lg transition-shadow"
            >
              <h3 className="font-heading font-semibold text-lg mb-1 text-menti-text">
                {quiz.title}
              </h3>
              <p className="font-body text-sm text-menti-text-weak mb-4 line-clamp-2">
                {quiz.description || 'No description'}
              </p>

              {/* Stats */}
              <div className="flex gap-4 flex-wrap">
                <span className="bg-menti-brand-weakest text-menti-brand rounded-full px-3 py-1 text-xs font-semibold">
                  {quiz.questions?.length || 0} questions
                </span>
                {quiz.createdAt && (
                  <span className="bg-menti-brand-weakest text-menti-brand rounded-full px-3 py-1 text-xs font-semibold">
                    {new Date(quiz.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-4 flex-wrap">
                <Link
                  to={`/quiz/${quiz._id}/edit`}
                  className="border border-menti-border rounded-full px-4 py-2 text-sm font-body text-menti-text-primary hover:bg-menti-surface-sunken transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleStartSession(quiz._id)}
                  className="bg-menti-brand text-white rounded-full px-4 py-2 text-sm font-body font-semibold hover:bg-menti-brand-hover transition-colors cursor-pointer"
                >
                  Start Session
                </button>
                <button
                  onClick={() => handleDelete(quiz._id)}
                  className="text-menti-coral text-sm font-body px-4 py-2 hover:underline cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
