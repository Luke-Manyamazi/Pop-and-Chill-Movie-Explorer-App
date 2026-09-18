const API_BASE = '/api/tmdb';
const IMG_BASE = 'https://image.tmdb.org/t/p/';

export const img342 = (path) => (path ? `${IMG_BASE}w342${path}` : null);
export const img780 = (path) => (path ? `${IMG_BASE}w780${path}` : null);

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map();

async function get(path, params = {}) {
  const url = new URL(API_BASE, window.location.origin);
  url.searchParams.set('path', path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const key = url.toString();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDb ${res.status}`);
  const data = await res.json();
  cache.set(key, { data, ts: Date.now() });
  return data;
}

// Trending
export const getTrending = (media = 'all', window = 'week', page = 1) =>
  get(`/trending/${media}/${window}`, { page });

// Homepage discovery
export const getPopular = (media = 'movie', page = 1) => get(`/${media}/popular`, { page });
export const getTopRated = (media = 'movie', page = 1) => get(`/${media}/top_rated`, { page });
export const getUpcomingMovies = async (page = 1) => {
  const today = new Date().toISOString().slice(0, 10);
  return get('/discover/movie', {
    page,
    sort_by: 'primary_release_date.asc',
    'primary_release_date.gte': today,
    'vote_count.gte': 1,
  });
};

// Random popular title for Surprise Me
export const getRandomPopular = async () => {
  const media = Math.random() > 0.5 ? 'movie' : 'tv';
  const page = Math.floor(Math.random() * 5) + 1;
  const data = await get(`/${media}/popular`, { page });
  const results = (data.results || []).filter(item => item.poster_path);
  return results.length ? { ...results[Math.floor(Math.random() * results.length)], media_type: media } : null;
};

// Search
export const searchMulti = (q, page = 1) =>
  get('/search/multi', { query: q, page, include_adult: 'false' });

// Videos (trailers)
export const getVideos = (media, id) => get(`/${media}/${id}/videos`);

// Credits (cast & crew)
export const getCredits = (media, id) => get(`/${media}/${id}/credits`);

// Fetch movie details
export const getMovieDetails = (id) => get(`/movie/${id}`);

// Fetch TV show details
export const getTVDetails = (id) => get(`/tv/${id}`);

// Fetch TV show credits
export const getTVCredits = (id) => get(`/tv/${id}/credits`);

// Fetch TV show episodes
export const getTVEpisodes = (id, season) => get(`/tv/${id}/season/${season}`);

// Fetch a single episode's full details (overview, guest stars, crew)
export const getEpisodeDetails = (id, season, episode) =>
  get(`/tv/${id}/season/${season}/episode/${episode}`);

// Recommendations & similar titles
export const getRecommendations = (media, id, page = 1) =>
  get(`/${media}/${id}/recommendations`, { page });
export const getSimilar = (media, id, page = 1) =>
  get(`/${media}/${id}/similar`, { page });

// Where to watch (streaming/rent/buy providers by region)
export const getWatchProviders = (media, id) =>
  get(`/${media}/${id}/watch/providers`);

// Genres (for discover filters)
export const getGenres = (media) => get(`/genre/${media}/list`);

// Discover with filters (genre, year, min rating, sort)
export const getDiscover = (media, params = {}, page = 1) =>
  get(`/discover/${media}`, { page, ...params });

// Person (actor) details & combined credits
export const getPersonDetails = (id) => get(`/person/${id}`);
export const getPersonCombinedCredits = (id) => get(`/person/${id}/combined_credits`);

// Pick a YouTube trailer key
export function pickYouTubeTrailer(videos) {
  if (!videos?.results?.length) return null;
  const preferred = videos.results.find(v => v.site === 'YouTube' && v.type === 'Trailer');
  const anyYT = videos.results.find(v => v.site === 'YouTube');
  const chosen = preferred || anyYT || null;
  return chosen ? chosen.key : null;
}
