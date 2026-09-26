import { useEffect, useState } from 'react';
import { getRecommendations, getSimilar } from '../api/tmdb';
import MovieCard from './MovieCard';
import LoadingState from './LoadingState';

export default function RecommendedRow({ media, id, onTrailer }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError('');

      try {
        let data = await getRecommendations(media, id);

        if (!data.results?.length) {
          data = await getSimilar(media, id);
        }

        if (!cancelled) {
          setItems(
            (data.results || [])
              .slice(0, 10)
              .map((r) => ({ ...r, media_type: media }))
          );
        }
      } catch (e) {
        if (!cancelled) {
          setItems([]);
          setError(e.message || 'Recommendations are temporarily unavailable.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [media, id]);

  if (loading) {
    return (
      <section className="mt-16">
        <LoadingState
          title="Finding something you might like..."
          message="Looking for more titles similar to this one."
        />
      </section>
    );
  }

  if (items.length === 0 && !error) return null;

  return (
    <section className="mt-16">
      <h2 className="mb-6 border-l-4 border-teal-500 pl-4 text-2xl font-bold">
        You Might Also Like
      </h2>

      {error ? (
        <p className="text-sm text-white/45">{error}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {items.map((item) => (
            <MovieCard key={item.id} item={item} onTrailer={onTrailer} />
          ))}
        </div>
      )}
    </section>
  );
}
