import type { Metadata } from "next";
import Link from "next/link";

import LoginForm from "@/components/auth/login-form";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Đăng nhập",
  description: `Đăng nhập vào ${SITE_NAME} để quản lý bài viết của bạn.`,
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center px-5 py-12">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl" />
      </div>
      <div className="relative flex w-full flex-col items-center gap-5">
        <LoginForm />
        <p className="text-sm text-zinc-600">
          Chưa có tài khoản?{" "}
          <Link
            className="font-bold text-violet-700 transition hover:text-violet-900 hover:underline"
            href="/register"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
