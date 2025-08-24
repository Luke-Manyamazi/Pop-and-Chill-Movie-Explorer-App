import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMovieDetails, getCredits, getVideos, pickYouTubeTrailer, img342 } from '../api/tmdb';
import TrailerModal from './TrailerModal';

export default function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [cast, setCast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [youTubeKey, setYouTubeKey] = useState(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const details = await getMovieDetails(id);
        setMovie(details);
        const credits = await getCredits(id);
        setCast(credits.cast || []);
      } catch (e) {
        setError(String(e.message || e));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  async function openTrailer() {
    if (!movie) return;
    try {
      const videos = await getVideos('movie', id);
      const key = pickYouTubeTrailer(videos);
      setYouTubeKey(key);
      setModalOpen(true);
    } catch {
      setYouTubeKey(null);
      setModalOpen(true);
    }
  }

  if (loading) return <p className="text-center py-12">Loading...</p>;
  if (error) return <p className="text-center py-12 text-red-500">{error}</p>;
  if (!movie) return <p className="text-center py-12">Movie not found.</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Movie Header */}
      <div className="flex flex-col sm:flex-row gap-6">
        <img
          src={img342(movie.poster_path)}
          alt={movie.title}
          className="w-full sm:w-1/3 rounded-2xl object-cover"
        />
        <div className="flex-1 text-white">
          <h1 className="text-3xl font-bold mb-2">{movie.title}</h1>
          <p className="text-sm text-neutral-400 mb-2">{movie.release_date?.slice(0,4)}</p>
          <p className="text-lg mb-4">{movie.overview}</p>
          <button
            onClick={openTrailer}
            className="px-6 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 font-semibold"
          >
            Watch Trailer
          </button>
        </div>
      </div>

      {/* Cast */}
      <section className="mt-10">
        <h2 className="text-2xl font-semibold mb-4">Cast</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {cast.map(member => (
            <div key={member.id} className="bg-neutral-900/60 rounded-xl overflow-hidden text-center p-2">
              <img src={img342(member.profile_path)} alt={member.name} className="w-full h-40 object-cover rounded-lg mb-2" />
              <h3 className="text-sm font-semibold line-clamp-1">{member.name}</h3>
              <p className="text-xs text-neutral-400 line-clamp-1">{member.character}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trailer Modal */}
      <TrailerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        youTubeKey={youTubeKey}
        title={movie.title}
      />
    </div>
  );
}
