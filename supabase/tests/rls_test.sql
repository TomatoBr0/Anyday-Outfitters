-- RLS / server-side enforcement tests. Run with supabase/tests/run.sh.
-- Each block runs AS the non-owner `authenticated` role with a given auth.uid().
\set ON_ERROR_STOP on
\set alice '''00000000-0000-0000-0000-00000000000a'''
\set bob   '''00000000-0000-0000-0000-00000000000b'''
\set carol '''00000000-0000-0000-0000-00000000000c'''
\set mod   '''00000000-0000-0000-0000-00000000000d'''

-- seed (as superuser)
insert into auth.users values (:alice), (:bob), (:carol), (:mod);
insert into profiles (id, username, display_name, is_private, role) values
  (:alice, 'alice', 'Alice', false, 'user'), (:bob, 'bob', 'Bob', true, 'user'),
  (:carol, 'carol', 'Carol', false, 'user'), (:mod, 'mod', 'Mod', false, 'moderator');

create or replace function pg_temp.expect_error(sql text, label text) returns void language plpgsql as $$
begin
  begin execute sql; exception when others then raise notice 'PASS  %  (%)', label, sqlerrm; return; end;
  raise exception 'FAIL  % — expected an error', label;
end $$;
create or replace function pg_temp.check(cond boolean, label text) returns void language plpgsql as $$
begin
  if cond then raise notice 'PASS  %', label; else raise exception 'FAIL  %', label; end if;
end $$;

set role authenticated;

-- ---------------- Alice posts
select set_config('request.jwt.claim.sub', :alice, false);
insert into posts (id, author_id, caption, audience) values
  ('10000000-0000-0000-0000-000000000001', :alice, 'public', 'public'),
  ('10000000-0000-0000-0000-000000000002', :alice, 'followers', 'followers'),
  ('10000000-0000-0000-0000-000000000003', :alice, 'draft', 'private');
insert into wardrobe_items (owner_id, data) values (:alice, '{"name":"secret jeans"}');
insert into storage.objects (bucket_id, name) values ('post-media', '00000000-0000-0000-0000-00000000000a/10000000-0000-0000-0000-000000000001/0.jpg');
insert into storage.objects (bucket_id, name) values ('wardrobe', '00000000-0000-0000-0000-00000000000a/jeans.jpg');
select pg_temp.check((select count(*) from posts) = 3, 'author sees all own posts incl. private draft');
select pg_temp.expect_error($$insert into posts (author_id, caption) values ('00000000-0000-0000-0000-00000000000b', 'spoof')$$, 'cannot post as someone else');
select pg_temp.expect_error($$update profiles set role = 'admin' where id = auth.uid()$$, 'cannot self-promote to admin');

-- ---------------- Carol (stranger)
select set_config('request.jwt.claim.sub', :carol, false);
select pg_temp.check((select array_agg(caption) from posts) = array['public'], 'stranger sees only public post');
select pg_temp.check((select count(*) from wardrobe_items) = 0, 'stranger cannot read private wardrobe');
select pg_temp.check((select count(*) from storage.objects where bucket_id = 'wardrobe') = 0, 'stranger cannot read wardrobe photos');
select pg_temp.check((select count(*) from storage.objects where bucket_id = 'post-media') = 1, 'stranger can read media of public post');
select pg_temp.expect_error($$insert into likes (user_id, post_id) values (auth.uid(), '10000000-0000-0000-0000-000000000002')$$, 'cannot like a followers-only post');
update posts set caption = 'hacked' where id = '10000000-0000-0000-0000-000000000001';
insert into likes (user_id, post_id) values (:carol, '10000000-0000-0000-0000-000000000001');
insert into comments (post_id, author_id, body) values ('10000000-0000-0000-0000-000000000001', :carol, 'love it');
insert into reports (reporter_id, target, target_id, reason) values (:carol, 'post', '10000000-0000-0000-0000-000000000001', 'spam');

