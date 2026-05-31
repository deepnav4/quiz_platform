import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

/* ——————————————————————————————————
   Data
   —————————————————————————————————— */
const FEATURE_STEPS = [
  { number: '01', heading: 'ENGAGE YOUR AUDIENCE', desc: 'Capture attention from the start with interactive questions, polls, and quizzes that make everyone a participant, not just a spectator.' },
  { number: '02', heading: 'GATHER REAL-TIME RESPONSES', desc: 'Watch answers roll in live. See trends and patterns as they emerge, giving you a pulse on the room in real time.' },
  { number: '03', heading: 'LEAVE WITH NEW INSIGHTS', desc: 'Use your results to build on what you\'ve learned and quickly inform next steps.' },
];

const TESTIMONIALS = [
  { quote: "QUIZORA HELPS ME TAILOR ACTIVITIES TO MY STUDENTS' NEEDS.", name: 'Sarah Mitchell', role: 'Education Specialist', img: '/Images/CarlaelKhoury.avif' },
  { quote: 'I KNOW PARTICIPANTS ARE LISTENING AND THAT MY MESSAGE IS GETTING ACROSS.', name: 'James Rodriguez', role: 'Training Manager', img: '/Images/Doris_Hochformat_2.avif' },
];

const ENGAGEMENT_FEATURES = [
  { icon: '📢', title: 'Get live feedback', desc: 'Collect instant reactions, ratings, and opinions from your entire audience with a single question.' },
  { icon: '📊', title: 'Check knowledge', desc: 'Run quizzes and comprehension checks to ensure your key messages are landing.' },
  { icon: '💡', title: 'Generate ideas', desc: 'Use the power of people and their unique perspectives for productive and efficient brainstorming sessions.' },
  { icon: '🗳️', title: 'Make decisions', desc: 'Let the group weigh in on priorities and next steps with ranking and voting activities.' },
  { icon: '🎯', title: 'Make it memorable', desc: 'Add gamified competitions and word clouds that make your events unforgettable.' },
];

const EASY_CARDS = [
  { title: 'Customizable templates', desc: 'Pick a template. Then make it your own with brand colors, fonts, and images.' },
  { title: 'Instant quizzes', desc: 'Prompt our AI, customize the output, and interact. Your quiz is ready in seconds.' },
  { title: 'Flexible setups', desc: 'Use with any tool. Works seamlessly in-room, remote, or hybrid setups.' },
];

const CASE_STUDIES = [
  { stat: '97%', desc: 'of students felt more engaged in classroom activities', gradient: 'bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100' },
  { stat: '4.5x', desc: 'more participation in corporate meetings and trainings', gradient: 'bg-gradient-to-br from-violet-100 via-purple-50 to-fuchsia-100' },
  { stat: '89%', desc: 'say it improves learning outcomes and knowledge retention', gradient: 'bg-gradient-to-br from-rose-100 via-pink-50 to-orange-100' },
];

const LOGOS = ['ACME', 'TechCorp', 'EduPro', 'QuizMax', 'LearnHub', 'DataFlow'];

/* ——————————————————————————————————
   Scroll Reveal Hook
   —————————————————————————————————— */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('revealed'); observer.unobserve(el); } },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

