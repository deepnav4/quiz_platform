import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuiz } from '../hooks/useQuiz.js';
import { createQuestion, updateQuestion, deleteQuestion } from '../api/question.js';
import { createSession } from '../api/session.js';

export default function EditQuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { quiz, loading, error, refetch } = useQuiz(quizId);

  const [newQ, setNewQ] = useState({ text: '', questionType: 'MULTIPLE_CHOICE_SINGLE', points: 100, hasTimeLimit: false, timeLimitSeconds: 30, options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] });
  const [addError, setAddError] = useState('');
  const [showForm, setShowForm] = useState(false);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!quiz) return <div>Quiz not found</div>;

  function updateOption(i, field, value) {
    const opts = [...newQ.options];
    opts[i] = { ...opts[i], [field]: value };
    setNewQ({ ...newQ, options: opts });
  }

  async function handleAddQuestion(e) {
    e.preventDefault();
    setAddError('');
    try {
      await createQuestion(quizId, newQ);
      setNewQ({ text: '', questionType: 'MULTIPLE_CHOICE_SINGLE', points: 100, hasTimeLimit: false, timeLimitSeconds: 30, options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] });
      setShowForm(false);
      refetch();
    } catch (err) { setAddError(err.message); }
  }

  async function handleDeleteQuestion(qId) {
    if (!confirm('Delete this question?')) return;
    await deleteQuestion(quizId, qId);
    refetch();
  }

  async function handleCreateSession() {
    try {
      const data = await createSession({ quizId });
      navigate(`/session/${data.session.id}/waiting`);
    } catch (err) { alert(err.message); }
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <h1>Edit: {quiz.title}</h1>
      {quiz.description && <p>{quiz.description}</p>}

      <button onClick={handleCreateSession} style={{ padding: '8px 16px', marginBottom: 20, background: '#4CAF50', color: '#fff', border: 'none', cursor: 'pointer' }}>
        Start Live Session
      </button>

      <h2>Questions ({quiz.questions?.length || 0})</h2>

      {quiz.questions?.map((q, i) => (
        <div key={q.id} style={{ border: '1px solid #ddd', padding: 12, marginBottom: 8, borderRadius: 4 }}>
          <strong>Q{i + 1}.</strong> {q.text} <small>({q.questionType}, {q.points}pts)</small>
          {q.hasTimeLimit && <small> ⏱ {q.timeLimitSeconds}s</small>}
          <ul style={{ margin: '6px 0' }}>
            {q.options?.map(o => (
              <li key={o.id} style={{ color: o.isCorrect ? 'green' : 'inherit' }}>
                {o.text} {o.isCorrect && '✓'}
              </li>
            ))}
          </ul>
          <button onClick={() => handleDeleteQuestion(q.id)} style={{ color: 'red', fontSize: 12 }}>Delete</button>
        </div>
      ))}

      {!showForm ? (
        <button onClick={() => setShowForm(true)} style={{ padding: '8px 16px', marginTop: 10 }}>+ Add Question</button>
      ) : (
        <form onSubmit={handleAddQuestion} style={{ border: '2px solid #007bff', padding: 16, borderRadius: 4, marginTop: 10 }}>
          <h3>New Question</h3>
          {addError && <p style={{ color: 'red' }}>{addError}</p>}
          <div style={{ marginBottom: 8 }}>
            <label>Type:
              <select value={newQ.questionType} onChange={e => setNewQ({ ...newQ, questionType: e.target.value })} style={{ marginLeft: 8 }}>
                <option value="MULTIPLE_CHOICE_SINGLE">Multiple Choice (Single)</option>
                <option value="MULTIPLE_CHOICE_MULTI">Multiple Choice (Multi)</option>
                <option value="TRUE_FALSE">True/False</option>
              </select>
            </label>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Question Text<br/>
              <input type="text" value={newQ.text} onChange={e => setNewQ({ ...newQ, text: e.target.value })} required style={{ width: '100%', padding: 8 }} />
            </label>
          </div>
          <div style={{ marginBottom: 8 }}>
            <label>Points: <input type="number" value={newQ.points} onChange={e => setNewQ({ ...newQ, points: parseInt(e.target.value) || 100 })} style={{ width: 60, padding: 4 }} /></label>
            <label style={{ marginLeft: 12 }}>
              <input type="checkbox" checked={newQ.hasTimeLimit} onChange={e => setNewQ({ ...newQ, hasTimeLimit: e.target.checked })} /> Time limit
            </label>
            {newQ.hasTimeLimit && <input type="number" value={newQ.timeLimitSeconds} onChange={e => setNewQ({ ...newQ, timeLimitSeconds: parseInt(e.target.value) || 30 })} style={{ width: 50, marginLeft: 4, padding: 4 }} />}
          </div>

          <h4>Options</h4>
          {newQ.options.map((o, i) => (
            <div key={i} style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="text" placeholder={`Option ${i + 1}`} value={o.text} onChange={e => updateOption(i, 'text', e.target.value)} required style={{ flex: 1, padding: 6 }} />
              <label><input type="checkbox" checked={o.isCorrect} onChange={e => updateOption(i, 'isCorrect', e.target.checked)} /> Correct</label>
              {newQ.options.length > 2 && <button type="button" onClick={() => setNewQ({ ...newQ, options: newQ.options.filter((_, j) => j !== i) })} style={{ color: 'red' }}>×</button>}
            </div>
          ))}
          <button type="button" onClick={() => setNewQ({ ...newQ, options: [...newQ.options, { text: '', isCorrect: false }] })} style={{ marginBottom: 10, fontSize: 12 }}>+ Add Option</button>
          <br/>
          <button type="submit" style={{ padding: '8px 16px', marginRight: 8 }}>Save Question</button>
          <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
        </form>
      )}
    </div>
  );
}
