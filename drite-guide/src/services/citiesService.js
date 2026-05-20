import { assertSupabaseConfigured, supabase } from '../lib/supabase';
import { throwIfSupabaseError } from './supabaseService';

export async function getCities() {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .is('deleted_at', null)
    .order('city_name', { ascending: true });

  throwIfSupabaseError(error, 'Could not load cities.');
  return data || [];
}
