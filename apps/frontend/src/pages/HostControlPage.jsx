import { useState } from 'react';
import { useParams } from 'react-router-dom';

const MOCK = {
  joinCode: 'ABC12345',
  participants: 12,
  questions: [
    { id: 1, text: 'What is the capital of France?', options: ['London', 'Paris', 'Berlin', 'Madrid'], correctIndex: 1 },
    { id: 2, text: 'JavaScript is a compiled language.', options: ['True', 'False'], correctIndex: 1 },
    { id: 3, text: 'Explain closures in JavaScript.', options: [], type: 'OPEN_ENDED' },
  ],
  responses: { 0: [3, 8, 1, 0], 1: [4, 8], 2: [] },
};

export default function HostControlPage() {
  const { sessionId } = useParams();
  const [currentQ, setCurrentQ] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const questions = MOCK.questions;
  const question = questions[currentQ];
  const responses = MOCK.responses[currentQ] || [];
  const totalResponses = responses.reduce((a, b) => a + b, 0);

  const nextQuestion = () => { if (currentQ < questions.length - 1) setCurrentQ(p => p + 1); };

  return (
    <div className="flex min-h-screen bg-menti-bg">
      {/* Sidebar */}
      <aside className={`fixed lg:static top-0 left-0 h-screen w-72 sm:w-80 bg-menti-surface border-r border-menti-border-weak z-40 transform transition-transform duration-300 overflow-y-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 pt-8">
          {/* Session Info */}
          <div className="bg-menti-brand-weakest rounded-2xl p-4 mb-6">
            <p className="font-body text-xs text-menti-text-weak mb-1">Join Code</p>
            <p className="font-mono text-xl font-bold text-menti-brand tracking-wider">{MOCK.joinCode}</p>
            <p className="font-body text-sm font-semibold text-menti-text mt-2">{MOCK.participants} participants</p>
          </div>

          {/* Questions Nav */}
          <h3 className="font-heading font-semibold text-xs text-menti-text-weaker uppercase tracking-wider mb-3">QUESTIONS</h3>
          <nav className="flex flex-col gap-1 mb-6">
            {questions.map((q, i) => (
              <button key={q.id} onClick={() => { setCurrentQ(i); setSidebarOpen(false); }}
                className={`text-left py-3 px-4 rounded-lg font-body text-sm transition-all duration-200 cursor-pointer
                  ${i === currentQ ? 'bg-menti-brand-weakest border-l-4 border-menti-brand text-menti-brand font-semibold' : 'text-menti-text-primary hover:bg-menti-surface-sunken'}`}>
                Q{i + 1}. {q.text.substring(0, 30)}...
              </button>
            ))}
          </nav>

          {/* Controls */}
          <div className="border-t border-menti-border-weak pt-6 flex flex-col gap-2">
            <button onClick={nextQuestion} disabled={currentQ >= questions.length - 1}
              className="w-full py-3 rounded-full bg-menti-brand text-white font-body font-semibold text-sm hover:bg-menti-brand-hover transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
              Next Question
            </button>
            <button onClick={() => setIsPaused(!isPaused)}
              className="w-full py-3 rounded-full border border-menti-border font-body font-semibold text-sm text-menti-text-primary hover:bg-menti-surface-sunken transition-colors duration-200 cursor-pointer">
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>
            <button className="w-full py-3 rounded-full bg-menti-coral text-white font-body font-semibold text-sm hover:bg-red-600 transition-colors duration-200 cursor-pointer">
              End Quiz
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile Top Bar */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-menti-surface border-b border-menti-border-weak">
          <button onClick={() => setSidebarOpen(true)} className="p-2 cursor-pointer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#101010"><path d="M3 6h18v1.5H3V6zm0 5.25h18v1.5H3v-1.5zm0 5.25h18V18H3v-1.5z"/></svg>
          </button>
          <span className="font-body font-semibold text-sm">Q{currentQ + 1} / {questions.length}</span>
          <span className="font-body text-sm text-menti-text-weak">{MOCK.participants} joined</span>
        </div>

        <div className="p-6 sm:p-8 max-w-4xl mx-auto">
          {/* Current Question */}
          <div className="bg-menti-surface rounded-2xl p-6 sm:p-8 shadow-sm border border-menti-border-weak mb-8">
            <span className="inline-block rounded-full px-3 py-1 text-xs font-body font-semibold bg-menti-brand-weakest text-menti-brand mb-4">
              Question {currentQ + 1}
            </span>
            <h2 className="font-heading font-semibold text-xl sm:text-2xl text-menti-text text-center">{question.text}</h2>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[{ label: 'Responses', value: totalResponses }, { label: 'Participants', value: MOCK.participants }, { label: 'Avg Time', value: '8.2s' }, { label: 'Accuracy', value: '67%' }].map(s => (
              <div key={s.label} className="bg-menti-surface rounded-xl p-4 text-center border border-menti-border-weak">
                <p className="font-hero text-2xl sm:text-3xl text-menti-text">{s.value}</p>
                <p className="font-body text-xs text-menti-text-weak mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Response Bars */}
          {question.options.length > 0 && (
            <div className="bg-menti-surface rounded-2xl p-6 border border-menti-border-weak">
              <h3 className="font-heading font-semibold text-base text-menti-text mb-4">Response Distribution</h3>
              {question.options.map((opt, i) => {
                const count = responses[i] || 0;
                const pct = totalResponses > 0 ? Math.round((count / totalResponses) * 100) : 0;
                const isCorrect = i === question.correctIndex;
                return (
                  <div key={i} className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span className={`font-body text-sm ${isCorrect ? 'font-semibold text-menti-positive' : 'text-menti-text-primary'}`}>
                        {isCorrect && '✓ '}{opt}
                      </span>
                      <span className="font-body text-sm text-menti-text-weak">{pct}%</span>
                    </div>
                    <div className="h-7 bg-menti-surface-sunken rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ease-out ${isCorrect ? 'bg-menti-brand' : 'bg-menti-border'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
