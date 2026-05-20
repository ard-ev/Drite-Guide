import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured =
  Boolean(SUPABASE_URL) && Boolean(SUPABASE_ANON_KEY);

const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackAnonKey = 'placeholder-anon-key';

export const STORAGE_BUCKETS = {
  appMedia: 'app-media',
  categoryImages: 'category-images',
  cityImages: 'city-images',
  placeImages: 'place-images',
  profilePictures: 'profile-pictures',
};

const knownBuckets = new Set(Object.values(STORAGE_BUCKETS));

export const supabase = createClient(
  isSupabaseConfigured ? SUPABASE_URL : fallbackUrl,
  isSupabaseConfigured ? SUPABASE_ANON_KEY : fallbackAnonKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

export function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }
}

function normalizeStoragePath(path) {
  return String(path || '')
    .trim()
    .replace(/^\/+/, '');
}

function resolveBucketAndPath(rawPath, fallbackBucket) {
  const storageProtocolMatch = rawPath.match(/^supabase:\/\/([^/]+)\/(.+)$/);

  if (storageProtocolMatch) {
    return {
      bucket: storageProtocolMatch[1],
      objectPath: storageProtocolMatch[2],
    };
  }

  const normalizedPath = normalizeStoragePath(rawPath);
  const [firstSegment, ...restSegments] = normalizedPath.split('/');

  if (knownBuckets.has(firstSegment) && restSegments.length > 0) {
    return {
      bucket: firstSegment,
      objectPath: restSegments.join('/'),
    };
  }

  return {
    bucket: fallbackBucket,
    objectPath: normalizedPath,
  };
}

export function getSupabaseStorageUrl(path, fallbackBucket = STORAGE_BUCKETS.appMedia) {
  if (!path || typeof path !== 'string') {
    return null;
  }

  const trimmedPath = path.trim();

  if (
    trimmedPath.startsWith('http://') ||
    trimmedPath.startsWith('https://') ||
    trimmedPath.startsWith('file://') ||
    trimmedPath.startsWith('data:')
  ) {
    return trimmedPath;
  }

  if (!isSupabaseConfigured) {
    return null;
  }

  const { bucket, objectPath } = resolveBucketAndPath(trimmedPath, fallbackBucket);

  if (!objectPath) {
    return null;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  return data?.publicUrl || null;
}
