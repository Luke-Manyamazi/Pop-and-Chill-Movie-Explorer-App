import { useNavigate } from 'react-router-dom';
import { img342 } from '../api/tmdb';
import WatchlistButton from './WatchlistButton';

export default function MovieCard({ item, onTrailer }) {
  const navigate = useNavigate();
  const isActor = item.media_type === 'person' || item.known_for_department === 'Acting';
  const isTV = !isActor && (item.media_type === 'tv' || item.first_air_date);
  const title = isActor ? item.name : (item.title || item.name);
  const year = (isActor ? null : (isTV ? item.first_air_date : item.release_date))?.slice(0, 4);
  const img = img342(item.poster_path || item.profile_path);
  const mediaLabel = isActor ? 'Actor' : isTV ? 'TV' : 'Movie';

  function openDetails() {
    if (isActor) navigate(`/actor/${item.id}`);
    else if (isTV) navigate(`/tv/${item.id}`);
    else navigate(`/movie/${item.id}`);
  }

  return (
    <article className="group relative overflow-hidden rounded-2xl bg-neutral-900 shadow-soft ring-1 ring-white/10 transition duration-300 hover:-translate-y-1 hover:ring-teal-400/40">
      <div className="relative aspect-[2/3] overflow-hidden bg-neutral-800 cursor-pointer" onClick={openDetails}>
        {img ? <img src={img} alt={title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" /> : <div className="grid h-full place-items-center text-neutral-500">No Image</div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-80" />
        <div className="absolute left-3 top-3 flex gap-2">
          <span className="rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur">{mediaLabel}</span>
          {!isActor && item.vote_average > 0 && <span className="rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">★ {item.vote_average.toFixed(1)}</span>}
        </div>
        {!isActor && <WatchlistButton item={item} />}
        <div className="absolute inset-x-3 bottom-3 translate-y-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <button type="button" onClick={(e) => { e.stopPropagation(); openDetails(); }} className="w-full rounded-xl bg-white/95 px-3 py-2.5 text-sm font-bold text-black shadow-lg hover:bg-white">View Details</button>
        </div>
      </div>
      <div className="p-3.5">
        <button type="button" onClick={openDetails} className="block w-full truncate text-left font-semibold hover:text-teal-300" title={title}>{title}</button>
        <div className="mt-1 flex items-center justify-between text-sm text-neutral-400">
          <span>{year || '—'}</span>
          {!isActor && <button type="button" onClick={() => onTrailer(item)} className="font-semibold text-teal-300 hover:text-teal-200">▶ Trailer</button>}
        </div>
      </div>
    </article>
  );
}
