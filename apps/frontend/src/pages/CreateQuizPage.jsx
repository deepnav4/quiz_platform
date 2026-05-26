import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createQuiz } from '../api/quiz.js';

export default function CreateQuizPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await createQuiz({ title, description });
      navigate(`/quiz/${data.quiz.id}/edit`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: '40px auto' }}>
      <h1>Create Quiz</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 10 }}>
          <label>Title<br/><input type="text" value={title} onChange={e => setTitle(e.target.value)} required style={{ width: '100%', padding: 8 }} /></label>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Description<br/><textarea value={description} onChange={e => setDescription(e.target.value)} style={{ width: '100%', padding: 8 }} rows={3} /></label>
        </div>
        <button type="submit" style={{ padding: '8px 20px' }}>Create & Edit Questions</button>
      </form>
    </div>
  );
}
