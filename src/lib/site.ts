const fallbackUrl = "http://localhost:3000";
const rawUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const SITE_URL = rawUrl && URL.canParse(rawUrl) ? rawUrl : fallbackUrl;
export const SITE_OWNER_NAME = "My Blog";
export const SITE_NAME = "My Blog";
export const SITE_DESCRIPTION =
  "Nền tảng blog chuyên nghiệp dành cho những người yêu viết lách – được xây dựng với Next.js 16 và Supabase.";

export function getSiteOrigin() {
  return new URL(SITE_URL);
}
