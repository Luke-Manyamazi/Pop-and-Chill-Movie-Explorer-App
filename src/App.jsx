import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { getTrending, getPopular, getTopRated, getUpcomingMovies, searchMulti, getDiscover, getVideos, pickYouTubeTrailer } from './api/tmdb';
import MovieCard from '../src/components/MovieCard';
import TrailerModal from '../src/components/TrailerModal';
import MovieDetails from '../src/components/MovieDetails';
import TVDetails from '../src/components/TVDetails';
import EpisodeDetails from '../src/components/EpisodeDetails';
import ActorDetails from '../src/components/ActorDetails';
import Watchlist from '../src/components/Watchlist';
import ErrorBoundary from '../src/components/ErrorBoundary';
import Nav from '../src/components/Nav';
import FilterBar from '../src/components/FilterBar';
import { SkeletonGrid } from '../src/components/SkeletonCard';

function ContentRow({ title, items, onTrailer }) {
  if (!items?.length) return null;

  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h3>
        <span className="text-xs uppercase tracking-widest text-neutral-500">Explore</span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.slice(0, 10).map(item => (
          <div key={item.id} className="min-w-[150px] sm:min-w-[180px] max-w-[180px] snap-start">
            <MovieCard item={item} onTrailer={onTrailer} />
          </div>
        ))}
      </div>
    </section>
  );
}

