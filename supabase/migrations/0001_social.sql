-- Getup — shared backend schema (Supabase / Postgres 15+)
-- Every privacy rule lives HERE (Row Level Security), not in the app UI.
-- Private wardrobe tables are owner-only. Social visibility is decided by
-- can_view_post(), which the app's local demo mirrors in src/social/rules.ts.

create extension if not exists citext;

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      citext not null unique check (username ~ '^[a-z0-9_.]{3,24}$' and username !~ '^[._]|[._]$' and username !~ '\.\.'),
  display_name  text   not null check (char_length(display_name) between 1 and 40),
  bio           text   check (char_length(bio) <= 160),
  avatar_path   text,
  style_tags    text[] not null default '{}' check (cardinality(style_tags) <= 5),
  is_private    boolean not null default true,          -- private by default (teen safety)
  birth_year    int check (birth_year between 1900 and 2100),
  role          text not null default 'user' check (role in ('user','moderator','admin')),
  suspended_at  timestamptz,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------- private wardrobe (owner-only)
create table public.wardrobe_items (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  data        jsonb not null,               -- ClothingItem shape from src/types/models.ts
  image_path  text,                          -- bucket 'wardrobe' (private)
  updated_at  timestamptz not null default now()
);
create index on public.wardrobe_items (owner_id);

create table public.outfits (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  item_ids   uuid[] not null,
  name       text,
  saved      boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.outfits (owner_id);

create table public.wear_logs (
  id        uuid primary key default gen_random_uuid(),
  owner_id  uuid not null references public.profiles(id) on delete cascade,
  worn_on   date not null,
  item_ids  uuid[] not null,
  outfit_id uuid references public.outfits(id) on delete set null
);
create index on public.wear_logs (owner_id, worn_on desc);

-- ---------------------------------------------------------------- social graph
create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followed_id uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);
create index on public.follows (followed_id);

create table public.follow_requests (
  requester_id uuid not null references public.profiles(id) on delete cascade,
  target_id    uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (requester_id, target_id),
  check (requester_id <> target_id)
);
create index on public.follow_requests (target_id);

create table public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index on public.blocks (blocked_id);

-- ---------------------------------------------------------------- posts
create table public.posts (
  id                uuid primary key default gen_random_uuid(),
  author_id         uuid not null references public.profiles(id) on delete cascade,
  caption           text not null default '' check (char_length(caption) <= 2200),
  style_tags        text[] not null default '{}' check (cardinality(style_tags) <= 10),
  audience          text not null default 'public' check (audience in ('public','followers','private')),
  comments_disabled boolean not null default false,
  like_count        int not null default 0,
  comment_count     int not null default 0,
  removed_at        timestamptz,             -- moderation soft-delete
  created_at        timestamptz not null default now()
);
create index on public.posts (author_id, created_at desc);
create index on public.posts (created_at desc) where audience = 'public' and removed_at is null;
create index on public.posts using gin (style_tags);

create table public.post_images (
  post_id  uuid not null references public.posts(id) on delete cascade,
  position smallint not null check (position between 0 and 3),
  path     text not null,                    -- bucket 'post-media' (private; served via signed URLs)
  primary key (post_id, position)
);

-- Tagged garments: only fields the poster chose to disclose. No link to wardrobe_items.
create table public.post_item_tags (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references public.posts(id) on delete cascade,
  category_id   text not null,
  primary_color text not null,
  secondary_colors text[] not null default '{}',
  pattern       text,
  fit           text,
  style_tags    text[] not null default '{}',
  formality     smallint check (formality between 1 and 5),
  warmth        smallint check (warmth between 1 and 5),
  brand         text check (char_length(brand) <= 60),
  product_name  text check (char_length(product_name) <= 80)
);
create index on public.post_item_tags (post_id);
create index on public.post_item_tags (category_id);

create table public.likes (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  post_id    uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);
create index on public.likes (post_id);

create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  author_id  uuid not null references public.profiles(id) on delete cascade,
  parent_id  uuid references public.comments(id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 500),
  removed_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.comments (post_id, created_at);

