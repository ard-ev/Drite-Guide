import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  api,
  extractApiErrorMessage,
  setApiLanguage,
  setAuthToken,
} from '../services/api';
import { normalizePlace, normalizeUser } from '../services/transformers';
import { safeGetItem, safeRemoveItem, safeSetItem } from '../utils/storage';

const AuthContext = createContext(null);

const ACCESS_TOKEN_KEY = '@drite_guide_access_token';
const REFRESH_TOKEN_KEY = '@drite_guide_refresh_token';
const GUEST_SAVED_PLACES_KEY = '@drite_guide_guest_saved_places';
const LANGUAGE_KEY = '@drite_guide_language';

const FALLBACK_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'sq', name: 'Albanian' },
  { code: 'de', name: 'German' },
  { code: 'es', name: 'Spanish' },
  { code: 'it', name: 'Italian' },
  { code: 'fr', name: 'French' },
];

const DEFAULT_PROFILE_PICTURE =
  'https://placehold.co/240x240/E5E7EB/222222?text=DG';

const PROFILE_PICTURE_PRESETS = [
  DEFAULT_PROFILE_PICTURE,
  'https://placehold.co/240x240/FDECEC/9F1239?text=DG',
  'https://placehold.co/240x240/E0F2FE/0C4A6E?text=DG',
  'https://placehold.co/240x240/ECFCCB/3F6212?text=DG',
];

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [accessToken, setAccessTokenState] = useState(null);
  const [refreshToken, setRefreshTokenState] = useState(null);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [guestSavedPlaces, setGuestSavedPlaces] = useState([]);
  const [trips, setTrips] = useState([]);
  const [languages, setLanguages] = useState(FALLBACK_LANGUAGES);
  const [currentLanguage, setCurrentLanguageState] = useState('en');
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const isLoggedIn = !!currentUser;

  const applySession = async ({
    accessToken: nextAccessToken,
    refreshToken: nextRefreshToken,
    user,
  }) => {
    setAccessToken(nextAccessToken);
    setRefreshToken(nextRefreshToken);
    setCurrentUser(normalizeUser(user));
    await Promise.all([
      safeSetItem(ACCESS_TOKEN_KEY, nextAccessToken),
      safeSetItem(REFRESH_TOKEN_KEY, nextRefreshToken),
    ]);
  };

  const clearSession = async () => {
    setAuthToken(null);
    setAccessTokenState(null);
    setRefreshTokenState(null);
    setCurrentUser(null);
    setSavedPlaces([]);
    setTrips([]);
    await Promise.all([
      safeRemoveItem(ACCESS_TOKEN_KEY),
      safeRemoveItem(REFRESH_TOKEN_KEY),
    ]);
  };

  const setAccessToken = (token) => {
    setAccessTokenState(token);
    setAuthToken(token);
  };

  const setRefreshToken = (token) => {
    setRefreshTokenState(token);
  };

  const applyLanguage = async (languageCode) => {
    const nextLanguage = languageCode || 'en';
    setCurrentLanguageState(nextLanguage);
    setApiLanguage(nextLanguage);
    await safeSetItem(LANGUAGE_KEY, nextLanguage);
  };

  const loadLanguages = async () => {
    try {
      const response = await api.get('/languages');
      const nextLanguages = Array.isArray(response.data) && response.data.length > 0
        ? response.data
        : FALLBACK_LANGUAGES;
      setLanguages(nextLanguages);
      return nextLanguages;
    } catch (error) {
      console.warn('Could not load languages:', error?.message);
      setLanguages(FALLBACK_LANGUAGES);
      return FALLBACK_LANGUAGES;
    }
  };

  const loadGuestSavedPlaces = async () => {
    try {
      const stored = await safeGetItem(GUEST_SAVED_PLACES_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      setGuestSavedPlaces(Array.isArray(parsed) ? parsed : []);
    } catch (error) {
      console.warn('Could not load guest saved places:', error?.message);
      setGuestSavedPlaces([]);
    }
  };

  const persistGuestSavedPlaces = async (nextSavedPlaces) => {
    setGuestSavedPlaces(nextSavedPlaces);
    await safeSetItem(
      GUEST_SAVED_PLACES_KEY,
      JSON.stringify(nextSavedPlaces)
    );
  };

  const loadSavedPlaces = async () => {
    if (!accessToken) {
      setSavedPlaces([]);
      return;
    }

    try {
      const response = await api.get('/saved-places/me');
      const nextSavedPlaces = (response.data || []).map((item) =>
        normalizePlace(item.place)
      );
      setSavedPlaces(nextSavedPlaces);
    } catch (error) {
      console.warn('Could not load saved places:', error?.message);
      setSavedPlaces([]);
    }
  };

  const loadTrips = async () => {
    if (!accessToken) {
      setTrips([]);
      return;
    }

    try {
      const response = await api.get('/trips/me');
      setTrips(response.data || []);
    } catch (error) {
      console.warn('Could not load trips:', error?.message);
      setTrips([]);
    }
  };

  const bootstrapAuth = async () => {
    try {
      await loadGuestSavedPlaces();
      const [storedAccessToken, storedRefreshToken, storedLanguage] = await Promise.all([
        safeGetItem(ACCESS_TOKEN_KEY),
        safeGetItem(REFRESH_TOKEN_KEY),
        safeGetItem(LANGUAGE_KEY),
      ]);

      await applyLanguage(storedLanguage || 'en');
      await loadLanguages();

      if (!storedAccessToken || !storedRefreshToken) {
        return;
      }

      setAccessToken(storedAccessToken);
      setRefreshToken(storedRefreshToken);

      try {
        const meResponse = await api.get('/users/me');
        const normalizedUser = normalizeUser(meResponse.data);
        setCurrentUser(normalizedUser);
        await applyLanguage(normalizedUser.preferred_language || storedLanguage || 'en');
      } catch (_error) {
        const refreshResponse = await api.post('/auth/refresh', {
          refresh_token: storedRefreshToken,
        });

        await applySession({
          accessToken: refreshResponse.data.access_token,
          refreshToken: refreshResponse.data.refresh_token,
          user: refreshResponse.data.user,
        });
      }
    } catch (error) {
      console.warn('Auth bootstrap failed:', error?.message);
      await clearSession();
    } finally {
      setIsBootstrapping(false);
    }
  };

  useEffect(() => {
    bootstrapAuth();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadSavedPlaces();
      loadTrips();
      return;
    }

    setSavedPlaces([]);
    setTrips([]);
  }, [currentUser, accessToken]);

  const login = async (identifier, password) => {
    const trimmedIdentifier = identifier.trim();
    const trimmedPassword = password.trim();

    if (!trimmedIdentifier || !trimmedPassword) {
      return {
        success: false,
        message: 'Please enter your email or username and your password.',
      };
    }

    try {
      const response = await api.post('/auth/login', {
        identifier: trimmedIdentifier,
        password: trimmedPassword,
      });

      await applySession({
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        user: normalizeUser(response.data.user),
      });
      await applyLanguage(response.data.user?.preferred_language || currentLanguage);

      return {
        success: true,
        user: response.data.user,
      };
    } catch (error) {
      return {
        success: false,
        message: await extractApiErrorMessage(
          error,
          'Login failed. Please try again.'
        ),
      };
    }
  };

  const signup = async ({
    firstName,
    lastName,
    email,
    username,
    password,
    confirmPassword,
  }) => {
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (trimmedPassword !== trimmedConfirmPassword) {
      return {
        success: false,
        message: 'The passwords do not match.',
      };
    }

    try {
      const response = await api.post('/auth/register', {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        username: username.trim().toLowerCase(),
        password: trimmedPassword,
      });

      const loginResult = await login(email, trimmedPassword);

      if (!loginResult.success) {
        return {
          success: true,
          user: normalizeUser(response.data.user),
          message:
            'Account created. Please log in and verify your email from the backend log.',
        };
      }

      return {
        success: true,
        user: loginResult.user,
        message: response.data.message,
      };
    } catch (error) {
      return {
        success: false,
        message: await extractApiErrorMessage(
          error,
          'Sign up failed. Please try again.'
        ),
      };
    }
  };

  const logout = async () => {
    try {
      if (accessToken) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.warn('Logout request failed:', error?.message);
    } finally {
      await clearSession();
    }
  };

  const getSavedPlaces = () => (currentUser ? savedPlaces : guestSavedPlaces);
  const getTrips = () => trips;

  const updateLanguage = async (languageCode) => {
    const supportedLanguage = languages.find((language) => language.code === languageCode);

    if (!supportedLanguage) {
      return {
        success: false,
        message: 'Language is not supported.',
      };
    }

    try {
      if (currentUser) {
        const response = await api.patch('/users/me/language', {
          preferred_language: languageCode,
        });
        setCurrentUser(normalizeUser(response.data));
      }

      await applyLanguage(languageCode);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: await extractApiErrorMessage(
          error,
          'Could not save language.'
        ),
      };
    }
  };

  const uploadProfilePicture = async (asset) => {
    if (!currentUser || !asset?.uri) {
      return {
        success: false,
        message: 'No profile picture selected.',
      };
    }

    try {
      const fileName =
        asset.name || asset.fileName || `profile-picture.${(asset.mimeType || 'image/jpeg').split('/')[1] || 'jpg'}`;
      const mimeType = asset.mimeType || 'image/jpeg';
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: fileName,
        type: mimeType,
      });

      const response = await api.patch('/users/me/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setCurrentUser(normalizeUser(response.data));

      return {
        success: true,
        user: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: await extractApiErrorMessage(
          error,
          'Could not update the profile picture.'
        ),
      };
    }
  };

  const resetProfilePicture = async () => {
    if (!currentUser) {
      return {
        success: false,
        message: 'You need to be logged in.',
      };
    }

    try {
      const response = await api.patch('/users/me', {
        profile_picture_path: 'uploads/profile_pictures/default-profile.svg',
      });
      setCurrentUser(normalizeUser(response.data));

      return {
        success: true,
        user: response.data,
      };
    } catch (error) {
      return {
        success: false,
        message: await extractApiErrorMessage(
          error,
          'Could not reset the profile picture.'
        ),
      };
    }
  };

  const savePlace = async (place) => {
    if (!place?.id) {
      return;
    }

    if (!currentUser) {
      const alreadySaved = guestSavedPlaces.some((item) => item.id === place.id);

      if (alreadySaved) {
        return;
      }

      await persistGuestSavedPlaces([...guestSavedPlaces, place]);
      return;
    }

    try {
      await api.post(`/saved-places/${place.id}`);
      await loadSavedPlaces();
    } catch (error) {
      console.warn('Could not save place:', error?.message);
    }
  };

  const removeSavedPlace = async (placeId) => {
    if (!placeId) {
      return;
    }

    if (!currentUser) {
      await persistGuestSavedPlaces(
        guestSavedPlaces.filter((item) => item.id !== placeId)
      );
      return;
    }

    try {
      await api.delete(`/saved-places/${placeId}`);
      await loadSavedPlaces();
    } catch (error) {
      console.warn('Could not remove saved place:', error?.message);
    }
  };

  const value = useMemo(
    () => ({
      currentUser,
      isLoggedIn,
      isBootstrapping,
      accessToken,
      refreshToken,
      login,
      signup,
      logout,
      getSavedPlaces,
      getTrips,
      savePlace,
      removeSavedPlace,
      refreshSavedPlaces: loadSavedPlaces,
      refreshTrips: loadTrips,
      languages,
      currentLanguage,
      updateLanguage,
      refreshLanguages: loadLanguages,
      uploadProfilePicture,
      resetProfilePicture,
      profilePicturePresets: PROFILE_PICTURE_PRESETS,
      defaultProfilePicture: DEFAULT_PROFILE_PICTURE,
    }),
    [
      currentUser,
      isLoggedIn,
      isBootstrapping,
      accessToken,
      refreshToken,
      savedPlaces,
      guestSavedPlaces,
      trips,
      languages,
      currentLanguage,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
