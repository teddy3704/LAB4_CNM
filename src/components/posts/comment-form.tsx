"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";

import { createComment } from "@/app/posts/[id]/actions";

interface CommentFormProps {
  postId: string;
  isSignedIn: boolean;
}

interface CommentFormState {
  error: string | null;
  success: boolean;
}

const initialState: CommentFormState = { error: null, success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "⏳ Đang gửi..." : "💬 Gửi bình luận"}
    </button>
  );
}

export default function CommentForm({ postId, isSignedIn }: CommentFormProps) {
  const [state, formAction] = useActionState(
    createComment.bind(null, postId),
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-2xl backdrop-blur-xl">
      <div className="space-y-1">
        <h3 className="text-base font-bold text-zinc-900">✍️ Viết bình luận</h3>
        <p className="text-sm text-zinc-500">
          Chia sẻ suy nghĩ của bạn. Hỗ trợ định dạng Markdown.
        </p>
      </div>

      {!isSignedIn ? (
        <div className="mt-4 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-600">
          Vui lòng{" "}
          <Link className="font-semibold text-violet-600 hover:underline" href="/login">
            đăng nhập
          </Link>{" "}
          để có thể bình luận.
        </div>
      ) : (
        <form ref={formRef} className="mt-4 space-y-4" action={formAction}>
          <textarea
            name="content"
            rows={4}
            maxLength={2000}
            placeholder="Nhập bình luận của bạn... (hỗ trợ **đậm**, *nghiêng*, `code`)"
            className="w-full rounded-xl border border-zinc-200 bg-white/90 px-4 py-3 text-sm transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
            required
          />
          {state.error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              ⚠ {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              ✅ Bình luận đã được đăng thành công!
            </p>
          ) : null}
          <SubmitButton />
        </form>
      )}
    </div>
  );
}
