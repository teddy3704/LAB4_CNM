export default function DashboardLoading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 animate-pulse rounded-xl bg-zinc-200" />
          <div className="h-4 w-48 animate-pulse rounded-full bg-zinc-100" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded-xl bg-zinc-200" />
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-lg backdrop-blur-sm"
          >
            <div className="h-3 w-24 animate-pulse rounded-full bg-zinc-100" />
            <div className="mt-3 h-8 w-16 animate-pulse rounded-lg bg-zinc-200" />
          </div>
        ))}
      </div>

      {/* Posts list */}
      <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur-sm">
        <div className="mb-4 flex gap-2">
          <div className="h-10 flex-1 animate-pulse rounded-xl bg-zinc-100" />
          <div className="h-10 w-20 animate-pulse rounded-xl bg-zinc-200" />
        </div>
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-zinc-100 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="h-4 w-16 animate-pulse rounded-full bg-zinc-100" />
                    <div className="h-4 w-24 animate-pulse rounded-full bg-zinc-100" />
                  </div>
                  <div className="h-5 w-64 animate-pulse rounded-lg bg-zinc-200" />
                  <div className="h-4 w-48 animate-pulse rounded-full bg-zinc-100" />
                </div>
                <div className="flex gap-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-8 w-16 animate-pulse rounded-xl bg-zinc-100" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
