import { Link } from 'react-router-dom';

export default function QuizCard({ quiz, onDelete }) {
  return (
    <div style={{ border: '1px solid #ddd', padding: 12, marginBottom: 8, borderRadius: 4 }}>
      <strong>{quiz.title}</strong>
      {quiz.description && <span> — {quiz.description}</span>}
      <br />
      <small>{quiz._count?.questions ?? quiz.questions?.length ?? 0} questions · {quiz._count?.sessions || 0} sessions</small>
      <br />
      <Link to={`/quiz/${quiz.id}/edit`}><button style={{ marginTop: 6, marginRight: 6 }}>Edit</button></Link>
      {onDelete && <button onClick={() => onDelete(quiz.id)} style={{ marginTop: 6, color: 'red' }}>Delete</button>}
    </div>
  );
}
