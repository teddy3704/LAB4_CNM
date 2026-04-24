export default function HomeLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-12">
      {/* Hero skeleton */}
      <div className="rounded-3xl border border-white/50 bg-white/70 p-8 shadow-2xl backdrop-blur-md md:p-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-4">
            <div className="h-5 w-36 animate-pulse rounded-full bg-violet-100" />
            <div className="space-y-2">
              <div className="h-10 w-full animate-pulse rounded-xl bg-zinc-200" />
              <div className="h-10 w-3/4 animate-pulse rounded-xl bg-zinc-200" />
            </div>
            <div className="h-4 w-2/3 animate-pulse rounded-full bg-zinc-100" />
          </div>
          <div className="h-12 w-40 animate-pulse rounded-2xl bg-zinc-200" />
        </div>
      </div>

      {/* Posts grid skeleton */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="h-6 w-44 animate-pulse rounded-lg bg-zinc-200" />
            <div className="h-4 w-28 animate-pulse rounded-full bg-zinc-100" />
          </div>
          <div className="flex w-full max-w-sm gap-2">
            <div className="h-10 flex-1 animate-pulse rounded-xl bg-zinc-100" />
            <div className="h-10 w-16 animate-pulse rounded-xl bg-zinc-200" />
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-lg backdrop-blur-sm"
            >
              <div className="h-48 w-full animate-pulse bg-gradient-to-br from-zinc-100 to-zinc-200" />
              <div className="p-5 space-y-3">
                <div className="flex gap-2">
                  <div className="h-4 w-12 animate-pulse rounded-full bg-violet-100" />
                  <div className="h-4 w-24 animate-pulse rounded-full bg-zinc-100" />
                </div>
                <div className="h-5 w-full animate-pulse rounded-lg bg-zinc-200" />
                <div className="h-4 w-4/5 animate-pulse rounded-full bg-zinc-100" />
                <div className="h-4 w-3/5 animate-pulse rounded-full bg-zinc-100" />
                <div className="mt-4 flex justify-between">
                  <div className="h-4 w-20 animate-pulse rounded-full bg-zinc-200" />
                  <div className="h-4 w-16 animate-pulse rounded-full bg-violet-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
