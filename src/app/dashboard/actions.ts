"use server";

import { revalidatePath } from "next/cache";

import { ensureProfileForUser } from "@/lib/supabase/ensure-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PostStatus } from "@/types/database";

interface PostPayload {
  title: string;
  excerpt: string;
  content: string;
  status: PostStatus;
  coverImageUrl?: string;
}

const TITLE_MAX_LENGTH = 200;
const EXCERPT_MAX_LENGTH = 320;
const CONTENT_MAX_LENGTH = 50_000;

function normalizeText(value?: string | null) {
  const trimmed = (value ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

function validatePayload(payload: PostPayload) {
  const trimmedTitle = payload.title.trim();
  const trimmedExcerpt = payload.excerpt.trim();
  const trimmedContent = payload.content.trim();

  if (!trimmedTitle) {
    throw new Error("Title is required.");
  }

  if (trimmedTitle.length > TITLE_MAX_LENGTH) {
    throw new Error(`Title cannot exceed ${TITLE_MAX_LENGTH} characters.`);
  }

  if (trimmedExcerpt.length > EXCERPT_MAX_LENGTH) {
    throw new Error(`Excerpt cannot exceed ${EXCERPT_MAX_LENGTH} characters.`);
  }

  if (trimmedContent.length > CONTENT_MAX_LENGTH) {
    throw new Error(`Content cannot exceed ${CONTENT_MAX_LENGTH} characters.`);
  }
}

export async function createPost(payload: PostPayload) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to create a post.");
  }
  await ensureProfileForUser(supabase, user);

  validatePayload(payload);

  const { error } = await supabase.from("posts").insert({
    title: payload.title.trim(),
    excerpt: normalizeText(payload.excerpt),
    content: normalizeText(payload.content),
    status: payload.status,
    author_id: user.id,
    cover_image_url: normalizeText(payload.coverImageUrl),
    published_at: payload.status === "published" ? new Date().toISOString() : null,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/");
  revalidatePath(`/author/${user.id}`);
}

export async function updatePost(postId: string, payload: PostPayload) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to update a post.");
  }
  await ensureProfileForUser(supabase, user);

  validatePayload(payload);

  const { data: existingPost, error: existingError } = await supabase
    .from("posts")
    .select("published_at, status")
    .eq("id", postId)
    .eq("author_id", user.id)
    .single();

  if (existingError) {
    throw new Error(existingError.message);
  }

  const publishedAt =
    payload.status === "published"
      ? existingPost?.published_at ?? new Date().toISOString()
      : null;

  const { error } = await supabase
    .from("posts")
    .update({
      title: payload.title.trim(),
      excerpt: normalizeText(payload.excerpt),
      content: normalizeText(payload.content),
      status: payload.status,
      cover_image_url: normalizeText(payload.coverImageUrl),
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .eq("author_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
  revalidatePath(`/author/${user.id}`);
}

export async function togglePostStatus(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");
  const status = String(formData.get("status") ?? "") as PostStatus;

  if (!postId) {
    throw new Error("Post id is required.");
  }

  if (status !== "draft" && status !== "published") {
    throw new Error("Invalid status.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to update a post.");
  }
  await ensureProfileForUser(supabase, user);

  const publishedAt = status === "published" ? new Date().toISOString() : null;

  const { error } = await supabase
    .from("posts")
    .update({
      status,
      published_at: publishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .eq("author_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/");
  revalidatePath(`/posts/${postId}`);
  revalidatePath(`/author/${user.id}`);
}

export async function deletePost(formData: FormData) {
  const postId = String(formData.get("postId") ?? "");

  if (!postId) {
    throw new Error("Post id is required.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to delete a post.");
  }
  await ensureProfileForUser(supabase, user);

  const { error } = await supabase
    .from("posts")
    .delete()
    .eq("id", postId)
    .eq("author_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath("/");
  revalidatePath(`/author/${user.id}`);
}
