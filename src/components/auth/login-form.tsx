"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { useToast } from "@/components/ui/toast";
import { SITE_NAME } from "@/lib/site";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  const { success, error: toastError } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const callbackError = searchParams.get("error");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInlineError(null);
    setNeedsConfirmation(false);
    setLoading(true);

    const redirectTo = searchParams.get("redirectedFrom") ?? "/dashboard";

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      const msg = signInError.message;
      const isConfirmError = msg.toLowerCase().includes("confirm") || msg.toLowerCase().includes("verify");
      if (isConfirmError) setNeedsConfirmation(true);
      setInlineError(isConfirmError ? "Email chưa được xác nhận. Vui lòng kiểm tra hộp thư." : "Email hoặc mật khẩu không đúng. Vui lòng thử lại.");
      toastError("Đăng nhập thất bại!");
      setLoading(false);
      return;
    }

    success("Đăng nhập thành công! Đang chuyển hướng...");
    router.push(redirectTo);
  };

  const handleGitHubLogin = async () => {
    setInlineError(null);
    setOauthLoading(true);
    const redirectTo = searchParams.get("redirectedFrom") ?? "/dashboard";

    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          skipBrowserRedirect: true,
        },
      });

      if (oauthError) {
        throw oauthError;
      }

      if (!data.url) {
        throw new Error("Không lấy được liên kết đăng nhập GitHub.");
      }

      window.location.assign(data.url);
    } catch {
      setInlineError("Không thể kết nối với GitHub. Vui lòng thử lại.");
      toastError("Đăng nhập GitHub thất bại!");
      setOauthLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
    if (resendError) {
      toastError("Không thể gửi lại email xác nhận.");
    } else {
      success("Email xác nhận đã được gửi lại!");
    }
    setResendLoading(false);
  };

  const visibleError =
    inlineError ?? (callbackError ? decodeURIComponent(callbackError) : null);

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/80 p-8 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="mb-7 space-y-2 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg text-2xl">
          👋
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900">Chào mừng trở lại!</h1>
        <p className="text-sm text-zinc-500">
          Đăng nhập để quản lý bài viết trên <span className="font-semibold text-violet-700">{SITE_NAME}</span>.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-zinc-700" htmlFor="email">
            Địa chỉ email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white/90 px-4 py-2.5 text-sm transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
            placeholder="ban@example.com"
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-zinc-700" htmlFor="password">
            Mật khẩu
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white/90 px-4 py-2.5 text-sm transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>

        {visibleError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            ⚠ {visibleError}
          </div>
        ) : null}

        {needsConfirmation ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-semibold">Email chưa được xác nhận</p>
            <p className="mt-0.5 text-xs">Kiểm tra hộp thư của bạn để xác nhận tài khoản.</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="mt-2 text-xs font-bold text-amber-700 underline hover:text-amber-900 disabled:opacity-60"
            >
              {resendLoading ? "Đang gửi lại..." : "Gửi lại email xác nhận"}
            </button>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200" />
        HOẶC
        <span className="h-px flex-1 bg-zinc-200" />
      </div>

      <button
        type="button"
        onClick={handleGitHubLogin}
        disabled={oauthLoading}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
        {oauthLoading ? "Đang kết nối..." : "Tiếp tục với GitHub"}
      </button>
    </div>
  );
}


