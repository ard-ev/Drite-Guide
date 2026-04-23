import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { safeGetItem, safeSetItem } from '../utils/storage';

export const FavoritesContext = createContext();

const FAVORITES_KEY = '@drite_guide_favorites';

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const storageAvailable = useRef(false);

  // Load favorites from storage on mount
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const stored = await safeGetItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
      storageAvailable.current = true;
    } catch (error) {
      console.warn('AsyncStorage not available, using in-memory storage:', error.message);
      // AsyncStorage failed, continue with in-memory storage
      storageAvailable.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  const saveFavorites = async (newFavorites) => {
    try {
      if (storageAvailable.current) {
        await safeSetItem(FAVORITES_KEY, JSON.stringify(newFavorites));
      }
      setFavorites(newFavorites);
    } catch (error) {
      console.warn('Could not save favorites:', error.message);
      // Still update state even if storage fails
      setFavorites(newFavorites);
      storageAvailable.current = false;
    }
  };

  const toggleFavorite = useCallback((placeId) => {
    setFavorites((prevFavorites) => {
      const isFavorited = prevFavorites.includes(placeId);
      const newFavorites = isFavorited
        ? prevFavorites.filter((id) => id !== placeId)
        : [...prevFavorites, placeId];
      
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, []);

  const isFavorited = useCallback((placeId) => {
    return favorites.includes(placeId);
  }, [favorites]);

  const value = {
    favorites,
    isLoading,
    toggleFavorite,
    isFavorited,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}
