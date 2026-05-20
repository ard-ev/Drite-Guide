import { getSupabaseStorageUrl, STORAGE_BUCKETS } from '../lib/supabase';

export function toAbsoluteAssetUrl(path, fallbackBucket = STORAGE_BUCKETS.appMedia) {
  return getSupabaseStorageUrl(path, fallbackBucket) || path || null;
}
