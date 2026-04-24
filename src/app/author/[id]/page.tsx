import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { SITE_NAME } from "@/lib/site";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Post, Profile } from "@/types/database";

interface AuthorPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatDate(value: string | null, fallback = "Chưa rõ") {
  if (!value) {
    return fallback;
  }
  return new Date(value).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata({
  params,
}: AuthorPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: profileData, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", id)
    .maybeSingle();
  const profile = profileData as Pick<Profile, "display_name"> | null;

  if (error || !profile) {
    return { title: `Author not found · ${SITE_NAME}` };
  }

  const title = `${profile.display_name ?? "Author"} · ${SITE_NAME}`;
  const description = `Read posts and updates from ${
    profile.display_name ?? "this author"
  }.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/author/${id}`,
    },
    openGraph: {
      title,
      description,
      type: "profile",
      url: `/author/${id}`,
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, created_at")
    .eq("id", id)
    .maybeSingle();
  const profile = profileData as Pick<
    Profile,
    "id" | "display_name" | "avatar_url" | "created_at"
  > | null;

  if (profileError || !profile) {
    notFound();
  }

  const isOwner = user?.id === id;
  let postsQuery = supabase
    .from("posts")
    .select("id, title, excerpt, status, published_at")
    .eq("author_id", id)
    .order("created_at", { ascending: false });

  if (!isOwner) {
    postsQuery = postsQuery.eq("status", "published");
  }

  const { data: posts, error: postsError } = await postsQuery;

  if (postsError) {
    throw new Error(postsError.message);
  }

  const typedPosts = (posts ?? []) as Pick<
    Post,
    "id" | "title" | "excerpt" | "status" | "published_at"
  >[];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <Link href="/" className="text-sm font-semibold text-zinc-600 transition hover:text-violet-600">
        ← Về trang chủ
      </Link>

      <section className="flex flex-col gap-4 rounded-3xl border border-white/60 bg-white/80 p-8 shadow-2xl backdrop-blur-xl md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.display_name ?? "Avatar"}
              width={64}
              height={64}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-violet-200 shadow-lg"
              unoptimized
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-xl font-extrabold text-white shadow-lg">
              {(profile.display_name ?? "A").slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-2xl font-extrabold text-transparent">
              {profile.display_name ?? "Ẩn danh"}
            </h1>
            <p className="text-sm text-zinc-500">
              Thành viên từ {formatDate(profile.created_at ?? null, "N/A")}
            </p>
          </div>
        </div>
        {isOwner ? (
          <Link
            href="/dashboard/profile"
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-50"
          >
            ✏️ Chỉnh sửa hồ sơ
          </Link>
        ) : null}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-900">📝 Bài viết</h2>
          <span className="text-sm text-zinc-500">
            {typedPosts.length} bài viết
          </span>
        </div>

        {typedPosts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white/60 px-4 py-8 text-center text-sm text-zinc-500 backdrop-blur-sm">
            Chưa có bài viết nào. ✨
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {typedPosts.map((post) => (
              <article
                key={post.id}
                className="flex flex-col gap-3 rounded-2xl border border-white/60 bg-white/80 p-6 shadow-md backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>{formatDate(post.published_at)}</span>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    post.status === "published"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}>
                    {post.status === "published" ? "🌐 Đã xuất bản" : "✏️ Bản nháp"}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-zinc-900">
                  <Link href={`/posts/${post.id}`} className="transition hover:text-violet-600">
                    {post.title}
                  </Link>
                </h3>
                {post.excerpt ? (
                  <p className="line-clamp-2 text-sm text-zinc-600">{post.excerpt}</p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
