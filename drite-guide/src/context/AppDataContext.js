import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { categories as localCategories } from '../data/categories';
import { cities as localCities } from '../data/cities';
import { places as localPlaces } from '../data/places';
import { getCategories } from '../services/categoriesService';
import { getCities } from '../services/citiesService';
import { getPlaces } from '../services/placesService';
import { getSupabaseErrorMessage } from '../services/supabaseService';
import {
  normalizeCategory,
  normalizeCity,
  normalizePlace,
} from '../services/transformers';
import { useAuth } from './AuthContext';
import { localizeAppDataSet } from '../i18n/contentTranslations';

const AppDataContext = createContext(null);

const CATEGORY_IMAGE_BY_KEY = {
  hotels: require('../../assets/catimg/hotels.jpg'),
  restaurants: require('../../assets/catimg/restaurant.jpg'),
  beaches: require('../../assets/catimg/beaches.jpg'),
  bars: require('../../assets/catimg/bars.jpg'),
  cafes: require('../../assets/catimg/cafe.jpg'),
  historical: require('../../assets/catimg/historical.jpg'),
  hidden_gems: require('../../assets/catimg/hiddengems.jpg'),
  hiddengems: require('../../assets/catimg/hiddengems.jpg'),
  religioussites: require('../../assets/catimg/religious.jpg'),
  religious_sites: require('../../assets/catimg/religious.jpg'),
  mosques: require('../../assets/catimg/religious.jpg'),
  churches: require('../../assets/catimg/religious.jpg'),
  museums: require('../../assets/catimg/museum.jpg'),
  bunkers: require('../../assets/catimg/bunkers.jpg'),
  adventures: require('../../assets/catimg/adventures.jpg'),
  governmenthelp: require('../../assets/catimg/governmentservices.jpg'),
  government_help: require('../../assets/catimg/governmentservices.jpg'),
  governmentservices: require('../../assets/catimg/governmentservices.jpg'),
};

const CITY_IMAGE_BY_KEY = {
  tirana: require('../../assets/cities/tirana.jpg'),
  shkoder: require('../../assets/cities/shkoder.jpg'),
  vlore: require('../../assets/cities/vlore.jpg'),
  durres: require('../../assets/cities/durres.jpg'),
  ksamil: require('../../assets/cities/ksamil.jpg'),
  dhermi: require('../../assets/cities/dhermi.jpg'),
  lin: require('../../assets/cities/lin.jpg'),
  theth: require('../../assets/cities/theth.jpg'),
  gjirokaster: require('../../assets/cities/gjirokaster.jpg'),
  korca: require('../../assets/cities/korca.jpg'),
  berat: require('../../assets/cities/berat.jpg'),
  lezhe: require('../../assets/cities/lezhe.jpg'),
  shengjin: require('../../assets/cities/lezhe.jpg'),
  velipoje: require('../../assets/cities/lezhe.jpg'),
  saranda: require('../../assets/cities/lezhe.jpg'),
  kruja: require('../../assets/cities/kruja.jpg'),
  himare: require('../../assets/cities/lezhe.jpg'),
};

const SEEDED_PLACE_ID_BY_LEGACY_ID = {
  re1: 'plc_000001',
  re2: 'plc_000002',
  ca1: 'plc_000003',
  ba1: 'plc_000004',
  ho1: 'plc_000005',
  ho3: 'plc_000006',
  re3: 'plc_000007',
  ca2: 'plc_000008',
  ba2: 'plc_000009',
  ho4: 'plc_000010',
  re4: 'plc_000011',
  ca3: 'plc_000012',
  ho5: 'plc_000013',
  ho6: 'plc_000014',
  ba3: 'plc_000015',
  ho7: 'plc_000016',
  be4: 'plc_000017',
  be5: 'plc_000018',
  re5: 'plc_000019',
  ca4: 'plc_000020',
  ba6: 'plc_000021',
  ho8: 'plc_000022',
  ho9: 'plc_000023',
  ho10: 'plc_000024',
  be7: 'plc_000025',
  be8: 'plc_000026',
  be9: 'plc_000027',
  be10: 'plc_000028',
  re6: 'plc_000029',
  ca5: 'plc_000030',
  ba11: 'plc_000031',
  ho11: 'plc_000032',
  be12: 'plc_000033',
  be13: 'plc_000034',
  be14: 'plc_000035',
  re7: 'plc_000036',
  ca6: 'plc_000037',
  ba15: 'plc_000038',
  ho12: 'plc_000039',
  re8: 'plc_000040',
  ca7: 'plc_000041',
  ba16: 'plc_000042',
  ho13: 'plc_000043',
  ho14: 'plc_000044',
  be16: 'plc_000045',
  be17: 'plc_000046',
  be18: 'plc_000047',
  be19: 'plc_000048',
  ho15: 'plc_000049',
  ho16: 'plc_000050',
  ho17: 'plc_000051',
};

