import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.jsx';
import { onMessage } from '../api/socket.js';
import { useTimer } from '../hooks/useTimer.js';

export default function LiveQuizPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { socket, sendMessage } = useSocket();
  const { seconds, start, reset } = useTimer(0);

  const [question, setQuestion] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [totalScore, setTotalScore] = useState(0);
  const [waiting, setWaiting] = useState(true);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    if (!socket) return;
    return onMessage(socket, (msg) => {
      if (msg.type === 'question_started') {
        setQuestion(msg.data);
        setSelectedOptions([]);
        setSubmitted(false);
        setResult(null);
        setWaiting(false);
        setQuestionIndex(msg.data.questionIndex);
        setTotalQuestions(msg.data.totalQuestions);
        if (msg.data.hasTimeLimit && msg.data.timeLimitSeconds) {
          start(msg.data.timeLimitSeconds);
        } else {
          reset(0);
        }
      }
      if (msg.type === 'response_received') {
        setResult(msg.data);
        setTotalScore(msg.data.totalScore);
      }
      if (msg.type === 'time_up') {
        if (!submitted) setResult({ isCorrect: false, pointsEarned: 0, message: 'Time up!' });
      }
      if (msg.type === 'quiz_ended') {
        navigate(`/session/${sessionId}/leaderboard`);
      }
      if (msg.type === 'quiz_paused') {
        setWaiting(true);
      }
      if (msg.type === 'quiz_resumed') {
        setWaiting(false);
      }
    });
  }, [socket, submitted]);

  function toggleOption(optId) {
    if (submitted) return;
    if (question?.questionType === 'MULTIPLE_CHOICE_SINGLE' || question?.questionType === 'TRUE_FALSE') {
      setSelectedOptions([optId]);
    } else {
      setSelectedOptions(prev => prev.includes(optId) ? prev.filter(x => x !== optId) : [...prev, optId]);
    }
  }

  function handleSubmit() {
    if (submitted || selectedOptions.length === 0) return;
    sendMessage('submit_response', { sessionId, questionId: question.questionId, selectedOptionIds: selectedOptions });
    setSubmitted(true);
  }

  if (waiting && !question) {
    return (
      <div style={{ maxWidth: 500, margin: '40px auto', textAlign: 'center' }}>
        <h1>Get Ready!</h1>
        <p>Waiting for host to send the first question...</p>
        <p>Total Score: <strong>{totalScore}</strong></p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '20px auto' }}>
      {waiting && <p style={{ textAlign: 'center', color: 'orange' }}>Quiz paused...</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span>Question {questionIndex + 1} / {totalQuestions}</span>
        {question?.hasTimeLimit && <span style={{ fontWeight: 'bold', color: seconds <= 5 ? 'red' : 'inherit' }}>⏱ {seconds}s</span>}
        <span>Score: {totalScore}</span>
      </div>

      <h2>{question?.text}</h2>

      <div style={{ display: 'grid', gap: 8 }}>
        {question?.options?.map(o => {
          const isSelected = selectedOptions.includes(o.id);
          const showCorrect = result && result.correctOptionIds;
          let bg = isSelected ? '#cce5ff' : '#f8f8f8';
          if (showCorrect) {
            if (result.correctOptionIds.includes(o.id)) bg = '#d4edda';
            else if (isSelected) bg = '#f8d7da';
          }
          return (
            <button key={o.id} onClick={() => toggleOption(o.id)} disabled={submitted}
              style={{ padding: 14, border: `2px solid ${isSelected ? '#007bff' : '#ddd'}`, borderRadius: 6, background: bg, cursor: submitted ? 'default' : 'pointer', textAlign: 'left', fontSize: 16 }}>
              {o.text}
            </button>
          );
        })}
      </div>

      {!submitted ? (
        <button onClick={handleSubmit} disabled={selectedOptions.length === 0}
          style={{ marginTop: 16, padding: '10px 30px', fontSize: 16, width: '100%' }}>
          Submit Answer
        </button>
      ) : (
        <div style={{ marginTop: 16, padding: 16, borderRadius: 6, background: result?.isCorrect ? '#d4edda' : '#f8d7da', textAlign: 'center' }}>
          {result ? (
            <>
              <p style={{ fontSize: 20 }}>{result.isCorrect ? '✅ Correct!' : '❌ Wrong'}</p>
              <p>+{result.pointsEarned} points</p>
            </>
          ) : <p>Submitted! Waiting for results...</p>}
        </div>
      )}
    </div>
  );
}
