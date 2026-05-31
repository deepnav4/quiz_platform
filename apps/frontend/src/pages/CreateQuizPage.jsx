import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { createQuiz } from '../api/quiz.js';

export default function CreateQuizPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAI, setIsAI] = useState(false);
  const [isAdaptive, setIsAdaptive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await createQuiz({
        title: title.trim(),
        description: description.trim(),
        isAIGenerated: isAI,
        isAdaptive,
      });
      navigate(`/quiz/${data.quiz._id}/edit`);
    } catch (err) {
      setError(err.message || 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-menti-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto py-8 px-6">
      <h1 className="font-heading font-semibold text-3xl mb-8 text-menti-text-primary">
        Create New Quiz
      </h1>

      <div className="bg-menti-surface rounded-2xl p-8 shadow-sm border border-menti-border-weak">
        <form onSubmit={handleSubmit}>
          {/* Error */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-menti-coral font-body text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="mb-6">
            <label className="block font-body font-semibold text-sm mb-1.5 text-menti-text-primary">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter quiz title..."
              className="w-full px-4 py-3 rounded-xl bg-menti-surface-sunken border border-menti-border-weak focus:border-menti-brand outline-none font-body text-menti-text transition-colors"
            />
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block font-body font-semibold text-sm mb-1.5 text-menti-text-primary">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your quiz..."
              className="w-full px-4 py-3 rounded-xl bg-menti-surface-sunken border border-menti-border-weak focus:border-menti-brand outline-none font-body text-menti-text h-24 resize-none transition-colors"
            />
          </div>

          {/* Toggles */}
          <div className="space-y-4 mb-2">
            {/* AI Generated Toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsAI(!isAI)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                  isAI ? 'bg-menti-brand' : 'bg-menti-border'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    isAI ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="font-body font-semibold text-sm text-menti-text-primary">
                AI Generated
              </span>
            </div>

            {/* Adaptive Difficulty Toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsAdaptive(!isAdaptive)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                  isAdaptive ? 'bg-menti-brand' : 'bg-menti-border'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    isAdaptive ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className="font-body font-semibold text-sm text-menti-text-primary">
                Adaptive Difficulty
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 mt-8">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="border border-menti-border rounded-full px-8 py-3 font-body font-semibold text-menti-text-primary hover:bg-menti-surface-sunken transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-menti-brand text-white rounded-full px-8 py-3 font-body font-semibold hover:bg-menti-brand-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? 'Creating...' : 'Create Quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
