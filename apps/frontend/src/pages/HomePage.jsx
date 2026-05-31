import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';

/* ——— Data Constants ——— */
const FEATURE_STEPS = [
  {
    number: '01',
    heading: 'ENGAGE YOUR AUDIENCE',
    desc: 'Capture attention from the start with interactive questions, polls, and quizzes that make everyone a participant, not just a spectator.',
  },
  {
    number: '02',
    heading: 'GATHER REAL-TIME RESPONSES',
    desc: 'Watch answers roll in live. See trends and patterns as they emerge, giving you a pulse on the room in real time.',
  },
  {
    number: '03',
    heading: 'LEAVE WITH NEW INSIGHTS',
    desc: "Use your results to build on what you've learned and quickly inform next steps.",
  },
];

const TESTIMONIALS = [
  {
    quote: "QUIZORA HELPS ME TAILOR ACTIVITIES TO MY STUDENTS' NEEDS.",
    name: 'Sarah Mitchell',
    role: 'Education Specialist',
    img: '/Images/CarlaelKhoury.avif',
  },
  {
    quote: 'I KNOW PARTICIPANTS ARE LISTENING AND THAT MY MESSAGE IS GETTING ACROSS.',
    name: 'James Rodriguez',
    role: 'Training Manager',
    img: '/Images/Doris_Hochformat_2.avif',
  },
];

const ENGAGEMENT_FEATURES = [
  'Get live feedback',
  'Check knowledge',
  'Generate ideas',
  'Make decisions',
  'Make it memorable',
];

const ENGAGEMENT_DESCS = [
  'Collect instant reactions, ratings, and opinions from your entire audience with a single question.',
  'Run quizzes and comprehension checks to ensure your key messages are landing.',
  'Use the power of people and their unique perspectives for productive and efficient brainstorming sessions.',
  'Let the group weigh in on priorities and next steps with ranking and voting activities.',
  'Add gamified competitions and word clouds that make your events unforgettable.',
];

const TRUST_LOGOS = ['ACME', 'TechCorp', 'EduPro', 'QuizMax', 'LearnHub', 'DataFlow'];

const EASY_START_CARDS = [
  {
    title: 'Customizable templates',
    desc: 'Pick a template. Then make it your own.',
  },
  {
    title: 'Instant quizzes',
    desc: 'Prompt our AI, customize, interact. Done!',
  },
  {
    title: 'Flexible setups',
    desc: 'Use with any tool. In-room, remote, or both.',
  },
];

const PARTICIPATION_STATS = [
  {
    stat: '97%',
    desc: 'of students felt more engaged',
    gradient: 'from-blue-200 to-menti-brand-weakest',
  },
  {
    stat: '4.5x',
    desc: 'more participation in meetings',
    gradient: 'from-purple-200 to-menti-brand-weak',
  },
  {
    stat: '89%',
    desc: 'say it improves learning outcomes',
    gradient: 'from-pink-200 to-red-100',
  },
];

const CTA_LINKS = ['Enterprise solutions', 'Help and answers', 'Network with us'];

/* ——— SVG Icons ——— */
const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

/* ——— SVG Illustrations for Easy-Start Cards ——— */
const IconTemplates = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="#302E2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="8" width="48" height="48" rx="6" />
    <line x1="8" y1="22" x2="56" y2="22" />
    <line x1="32" y1="22" x2="32" y2="56" />
    <rect x="14" y="28" width="12" height="8" rx="2" fill="#5769E7" stroke="none" />
    <rect x="38" y="28" width="12" height="8" rx="2" fill="#DEDCD9" stroke="none" />
    <rect x="14" y="42" width="12" height="8" rx="2" fill="#DEDCD9" stroke="none" />
    <rect x="38" y="42" width="12" height="8" rx="2" fill="#5769E7" stroke="none" />
  </svg>
);

const IconInstant = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="#302E2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="28,6 20,34 30,34 24,58 48,24 36,24 44,6" fill="#5769E7" stroke="none" />
  </svg>
);

const IconFlexible = () => (
  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="#302E2C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="16" y="12" width="32" height="24" rx="3" />
    <line x1="32" y1="36" x2="32" y2="42" />
    <line x1="24" y1="42" x2="40" y2="42" />
    <rect x="8" y="48" width="16" height="10" rx="2" />
    <rect x="40" y="48" width="16" height="10" rx="2" />
    <line x1="16" y1="48" x2="24" y2="42" />
    <line x1="48" y1="48" x2="40" y2="42" />
  </svg>
);

/* ============================================
   HomePage Component
   ============================================ */
