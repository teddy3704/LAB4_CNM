import Image from "next/image";
import Link from "next/link";

import { signOut } from "@/app/actions";
import { SITE_NAME } from "@/lib/site";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SiteHeader() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: { display_name: string | null; avatar_url?: string | null } | null =
    null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();
    profile = data;
  }

  const displayName =
    profile?.display_name ??
    (user?.user_metadata?.display_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Khách";
  const avatarLetter = displayName.slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-white/30 bg-white/70 shadow-sm backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5">
        {/* Logo + nav */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-lg font-bold text-transparent transition-opacity hover:opacity-80"
          >
            {SITE_NAME}
          </Link>
          <nav className="hidden items-center gap-5 text-sm font-medium text-zinc-600 md:flex">
            <Link href="/" className="transition hover:text-zinc-900">
              Trang chủ
            </Link>
            {user ? (
              <Link href="/dashboard" className="transition hover:text-zinc-900">
                Bảng điều khiển
              </Link>
            ) : null}
          </nav>
        </div>

        {/* Auth section */}
        {user ? (
          <div className="flex items-center gap-3 text-sm text-zinc-600">
            <div className="hidden items-center gap-2.5 md:flex">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={displayName}
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-md"
                  unoptimized
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-sm font-bold text-white shadow-md">
                  {avatarLetter}
                </div>
              )}
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                  Đã đăng nhập
                </span>
                <span className="font-semibold text-zinc-800">{displayName}</span>
              </div>
            </div>
            <Link
              href="/dashboard/profile"
              className="hidden rounded-lg px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-100 md:inline-flex"
            >
              Hồ sơ
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-xl border border-zinc-200 px-3.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm"
              >
                Đăng xuất
              </button>
            </form>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
            >
              Đăng nhập
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-1.5 text-sm font-semibold text-white shadow-md transition hover:scale-105 hover:shadow-lg"
            >
              Bắt đầu
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
