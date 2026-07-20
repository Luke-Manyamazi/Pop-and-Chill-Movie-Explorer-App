import { useEffect, useState } from 'react';
import { getGenres } from '../api/tmdb';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 60 }, (_, i) => CURRENT_YEAR - i);

export default function FilterBar({ media, onApply, onClear, active }) {
  const [genres, setGenres] = useState([]);
  const [genre, setGenre] = useState('');
  const [year, setYear] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sortBy, setSortBy] = useState('popularity.desc');

  useEffect(() => {
    let cancelled = false;
    getGenres(media).then(data => {
      if (!cancelled) setGenres(data.genres || []);
    }).catch(() => {
      if (!cancelled) setGenres([]);
    });
    return () => { cancelled = true; };
  }, [media]);

  function apply() {
    const params = { sort_by: sortBy };
    if (genre) params.with_genres = genre;
    if (minRating) params['vote_average.gte'] = minRating;
    if (year) params[media === 'movie' ? 'primary_release_year' : 'first_air_date_year'] = year;
    onApply(params);
  }

  function clear() {
    setGenre('');
    setYear('');
    setMinRating('');
    setSortBy('popularity.desc');
    onClear();
  }

  return (
    <div className="flex flex-wrap items-center gap-3 py-4">
      <select value={genre} onChange={e => setGenre(e.target.value)} className="bg-neutral-800 text-white text-sm rounded-lg px-3 py-2 border border-white/10">
        <option value="">Any Genre</option>
        {genres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
      </select>

      <select value={year} onChange={e => setYear(e.target.value)} className="bg-neutral-800 text-white text-sm rounded-lg px-3 py-2 border border-white/10">
        <option value="">Any Year</option>
        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>

      <select value={minRating} onChange={e => setMinRating(e.target.value)} className="bg-neutral-800 text-white text-sm rounded-lg px-3 py-2 border border-white/10">
        <option value="">Any Rating</option>
        {[9, 8, 7, 6, 5].map(r => <option key={r} value={r}>{r}+ ★</option>)}
      </select>

      <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-neutral-800 text-white text-sm rounded-lg px-3 py-2 border border-white/10">
        <option value="popularity.desc">Most Popular</option>
        <option value="vote_average.desc">Top Rated</option>
        <option value={media === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc'}>Newest</option>
        <option value="vote_count.desc">Most Voted</option>
      </select>

      <button onClick={apply} className="btn btn-primary">Apply Filters</button>
      {active && <button onClick={clear} className="btn bg-white/10 hover:bg-white/20">Clear</button>}
    </div>
  );
}
