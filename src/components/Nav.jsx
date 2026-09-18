import { useLocation, useNavigate } from 'react-router-dom';
import { Show, SignInButton, UserButton } from '@clerk/react';

export default function Nav({ activeCategory }) {
  const navigate = useNavigate();
  const location = useLocation();

  const loadTrending = (category) => {
    navigate('/', { state: { category } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const links = [
    ['Movies', 'movie'],
    ['TV Shows', 'tv'],
    ['Actors', 'person'],
  ];

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-white/10 bg-gray-950/80 px-4 py-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <button type="button" onClick={() => loadTrending('all')} className="shrink-0 text-left">
          <span className="block text-lg font-black tracking-tight sm:text-xl">🍿 Pop & Chill</span>
          <span className="hidden text-[10px] font-medium uppercase tracking-[0.22em] text-teal-300 sm:block">Movie Explorer</span>
        </button>

        <div className="flex items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/5 p-1">
          {links.map(([label, category]) => {
            const active = location.pathname === '/' && (activeCategory ? activeCategory === category : location.state?.category === category);
            return (
              <button key={category} type="button" onClick={() => loadTrending(category)} className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold transition sm:px-4 sm:text-sm ${active ? 'bg-teal-500 text-white' : 'text-white/65 hover:bg-white/10 hover:text-white'}`}>
                {label}
              </button>
            );
          })}
          <Show when="signed-out">
            <SignInButton mode="redirect">
              <button type="button" className="whitespace-nowrap rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-teal-400/40 hover:bg-white/10 hover:text-white sm:px-4 sm:text-sm">
                Sign in
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <button type="button" onClick={() => navigate('/watchlist')} className="whitespace-nowrap rounded-full bg-teal-500/15 px-3 py-2 text-xs font-semibold text-teal-200 transition hover:bg-teal-500/25 hover:text-white sm:px-4 sm:text-sm">
              ♥ My List
            </button>
            <UserButton
              userProfileMode="navigation"
              userProfileUrl="/account"
              appearance={{ elements: { avatarBox: 'h-9 w-9' } }}
            />
          </Show>
        </div>
      </div>
    </nav>
  );
}
