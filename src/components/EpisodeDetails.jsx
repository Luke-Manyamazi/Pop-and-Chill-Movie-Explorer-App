import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getEpisodeDetails,
  getTVEpisodes,
  getTVDetails,
  img342,
  img780,
} from '../api/tmdb';
import Nav from './Nav';

export default function EpisodeDetails() {
  const { id, season, episode } = useParams();
  const navigate = useNavigate();
  const [ep, setEp] = useState(null);
  const [seasonEpisodes, setSeasonEpisodes] = useState([]);
  const [show, setShow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      setError('');
      try {
        const [epDetails, seasonData, showDetails] = await Promise.all([
          getEpisodeDetails(id, season, episode),
          getTVEpisodes(id, season),
          getTVDetails(id),
        ]);
        if (cancelled) return;
        setEp(epDetails);
        setSeasonEpisodes(seasonData.episodes || []);
        setShow(showDetails);
      } catch {
        if (!cancelled) setError('Could not load this episode.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [id, season, episode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 grid place-items-center">
        <span className="loader" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-center py-20 text-red-500">
        {error}
      </div>
    );
  }

  const epNum = Number(episode);
  const seasonNum = Number(season);
  const currentIndex = seasonEpisodes.findIndex(e => e.episode_number === epNum);
  const prevEp = currentIndex > 0 ? seasonEpisodes[currentIndex - 1] : null;
  const nextEp = currentIndex >= 0 && currentIndex < seasonEpisodes.length - 1 ? seasonEpisodes[currentIndex + 1] : null;

  function goToEpisode(targetSeason, targetEpisode) {
    navigate(`/tv/${id}/season/${targetSeason}/episode/${targetEpisode}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      <Nav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button
          onClick={() => navigate(`/tv/${id}`)}
          className="text-teal-400 hover:text-teal-300 mb-6 inline-block"
        >
          ← Back to {show?.name || 'Show'}
        </button>

        <div className="aspect-video w-full rounded-2xl overflow-hidden bg-neutral-800 mb-6">
          {ep.still_path ? (
            <img src={img780(ep.still_path)} alt={ep.name} className="w-full h-full object-cover" />
          ) : (
            <div className="grid place-items-center h-full text-neutral-500">No Image</div>
          )}
        </div>

        <div className="flex items-center gap-3 mb-2 flex-wrap">
          {show?.seasons?.length > 1 && (
            <select
              value={seasonNum}
              onChange={e => goToEpisode(e.target.value, 1)}
              className="bg-neutral-800 text-white text-sm rounded-lg px-3 py-1 border border-white/10"
            >
              {show.seasons.filter(s => s.season_number > 0 || s.episode_count > 0).map(s => (
                <option key={s.id} value={s.season_number}>{s.name}</option>
              ))}
            </select>
          )}
          <span className="text-teal-400 text-sm">
            S{ep.season_number} · E{ep.episode_number}
          </span>
          {ep.air_date && <span className="text-neutral-400 text-sm">{ep.air_date}</span>}
          {typeof ep.vote_average === 'number' && ep.vote_average > 0 && (
            <span className="bg-white/10 text-white px-2 py-1 rounded text-xs">
              ★ {ep.vote_average.toFixed(1)}
            </span>
          )}
        </div>

        <h1 className="text-3xl font-bold mb-6">{ep.name}</h1>
        <p className="text-lg text-neutral-300 leading-relaxed mb-10">
          {ep.overview || 'No overview available for this episode.'}
        </p>

        <div className="flex items-center justify-between mb-16">
          <button
            disabled={!prevEp}
            onClick={() => prevEp && goToEpisode(seasonNum, prevEp.episode_number)}
            className="btn bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous Episode
          </button>
          <button
            disabled={!nextEp}
            onClick={() => nextEp && goToEpisode(seasonNum, nextEp.episode_number)}
            className="btn btn-primary disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next Episode →
          </button>
        </div>

        {ep.guest_stars?.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold mb-4 border-l-4 border-teal-500 pl-4">Guest Stars</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {ep.guest_stars.slice(0, 10).map(member => (
                <div key={member.credit_id} className="min-w-[120px] bg-neutral-800/30 rounded-xl p-2 text-center">
                  <img
                    src={img342(member.profile_path)}
                    alt={member.name}
                    className="w-full h-36 object-cover rounded-lg mb-2 bg-neutral-700"
                  />
                  <h3 className="text-sm font-semibold text-white line-clamp-1">{member.name}</h3>
                  <p className="text-xs text-neutral-500 line-clamp-1">{member.character}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {ep.crew?.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4 border-l-4 border-teal-500 pl-4">Crew</h2>
            <ul className="text-neutral-300 space-y-1">
              {ep.crew.slice(0, 8).map(member => (
                <li key={member.credit_id}>
                  <span className="text-white font-medium">{member.name}</span>
                  <span className="text-neutral-500"> — {member.job}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