function normalizeLookupKey(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function resolveKnownImage(item, imageByKey, candidates = []) {
  const rawKeys = [
    item?.legacyId,
    item?.id,
    item?.name,
    item?.cityName,
    item?.image_path,
    item?.hero_image_path,
    item?.image,
    item?.heroImage,
    ...candidates,
  ];

  for (const rawKey of rawKeys) {
    const normalizedKey = normalizeLookupKey(rawKey);

    if (imageByKey[normalizedKey]) {
      return imageByKey[normalizedKey];
    }

    const matchedKey = Object.keys(imageByKey).find((imageKey) =>
      normalizedKey.includes(imageKey)
    );

    if (matchedKey) {
      return imageByKey[matchedKey];
    }
  }

  return null;
}

function resolveCategoryImage(item) {
  return resolveKnownImage(item, CATEGORY_IMAGE_BY_KEY);
}

function resolveCityImage(item) {
  return resolveKnownImage(item, CITY_IMAGE_BY_KEY, [item?.location_text]);
}

function findFallbackMatch(fallbackItems, item, candidates = []) {
  const itemKeys = [
    item?.legacyId,
    item?.id,
    item?.seededId,
    item?.name,
    item?.cityName,
    item?.address,
    ...candidates,
  ]
    .filter(Boolean)
    .map(normalizeLookupKey);

  return fallbackItems.find((fallbackItem) => {
    const fallbackKeys = [
      fallbackItem?.legacyId,
      fallbackItem?.id,
      fallbackItem?.seededId,
      fallbackItem?.name,
      fallbackItem?.cityName,
      fallbackItem?.address,
    ]
      .filter(Boolean)
      .map(normalizeLookupKey);

    return itemKeys.some((itemKey) => fallbackKeys.includes(itemKey));
  });
}

function isPreferredDatabaseImagePath(value) {
  const imagePath = String(value || '').trim();

  if (!imagePath || imagePath.startsWith('assets/')) {
    return false;
  }

  if (
    imagePath.startsWith('http://') ||
    imagePath.startsWith('https://') ||
    imagePath.startsWith('file://') ||
    imagePath.startsWith('data:') ||
    imagePath.startsWith('supabase://') ||
    imagePath.startsWith('place-images/')
  ) {
    return true;
  }

  return /\.(avif|gif|jpe?g|png|webp)$/i.test(imagePath);
}

function enrichCategory(item, fallbackCategories) {
  const fallbackMatch = findFallbackMatch(fallbackCategories, item);
  const localImage = resolveCategoryImage(item) || fallbackMatch?.image;

  return {
    ...item,
    legacyId: fallbackMatch?.legacyId || item.legacyId,
    image: localImage || item.image || null,
  };
}

function enrichCity(item, fallbackCities) {
  const fallbackMatch = findFallbackMatch(fallbackCities, item, [item?.location_text]);
  const localImage = resolveCityImage(item) || fallbackMatch?.image || fallbackMatch?.heroImage;

  return {
    ...item,
    legacyId: fallbackMatch?.legacyId || item.legacyId,
    image: localImage || item.image || null,
    heroImage: localImage || item.heroImage || item.image || null,
  };
}

function enrichPlace(item, fallbackPlaces) {
  const fallbackMatch = findFallbackMatch(fallbackPlaces, item, [item?.address]);
  const fallbackImages =
    Array.isArray(fallbackMatch?.images) && fallbackMatch.images.length > 0
      ? fallbackMatch.images
      : fallbackMatch?.image
        ? [fallbackMatch.image]
        : [];
  const itemImages =
    Array.isArray(item.images) && item.images.length > 0
      ? item.images
      : item.image
        ? [item.image]
        : [];
  const hasPreferredDatabaseMainImage = isPreferredDatabaseImagePath(
    item.imageSourcePath || item.main_image_path
  );
  const hasPreferredDatabaseImages =
    Array.isArray(item.imageSourcePaths) &&
    item.imageSourcePaths.some(isPreferredDatabaseImagePath);
  const preferredDatabaseImages = hasPreferredDatabaseImages
    ? itemImages
    : hasPreferredDatabaseMainImage && item.image
      ? [item.image]
      : [];

  return {
    ...item,
    legacyId: fallbackMatch?.legacyId || item.legacyId,
    seededId: fallbackMatch?.seededId || item.seededId,
    image: hasPreferredDatabaseMainImage
      ? item.image || fallbackMatch?.image || null
      : fallbackMatch?.image || item.image || null,
    images:
      preferredDatabaseImages.length > 0
        ? preferredDatabaseImages
        : fallbackImages.length > 0
        ? fallbackImages
        : itemImages,
  };
}

function mergeCategoriesWithFallback(apiCategories, fallbackCategories) {
  const merged = [...apiCategories];

  for (const fallbackCategory of fallbackCategories) {
    const exists = merged.some((category) => {
      const categoryKeys = [
        category.id,
        category.legacyId,
        category.name,
      ].map(normalizeLookupKey);
      const fallbackKeys = [
        fallbackCategory.id,
        fallbackCategory.legacyId,
        fallbackCategory.name,
      ].map(normalizeLookupKey);

      return fallbackKeys.some((key) => categoryKeys.includes(key));
    });

    if (!exists) {
      merged.push(fallbackCategory);
    }
  }

  const hasReligiousSites = merged.some((category) =>
    ['religioussites', 'religious_sites'].includes(
      normalizeLookupKey(category.legacyId || category.id || category.name)
    )
  );

  if (!hasReligiousSites) {
    const fallbackReligiousSites = fallbackCategories.find(
      (category) =>
        normalizeLookupKey(category.legacyId || category.id || category.name) ===
        'religious_sites'
    );

    if (fallbackReligiousSites) {
      merged.push(fallbackReligiousSites);
    }
  }

  return merged.filter((category) => {
    const categoryKey = normalizeLookupKey(
      category.legacyId || category.id || category.name
    );

    if (categoryKey === 'mosques' || categoryKey === 'churches') {
      return false;
    }

    return true;
  });
}

function buildLocalFallbackData() {
  const fallbackCategories = (localCategories || []).map((item) => ({
    ...item,
    legacyId: item.id,
    image: resolveCategoryImage(item),
  }));

  const fallbackCities = (localCities || []).map((item) => ({
    ...item,
    legacyId: item.id,
    heroImage: item.image,
  }));

  const fallbackPlaces = (localPlaces || []).map((item) => ({
    ...item,
    legacyId: item.id,
    seededId: SEEDED_PLACE_ID_BY_LEGACY_ID[item.id],
    cityName: fallbackCities.find((city) => city.id === item.cityId)?.name || '',
    categoryName:
      fallbackCategories.find((category) => category.id === item.categoryId)?.name ||
      '',
  }));

  return {
    categories: fallbackCategories,
    cities: fallbackCities,
    places: fallbackPlaces,
  };
}

function findByAnyId(items, id) {
  return (items || []).filter(Boolean).find(
    (item) =>
      item.id === id ||
      item.legacyId === id ||
      item.seededId === id ||
      String(item.id) === String(id) ||
      String(item.legacyId) === String(id) ||
      String(item.seededId) === String(id)
  );
}

export function AppDataProvider({ children }) {
  const { currentLanguage } = useAuth();
  const [categories, setCategories] = useState(() => buildLocalFallbackData().categories);
  const [cities, setCities] = useState(() => buildLocalFallbackData().cities);
  const [places, setPlaces] = useState(() => buildLocalFallbackData().places);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchAllData = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const [categoriesResponse, citiesResponse, placesResponse] =
        await Promise.all([
          getCategories(),
          getCities(),
          getPlaces(),
        ]);

      const nextCategories = (categoriesResponse || [])
        .map(normalizeCategory)
        .filter(Boolean);
      const nextCities = (citiesResponse || [])
        .map(normalizeCity)
        .filter(Boolean);
      const categoryNameById = Object.fromEntries(
        nextCategories.map((item) => [item.id, item.name])
      );
      const cityNameById = Object.fromEntries(
        nextCities.map((item) => [item.id, item.name])
      );
      const nextPlaces = (placesResponse || [])
        .map((item) =>
          normalizePlace(item, {
            categoryName: categoryNameById[item?.category_id],
            cityName: cityNameById[item?.city_id],
          })
        )
        .filter(Boolean);

      const fallbackData = buildLocalFallbackData();
      const mergedCategories = mergeCategoriesWithFallback(
        nextCategories.map((item) => enrichCategory(item, fallbackData.categories)),
        fallbackData.categories
      );
      const mergedCities = nextCities.map((item) =>
        enrichCity(item, fallbackData.cities)
      );
      const mergedPlaces = nextPlaces.map((item) =>
        enrichPlace(item, fallbackData.places)
      );

      const localizedData = localizeAppDataSet(
        {
          categories:
            mergedCategories.length > 0
              ? mergedCategories
              : fallbackData.categories,
          cities: mergedCities.length > 0 ? mergedCities : fallbackData.cities,
          places: mergedPlaces.length > 0 ? mergedPlaces : fallbackData.places,
        },
        currentLanguage
      );

      setCategories(localizedData.categories);
      setCities(localizedData.cities);
      setPlaces(localizedData.places);
    } catch (error) {
      const message = getSupabaseErrorMessage(
        error,
        'Could not load data from Supabase.'
      );
      setErrorMessage(message);
      const fallbackData = buildLocalFallbackData();
      const localizedData = localizeAppDataSet(fallbackData, currentLanguage);
      setCategories(localizedData.categories);
      setCities(localizedData.cities);
      setPlaces(localizedData.places);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [currentLanguage]);

  const value = useMemo(
    () => ({
      categories,
      cities,
      places,
      isLoading,
      errorMessage,
      refreshData: fetchAllData,
      getCityById: (cityId) => findByAnyId(cities, cityId),
      getCategoryById: (categoryId) => findByAnyId(categories, categoryId),
      getPlaceById: (placeId) => findByAnyId(places, placeId),
    }),
    [categories, cities, places, isLoading, errorMessage]
  );

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error('useAppData must be used inside AppDataProvider.');
  }

  return context;
}
