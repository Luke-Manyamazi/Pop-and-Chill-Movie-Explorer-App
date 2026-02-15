import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getMovieDetails,
  getCredits,
  getVideos,
  pickYouTubeTrailer,
  img342,
} from "../api/tmdb";
import TrailerModal from "./TrailerModal";
import Nav from "./Nav";

export default function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [youTubeKey, setYouTubeKey] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const details = await getMovieDetails(id);
        if (!details.title) throw new Error("Not a movie");
        setMovie(details);
        const credits = await getCredits("movie", id);
        setCast(credits.cast || []);
      } catch (e) {
        setError("Details not found. Check if this is a TV show.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  async function openTrailer() {
    if (!movie) return;
    try {
      const videos = await getVideos("movie", id);
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
    <div className="min-h-screen bg-gray-900 text-white">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row gap-10">
          <img
            src={img342(movie.poster_path)}
            alt={movie.title}
            className="w-full md:w-80 rounded-2xl shadow-2xl object-cover self-start"
          />
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{movie.title}</h1>
            <div className="flex items-center gap-4 text-teal-400 mb-6">
              <span>{movie.release_date?.slice(0, 4)}</span>
              <span>•</span>
              <span>{movie.runtime} min</span>
              <span className="bg-white/10 text-white px-2 py-1 rounded text-sm">
                ★ {movie.vote_average?.toFixed(1)}
              </span>
            </div>
            <p className="text-lg text-neutral-300 leading-relaxed mb-8">
              {movie.overview}
            </p>
            <button
              onClick={openTrailer}
              className="px-8 py-3 rounded-xl bg-teal-500 hover:bg-teal-600 font-bold transition-transform active:scale-95"
            >
              Watch Trailer
            </button>
          </div>
        </div>

        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6 border-l-4 border-teal-500 pl-4">
            Top Cast
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-4">
            {cast.slice(0, 12).map((member) => (
              <div
                key={member.id}
                className="bg-neutral-800/40 rounded-xl overflow-hidden p-2 text-center border border-white/5"
              >
                <img
                  src={img342(member.profile_path)}
                  alt={
                    member.name
                      ? `${member.name} as ${member.character}`
                      : "Cast member"
                  }
                  className="w-full h-44 object-cover rounded-lg mb-2"
                />
                <h3 className="text-sm font-semibold line-clamp-1">
                  {member.name}
                </h3>
                <p className="text-xs text-neutral-400 line-clamp-1">
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
        title={movie.title}
      />
    </div>
  );
}
