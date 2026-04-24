import type { User } from "@supabase/supabase-js";

import type { AppSupabaseClient } from "@/lib/supabase/types";
import type { Database, Profile } from "@/types/database";

function getDisplayName(user: User) {
  const metadataName = user.user_metadata?.display_name;
  if (typeof metadataName === "string" && metadataName.trim().length > 0) {
    return metadataName.trim();
  }
  return user.email?.split("@")[0] ?? "User";
}

function getAvatarUrl(user: User) {
  const metadataAvatar = user.user_metadata?.avatar_url;
  if (typeof metadataAvatar === "string" && metadataAvatar.trim().length > 0) {
    return metadataAvatar.trim();
  }
  return null;
}

export async function ensureProfileForUser(
  supabase: AppSupabaseClient,
  user: User,
) {
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const existingProfile = profileData as Pick<Profile, "id"> | null;
  if (existingProfile) {
    return;
  }

  const profileInsert: Database["public"]["Tables"]["profiles"]["Insert"] = {
    id: user.id,
    display_name: getDisplayName(user),
    avatar_url: getAvatarUrl(user),
  };

  const { error: insertError } = await supabase
    .from("profiles")
    .insert(profileInsert);

  if (insertError && insertError.code !== "23505") {
    throw new Error(insertError.message);
  }
}