function RevealSection({ children, className = '', delay = 0 }) {
  const ref = useReveal();
  return (
    <div
      ref={ref}
      className={`opacity-0 translate-y-8 transition-all duration-700 ease-out [&.revealed]:opacity-100 [&.revealed]:translate-y-0 ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ——————————————————————————————————
   SVG Icons
   —————————————————————————————————— */
const ArrowIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const CardIcon1 = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none"><rect x="6" y="6" width="44" height="44" rx="6" stroke="#302E2C" strokeWidth="1.5"/><line x1="6" y1="20" x2="50" y2="20" stroke="#302E2C" strokeWidth="1.5"/><line x1="28" y1="20" x2="28" y2="50" stroke="#302E2C" strokeWidth="1.5"/><rect x="12" y="26" width="10" height="7" rx="2" fill="#5769E7"/><rect x="34" y="26" width="10" height="7" rx="2" fill="#DEDCD9"/><rect x="12" y="38" width="10" height="7" rx="2" fill="#DEDCD9"/><rect x="34" y="38" width="10" height="7" rx="2" fill="#5769E7"/></svg>
);
const CardIcon2 = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none"><polygon points="24,4 17,30 26,30 21,52 42,21 32,21 39,4" fill="#5769E7"/></svg>
);
const CardIcon3 = () => (
  <svg width="56" height="56" viewBox="0 0 56 56" fill="none"><rect x="14" y="10" width="28" height="22" rx="3" stroke="#302E2C" strokeWidth="1.5"/><line x1="28" y1="32" x2="28" y2="38" stroke="#302E2C" strokeWidth="1.5"/><line x1="22" y1="38" x2="34" y2="38" stroke="#302E2C" strokeWidth="1.5"/><rect x="6" y="42" width="14" height="9" rx="2" stroke="#302E2C" strokeWidth="1.5"/><rect x="36" y="42" width="14" height="9" rx="2" stroke="#302E2C" strokeWidth="1.5"/><path d="M13 42L22 38" stroke="#5769E7" strokeWidth="1.5"/><path d="M43 42L34 38" stroke="#5769E7" strokeWidth="1.5"/></svg>
);
const CARD_ICONS = [CardIcon1, CardIcon2, CardIcon3];

/* ============================================
   HomePage
   ============================================ */
export default function HomePage() {
  const [joinCode, setJoinCode] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState('business');
  const [activeFeature, setActiveFeature] = useState(2);

  /* Auto-rotate feature steps */
  useEffect(() => {
    const id = setInterval(() => setActiveStep(p => (p + 1) % FEATURE_STEPS.length), 5000);
    return () => clearInterval(id);
  }, []);

  /* Auto-rotate testimonials */
  useEffect(() => {
    const id = setInterval(() => setActiveSlide(p => (p + 1) % TESTIMONIALS.length), 6000);
    return () => clearInterval(id);
  }, []);

  const handleJoinCode = (e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 8));
  const handleJoin = (e) => { e.preventDefault(); if (joinCode.length > 0) window.location.href = `/join?code=${joinCode}`; };
  const t = TESTIMONIALS[activeSlide];

  return (
    <>
      <Navbar />
      <main className="overflow-hidden">

        {/* ── Join Code Bar ── */}
        <section className="bg-menti-brand-weakest">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-center gap-3 py-3">
            <span className="text-sm text-menti-text-primary font-body hidden sm:inline">Enter code to join a live quiz</span>
            <form onSubmit={handleJoin} className="flex items-center gap-2">
              <input type="tel" placeholder="1234 5678" value={joinCode} onChange={handleJoinCode} maxLength={8}
                className="rounded-lg bg-white w-32 sm:w-36 text-center py-2 px-3 text-sm border border-menti-border-weak font-body outline-none focus:border-menti-brand transition-colors duration-200" />
              <button type="submit" className="bg-menti-brand rounded-full w-9 h-9 flex items-center justify-center text-white hover:bg-menti-brand-hover transition-colors duration-200 cursor-pointer">
                <ArrowIcon />
              </button>
            </form>
          </div>
        </section>

        {/* ── Hero ── */}
        <section className="bg-menti-bg pt-16 pb-20 lg:pt-24 lg:pb-32">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <RevealSection>
              <h1 className="font-hero uppercase text-menti-text leading-[0.92] tracking-[-0.02em]" style={{ fontSize: 'clamp(2.8rem, 7vw, 5.5rem)' }}>
                LISTEN, LEARN,<br />AND THINK.<br />
                <span className="text-menti-brand">TOGETHER.</span>
              </h1>
              <p className="font-body  text-lg leading-relaxed text-menti-text-weak mt-6 mb-8 max-w-md text-black">
                Get everyone participating in quizzes, classes, or trainings. With tools built for interaction and enhanced by AI, you'll spark engagement and turn live insights into action.
              </p>
              <Link to="/signup" className="inline-block bg-menti-brand text-white px-8 py-4 rounded-full font-body font-semibold text-base hover:bg-menti-brand-hover transition-all duration-300 hover:shadow-lg hover:shadow-menti-brand/25">
                Get started for free
              </Link>
            </RevealSection>
            <RevealSection delay={200} className="mt-10 lg:mt-0">
              <img src="/Images/Group_1739329481.avif" alt="Quizora interactive platform" loading="eager"
                className="rounded-2xl shadow-xl w-full transition-transform duration-700 ease-out hover:scale-[1.015]" />
            </RevealSection>
          </div>
        </section>

        {/* ── Trust Bar ── */}
        <RevealSection className="py-14 text-center bg-menti-bg">
          <h2 className="font-heading font-semibold text-lg sm:text-xl mb-10 text-menti-text">Trusted by 500+ users worldwide</h2>
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 lg:gap-14 px-6">
            {LOGOS.map(n => <span key={n} className="text-menti-text-weaker font-bold text-base sm:text-lg tracking-wider uppercase opacity-50 select-none">{n}</span>)}
          </div>
        </RevealSection>

        {/* ── Features Header ── */}
        <section id="features" className="pt-20 pb-8 text-center bg-menti-bg">
          <RevealSection className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <h2 className="font-hero uppercase text-menti-text leading-[0.92] tracking-[-0.02em]" style={{ fontSize: 'clamp(2rem, 6vw, 4.5rem)' }}>
              GOOD QUESTIONS,<br />GREAT <span className="text-menti-brand">INSIGHTS.</span>
            </h2>
            <p className="font-body text-lg text-menti-text-weak mt-5 max-w-xl mx-auto leading-relaxed">
              Start with a question. Get answers in real time. Use what you learn to shape what comes next.
            </p>
          </RevealSection>
        </section>

        {/* ── Features Steps ── */}
        <section className="py-12 lg:py-16 bg-menti-bg">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:grid lg:grid-cols-2 gap-12 lg:gap-20">
            <RevealSection>
              <div className="flex flex-col">
                {FEATURE_STEPS.map((s, i) => (
                  <div key={s.number} onClick={() => setActiveStep(i)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && setActiveStep(i)}
                    className={`pl-8 py-6 border-l-2 cursor-pointer transition-all duration-500 ${i === activeStep ? 'border-menti-brand' : 'border-menti-border-weak'}`}>
                    <span className={`font-heading text-lg block mb-1 transition-colors duration-300 ${i === activeStep ? 'text-menti-brand' : 'text-menti-text-weaker'}`}>{s.number}</span>
                    <h3 className="font-hero uppercase text-xl sm:text-2xl text-menti-text mb-2">{s.heading}</h3>
                    <div className={`overflow-hidden transition-all duration-500 ease-out ${i === activeStep ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <p className="font-body text-sm text-menti-text-weak mb-4 leading-relaxed">{s.desc}</p>
                      <Link to="/signup" className="inline-block bg-menti-brand text-white px-6 py-2.5 rounded-full font-body font-semibold text-sm hover:bg-menti-brand-hover transition-colors duration-200">Get started</Link>
                    </div>
                  </div>
                ))}
              </div>
            </RevealSection>
            <RevealSection delay={150} className="mt-10 lg:mt-0 flex items-center">
              <div className="rounded-2xl overflow-hidden shadow-2xl border-[6px] border-menti-primary w-full">
                <img src="/Images/image.avif" alt="Platform interface" className="w-full" loading="lazy" />
              </div>
            </RevealSection>
          </div>
        </section>

        {/* ── Testimonials ── */}
        <section className="py-20 lg:py-28 bg-menti-surface">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="lg:grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <RevealSection>
                <div className="relative overflow-hidden rounded-2xl" style={{ height: 'clamp(300px, 50vw, 500px)' }}>
                  {TESTIMONIALS.map((item, i) => (
                    <img key={i} src={item.img} alt={item.name}
                      className={`absolute inset-0 w-full h-full object-cover rounded-2xl transition-all duration-700 ease-in-out ${i === activeSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`} loading="lazy" />
                  ))}
                </div>
              </RevealSection>
              <RevealSection delay={150} className="mt-8 lg:mt-0">
                <span className="font-hero text-5xl sm:text-6xl text-menti-coral leading-none select-none">{'\u275D'}</span>
                <div className="relative min-h-[180px] mt-3">
                  {TESTIMONIALS.map((item, i) => (
                    <blockquote key={i} className={`absolute top-0 left-0 right-0 font-hero uppercase text-menti-text leading-tight transition-all duration-600 ease-in-out ${i === activeSlide ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                      style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2.4rem)' }}>
                      {item.quote}
                    </blockquote>
                  ))}
                </div>
                <cite className="not-italic block mt-6">
                  <span className="font-body font-semibold text-menti-text block">{t.name}</span>
                  <span className="font-body text-sm text-menti-text-weak">{t.role}</span>
                </cite>
                <div className="flex items-center gap-3 mt-8">
                  {TESTIMONIALS.map((_, i) => (
                    <button key={i} onClick={() => setActiveSlide(i)}
                      className={`rounded-full transition-all duration-300 cursor-pointer ${i === activeSlide ? 'w-8 h-3 bg-menti-brand' : 'w-3 h-3 bg-menti-border hover:bg-menti-text-weaker'}`} />
                  ))}
                  <div className="flex gap-2 ml-3">
                    {[-1, 1].map(dir => (
                      <button key={dir} onClick={() => setActiveSlide(p => (p + dir + TESTIMONIALS.length) % TESTIMONIALS.length)}
                        className="w-9 h-9 rounded-full border border-menti-border flex items-center justify-center text-menti-text hover:bg-menti-surface-sunken transition-colors duration-200 cursor-pointer">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points={dir < 0 ? "15 18 9 12 15 6" : "9 6 15 12 9 18"} />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              </RevealSection>
            </div>
          </div>
        </section>

        {/* ── Engagement ── */}
        <section id="engagement" className="py-20 lg:py-28 bg-menti-bg">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <RevealSection className="text-center">
              <h2 className="font-hero uppercase text-menti-text leading-[0.92]" style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}>
                MORE <span className="text-menti-brand">ENGAGEMENT,</span><br />EVERY DAY.
              </h2>
              <p className="font-body text-lg text-menti-text-weak mt-4 max-w-xl mx-auto leading-relaxed">
                Easily add participation into more areas of work and learning, helping everyone engage more and understand better.
              </p>
              <div className="inline-flex rounded-full border border-menti-border p-1 mt-8 mb-12 bg-menti-surface">
                {['Business', 'Education'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab.toLowerCase())}
                    className={`px-6 py-2 rounded-full font-body text-sm font-semibold transition-all duration-300 cursor-pointer ${activeTab === tab.toLowerCase() ? 'bg-menti-primary text-white shadow-sm' : 'text-menti-text-primary hover:text-menti-text'}`}>
                    {tab}
                  </button>
                ))}
              </div>
            </RevealSection>

            <div className="lg:grid lg:grid-cols-2 gap-12 lg:gap-16">
              <RevealSection>
                {ENGAGEMENT_FEATURES.map((f, i) => (
                  <div key={f.title} onClick={() => setActiveFeature(i)} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && setActiveFeature(i)}
                    className={`py-4 border-b cursor-pointer transition-all duration-300 ${i === activeFeature ? 'border-menti-brand' : 'border-menti-border-weak'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{f.icon}</span>
                      <h3 className={`font-body font-semibold text-base transition-colors duration-300 ${i === activeFeature ? 'text-menti-brand' : 'text-menti-text-primary'}`}>{f.title}</h3>
                    </div>
                    <div className={`overflow-hidden transition-all duration-500 ease-out ${i === activeFeature ? 'max-h-24 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}>
                      <p className="font-body text-sm text-menti-text-weak leading-relaxed pl-9">{f.desc}</p>
                    </div>
                  </div>
                ))}
                <Link to="#" className="inline-block mt-6 border border-menti-border text-menti-text-primary px-6 py-2.5 rounded-full font-body font-semibold text-sm hover:bg-menti-surface transition-colors duration-200">
                  Get a demo
                </Link>
              </RevealSection>
              <RevealSection delay={150} className="mt-10 lg:mt-0 flex items-center">
                <div className="rounded-2xl overflow-hidden shadow-2xl border-[6px] border-menti-primary w-full">
                  <img src="/Images/image__1_.avif" alt="Engagement features" className="w-full" loading="lazy" />
                </div>
              </RevealSection>
            </div>
          </div>
        </section>

        {/* ── Easy to Start ── */}
        <section className="py-20 lg:py-28 bg-menti-bg">
          <RevealSection className="max-w-[1200px] mx-auto px-4 sm:px-6 text-center">
            <h2 className="font-hero uppercase text-menti-text leading-[0.92]" style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}>
              EASY TO START.<br />SIMPLE TO <span className="text-menti-brand">CONNECT.</span>
            </h2>
            <p className="font-body text-lg text-menti-text-weak mt-4 max-w-xl mx-auto leading-relaxed">
              Choose a template, create from scratch, or prompt AI. You'll be ready to present and interact in no time.
            </p>
          </RevealSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1200px] mx-auto px-4 sm:px-6 mt-12">
            {EASY_CARDS.map((c, i) => (
              <RevealSection key={c.title} delay={i * 100}>
                <article className="bg-menti-surface rounded-2xl p-8 text-left hover:shadow-lg transition-shadow duration-300 h-full">
                  <div className="h-44 bg-menti-surface-sunken rounded-xl mb-6 flex items-center justify-center">
                    {CARD_ICONS[i] && CARD_ICONS[i]()}
                  </div>
                  <h3 className="font-heading font-semibold text-xl mb-2 text-menti-text">{c.title}</h3>
                  <p className="font-body text-sm text-menti-text-weak leading-relaxed">{c.desc}</p>
                </article>
              </RevealSection>
            ))}
          </div>
        </section>

        {/* ── Power of Participation ── */}
        <section className="py-20 lg:py-28 bg-menti-bg">
          <RevealSection className="max-w-[1200px] mx-auto px-4 sm:px-6 text-center">
            <h2 className="font-hero uppercase text-menti-text leading-[0.92]" style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}>
              THE POWER OF<br /><span className="text-menti-brand">PARTICIPATION.</span>
            </h2>
            <p className="font-body text-lg text-menti-text-weak mt-4 max-w-xl mx-auto leading-relaxed">
              Quizora makes it simple to spark participation that fuels a cycle of active learning and collaboration.
            </p>
          </RevealSection>
          <div className="flex gap-6 overflow-x-auto pb-4 max-w-[1200px] mx-auto px-4 sm:px-6 mt-12 snap-x snap-mandatory scrollbar-hide">
            {CASE_STUDIES.map((c, i) => (
              <RevealSection key={c.stat} delay={i * 100} className="min-w-[300px] sm:min-w-[340px] flex-shrink-0 snap-start">
                <article className="bg-menti-surface rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <div className={`h-36 ${c.gradient}`} />
                  <div className="p-6">
                    <p className="font-hero text-5xl text-menti-text mb-2">{c.stat}</p>
                    <p className="font-body text-sm text-menti-text-weak leading-relaxed">{c.desc}</p>
                  </div>
                </article>
              </RevealSection>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-20 lg:py-28 bg-menti-bg">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:grid lg:grid-cols-2 gap-8">
            <RevealSection>
              <div className="bg-menti-primary rounded-3xl p-10 sm:p-12 text-white">
                <h2 className="font-hero uppercase text-2xl sm:text-3xl lg:text-4xl leading-tight">
                  LISTEN, LEARN, AND LEAD WITH <span className="text-menti-brand">CURIOSITY.</span>
                </h2>
                <p className="text-white/65 mt-4 mb-8 font-body leading-relaxed">Ask more questions and get more insights.</p>
                <Link to="/signup" className="inline-block bg-white text-menti-text-primary px-8 py-3.5 rounded-full font-body font-semibold hover:bg-gray-50 transition-colors duration-200">
                  Start free today
                </Link>
              </div>
            </RevealSection>
            <RevealSection delay={150} className="flex flex-col gap-4 justify-center mt-8 lg:mt-0">
              {['Enterprise solutions', 'Help and answers', 'Network with us'].map((title, i) => (
                <Link key={title} to="#"
                  className="bg-menti-surface rounded-2xl p-5 sm:p-6 flex items-center justify-between hover:-translate-y-0.5 transition-all duration-300 shadow-sm hover:shadow-md no-underline group">
                  <span className="font-heading font-semibold text-base sm:text-lg text-menti-text">{title}</span>
                  <div className="w-10 h-10 rounded-full bg-menti-primary text-white flex items-center justify-center flex-shrink-0 group-hover:bg-menti-brand transition-colors duration-300">
                    <ArrowIcon />
                  </div>
                </Link>
              ))}
            </RevealSection>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
