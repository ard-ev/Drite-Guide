import { assertSupabaseConfigured, supabase } from '../lib/supabase';
import { getPlacesByIds } from './placesService';
import { throwIfSupabaseError } from './supabaseService';

export async function getSavedPlaces(userId) {
  assertSupabaseConfigured();

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from('saved_places')
    .select('place_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  throwIfSupabaseError(error, 'Could not load saved places.');

  const placeIds = (data || []).map((item) => item.place_id).filter(Boolean);
  return getPlacesByIds(placeIds);
}

export async function savePlace(userId, placeId) {
  assertSupabaseConfigured();

  const { error } = await supabase
    .from('saved_places')
    .upsert(
      {
        user_id: userId,
        place_id: placeId,
      },
      { onConflict: 'user_id,place_id' }
    );

  throwIfSupabaseError(error, 'Could not save this place.');
}

export async function removeSavedPlace(userId, placeId) {
  assertSupabaseConfigured();

  const { error } = await supabase
    .from('saved_places')
    .delete()
    .eq('user_id', userId)
    .eq('place_id', placeId);

  throwIfSupabaseError(error, 'Could not remove this saved place.');
}
