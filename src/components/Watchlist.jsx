import { useMemo, useState } from 'react';
import Nav from './Nav';
import MovieCard from './MovieCard';
import TrailerModal from './TrailerModal';
import { useWatchlist } from '../context/WatchlistContext';
import { getVideos, pickYouTubeTrailer } from '../api/tmdb';

export default function Watchlist() {
  const { items } = useWatchlist();
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('added');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [youTubeKey, setYouTubeKey] = useState(null);

  const counts = useMemo(() => ({
    all: items.length,
    movie: items.filter(item => item.media_type === 'movie').length,
    tv: items.filter(item => item.media_type === 'tv').length,
  }), [items]);

  const visibleItems = useMemo(() => {
    const filtered = filter === 'all' ? [...items] : items.filter(item => item.media_type === filter);
    if (sort === 'title') return filtered.sort((a, b) => (a.title || a.name || '').localeCompare(b.title || b.name || ''));
    if (sort === 'rating') return filtered.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
    return filtered.reverse();
  }, [items, filter, sort]);

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

  const tabs = [['all', 'All'], ['movie', 'Movies'], ['tv', 'TV Shows']];

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      <Nav />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Your collection</span>
            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">My List</h1>
            <p className="mt-2 text-white/55">Everything you saved for your next movie night.</p>
          </div>
          {items.length > 0 && <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">{items.length} {items.length === 1 ? 'title' : 'titles'} saved</div>}
        </header>

        {items.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-6 py-16 text-center">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-teal-500/10 text-3xl">🍿</div>
            <h2 className="text-2xl font-bold">Your list is empty</h2>
            <p className="mx-auto mt-2 max-w-md text-white/55">Save movies and TV shows while you browse and they’ll appear here for your next watch.</p>
            <button type="button" onClick={() => window.location.assign('/')} className="mt-6 rounded-xl bg-teal-500 px-6 py-3 font-bold transition hover:bg-teal-400">Discover titles</button>
          </section>
        ) : (
          <>
            <div className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-1 overflow-x-auto rounded-full bg-white/5 p-1">
                {tabs.map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${filter === value ? 'bg-teal-500 text-white' : 'text-white/60 hover:text-white'}`}>
                    {label} <span className="ml-1 text-xs opacity-70">{counts[value]}</span>
                  </button>
                ))}
              </div>
              <select value={sort} onChange={e => setSort(e.target.value)} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-teal-500">
                <option value="added" className="bg-gray-900">Recently added</option>
                <option value="rating" className="bg-gray-900">Highest rated</option>
                <option value="title" className="bg-gray-900">Title A–Z</option>
              </select>
            </div>

            {visibleItems.length === 0 ? (
              <p className="py-12 text-center text-white/50">Nothing in this category yet.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 lg:gap-6">
                {visibleItems.map(item => <MovieCard key={`${item.media_type}-${item.id}`} item={item} onTrailer={openTrailer} />)}
              </div>
            )}
          </>
        )}
      </main>
      <TrailerModal open={modalOpen} onClose={() => setModalOpen(false)} youTubeKey={youTubeKey} title={modalTitle} />
    </div>
  );
}
