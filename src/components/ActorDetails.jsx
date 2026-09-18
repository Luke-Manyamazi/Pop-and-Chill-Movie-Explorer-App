import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPersonDetails, getPersonCombinedCredits, img342 } from '../api/tmdb';
import MovieCard from './MovieCard';
import Nav from './Nav';

export default function ActorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
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
      <div className="min-h-screen bg-gray-900 text-white">
        <Nav />
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="animate-pulse grid gap-8 md:grid-cols-[280px_1fr]">
            <div className="aspect-[2/3] rounded-3xl bg-neutral-800" />
            <div className="space-y-4 pt-4">
              <div className="h-10 w-2/3 rounded bg-neutral-800" />
              <div className="h-4 w-1/3 rounded bg-neutral-800" />
              <div className="h-24 rounded bg-neutral-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Nav />
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <div className="text-5xl">🎭</div>
          <h1 className="mt-4 text-2xl font-bold">We couldn't load this profile</h1>
          <p className="mt-2 text-white/50">{error}</p>
          <button type="button" onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-teal-500 px-5 py-3 font-semibold hover:bg-teal-400">Try again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button type="button" onClick={() => navigate('/', { state: { category: 'person' } })} className="mb-6 text-sm font-semibold text-white/60 hover:text-white">← Back</button>
        <div className="flex flex-col md:flex-row gap-10 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-6 sm:p-8">
          <div className="w-full md:w-64 shrink-0">
            {person.profile_path ? (
              <img src={img342(person.profile_path)} alt={person.name} className="w-full rounded-2xl shadow-2xl object-cover" />
            ) : (
              <div className="aspect-[2/3] grid place-items-center rounded-2xl bg-neutral-800 text-neutral-500">No Photo</div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{person.name}</h1>
            <div className="flex items-center gap-4 text-teal-400 mb-6 flex-wrap text-sm">
              {person.birthday && <span>Born {person.birthday}</span>}
              {person.place_of_birth && <span>• {person.place_of_birth}</span>}
              {person.known_for_department && <span>• {person.known_for_department}</span>}
            </div>
            <div className="mb-6 flex flex-wrap gap-2 text-xs">
              {person.known_for_department && <span className="rounded-full bg-teal-400/10 px-3 py-1 font-semibold text-teal-200">{person.known_for_department}</span>}
              {person.popularity && <span className="rounded-full bg-white/10 px-3 py-1 text-white/60">Popularity {person.popularity.toFixed(1)}</span>}
            </div>
            <p className="max-w-3xl text-base text-neutral-300 leading-relaxed">
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
                <MovieCard key={`${item.media_type}-${item.id}`} item={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