create table public.saved_posts (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  post_id    uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table public.collections (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  name       text not null check (char_length(name) between 1 and 40),
  created_at timestamptz not null default now(),
  unique (owner_id, name)
);
create table public.collection_posts (
  collection_id uuid not null references public.collections(id) on delete cascade,
  post_id       uuid not null references public.posts(id) on delete cascade,
  primary key (collection_id, post_id)
);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       text not null check (kind in ('follow','followRequest','followAccepted','like','comment','reply')),
  actor_id   uuid not null references public.profiles(id) on delete cascade,
  post_id    uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.notifications (user_id, created_at desc);

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target      text not null check (target in ('post','comment','account')),
  target_id   uuid not null,
  reason      text not null check (reason in ('spam','harassment','nudity','hate','selfHarm','minorSafety','other')),
  note        text check (char_length(note) <= 500),
  status      text not null default 'open' check (status in ('open','actioned','dismissed')),
  resolved_by uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  unique (reporter_id, target, target_id)
);
create index on public.reports (status, created_at);

-- ---------------------------------------------------------------- helper predicates
create or replace function public.is_blocked(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from blocks where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a));
$$;

create or replace function public.is_moderator() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('moderator','admin'));
$$;

create or replace function public.can_view_post(p public.posts) returns boolean
language sql stable security definer set search_path = public as $$
  select
    p.author_id = auth.uid()
    or (
      p.removed_at is null
      and p.audience <> 'private'
      and not is_blocked(auth.uid(), p.author_id)
      and not exists (select 1 from profiles a where a.id = p.author_id and a.suspended_at is not null)
      and (
        (p.audience = 'public' and not (select is_private from profiles where id = p.author_id))
        or exists (select 1 from follows f where f.follower_id = auth.uid() and f.followed_id = p.author_id)
      )
    )
    or is_moderator();
$$;

create or replace function public.can_view_post_id(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select can_view_post(p) from posts p where p.id = pid), false);
$$;

-- Simple per-user rate limit: N rows in table within window.
create or replace function public.enforce_rate_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare n int; lim int := tg_argv[1]::int; win interval := tg_argv[2]::interval; col text := tg_argv[0];
begin
  execute format('select count(*) from %I.%I where %I = $1 and created_at > now() - $2', tg_table_schema, tg_table_name, col)
    into n using (to_jsonb(new) ->> col)::uuid, win;
  if n >= lim then raise exception 'rate_limited' using errcode = 'P0001'; end if;
  return new;
end $$;

create trigger rl_posts    before insert on public.posts    for each row execute function enforce_rate_limit('author_id', '10', '1 hour');
create trigger rl_comments before insert on public.comments for each row execute function enforce_rate_limit('author_id', '30', '1 minute');
create trigger rl_likes    before insert on public.likes    for each row execute function enforce_rate_limit('user_id', '60', '1 minute');
create trigger rl_follows  before insert on public.follows  for each row execute function enforce_rate_limit('follower_id', '30', '1 minute');
create trigger rl_reports  before insert on public.reports  for each row execute function enforce_rate_limit('reporter_id', '20', '1 hour');

-- ---------------------------------------------------------------- integrity triggers
create or replace function public.on_like_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update posts set like_count = like_count + 1 where id = new.post_id;
    insert into notifications (user_id, kind, actor_id, post_id)
      select author_id, 'like', new.user_id, new.post_id from posts where id = new.post_id and author_id <> new.user_id;
    return new;
  else
    update posts set like_count = greatest(0, like_count - 1) where id = old.post_id;
    return old;
  end if;
end $$;
create trigger likes_count after insert or delete on public.likes for each row execute function on_like_change();

create or replace function public.on_comment_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if (select comments_disabled from posts where id = new.post_id) then raise exception 'comments_disabled'; end if;
    if new.parent_id is not null and exists (select 1 from comments where id = new.parent_id and parent_id is not null) then
      raise exception 'replies_one_level';
    end if;
    update posts set comment_count = comment_count + 1 where id = new.post_id;
    insert into notifications (user_id, kind, actor_id, post_id, comment_id)
      select author_id, 'comment', new.author_id, new.post_id, new.id from posts where id = new.post_id and author_id <> new.author_id;
    if new.parent_id is not null then
      insert into notifications (user_id, kind, actor_id, post_id, comment_id)
        select author_id, 'reply', new.author_id, new.post_id, new.id from comments where id = new.parent_id and author_id <> new.author_id;
    end if;
    return new;
  else
    update posts set comment_count = greatest(0, comment_count - 1) where id = old.post_id;
    return old;
  end if;
