import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";
import type { AppSupabaseClient } from "@/lib/supabase/types";

export function createSupabaseBrowserClient() {
  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  return supabase as unknown as AppSupabaseClient;
}
