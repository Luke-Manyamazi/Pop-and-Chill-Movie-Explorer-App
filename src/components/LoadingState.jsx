export default function LoadingState({ title = 'Loading your next watch...', message = 'Pop & Chill is fetching the good stuff.' }) {
  return (
    <div className="min-h-[55vh] grid place-items-center px-4 py-16 text-white">
      <div className="text-center">
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full border border-teal-400/20 bg-teal-400/10">
          <span className="loader" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-bold sm:text-2xl">{title}</h2>
        <p className="mt-2 text-sm text-white/50">{message}</p>
      </div>
    </div>
  );
}
