import { notFound, redirect } from "next/navigation";

import PostForm from "@/components/dashboard/post-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Post } from "@/types/database";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPostPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("posts")
    .select("id, title, excerpt, content, status, cover_image_url")
    .eq("id", id)
    .eq("author_id", user.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    notFound();
  }

  const post = data as Pick<
    Post,
    "id" | "title" | "excerpt" | "content" | "status" | "cover_image_url"
  >;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-3xl font-semibold text-zinc-900">Edit post</h1>
        <p className="text-sm text-zinc-500">Update your draft or published post.</p>
      </div>
      <PostForm
        initialValues={{
          id: post.id,
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          status: post.status,
          coverImageUrl: post.cover_image_url ?? "",
        }}
      />
    </div>
  );
}
