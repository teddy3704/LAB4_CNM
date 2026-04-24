"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

import { createPost, updatePost } from "@/app/dashboard/actions";
import { useToast } from "@/components/ui/toast";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { uploadPublicImage } from "@/lib/supabase/storage";
import type { PostStatus } from "@/types/database";

interface PostFormValues {
  id?: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  status: PostStatus;
  coverImageUrl?: string | null;
}

interface PostFormProps {
  initialValues?: PostFormValues;
}

export default function PostForm({ initialValues }: PostFormProps) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [excerpt, setExcerpt] = useState(initialValues?.excerpt ?? "");
  const [content, setContent] = useState(initialValues?.content ?? "");
  const [status, setStatus] = useState<PostStatus>(initialValues?.status ?? "draft");
  const [coverImageUrl, setCoverImageUrl] = useState(initialValues?.coverImageUrl ?? "");
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  const isEditing = Boolean(initialValues?.id);
  const excerptCount = useMemo(() => excerpt.trim().length, [excerpt]);
  const contentCount = useMemo(() => content.trim().length, [content]);

  const handleCoverImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setCoverError("Vui lòng chọn file ảnh (JPG, PNG, GIF, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCoverError("Ảnh bìa không được vượt quá 5MB.");
      return;
    }

    setCoverError(null);
    setCoverUploading(true);
    try {
      const publicUrl = await uploadPublicImage(supabase, file, "covers");
      setCoverImageUrl(publicUrl);
    } catch (caught) {
      const msg = caught instanceof Error ? caught.message : "Tải ảnh thất bại.";
      setCoverError(msg);
      toastError("Không thể tải ảnh bìa lên.");
    } finally {
      setCoverUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isEditing && initialValues?.id) {
        await updatePost(initialValues.id, { title, excerpt, content, status, coverImageUrl });
        success("Bài viết đã được cập nhật thành công!");
      } else {
        await createPost({ title, excerpt, content, status, coverImageUrl });
        success(status === "published" ? "Bài viết đã được xuất bản!" : "Bản nháp đã được lưu!");
      }
      router.push("/dashboard");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Đã có lỗi xảy ra.";
      setError(message);
      toastError("Lưu bài viết thất bại. Vui lòng thử lại.");
      setLoading(false);
    }
  };

  return (
    <form
      className="flex w-full flex-col gap-6 rounded-3xl border border-white/60 bg-white/80 p-8 shadow-2xl backdrop-blur-xl"
      onSubmit={handleSubmit}
    >
      {/* Tiêu đề */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-zinc-700" htmlFor="title">
          Tiêu đề bài viết <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          className="w-full rounded-xl border border-zinc-200 bg-white/90 px-4 py-3 text-sm transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
          placeholder="Nhập tiêu đề bài viết..."
          required
        />
      </div>

      {/* Tóm tắt */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-zinc-700" htmlFor="excerpt">
          Tóm tắt
          <span className="ml-2 font-normal text-zinc-400">(hiển thị trên trang chủ)</span>
        </label>
        <input
          id="excerpt"
          name="excerpt"
          type="text"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          maxLength={320}
          className="w-full rounded-xl border border-zinc-200 bg-white/90 px-4 py-3 text-sm transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
          placeholder="Tóm tắt ngắn về bài viết..."
        />
        <p className="text-right text-xs text-zinc-400">{excerptCount}/320 ký tự</p>
      </div>

      {/* Ảnh bìa */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-700" htmlFor="cover">
          Ảnh bìa
          <span className="ml-2 font-normal text-zinc-400">(tuỳ chọn, tối đa 5MB)</span>
        </label>
        {coverImageUrl ? (
          <div className="overflow-hidden rounded-2xl border border-zinc-200 shadow-sm">
            <img src={coverImageUrl} alt="Ảnh bìa xem trước" className="h-52 w-full object-cover" />
          </div>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor="cover"
            className="cursor-pointer rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-50"
          >
            {coverUploading ? "⏳ Đang tải lên..." : "📷 Chọn ảnh"}
          </label>
          <input
            id="cover"
            name="cover"
            type="file"
            accept="image/*"
            onChange={handleCoverImageChange}
            className="sr-only"
            disabled={coverUploading}
          />
          {coverImageUrl ? (
            <button
              type="button"
              onClick={() => setCoverImageUrl("")}
              className="text-sm font-semibold text-red-500 transition hover:text-red-700"
            >
              🗑 Xoá ảnh
            </button>
          ) : null}
        </div>
        {coverError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            ⚠ {coverError}
          </p>
        ) : null}
      </div>

      {/* Nội dung */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-zinc-700">
            Nội dung bài viết
            <span className="ml-2 font-normal text-zinc-400">(hỗ trợ Markdown)</span>
          </label>
          <div className="flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab("write")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === "write"
                  ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              ✏️ Soạn thảo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === "preview"
                  ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-md"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              👁 Xem trước
            </button>
          </div>
        </div>

        {activeTab === "write" ? (
          <textarea
            id="content"
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={50000}
            className="min-h-[240px] w-full rounded-xl border border-zinc-200 bg-white/90 px-4 py-3 font-mono text-sm transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
            placeholder="# Tiêu đề&#10;&#10;Bắt đầu viết bài của bạn tại đây...&#10;&#10;Hỗ trợ **đậm**, *nghiêng*, `code`, [liên kết](url), v.v."
          />
        ) : (
          <div className="prose min-h-[240px] w-full rounded-xl border border-zinc-200 bg-zinc-50/80 px-4 py-3 text-sm text-zinc-800">
            {content.trim().length > 0 ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                {content}
              </ReactMarkdown>
            ) : (
              <p className="italic text-zinc-400">Chưa có nội dung để xem trước.</p>
            )}
          </div>
        )}
        <p className="text-right text-xs text-zinc-400">{contentCount.toLocaleString("vi-VN")}/50.000 ký tự</p>
      </div>

      {/* Trạng thái */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-zinc-700" htmlFor="status">
          Trạng thái xuất bản
        </label>
        <select
          id="status"
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as PostStatus)}
          className="w-full rounded-xl border border-zinc-200 bg-white/90 px-4 py-3 text-sm transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
        >
          <option value="draft">✏️ Bản nháp – chỉ bạn thấy</option>
          <option value="published">🌐 Xuất bản – công khai</option>
        </select>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          ⚠ {error}
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "⏳ Đang lưu..." : isEditing ? "💾 Cập nhật bài viết" : "🚀 Tạo bài viết"}
        </button>
        <Link
          href="/dashboard"
          className="rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-600 shadow-sm transition hover:bg-zinc-50 hover:shadow-md"
        >
          Huỷ
        </Link>
      </div>
    </form>
  );
}

