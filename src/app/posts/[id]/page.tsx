import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import { deleteComment } from "@/app/posts/[id]/actions";
import CommentForm from "@/components/posts/comment-form";
import { SITE_NAME } from "@/lib/site";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CommentWithAuthor, PostDetail, Profile } from "@/types/database";

interface PostPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatDate(value: string | null) {
  if (!value) {
    return "Chưa xuất bản";
  }
  return new Date(value).toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let postQuery = supabase
    .from("posts")
    .select(
      "id, title, excerpt, status, published_at, author_id, cover_image_url, profiles ( display_name )",
    )
    .eq("id", id);

  if (user) {
    postQuery = postQuery.or(`status.eq.published,author_id.eq.${user.id}`);
  } else {
    postQuery = postQuery.eq("status", "published");
  }

  const { data: postData, error } = await postQuery.maybeSingle();
  const post = postData as
    | (Pick<
        PostDetail,
        | "id"
        | "title"
        | "excerpt"
        | "published_at"
        | "cover_image_url"
        | "author_id"
      > & {
        profiles: Pick<Profile, "display_name"> | null;
      })
    | null;

  if (error || !post) {
    return { title: `Post not found · ${SITE_NAME}` };
  }

  const title = post.title ?? SITE_NAME;
  const description = post.excerpt ?? `Read the latest story on ${SITE_NAME}.`;
  const images = post.cover_image_url ? [post.cover_image_url] : undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `/posts/${post.id}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `/posts/${post.id}`,
      publishedTime: post.published_at ?? undefined,
      authors: post.profiles?.display_name ? [post.profiles.display_name] : undefined,
      images,
    },
    twitter: {
      title,
      description,
      images,
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let postQuery = supabase
    .from("posts")
    .select(
      "id, title, excerpt, content, status, published_at, author_id, cover_image_url, profiles ( id, display_name, avatar_url )",
    )
    .eq("id", id);

  if (user) {
    postQuery = postQuery.or(`status.eq.published,author_id.eq.${user.id}`);
  } else {
    postQuery = postQuery.eq("status", "published");
  }

  const { data: post, error: postError } = await postQuery.single();

  if (postError || !post) {
    notFound();
  }

  const { data: comments, error: commentsError } = await supabase
    .from("comments")
    .select("id, content, created_at, author_id, profiles ( id, display_name, avatar_url )")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  if (commentsError) {
    throw new Error(commentsError.message);
  }

  const typedPost = post as PostDetail;
  const typedComments = (comments ?? []) as CommentWithAuthor[];
  const isAuthor = user?.id === typedPost.author_id;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className="text-sm font-semibold text-zinc-600 transition hover:text-violet-600" href="/">
          ← Về trang chủ
        </Link>
        {isAuthor ? (
          <Link
            href={`/dashboard/${typedPost.id}`}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-50"
          >
            ✏️ Chỉnh sửa bài
          </Link>
        ) : null}
      </div>

      <article className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
            typedPost.status === "published"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}>
            {typedPost.status === "published" ? "🌐 Đã xuất bản" : "✏️ Bản nháp"}
          </span>
          <span>Xuất bản {formatDate(typedPost.published_at)}</span>
          <Link
            href={`/author/${typedPost.author_id}`}
            className="font-semibold text-violet-600 hover:text-violet-800"
          >
            {typedPost.profiles?.display_name ?? "Ẩn danh"}
          </Link>
        </div>
        <h1 className="mt-4 bg-gradient-to-r from-blue-700 to-violet-700 bg-clip-text text-3xl font-extrabold text-transparent leading-tight">
          {typedPost.title}
        </h1>
        {typedPost.excerpt ? (
          <p className="mt-3 text-sm leading-relaxed text-zinc-500">{typedPost.excerpt}</p>
        ) : null}
        {typedPost.cover_image_url ? (
          <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 shadow-lg">
            <Image
              src={typedPost.cover_image_url}
              alt={typedPost.title}
              width={960}
              height={540}
              className="h-auto w-full object-cover"
              unoptimized
            />
          </div>
        ) : null}
        <div className="prose mt-6 text-sm leading-7 text-zinc-700">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSanitize]}
          >
            {typedPost.content || "Chưa có nội dung."}
          </ReactMarkdown>
        </div>
      </article>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900">💬 Bình luận</h2>
          <p className="text-sm text-zinc-500">
            {typedComments.length} bình luận
          </p>
        </div>

        {typedComments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white/60 px-4 py-8 text-center text-sm text-zinc-500 backdrop-blur-sm">
            Hãy là người đầu tiên bình luận về bài viết này! ✨
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {typedComments.map((comment) => {
              const canDeleteComment =
                user?.id === comment.author_id || user?.id === typedPost.author_id;

              return (
                <div
                  key={comment.id}
                  className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-md backdrop-blur-xl transition hover:shadow-lg"
                >
                  <div className="flex items-center justify-between gap-3 text-xs text-zinc-500">
                    <div className="flex items-center gap-3">
                      {comment.profiles?.avatar_url ? (
                        <Image
                          src={comment.profiles.avatar_url}
                          alt={comment.profiles.display_name ?? "Avatar"}
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full object-cover ring-2 ring-violet-100"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-xs font-bold text-white shadow-md">
                          {(comment.profiles?.display_name ?? "A")
                            .slice(0, 1)
                            .toUpperCase()}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-900">
                          {comment.profiles?.display_name ?? "Ẩn danh"}
                        </span>
                        <span>{formatDate(comment.created_at)}</span>
                      </div>
                    </div>
                    {canDeleteComment ? (
                      <form action={deleteComment.bind(null, typedPost.id)}>
                        <input type="hidden" name="commentId" value={comment.id} />
                        <button
                          type="submit"
                          className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600 transition hover:bg-red-100"
                        >
                          🗑 Xoá
                        </button>
                      </form>
                    ) : null}
                  </div>

                  <div className="prose mt-3 text-sm text-zinc-700">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeSanitize]}
                    >
                      {comment.content}
                    </ReactMarkdown>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <CommentForm postId={typedPost.id} isSignedIn={Boolean(user)} />
    </div>
  );
}
