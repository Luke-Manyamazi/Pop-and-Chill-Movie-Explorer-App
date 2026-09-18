import { useEffect, useMemo, useState } from 'react';
import { getGenres } from '../api/tmdb';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 60 }, (_, i) => CURRENT_YEAR - i);

const selectClass = 'rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition hover:border-white/20 focus:border-teal-400 focus:ring-2 focus:ring-teal-400/30';

export default function FilterBar({ media, onApply, onClear, active }) {
  const [genres, setGenres] = useState([]);
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [minRating, setMinRating] = useState('');
  const [gender, setGender] = useState('');
  const [sortBy, setSortBy] = useState('popularity.desc');

  useEffect(() => {
    let cancelled = false;
    const loadGenres = async () => {
      try {
        if (media === 'person') {
          const [movieGenres, tvGenres] = await Promise.all([getGenres('movie'), getGenres('tv')]);
          const merged = Array.from(new Map(
            [...(movieGenres.genres || []), ...(tvGenres.genres || [])].map(g => [g.id, g])
          ).values()).sort((a, b) => a.name.localeCompare(b.name));
          if (!cancelled) setGenres(merged);
        } else {
          const data = await getGenres(media);
          if (!cancelled) setGenres(data.genres || []);
        }
      } catch {
        if (!cancelled) setGenres([]);
      }
    };
    loadGenres();
    return () => { cancelled = true; };
  }, [media]);

  const activeCount = useMemo(() => media === 'person'
    ? [gender].filter(Boolean).length + (sortBy !== 'popularity.desc' ? 1 : 0)
    : [genre, year, minRating].filter(Boolean).length + (sortBy !== 'popularity.desc' ? 1 : 0),
    [media, genre, year, minRating, gender, sortBy]);

  function apply() {
    const params = { sort_by: sortBy };
    if (media === 'person') {
      if (gender) params.gender = gender;
      onApply(params);
      return;
    }
    if (genre) params.with_genres = genre;
    if (minRating) params['vote_average.gte'] = minRating;
    if (year) params.year = year;
    if (media !== 'person' && year) {
      params[media === 'movie' ? 'primary_release_year' : 'first_air_date_year'] = year;
      delete params.year;
    }
    onApply(params);
  }

  function clear() {
    setGenre('');
    setYear('');
    setMinRating('');
    setGender('');
    setSortBy('popularity.desc');
    onClear();
  }

  const label = media === 'movie' ? 'Movies' : media === 'tv' ? 'TV Shows' : 'Actors';

  return (
    <section className="py-5">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">Discover {label}</h2>
            <p className="text-xs text-white/40">
              {media === 'person' ? 'Filter by gender or sort actors by name, popularity and the ratings of their known-for work.' : 'Filter by genre, year, rating and popularity.'}
            </p>
          </div>
          {activeCount > 0 && <span className="rounded-full bg-teal-500/15 px-2.5 py-1 text-xs font-semibold text-teal-300">{activeCount} filter{activeCount === 1 ? '' : 's'} active</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {media === 'person' ? (
            <>
              <select value={gender} onChange={e => setGender(e.target.value)} className={selectClass} aria-label="Filter actors by gender">
                <option value="" className="bg-gray-900">Any Gender</option>
                <option value="1" className="bg-gray-900">Female</option>
                <option value="2" className="bg-gray-900">Male</option>
                <option value="3" className="bg-gray-900">Non-binary</option>
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={selectClass} aria-label="Sort actors">
                <option value="popularity.desc" className="bg-gray-900">Most Popular</option>
                <option value="name.asc" className="bg-gray-900">A–Z</option>
                <option value="name.desc" className="bg-gray-900">Z–A</option>
                <option value="known_for_rating.desc" className="bg-gray-900">Highest Rated Known For</option>
                <option value="known_for_votes.desc" className="bg-gray-900">Most Voted Known For</option>
              </select>
            </>
          ) : (
          <>
          <select value={genre} onChange={e => setGenre(e.target.value)} className={selectClass} aria-label="Filter by genre">
            <option value="" className="bg-gray-900">Any Genre</option>
            {genres.map(g => <option key={g.id} value={g.id} className="bg-gray-900">{g.name}</option>)}
          </select>
          <select value={year} onChange={e => setYear(e.target.value)} className={selectClass} aria-label="Filter by year">
            <option value="" className="bg-gray-900">Any Year</option>
            {YEARS.map(y => <option key={y} value={y} className="bg-gray-900">{y}</option>)}
          </select>
          <select value={minRating} onChange={e => setMinRating(e.target.value)} className={selectClass} aria-label="Filter by minimum rating">
            <option value="" className="bg-gray-900">Any Rating</option>
            {[9, 8, 7, 6, 5].map(r => <option key={r} value={r} className="bg-gray-900">{r}+ ★</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={selectClass} aria-label="Sort results">
            <option value="popularity.desc" className="bg-gray-900">Most Popular</option>
            <option value="vote_average.desc" className="bg-gray-900">Top Rated</option>
            <option value={media === 'person' ? 'known_for_date.desc' : media === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc'} className="bg-gray-900">Newest</option>
            <option value="vote_count.desc" className="bg-gray-900">Most Voted</option>
          </select>
          </>
          )}
          <button type="button" onClick={apply} className="btn btn-primary px-5">Apply</button>
          {(active || activeCount > 0) && <button type="button" onClick={clear} className="btn">Reset</button>}
        </div>
      </div>
    </section>
  );
}
