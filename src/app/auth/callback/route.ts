import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { ensureProfileForUser } from "@/lib/supabase/ensure-profile";
import type { AppSupabaseClient } from "@/lib/supabase/types";
import type { Database } from "@/types/database";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const providerError =
    searchParams.get("error_description") ?? searchParams.get("error");
  const nextParam = searchParams.get("next") ?? "/dashboard";
  const next =
    nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/dashboard";

  if (providerError) {
    const url = new URL("/login", request.url);
    url.searchParams.set("error", providerError);
    return NextResponse.redirect(url);
  }

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(
            cookiesToSet: Array<{
              name: string;
              value: string;
              options: Parameters<typeof cookieStore.set>[2];
            }>,
          ) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      },
    );

    const appSupabase = supabase as unknown as AppSupabaseClient;

    const { error } = await appSupabase.auth.exchangeCodeForSession(code);
    if (error) {
      const url = new URL("/login", request.url);
      url.searchParams.set("error", error.message);
      return NextResponse.redirect(url);
    }

    const {
      data: { user },
      error: userError,
    } = await appSupabase.auth.getUser();

    if (userError) {
      const url = new URL("/login", request.url);
      url.searchParams.set("error", userError.message);
      return NextResponse.redirect(url);
    }

    if (user) {
      await ensureProfileForUser(appSupabase, user);
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
