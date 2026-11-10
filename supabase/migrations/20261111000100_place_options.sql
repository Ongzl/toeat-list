-- Distinct areas and cuisines for filter dropdowns and form suggestions (issue #8), so pages don't
-- need to load every place just to build those lists. Respects places RLS (security_invoker).
create view public.place_options with (security_invoker = true) as
  select distinct 'area'::text as kind, area as value
    from public.places where deleted_at is null and area is not null
  union
  select distinct 'cuisine'::text as kind, cuisine as value
    from public.places where deleted_at is null and cuisine is not null;

revoke all on public.place_options from anon, public;
grant select on public.place_options to authenticated;

-- Search and sort now run in the database.
create index places_name_idx on public.places (lower(name)) where deleted_at is null;
