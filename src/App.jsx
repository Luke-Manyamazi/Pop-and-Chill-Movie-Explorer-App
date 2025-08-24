import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { getTrending, searchMulti, getVideos, pickYouTubeTrailer } from './api/tmdb';
import MovieCard from '../src/components/MovieCard';
import TrailerModal from '../src/components/TrailerModal';
import MovieDetails from '../src/components/MovieDetails';
import TVDetails from '../src/components/TVDetails';

function AppMain() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
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

  useEffect(() => {
    loadTrending();
  }, [loadTrending]);

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
    else loadTrending(activeCategory, nextPage, true).then(callback);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Nav */}
      <nav className="w-full flex flex-col sm:flex-row items-center sm:justify-between py-4 border-b border-white/10 gap-4 sm:gap-0 px-4 sm:px-6 lg:px-8">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight hover:cursor-pointer" onClick={() => loadTrending('all')}>🍿 Pop & Chill Mate  |  Movie Explorer</h1>
        <ul className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6 text-sm sm:text-base">
          <li><button onClick={() => loadTrending('movie')} className="hover:text-teal-400">Movies</button></li>
          <li><button onClick={() => loadTrending('tv')} className="hover:text-teal-400">TV Shows</button></li>
          <li><button onClick={() => loadTrending('person')} className="hover:text-teal-400">Actors</button></li>
        </ul>
      </nav>

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
        <section className="py-10">
          {/* Display error */}
          {error && <p className="text-center py-4 text-red-500">{error}</p>}

          {loading && page === 1 ? (
            <div className="grid place-items-center py-12"><span className="loader" /></div>
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
      <Routes>
        <Route path="/" element={<AppMain />} />
        <Route path="/movie/:id" element={<MovieDetails />} />
        <Route path="/tv/:id" element={<TVDetails />} />
      </Routes>
    </Router>
  );
}
