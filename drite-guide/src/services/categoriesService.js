import { assertSupabaseConfigured, supabase } from '../lib/supabase';
import { throwIfSupabaseError } from './supabaseService';

export async function getCategories() {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .is('deleted_at', null)
    .order('name', { ascending: true });

  throwIfSupabaseError(error, 'Could not load categories.');
  return data || [];
}
