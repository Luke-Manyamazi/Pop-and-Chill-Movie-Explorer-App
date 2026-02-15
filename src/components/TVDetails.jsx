import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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

export default function TVDetails() {
  const { id } = useParams();
  const [tv, setTV] = useState(null);
  const [cast, setCast] = useState([]);
  const [episodes, setEpisodes] = useState([]);
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

        let allEpisodes = [];
        // Only fetch first season by default to prevent massive API spam/slowdown
        // or loop through existing seasons safely
        if (details.seasons && details.seasons.length > 0) {
          const seasonOne = await getTVEpisodes(
            id,
            details.seasons[0].season_number,
          );
          allEpisodes = seasonOne.episodes || [];
        }
        setEpisodes(allEpisodes);
      } catch (e) {
        setError("Could not load TV details. This might be a movie ID.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

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
            <button
              onClick={openTrailer}
              className="px-8 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 font-bold transition-transform active:scale-95"
            >
              Watch Trailer
            </button>
          </div>
        </div>

        {/* Episodes Section */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6 border-l-4 border-teal-500 pl-4">
            Episodes (Season 1)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {episodes.map((ep) => (
              <div
                key={ep.id}
                className="bg-neutral-800/50 rounded-xl overflow-hidden border border-white/5 hover:border-teal-500/50 transition-colors"
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
                  {/* FIXED COLOR: text-white instead of text-black */}
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
