import { useState } from 'react';
import Nav from './Nav';
import MovieCard from './MovieCard';
import TrailerModal from './TrailerModal';
import { useWatchlist } from '../context/WatchlistContext';
import { getVideos, pickYouTubeTrailer } from '../api/tmdb';

export default function Watchlist() {
  const { items } = useWatchlist();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [youTubeKey, setYouTubeKey] = useState(null);

  async function openTrailer(item) {
    try {
      const videos = await getVideos(item.media_type, item.id);
      setYouTubeKey(pickYouTubeTrailer(videos));
    } catch {
      setYouTubeKey(null);
    }
    setModalTitle(item.title || item.name || 'Trailer');
    setModalOpen(true);
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold mb-8 border-l-4 border-teal-500 pl-4">My Watchlist</h1>
        {items.length === 0 ? (
          <p className="text-neutral-400">
            Nothing saved yet — tap the ☆ on any poster to add it here.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {items.map(item => (
              <MovieCard key={`${item.media_type}-${item.id}`} item={item} onTrailer={openTrailer} />
            ))}
          </div>
        )}
      </div>
      <TrailerModal open={modalOpen} onClose={() => setModalOpen(false)} youTubeKey={youTubeKey} title={modalTitle} />
    </div>
  );
}
