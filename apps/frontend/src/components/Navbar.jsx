import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-menti-surface border-b border-menti-border-weak">
      <nav className="max-w-[1200px] mx-auto flex items-center justify-between px-4 md:px-6 h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 no-underline">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="8" fill="#5769E7"/>
            <path d="M28 12V28H18C18 22.5 14.5 17.5 9 14V12H14V8H19L28 12Z" fill="#FFFFFF"/>
            <path d="M18 28C18 18.5 11.5 12 4 12V28H18Z" fill="#C74E4C" opacity="0.85"/>
          </svg>
          <span className="font-heading font-semibold text-xl text-menti-text hidden sm:block">Quizora</span>
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden md:flex items-center gap-6">
          <li><Link to="/#features" className="font-body font-semibold text-sm text-menti-text-primary hover:opacity-60 transition-opacity">Features</Link></li>
          <li><Link to="/#engagement" className="font-body font-semibold text-sm text-menti-text-primary hover:opacity-60 transition-opacity">How it works</Link></li>
          <li><Link to="/join" className="font-body font-semibold text-sm text-menti-text-primary hover:opacity-60 transition-opacity">Join Quiz</Link></li>
        </ul>

        {/* Desktop Auth */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm font-semibold text-menti-text-primary">Hi, {user.name || user.email}</span>
              <Link to="/dashboard" className="text-sm font-semibold text-menti-brand hover:opacity-80 transition-opacity">Dashboard</Link>
              <button onClick={logout} className="px-5 py-2.5 rounded-full text-sm font-semibold border border-menti-border text-menti-text-primary hover:bg-menti-surface-sunken transition-colors cursor-pointer">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-menti-text-primary hover:opacity-60 transition-opacity">Log in</Link>
              <Link to="/signup" className="px-5 py-2.5 rounded-full text-sm font-semibold bg-menti-brand text-white hover:bg-menti-brand-hover transition-colors">Sign up</Link>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 cursor-pointer" aria-label="Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="#101010"><path d="M3 6h18v1.5H3V6zm0 5.25h18v1.5H3v-1.5zm0 5.25h18V18H3v-1.5z"/></svg>
        </button>
      </nav>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[200] md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-menti-surface shadow-xl animate-slide-in-right flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-menti-border-weak">
              <span className="font-heading font-semibold text-lg">Quizora</span>
              <button onClick={() => setMobileOpen(false)} className="p-2 cursor-pointer" aria-label="Close">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#101010"><path d="M18 6L6 18M6 6l12 12" stroke="#101010" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            <nav className="flex flex-col gap-1 p-4">
              <Link to="/" onClick={() => setMobileOpen(false)} className="py-3 px-3 rounded-lg font-semibold text-menti-text-primary hover:bg-menti-surface-sunken transition-colors">Home</Link>
              <Link to="/join" onClick={() => setMobileOpen(false)} className="py-3 px-3 rounded-lg font-semibold text-menti-text-primary hover:bg-menti-surface-sunken transition-colors">Join Quiz</Link>
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="py-3 px-3 rounded-lg font-semibold text-menti-text-primary hover:bg-menti-surface-sunken transition-colors">Dashboard</Link>
            </nav>
            <div className="mt-auto p-4 border-t border-menti-border-weak flex flex-col gap-2">
              {user ? (
                <>
                  <span className="text-sm font-semibold px-3">Hi, {user.name || user.email}</span>
                  <button onClick={() => { logout(); setMobileOpen(false); }} className="w-full py-2.5 rounded-full text-sm font-semibold border border-menti-border text-menti-text-primary hover:bg-menti-surface-sunken transition-colors cursor-pointer">Log out</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="w-full py-2.5 rounded-full text-sm font-semibold border border-menti-border text-center text-menti-text-primary hover:bg-menti-surface-sunken transition-colors">Log in</Link>
                  <Link to="/signup" onClick={() => setMobileOpen(false)} className="w-full py-2.5 rounded-full text-sm font-semibold bg-menti-brand text-white text-center hover:bg-menti-brand-hover transition-colors">Sign up</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
