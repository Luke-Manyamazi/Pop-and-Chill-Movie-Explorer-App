import { useNavigate } from 'react-router-dom';
import Nav from './Nav';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Nav />
      <main className="relative grid min-h-[calc(100vh-73px)] place-items-center overflow-hidden px-4 py-16">
        <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="relative w-full max-w-2xl text-center">
          <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full border border-teal-300/20 bg-white/[0.04] text-6xl shadow-2xl">
            🍿
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-teal-300">Scene not found</p>
          <h1 className="mt-3 text-7xl font-black tracking-tight sm:text-9xl">
            4<span className="text-teal-400">0</span>4
          </h1>
          <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Looks like this scene was cut.</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-white/50 sm:text-base">
            The page you’re looking for isn’t in the current cut of Pop & Chill. Let’s get you back to something worth watching.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => navigate('/')} className="rounded-xl bg-teal-500 px-6 py-3 font-bold transition hover:bg-teal-400">
              🍿 Find something to watch
            </button>
            <button type="button" onClick={() => navigate(-1)} className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white/75 transition hover:bg-white/10 hover:text-white">
              ← Go back
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
