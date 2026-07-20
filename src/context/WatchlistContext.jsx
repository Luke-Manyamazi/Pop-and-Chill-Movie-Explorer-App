import { createContext, useContext, useEffect, useState } from 'react';

const WatchlistContext = createContext(null);
const STORAGE_KEY = 'popchill_watchlist';

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const keyOf = (id, mediaType) => `${mediaType}-${id}`;

export function WatchlistProvider({ children }) {
  const [items, setItems] = useState(readStored);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function isSaved(id, mediaType) {
    return items.some(i => keyOf(i.id, i.media_type) === keyOf(id, mediaType));
  }

  function toggle(item) {
    const mediaType = item.media_type || (item.title ? 'movie' : 'tv');
    const id = item.id;
    setItems(prev => {
      if (prev.some(i => keyOf(i.id, i.media_type) === keyOf(id, mediaType))) {
        return prev.filter(i => keyOf(i.id, i.media_type) !== keyOf(id, mediaType));
      }
      return [...prev, {
        id,
        media_type: mediaType,
        title: item.title,
        name: item.name,
        poster_path: item.poster_path,
        vote_average: item.vote_average,
        release_date: item.release_date,
        first_air_date: item.first_air_date,
      }];
    });
  }

  return (
    <WatchlistContext.Provider value={{ items, isSaved, toggle }}>
      {children}
    </WatchlistContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWatchlist() {
  const ctx = useContext(WatchlistContext);
  if (!ctx) throw new Error('useWatchlist must be used within a WatchlistProvider');
  return ctx;
}
