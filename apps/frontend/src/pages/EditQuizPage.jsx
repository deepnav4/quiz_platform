import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getQuiz, updateQuiz } from '../api/quiz.js';
import { createSession } from '../api/session.js';

const QUESTION_TYPES = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'OPEN_ENDED'];

export default function EditQuizPage() {
  const { quizId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTitle, setEditingTitle] = useState('');
  const [editingDesc, setEditingDesc] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  /* New question form state */
  const [newQ, setNewQ] = useState({ text: '', type: 'MULTIPLE_CHOICE', options: ['', ''], correctIndex: 0, timeLimit: 30, points: 10 });

  useEffect(() => {
    if (!authLoading && !user) navigate('/login');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user || !quizId) return;
    setLoading(true);
    getQuiz(quizId)
      .then(data => {
        const q = data.quiz || data;
        setQuiz(q);
        setEditingTitle(q.title || '');
        setEditingDesc(q.description || '');
        setQuestions(q.questions || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [user, quizId]);

  const handleSaveDetails = async () => {
    try {
      await updateQuiz(quizId, { title: editingTitle, description: editingDesc });
      setQuiz(prev => ({ ...prev, title: editingTitle, description: editingDesc }));
    } catch (err) { setError(err.message); }
  };

  const handleAddQuestion = () => {
    if (!newQ.text.trim()) return;
    const question = {
      id: Date.now().toString(),
      text: newQ.text,
      type: newQ.type,
      options: newQ.type === 'OPEN_ENDED' ? [] : newQ.options.filter(o => o.trim()),
      correctOptionIndex: newQ.correctIndex,
      timeLimit: newQ.timeLimit,
      points: newQ.points,
    };
    setQuestions(prev => [...prev, question]);
    setNewQ({ text: '', type: 'MULTIPLE_CHOICE', options: ['', ''], correctIndex: 0, timeLimit: 30, points: 10 });
    setShowAddForm(false);
  };

  const handleDeleteQuestion = (id) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const handleStartSession = async () => {
    try {
      const data = await createSession({ quizId });
      navigate(`/session/${data.session?.id || data.id}/waiting`);
    } catch (err) { setError(err.message); }
  };

  const inputCls = "w-full px-4 py-3 rounded-xl bg-menti-surface-sunken border border-menti-border-weak focus:border-menti-brand focus:ring-2 focus:ring-menti-brand-weakest outline-none transition-all duration-200 font-body text-sm";

  if (loading) return (
    <div className="min-h-[80vh] flex items-center justify-center bg-menti-bg">
      <div className="w-8 h-8 border-3 border-menti-border border-t-menti-brand rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 bg-menti-bg min-h-[80vh]">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="font-heading font-semibold text-2xl sm:text-3xl text-menti-text line-clamp-1">{quiz?.title || 'Edit Quiz'}</h1>
        <button onClick={handleStartSession}
          className="inline-flex items-center gap-2 bg-menti-brand text-white px-6 py-3 rounded-full font-body font-semibold text-sm hover:bg-menti-brand-hover transition-colors duration-200 cursor-pointer self-start">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Start Live Session
        </button>
      </div>

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-50 border border-menti-coral/20">
          <p className="font-body text-sm text-menti-coral">{error}</p>
        </div>
      )}

      {/* Quiz Details Card */}
      <div className="bg-menti-surface rounded-2xl p-6 border border-menti-border-weak mb-8">
        <h2 className="font-heading font-semibold text-lg text-menti-text mb-4">Quiz Details</h2>
        <div className="flex flex-col gap-4">
          <input type="text" value={editingTitle} onChange={e => setEditingTitle(e.target.value)} placeholder="Quiz title" className={inputCls} />
          <textarea value={editingDesc} onChange={e => setEditingDesc(e.target.value)} placeholder="Description" rows={2} className={`${inputCls} resize-none`} />
          <button onClick={handleSaveDetails} className="self-start bg-menti-brand text-white px-6 py-2.5 rounded-full font-body font-semibold text-sm hover:bg-menti-brand-hover transition-colors duration-200 cursor-pointer">
            Save Changes
          </button>
        </div>
      </div>

      {/* Questions */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-semibold text-lg text-menti-text">Questions ({questions.length})</h2>
      </div>

      {questions.map((q, i) => (
        <div key={q.id} className="bg-menti-surface rounded-2xl p-6 border border-menti-border-weak mb-4 transition-shadow duration-300 hover:shadow-sm">
          <div className="flex items-start gap-3">
            <span className="w-8 h-8 rounded-full bg-menti-brand text-white flex items-center justify-center font-body font-semibold text-sm flex-shrink-0">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <h3 className="font-body font-semibold text-base text-menti-text">{q.text}</h3>
                <span className="rounded-full px-3 py-0.5 text-xs bg-menti-brand-weakest text-menti-brand font-body font-semibold">{q.type?.replace('_', ' ')}</span>
              </div>
              {q.options && q.options.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1.5">
                  {q.options.map((opt, oi) => (
                    <li key={oi} className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm font-body ${oi === q.correctOptionIndex ? 'bg-green-50 border border-menti-positive/30 text-menti-positive font-semibold' : 'bg-menti-surface-sunken text-menti-text-primary'}`}>
                      <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${oi === q.correctOptionIndex ? 'border-menti-positive bg-menti-positive' : 'border-menti-border'}`}>
                        {oi === q.correctOptionIndex && <svg viewBox="0 0 16 16" fill="white" className="w-full h-full p-0.5"><polyline points="3 8 6.5 11.5 13 5" fill="none" stroke="white" strokeWidth="2"/></svg>}
                      </span>
                      {typeof opt === 'string' ? opt : opt.text || `Option ${oi + 1}`}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-3 mt-3">
                <span className="text-xs text-menti-text-weaker font-body">⏱ {q.timeLimit || 30}s</span>
                <span className="text-xs text-menti-text-weaker font-body">⭐ {q.points || 10} pts</span>
              </div>
            </div>
            <button onClick={() => handleDeleteQuestion(q.id)} className="text-sm text-menti-text-weaker hover:text-menti-coral transition-colors duration-200 cursor-pointer p-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          </div>
        </div>
      ))}

      {/* Add Question */}
      {!showAddForm ? (
        <button onClick={() => setShowAddForm(true)}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-menti-brand-weak text-menti-brand font-body font-semibold text-sm hover:bg-menti-brand-weakest/50 transition-colors duration-200 cursor-pointer">
          + Add Question
        </button>
      ) : (
        <div className="bg-menti-surface rounded-2xl p-6 border-2 border-menti-brand-weak">
          <h3 className="font-heading font-semibold text-base text-menti-text mb-4">New Question</h3>
          <div className="flex flex-col gap-4">
            <select value={newQ.type} onChange={e => setNewQ(p => ({ ...p, type: e.target.value }))}
              className={`${inputCls} cursor-pointer`}>
              {QUESTION_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
            <textarea value={newQ.text} onChange={e => setNewQ(p => ({ ...p, text: e.target.value }))} placeholder="Question text..." rows={2} className={`${inputCls} resize-none`} />

            {newQ.type !== 'OPEN_ENDED' && newQ.type !== 'TRUE_FALSE' && (
              <div>
                <label className="font-body font-semibold text-sm text-menti-text-primary block mb-2">Options</label>
                {newQ.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <button type="button" onClick={() => setNewQ(p => ({ ...p, correctIndex: i }))}
                      className={`w-5 h-5 rounded-full border-2 flex-shrink-0 cursor-pointer transition-colors duration-200 ${i === newQ.correctIndex ? 'border-menti-positive bg-menti-positive' : 'border-menti-border hover:border-menti-brand'}`} />
                    <input type="text" value={opt} onChange={e => { const opts = [...newQ.options]; opts[i] = e.target.value; setNewQ(p => ({ ...p, options: opts })); }}
                      placeholder={`Option ${i + 1}`} className={`${inputCls} flex-1`} />
                    {newQ.options.length > 2 && (
                      <button type="button" onClick={() => setNewQ(p => ({ ...p, options: p.options.filter((_, j) => j !== i) }))}
                        className="text-menti-text-weaker hover:text-menti-coral cursor-pointer p-1">✕</button>
                    )}
                  </div>
                ))}
                {newQ.options.length < 6 && (
                  <button type="button" onClick={() => setNewQ(p => ({ ...p, options: [...p.options, ''] }))}
                    className="text-sm text-menti-brand font-body font-semibold hover:underline cursor-pointer mt-1">+ Add option</button>
                )}
              </div>
            )}

            <div className="flex gap-4">
              <div className="flex-1">
                <label className="font-body font-semibold text-xs text-menti-text-weak block mb-1">Time (sec)</label>
                <input type="number" value={newQ.timeLimit} onChange={e => setNewQ(p => ({ ...p, timeLimit: Number(e.target.value) }))} min={5} max={120} className={inputCls} />
              </div>
              <div className="flex-1">
                <label className="font-body font-semibold text-xs text-menti-text-weak block mb-1">Points</label>
                <input type="number" value={newQ.points} onChange={e => setNewQ(p => ({ ...p, points: Number(e.target.value) }))} min={1} max={100} className={inputCls} />
              </div>
            </div>

            <div className="flex gap-3 mt-2">
              <button type="button" onClick={() => setShowAddForm(false)}
                className="flex-1 py-2.5 rounded-full border border-menti-border font-body font-semibold text-sm text-menti-text-primary hover:bg-menti-surface-sunken transition-colors duration-200 cursor-pointer">Cancel</button>
              <button type="button" onClick={handleAddQuestion}
                className="flex-1 py-2.5 rounded-full bg-menti-brand text-white font-body font-semibold text-sm hover:bg-menti-brand-hover transition-colors duration-200 cursor-pointer">Add Question</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