end $$;
create trigger comments_count after insert or delete on public.comments for each row execute function on_comment_change();

-- Blocking severs follows/requests both ways.
create or replace function public.on_block() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  delete from follows where (follower_id = new.blocker_id and followed_id = new.blocked_id) or (follower_id = new.blocked_id and followed_id = new.blocker_id);
  delete from follow_requests where (requester_id = new.blocker_id and target_id = new.blocked_id) or (requester_id = new.blocked_id and target_id = new.blocker_id);
  return new;
end $$;
create trigger blocks_sever after insert on public.blocks for each row execute function on_block();

-- Following a private account creates a request instead (the app calls request_follow()).
create or replace function public.request_follow(target uuid) returns text
language plpgsql security definer set search_path = public as $$
begin
  if target = auth.uid() then raise exception 'self_follow'; end if;
  if is_blocked(auth.uid(), target) then raise exception 'blocked'; end if;
  if (select is_private from profiles where id = target) then
    insert into follow_requests (requester_id, target_id) values (auth.uid(), target) on conflict do nothing;
    insert into notifications (user_id, kind, actor_id) values (target, 'followRequest', auth.uid());
    return 'requested';
  end if;
  insert into follows (follower_id, followed_id) values (auth.uid(), target) on conflict do nothing;
  insert into notifications (user_id, kind, actor_id) values (target, 'follow', auth.uid());
  return 'following';
end $$;

