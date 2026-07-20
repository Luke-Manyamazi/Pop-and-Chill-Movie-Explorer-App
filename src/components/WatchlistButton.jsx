import { useWatchlist } from '../context/WatchlistContext';

export default function WatchlistButton({ item, variant = 'overlay' }) {
  const { isSaved, toggle } = useWatchlist();
  const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
  const saved = isSaved(item.id, mediaType);

  function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    toggle(item);
  }

  if (variant === 'inline') {
    return (
      <button
        onClick={onClick}
        className={`btn ${saved ? 'bg-white/20 hover:bg-white/30' : 'bg-white/10 hover:bg-white/20'}`}
        title={saved ? 'Remove from watchlist' : 'Add to watchlist'}
      >
        {saved ? '✓ In Watchlist' : '+ Watchlist'}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="absolute top-2 right-2 z-10 grid h-8 w-8 place-items-center rounded-full bg-black/60 hover:bg-black/80 backdrop-blur transition-colors"
      title={saved ? 'Remove from watchlist' : 'Add to watchlist'}
    >
      <span className={saved ? 'text-teal-400' : 'text-white'}>{saved ? '★' : '☆'}</span>
    </button>
  );
}
