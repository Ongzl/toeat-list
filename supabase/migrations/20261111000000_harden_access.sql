-- Harden access rules (issues #1, #4, #5).
--
-- #1  Membership is keyed on the verified auth user (members.user_id = auth.uid()), and a member row is
--     only linked to an auth user whose email has been confirmed. The unverified JWT email claim is no
--     longer trusted.
-- #4  Only admins can read the members table (emails, admin flags). Everyone else gets names only via
--     public.member_names.
-- #5  Removed members can't touch ratings; server-managed columns can't be forged; URLs and text
--     lengths are checked in the database.

-- ---------- #1: verified identity ----------

create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.members m
    join auth.users u on u.id = m.user_id
    where m.user_id = auth.uid() and u.email_confirmed_at is not null
  );
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.members m
    join auth.users u on u.id = m.user_id
    where m.user_id = auth.uid() and u.email_confirmed_at is not null and m.is_admin
  );
$$;

-- Link members <-> auth users only once the email is confirmed (OTP, magic link and Google all confirm it).
create or replace function public.link_member_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'users' then
    if new.email_confirmed_at is not null then
      update public.members
        set user_id = new.id
        where email = lower(new.email) and user_id is null;
    end if;
  else
    select u.id into new.user_id
      from auth.users u
      where lower(u.email) = new.email and u.email_confirmed_at is not null;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.link_member_user();
create trigger on_auth_user_confirmed after update of email_confirmed_at, email on auth.users
  for each row when (new.email_confirmed_at is not null)
  execute function public.link_member_user();

-- Undo any link made earlier to an account that never confirmed its email.
update public.members m
  set user_id = null
  from auth.users u
  where u.id = m.user_id and u.email_confirmed_at is null;

-- ---------- #4: members are private; names are shared ----------

drop policy "members readable by members" on public.members;
create policy "admin reads members; you read your own row" on public.members
  for select to authenticated using (public.is_admin() or user_id = auth.uid());

drop policy "admin removes members" on public.members;
create policy "admin removes members" on public.members
  for delete to authenticated using (public.is_admin() and user_id is distinct from auth.uid());

-- Name lookup for "added by" / "the group says". Runs as the view owner so it can read members,
-- and returns nothing unless the caller is a member.
create view public.member_names as
  select m.user_id, m.display_name
  from public.members m
  where m.user_id is not null and public.is_member();

revoke all on public.member_names from anon, public;
grant select on public.member_names to authenticated;

create or replace view public.place_list with (security_invoker = true) as
select
  p.*,
  n.display_name                               as created_by_name,
  round(avg(v.rating)::numeric, 1)             as avg_rating,
  count(v.rating)                              as rating_count,
  count(v.user_id)                             as tried_count,
  bool_or(v.user_id = auth.uid()) is true      as tried_by_me
from public.places p
left join public.visits v on v.place_id = p.id
left join public.member_names n on n.user_id = p.created_by
group by p.id, n.display_name;

-- ---------- #5: rating policies, forged columns, DB-level checks ----------

drop policy "own visits update" on public.visits;
create policy "own visits update" on public.visits
  for update to authenticated
  using (public.is_member() and user_id = auth.uid())
  with check (public.is_member() and user_id = auth.uid());

drop policy "own visits delete" on public.visits;
create policy "own visits delete" on public.visits
  for delete to authenticated using (public.is_member() and user_id = auth.uid());

-- Server-managed columns on insert: timestamps, creator, not-deleted.
create or replace function public.places_set_defaults() returns trigger
language plpgsql as $$
begin
  new.created_at = now();
  new.updated_at = now();
  new.deleted_at = null;
  if auth.uid() is not null then
    new.created_by = auth.uid();
  end if;
  return new;
end;
$$;

create trigger places_defaults before insert on public.places
  for each row execute function public.places_set_defaults();

-- On update, identity and creation info are immutable.
create or replace function public.keep_created_by() returns trigger
language plpgsql as $$
begin
  new.id = old.id;
  new.created_by = old.created_by;
  new.created_at = old.created_at;
  return new;
end;
$$;

-- Same for visits: you can't move a rating to another place or person, or backdate it.
create or replace function public.visits_keep_identity() returns trigger
language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    new.visited_at = now();
  else
    new.place_id = old.place_id;
    new.user_id = old.user_id;
    new.visited_at = old.visited_at;
  end if;
  return new;
end;
$$;

create trigger visits_identity before insert or update on public.visits
  for each row execute function public.visits_keep_identity();

alter table public.places
  add constraint places_maps_url_http   check (maps_url   is null or maps_url   ~* '^https?://'),
  add constraint places_source_url_http check (source_url is null or source_url ~* '^https?://'),
  add constraint places_name_len        check (length(name) <= 120),
  add constraint places_area_len        check (length(area) <= 80),
  add constraint places_cuisine_len     check (length(cuisine) <= 80),
  add constraint places_address_len     check (length(address) <= 300),
  add constraint places_recommended_len check (length(recommended_by) <= 80),
  add constraint places_url_len         check (length(maps_url) <= 2000 and length(source_url) <= 2000),
  add constraint places_notes_len       check (length(notes) <= 2000),
  add constraint places_dietary_len     check (cardinality(dietary) <= 10);

alter table public.visits
  add constraint visits_comment_len check (length(comment) <= 200);

alter table public.members
  add constraint members_display_name_len check (length(trim(display_name)) between 1 and 60),
  add constraint members_email_len check (length(email) <= 254);
