import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { getQuiz, updateQuiz } from '../api/quiz.js';
import { createQuestion, updateQuestion, deleteQuestion } from '../api/question.js';
import { createSession } from '../api/session.js';

const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'true_false', label: 'True / False' },
  { value: 'short_answer', label: 'Short Answer' },
];

const DEFAULT_OPTION = { text: '', isCorrect: false };

export default function EditQuizPage() {
  const { user, loading: authLoading } = useAuth();
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Add question form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newType, setNewType] = useState('multiple_choice');
  const [newText, setNewText] = useState('');
  const [newOptions, setNewOptions] = useState([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);
  const [newTimeLimit, setNewTimeLimit] = useState(30);
  const [newPoints, setNewPoints] = useState(100);
  const [addingQuestion, setAddingQuestion] = useState(false);

  // Edit question state
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editOptions, setEditOptions] = useState([]);
  const [editTimeLimit, setEditTimeLimit] = useState(30);
  const [editPoints, setEditPoints] = useState(100);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    fetchQuiz();
  }, [quizId, user]);

  async function fetchQuiz() {
    setLoading(true);
    try {
      const data = await getQuiz(quizId);
      setQuiz(data.quiz);
      setTitle(data.quiz.title || '');
      setDescription(data.quiz.description || '');
      setQuestions(data.quiz.questions || []);
    } catch (err) {
      setError(err.message || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveDetails() {
    setSaving(true);
    setError('');
    try {
      const data = await updateQuiz(quizId, { title, description });
      setQuiz(data.quiz);
    } catch (err) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddQuestion() {
    if (!newText.trim()) return;
    setAddingQuestion(true);
    setError('');
    try {
      const payload = {
        text: newText.trim(),
        type: newType,
        options: newType === 'short_answer' ? [] : newOptions.filter((o) => o.text.trim()),
        timeLimit: newTimeLimit,
        points: newPoints,
      };
      await createQuestion(quizId, payload);
      await fetchQuiz();
      resetAddForm();
    } catch (err) {
      setError(err.message || 'Failed to add question');
    } finally {
      setAddingQuestion(false);
    }
  }

  function resetAddForm() {
    setShowAddForm(false);
    setNewType('multiple_choice');
    setNewText('');
    setNewOptions([
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ]);
    setNewTimeLimit(30);
    setNewPoints(100);
  }

  function startEdit(q) {
    setEditingId(q._id);
    setEditText(q.text);
    setEditOptions(q.options ? q.options.map((o) => ({ ...o })) : []);
    setEditTimeLimit(q.timeLimit || 30);
    setEditPoints(q.points || 100);
  }

  async function handleSaveEdit() {
    if (!editText.trim()) return;
    setError('');
    try {
      await updateQuestion(quizId, editingId, {
        text: editText.trim(),
        options: editOptions.filter((o) => o.text.trim()),
        timeLimit: editTimeLimit,
        points: editPoints,
      });
      setEditingId(null);
      await fetchQuiz();
    } catch (err) {
      setError(err.message || 'Failed to update question');
    }
  }

  async function handleDeleteQuestion(questionId) {
    if (!window.confirm('Delete this question?')) return;
    setError('');
    try {
      await deleteQuestion(quizId, questionId);
      await fetchQuiz();
    } catch (err) {
      setError(err.message || 'Failed to delete question');
    }
  }

  async function handleStartSession() {
    setError('');
    try {
      const data = await createSession({ quizId });
      navigate(`/session/${data.session._id}/waiting`);
    } catch (err) {
      setError(err.message || 'Failed to start session');
    }
  }

  // Option helpers for new question
  function updateNewOption(index, field, value) {
    setNewOptions((prev) =>
      prev.map((o, i) => {
        if (i !== index) {
          return field === 'isCorrect' && value ? { ...o, isCorrect: false } : o;
        }
        return { ...o, [field]: value };
      })
    );
  }

  function addNewOption() {
    setNewOptions((prev) => [...prev, { ...DEFAULT_OPTION }]);
  }

  function removeNewOption(index) {
    setNewOptions((prev) => prev.filter((_, i) => i !== index));
  }

  // Option helpers for editing
  function updateEditOption(index, field, value) {
    setEditOptions((prev) =>
      prev.map((o, i) => {
        if (i !== index) {
          return field === 'isCorrect' && value ? { ...o, isCorrect: false } : o;
        }
        return { ...o, [field]: value };
      })
    );
  }

  function addEditOption() {
    setEditOptions((prev) => [...prev, { ...DEFAULT_OPTION }]);
  }

  function removeEditOption(index) {
    setEditOptions((prev) => prev.filter((_, i) => i !== index));
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-menti-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (!quiz) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-6">
        <p className="font-body text-menti-text-weak text-center">Quiz not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h1 className="font-heading font-semibold text-2xl text-menti-text-primary">
          {quiz.title}
        </h1>
        <button
          onClick={handleStartSession}
          className="bg-menti-brand text-white rounded-full px-6 py-3 font-body font-semibold hover:bg-menti-brand-hover transition-colors cursor-pointer whitespace-nowrap"
        >
          Start Live Session
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-menti-coral font-body text-sm">
          {error}
        </div>
      )}

      {/* Quiz details card */}
      <div className="bg-menti-surface rounded-2xl p-6 border border-menti-border-weak mb-8">
        <div className="mb-4">
          <label className="block font-body font-semibold text-sm mb-1.5 text-menti-text-primary">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-menti-surface-sunken border border-menti-border-weak focus:border-menti-brand outline-none font-body text-menti-text transition-colors"
          />
        </div>
        <div className="mb-4">
          <label className="block font-body font-semibold text-sm mb-1.5 text-menti-text-primary">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-menti-surface-sunken border border-menti-border-weak focus:border-menti-brand outline-none font-body text-menti-text h-20 resize-none transition-colors"
          />
        </div>
        <button
          onClick={handleSaveDetails}
          disabled={saving}
          className="bg-menti-brand text-white rounded-full px-6 py-2.5 font-body font-semibold text-sm hover:bg-menti-brand-hover transition-colors disabled:opacity-60 cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save Details'}
        </button>
      </div>

      {/* Questions section */}
      <h2 className="font-heading font-semibold text-xl mb-4 text-menti-text-primary">
        Questions
      </h2>

      {questions.length === 0 && !showAddForm && (
        <p className="font-body text-menti-text-weak text-sm mb-4">
          No questions yet. Add your first question below.
        </p>
      )}

      {/* Question list */}
      {questions.map((q, idx) => (
        <div
          key={q._id}
          className="bg-menti-surface rounded-2xl p-6 border border-menti-border-weak mb-4"
        >
          {editingId === q._id ? (
            /* Editing mode */
            <div>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-menti-surface-sunken border border-menti-border-weak focus:border-menti-brand outline-none font-body text-menti-text h-20 resize-none transition-colors mb-4"
              />

              {q.type !== 'short_answer' && (
                <div className="space-y-2 mb-4">
                  {editOptions.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateEditOption(oi, 'isCorrect', true)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 cursor-pointer ${
                          opt.isCorrect
                            ? 'border-menti-positive bg-menti-positive'
                            : 'border-menti-border'
                        }`}
                      >
                        {opt.isCorrect && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => updateEditOption(oi, 'text', e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg bg-menti-surface-sunken border border-menti-border-weak focus:border-menti-brand outline-none font-body text-sm transition-colors"
                        placeholder={`Option ${oi + 1}`}
                      />
                      {editOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeEditOption(oi)}
                          className="text-menti-text-weaker hover:text-menti-coral transition-colors cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addEditOption}
                    className="text-sm text-menti-brand font-semibold font-body hover:text-menti-brand-hover transition-colors cursor-pointer"
                  >
                    + Add Option
                  </button>
                </div>
              )}

              <div className="flex items-center gap-4 mb-4">
                <div>
                  <label className="block font-body text-xs text-menti-text-weak mb-1">Time (s)</label>
                  <input
                    type="number"
                    value={editTimeLimit}
                    onChange={(e) => setEditTimeLimit(Number(e.target.value))}
                    className="w-20 px-3 py-2 rounded-lg bg-menti-surface-sunken border border-menti-border-weak focus:border-menti-brand outline-none font-body text-sm"
                    min={5}
                  />
                </div>
                <div>
                  <label className="block font-body text-xs text-menti-text-weak mb-1">Points</label>
                  <input
                    type="number"
                    value={editPoints}
                    onChange={(e) => setEditPoints(Number(e.target.value))}
                    className="w-20 px-3 py-2 rounded-lg bg-menti-surface-sunken border border-menti-border-weak focus:border-menti-brand outline-none font-body text-sm"
                    min={0}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="bg-menti-brand text-white rounded-full px-5 py-2 font-body font-semibold text-sm hover:bg-menti-brand-hover transition-colors cursor-pointer"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="border border-menti-border rounded-full px-5 py-2 font-body font-semibold text-sm text-menti-text-primary hover:bg-menti-surface-sunken transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Display mode */
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="w-8 h-8 rounded-full bg-menti-brand text-white flex items-center justify-center font-body font-semibold text-sm flex-shrink-0">
                  {idx + 1}
                </span>
                <span className="font-body font-semibold text-menti-text-primary flex-1 min-w-0">
                  {q.text}
                </span>
                <span className="rounded-full px-3 py-1 text-xs bg-menti-brand-weakest text-menti-brand font-semibold whitespace-nowrap">
                  {QUESTION_TYPES.find((t) => t.value === q.type)?.label || q.type}
                </span>
              </div>

              {/* Options display */}
              {q.options && q.options.length > 0 && (
                <ul className="mt-4">
                  {q.options.map((opt, oi) => (
                    <li
                      key={oi}
                      className={`flex items-center gap-2 py-2 px-3 rounded-lg mb-1 ${
                        opt.isCorrect
                          ? 'bg-green-50 border border-menti-positive/30'
                          : 'bg-menti-surface-sunken'
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${
                          opt.isCorrect
                            ? 'border-menti-positive bg-menti-positive'
                            : 'border-menti-border'
                        }`}
                      />
                      <span className="font-body text-sm text-menti-text-primary">{opt.text}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Footer actions */}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => startEdit(q)}
                  className="text-sm text-menti-text-weak hover:text-menti-brand font-body font-semibold transition-colors cursor-pointer"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteQuestion(q._id)}
                  className="text-sm text-menti-text-weak hover:text-menti-coral font-body font-semibold transition-colors cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      ))}

      {/* Add Question */}
      {showAddForm ? (
        <div className="bg-menti-surface rounded-2xl p-6 border-2 border-dashed border-menti-brand-weak mb-4">
          <h3 className="font-heading font-semibold text-lg mb-4 text-menti-text-primary">
            Add Question
          </h3>

          {/* Question type */}
          <div className="mb-4">
            <label className="block font-body font-semibold text-sm mb-1.5 text-menti-text-primary">
              Question Type
            </label>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-menti-surface-sunken border border-menti-border-weak focus:border-menti-brand outline-none font-body text-menti-text transition-colors cursor-pointer"
            >
              {QUESTION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Question text */}
          <div className="mb-4">
            <label className="block font-body font-semibold text-sm mb-1.5 text-menti-text-primary">
              Question
            </label>
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="Type your question..."
              className="w-full px-4 py-3 rounded-xl bg-menti-surface-sunken border border-menti-border-weak focus:border-menti-brand outline-none font-body text-menti-text h-24 resize-none transition-colors"
            />
          </div>

          {/* Options (not for short_answer) */}
          {newType !== 'short_answer' && (
            <div className="mb-4">
              <label className="block font-body font-semibold text-sm mb-1.5 text-menti-text-primary">
                Options
              </label>
              <div className="space-y-2">
                {newOptions.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateNewOption(oi, 'isCorrect', true)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 cursor-pointer ${
                        opt.isCorrect
                          ? 'border-menti-positive bg-menti-positive'
                          : 'border-menti-border'
                      }`}
                    >
                      {opt.isCorrect && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => updateNewOption(oi, 'text', e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg bg-menti-surface-sunken border border-menti-border-weak focus:border-menti-brand outline-none font-body text-sm transition-colors"
                      placeholder={`Option ${oi + 1}`}
                    />
                    {newOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeNewOption(oi)}
                        className="text-menti-text-weaker hover:text-menti-coral transition-colors cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addNewOption}
                  className="text-sm text-menti-brand font-semibold font-body hover:text-menti-brand-hover transition-colors cursor-pointer"
                >
                  + Add Option
                </button>
              </div>
            </div>
          )}

          {/* Time limit + Points */}
          <div className="flex items-center gap-4 mb-6">
            <div>
              <label className="block font-body text-xs text-menti-text-weak mb-1">Time Limit (s)</label>
              <input
                type="number"
                value={newTimeLimit}
                onChange={(e) => setNewTimeLimit(Number(e.target.value))}
                className="w-24 px-3 py-2 rounded-lg bg-menti-surface-sunken border border-menti-border-weak focus:border-menti-brand outline-none font-body text-sm"
                min={5}
              />
            </div>
            <div>
              <label className="block font-body text-xs text-menti-text-weak mb-1">Points</label>
              <input
                type="number"
                value={newPoints}
                onChange={(e) => setNewPoints(Number(e.target.value))}
                className="w-24 px-3 py-2 rounded-lg bg-menti-surface-sunken border border-menti-border-weak focus:border-menti-brand outline-none font-body text-sm"
                min={0}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleAddQuestion}
              disabled={addingQuestion}
              className="bg-menti-brand text-white rounded-full px-6 py-2.5 font-body font-semibold text-sm hover:bg-menti-brand-hover transition-colors disabled:opacity-60 cursor-pointer"
            >
              {addingQuestion ? 'Adding...' : 'Save Question'}
            </button>
            <button
              onClick={resetAddForm}
              className="border border-menti-border rounded-full px-6 py-2.5 font-body font-semibold text-sm text-menti-text-primary hover:bg-menti-surface-sunken transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="w-full py-4 rounded-2xl border-2 border-dashed border-menti-border hover:border-menti-brand-weak bg-menti-surface hover:bg-menti-brand-weakest/30 font-body font-semibold text-menti-text-weak hover:text-menti-brand transition-all cursor-pointer"
        >
          + Add Question
        </button>
      )}
    </div>
  );
}
