import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 – Không tìm thấy trang",
};

export default function NotFound() {
  return (
    <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center gap-6 overflow-hidden px-6 py-24 text-center">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-violet-200/40 blur-3xl" />

      <span className="text-7xl">🗺️</span>
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-400">
        Lỗi 404
      </p>
      <h1 className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-4xl font-extrabold text-transparent">
        Không tìm thấy trang
      </h1>
      <p className="max-w-sm text-sm leading-relaxed text-zinc-500">
        Trang bạn đang tìm kiếm có thể đã bị xoá, đổi địa chỉ, hoặc chưa tồn tại.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
      >
        ← Về trang chủ
      </Link>
    </div>
  );
}