export default function HomePage() {
  /* ——— State ——— */
  const [joinCode, setJoinCode] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState('business');
  const [activeFeature, setActiveFeature] = useState(2);

  /* ——— Refs ——— */
  const stepTimerRef = useRef(null);
  const slideTimerRef = useRef(null);

  /* ——— Features Steps Auto-Rotate (5s) ——— */
  useEffect(() => {
    stepTimerRef.current = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % FEATURE_STEPS.length);
    }, 5000);
    return () => clearInterval(stepTimerRef.current);
  }, []);

  /* ——— Testimonials Auto-Rotate (6s) ——— */
  useEffect(() => {
    slideTimerRef.current = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(slideTimerRef.current);
  }, []);

  /* ——— Join Code Handler ——— */
  const handleJoinCode = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 8);
    setJoinCode(value);
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (joinCode.length > 0) {
      window.location.href = `/join?code=${joinCode}`;
    }
  };

  const currentTestimonial = TESTIMONIALS[activeSlide];

  /* ——— Render ——— */
  return (
    <>
      <Navbar />
      <main>
        {/* ===== Section 1: Join Code Bar ===== */}
        <section className="bg-menti-brand-weakest">
          <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-center gap-3 py-3">
            <span className="font-body text-sm text-menti-text-primary">Enter code to join a live quiz</span>
            <form onSubmit={handleJoinSubmit} className="flex items-center gap-2">
              <input
                type="tel"
                placeholder="1234 5678"
                value={joinCode}
                onChange={handleJoinCode}
                maxLength={8}
                aria-label="Join code"
                className="rounded-lg bg-white w-36 text-center py-2 px-3 text-sm border border-menti-border-weak font-body outline-none focus:border-menti-brand transition-colors"
              />
              <button
                type="submit"
                aria-label="Join quiz"
                className="bg-menti-brand rounded-full w-9 h-9 flex items-center justify-center text-white hover:bg-menti-brand-hover transition-colors cursor-pointer"
              >
                <ArrowRightIcon />
              </button>
            </form>
          </div>
        </section>

        {/* ===== Section 2: Hero ===== */}
        <section className="bg-menti-bg py-20 lg:py-28">
          <div className="max-w-[1200px] mx-auto px-6 lg:grid lg:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <h1 className="font-hero uppercase leading-[0.95] text-menti-text" style={{ fontSize: 'clamp(2.5rem, 7vw, 5.5rem)' }}>
                LISTEN, LEARN,
                <br />
                AND THINK.
                <br />
                <span className="text-menti-brand">TOGETHER.</span>
              </h1>
              <p className="font-body text-lg text-menti-text-weak mt-6 mb-8 max-w-lg">
                Get everyone participating in quizzes, classes, or trainings. With tools
                built for interaction and enhanced by AI, you'll spark engagement and turn
                live insights into action.
              </p>
              <Link
                to="/signup"
                className="inline-block bg-menti-brand text-white px-8 py-4 rounded-full font-body font-semibold text-base hover:bg-menti-brand-hover transition-colors"
              >
                Get started for free
              </Link>
            </div>
            {/* Right */}
            <div className="mt-10 lg:mt-0">
              <img
                src="/Images/Group_1739329481.avif"
                alt="Quizora interactive quiz platform collage"
                className="rounded-2xl shadow-xl hover:scale-[1.02] transition-transform duration-500 w-full"
                loading="eager"
              />
            </div>
          </div>
        </section>

        {/* ===== Section 3: Trust Bar ===== */}
        <section className="py-16 text-center bg-menti-bg">
          <div className="max-w-[1200px] mx-auto px-6">
            <h2 className="font-heading font-semibold text-xl mb-10 text-menti-text">
              Trusted by 500+ users worldwide
            </h2>
            <div className="flex flex-wrap justify-center gap-8 lg:gap-14">
              {TRUST_LOGOS.map((name) => (
                <span
                  key={name}
                  className="text-menti-text-weaker font-bold text-lg tracking-wide uppercase opacity-60"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Section 4: Features Header ===== */}
        <section id="features" className="py-20 text-center bg-menti-bg">
          <div className="max-w-[1200px] mx-auto px-6">
            <h2 className="font-hero uppercase leading-[0.95] text-menti-text" style={{ fontSize: 'clamp(2rem, 6vw, 4.5rem)' }}>
              GOOD QUESTIONS,
              <br />
              GREAT <span className="text-menti-brand">INSIGHTS.</span>
            </h2>
            <p className="font-body text-lg text-menti-text-weak mt-6 max-w-2xl mx-auto">
              Start with a question. Get answers in real time.
              Use what you learn to shape what comes next.
            </p>
          </div>
        </section>

        {/* ===== Section 5: Features Steps ===== */}
        <section className="py-12 bg-menti-bg">
          <div className="max-w-[1200px] mx-auto px-6 lg:grid lg:grid-cols-2 gap-16">
            {/* Left — Steps */}
            <div className="flex flex-col gap-0">
              {FEATURE_STEPS.map((step, i) => (
                <div
                  key={step.number}
                  className={`pl-8 border-l-2 py-6 cursor-pointer transition-colors ${
                    i === activeStep ? 'border-menti-brand' : 'border-menti-border-weak'
                  }`}
                  onClick={() => setActiveStep(i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setActiveStep(i)}
                >
                  <span className="text-menti-brand font-heading text-xl mb-2 block">{step.number}</span>
                  <h3 className="font-hero uppercase text-2xl mb-2 text-menti-text">{step.heading}</h3>
                  {i === activeStep && (
                    <>
                      <p className="font-body text-sm text-menti-text-weak mb-4">{step.desc}</p>
                      <Link
                        to="/signup"
                        className="inline-block bg-menti-brand text-white px-6 py-2.5 rounded-full font-body font-semibold text-sm hover:bg-menti-brand-hover transition-colors"
                      >
                        Get started
                      </Link>
                    </>
                  )}
                </div>
              ))}
            </div>
            {/* Right — Device Mockup */}
            <div className="mt-10 lg:mt-0">
              <div className="rounded-2xl overflow-hidden shadow-2xl border-8 border-menti-primary">
                <img
                  src="/Images/image.avif"
                  alt="Quizora platform interface preview"
                  className="w-full"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ===== Section 6: Testimonials ===== */}
        <section className="py-20 bg-menti-surface">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="lg:grid lg:grid-cols-2 gap-12 items-center">
              {/* Left — Image */}
              <div>
                <img
                  src={currentTestimonial.img}
                  alt={currentTestimonial.name}
                  className="rounded-2xl object-cover w-full h-[400px] lg:h-[500px]"
                  loading="lazy"
                />
              </div>
              {/* Right — Quote */}
              <div className="mt-8 lg:mt-0">
                <span className="font-hero text-6xl text-menti-coral leading-none">{'\u275D'}</span>
                <blockquote
                  className="font-hero uppercase leading-tight mt-4 mb-8 text-menti-text"
                  style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}
                >
                  {currentTestimonial.quote}
                </blockquote>
                <cite className="not-italic block">
                  <span className="font-body font-semibold text-menti-text block">{currentTestimonial.name}</span>
                  <span className="font-body text-menti-text-weak">{currentTestimonial.role}</span>
                </cite>
                {/* Dots */}
                <div className="flex items-center gap-3 mt-8">
                  {TESTIMONIALS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveSlide(i)}
                      aria-label={`Go to testimonial ${i + 1}`}
                      className={`w-3 h-3 rounded-full transition-colors cursor-pointer ${
                        i === activeSlide ? 'bg-menti-brand' : 'bg-menti-border'
                      }`}
                    />
                  ))}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setActiveSlide((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
                      aria-label="Previous testimonial"
                      className="w-9 h-9 rounded-full border border-menti-border flex items-center justify-center text-menti-text hover:bg-menti-surface-sunken transition-colors cursor-pointer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setActiveSlide((prev) => (prev + 1) % TESTIMONIALS.length)}
                      aria-label="Next testimonial"
                      className="w-9 h-9 rounded-full border border-menti-border flex items-center justify-center text-menti-text hover:bg-menti-surface-sunken transition-colors cursor-pointer"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 6 15 12 9 18" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Section 7: Engagement ===== */}
        <section id="engagement" className="py-20 bg-menti-bg">
          <div className="max-w-[1200px] mx-auto px-6">
            {/* Header */}
            <div className="text-center">
              <h2 className="font-hero uppercase text-menti-text" style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}>
                MORE <span className="text-menti-brand">ENGAGEMENT,</span>
                <br />
                EVERY DAY.
              </h2>
              <p className="font-body text-lg text-menti-text-weak mt-4 max-w-2xl mx-auto">
                Easily add participation into more areas of work and learning,
                helping everyone engage more and understand better.
              </p>

              {/* Tab Toggle */}
              <div className="inline-flex rounded-full border border-menti-border p-1 mt-8 mb-12">
                <button
                  onClick={() => setActiveTab('business')}
                  className={`px-6 py-2 rounded-full font-body text-sm font-semibold transition-colors cursor-pointer ${
                    activeTab === 'business'
                      ? 'bg-menti-primary text-white'
                      : 'text-menti-text-primary'
                  }`}
                >
                  Business
                </button>
                <button
                  onClick={() => setActiveTab('education')}
                  className={`px-6 py-2 rounded-full font-body text-sm font-semibold transition-colors cursor-pointer ${
                    activeTab === 'education'
                      ? 'bg-menti-primary text-white'
                      : 'text-menti-text-primary'
                  }`}
                >
                  Education
                </button>
              </div>
            </div>

            {/* Grid */}
            <div className="lg:grid lg:grid-cols-2 gap-12">
              {/* Left — Feature List */}
              <div>
                {ENGAGEMENT_FEATURES.map((name, i) => (
                  <div
                    key={name}
                    className={`py-4 border-b cursor-pointer transition-colors ${
                      i === activeFeature
                        ? 'border-menti-brand'
                        : 'border-menti-border-weak'
                    }`}
                    onClick={() => setActiveFeature(i)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setActiveFeature(i)}
                  >
                    <h3
                      className={`font-body font-semibold text-base transition-colors ${
                        i === activeFeature ? 'text-menti-brand' : 'text-menti-text-primary'
                      }`}
                    >
                      {name}
                    </h3>
                    {i === activeFeature && (
                      <p className="font-body text-sm text-menti-text-weak mt-2">
                        {ENGAGEMENT_DESCS[i]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {/* Right — Device Mockup */}
              <div className="mt-10 lg:mt-0">
                <div className="rounded-2xl overflow-hidden shadow-2xl border-8 border-menti-primary">
                  <img
                    src="/Images/image__1_.avif"
                    alt="Quizora engagement features preview"
                    className="w-full"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Section 8: Easy to Start ===== */}
        <section className="py-20 bg-menti-bg text-center">
          <div className="max-w-[1200px] mx-auto px-6">
            <h2 className="font-hero uppercase text-menti-text" style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}>
              EASY TO START.
              <br />
              SIMPLE TO <span className="text-menti-brand">CONNECT.</span>
            </h2>
            <p className="font-body text-lg text-menti-text-weak mt-4 max-w-2xl mx-auto">
              Choose a template, create from scratch, or prompt AI. You'll be ready to
              present and interact in no time, no matter where your audience is.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              {EASY_START_CARDS.map((card, i) => (
                <article key={card.title} className="bg-menti-surface rounded-2xl p-8 hover:shadow-lg transition-shadow text-left">
                  <div className="h-48 bg-menti-surface-sunken rounded-xl mb-6 flex items-center justify-center">
                    {i === 0 && <IconTemplates />}
                    {i === 1 && <IconInstant />}
                    {i === 2 && <IconFlexible />}
                  </div>
                  <h3 className="font-heading font-semibold text-xl mb-2 text-menti-text">{card.title}</h3>
                  <p className="font-body text-sm text-menti-text-weak">{card.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Section 9: Participation ===== */}
        <section className="py-20 bg-menti-bg">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="text-center">
              <h2 className="font-hero uppercase text-menti-text" style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}>
                THE POWER OF
                <br />
                <span className="text-menti-brand">PARTICIPATION.</span>
              </h2>
              <p className="font-body text-lg text-menti-text-weak mt-4 max-w-2xl mx-auto">
                Quizora makes it simple to spark participation that fuels a cycle
                of active learning and collaboration across the whole organization.
              </p>
            </div>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-4 max-w-[1200px] mx-auto px-6 mt-12 snap-x">
            {PARTICIPATION_STATS.map((item) => (
              <article key={item.stat} className="min-w-[320px] bg-menti-surface rounded-2xl overflow-hidden flex-shrink-0 snap-start">
                <div className={`h-40 bg-gradient-to-br ${item.gradient}`} />
                <div className="p-6">
                  <p className="font-hero text-5xl mb-2 text-menti-text">{item.stat}</p>
                  <p className="font-body text-sm text-menti-text-weak">{item.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ===== Section 10: CTA ===== */}
        <section className="py-20 bg-menti-bg">
          <div className="max-w-[1200px] mx-auto px-6 lg:grid lg:grid-cols-2 gap-8">
            {/* Left — Dark Card */}
            <div className="bg-menti-primary rounded-3xl p-12 text-white">
              <h2 className="font-hero uppercase text-3xl lg:text-4xl leading-tight">
                LISTEN, LEARN, AND LEAD WITH{' '}
                <span className="text-menti-brand">CURIOSITY.</span>
              </h2>
              <p className="text-white/70 mt-4 mb-8 font-body">
                Ask more questions and get more insights.
              </p>
              <Link
                to="/signup"
                className="inline-block bg-white text-menti-text-primary px-8 py-3 rounded-full font-body font-semibold hover:bg-gray-100 transition-colors"
              >
                Start free today
              </Link>
            </div>

            {/* Right — Link Cards */}
            <div className="flex flex-col gap-4 justify-center mt-8 lg:mt-0">
              {CTA_LINKS.map((title) => (
                <Link
                  key={title}
                  to="#"
                  className="bg-menti-surface rounded-2xl p-6 flex items-center justify-between hover:-translate-y-1 transition-transform shadow-sm no-underline"
                >
                  <span className="font-heading font-semibold text-lg text-menti-text">{title}</span>
                  <div className="w-10 h-10 rounded-full bg-menti-primary text-white flex items-center justify-center flex-shrink-0">
                    <ArrowRightIcon />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