function AppMain() {
  const location = useLocation();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [discoverParams, setDiscoverParams] = useState(null);
  const [heroBackground, setHeroBackground] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [youTubeKey, setYouTubeKey] = useState(null);
  const [homeRows, setHomeRows] = useState({ popularMovies: [], popularTV: [], topMovies: [], topTV: [], upcoming: [] });

  const gridRef = useRef(null);
  const hasQuery = useMemo(() => query.trim().length > 0, [query]);

  const getRandomBackdrop = useCallback((results) => {
    if (!results || results.length === 0) return null;
    const itemWithBackdrop = results.find(r => r.backdrop_path) || results[0];
    return itemWithBackdrop ? `https://image.tmdb.org/t/p/original${itemWithBackdrop.backdrop_path}` : null;
  }, []);

  const loadTrending = useCallback(async (category = 'all', p = 1, append = false) => {
    setLoading(true);
    setError('');
    try {
      const data = await getTrending(category, 'week', p);
      setItems(prev => append ? [...prev, ...(data.results || [])] : (data.results || []));
      setPage(p);
      setActiveCategory(category);
      if (!append) setDiscoverParams(null);
      if (!append) setHeroBackground(getRandomBackdrop(data.results));
      return data;
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }, [getRandomBackdrop]);

  const runSearch = useCallback(async (p = 1, append = false) => {
    if (!hasQuery) return loadTrending('all', 1);
    setLoading(true);
    setError('');
    try {
      const data = await searchMulti(query, p);
      setItems(prev => append ? [...prev, ...(data.results || [])] : (data.results || []));
      setPage(p);
      setActiveCategory('search');
      if (!append) setHeroBackground(getRandomBackdrop(data.results));
      return data;
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }, [query, hasQuery, loadTrending, getRandomBackdrop]);

  const loadDiscover = useCallback(async (media, params, p = 1, append = false) => {
    setLoading(true);
    setError('');
    try {
      const data = await getDiscover(media, params, p);
      setItems(prev => append ? [...prev, ...(data.results || [])] : (data.results || []));
      setPage(p);
      setActiveCategory(media);
      setDiscoverParams(params);
      if (!append) setHeroBackground(getRandomBackdrop(data.results));
      return data;
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }, [getRandomBackdrop]);

  useEffect(() => {
    loadTrending();
    let cancelled = false;

    const loadHomeRows = async () => {
      try {
        const [popularMovies, popularTV, topMovies, topTV, upcoming] = await Promise.all([
          getPopular('movie'),
          getPopular('tv'),
          getTopRated('movie'),
          getTopRated('tv'),
          getUpcomingMovies(),
        ]);

        if (!cancelled) {
          setHomeRows({
            popularMovies: popularMovies.results || [],
            popularTV: popularTV.results || [],
            topMovies: topMovies.results || [],
            topTV: topTV.results || [],
            upcoming: upcoming.results || [],
          });
        }
      } catch {
        // The main trending feed remains usable if a secondary homepage row fails.
      }
    };

    loadHomeRows();
    return () => { cancelled = true; };
  }, [loadTrending]);

  useEffect(() => {
    if (location.state?.category) loadTrending(location.state.category);
  }, [location.state, loadTrending]);

  // Auto-search as the user types, paused while they're mid-keystroke
  useEffect(() => {
    if (!hasQuery) return;
    const t = setTimeout(() => runSearch(1), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const onSubmit = (e) => {
    e.preventDefault();
    runSearch(1);
  };

  const openTrailer = async (item) => {
    const media = item.media_type || (item.title ? 'movie' : 'tv');
    try {
      const videos = await getVideos(media, item.id);
      const key = pickYouTubeTrailer(videos);
      setYouTubeKey(key);
      setModalTitle(item.title || item.name || 'Trailer');
      setModalOpen(true);
    } catch {
      setYouTubeKey(null);
      setModalTitle('Trailer');
      setModalOpen(true);
    }
  };

  const loadMore = () => {
    const nextPage = page + 1;
    const previousHeight = gridRef.current?.scrollHeight || 0;
    const callback = () => window.scrollTo({ top: previousHeight, behavior: 'smooth' });

    if (activeCategory === 'search') runSearch(nextPage, true).then(callback);
    else if (discoverParams) loadDiscover(activeCategory, discoverParams, nextPage, true).then(callback);
    else loadTrending(activeCategory, nextPage, true).then(callback);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Nav />

      {/* Hero */}
      <section
        className="relative w-full overflow-hidden bg-cover bg-center py-24 sm:py-32 px-4 sm:px-8"
        style={{ backgroundImage: heroBackground ? `url(${heroBackground})` : 'linear-gradient(135deg, #0f172a, #0f766e)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/35" />
        <div className="relative max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-teal-300/30 bg-teal-400/10 px-3 py-1 text-sm font-medium text-teal-200 mb-5">
              🍿 Your movie night starts here
            </span>
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">
              Find something <span className="text-teal-400">worth watching.</span>
            </h2>
            <p className="text-base sm:text-xl text-white/75 mb-7 max-w-2xl">
              Discover movies, TV shows and actors, save your favourites and find your next watch.
            </p>
            <form onSubmit={onSubmit} className="flex flex-col sm:flex-row max-w-2xl gap-3">
              <input
                className="flex-1 rounded-xl px-5 py-3.5 bg-white text-black placeholder-black/45 focus:outline-none focus:ring-2 focus:ring-teal-400"
                placeholder="Search movies, TV shows, people..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                aria-label="Search movies, TV shows and people"
              />
              <button type="submit" className="px-7 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold transition-colors">
                Search
              </button>
            </form>
            <div className="flex flex-wrap gap-2 mt-5">
              {[
                ['Trending', 'all'],
                ['Movies', 'movie'],
                ['TV Shows', 'tv'],
                ['Actors', 'person'],
              ].map(([label, category]) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => loadTrending(category)}
                  className="rounded-full border border-white/15 bg-black/20 px-4 py-2 text-sm text-white/80 hover:border-teal-400/50 hover:text-teal-300 transition"
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => navigate('/watchlist')}
                className="rounded-full border border-white/15 bg-black/20 px-4 py-2 text-sm text-white/80 hover:border-teal-400/50 hover:text-teal-300 transition"
              >
                ♥ My List
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {(activeCategory === 'movie' || activeCategory === 'tv') && (
          <FilterBar
            key={activeCategory}
            media={activeCategory}
            active={!!discoverParams}
            onApply={(params) => loadDiscover(activeCategory, params, 1)}
            onClear={() => loadTrending(activeCategory)}
          />
        )}
        <section className="py-10">
          {activeCategory === 'all' && !hasQuery && !discoverParams && (
            <div className="mb-10 space-y-10">
              <ContentRow title="🔥 Popular Movies" items={homeRows.popularMovies} onTrailer={openTrailer} />
              <ContentRow title="📺 Popular TV Shows" items={homeRows.popularTV} onTrailer={openTrailer} />
              <ContentRow title="⭐ Top Rated Movies" items={homeRows.topMovies} onTrailer={openTrailer} />
              <ContentRow title="🏆 Top Rated TV Shows" items={homeRows.topTV} onTrailer={openTrailer} />
              <ContentRow title="🗓️ Upcoming Movies" items={homeRows.upcoming} onTrailer={openTrailer} />
            </div>
          )}

          {/* Display error */}
          {error && <p className="text-center py-4 text-red-500">{error}</p>}

          {loading && page === 1 ? (
            <SkeletonGrid />
          ) : items.length === 0 ? (
            <p className="text-center py-12 text-white/70">No results found.</p>
          ) : (
            <>
              <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {items.map(item => <MovieCard key={item.id} item={item} onTrailer={openTrailer} />)}
              </div>

              {/* Load More */}
              <div className="mt-8 px-4 sm:px-0">
                <button onClick={loadMore} className="w-full px-6 py-3 bg-teal-500 hover:bg-teal-600 rounded-lg font-semibold">
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer className="w-full bg-neutral-900/80 border-t border-white/10 mt-12 text-center text-sm text-neutral-400 py-4">
        <div className="flex flex-col items-center gap-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} Pop & Chill Mate. All rights reserved.</span>
          <span>Data provided by <a href="https://www.themoviedb.org/" className="underline hover:text-white" target="_blank" rel="noopener noreferrer">TMDb</a></span>
        </div>
      </footer>

      {/* Trailer Modal */}
      <TrailerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        youTubeKey={youTubeKey}
        title={modalTitle}
      />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<AppMain />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/tv/:id" element={<TVDetails />} />
          <Route path="/tv/:id/season/:season/episode/:episode" element={<EpisodeDetails />} />
          <Route path="/actor/:id" element={<ActorDetails />} />
          <Route path="/watchlist" element={<Watchlist />} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}
