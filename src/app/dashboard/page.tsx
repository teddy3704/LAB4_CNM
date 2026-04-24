import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { deletePost, togglePostStatus } from "@/app/dashboard/actions";
import { ensureProfileForUser } from "@/lib/supabase/ensure-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Post, PostStatus } from "@/types/database";

export const metadata: Metadata = {
  title: "Bảng điều khiển",
  description: "Quản lý bài viết và hồ sơ cá nhân của bạn.",
};

interface DashboardPageProps {
  searchParams?: Promise<{ q?: string; status?: string }>;
}

function formatDate(value: string | null) {
  if (!value) return "Chưa xuất bản";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  await ensureProfileForUser(supabase, user);

  const rawStatus = resolvedSearchParams?.status ?? "all";
  const statusFilter: "all" | PostStatus =
    rawStatus === "draft" || rawStatus === "published" ? rawStatus : "all";
  const searchValue = resolvedSearchParams?.q?.trim() ?? "";

  const [{ count: totalCount }, { count: publishedCount }, { count: draftCount }] =
    await Promise.all([
      supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", user.id),
      supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", user.id).eq("status", "published"),
      supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", user.id).eq("status", "draft"),
    ]);

  let query = supabase
    .from("posts")
    .select("id, title, status, created_at, published_at, excerpt")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  if (statusFilter !== "all") query = query.eq("status", statusFilter);
  if (searchValue) query = query.or(`title.ilike.%${searchValue}%,excerpt.ilike.%${searchValue}%`);

  const { data } = await query;
  const posts = (data ?? []) as Pick<Post, "id" | "title" | "status" | "created_at" | "published_at" | "excerpt">[];

  const statusOptions: { value: "all" | PostStatus; label: string; emoji: string }[] = [
    { value: "all", label: "Tất cả", emoji: "📋" },
    { value: "draft", label: "Bản nháp", emoji: "✏️" },
    { value: "published", label: "Đã xuất bản", emoji: "🌐" },
  ];

  const stats = [
    { label: "Tổng bài viết", value: totalCount ?? 0, emoji: "📝", gradient: "from-blue-500 to-cyan-500" },
    { label: "Đã xuất bản", value: publishedCount ?? 0, emoji: "🌐", gradient: "from-emerald-500 to-teal-500" },
    { label: "Bản nháp", value: draftCount ?? 0, emoji: "✏️", gradient: "from-amber-500 to-orange-500" },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-5 py-12">
      {/* Page header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-3xl font-extrabold text-transparent">
            Bảng điều khiển
          </h1>
          <p className="text-sm text-zinc-500">Quản lý bài viết và hồ sơ cá nhân của bạn.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/profile"
            className="rounded-xl border border-zinc-200 bg-white/80 px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-white hover:shadow-md"
          >
            👤 Hồ sơ
          </Link>
          <Link
            href="/dashboard/new"
            className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          >
            ✍ Bài viết mới
          </Link>
        </div>
      </header>

      {/* Stats */}
      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-lg backdrop-blur-sm"
          >
            <div className={`h-1 w-full bg-gradient-to-r ${stat.gradient}`} />
            <div className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {stat.label}
                </p>
                <span className="text-xl">{stat.emoji}</span>
              </div>
              <p className={`mt-2 bg-gradient-to-r ${stat.gradient} bg-clip-text text-3xl font-extrabold text-transparent`}>
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* Posts section */}
      <section className="flex flex-col gap-4 rounded-2xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <form className="flex flex-1 items-center gap-2" method="get">
            <input
              type="text"
              name="q"
              defaultValue={searchValue}
              placeholder="Tìm kiếm bài viết của bạn..."
              className="w-full rounded-xl border border-zinc-200 bg-white/90 px-4 py-2.5 text-sm transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
            />
            {statusFilter !== "all" ? (
              <input type="hidden" name="status" value={statusFilter} />
            ) : null}
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:scale-105"
            >
              Tìm
            </button>
          </form>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((option) => {
              const params = new URLSearchParams();
              if (searchValue) params.set("q", searchValue);
              if (option.value !== "all") params.set("status", option.value);
              const href = params.toString() ? `/dashboard?${params.toString()}` : "/dashboard";
              const isActive = statusFilter === option.value;
              return (
                <Link
                  key={option.value}
                  href={href}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md"
                      : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                  }`}
                >
                  {option.emoji} {option.label}
                </Link>
              );
            })}
          </div>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50 px-4 py-8 text-center">
            <p className="text-3xl">📭</p>
            <p className="mt-2 font-semibold text-zinc-700">Chưa có bài viết nào</p>
            <p className="mt-1 text-sm text-zinc-500">
              {searchValue ? `Không tìm thấy bài viết với từ khoá "${searchValue}"` : "Hãy tạo bài viết đầu tiên của bạn!"}
            </p>
            {!searchValue ? (
              <Link
                href="/dashboard/new"
                className="mt-4 inline-flex items-center gap-1 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-bold text-white shadow-md transition hover:scale-105"
              >
                ✍ Viết bài ngay
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group rounded-2xl border border-zinc-100 bg-white p-5 shadow-sm transition hover:border-violet-200 hover:shadow-md"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                          post.status === "published"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {post.status === "published" ? "🌐 Đã xuất bản" : "✏️ Bản nháp"}
                      </span>
                      <span className="text-xs text-zinc-400">{formatDate(post.published_at ?? post.created_at)}</span>
                    </div>
                    <h2 className="text-base font-bold text-zinc-900 group-hover:text-violet-800">
                      {post.title}
                    </h2>
                    {post.excerpt ? (
                      <p className="line-clamp-1 text-sm text-zinc-500">{post.excerpt}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Link
                      href={`/posts/${post.id}`}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
                    >
                      👁 Xem
                    </Link>
                    <Link
                      href={`/dashboard/${post.id}`}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
                    >
                      ✏️ Sửa
                    </Link>
                    <form action={togglePostStatus}>
                      <input type="hidden" name="postId" value={post.id} />
                      <input
                        type="hidden"
                        name="status"
                        value={post.status === "published" ? "draft" : "published"}
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
                      >
                        {post.status === "published" ? "⬇ Gỡ xuống" : "🌐 Xuất bản"}
                      </button>
                    </form>
                    <form action={deletePost}>
                      <input type="hidden" name="postId" value={post.id} />
                      <button
                        type="submit"
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        🗑 Xoá
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

