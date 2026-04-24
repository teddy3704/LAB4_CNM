"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";

interface CommentFormState {
  error: string | null;
  success: boolean;
}

const COMMENT_MAX_LENGTH = 2000;

export async function createComment(
  postId: string,
  _prevState: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to comment.", success: false };
  }

  const content = String(formData.get("content") ?? "").trim();
  if (!content) {
    return { error: "Comment cannot be empty.", success: false };
  }
  if (content.length > COMMENT_MAX_LENGTH) {
    return {
      error: `Comment cannot exceed ${COMMENT_MAX_LENGTH} characters.`,
      success: false,
    };
  }

  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: user.id,
    content,
  });

  if (error) {
    return { error: error.message, success: false };
  }

  revalidatePath(`/posts/${postId}`);
  return { error: null, success: true };
}

export async function deleteComment(postId: string, formData: FormData) {
  const commentId = String(formData.get("commentId") ?? "");

  if (!commentId) {
    throw new Error("Comment id is required.");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to delete comments.");
  }

  const { data: comment, error: commentError } = await supabase
    .from("comments")
    .select("id, author_id, post_id")
    .eq("id", commentId)
    .maybeSingle();

  if (commentError) {
    throw new Error(commentError.message);
  }

  if (!comment || comment.post_id !== postId) {
    throw new Error("Comment not found.");
  }

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("author_id")
    .eq("id", postId)
    .maybeSingle();

  if (postError) {
    throw new Error(postError.message);
  }

  const isCommentOwner = comment.author_id === user.id;
  const isPostOwner = post?.author_id === user.id;

  if (!isCommentOwner && !isPostOwner) {
    throw new Error("You are not allowed to delete this comment.");
  }

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/posts/${postId}`);
}
