import type { Metadata } from "next";
import Link from "next/link";

import RegisterForm from "@/components/auth/register-form";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Đăng ký tài khoản",
  description: `Tạo tài khoản mới trên ${SITE_NAME} và bắt đầu hành trình viết lách của bạn.`,
};

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center px-5 py-12">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-violet-300/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-pink-300/20 blur-3xl" />
      </div>
      <div className="relative flex w-full flex-col items-center gap-5">
        <RegisterForm />
        <p className="text-sm text-zinc-600">
          Đã có tài khoản?{" "}
          <Link
            className="font-bold text-violet-700 transition hover:text-violet-900 hover:underline"
            href="/login"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
