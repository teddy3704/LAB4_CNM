import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Post } from "@/types/database";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createSupabaseServerClient();
  const baseUrl = SITE_URL.replace(/\/$/, "");

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, author_id, published_at, updated_at, cover_image_url")
    .eq("status", "published");

  if (error) {
    throw new Error(error.message);
  }

  const publishedPosts = (posts ?? []) as Pick<
    Post,
    "id" | "author_id" | "published_at" | "updated_at" | "cover_image_url"
  >[];
  const authorIds = new Set(publishedPosts.map((post) => post.author_id));

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  publishedPosts.forEach((post) => {
    routes.push({
      url: `${baseUrl}/posts/${post.id}`,
      lastModified: post.updated_at ?? post.published_at ?? new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
      images: post.cover_image_url ? [post.cover_image_url] : undefined,
    });
  });

  authorIds.forEach((authorId) => {
    routes.push({
      url: `${baseUrl}/author/${authorId}`,
      changeFrequency: "monthly",
      priority: 0.4,
    });
  });

  return routes;
}
