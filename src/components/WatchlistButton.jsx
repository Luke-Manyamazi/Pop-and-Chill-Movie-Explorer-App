import { useAuth } from '@clerk/react';
import { useNavigate } from 'react-router-dom';
import { useWatchlist } from '../context/WatchlistContext';

export default function WatchlistButton({ item, variant = 'overlay' }) {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();
  const { isSaved, toggle } = useWatchlist();
  const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
  const saved = isSaved(item.id, mediaType);

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (!isSignedIn) {
      navigate('/sign-in');
      return;
    }

    toggle(item);
  }

  if (variant === 'inline') {
    return (
      <button
        onClick={onClick}
        className={`btn ${saved ? 'bg-white/20 hover:bg-white/30' : 'bg-white/10 hover:bg-white/20'}`}
        title={isSignedIn ? (saved ? 'Remove from watchlist' : 'Add to watchlist') : 'Sign in to add to watchlist'}
      >
        {saved ? '✓ In Watchlist' : '+ Watchlist'}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="absolute top-2 right-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/60 hover:bg-black/80 backdrop-blur transition-colors"
      title={isSignedIn ? (saved ? 'Remove from watchlist' : 'Add to watchlist') : 'Sign in to add to watchlist'}
      aria-label={isSignedIn ? (saved ? 'Remove from watchlist' : 'Add to watchlist') : 'Sign in to add to watchlist'}
    >
      <span className={saved ? 'text-teal-400' : 'text-white'}>{saved ? '★' : '☆'}</span>
    </button>
  );
}
