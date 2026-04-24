import { SITE_NAME } from "@/lib/site";

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/40 bg-white/60 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-5 text-xs text-zinc-500 md:flex-row md:items-center md:justify-between">
        <span className="font-medium">
          {SITE_NAME} &middot; Được xây dựng với Next.js & Supabase
        </span>
        <span>
          &copy; {new Date().getFullYear()} {SITE_NAME}. Bảo lưu mọi quyền.
        </span>
      </div>
    </footer>
  );
}
