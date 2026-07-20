import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPersonDetails, getPersonCombinedCredits, img342 } from '../api/tmdb';
import MovieCard from './MovieCard';
import Nav from './Nav';

export default function ActorDetails() {
  const { id } = useParams();
  const [person, setPerson] = useState(null);
  const [knownFor, setKnownFor] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const [details, credits] = await Promise.all([
          getPersonDetails(id),
          getPersonCombinedCredits(id),
        ]);
        if (cancelled) return;
        setPerson(details);

        const seen = new Set();
        const sorted = (credits.cast || [])
          .filter(c => {
            const key = `${c.media_type}-${c.id}`;
            if (seen.has(key) || !c.poster_path) return false;
            seen.add(key);
            return true;
          })
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .slice(0, 18);
        setKnownFor(sorted);
      } catch {
        if (!cancelled) setError('Could not load this person.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [id]);

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

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row gap-10">
          <img
            src={img342(person.profile_path)}
            alt={person.name}
            className="w-full md:w-64 rounded-2xl shadow-2xl object-cover self-start"
          />
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{person.name}</h1>
            <div className="flex items-center gap-4 text-teal-400 mb-6 flex-wrap text-sm">
              {person.birthday && <span>Born {person.birthday}</span>}
              {person.place_of_birth && <span>• {person.place_of_birth}</span>}
              {person.known_for_department && <span>• {person.known_for_department}</span>}
            </div>
            <p className="text-lg text-neutral-300 leading-relaxed">
              {person.biography || 'No biography available.'}
            </p>
          </div>
        </div>

        {knownFor.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6 border-l-4 border-teal-500 pl-4">
              Known For
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {knownFor.map(item => (
                <MovieCard key={`${item.media_type}-${item.id}`} item={item} onTrailer={() => {}} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
