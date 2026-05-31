import { Link } from 'react-router-dom';

const footerLinks = {
  Features: ['Overview', 'AI Quiz Generator', 'Live Polling', 'Word Cloud', 'Quiz', 'Q&A', 'Survey'],
  Resources: ['Blog', 'How to', 'Templates', 'Academy', 'Webinars'],
  Details: ['Legal', 'Policies', 'Accessibility', 'Help Center', 'Requirements'],
  'About us': ['Press Info', 'The Team', 'Jobs', 'Culture', 'Contact us'],
};

export default function Footer() {
  return (
    <footer className="w-full bg-menti-brand text-white">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 pt-16 pb-8">
        {/* Link Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 mb-12">
          {Object.entries(footerLinks).map(([heading, links]) => (
            <div key={heading}>
              <h3 className="font-body font-semibold text-base mb-4">{heading}</h3>
              <ul className="flex flex-col gap-2.5">
                {links.map(link => (
                  <li key={link}>
                    <Link to="#" className="text-sm opacity-85 hover:opacity-100 transition-opacity">{link}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Language + Social */}
          <div>
            <h3 className="font-body font-semibold text-base mb-4">Choose your language</h3>
            <button className="px-5 py-2 rounded-full border border-white/40 text-sm font-semibold hover:bg-white/10 transition-colors cursor-pointer mb-8">
              English <span className="ml-1">▾</span>
            </button>
            <h3 className="font-body font-semibold text-base mb-3">Connect with us!</h3>
            <div className="flex gap-2.5">
              {['IG', 'TT', 'In', 'Fb', 'YT'].map(icon => (
                <div key={icon} className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center text-xs font-semibold hover:bg-white/10 transition-colors cursor-pointer">{icon}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Giant Brand Text */}
        <div className="border-t border-white/20 pt-8 overflow-hidden">
          <p className="font-hero text-center text-white" style={{ fontSize: 'clamp(60px, 14vw, 200px)', lineHeight: 0.9 }}>Quizora</p>
        </div>
      </div>
    </footer>
  );
}
