import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';

import { supabase } from '../lib/supabase';
import { refreshApplicationData } from '../services/appBootstrapService';
import { getSupabaseErrorMessage } from '../services/supabaseService';
import {
  normalizeCategory,
  normalizeCity,
  normalizePlace,
} from '../services/transformers';
import { useAuth } from './AuthContext';

const AppDataContext = createContext(null);
const REALTIME_REFRESH_DELAY_MS = 250;
const REALTIME_TABLES = [
  'categories',
  'category_translations',
  'cities',
  'city_translations',
  'places',
  'place_translations',
  'place_images',
];

function normalizeLookupKey(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function filterDatabaseCategories(categories) {
  return categories.filter((category) => {
    const categoryKey = normalizeLookupKey(
      category.legacyId || category.id || category.name
    );

    return categoryKey !== 'mosques' && categoryKey !== 'churches';
  });
}

function findByAnyId(items, id) {
  return (items || []).filter(Boolean).find(
    (item) =>
      item.id === id ||
      item.legacyId === id ||
      String(item.id) === String(id) ||
      String(item.legacyId) === String(id)
  );
}

export function normalizeAppDataSnapshot(
  { categories = [], cities = [], places = [] } = {},
  currentLanguage
) {
  const nextCategories = filterDatabaseCategories(
    (categories || [])
      .map((item) => normalizeCategory(item, { language: currentLanguage }))
      .filter(Boolean)
  );
  const nextCities = (cities || [])
    .map((item) => normalizeCity(item, { language: currentLanguage }))
    .filter(Boolean);
  const categoryNameById = Object.fromEntries(
    nextCategories.map((item) => [item.id, item.name])
  );
  const cityNameById = Object.fromEntries(
    nextCities.map((item) => [item.id, item.name])
  );
  const nextPlaces = (places || [])
    .map((item) =>
      normalizePlace(item, {
        categoryName: categoryNameById[item?.category_id],
        cityName: cityNameById[item?.city_id],
        language: currentLanguage,
      })
    )
    .filter(Boolean);

  return {
    categories: nextCategories,
    cities: nextCities,
    places: nextPlaces,
  };
}

export function AppDataProvider({ children, initialData = undefined }) {
  const { currentLanguage } = useAuth();
  const hasInitialData = initialData != null;
  const initialSnapshot = useMemo(
    () => normalizeAppDataSnapshot(initialData || {}, currentLanguage),
    [initialData, currentLanguage]
  );
  const [categories, setCategories] = useState(initialSnapshot.categories);
  const [cities, setCities] = useState(initialSnapshot.cities);
  const [places, setPlaces] = useState(initialSnapshot.places);
  const [isLoading, setIsLoading] = useState(!hasInitialData);
  const [errorMessage, setErrorMessage] = useState('');
  const fetchPromiseRef = useRef(null);

  const fetchAllData = useCallback(async () => {
    if (fetchPromiseRef.current) {
      return fetchPromiseRef.current;
    }

    setIsLoading(true);
    setErrorMessage('');

    fetchPromiseRef.current = (async () => {
      const {
        categories: categoriesResponse,
        cities: citiesResponse,
        places: placesResponse,
      } = await refreshApplicationData();
      const nextSnapshot = normalizeAppDataSnapshot(
        {
          categories: categoriesResponse,
          cities: citiesResponse,
          places: placesResponse,
        },
        currentLanguage
      );

      setCategories(nextSnapshot.categories);
      setCities(nextSnapshot.cities);
      setPlaces(nextSnapshot.places);
    })();

    try {
      await fetchPromiseRef.current;
    } catch (error) {
      setErrorMessage(
        getSupabaseErrorMessage(error, 'Could not load data from Supabase.')
      );
      setCategories([]);
      setCities([]);
      setPlaces([]);
    } finally {
      fetchPromiseRef.current = null;
      setIsLoading(false);
    }
  }, [currentLanguage]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    if (!hasInitialData) {
      return;
    }

    setCategories(initialSnapshot.categories);
    setCities(initialSnapshot.cities);
    setPlaces(initialSnapshot.places);
    setIsLoading(false);
  }, [hasInitialData, initialSnapshot]);

  useEffect(() => {
    let refreshTimer;

    const scheduleRefresh = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(fetchAllData, REALTIME_REFRESH_DELAY_MS);
    };

    const channel = supabase.channel('app-data-updates');

    REALTIME_TABLES.forEach((table) => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        scheduleRefresh
      );
    });

    channel.subscribe();

    const appStateSubscription = AppState.addEventListener(
      'change',
      (nextState) => {
        if (nextState === 'active') {
          scheduleRefresh();
        }
      }
    );

    return () => {
      clearTimeout(refreshTimer);
      appStateSubscription.remove();
      supabase.removeChannel(channel);
    };
  }, [fetchAllData]);

  const getCityById = useCallback((cityId) => findByAnyId(cities, cityId), [cities]);
  const getCategoryById = useCallback(
    (categoryId) => findByAnyId(categories, categoryId),
    [categories]
  );
  const getPlaceById = useCallback(
    (placeId) => findByAnyId(places, placeId),
    [places]
  );

  const value = useMemo(
    () => ({
      categories,
      cities,
      places,
      isLoading,
      errorMessage,
      refreshData: fetchAllData,
      getCityById,
      getCategoryById,
      getPlaceById,
    }),
    [
      categories,
      cities,
      places,
      isLoading,
      errorMessage,
      fetchAllData,
      getCityById,
      getCategoryById,
      getPlaceById,
    ]
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
