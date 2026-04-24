# Phan Văn Tiến ProMax Blog (Next.js 16 + Supabase)

Production-oriented publishing platform with secure auth, RLS, Markdown rendering, image uploads, moderation, and SEO metadata.

## 1. Create Supabase project and credentials

1. Create a project in Supabase Dashboard.
2. In **Project Settings → API**, copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Configure environment

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_ALLOWED_DEV_ORIGINS=http://192.168.2.35:3000
```

## 3. Bootstrap database (schema + RLS + storage)

Run `supabase.sql` in Supabase SQL Editor.

This script creates:
- `profiles`, `posts`, `comments`
- enum `post_status`
- foreign keys, checks, triggers, indexes
- RLS policies for all tables
- storage bucket `media` + storage policies
- trigger to auto-create `profiles` row for new auth users

## 4. Install and run app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## OAuth setup (GitHub)

In Supabase Auth providers:
1. Enable GitHub provider.
2. Set GitHub OAuth callback URL to:
   - `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`

## Auth settings (required for signup/login)

In Supabase Auth settings:
1. Set **Site URL** to your app URL (for local: `http://localhost:3000`).
2. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - your production callback URL, for example `https://your-domain.com/auth/callback`

## 5. Test

```bash
npm run lint
npm run test:e2e
```

## Troubleshooting (Windows App Control policy)

If your machine blocks `@tailwindcss/oxide-*.node`, this project already uses a Tailwind v3 toolchain (no `oxide` native binary).  
If you previously installed dependencies from an older setup, clean and reinstall:

```bash
Remove-Item -Recurse -Force .\node_modules
Remove-Item -Force .\package-lock.json -ErrorAction SilentlyContinue
npm install
```

## 6. GitHub delivery

```bash
git init
git add .
git commit -m "feat: phan-van-tien promax platform"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## Feature set

- Auth: Email/Password + GitHub OAuth callback
- Route protection for dashboard/auth flows
- Full post CRUD (create/read/update/delete/publish)
- Profiles with avatar support
- Markdown write + preview + sanitized render
- Commenting + author/post-owner moderation delete
- SEO: metadata, Open Graph/Twitter image routes, `sitemap.xml`, `robots.txt`
