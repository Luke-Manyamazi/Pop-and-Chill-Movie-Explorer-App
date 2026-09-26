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
  const [syncing, setSyncing] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setItems([]);
      setSyncing(false);
      return;
    }

    let cancelled = false;
    async function sync() {
      try {
        setSyncing(true);
        setError('');
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
        if (!cancelled) setError(error.message || 'Could not sync your list.');
      } finally {
        if (!cancelled) setSyncing(false);
      }
    }

    // Account data is not needed for the public homepage. Wait until the page
    // has loaded and the browser has had time to render before syncing.
    let timer;
    const startSync = () => {
      if (document.readyState === 'complete') {
        timer = window.setTimeout(sync, 5000);
        return;
      }
      const onLoad = () => {
        timer = window.setTimeout(sync, 5000);
      };
      window.addEventListener('load', onLoad, { once: true });
      timer = { onLoad };
    };
    startSync();
    if (timer?.onLoad) {
      return () => {
        cancelled = true;
        window.removeEventListener('load', timer.onLoad);
      };
    }
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    /*
    if (typeof window.requestIdleCallback === 'function') {
      const idleId = window.requestIdleCallback(sync, { timeout: 2500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(idleId);
      };
    }

    timer = window.setTimeout(sync, 1500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    */
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
    <WatchlistContext.Provider value={{ items, isSaved, toggle, syncing, error }}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function HistoryProvider({ children }) {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setError('');

    const loadHistory = () => {
      setLoading(true);
      accountRequest(getToken, 'history')
        .then(data => { if (!cancelled) setItems(data.map(cleanItem)); })
        .catch(error => {
          console.error('History load failed:', error);
          if (!cancelled) setError(error.message || 'Could not load your history.');
        })
        .finally(() => { if (!cancelled) setLoading(false); });
    };

    // History is only needed for the History page, so keep it completely out
    // of the initial homepage request chain.
    let timer;
    const startHistoryLoad = () => {
      if (document.readyState === 'complete') {
        timer = window.setTimeout(loadHistory, 6000);
        return;
      }
      const onLoad = () => {
        timer = window.setTimeout(loadHistory, 6000);
      };
      window.addEventListener('load', onLoad, { once: true });
      timer = { onLoad };
    };
    startHistoryLoad();
    if (timer?.onLoad) {
      return () => {
        cancelled = true;
        window.removeEventListener('load', timer.onLoad);
      };
    }
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    /*
    if (typeof window.requestIdleCallback === 'function') {
      const idleId = window.requestIdleCallback(loadHistory, { timeout: 3000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback?.(idleId);
      };
    }

    timer = window.setTimeout(loadHistory, 1800);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    */
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
    <HistoryContext.Provider value={{ items, add, remove, clear, loading, error }}>
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
