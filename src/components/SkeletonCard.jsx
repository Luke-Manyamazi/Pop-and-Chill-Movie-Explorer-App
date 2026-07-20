export default function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-neutral-900/60 overflow-hidden animate-pulse">
      <div className="w-full aspect-[2/3] bg-neutral-800" />
      <div className="p-3 flex flex-col gap-2">
        <div className="h-4 bg-neutral-800 rounded w-3/4" />
        <div className="h-3 bg-neutral-800 rounded w-1/3" />
        <div className="h-8 bg-neutral-800 rounded mt-2" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 10 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
      {Array.from({ length: count }, (_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}
