import { useState } from 'react';

export default function QuestionEditor({ onSave, onCancel, initial }) {
  const [q, setQ] = useState(initial || {
    text: '', questionType: 'MULTIPLE_CHOICE_SINGLE', points: 100,
    hasTimeLimit: false, timeLimitSeconds: 30,
    options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }],
  });

  function updateOption(i, field, value) {
    const opts = [...q.options];
    opts[i] = { ...opts[i], [field]: value };
    setQ({ ...q, options: opts });
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave(q);
  }

  return (
    <form onSubmit={handleSubmit} style={{ border: '2px solid #007bff', padding: 16, borderRadius: 4 }}>
      <div style={{ marginBottom: 8 }}>
        <select value={q.questionType} onChange={e => setQ({ ...q, questionType: e.target.value })}>
          <option value="MULTIPLE_CHOICE_SINGLE">MC Single</option>
          <option value="MULTIPLE_CHOICE_MULTI">MC Multi</option>
          <option value="TRUE_FALSE">True/False</option>
        </select>
      </div>
      <input type="text" value={q.text} onChange={e => setQ({ ...q, text: e.target.value })} placeholder="Question text" required style={{ width: '100%', padding: 8, marginBottom: 8 }} />
      <div style={{ marginBottom: 8 }}>
        Points: <input type="number" value={q.points} onChange={e => setQ({ ...q, points: +e.target.value })} style={{ width: 60 }} />
        <label style={{ marginLeft: 8 }}><input type="checkbox" checked={q.hasTimeLimit} onChange={e => setQ({ ...q, hasTimeLimit: e.target.checked })} /> Timed</label>
        {q.hasTimeLimit && <input type="number" value={q.timeLimitSeconds} onChange={e => setQ({ ...q, timeLimitSeconds: +e.target.value })} style={{ width: 50, marginLeft: 4 }} />}
      </div>
      {q.options.map((o, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <input type="text" value={o.text} onChange={e => updateOption(i, 'text', e.target.value)} placeholder={`Option ${i + 1}`} required style={{ flex: 1, padding: 6 }} />
          <label><input type="checkbox" checked={o.isCorrect} onChange={e => updateOption(i, 'isCorrect', e.target.checked)} /> ✓</label>
        </div>
      ))}
      <button type="button" onClick={() => setQ({ ...q, options: [...q.options, { text: '', isCorrect: false }] })} style={{ fontSize: 12, marginBottom: 8 }}>+ Option</button>
      <br />
      <button type="submit" style={{ marginRight: 8 }}>Save</button>
      {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
    </form>
  );
}
