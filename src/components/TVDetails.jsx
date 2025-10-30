import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTVDetails, getCredits, getTVEpisodes, getVideos, pickYouTubeTrailer, img342 } from '../api/tmdb';
import TrailerModal from './TrailerModal';

export default function TVDetails() {
  const { id } = useParams();
  const [tv, setTV] = useState(null);
  const [cast, setCast] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [youTubeKey, setYouTubeKey] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const details = await getTVDetails(id);
        setTV(details);

        const credits = await getCredits('tv', id);
        setCast(credits.cast || []);

        let allEpisodes = [];
        for (const season of details.seasons || []) {
          const seasonEpisodes = await getTVEpisodes(id, season.season_number);
          allEpisodes.push(...(seasonEpisodes.episodes || []));
        }
        setEpisodes(allEpisodes);
      } catch (e) {
        setError(String(e.message || e));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  async function openTrailer() {
    if (!tv) return;
    try {
      const videos = await getVideos('tv', id);
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
  if (!tv) return <p className="text-center py-12">TV Show not found.</p>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <button
  onClick={() => navigate(-1)}
  className="mb-6 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg shadow"
>
  ← Back to TV Shows
</button>
      {/* TV Header */}
      <div className="flex flex-col sm:flex-row gap-6">
        <img
          src={img342(tv.poster_path)}
          alt={tv.name}
          className="w-full sm:w-1/3 rounded-2xl object-cover"
        />
        <div className="flex-1 text-white">
          <h1 className="text-3xl font-bold mb-2">{tv.name}</h1>
          <p className="text-sm text-neutral-400 mb-2">{tv.first_air_date?.slice(0,4)}</p>
          <p className="text-lg mb-4">{tv.overview}</p>
          <button
            onClick={openTrailer}
            className="px-6 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 font-semibold"
          >
            Watch Trailer
          </button>
        </div>
      </div>

      {/* Episodes */}
      <section className="mt-10">
        <h2 className="text-2xl font-semibold mb-4">Episodes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {episodes.map(ep => (
            <div key={ep.id} className="bg-neutral-900/60 rounded-xl overflow-hidden">
              <img src={img342(ep.still_path)} alt={ep.name} className="w-full h-40 object-cover" />
              <div className="p-2 text-black">
                <h3 className="font-semibold text-sm line-clamp-1">{ep.name}</h3>
                <p className="text-xs text-neutral-400">Season {ep.season_number}, Ep {ep.episode_number}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

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
        title={tv.name}
      />
    </div>
  );
}
