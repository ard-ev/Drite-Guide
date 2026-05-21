import { getSupabaseStorageUrl, STORAGE_BUCKETS } from '../lib/supabase';

export const DEFAULT_PROFILE_PICTURE_URL =
  'https://placehold.co/240x240/E5E7EB/222222?text=DG';

export function toAbsoluteAssetUrl(path, fallbackBucket = STORAGE_BUCKETS.appMedia) {
  return getSupabaseStorageUrl(path, fallbackBucket) || path || null;
}

export function getProfilePictureUrl(path) {
  return getSupabaseStorageUrl(path, STORAGE_BUCKETS.profilePictures) || null;
}
