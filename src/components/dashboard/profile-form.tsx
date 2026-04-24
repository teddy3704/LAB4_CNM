"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { updateProfile } from "@/app/dashboard/profile/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { uploadPublicImage } from "@/lib/supabase/storage";

interface ProfileFormProps {
  initialDisplayName: string;
  initialAvatarUrl: string | null;
}

interface ProfileFormState {
  error: string | null;
  success: boolean;
}

const initialState: ProfileFormState = { error: null, success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? "⏳ Đang lưu..." : "💾 Lưu thay đổi"}
    </button>
  );
}

export default function ProfileForm({
  initialDisplayName,
  initialAvatarUrl,
}: ProfileFormProps) {
  const supabase = createSupabaseBrowserClient();
  const [state, formAction] = useActionState(updateProfile, initialState);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Avatar image must be 5MB or less.");
      return;
    }

    setUploadError(null);
    setUploading(true);

    try {
      const publicUrl = await uploadPublicImage(supabase, file, "avatars");
      setAvatarUrl(publicUrl);
    } catch (caught) {
      setUploadError(caught instanceof Error ? caught.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form className="space-y-5" action={formAction}>
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-zinc-700" htmlFor="display_name">
          Tên hiển thị <span className="text-red-500">*</span>
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          defaultValue={initialDisplayName}
          className="w-full rounded-xl border border-zinc-200 bg-white/90 px-4 py-3 text-sm transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
          placeholder="Tên của bạn..."
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-700" htmlFor="avatar_url">
          Ảnh đại diện
          <span className="ml-2 font-normal text-zinc-400">(tuỳ chọn, tối đa 5MB)</span>
        </label>
        {avatarUrl ? (
          <div className="flex items-center gap-4">
            <Image
              src={avatarUrl}
              alt={initialDisplayName}
              width={56}
              height={56}
              className="h-14 w-14 rounded-full object-cover ring-2 ring-violet-200 shadow-md"
              unoptimized
            />
            <button
              type="button"
              onClick={() => setAvatarUrl("")}
              className="text-xs font-semibold text-red-500 transition hover:text-red-700"
            >
              🗑 Xoá ảnh
            </button>
          </div>
        ) : null}
        <input
          id="avatar_url"
          name="avatar_url"
          type="url"
          value={avatarUrl}
          onChange={(event) => setAvatarUrl(event.target.value)}
          placeholder="https://... (URL ảnh công khai)"
          className="w-full rounded-xl border border-zinc-200 bg-white/90 px-4 py-3 text-sm transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
        />
        <label
          htmlFor="avatar_file"
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-50"
        >
          {uploading ? "⏳ Đang tải lên..." : "📷 Tải ảnh lên"}
        </label>
        <input
          id="avatar_file"
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="sr-only"
          disabled={uploading}
        />
        {uploadError ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            ⚠ {uploadError}
          </p>
        ) : null}
      </div>

      {state.error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          ⚠ {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          ✅ Hồ sơ đã được cập nhật thành công!
        </p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
