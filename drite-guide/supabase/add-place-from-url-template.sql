-- Add a new place from Supabase using image URLs.
-- Edit the values in new_place_input and photo_input, then run this file in
-- the Supabase SQL editor.
--
-- The app reads public.places and public.place_images automatically.
-- Photo values can be full https URLs, supabase://place-images/... references,
-- or place-images/... storage paths.

with new_place_input as (
  select
    'Tirana'::text as city_name,
    'Cafes'::text as category_name,
    'Example Coffee Shop'::text as name,
    'A cozy coffee shop with espresso, pastries, and a relaxed neighborhood feel.'::text as description,
    'Rruga Example 12, Tirana, Albania'::text as address,
    'https://maps.google.com'::text as google_maps_link,
    41.3275::double precision as latitude,
    19.8187::double precision as longitude,
    'https://YOUR-PROJECT.supabase.co/storage/v1/object/public/place-images/example-coffee-shop/main.jpg'::text as main_image_url,
    null::text as phone,
    null::text as website,
    0::numeric(3, 2) as rating_average,
    0::integer as ratings_count
),
photo_input as (
  select *
  from (
    values
      (0, 'https://YOUR-PROJECT.supabase.co/storage/v1/object/public/place-images/example-coffee-shop/main.jpg'),
      (1, 'https://YOUR-PROJECT.supabase.co/storage/v1/object/public/place-images/example-coffee-shop/interior.jpg'),
      (2, 'https://YOUR-PROJECT.supabase.co/storage/v1/object/public/place-images/example-coffee-shop/coffee.jpg')
  ) as photos(sort_order, image_url)
),
matching_city as (
  select cities.id
  from public.cities
  join new_place_input on lower(cities.city_name) = lower(new_place_input.city_name)
  where cities.deleted_at is null
  limit 1
),
matching_category as (
  select categories.id
  from public.categories
  join new_place_input on lower(categories.name) = lower(new_place_input.category_name)
  where categories.deleted_at is null
  limit 1
),
inserted_place as (
  insert into public.places (
    category_id,
    city_id,
    name,
    description,
    address,
    google_maps_link,
    latitude,
    longitude,
    main_image_path,
    phone,
    website,
    rating_average,
    ratings_count
  )
  select
    matching_category.id,
    matching_city.id,
    new_place_input.name,
    new_place_input.description,
    new_place_input.address,
    new_place_input.google_maps_link,
    new_place_input.latitude,
    new_place_input.longitude,
    new_place_input.main_image_url,
    new_place_input.phone,
    new_place_input.website,
    new_place_input.rating_average,
    new_place_input.ratings_count
  from new_place_input
  cross join matching_city
  cross join matching_category
  on conflict (city_id, name, address) do update set
    category_id = excluded.category_id,
    description = excluded.description,
    google_maps_link = excluded.google_maps_link,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    main_image_path = excluded.main_image_path,
    phone = excluded.phone,
    website = excluded.website,
    rating_average = excluded.rating_average,
    ratings_count = excluded.ratings_count,
    deleted_at = null,
    updated_at = now()
  returning id
),
target_place as (
  select id from inserted_place
  union all
  select places.id
  from public.places
  join new_place_input
    on places.name = new_place_input.name
   and places.address = new_place_input.address
  join matching_city on places.city_id = matching_city.id
  limit 1
)
insert into public.place_images (place_id, image_path, sort_order)
select
  target_place.id,
  photo_input.image_url,
  photo_input.sort_order
from target_place
cross join photo_input
on conflict (place_id, sort_order) do update set
  image_path = excluded.image_path;
