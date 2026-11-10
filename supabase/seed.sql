-- Local development seed only. Sign in locally with these emails via magic link
-- (emails show up in Mailpit at http://localhost:54324).
insert into public.members (email, display_name, is_admin) values
  ('admin@example.test', 'Admin Tester', true),
  ('sam@example.test',   'Sam Tester',   false);

insert into public.places (name, area, cuisine, price, dietary, recommended_by, notes, created_by) values
  ('Nasi Lemak Corner', 'SS15',      'Malaysian', 1, '{halal}',      'Sam',          'Get the sambal sotong', null),
  ('Ramen Ichiban',     'Bangsar',   'Japanese',  2, '{}',           'TikTok',       'Long queue on weekends', null),
  ('Green Bowl',        'Mont Kiara','Western',   3, '{vegetarian}', 'Google reviews', null,                  null);