create or replace function public.respond_follow_request(requester uuid, accept boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from follow_requests where requester_id = requester and target_id = auth.uid();
  if not found then raise exception 'no_request'; end if;
  if accept then
    insert into follows (follower_id, followed_id) values (requester, auth.uid()) on conflict do nothing;
    insert into notifications (user_id, kind, actor_id) values (requester, 'followAccepted', auth.uid());
  end if;
end $$;

-- Account deletion (App Store 5.1.1(v)): removes the auth user; everything cascades.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  delete from auth.users where id = auth.uid();
end $$;

-- ---------------------------------------------------------------- RLS
alter table public.profiles         enable row level security;
alter table public.wardrobe_items   enable row level security;
alter table public.outfits          enable row level security;
alter table public.wear_logs        enable row level security;
alter table public.follows          enable row level security;
alter table public.follow_requests  enable row level security;
alter table public.blocks           enable row level security;
alter table public.posts            enable row level security;
alter table public.post_images      enable row level security;
alter table public.post_item_tags   enable row level security;
alter table public.likes            enable row level security;
alter table public.comments         enable row level security;
alter table public.saved_posts      enable row level security;
alter table public.collections      enable row level security;
alter table public.collection_posts enable row level security;
alter table public.notifications    enable row level security;
alter table public.reports          enable row level security;

-- profiles: discoverable unless blocked; editable by owner (role/suspension columns protected by trigger below)
create policy profiles_read   on public.profiles for select using (not is_blocked(auth.uid(), id) or id = auth.uid());
create policy profiles_insert on public.profiles for insert with check (id = auth.uid());
create policy profiles_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.protect_profile_admin_fields() returns trigger
language plpgsql as $$
begin
  if not is_moderator() and (new.role is distinct from old.role or new.suspended_at is distinct from old.suspended_at) then
    raise exception 'forbidden';
  end if;
  return new;
end $$;
create trigger profiles_protect before update on public.profiles for each row execute function protect_profile_admin_fields();

-- private wardrobe: owner only, all operations
create policy wardrobe_owner on public.wardrobe_items for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy outfits_owner  on public.outfits        for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy wear_owner     on public.wear_logs      for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- graph
-- Follower lists are visible when the followed account's content is visible to you.
-- (Helper is SECURITY DEFINER so the policy doesn't recurse into follows.)
create or replace function public.can_view_profile_content(owner uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select owner = auth.uid() or (
    not is_blocked(auth.uid(), owner)
    and (not (select is_private from profiles where id = owner)
         or exists (select 1 from follows f where f.follower_id = auth.uid() and f.followed_id = owner)));
$$;
create policy follows_read on public.follows for select using (
  follower_id = auth.uid() or followed_id = auth.uid() or can_view_profile_content(followed_id));
create policy follows_delete on public.follows for delete using (follower_id = auth.uid() or followed_id = auth.uid()); -- unfollow / remove follower
-- inserts only via request_follow()/respond_follow_request() (security definer)

create policy requests_read   on public.follow_requests for select using (requester_id = auth.uid() or target_id = auth.uid());
create policy requests_cancel on public.follow_requests for delete using (requester_id = auth.uid() or target_id = auth.uid());

create policy blocks_own on public.blocks for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- posts
create policy posts_read   on public.posts for select using (can_view_post(posts));
create policy posts_insert on public.posts for insert with check (
  author_id = auth.uid() and not exists (select 1 from profiles where id = auth.uid() and suspended_at is not null));
create policy posts_update on public.posts for update using (author_id = auth.uid() or is_moderator()) with check (author_id = auth.uid() or is_moderator());
create policy posts_delete on public.posts for delete using (author_id = auth.uid() or is_moderator());

create policy images_read  on public.post_images for select using (can_view_post_id(post_id));
create policy images_write on public.post_images for all using (exists (select 1 from posts where id = post_id and author_id = auth.uid()))
  with check (exists (select 1 from posts where id = post_id and author_id = auth.uid()));
create policy tags_read  on public.post_item_tags for select using (can_view_post_id(post_id));
create policy tags_write on public.post_item_tags for all using (exists (select 1 from posts where id = post_id and author_id = auth.uid()))
  with check (exists (select 1 from posts where id = post_id and author_id = auth.uid()));

-- likes / comments: only on posts you can see
create policy likes_read   on public.likes for select using (can_view_post_id(post_id));
create policy likes_insert on public.likes for insert with check (user_id = auth.uid() and can_view_post_id(post_id));
create policy likes_delete on public.likes for delete using (user_id = auth.uid());

create policy comments_read   on public.comments for select using (can_view_post_id(post_id) and (removed_at is null or is_moderator()) and not is_blocked(auth.uid(), author_id));
create policy comments_insert on public.comments for insert with check (author_id = auth.uid() and can_view_post_id(post_id));
create policy comments_delete on public.comments for delete using (
  author_id = auth.uid() or exists (select 1 from posts p where p.id = post_id and p.author_id = auth.uid()) or is_moderator());

-- private collections & saves
create policy saved_own on public.saved_posts for all using (user_id = auth.uid()) with check (user_id = auth.uid() and can_view_post_id(post_id));
create policy collections_own on public.collections for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy collection_posts_own on public.collection_posts for all
  using (exists (select 1 from collections c where c.id = collection_id and c.owner_id = auth.uid()))
  with check (exists (select 1 from collections c where c.id = collection_id and c.owner_id = auth.uid()) and can_view_post_id(post_id));

create policy notif_own on public.notifications for select using (user_id = auth.uid());
create policy notif_mark on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- reports: anyone can file; only moderators can read/resolve
create policy reports_insert on public.reports for insert with check (reporter_id = auth.uid());
create policy reports_mod    on public.reports for select using (is_moderator() or reporter_id = auth.uid());
create policy reports_update on public.reports for update using (is_moderator()) with check (is_moderator());

-- ---------------------------------------------------------------- storage (Supabase Storage)
-- Buckets are PRIVATE. Wardrobe photos: owner only. Post media: readable only if the post is visible.
-- Object paths: wardrobe/<uid>/<file>, post-media/<uid>/<post_id>/<n>.jpg
insert into storage.buckets (id, name, public) values ('wardrobe', 'wardrobe', false), ('post-media', 'post-media', false)
  on conflict (id) do nothing;

create policy wardrobe_obj on storage.objects for all
  using (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = auth.uid()::text);

create policy media_write on storage.objects for insert
  with check (bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy media_delete on storage.objects for delete
  using (bucket_id = 'post-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy media_read on storage.objects for select
  using (bucket_id = 'post-media' and can_view_post_id(((storage.foldername(name))[2])::uuid));
