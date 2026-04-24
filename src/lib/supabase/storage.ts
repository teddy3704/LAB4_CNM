import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export async function uploadPublicImage(
  client: SupabaseClient<Database>,
  file: File,
  pathPrefix: string,
) {
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error("You must be signed in to upload media.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const fileName = `${user.id}/${pathPrefix}/${crypto.randomUUID()}.${extension}`;

  const { error } = await client.storage.from("media").upload(fileName, file, {
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = client.storage.from("media").getPublicUrl(fileName);
  return data.publicUrl;
}
