import { assertSupabaseConfigured, supabase } from '../lib/supabase';
import { throwIfSupabaseError } from './supabaseService';

export async function getCities() {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from('cities')
    .select(`
      *,
      translations:city_translations (
        language_code,
        city_name,
        description,
        updated_at
      )
    `)
    .is('deleted_at', null)
    .order('city_name', { ascending: true });

  if (
    error &&
    (
      error.message?.includes('city_translations') ||
      error.message?.includes('relationship')
    )
  ) {
    const fallbackResult = await supabase
      .from('cities')
      .select('*')
      .is('deleted_at', null)
      .order('city_name', { ascending: true });

    throwIfSupabaseError(fallbackResult.error, 'Could not load cities.');
    return fallbackResult.data || [];
  }

  throwIfSupabaseError(error, 'Could not load cities.');
  return data || [];
}
