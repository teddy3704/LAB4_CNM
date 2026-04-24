import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { ensureProfileForUser } from "@/lib/supabase/ensure-profile";
import type { AppSupabaseClient } from "@/lib/supabase/types";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options: Parameters<typeof response.cookies.set>[2];
          }>,
        ) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const appSupabase = supabase as unknown as AppSupabaseClient;

  const {
    data: { user },
  } = await appSupabase.auth.getUser();

  if (user) {
    await ensureProfileForUser(appSupabase, user);
  }

  return { response, user };
}
