import { useEffect, useState } from 'react';
import { getWatchProviders, img342 } from '../api/tmdb';

function detectRegion() {
  const locale = navigator.language || 'en-US';
  const parts = locale.split('-');
  return (parts[1] || 'US').toUpperCase();
}

function ProviderGroup({ label, providers }) {
  if (!providers?.length) return null;
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">{label}</p>
      <div className="flex flex-wrap gap-3">
        {providers.map(p => (
          <img
            key={p.provider_id}
            src={img342(p.logo_path)}
            alt={p.provider_name}
            title={p.provider_name}
            className="w-12 h-12 rounded-lg object-cover"
          />
        ))}
      </div>
    </div>
  );
}

export default function WatchProviders({ media, id }) {
  const [region, setRegion] = useState(null);
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setLoading(true);
      try {
        const data = await getWatchProviders(media, id);
        const detected = detectRegion();
        const entry = data.results?.[detected] || data.results?.US || null;
        if (!cancelled) {
          setRegion(entry);
          setLink(entry?.link || null);
        }
      } catch {
        if (!cancelled) setRegion(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [media, id]);

  if (loading) return null;

  const hasAny = region && (region.flatrate?.length || region.rent?.length || region.buy?.length);

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-neutral-400 mb-3">Where to Watch</h3>
      {!hasAny ? (
        <p className="text-sm text-neutral-500">Not currently available to stream in your region.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <ProviderGroup label="Stream" providers={region.flatrate} />
          <ProviderGroup label="Rent" providers={region.rent} />
          <ProviderGroup label="Buy" providers={region.buy} />
        </div>
      )}
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-neutral-500 hover:text-teal-400 underline inline-block mt-3"
        >
          Data provided by JustWatch
        </a>
      )}
    </div>
  );
}
