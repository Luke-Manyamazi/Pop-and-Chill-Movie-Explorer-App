import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPersonDetails, getPersonCombinedCredits, img342 } from '../api/tmdb';
import MovieCard from './MovieCard';
import Nav from './Nav';

function formatBiography(text) {
  if (!text) return ['No biography available.'];

  const cleaned = text
    .replace(/\s+/g, ' ')
    .replace(/\s*Description above from the Wikipedia article.*$/i, '')
    .trim();

  const sentences = cleaned.match(/[^.!?]+[.!?]+(?:\s|$)/g) || [cleaned];
  const paragraphs = [];

  for (let i = 0; i < sentences.length; i += 3) {
    paragraphs.push(sentences.slice(i, i + 3).join(' ').trim());
  }

  return paragraphs.filter(Boolean);
}

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

  const biographyParagraphs = formatBiography(person.biography);

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      <Nav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button
          type="button"
          onClick={() => navigate('/', { state: { category: 'person' } })}
          className="mb-6 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-teal-400/40 hover:bg-white/10 hover:text-white"
        >
          ← Back to actors
        </button>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent shadow-2xl">
          <div className="flex flex-col md:flex-row gap-8 p-6 sm:p-8 lg:p-10">
            <div className="w-full md:w-64 lg:w-72 shrink-0">
              {person.profile_path ? (
                <img
                  src={img342(person.profile_path)}
                  alt={person.name}
                  className="w-full rounded-2xl object-cover shadow-2xl"
                />
              ) : (
                <div className="aspect-[2/3] grid place-items-center rounded-2xl bg-neutral-800 text-neutral-500">
                  No Photo
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-6">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">
                  Actor profile
                </p>
                <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{person.name}</h1>
              </div>

              <div className="mb-6 grid gap-3 text-sm sm:grid-cols-3">
                {person.birthday && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Born</p>
                    <p className="mt-1 font-semibold text-white">{person.birthday}</p>
                  </div>
                )}
                {person.place_of_birth && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Place of birth</p>
                    <p className="mt-1 font-semibold text-white">{person.place_of_birth}</p>
                  </div>
                )}
              </div>

              <div className="mb-8 flex flex-wrap gap-3">
                {person.known_for_department && (
                  <span className="inline-flex items-center rounded-full bg-teal-500/15 px-4 py-2 text-sm font-semibold text-teal-200 ring-1 ring-inset ring-teal-400/20">
                    {person.known_for_department}
                  </span>
                )}
                {person.popularity != null && (
                  <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/70">
                    Popularity {person.popularity.toFixed(1)}
                  </span>
                )}
              </div>

              <div className="max-w-4xl">
                <h2 className="mb-4 text-xl font-bold">About {person.name}</h2>
                <div className="space-y-5 text-[15px] leading-8 text-neutral-300 sm:text-base">
                  {biographyParagraphs.map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {knownFor.length > 0 && (
          <section className="mt-16">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">Filmography</p>
                <h2 className="mt-1 text-2xl font-bold sm:text-3xl">Known For</h2>
              </div>
              <span className="text-sm text-white/40">{knownFor.length} titles</span>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
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
