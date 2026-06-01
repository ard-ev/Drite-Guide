import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

function normalizeSupabaseProjectUrl(url) {
  const value = String(url || '').trim().replace(/\/+$/, '');

  if (!value) {
    return '';
  }

  try {
    const parsedUrl = new URL(value);
    const normalizedPath = parsedUrl.pathname.replace(/\/+$/, '');

    if (normalizedPath === '/rest/v1') {
      parsedUrl.pathname = '';
      parsedUrl.search = '';
      parsedUrl.hash = '';
      return parsedUrl.toString().replace(/\/+$/, '');
    }
  } catch (_error) {
    return value;
  }

  return value;
}

export const SUPABASE_URL = normalizeSupabaseProjectUrl(
  process.env.EXPO_PUBLIC_SUPABASE_URL
);
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
const SECURE_STORE_CHUNK_SIZE = 1800;

function getSecureStoreChunkCountKey(key) {
  return `${key}.chunk_count`;
}

function getSecureStoreChunkKey(key, index) {
  return `${key}.chunk_${index}`;
}

const secureSessionStorage = {
  async getItem(key) {
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key);
    }

    const chunkCountValue = await SecureStore.getItemAsync(
      getSecureStoreChunkCountKey(key)
    );
    const chunkCount = Number(chunkCountValue || 0);

    if (chunkCount > 0) {
      const chunks = await Promise.all(
        Array.from({ length: chunkCount }, (_, index) =>
          SecureStore.getItemAsync(getSecureStoreChunkKey(key, index))
        )
      );

      return chunks.every((chunk) => typeof chunk === 'string')
        ? chunks.join('')
        : null;
    }

    const secureValue = await SecureStore.getItemAsync(key);

    if (secureValue) {
      return secureValue;
    }

    return AsyncStorage.getItem(key);
  },

  async setItem(key, value) {
    if (Platform.OS === 'web') {
      return AsyncStorage.setItem(key, value);
    }

    const previousChunkCount = Number(
      (await SecureStore.getItemAsync(getSecureStoreChunkCountKey(key))) || 0
    );

    await Promise.all([
      SecureStore.deleteItemAsync(key),
      ...Array.from({ length: previousChunkCount }, (_, index) =>
        SecureStore.deleteItemAsync(getSecureStoreChunkKey(key, index))
      ),
    ]);

    const chunks = String(value || '').match(new RegExp(`.{1,${SECURE_STORE_CHUNK_SIZE}}`, 'g')) || [''];

    await Promise.all(
      chunks.map((chunk, index) =>
        SecureStore.setItemAsync(getSecureStoreChunkKey(key, index), chunk)
      )
    );
    await SecureStore.setItemAsync(
      getSecureStoreChunkCountKey(key),
      String(chunks.length)
    );
    await AsyncStorage.removeItem(key);
  },

  async removeItem(key) {
    if (Platform.OS === 'web') {
      return AsyncStorage.removeItem(key);
    }

    const chunkCount = Number(
      (await SecureStore.getItemAsync(getSecureStoreChunkCountKey(key))) || 0
    );

    await Promise.all([
      SecureStore.deleteItemAsync(key),
      SecureStore.deleteItemAsync(getSecureStoreChunkCountKey(key)),
      AsyncStorage.removeItem(key),
      ...Array.from({ length: chunkCount }, (_, index) =>
        SecureStore.deleteItemAsync(getSecureStoreChunkKey(key, index))
      ),
    ]);
  },
};

export const supabase = createClient(
  isSupabaseConfigured ? SUPABASE_URL : fallbackUrl,
  isSupabaseConfigured ? SUPABASE_ANON_KEY : fallbackAnonKey,
  {
    auth: {
      storage: secureSessionStorage,
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
