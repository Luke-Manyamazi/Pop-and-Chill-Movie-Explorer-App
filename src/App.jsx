import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { getTrending, getPopular, getTopRated, getUpcomingMovies, getRandomPopular, searchMulti, getDiscover, getVideos, pickYouTubeTrailer } from './api/tmdb';
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

function ContentRow({ title, items, onTrailer, onExplore, showArrows = false }) {
  const rowRef = useRef(null);

  if (!items?.length) return null;

  const scrollRow = (direction) => {
    rowRef.current?.scrollBy({
      left: direction * Math.max(rowRef.current.clientWidth * 0.8, 320),
      behavior: 'smooth',
    });
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4 gap-4">
        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h3>
        <div className="flex items-center gap-2 shrink-0">
          {showArrows && (
            <>
              <button
                type="button"
                onClick={() => scrollRow(-1)}
                aria-label={`Scroll ${title} left`}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-lg text-white/80 transition hover:border-teal-400/50 hover:bg-white/10 hover:text-white"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => scrollRow(1)}
                aria-label={`Scroll ${title} right`}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-lg text-white/80 transition hover:border-teal-400/50 hover:bg-white/10 hover:text-white"
              >
                ›
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onExplore}
            className="rounded-lg px-2 py-2 text-xs font-semibold uppercase tracking-widest text-teal-300 transition hover:bg-white/5 hover:text-teal-200"
          >
            See all →
          </button>
        </div>
      </div>
      <div
        ref={rowRef}
        className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
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
  const navigate = useNavigate();
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
  const [homeRows, setHomeRows] = useState({ trending: [], popularMovies: [], popularTV: [], topMovies: [], topTV: [], upcoming: [] });
  const [searchType, setSearchType] = useState('all');
  const [surpriseLoading, setSurpriseLoading] = useState(false);
  const [actorFilters, setActorFilters] = useState({});
  const [heroCopy, setHeroCopy] = useState({
    eyebrow: '🍿 Your movie night starts here',
    title: <>Find something <span className="text-teal-400">worth watching.</span></>,
    description: 'Discover movies, TV shows and actors, save your favourites and find your next watch.',
  });

  const gridRef = useRef(null);
  const hasQuery = useMemo(() => query.trim().length > 0, [query]);
  const visibleItems = useMemo(() => {
    if (activeCategory === 'search' && searchType !== 'all') {
      return items.filter(item => item.media_type === searchType);
    }
    if (activeCategory !== 'person') return items;

    const { with_genres, year, minRating, sort_by } = actorFilters;
    const filtered = items.filter(actor => {
      const works = actor.known_for || [];
      if (with_genres && !works.some(work => (work.genre_ids || []).includes(Number(with_genres)))) return false;
      if (year && !works.some(work => {
        const date = work.release_date || work.first_air_date || '';
        return date.startsWith(String(year));
      })) return false;
      if (minRating && !works.some(work => Number(work.vote_average || 0) >= Number(minRating))) return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sort_by === 'vote_average.desc') {
        const ar = Math.max(...(a.known_for || []).map(w => Number(w.vote_average || 0)), 0);
        const br = Math.max(...(b.known_for || []).map(w => Number(w.vote_average || 0)), 0);
        return br - ar;
      }
      if (sort_by === 'vote_count.desc') {
        const ac = Math.max(...(a.known_for || []).map(w => Number(w.vote_count || 0)), 0);
        const bc = Math.max(...(b.known_for || []).map(w => Number(w.vote_count || 0)), 0);
        return bc - ac;
      }
      if (sort_by === 'known_for_date.desc') {
        const date = actor => Math.max(...(actor.known_for || []).map(w => new Date(w.release_date || w.first_air_date || 0).getTime()), 0);
        return date(b) - date(a);
      }
      return (b.popularity || 0) - (a.popularity || 0);
    });
  }, [items, activeCategory, searchType, actorFilters]);

  const getRandomBackdrop = useCallback((results) => {
    const candidates = (results || []).filter(item => item?.backdrop_path || item?.profile_path);
    if (!candidates.length) return null;
    const item = candidates[Math.floor(Math.random() * candidates.length)];
    const path = item.backdrop_path || item.profile_path;
    return `https://image.tmdb.org/t/p/original${path}`;
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

  const loadActors = useCallback(async (p = 1, append = false) => {
    setLoading(true);
    setError('');
    try {
      const data = await getPopular('person', p);
      setItems(prev => append ? [...prev, ...(data.results || [])] : (data.results || []));
      setPage(p);
      setActiveCategory('person');
      setDiscoverParams(null);
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
    if (!location.state?.category) loadTrending();
    let cancelled = false;

    const loadHomeRows = async () => {
      try {
        const [trending, popularMovies, popularTV, topMovies, topTV, upcoming] = await Promise.all([
          getTrending('all', 'week'),
          getPopular('movie'),
          getPopular('tv'),
          getTopRated('movie'),
          getTopRated('tv'),
          getUpcomingMovies(),
        ]);

        if (!cancelled) {
          const unique = (results = []) => Array.from(new Map(results.filter(item => item?.poster_path).map(item => [item.id + '-' + (item.media_type || item.title || item.name), item])).values()).slice(0, 10);
          setHomeRows({
            trending: unique(trending.results),
            popularMovies: unique(popularMovies.results),
            popularTV: unique(popularTV.results),
            topMovies: unique(topMovies.results),
            topTV: unique(topTV.results),
            upcoming: unique(upcoming.results),
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
    if (!location.state?.category) return;
    const loadCategory = location.state.category === 'person'
      ? loadActors(1)
      : loadTrending(location.state.category);
    loadCategory.then(() => {
      navigate('/', { replace: true, state: null });
    });
  }, [location.state, loadTrending, loadActors, navigate]);

  // Auto-search as the user types, paused while they're mid-keystroke
  useEffect(() => {
    if (!hasQuery) return;
    const t = setTimeout(() => runSearch(1), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const explore = (media, params) => loadDiscover(media, params, 1);

  useEffect(() => {
    const copy = {
      all: {
        eyebrow: '🍿 Your movie night starts here',
        title: <>Find something <span className="text-teal-400">worth watching.</span></>,
        description: 'Discover movies, TV shows and actors, save your favourites and find your next watch.',
      },
      movie: {
        eyebrow: '🎬 Movie discovery',
        title: <>Find your next <span className="text-teal-400">great movie.</span></>,
        description: 'Browse popular films, explore new releases, filter by genre and rating, and build your watchlist.',
      },
      tv: {
        eyebrow: '📺 TV discovery',
        title: <>Your next <span className="text-teal-400">binge starts here.</span></>,
        description: 'Explore TV shows by genre, year, rating and popularity, then find something worth watching.',
      },
      person: {
        eyebrow: '🎭 Actor discovery',
        title: <>Meet the people behind the <span className="text-teal-400">stories.</span></>,
        description: 'Explore popular actors and discover them through the movies and TV shows they are known for.',
      },
      trending: {
        eyebrow: '🔥 Trending this week',
        title: <>See what everyone is <span className="text-teal-400">watching.</span></>,
        description: 'Catch the movies and TV shows gaining attention right now and find your next watch.',
      },
      search: {
        eyebrow: '🔎 Search Pop & Chill',
        title: <>Find exactly what you are <span className="text-teal-400">looking for.</span></>,
        description: 'Search across movies, TV shows and actors, then narrow the results to what interests you.',
      },
    };
    setHeroCopy(copy[activeCategory] || copy.all);
  }, [activeCategory]);

  const onSubmit = (e) => {
    e.preventDefault();
    runSearch(1);
  };

  const handleCategory = async (category) => {
    if (category === 'person') return loadActors(1);
    return loadTrending(category);
  };

  const surpriseMe = async () => {
    setSurpriseLoading(true);
    setError('');
    try {
      const item = await getRandomPopular();
      if (!item) throw new Error('No surprise title was available.');
      navigate(item.media_type === 'tv' ? '/tv/' + item.id : '/movie/' + item.id);
    } catch (e) {
      setError(e.message || 'Could not find a surprise title. Try again.');
    } finally {
      setSurpriseLoading(false);
    }
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

  const scrollToNewResults = (firstNewIndex) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const firstNewCard = gridRef.current?.querySelector(`[data-grid-index="${firstNewIndex}"]`);
        firstNewCard?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  };

  const loadMore = async () => {
    if (loading) return;

    const nextPage = page + 1;
    const firstNewIndex = visibleItems.length;

    try {
      if (activeCategory === 'person') await loadActors(nextPage, true);
      else if (activeCategory === 'search') await runSearch(nextPage, true);
      else if (discoverParams) await loadDiscover(activeCategory, discoverParams, nextPage, true);
      else await loadTrending(activeCategory, nextPage, true);

      scrollToNewResults(firstNewIndex);
    } catch {
      // Individual loaders already expose the error state.
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Nav activeCategory={activeCategory} />

      {/* Hero */}
      <section
        className="relative w-full overflow-hidden bg-cover bg-center py-24 sm:py-32 px-4 sm:px-8"
        style={{ backgroundImage: heroBackground ? `url(${heroBackground})` : 'linear-gradient(135deg, #0f172a, #0f766e)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/65 to-black/35" />
        <div className="relative max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-teal-300/30 bg-teal-400/10 px-3 py-1 text-sm font-medium text-teal-200 mb-5">
              {heroCopy.eyebrow}
            </span>
            <h2 className="text-4xl sm:text-6xl font-black tracking-tight mb-4">
              {heroCopy.title}
            </h2>
            <p className="text-base sm:text-xl text-white/75 mb-7 max-w-2xl">
              {heroCopy.description}
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
                  onClick={() => handleCategory(category)}
                  className="rounded-full border border-white/15 bg-black/20 px-4 py-2 text-sm text-white/80 hover:border-teal-400/50 hover:text-teal-300 transition"
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={surpriseMe}
                disabled={surpriseLoading}
                className="rounded-full border border-white/15 bg-black/20 px-4 py-2 text-sm font-semibold text-white/80 hover:border-teal-400/50 hover:text-teal-300 disabled:cursor-wait disabled:opacity-60 transition"
              >
                {surpriseLoading ? '🎲 Finding...' : '🎲 Surprise Me'}
              </button>
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
        {(activeCategory === 'movie' || activeCategory === 'tv' || activeCategory === 'person') && (
          <FilterBar
            key={activeCategory}
            media={activeCategory}
            active={!!discoverParams}
            onApply={(params) => {
              if (activeCategory === 'person') {
                const nextFilters = {
                  with_genres: params.with_genres || '',
                  year: params.year || '',
                  minRating: params['vote_average.gte'] || '',
                  sort_by: params.sort_by || 'popularity.desc',
                };
                setActorFilters(nextFilters);
                setPage(1);
                setLoading(true);
                setError('');
                Promise.all([1, 2, 3, 4, 5].map(actorPage => getPopular('person', actorPage)))
                  .then(pages => {
                    const combined = pages.flatMap(data => data.results || []);
                    const unique = Array.from(new Map(combined.map(actor => [actor.id, actor])).values());
                    setItems(unique);
                    setActiveCategory('person');
                    setDiscoverParams(null);
                    setHeroBackground(getRandomBackdrop(unique));
                  })
                  .catch(e => setError(String(e.message || e)))
                  .finally(() => setLoading(false));
              } else {
                loadDiscover(activeCategory, params, 1);
              }
            }}
            onClear={() => {
              if (activeCategory === 'person') {
                setActorFilters({});
                loadActors(1);
              } else {
                loadTrending(activeCategory);
              }
            }}
          />
        )}
        <section className="py-10">
          {activeCategory === 'all' && !hasQuery && !discoverParams && (
            <div className="mb-10 space-y-10">
              <ContentRow
                title="🔥 Trending This Week"
                items={homeRows.trending}
                onTrailer={openTrailer}
                onExplore={() => {
                  setItems(homeRows.trending);
                  setPage(1);
                  setActiveCategory('trending');
                  setDiscoverParams(null);
                  setHeroBackground(getRandomBackdrop(homeRows.trending));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                showArrows
              />
              <ContentRow title="🎬 Popular Movies" items={homeRows.popularMovies} onTrailer={openTrailer} onExplore={() => explore('movie', { sort_by: 'popularity.desc' })} />
              <ContentRow title="📺 Popular TV Shows" items={homeRows.popularTV} onTrailer={openTrailer} onExplore={() => explore('tv', { sort_by: 'popularity.desc' })} />
              <ContentRow title="⭐ Top Rated Movies" items={homeRows.topMovies} onTrailer={openTrailer} onExplore={() => explore('movie', { sort_by: 'vote_average.desc', 'vote_count.gte': 200 })} />
              <ContentRow title="🏆 Top Rated TV Shows" items={homeRows.topTV} onTrailer={openTrailer} onExplore={() => explore('tv', { sort_by: 'vote_average.desc', 'vote_count.gte': 100 })} />
              <ContentRow title="🗓️ Upcoming Movies" items={homeRows.upcoming} onTrailer={openTrailer} onExplore={() => explore('movie', { sort_by: 'primary_release_date.asc', 'primary_release_date.gte': new Date().toISOString().slice(0, 10) })} />
            </div>
          )}

          {activeCategory === 'trending' && (
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-teal-300">Weekly discovery</p>
                <h3 className="text-2xl sm:text-3xl font-bold">🔥 Trending This Week</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('all');
                  setItems([]);
                  setHeroBackground(getRandomBackdrop(homeRows.trending));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                ← Home
              </button>
            </div>
          )}

          {hasQuery && activeCategory === 'search' && (
            <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-teal-300">Search results</p>
                  <h3 className="text-lg font-bold">Results for “{query.trim()}”</h3>
                </div>
                <button type="button" onClick={() => { setQuery(''); setSearchType('all'); loadTrending('all'); }} className="rounded-lg px-3 py-2 text-xs font-semibold text-white/60 hover:bg-white/10 hover:text-white">Clear search</button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
              {[['all', 'All'], ['movie', 'Movies'], ['tv', 'TV Shows'], ['person', 'Actors']].map(([value, label]) => (
                <button key={value} type="button" onClick={() => setSearchType(value)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${searchType === value ? 'bg-teal-500 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
                  {label}
                </button>
              ))}
                <span className="ml-auto px-3 text-xs text-white/40">{visibleItems.length} shown</span>
              </div>
            </div>
          )}

          {error && (
            <div role="alert" className="mx-auto mb-6 max-w-2xl rounded-2xl border border-red-400/20 bg-red-400/10 p-5 text-center">
              <p className="font-semibold text-red-200">Something went wrong</p>
              <p className="mt-1 text-sm text-red-200/70">{error}</p>
              <button type="button" onClick={() => activeCategory === 'search' ? runSearch(page) : discoverParams ? loadDiscover(activeCategory, discoverParams, page) : loadTrending(activeCategory, page)} className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20">Try again</button>
            </div>
          )}

          {loading && page === 1 ? (
            <SkeletonGrid />
          ) : !loading && activeCategory === 'search' && hasQuery && visibleItems.length === 0 ? (
            <div className="mx-auto max-w-xl py-16 text-center">
              <div className="text-5xl">🔎</div>
              <h3 className="mt-4 text-xl font-bold">No matches found</h3>
              <p className="mt-2 text-sm text-white/50">Try a different title, actor, or search category.</p>
            </div>
          ) : !loading && items.length === 0 ? (
            <div className="py-16 text-center text-white/60"><div className="text-4xl">🍿</div><p className="mt-3">Nothing to show yet. Try another discovery option.</p></div>
          ) : (
            <>
              <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {visibleItems.map((item, index) => (
                  <div key={`${item.media_type || 'item'}-${item.id}-${index}`} data-grid-index={index}>
                    <MovieCard item={item} onTrailer={openTrailer} />
                  </div>
                ))}
              </div>

              {/* Load More */}
              {activeCategory !== 'trending' && (
                <div className="mt-8 px-4 sm:px-0">
                  <button onClick={loadMore} disabled={loading} className="w-full px-6 py-3 bg-teal-500 hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50 rounded-lg font-semibold">
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
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
