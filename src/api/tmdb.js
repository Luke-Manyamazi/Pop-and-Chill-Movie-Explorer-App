const API_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/';

export const img342 = (path) => (path ? `${IMG_BASE}w342${path}` : null);
export const img780 = (path) => (path ? `${IMG_BASE}w780${path}` : null);

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

async function get(path, params = {}) {
  const url = new URL(API_BASE + path);
  url.searchParams.set('api_key', API_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDb ${res.status}`);
  return res.json();
}

// Trending
export const getTrending = (media = 'all', window = 'week', page = 1) =>
  get(`/trending/${media}/${window}`, { page });

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

// Pick a YouTube trailer key
export function pickYouTubeTrailer(videos) {
  if (!videos?.results?.length) return null;
  const preferred = videos.results.find(v => v.site === 'YouTube' && v.type === 'Trailer');
  const anyYT = videos.results.find(v => v.site === 'YouTube');
  const chosen = preferred || anyYT || null;
  return chosen ? chosen.key : null;
}
