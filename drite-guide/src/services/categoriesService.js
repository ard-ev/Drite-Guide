import { assertSupabaseConfigured, supabase } from '../lib/supabase';
import { throwIfSupabaseError } from './supabaseService';

export async function getCategories() {
  assertSupabaseConfigured();

  const { data, error } = await supabase
    .from('categories')
    .select(`
      *,
      translations:category_translations (
        language_code,
        name,
        subtitle
      )
    `)
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (
    error &&
    (
      error.message?.includes('category_translations') ||
      error.message?.includes('relationship')
    )
  ) {
    const fallbackResult = await supabase
      .from('categories')
      .select('*')
      .is('deleted_at', null)
      .order('name', { ascending: true });

    throwIfSupabaseError(fallbackResult.error, 'Could not load categories.');
    return fallbackResult.data || [];
  }

  throwIfSupabaseError(error, 'Could not load categories.');
  return data || [];
}
