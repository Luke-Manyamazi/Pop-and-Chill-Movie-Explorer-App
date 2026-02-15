import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Nav() {
  const navigate = useNavigate();

  const loadTrending = (category) => {
    // Navigate back to home with category query
    navigate('/', { state: { category } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="w-full flex flex-col sm:flex-row items-center sm:justify-between py-4 border-b border-white/10 gap-4 sm:gap-0 px-4 sm:px-6 lg:px-8">
      <h1
        className="text-xl sm:text-2xl font-bold tracking-tight hover:cursor-pointer"
        onClick={() => loadTrending('all')}
      >
        🍿 Pop & Chill Mate | Movie Explorer
      </h1>
      <ul className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6 text-sm sm:text-base">
        <li>
          <button onClick={() => loadTrending('movie')} className="hover:text-teal-400">
            Movies
          </button>
        </li>
        <li>
          <button onClick={() => loadTrending('tv')} className="hover:text-teal-400">
            TV Shows
          </button>
        </li>
        <li>
          <button onClick={() => loadTrending('person')} className="hover:text-teal-400">
            Actors
          </button>
        </li>
      </ul>
    </nav>
  );
}
