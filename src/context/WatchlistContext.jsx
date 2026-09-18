import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';

const WatchlistContext = createContext(null);
const HistoryContext = createContext(null);
const STORAGE_KEY = 'popchill_watchlist';

const keyOf = (id, mediaType) => `${mediaType}-${id}`;

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function cleanItem(item) {
  const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
  return {
    id: Number(item.id ?? item.tmdb_id),
    media_type: mediaType,
    title: item.title || undefined,
    name: item.name || undefined,
    poster_path: item.poster_path || undefined,
    vote_average: Number(item.vote_average || 0),
    release_date: item.release_date || undefined,
    first_air_date: item.first_air_date || undefined,
  };
}

async function accountRequest(getToken, resource, options = {}) {
  const token = await getToken();
  if (!token) throw new Error('Authentication required.');

  const response = await fetch(`/api/account?resource=${resource}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Account request failed.');
  return data;
}

export function WatchlistProvider({ children }) {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setItems([]);
      return;
    }

    let cancelled = false;
    async function sync() {
      try {
        const remote = await accountRequest(getToken, 'watchlist');
        const local = readStored().map(cleanItem);
        const merged = [...remote.map(cleanItem)];

        for (const item of local) {
          if (!merged.some(saved => keyOf(saved.id, saved.media_type) === keyOf(item.id, item.media_type))) {
            merged.push(item);
            await accountRequest(getToken, 'watchlist', {
              method: 'POST',
              body: JSON.stringify({ item }),
            });
          }
        }

        if (!cancelled) {
          setItems(merged);
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error('Watchlist sync failed:', error);
      }
    }

    sync();
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, getToken]);

  async function toggle(item) {
    if (!isSignedIn) return;

    const normalized = cleanItem(item);
    const exists = items.some(saved => keyOf(saved.id, saved.media_type) === keyOf(normalized.id, normalized.media_type));

    setItems(prev => exists
      ? prev.filter(saved => keyOf(saved.id, saved.media_type) !== keyOf(normalized.id, normalized.media_type))
      : [...prev, normalized]);

    try {
      await accountRequest(getToken, 'watchlist', {
        method: exists ? 'DELETE' : 'POST',
        body: JSON.stringify({ item: normalized }),
      });
    } catch (error) {
      setItems(prev => exists
        ? [...prev, normalized]
        : prev.filter(saved => keyOf(saved.id, saved.media_type) !== keyOf(normalized.id, normalized.media_type)));
      console.error('Watchlist update failed:', error);
    }
  }

  function isSaved(id, mediaType) {
    return items.some(i => keyOf(i.id, i.media_type) === keyOf(id, mediaType));
  }

  return (
    <WatchlistContext.Provider value={{ items, isSaved, toggle }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function HistoryProvider({ children }) {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setItems([]);
      return;
    }

    let cancelled = false;
    accountRequest(getToken, 'history')
      .then(data => { if (!cancelled) setItems(data.map(cleanItem)); })
      .catch(error => console.error('History load failed:', error));

    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, getToken]);

  async function add(item) {
    if (!isSignedIn) return;

    const normalized = cleanItem(item);
    setItems(prev => [
      normalized,
      ...prev.filter(existing => keyOf(existing.id, existing.media_type) !== keyOf(normalized.id, normalized.media_type)),
    ]);

    try {
      await accountRequest(getToken, 'history', {
        method: 'POST',
        body: JSON.stringify({ item: normalized }),
      });
    } catch (error) {
      console.error('History update failed:', error);
    }
  }

  async function remove(item) {
    const normalized = cleanItem(item);
    setItems(prev => prev.filter(existing => keyOf(existing.id, existing.media_type) !== keyOf(normalized.id, normalized.media_type)));

    try {
      await accountRequest(getToken, 'history', {
        method: 'DELETE',
        body: JSON.stringify({ item: normalized }),
      });
    } catch (error) {
      console.error('History removal failed:', error);
    }
  }

  async function clear() {
    const previous = items;
    setItems([]);

    try {
      await Promise.all(previous.map(item => accountRequest(getToken, 'history', {
        method: 'DELETE',
        body: JSON.stringify({ item }),
      })));
    } catch (error) {
      console.error('History clear failed:', error);
    }
  }

  return (
    <HistoryContext.Provider value={{ items, add, remove, clear }}>
      {children}
    </HistoryContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error('useWatchlist must be used within a WatchlistProvider');
  return ctx;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useHistory() {
  const ctx = useContext(HistoryContext);
  if (!ctx) throw new Error('useHistory must be used within a HistoryProvider');
  return ctx;
}
