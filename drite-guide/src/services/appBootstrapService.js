import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';

import { toAbsoluteAssetUrl } from '../config/assets';
import { STORAGE_BUCKETS } from '../lib/supabase';
import { getCategories } from './categoriesService';
import { getCities } from './citiesService';
import { getPlaces } from './placesService';

const APP_DATA_CACHE_KEY = 'drite-guide:bootstrap-data:v1';
const IMAGE_PREFETCH_CONCURRENCY = 6;

let bootstrapPromise = null;

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function collectImageUrls({ places = [] }) {
  const placeUrls = places.flatMap((place) => {
    const galleryUrls = Array.isArray(place?.images)
      ? place.images.map((image) =>
          toAbsoluteAssetUrl(image?.image_path, STORAGE_BUCKETS.placeImages)
        )
      : [];

    return [
      toAbsoluteAssetUrl(place?.main_image_path, STORAGE_BUCKETS.placeImages),
      ...galleryUrls,
    ];
  });

  return unique(placeUrls).filter((url) =>
    /^https?:\/\//i.test(url)
  );
}

function prefetchImages(urls) {
  prefetchImagesInBatches(urls).catch(() => {
    // Image warmup is best-effort and should never delay the app.
  });
}

export async function readCachedApplicationData() {
  try {
    const cachedValue = await AsyncStorage.getItem(APP_DATA_CACHE_KEY);
    return cachedValue ? JSON.parse(cachedValue) : null;
  } catch (_error) {
    return null;
  }
}

async function writeCachedData(data) {
  try {
    await AsyncStorage.setItem(
      APP_DATA_CACHE_KEY,
      JSON.stringify({
        ...data,
        cachedAt: new Date().toISOString(),
      })
    );
  } catch (_error) {
    // The in-memory bootstrap data is still usable if persistent cache fails.
  }
}

async function prefetchImagesInBatches(urls) {
  const pendingUrls = [...urls];

  async function worker() {
    while (pendingUrls.length > 0) {
      const url = pendingUrls.shift();

      try {
        await Image.prefetch(url, 'disk');
      } catch (_error) {
        // One broken image should not block the app from opening.
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(IMAGE_PREFETCH_CONCURRENCY, pendingUrls.length) },
      worker
    )
  );
}

async function fetchRemoteData() {
  const [categories, cities, places] = await Promise.all([
    getCategories(),
    getCities(),
    getPlaces(),
  ]);

  return { categories, cities, places };
}

export async function refreshApplicationData() {
  const remoteData = await fetchRemoteData();
  await writeCachedData(remoteData);
  prefetchImages(collectImageUrls(remoteData));
  return remoteData;
}

export async function preloadApplicationData() {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const cachedData = await readCachedApplicationData();

      try {
        const remoteData = await refreshApplicationData();
        return {
          data: remoteData,
          usedCache: false,
        };
      } catch (error) {
        if (cachedData) {
          prefetchImages(collectImageUrls(cachedData));
          return {
            data: cachedData,
            usedCache: true,
            error,
          };
        }

        throw error;
      }
    })();
  }

  return bootstrapPromise;
}
