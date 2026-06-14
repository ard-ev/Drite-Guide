import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

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

const AppDataContext = createContext(null);

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

export function AppDataProvider({ children }) {
  const { currentLanguage } = useAuth();
  const [categories, setCategories] = useState([]);
  const [cities, setCities] = useState([]);
  const [places, setPlaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const [categoriesResponse, citiesResponse, placesResponse] =
        await Promise.all([
          getCategories(),
          getCities(),
          getPlaces(),
        ]);

      const nextCategories = filterDatabaseCategories(
        (categoriesResponse || [])
          .map((item) => normalizeCategory(item, { language: currentLanguage }))
          .filter(Boolean)
      );
      const nextCities = (citiesResponse || [])
        .map((item) => normalizeCity(item, { language: currentLanguage }))
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
            language: currentLanguage,
          })
        )
        .filter(Boolean);

      setCategories(nextCategories);
      setCities(nextCities);
      setPlaces(nextPlaces);
    } catch (error) {
      setErrorMessage(
        getSupabaseErrorMessage(error, 'Could not load data from Supabase.')
      );
      setCategories([]);
      setCities([]);
      setPlaces([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentLanguage]);

  useEffect(() => {
    fetchAllData();
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
