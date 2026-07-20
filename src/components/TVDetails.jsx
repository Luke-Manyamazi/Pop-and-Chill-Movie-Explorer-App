import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getTVDetails,
  getTVEpisodes,
  getVideos,
  pickYouTubeTrailer,
  img342,
  getTVCredits,
} from "../api/tmdb";
import TrailerModal from "./TrailerModal";
import Nav from "./Nav";
import WatchlistButton from "./WatchlistButton";
import WatchProviders from "./WatchProviders";
import RecommendedRow from "./RecommendedRow";

export default function TVDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tv, setTV] = useState(null);
  const [cast, setCast] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodesLoading, setEpisodesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [youTubeKey, setYouTubeKey] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const details = await getTVDetails(id);
        setTV(details);

        // Fixed: Use getTVCredits specifically for TV
        const credits = await getTVCredits(id);
        setCast(credits.cast || []);

        const firstSeason = details.seasons?.find(s => s.season_number > 0) || details.seasons?.[0];
        if (firstSeason) {
          setSelectedSeason(firstSeason.season_number);
          const seasonData = await getTVEpisodes(id, firstSeason.season_number);
          setEpisodes(seasonData.episodes || []);
        }
      } catch {
        setError("Could not load TV details. This might be a movie ID.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  async function onSeasonChange(seasonNumber) {
    setSelectedSeason(Number(seasonNumber));
    setEpisodesLoading(true);
    try {
      const seasonData = await getTVEpisodes(id, seasonNumber);
      setEpisodes(seasonData.episodes || []);
    } catch {
      setEpisodes([]);
    } finally {
      setEpisodesLoading(false);
    }
  }

  async function openTrailer() {
    if (!tv) return;
    try {
      const videos = await getVideos("tv", id);
      const key = pickYouTubeTrailer(videos);
      setYouTubeKey(key);
      setModalOpen(true);
    } catch {
      setYouTubeKey(null);
      setModalOpen(true);
    }
  }

  async function openTrailerFor(item) {
    try {
      const videos = await getVideos(item.media_type, item.id);
      setYouTubeKey(pickYouTubeTrailer(videos));
    } catch {
      setYouTubeKey(null);
    }
    setModalOpen(true);
  }

  if (loading)
    return (
      <div className="min-h-screen bg-gray-900 grid place-items-center">
        <span className="loader" />
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen bg-gray-900 text-center py-20 text-red-500">
        {error}
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row gap-10">
          <img
            src={img342(tv.poster_path)}
            alt={tv.name}
            className="w-full md:w-80 rounded-2xl shadow-2xl object-cover self-start"
          />
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{tv.name}</h1>
            <div className="flex items-center gap-4 text-teal-400 mb-6">
              <span>{tv.first_air_date?.slice(0, 4)}</span>
              <span>•</span>
              <span>{tv.number_of_seasons} Seasons</span>
              <span className="bg-white/10 text-white px-2 py-1 rounded text-sm">
                ★ {tv.vote_average?.toFixed(1)}
              </span>
            </div>
            <p className="text-lg text-neutral-300 leading-relaxed mb-8">
              {tv.overview || "No overview available."}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={openTrailer}
                className="px-8 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 font-bold transition-transform active:scale-95"
              >
                Watch Trailer
              </button>
              <WatchlistButton item={{ ...tv, media_type: 'tv' }} variant="inline" />
            </div>
            <WatchProviders media="tv" id={id} />
          </div>
        </div>

        {/* Episodes Section */}
        <section className="mt-16">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h2 className="text-2xl font-bold border-l-4 border-teal-500 pl-4">
              Episodes
            </h2>
            {tv.seasons?.length > 1 && (
              <select
                value={selectedSeason}
                onChange={(e) => onSeasonChange(e.target.value)}
                className="bg-neutral-800 text-white text-sm rounded-lg px-3 py-2 border border-white/10"
              >
                {tv.seasons.filter(s => s.season_number > 0 || s.episode_count > 0).map((s) => (
                  <option key={s.id} value={s.season_number}>{s.name}</option>
                ))}
              </select>
            )}
          </div>
          {episodesLoading ? (
            <div className="grid place-items-center py-12"><span className="loader" /></div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {episodes.map((ep) => (
                <div
                  key={ep.id}
                  onClick={() => navigate(`/tv/${id}/season/${selectedSeason}/episode/${ep.episode_number}`)}
                  className="bg-neutral-800/50 rounded-xl overflow-hidden border border-white/5 hover:border-teal-500/50 transition-colors cursor-pointer"
                >
                  <div className="aspect-video relative bg-neutral-800">
                    {ep.still_path ? (
                      <img
                        src={img342(ep.still_path)}
                        alt={ep.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="grid place-items-center h-full text-xs text-neutral-500">
                        No Image
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs">
                      EP {ep.episode_number}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-white line-clamp-1">
                      {ep.name}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-2">
                      {ep.overview || "No description."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Cast Section */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6 border-l-4 border-teal-500 pl-4">
            Top Cast
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {cast.slice(0, 10).map((member) => (
              <div
                key={member.id}
                className="min-w-[140px] bg-neutral-800/30 rounded-xl p-2 text-center"
              >
                <img
                  src={img342(member.profile_path)}
                  alt={member.name}
                  className="w-full h-40 object-cover rounded-lg mb-2 bg-neutral-700"
                />
                <h3 className="text-sm font-semibold text-white line-clamp-1">
                  {member.name}
                </h3>
                <p className="text-xs text-neutral-500 line-clamp-1">
                  {member.character}
                </p>
              </div>
            ))}
          </div>
        </section>

        <RecommendedRow media="tv" id={id} onTrailer={openTrailerFor} />
      </div>

      <TrailerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        youTubeKey={youTubeKey}
        title={tv.name}
      />
    </div>
  );
}
