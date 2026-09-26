import { useNavigate } from 'react-router-dom';

export default function ErrorState({
  title = 'That didn’t go as planned',
  message = 'Pop & Chill hit a little bump while loading this page.',
  onRetry,
  compact = false,
}) {
  const navigate = useNavigate();

  return (
    <section className={compact ? 'my-8' : 'min-h-[55vh] grid place-items-center px-4 py-16'}>
      <div
        role="alert"
        className="mx-auto w-full max-w-2xl rounded-3xl border border-red-300/15 bg-gradient-to-br from-red-400/[0.10] via-white/[0.03] to-transparent p-8 text-center shadow-2xl"
      >
        <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full border border-red-300/20 bg-red-400/10 text-4xl">
          🎬
        </div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-200/70">Playback interrupted</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{title}</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/55">{message}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-xl bg-teal-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-400"
            >
              Try again
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            Back to Pop & Chill
          </button>
        </div>
      </div>
    </section>
  );
}
