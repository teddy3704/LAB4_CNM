-- Phan Van Tien ProMax Blog schema + security bootstrap
-- Run this in Supabase SQL Editor on a fresh project.

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'post_status') then
    create type public.post_status as enum ('draft', 'published');
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_display_name_len check (
    display_name is null or char_length(trim(display_name)) between 1 and 80
  )
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  excerpt text,
  content text,
  status public.post_status not null default 'draft',
  cover_image_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  published_at timestamptz,
  constraint posts_title_len check (char_length(trim(title)) between 1 and 200),
  constraint posts_excerpt_len check (
    excerpt is null or char_length(trim(excerpt)) <= 320
  ),
  constraint posts_publish_consistency check (
    (status = 'draft' and published_at is null)
    or (status = 'published' and published_at is not null)
  )
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint comments_content_len check (char_length(trim(content)) between 1 and 2000)
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create index if not exists posts_author_id_idx on public.posts (author_id);
create index if not exists posts_status_published_at_idx on public.posts (status, published_at desc);
create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_title_trgm_idx on public.posts using gin (title gin_trgm_ops);
create index if not exists posts_excerpt_trgm_idx on public.posts using gin (excerpt gin_trgm_ops);
create index if not exists comments_post_id_idx on public.comments (post_id, created_at asc);
create index if not exists comments_author_id_idx on public.comments (author_id);

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;

drop policy if exists "Profiles are readable by everyone" on public.profiles;
create policy "Profiles are readable by everyone"
  on public.profiles
  for select
  using (true);

drop policy if exists "Users can insert their profile" on public.profiles;
create policy "Users can insert their profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their profile" on public.profiles;
create policy "Users can update their profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Published posts are readable by everyone" on public.posts;
create policy "Published posts are readable by everyone"
  on public.posts
  for select
  using (status = 'published' or auth.uid() = author_id);

drop policy if exists "Users can insert their posts" on public.posts;
create policy "Users can insert their posts"
  on public.posts
  for insert
  with check (
    auth.uid() = author_id
    and (
      (status = 'draft' and published_at is null)
      or (status = 'published' and published_at is not null)
    )
  );

drop policy if exists "Users can update their posts" on public.posts;
create policy "Users can update their posts"
  on public.posts
  for update
  using (auth.uid() = author_id)
  with check (
    auth.uid() = author_id
    and (
      (status = 'draft' and published_at is null)
      or (status = 'published' and published_at is not null)
    )
  );

drop policy if exists "Users can delete their posts" on public.posts;
create policy "Users can delete their posts"
  on public.posts
  for delete
  using (auth.uid() = author_id);

drop policy if exists "Comments are readable on published posts" on public.comments;
create policy "Comments are readable on published posts"
  on public.comments
  for select
  using (
    auth.uid() = author_id
    or exists (
      select 1
      from public.posts p
      where p.id = comments.post_id
        and (p.status = 'published' or p.author_id = auth.uid())
    )
  );

drop policy if exists "Users can insert their comments" on public.comments;
create policy "Users can insert their comments"
  on public.comments
  for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1
      from public.posts p
      where p.id = comments.post_id
        and (p.status = 'published' or p.author_id = auth.uid())
    )
  );

drop policy if exists "Comment owners or post owners can delete comments" on public.comments;
create policy "Comment owners or post owners can delete comments"
  on public.comments
  for delete
  using (
    auth.uid() = author_id
    or exists (
      select 1
      from public.posts p
      where p.id = comments.post_id
        and p.author_id = auth.uid()
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read access for media" on storage.objects;
create policy "Public read access for media"
  on storage.objects
  for select
  using (bucket_id = 'media');

drop policy if exists "Users can upload media" on storage.objects;
create policy "Users can upload media"
  on storage.objects
  for insert
  with check (
    bucket_id = 'media'
    and auth.uid() is not null
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Users can update their media" on storage.objects;
create policy "Users can update their media"
  on storage.objects
  for update
  using (
    bucket_id = 'media'
    and auth.uid() is not null
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'media'
    and auth.uid() is not null
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Users can delete their media" on storage.objects;
create policy "Users can delete their media"
  on storage.objects
  for delete
  using (
    bucket_id = 'media'
    and auth.uid() is not null
    and split_part(name, '/', 1) = auth.uid()::text
  );

notify pgrst, 'reload schema';
