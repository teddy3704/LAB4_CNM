import Image from "next/image";
import Link from "next/link";

import { SITE_NAME } from "@/lib/site";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PostListItem } from "@/types/database";

export const metadata = {
  title: "Trang chủ – Khám phá bài viết mới nhất",
  description: "Đọc những bài viết chất lượng từ cộng đồng tác giả trên nền tảng blog hàng đầu.",
};

const PAGE_SIZE = 6;

interface HomePageProps {
  searchParams?: Promise<{ q?: string; page?: string }>;
}

function formatDate(value: string | null) {
  if (!value) return "Chưa xuất bản";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function Home({ searchParams }: HomePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const queryValue = resolvedSearchParams?.q?.trim() ?? "";
  const currentPage = Math.max(1, Number(resolvedSearchParams?.page ?? "1") || 1);

  let countQuery = supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "published");
  if (queryValue) {
    countQuery = countQuery.or(`title.ilike.%${queryValue}%,excerpt.ilike.%${queryValue}%`);
  }
  const { count } = await countQuery;

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const from = (safePage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let dataQuery = supabase
    .from("posts")
    .select("id, title, excerpt, published_at, author_id, cover_image_url, profiles ( id, display_name, avatar_url )")
    .eq("status", "published");
  if (queryValue) {
    dataQuery = dataQuery.or(`title.ilike.%${queryValue}%,excerpt.ilike.%${queryValue}%`);
  }
  const { data } = await dataQuery.order("published_at", { ascending: false }).range(from, to);
  const posts = (data ?? []) as PostListItem[];

  const baseParams = new URLSearchParams();
  if (queryValue) baseParams.set("q", queryValue);
  const buildPageHref = (p: number) => {
    const params = new URLSearchParams(baseParams);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-12">
      {/* Hero section */}
      <section className="relative overflow-hidden rounded-3xl border border-white/50 bg-white/70 p-8 shadow-2xl backdrop-blur-md md:p-12">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gradient-to-br from-blue-400/20 to-violet-500/20 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-gradient-to-tr from-violet-400/20 to-pink-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl space-y-4">
            <span className="inline-block rounded-full bg-gradient-to-r from-blue-100 to-violet-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-violet-700">
              {SITE_NAME}
            </span>
            <h1 className="bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600 bg-clip-text text-4xl font-extrabold leading-tight text-transparent md:text-5xl">
              Khám phá những câu chuyện truyền cảm hứng
            </h1>
            <p className="text-base leading-relaxed text-zinc-600">
              Đọc, viết và chia sẻ những bài viết chất lượng từ cộng đồng tác giả đam mê ngôn từ.
            </p>
          </div>
          <Link
            href={user ? "/dashboard/new" : "/register"}
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          >
            {user ? "✍ Viết bài mới" : "🚀 Bắt đầu viết"}
          </Link>
        </div>
      </section>

      {/* Posts section */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Bài viết mới nhất</h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              {count ?? 0} bài viết đã xuất bản
            </p>
          </div>
          <form className="flex w-full max-w-sm items-center gap-2" action="/" method="get">
            <input
              type="text"
              name="q"
              defaultValue={queryValue}
              placeholder="Tìm kiếm bài viết..."
              className="w-full rounded-xl border border-zinc-200/80 bg-white/80 px-4 py-2.5 text-sm backdrop-blur-sm transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
            />
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:scale-105"
            >
              Tìm
            </button>
          </form>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 px-6 py-10 text-center backdrop-blur-sm">
            <p className="text-4xl">📝</p>
            <p className="mt-3 font-semibold text-zinc-700">Chưa có bài viết nào</p>
            <p className="mt-1 text-sm text-zinc-500">
              {queryValue ? `Không tìm thấy kết quả cho "${queryValue}"` : "Hãy là người viết bài đầu tiên!"}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article
                key={post.id}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/60 bg-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                {post.cover_image_url ? (
                  <div className="overflow-hidden">
                    <Image
                      src={post.cover_image_url}
                      alt={post.title}
                      width={560}
                      height={280}
                      className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex h-32 items-center justify-center bg-gradient-to-br from-blue-50 to-violet-100 text-4xl">
                    📄
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex items-center gap-2 text-xs text-zinc-400">
                    <span className="rounded-full bg-gradient-to-r from-blue-100 to-violet-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-violet-700">
                      Blog
                    </span>
                    <span>{formatDate(post.published_at)}</span>
                  </div>
                  <h3 className="mb-2 text-lg font-bold leading-snug text-zinc-900">
                    <Link href={`/posts/${post.id}`} className="transition hover:text-violet-700">
                      {post.title}
                    </Link>
                  </h3>
                  {post.excerpt ? (
                    <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-zinc-600">
                      {post.excerpt}
                    </p>
                  ) : null}
                  <div className="mt-auto flex items-center justify-between text-sm">
                    <Link
                      href={`/author/${post.author_id}`}
                      className="font-semibold text-zinc-700 transition hover:text-violet-700"
                    >
                      {post.profiles?.display_name ?? "Ẩn danh"}
                    </Link>
                    <Link
                      href={`/posts/${post.id}`}
                      className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-xs font-bold text-transparent transition hover:opacity-80"
                    >
                      Đọc tiếp →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <p className="text-xs text-zinc-500">
            Trang {safePage} / {totalPages}
          </p>
          <div className="flex items-center gap-2 text-sm">
            <Link
              href={buildPageHref(Math.max(1, safePage - 1))}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                safePage === 1
                  ? "pointer-events-none border-zinc-100 text-zinc-300"
                  : "border-zinc-200 bg-white/70 text-zinc-700 hover:bg-white hover:shadow-sm"
              }`}
            >
              ← Trước
            </Link>
            <Link
              href={buildPageHref(Math.min(totalPages, safePage + 1))}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                safePage >= totalPages
                  ? "pointer-events-none border-zinc-100 text-zinc-300"
                  : "border-zinc-200 bg-white/70 text-zinc-700 hover:bg-white hover:shadow-sm"
              }`}
            >
              Tiếp →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

