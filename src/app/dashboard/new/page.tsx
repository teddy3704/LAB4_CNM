import { redirect } from "next/navigation";

import PostForm from "@/components/dashboard/post-form";
import { ensureProfileForUser } from "@/lib/supabase/ensure-profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function NewPostPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }
  await ensureProfileForUser(supabase, user);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-3xl font-semibold text-zinc-900">New post</h1>
        <p className="text-sm text-zinc-500">Draft something great.</p>
      </div>
      <PostForm />
    </div>
  );
}
