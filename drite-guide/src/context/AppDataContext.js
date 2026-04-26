import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { api, extractApiErrorMessage } from '../services/api';
import { categories as localCategories } from '../data/categories';
import { cities as localCities } from '../data/cities';
import { places as localPlaces } from '../data/places';
import {
  normalizeCategory,
  normalizeCity,
  normalizePlace,
} from '../services/transformers';
import { useAuth } from './AuthContext';

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
  re1: '580e4e7c-ee6e-5e7e-ae0e-63dce9c81bd2',
  re2: 'b9b555da-2ecc-5108-9884-3ce6fcc766f0',
  ca1: '1c34209c-a74f-5577-9153-74598f625d79',
  ba1: 'fd768af6-a9a0-5332-8bdd-c44c58dd22d4',
  ho1: 'c3c53273-afdd-5875-8f8a-2a17b0018666',
  ho3: 'fb47f4a6-d99a-50c1-8e1a-b364cf7114ee',
  re3: '73fe1e4e-c259-5606-9e03-baed700a7d23',
  ca2: '02a74131-f2eb-5cfd-a9b1-b79640b49348',
  ba2: '903f4b20-913a-55ea-acea-9c0c62fe72fe',
  ho4: 'b81d33fd-960a-5055-b6bd-1f153ce36a12',
  re4: 'd40025bc-7cf2-5c51-a930-abd902718ecd',
  ca3: 'a828b925-d0aa-5bdc-a4cb-52d9bff684eb',
  ho5: 'be4af314-1574-574f-8106-81f53fb67dbe',
  ho6: '3dc0fdff-eddc-5f25-aa58-870ddda4d357',
  ba3: 'b19a7d95-0b3f-5ea6-a23c-5f6f9c43953e',
  ho7: '5a5a257a-9013-589d-b9db-e5e2dbe387a0',
  be4: '676d3697-bd64-5691-8027-87579060a0f1',
  be5: 'fa5569b4-90e6-5cce-8524-78dc9de66119',
  re5: 'd127ea2f-31d1-5290-8240-372181a4e882',
  ca4: '049903ea-6a64-563c-85cd-b1cd409aa877',
  ba6: 'e824290b-13cb-50d3-b2b6-f0cce5a99489',
  ho8: '581e75b3-26c1-5c42-bd78-88bf49adf838',
  ho9: 'dcef1ecd-2f1c-5405-ab8d-d0f2b3d22d55',
  ho10: '86554aaa-d64b-53ac-a955-c9314a1c7e65',
  be7: 'f08edf98-fdb9-57ba-b5d1-83a48975be84',
  be8: '721b9d0e-10e3-5c3a-9873-b714ce53463c',
  be9: '0668eef6-271a-5365-9e10-cdb4554f0df6',
  be10: 'cacee901-5c1d-5b46-9263-04acd075d1d9',
  re6: 'c1471ed6-4875-5e7f-8e46-37db87627040',
  ca5: 'f79974cc-d208-57de-817c-bbf3eb4ee2f5',
  ba11: '0459a6bd-aa2a-528b-b884-04484e3c374e',
  ho11: '6e6dcde9-1b24-5e5e-ba37-538f3f20e82c',
  be12: 'a2f8d626-9ab3-5710-b60d-47ccf26dd482',
  be13: '178cc763-2b13-56f7-84a0-f507519bbfde',
  be14: '975c8beb-5e11-5334-8876-071bad330861',
  re7: 'aa7e437c-c917-502f-90af-8fef907940a1',
  ca6: 'cb5625f8-b6c9-5e89-85bb-96827bb59c01',
  ba15: 'd8c50a44-dba9-5aeb-b9db-b9bb33ff5fa5',
  ho12: '26e545a0-e5ca-571b-a590-9eda43298b45',
  re8: '9bfcbf0e-14aa-5fa4-85d9-83f8d992c5cc',
  ca7: '35d73eb6-2d2f-5b69-a51c-4257452e45ff',
  ba16: 'fe5cab4d-d412-5931-91f6-ca3e4d7d834f',
  ho13: '3b19848d-b35f-566f-904d-19a9dfcd7379',
  ho14: '699d13ba-0b59-5d3c-8046-47646341391f',
  be16: '9d6d9620-af95-57de-a89e-abddb9422a70',
  be17: '3efdc408-ebb7-5be4-8426-0950a707d497',
  be18: '3626cb8c-e24d-5e9b-90a8-8d420b8223f1',
  be19: 'da419ee4-f824-53e4-a1e3-fdf7f4a5d043',
  ho15: 'cc94dbe9-fa13-553b-96ef-5b0f5e2f4b88',
  ho16: 'f6c69e66-ca62-539a-be81-b2bd42d326af',
  ho17: 'fb735bb1-ec8f-5e07-bee1-47f2e04a739b',
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

function enrichCategory(item, fallbackCategories) {
  const fallbackMatch = findFallbackMatch(fallbackCategories, item);
  const localImage = resolveCategoryImage(item) || fallbackMatch?.image;

  return {
    ...item,
    image: localImage || item.image || null,
  };
}

function enrichCity(item, fallbackCities) {
  const fallbackMatch = findFallbackMatch(fallbackCities, item, [item?.location_text]);
  const localImage = resolveCityImage(item) || fallbackMatch?.image || fallbackMatch?.heroImage;

  return {
    ...item,
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

  return {
    ...item,
    image: fallbackMatch?.image || item.image || null,
    images:
      fallbackImages.length > 0
        ? fallbackImages
        : Array.isArray(item.images) && item.images.length > 0
          ? item.images
          : item.image
            ? [item.image]
            : [],
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
  return items.find((item) => item.id === id || item.legacyId === id);
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
          api.get('/categories'),
          api.get('/cities'),
          api.get('/places'),
        ]);

      const nextCategories = (categoriesResponse.data || []).map(
        normalizeCategory
      );
      const nextCities = (citiesResponse.data || []).map(normalizeCity);
      const categoryNameById = Object.fromEntries(
        nextCategories.map((item) => [item.id, item.name])
      );
      const cityNameById = Object.fromEntries(
        nextCities.map((item) => [item.id, item.name])
      );
      const nextPlaces = (placesResponse.data || []).map((item) =>
        normalizePlace(item, {
          categoryName: categoryNameById[item.category_id],
          cityName: cityNameById[item.city_id],
        })
      );

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

      setCategories(
        mergedCategories.length > 0 ? mergedCategories : fallbackData.categories
      );
      setCities(mergedCities.length > 0 ? mergedCities : fallbackData.cities);
      setPlaces(mergedPlaces.length > 0 ? mergedPlaces : fallbackData.places);
    } catch (error) {
      const message = await extractApiErrorMessage(
        error,
        'Could not load data from the backend.'
      );
      setErrorMessage(message);
      const fallbackData = buildLocalFallbackData();
      setCategories(fallbackData.categories);
      setCities(fallbackData.cities);
      setPlaces(fallbackData.places);
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
