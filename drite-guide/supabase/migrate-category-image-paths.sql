-- Point existing category image rows at objects in the public category-images bucket.
-- Run this after the category images have been uploaded to Supabase Storage.

begin;

update public.categories
set
  image_path = case
    when id = 'cat_000001' or lower(name) = 'hotels' then 'hotels.jpg'
    when id = 'cat_000002' or lower(name) = 'restaurants' then 'restaurant.jpg'
    when id = 'cat_000003' or lower(name) = 'beaches' then 'beaches.jpg'
    when id = 'cat_000004' or lower(name) = 'bars' then 'bars.jpg'
    when id = 'cat_000005' or lower(name) in ('cafes', 'cafe') then 'cafe.jpg'
    when id = 'cat_000006' or lower(name) = 'historical sites' then 'historical.jpg'
    when id = 'cat_000007' or lower(name) = 'hidden gems' then 'hiddengems.jpg'
    when id = 'cat_000008' or lower(name) = 'government help' then 'governmentservices.jpg'
    when id = 'cat_000009' or lower(name) = 'religious sites' then 'religious.jpg'
    else image_path
  end,
  updated_at = now()
where
  id in (
    'cat_000001',
    'cat_000002',
    'cat_000003',
    'cat_000004',
    'cat_000005',
    'cat_000006',
    'cat_000007',
    'cat_000008',
    'cat_000009'
  )
  or lower(name) in (
    'hotels',
    'restaurants',
    'beaches',
    'bars',
    'cafes',
    'cafe',
    'historical sites',
    'hidden gems',
    'government help',
    'religious sites'
  );

commit;
