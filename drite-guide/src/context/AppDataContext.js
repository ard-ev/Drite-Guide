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

function normalizeLookupKey(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function resolveCategoryImage(item) {
  const rawKeys = [item?.legacyId, item?.id, item?.name];

  for (const rawKey of rawKeys) {
    const normalizedKey = normalizeLookupKey(rawKey);

    if (CATEGORY_IMAGE_BY_KEY[normalizedKey]) {
      return CATEGORY_IMAGE_BY_KEY[normalizedKey];
    }
  }

  return null;
}

function findFallbackMatch(fallbackItems, item, candidates = []) {
  const itemKeys = [
    item?.legacyId,
    item?.id,
    item?.name,
    item?.cityName,
    ...candidates,
  ]
    .filter(Boolean)
    .map(normalizeLookupKey);

  return fallbackItems.find((fallbackItem) => {
    const fallbackKeys = [
      fallbackItem?.legacyId,
      fallbackItem?.id,
      fallbackItem?.name,
      fallbackItem?.cityName,
    ]
      .filter(Boolean)
      .map(normalizeLookupKey);

    return itemKeys.some((itemKey) => fallbackKeys.includes(itemKey));
  });
}

function enrichCategory(item, fallbackCategories) {
  const fallbackMatch = findFallbackMatch(fallbackCategories, item);

  return {
    ...item,
    image: item.image || fallbackMatch?.image || resolveCategoryImage(item),
  };
}

function enrichCity(item, fallbackCities) {
  const fallbackMatch = findFallbackMatch(fallbackCities, item, [item?.location_text]);

  return {
    ...item,
    image: item.image || fallbackMatch?.image || fallbackMatch?.heroImage || null,
    heroImage:
      item.heroImage || fallbackMatch?.heroImage || fallbackMatch?.image || null,
  };
}

function enrichPlace(item, fallbackPlaces) {
  const fallbackMatch = findFallbackMatch(fallbackPlaces, item, [item?.address]);

  return {
    ...item,
    image: item.image || fallbackMatch?.image || null,
    images:
      Array.isArray(item.images) && item.images.length > 0
        ? item.images
        : Array.isArray(fallbackMatch?.images) && fallbackMatch.images.length > 0
          ? fallbackMatch.images
          : item.image
            ? [item.image]
            : fallbackMatch?.image
              ? [fallbackMatch.image]
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
  }, []);

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
