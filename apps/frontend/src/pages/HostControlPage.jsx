import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.jsx';
import { useSession } from '../hooks/useSession.js';
import { onMessage } from '../api/socket.js';

export default function HostControlPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { socket, sendMessage } = useSocket();
  const { session, loading } = useSession(sessionId);

  const [questionIndex, setQuestionIndex] = useState(-1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [responseCount, setResponseCount] = useState(0);
  const [participantCount, setParticipantCount] = useState(0);
  const [status, setStatus] = useState('LIVE');
  const [currentQuestion, setCurrentQuestion] = useState(null);

  useEffect(() => {
    if (session) {
      setParticipantCount(session.sessionState?.participantCount || session.participants?.length || 0);
    }
  }, [session]);

  useEffect(() => {
    if (!socket) return;
    return onMessage(socket, (msg) => {
      if (msg.type === 'question_started') {
        setQuestionIndex(msg.data.questionIndex);
        setTotalQuestions(msg.data.totalQuestions);
        setCurrentQuestion(msg.data);
        setResponseCount(0);
      }
      if (msg.type === 'response_count') {
        setResponseCount(msg.data.count);
      }
      if (msg.type === 'participant_joined') {
        setParticipantCount(msg.data.participantCount);
      }
      if (msg.type === 'participant_left') {
        setParticipantCount(msg.data.participantCount);
      }
      if (msg.type === 'quiz_ended') {
        navigate(`/session/${sessionId}/leaderboard`);
      }
    });
  }, [socket]);

  if (loading) return <div>Loading...</div>;

  function nextQuestion() { sendMessage('next_question', { sessionId }); }
  function showLeaderboard() { sendMessage('get_leaderboard', { sessionId }); }
  function showQuestionResult() {
    if (currentQuestion) sendMessage('get_question_result', { sessionId, questionId: currentQuestion.questionId });
  }
  function pauseQuiz() { sendMessage('pause_quiz', { sessionId }); setStatus('PAUSED'); }
  function resumeQuiz() { sendMessage('resume_quiz', { sessionId }); setStatus('LIVE'); }
  function endQuiz() {
    if (confirm('End the quiz?')) sendMessage('end_quiz', { sessionId });
  }

  return (
    <div style={{ maxWidth: 600, margin: '20px auto' }}>
      <h1>Host Control</h1>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <span>Participants: <strong>{participantCount}</strong></span>
        <span>Responses: <strong>{responseCount}</strong></span>
        <span>Status: <strong>{status}</strong></span>
      </div>

      {currentQuestion ? (
        <div style={{ border: '1px solid #ddd', padding: 16, borderRadius: 6, marginBottom: 16 }}>
          <h3>Q{questionIndex + 1}/{totalQuestions}: {currentQuestion.text}</h3>
          <p>{currentQuestion.questionType} · {currentQuestion.points} pts</p>
        </div>
      ) : (
        <p>No question sent yet. Click "Next Question" to begin.</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button onClick={nextQuestion} style={{ padding: 12, fontSize: 16 }}>
          {questionIndex < 0 ? '▶ Start First Question' : '▶ Next Question'}
        </button>
        <button onClick={showLeaderboard} style={{ padding: 12 }}>📊 Show Leaderboard</button>
        <button onClick={showQuestionResult} disabled={!currentQuestion} style={{ padding: 12 }}>📈 Question Results</button>
        {status === 'LIVE' ? (
          <button onClick={pauseQuiz} style={{ padding: 12 }}>⏸ Pause</button>
        ) : (
          <button onClick={resumeQuiz} style={{ padding: 12 }}>▶ Resume</button>
        )}
      </div>
      <button onClick={endQuiz} style={{ padding: 12, marginTop: 12, width: '100%', background: '#dc3545', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 16 }}>
        🛑 End Quiz
      </button>
    </div>
  );
}
