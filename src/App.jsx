import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { getTrending, searchMulti, getDiscover, getVideos, pickYouTubeTrailer } from './api/tmdb';
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
      <section className="w-full text-center py-32 px-4 sm:px-8 bg-cover bg-center relative transition-all duration-700 ease-in-out" style={{ backgroundImage: heroBackground ? `url(${heroBackground})` : 'linear-gradient(to right, #0ea5e9, #14b8a6)' }}>
        <div className="bg-black/50 p-6 rounded-1xl max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-bold mb-3 text-white">Welcome.</h2>
          <p className="text-lg sm:text-2xl text-white/90 mb-6">Millions of movies, TV shows and people to discover.</p>
          <form onSubmit={onSubmit} className="flex flex-col sm:flex-row max-w-xl mx-auto gap-3">
            <input
              className="flex-1 rounded-lg px-4 py-2 bg-white text-black placeholder-black/50 focus:outline-none w-full sm:w-auto"
              placeholder="Search movies, TV shows, people..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <button type="submit" className="px-6 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 font-semibold w-full sm:w-auto">Search</button>
          </form>
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
