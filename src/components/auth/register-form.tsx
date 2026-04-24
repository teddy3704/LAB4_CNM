"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useToast } from "@/components/ui/toast";
import { SITE_NAME } from "@/lib/site";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function parseRegisterError(rawMessage: string) {
  const message = rawMessage.toLowerCase();

  if (
    message.includes("already") ||
    message.includes("duplicate") ||
    message.includes("đã được sử dụng")
  ) {
    return "Email này đã tồn tại. Vui lòng đăng nhập hoặc dùng email khác.";
  }

  if (message.includes("password")) {
    return "Mật khẩu phải có ít nhất 8 ký tự và đủ mạnh để bảo vệ tài khoản.";
  }

  if (
    message.includes("github") ||
    message.includes("provider") ||
    message.includes("oauth")
  ) {
    return "Đăng ký với GitHub hiện chưa sẵn sàng. Vui lòng thử lại sau.";
  }

  return rawMessage;
}

export default function RegisterForm() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const { success, error: toastError } = useToast();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setInlineError(null);

    const trimmedName = displayName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setInlineError("Vui lòng nhập tên hiển thị.");
      return;
    }

    if (!normalizedEmail) {
      setInlineError("Vui lòng nhập địa chỉ email.");
      return;
    }

    if (password.length < 8) {
      setInlineError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    if (password !== confirmPassword) {
      setInlineError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);

    try {
      const { error: registerError } = await supabase.rpc("register_email_user", {
        p_display_name: trimmedName,
        p_email: normalizedEmail,
        p_password: password,
      });

      if (registerError) {
        throw new Error(parseRegisterError(registerError.message));
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (signInError) {
        throw new Error(
          "Tài khoản đã được tạo nhưng đăng nhập tự động thất bại. Vui lòng thử đăng nhập thủ công.",
        );
      }

      success("Đăng ký thành công! Đang đưa bạn vào bảng điều khiển.");
      router.refresh();
      router.push("/dashboard");
    } catch (caught) {
      const message =
        caught instanceof Error
          ? parseRegisterError(caught.message)
          : "Không thể tạo tài khoản lúc này.";
      setInlineError(message);
      toastError("Đăng ký thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const handleGitHubRegister = async () => {
    setInlineError(null);
    setOauthLoading(true);

    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          skipBrowserRedirect: true,
        },
      });

      if (oauthError) {
        throw new Error(oauthError.message);
      }

      if (!data.url) {
        throw new Error("Không lấy được liên kết đăng nhập GitHub.");
      }

      window.location.assign(data.url);
    } catch (caught) {
      const message =
        caught instanceof Error
          ? parseRegisterError(caught.message)
          : "Không thể kết nối GitHub lúc này.";
      setInlineError(message);
      toastError("Đăng ký với GitHub thất bại!");
      setOauthLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/60 bg-white/80 p-8 shadow-2xl backdrop-blur-xl">
      {/* Tiêu đề */}
      <div className="mb-7 space-y-2 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 text-2xl shadow-lg">
          🚀
        </div>
        <h1 className="text-2xl font-extrabold text-zinc-900">Tạo tài khoản mới</h1>
        <p className="text-sm text-zinc-500">
          Tham gia <span className="font-semibold text-violet-700">{SITE_NAME}</span> và
          truy cập bảng điều khiển ngay sau khi đăng ký.
        </p>
      </div>

      <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50/80 px-4 py-3 text-sm text-blue-800">
        ✅ Đăng ký bằng email trên phiên bản này không cần chờ email xác nhận.
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-zinc-700" htmlFor="displayName">
            Tên hiển thị
          </label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white/90 px-4 py-2.5 text-sm transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
            placeholder="Tên của bạn"
            required
            autoComplete="name"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-zinc-700" htmlFor="email">
            Địa chỉ email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white/90 px-4 py-2.5 text-sm transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
            placeholder="Tối thiểu 8 ký tự"
            required
            autoComplete="new-password"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-zinc-700" htmlFor="confirmPassword">
            Xác nhận mật khẩu
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white/90 px-4 py-2.5 text-sm transition focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-200"
            placeholder="Nhập lại mật khẩu"
            required
            autoComplete="new-password"
          />
        </div>

        {inlineError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            ⚠ {inlineError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Đang tạo tài khoản..." : "Tạo tài khoản và vào ngay"}
        </button>

        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span className="h-px flex-1 bg-zinc-200" />
          HOẶC
          <span className="h-px flex-1 bg-zinc-200" />
        </div>

        <button
          type="button"
          onClick={handleGitHubRegister}
          disabled={oauthLoading}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          {oauthLoading ? "Đang chuyển tới GitHub..." : "Tiếp tục với GitHub"}
        </button>
      </form>
    </div>
  );
}
