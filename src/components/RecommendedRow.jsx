import { useEffect, useState } from 'react';
import { getRecommendations, getSimilar } from '../api/tmdb';
import MovieCard from './MovieCard';

export default function RecommendedRow({ media, id, onTrailer }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      try {
        let data = await getRecommendations(media, id);
        if (!data.results?.length) data = await getSimilar(media, id);
        if (!cancelled) setItems((data.results || []).slice(0, 10).map(r => ({ ...r, media_type: media })));
      } catch {
        if (!cancelled) setItems([]);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [media, id]);

  if (items.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold mb-6 border-l-4 border-teal-500 pl-4">
        You Might Also Like
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {items.map(item => (
          <MovieCard key={item.id} item={item} onTrailer={onTrailer} />
        ))}
      </div>
    </section>
  );
}