-- ---------------- Alice checks counters, notifications, edit protection
select set_config('request.jwt.claim.sub', :alice, false);
select pg_temp.check((select caption from posts where id = '10000000-0000-0000-0000-000000000001') = 'public', 'stranger could not edit the post');
select pg_temp.check((select like_count from posts where id = '10000000-0000-0000-0000-000000000001') = 1, 'like counter updated by trigger');
select pg_temp.check((select count(*) from notifications where kind in ('like','comment')) = 2, 'author notified of like + comment');
select pg_temp.check((select count(*) from reports) = 0, 'non-moderators cannot read others’ reports');
update posts set comments_disabled = true where id = '10000000-0000-0000-0000-000000000001';

-- ---------------- Bob (private account)
select set_config('request.jwt.claim.sub', :bob, false);
insert into posts (id, author_id, caption) values ('20000000-0000-0000-0000-000000000001', :bob, 'bob public post on private account');
select pg_temp.expect_error($$insert into comments (post_id, author_id, body) values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b', 'hi')$$, 'comments disabled is enforced');

select set_config('request.jwt.claim.sub', :carol, false);
select pg_temp.check((select count(*) from posts where author_id = :bob) = 0, 'private account posts hidden from non-followers');
select pg_temp.check(request_follow(:bob) = 'requested', 'following a private account creates a request');
select pg_temp.check((select count(*) from posts where author_id = :bob) = 0, 'still hidden while request pending');
select pg_temp.expect_error($$insert into follows values ('00000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-00000000000b')$$, 'cannot bypass approval by inserting a follow');

select set_config('request.jwt.claim.sub', :bob, false);
select respond_follow_request(:carol, true);

select set_config('request.jwt.claim.sub', :carol, false);
select pg_temp.check((select count(*) from posts where author_id = :bob) = 1, 'approved follower sees private account posts');
select pg_temp.check(request_follow(:alice) = 'following', 'public account follow is immediate');
select pg_temp.check((select count(*) from posts where author_id = :alice) = 2, 'follower sees followers-only post (not the draft)');

-- ---------------- Bob removes Carol; Alice blocks Carol
select set_config('request.jwt.claim.sub', :bob, false);
delete from follows where follower_id = :carol and followed_id = :bob;
select set_config('request.jwt.claim.sub', :alice, false);
insert into blocks (blocker_id, blocked_id) values (:alice, :carol);

select set_config('request.jwt.claim.sub', :carol, false);
select pg_temp.check((select count(*) from posts) = 0, 'removed follower + blocked: nothing visible');
select pg_temp.check((select count(*) from follows where follower_id = :carol) = 0, 'block severed the follow');
select pg_temp.check((select count(*) from profiles where id = :alice) = 0, 'blocked user cannot find blocker profile');
select pg_temp.check((select count(*) from storage.objects where bucket_id = 'post-media') = 0, 'blocked user cannot fetch media');
select pg_temp.expect_error($$select request_follow('00000000-0000-0000-0000-00000000000a')$$, 'blocked user cannot re-follow');
select pg_temp.check((select count(*) from reports) = 1, 'reporter can see own report');

-- ---------------- Moderator
select set_config('request.jwt.claim.sub', :mod, false);
select pg_temp.check((select count(*) from reports where status = 'open') = 1, 'moderator sees report queue');
update reports set status = 'actioned', resolved_by = :mod;
update posts set removed_at = now() where id = '10000000-0000-0000-0000-000000000001';

select set_config('request.jwt.claim.sub', :bob, false);
select pg_temp.check((select count(*) from posts where id = '10000000-0000-0000-0000-000000000001') = 0, 'removed post hidden from everyone else');

-- ---------------- Rate limit
select set_config('request.jwt.claim.sub', :carol, false);
insert into posts (id, author_id, caption) values ('30000000-0000-0000-0000-000000000001', :carol, 'mine');
-- carol already commented once this minute, so 29 more reaches the limit of 30
do $$ begin
  for i in 1..29 loop insert into comments (post_id, author_id, body) values ('30000000-0000-0000-0000-000000000001', auth.uid(), 'x'); end loop;
end $$;
select pg_temp.expect_error($$insert into comments (post_id, author_id, body) values ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000c', 'one too many')$$, 'comment rate limit');

-- ---------------- Account deletion cascades
reset role;
select set_config('request.jwt.claim.sub', :alice, false);
select delete_my_account();
select pg_temp.check((select count(*) from posts where author_id = :alice) = 0 and (select count(*) from wardrobe_items) = 0, 'account deletion removes posts and wardrobe');
\echo ALL RLS TESTS PASSED
