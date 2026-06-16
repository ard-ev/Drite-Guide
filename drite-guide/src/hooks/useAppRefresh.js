import { useCallback, useState } from 'react';

import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';

export default function useAppRefresh(extraRefresh) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { refreshData } = useAppData();
  const { isLoggedIn, refreshSavedPlaces, refreshTrips, refreshLanguages } = useAuth();

  const refreshApp = useCallback(async () => {
    setIsRefreshing(true);

    try {
      await Promise.all([
        refreshData?.(),
        refreshLanguages?.(),
        isLoggedIn ? refreshSavedPlaces?.() : Promise.resolve(),
        isLoggedIn ? refreshTrips?.() : Promise.resolve(),
        extraRefresh?.(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }, [
    extraRefresh,
    isLoggedIn,
    refreshData,
    refreshLanguages,
    refreshSavedPlaces,
    refreshTrips,
  ]);

  return {
    isRefreshing,
    refreshApp,
  };
}
