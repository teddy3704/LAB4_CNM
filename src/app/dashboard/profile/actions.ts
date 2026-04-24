"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

interface ProfileFormState {
  error: string | null;
  success: boolean;
}

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to update your profile.", success: false };
  }

  const displayName = String(formData.get("display_name") ?? "").trim();
  const avatarUrl = String(formData.get("avatar_url") ?? "").trim();

  if (!displayName) {
    return { error: "Display name is required.", success: false };
  }

  const profileUpsert: Database["public"]["Tables"]["profiles"]["Insert"] = {
    id: user.id,
    display_name: displayName,
    avatar_url: avatarUrl || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("profiles")
    .upsert(profileUpsert, { onConflict: "id" });

  if (error) {
    return { error: error.message, success: false };
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: {
      display_name: displayName,
    },
  });

  if (authError) {
    return { error: authError.message, success: false };
  }

  revalidatePath("/dashboard/profile");
  revalidatePath("/", "layout");
  return { error: null, success: true };
}
