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
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setError('');
    setLoading(true);
    try {
      const data = await createQuiz({ title: title.trim(), description: description.trim(), isAIGenerated: isAI, adaptiveDifficulty: isAdaptive });
      navigate(`/quiz/${data.quiz?.id || data.id}/edit`);
    } catch (err) {
      setError(err.message || 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  const Toggle = ({ checked, onChange, label }) => (
    <div className="flex items-center justify-between py-3">
      <span className="font-body text-sm text-menti-text-primary">{label}</span>
      <button type="button" onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full relative transition-colors duration-300 cursor-pointer ${checked ? 'bg-menti-brand' : 'bg-menti-border'}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 bg-menti-bg min-h-[80vh]">
      <h1 className="font-heading font-semibold text-2xl sm:text-3xl text-menti-text mb-8">Create New Quiz</h1>

      <div className="bg-menti-surface rounded-2xl p-6 sm:p-8 shadow-sm border border-menti-border-weak">
        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-50 border border-menti-coral/20">
            <p className="font-body text-sm text-menti-coral">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="font-body font-semibold text-sm text-menti-text-primary block mb-1.5">Quiz Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. JavaScript Fundamentals"
              className="w-full px-4 py-3 rounded-xl bg-menti-surface-sunken border border-menti-border-weak focus:border-menti-brand focus:ring-2 focus:ring-menti-brand-weakest outline-none transition-all duration-200 font-body text-sm" />
          </div>

          <div>
            <label className="font-body font-semibold text-sm text-menti-text-primary block mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of your quiz..." rows={3}
              className="w-full px-4 py-3 rounded-xl bg-menti-surface-sunken border border-menti-border-weak focus:border-menti-brand focus:ring-2 focus:ring-menti-brand-weakest outline-none transition-all duration-200 font-body text-sm resize-none" />
          </div>

          <div className="border-t border-menti-border-weak pt-4 mt-2">
            <Toggle checked={isAI} onChange={setIsAI} label="✨ AI Generated Quiz" />
            <Toggle checked={isAdaptive} onChange={setIsAdaptive} label="📈 Adaptive Difficulty" />
          </div>

          <div className="flex gap-3 mt-4">
            <button type="button" onClick={() => navigate(-1)}
              className="flex-1 py-3 rounded-full border border-menti-border font-body font-semibold text-sm text-menti-text-primary hover:bg-menti-surface-sunken transition-colors duration-200 cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-full bg-menti-brand text-white font-body font-semibold text-sm hover:bg-menti-brand-hover transition-colors duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? 'Creating...' : 'Create Quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
