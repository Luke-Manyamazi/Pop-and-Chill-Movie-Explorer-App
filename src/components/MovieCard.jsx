import { useNavigate } from 'react-router-dom';
import { img342 } from '../api/tmdb';

export default function MovieCard({ item, onTrailer }) {
  const navigate = useNavigate();
  const isMovie = item.media_type === 'movie' || item.title;
  const isActor = item.media_type === 'person' || item.known_for_department === 'Acting';
  const title = isMovie ? item.title : item.name;
  const year = (isMovie ? item.release_date : item.first_air_date)?.slice(0, 4);
  const img = img342(item.poster_path || item.profile_path);

  function openDetails() {
    if (item.media_type === 'tv' || item.first_air_date) navigate(`/tv/${item.id}`);
    else if (item.media_type === 'movie' || item.release_date) navigate(`/movie/${item.id}`);
    else if (item.media_type === 'person') navigate(`/actor/${item.id}`);
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-neutral-900/60 shadow-soft w-full">
      {/* Image */}
      <div
        className="w-full aspect-[2/3] bg-neutral-800 cursor-pointer"
        onClick={openDetails}
      >
        {img ? (
          <img
            src={img}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-neutral-500">No Image</div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h4
            className="line-clamp-1 font-semibold cursor-pointer"
            title={title}
            onClick={openDetails}
          >
            {title}
          </h4>
          {item.vote_average && !isActor ? (
            <span className="text-xs rounded-md px-2 py-1 bg-white/10">
              ★ {item.vote_average.toFixed(1)}
            </span>
          ) : null}
        </div>
        <div className="text-sm text-neutral-400">{year ?? '—'}</div>

        {/* Watch Trailer only for movies or TV shows */}
        {!isActor && (
          <button
            className="btn btn-primary mt-2 w-full"
            onClick={() => onTrailer(item)}
          >
            Watch Trailer
          </button>
        )}
      </div>

      {/* Hover gradient */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-gradient-to-t from-black/60 to-transparent"></div>
    </div>
  );
}
