import { assertSupabaseConfigured, supabase } from '../lib/supabase';
import { throwIfSupabaseError } from './supabaseService';

const PLACE_WITH_IMAGES_SELECT = `
  *,
  translations:place_translations (
    language_code,
    name,
    description,
    address,
    opening_hours,
    updated_at
  ),
  images:place_images (
    id,
    image_path,
    sort_order,
    created_at
  )
`;

function sortPlaceImages(place) {
  if (!Array.isArray(place?.images)) {
    return place;
  }

  return {
    ...place,
    images: [...place.images].sort(
      (left, right) => (left.sort_order || 0) - (right.sort_order || 0)
    ),
  };
}

async function runPlacesQuery(query, fallbackQueryFactory) {
  const { data, error } = await query;

  if (!error) {
    return (data || []).map(sortPlaceImages);
  }

  const missingImagesRelation =
    error.message?.includes('place_images') ||
    error.message?.includes('place_translations') ||
    error.message?.includes('relationship');

  if (!missingImagesRelation || !fallbackQueryFactory) {
    throwIfSupabaseError(error, 'Could not load places.');
  }

  const fallbackResult = await fallbackQueryFactory();
  throwIfSupabaseError(fallbackResult.error, 'Could not load places.');
  return fallbackResult.data || [];
}

function applyPlaceFilters(query, { cityId, categoryId } = {}) {
  let nextQuery = query.is('deleted_at', null);

  if (cityId) {
    nextQuery = nextQuery.eq('city_id', cityId);
  }

  if (categoryId) {
    nextQuery = nextQuery.eq('category_id', categoryId);
  }

  return nextQuery;
}

export async function getPlaces(filters = {}) {
  assertSupabaseConfigured();

  const query = applyPlaceFilters(
    supabase
      .from('places')
      .select(PLACE_WITH_IMAGES_SELECT)
      .order('name', { ascending: true }),
    filters
  );

  return runPlacesQuery(query, () =>
    applyPlaceFilters(
      supabase.from('places').select('*').order('name', { ascending: true }),
      filters
    )
  );
}

export async function getPlacesByIds(placeIds = []) {
  assertSupabaseConfigured();

  const uniqueIds = [...new Set((placeIds || []).filter(Boolean).map(String))];

  if (uniqueIds.length === 0) {
    return [];
  }

  const query = supabase
    .from('places')
    .select(PLACE_WITH_IMAGES_SELECT)
    .in('id', uniqueIds)
    .is('deleted_at', null);

  const places = await runPlacesQuery(query, () =>
    supabase.from('places').select('*').in('id', uniqueIds).is('deleted_at', null)
  );

  const placeById = new Map(places.map((place) => [String(place.id), place]));
  return uniqueIds.map((id) => placeById.get(String(id))).filter(Boolean);
}

export async function getPlaceById(placeId) {
  assertSupabaseConfigured();

  if (!placeId) {
    return null;
  }

  const places = await getPlacesByIds([placeId]);
  return places[0] || null;
}
