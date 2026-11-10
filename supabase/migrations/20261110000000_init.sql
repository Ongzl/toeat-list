-- ToEat List schema
-- members = allow-list of people who may use the app (matched by login email)
-- places  = shared list of places to eat (soft-deleted via deleted_at)
-- visits  = one row per (place, person) when that person has been there, with optional rating

create table public.members (
  email        text primary key check (email = lower(email)),
  display_name text not null,
  is_admin     boolean not null default false,
  user_id      uuid unique references auth.users (id) on delete set null,
  added_at     timestamptz not null default now()
);

create table public.places (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (length(trim(name)) > 0),
  area           text,
  address        text,
  maps_url       text,
  cuisine        text,
  price          smallint check (price between 1 and 3),
  dietary        text[] not null default '{}',
  recommended_by text,          -- e.g. "Mum", "TikTok", "Google reviews"
  source_url     text,          -- link to the post / review
  notes          text,
  created_by     uuid references auth.users (id) on delete set null default auth.uid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

create table public.visits (
  place_id   uuid not null references public.places (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade default auth.uid(),
  rating     smallint check (rating between 1 and 5),
  comment    text,
  visited_at timestamptz not null default now(),
  primary key (place_id, user_id)
);

create index visits_user_idx on public.visits (user_id);
create index places_active_idx on public.places (created_at desc) where deleted_at is null;

-- ---------- helpers ----------

create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.members m
    where m.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.members m
    where m.email = lower(coalesce(auth.jwt() ->> 'email', '')) and m.is_admin
  );
$$;

-- Link a member row to the auth user the first time they sign in (and whenever a member is added).
create or replace function public.link_member_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'users' then
    update public.members set user_id = new.id where email = lower(new.email) and user_id is null;
  else
    select u.id into new.user_id from auth.users u where lower(u.email) = new.email;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.link_member_user();
create trigger on_member_added before insert on public.members
  for each row execute function public.link_member_user();

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger places_touch before update on public.places
  for each row execute function public.touch_updated_at();

-- Never let a client rewrite who created a place.
create or replace function public.keep_created_by() returns trigger
language plpgsql as $$
begin
  new.created_by = old.created_by;
  new.created_at = old.created_at;
  return new;
end;
$$;

create trigger places_keep_creator before update on public.places
  for each row execute function public.keep_created_by();

-- ---------- row level security ----------

alter table public.members enable row level security;
alter table public.places  enable row level security;
alter table public.visits  enable row level security;

create policy "members readable by members" on public.members
  for select to authenticated using (public.is_member());
create policy "admin adds members" on public.members
  for insert to authenticated with check (public.is_admin());
create policy "admin edits members" on public.members
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin removes members" on public.members
  for delete to authenticated using (public.is_admin() and email <> lower(auth.jwt() ->> 'email'));

-- Anyone in the group can read/add/edit any place. No hard deletes: set deleted_at instead.
create policy "places readable by members" on public.places
  for select to authenticated using (public.is_member());
create policy "members add places" on public.places
  for insert to authenticated with check (public.is_member() and created_by = auth.uid());
create policy "members edit places" on public.places
  for update to authenticated using (public.is_member()) with check (public.is_member());

-- Everyone sees everyone's visits/ratings; you only change your own.
create policy "visits readable by members" on public.visits
  for select to authenticated using (public.is_member());
create policy "own visits insert" on public.visits
  for insert to authenticated with check (public.is_member() and user_id = auth.uid());
create policy "own visits update" on public.visits
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own visits delete" on public.visits
  for delete to authenticated using (user_id = auth.uid());

-- ---------- list view with group stats ----------

create view public.place_list with (security_invoker = true) as
select
  p.*,
  m.display_name as created_by_name,
  round(avg(v.rating)::numeric, 1)            as avg_rating,
  count(v.rating)                              as rating_count,
  count(v.user_id)                             as tried_count,
  bool_or(v.user_id = auth.uid()) is true      as tried_by_me
from public.places p
left join public.visits v on v.place_id = p.id
left join public.members m on m.user_id = p.created_by
group by p.id, m.display_name;

grant select on public.place_list to authenticated;
