import Link from "next/link";
import { redirect } from "next/navigation";

import ProfileForm from "@/components/dashboard/profile-form";
import { ensureProfileForUser } from "@/lib/supabase/ensure-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  await ensureProfileForUser(supabase, user);

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  const profile = profileData as Pick<Profile, "display_name" | "avatar_url"> | null;

  if (profileError) {
    throw new Error(profileError.message);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-violet-500">
            Tài khoản
          </p>
          <h1 className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-3xl font-extrabold text-transparent">
            Cài đặt hồ sơ
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Cập nhật tên hiển thị và ảnh đại diện công khai của bạn.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:shadow-md"
        >
          ← Bảng điều khiển
        </Link>
      </div>

      <div className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-2xl backdrop-blur-xl">
        <ProfileForm
          initialDisplayName={
            profile?.display_name ??
            (user.user_metadata?.display_name as string | undefined) ??
            user.email ??
            "Ẩn danh"
          }
          initialAvatarUrl={profile?.avatar_url ?? null}
        />
      </div>
    </div>
  );
}
