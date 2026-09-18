import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Nav from './Nav';
import MovieCard from './MovieCard';
import TrailerModal from './TrailerModal';
import { useHistory } from '../context/WatchlistContext';
import { getVideos, pickYouTubeTrailer } from '../api/tmdb';

export default function WatchHistory() {
  const { items, remove, clear } = useHistory();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [youTubeKey, setYouTubeKey] = useState(null);

  const visibleItems = useMemo(
    () => filter === 'all' ? items : items.filter(item => item.media_type === filter),
    [items, filter],
  );

  async function openTrailer(item) {
    try {
      const videos = await getVideos(item.media_type, item.id);
      setYouTubeKey(pickYouTubeTrailer(videos));
    } catch {
      setYouTubeKey(null);
    }
    setModalTitle(item.title || item.name || 'Trailer');
    setModalOpen(true);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Your activity</span>
            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">Watch History</h1>
            <p className="mt-2 text-white/55">Titles you recently opened on Pop & Chill.</p>
          </div>
          {items.length > 0 && (
            <button type="button" onClick={clear} className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:bg-red-400/20">
              Clear history
            </button>
          )}
        </header>

        {items.length > 0 && (
          <div className="mb-8 flex gap-1 rounded-full bg-white/5 p-1 w-fit">
            {[['all', 'All'], ['movie', 'Movies'], ['tv', 'TV Shows']].map(([value, label]) => (
              <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filter === value ? 'bg-teal-500 text-white' : 'text-white/60 hover:text-white'}`}>
                {label}
              </button>
            ))}
          </div>
        )}

        {visibleItems.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-teal-500/10 text-3xl">🕘</div>
            <h2 className="text-2xl font-bold">No history yet</h2>
            <p className="mx-auto mt-2 max-w-md text-white/55">Open a movie or TV show and it will appear here for quick access later.</p>
            <button type="button" onClick={() => navigate('/')} className="mt-6 rounded-xl bg-teal-500 px-6 py-3 font-bold transition hover:bg-teal-400">Discover titles</button>
          </section>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-6">
            {visibleItems.map(item => (
              <div key={`${item.media_type}-${item.id}`} className="relative">
                <MovieCard item={item} onTrailer={openTrailer} />
                <button type="button" onClick={() => remove(item)} className="absolute left-2 top-2 z-20 rounded-full bg-black/70 px-2.5 py-1 text-xs font-semibold text-white/80 backdrop-blur hover:bg-red-500/80 hover:text-white" title="Remove from history" aria-label={`Remove ${item.title || item.name} from history`}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </main>
      <TrailerModal open={modalOpen} onClose={() => setModalOpen(false)} youTubeKey={youTubeKey} title={modalTitle} />
    </div>
  );
}
