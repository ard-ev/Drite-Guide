import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import * as Linking from 'expo-linking';

import { isSupabaseConfigured } from '../lib/supabase';
import {
  getCurrentSession,
  handleAuthRedirectUrl,
  isEmailRateLimitError,
  isEmailNotVerifiedError,
  onAuthStateChange,
  resendVerificationEmail,
  signIn,
  signOut,
  signUp,
} from '../services/authService';
import {
  getProfileById,
  resetProfilePicture as resetProfilePictureInSupabase,
  updatePreferredLanguage,
  uploadProfilePicture as uploadProfilePictureToSupabase,
} from '../services/profileService';
import {
  getSavedPlaces as fetchSavedPlaces,
  removeSavedPlace as removeSavedPlaceFromSupabase,
  savePlace as savePlaceToSupabase,
} from '../services/savedService';
import {
  addPlaceToTrip as addPlaceToTripInSupabase,
  createTrip as createTripInSupabase,
  deleteTrip as deleteTripInSupabase,
  getTrip as fetchTrip,
  getTripsForUser,
  inviteUserToTrip as inviteUserToTripInSupabase,
  removeTripMember as removeTripMemberInSupabase,
  removeTripPlace as removeTripPlaceInSupabase,
  updateTrip as updateTripInSupabase,
  updateTripPlace as updateTripPlaceInSupabase,
} from '../services/tripsService';
import {
  normalizePlace,
  normalizeTrip,
  normalizeTripPlace,
  normalizeUser,
} from '../services/transformers';
import {
  getSupabaseErrorMessage,
  isStrongSignupPassword,
  normalizeUsername,
} from '../services/supabaseService';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { translate } from '../i18n/translations';

const AuthContext = createContext(null);

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

function findByAnyPlaceId(items, placeId) {
  return (items || []).filter(Boolean).find(
    (item) =>
      item.id === placeId ||
      item.legacyId === placeId ||
      item.seededId === placeId ||
      String(item.id) === String(placeId) ||
      String(item.legacyId) === String(placeId) ||
      String(item.seededId) === String(placeId)
  );
}

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
  const t = (key, params) => translate(currentLanguage, key, params);

  const applySessionState = async (session, user) => {
    setAccessTokenState(session?.access_token || null);
    setRefreshTokenState(session?.refresh_token || null);
    setCurrentUser(normalizeUser(user));

    if (user?.preferred_language) {
      await applyLanguage(user.preferred_language);
    }
  };

  const clearSessionState = () => {
    setAccessTokenState(null);
    setRefreshTokenState(null);
    setCurrentUser(null);
    setSavedPlaces([]);
    setTrips([]);
  };

  const applyLanguage = async (languageCode) => {
    const nextLanguage = languageCode || 'en';
    setCurrentLanguageState(nextLanguage);
    await safeSetItem(LANGUAGE_KEY, nextLanguage);
  };

  const loadLanguages = async () => {
    setLanguages(FALLBACK_LANGUAGES);
    return FALLBACK_LANGUAGES;
  };

  const syncSessionFromAuthRedirect = async (url) => {
    if (!isSupabaseConfigured || !url) {
      return false;
    }

    const handled = await handleAuthRedirectUrl(url);

    if (!handled) {
      return false;
    }

    const session = await getCurrentSession();

    if (session?.user) {
      const profile = await getProfileById(session.user.id, session.user.id, session.user);
      await applySessionState(session, profile);
    }

    return true;
  };

  const loadGuestSavedPlaces = async () => {
    try {
      const stored = await safeGetItem(GUEST_SAVED_PLACES_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      const nextGuestSavedPlaces = Array.isArray(parsed)
        ? parsed.filter(Boolean)
        : [];
      setGuestSavedPlaces(nextGuestSavedPlaces);
      if (Array.isArray(parsed) && parsed.length !== nextGuestSavedPlaces.length) {
        await safeSetItem(
          GUEST_SAVED_PLACES_KEY,
          JSON.stringify(nextGuestSavedPlaces)
        );
      }
    } catch (error) {
      console.warn('Could not load guest saved places:', error?.message);
      setGuestSavedPlaces([]);
    }
  };

  const persistGuestSavedPlaces = async (nextSavedPlaces) => {
    const compactSavedPlaces = (nextSavedPlaces || []).filter(Boolean);
    setGuestSavedPlaces(compactSavedPlaces);
    await safeSetItem(
      GUEST_SAVED_PLACES_KEY,
      JSON.stringify(compactSavedPlaces)
    );
  };

  const loadSavedPlaces = async () => {
    if (!currentUser?.id) {
      setSavedPlaces([]);
      return;
    }

    try {
      const nextSavedPlaces = await fetchSavedPlaces(currentUser.id);
      setSavedPlaces(nextSavedPlaces.map(normalizePlace).filter(Boolean));
    } catch (error) {
      console.warn('Could not load saved places:', error?.message);
      setSavedPlaces([]);
    }
  };

  const loadTrips = async () => {
    if (!currentUser?.id) {
      setTrips([]);
      return;
    }

    try {
      const nextTrips = await getTripsForUser(currentUser.id);
      setTrips((nextTrips || []).map(normalizeTrip).filter(Boolean));
    } catch (error) {
      console.warn('Could not load trips:', error?.message);
      setTrips([]);
    }
  };

  const bootstrapAuth = async () => {
    try {
      await loadGuestSavedPlaces();
      const storedLanguage = await safeGetItem(LANGUAGE_KEY);

      await applyLanguage(storedLanguage || 'en');
      await loadLanguages();

      if (!isSupabaseConfigured) {
        return;
      }

      await syncSessionFromAuthRedirect(await Linking.getInitialURL());

      const session = await getCurrentSession();

      if (!session?.user) {
        return;
      }

      const profile = await getProfileById(session.user.id, session.user.id, session.user);
      await applySessionState(session, profile);
    } catch (error) {
      console.warn('Auth bootstrap failed:', error?.message);
      clearSessionState();
    } finally {
      setIsBootstrapping(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    bootstrapAuth();

    const linkingSubscription = Linking.addEventListener('url', async ({ url }) => {
      if (!isMounted) {
        return;
      }

      try {
        await syncSessionFromAuthRedirect(url);
      } catch (error) {
        console.warn('Auth redirect failed:', error?.message);
      }
    });

    if (!isSupabaseConfigured) {
      return () => {
        isMounted = false;
        linkingSubscription?.remove?.();
      };
    }

    const { data } = onAuthStateChange(async (_event, session) => {
      if (!isMounted) {
        return;
      }

      if (!session?.user) {
        clearSessionState();
        return;
      }

      try {
        const profile = await getProfileById(session.user.id, session.user.id, session.user);
        if (isMounted) {
          await applySessionState(session, profile);
        }
      } catch (error) {
        console.warn('Auth state sync failed:', error?.message);
      }
    });

    return () => {
      isMounted = false;
      data?.subscription?.unsubscribe?.();
      linkingSubscription?.remove?.();
    };
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      loadSavedPlaces();
      loadTrips();
      return;
    }

    setSavedPlaces([]);
    setTrips([]);
  }, [currentUser?.id]);

  const login = async (identifier, password) => {
    const trimmedIdentifier = identifier.trim();
    const trimmedPassword = password.trim();

    if (!trimmedIdentifier || !trimmedPassword) {
      return {
        success: false,
        message: t('auth.missingLogin'),
      };
    }

    try {
      const result = await signIn(trimmedIdentifier, trimmedPassword);
      await applySessionState(result.session, result.user);

      return {
        success: true,
        user: result.user,
      };
    } catch (error) {
      return {
        success: false,
        requiresEmailVerification: isEmailNotVerifiedError(error),
        message: isEmailNotVerifiedError(error)
          ? t('auth.emailNotVerified')
          : getSupabaseErrorMessage(error, t('auth.loginFailedFallback')),
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
    const trimmedFirstName = String(firstName || '').trim();
    const trimmedLastName = String(lastName || '').trim();
    const trimmedEmail = String(email || '').trim().toLowerCase();
    const trimmedUsername = String(username || '').trim();
    const normalizedUsername = normalizeUsername(trimmedUsername);
    const trimmedPassword = String(password || '').trim();
    const trimmedConfirmPassword = String(confirmPassword || '').trim();

    if (
      !trimmedFirstName ||
      !trimmedLastName ||
      !trimmedEmail ||
      !trimmedUsername ||
      !trimmedPassword ||
      !trimmedConfirmPassword
    ) {
      return {
        success: false,
        message: t('auth.missingSignupFields'),
      };
    }

    if (!trimmedEmail.includes('@')) {
      return {
        success: false,
        message: t('auth.invalidEmail'),
      };
    }

    if (normalizedUsername.length < 3) {
      return {
        success: false,
        message: t('auth.invalidUsername'),
      };
    }

    if (!isStrongSignupPassword(trimmedPassword)) {
      return {
        success: false,
        message: t('auth.passwordRequirements'),
      };
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      return {
        success: false,
        message: t('auth.passwordsMismatch'),
      };
    }

    try {
      const result = await signUp({
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: trimmedEmail,
        username: normalizedUsername,
        password: trimmedPassword,
        preferredLanguage: currentLanguage,
      });

      if (result.session) {
        await applySessionState(result.session, result.user);
      }

      return {
        success: true,
        user: result.user,
        requiresEmailVerification: result.requiresEmailVerification,
        message: result.session
          ? t('auth.accountCreatedMessage', { name: result.user?.first_name })
          : t('auth.accountCreatedVerify'),
      };
    } catch (error) {
      return {
        success: false,
        message: isEmailRateLimitError(error)
          ? t('auth.emailRateLimit')
          : getSupabaseErrorMessage(error, t('auth.signupFailedFallback')),
      };
    }
  };

  const resendEmailVerification = async (email) => {
    const trimmedEmail = String(email || '').trim().toLowerCase();

    if (!trimmedEmail) {
      return {
        success: false,
        message: t('auth.emailRequiredForVerification'),
      };
    }

    try {
      await resendVerificationEmail(trimmedEmail);

      return {
        success: true,
        message: t('auth.verificationEmailSent', { email: trimmedEmail }),
      };
    } catch (error) {
      return {
        success: false,
        message: isEmailRateLimitError(error)
          ? t('auth.emailRateLimit')
          : getSupabaseErrorMessage(error, t('auth.verificationEmailFailed')),
      };
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured) {
        await signOut();
      }
    } catch (error) {
      console.warn('Logout request failed:', error?.message);
    } finally {
      clearSessionState();
    }
  };

  const getSavedPlaces = () =>
    (currentUser ? savedPlaces : guestSavedPlaces).filter(Boolean);
  const getTrips = () => trips.filter((trip) => trip?.id);

  const getTrip = async (tripId) => {
    if (!tripId || !currentUser) {
      return {
        success: false,
        message: 'Sign in required',
      };
    }

    try {
      const trip = normalizeTrip(await fetchTrip(tripId));
      setTrips((currentTrips) => {
        const existingTrips = currentTrips.filter(Boolean);
        const hasTrip = existingTrips.some((item) => String(item.id) === String(trip.id));
        return hasTrip
          ? existingTrips.map((item) => (String(item.id) === String(trip.id) ? trip : item))
          : [trip, ...existingTrips];
      });

      return {
        success: true,
        trip,
      };
    } catch (error) {
      return {
        success: false,
        message: getSupabaseErrorMessage(error, 'Trip could not be loaded.'),
      };
    }
  };

  const createTrip = async (payload) => {
    if (!currentUser) {
      return {
        success: false,
        message: 'Sign in required',
      };
    }

    try {
      const trip = normalizeTrip(await createTripInSupabase(currentUser.id, payload));
      await loadTrips();
      return {
        success: true,
        trip,
      };
    } catch (error) {
      return {
        success: false,
        message: getSupabaseErrorMessage(error, 'Trip creation failed.'),
      };
    }
  };

  const updateTrip = async (tripId, payload) => {
    if (!tripId || !currentUser) {
      return {
        success: false,
        message: 'Sign in required',
      };
    }

    try {
      const trip = normalizeTrip(
        await updateTripInSupabase(tripId, currentUser.id, payload)
      );
      await loadTrips();
      return {
        success: true,
        trip,
      };
    } catch (error) {
      return {
        success: false,
        message: getSupabaseErrorMessage(error, 'Trip update failed.'),
      };
    }
  };

  const deleteTrip = async (tripId) => {
    if (!tripId || !currentUser) {
      return {
        success: false,
        message: 'Sign in required',
      };
    }

    try {
      await deleteTripInSupabase(tripId, currentUser.id);
      await loadTrips();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getSupabaseErrorMessage(error, 'Trip deletion failed.'),
      };
    }
  };

  const addPlaceToTrip = async (tripId, payload) => {
    if (!tripId || !currentUser) {
      return {
        success: false,
        message: 'Sign in required',
      };
    }

    try {
      const tripPlace = normalizeTripPlace(await addPlaceToTripInSupabase(tripId, payload));
      const trip = normalizeTrip(await fetchTrip(tripId));
      await loadTrips();
      return {
        success: true,
        tripPlace,
        trip,
      };
    } catch (error) {
      return {
        success: false,
        message: getSupabaseErrorMessage(error, 'Could not add this place to the trip.'),
      };
    }
  };

  const updateTripPlace = async (tripId, tripPlaceId, payload) => {
    if (!tripId || !tripPlaceId || !currentUser) {
      return {
        success: false,
        message: 'Sign in required',
      };
    }

    try {
      const tripPlace = normalizeTripPlace(
        await updateTripPlaceInSupabase(tripId, tripPlaceId, payload)
      );
      await loadTrips();
      return {
        success: true,
        tripPlace,
      };
    } catch (error) {
      return {
        success: false,
        message: getSupabaseErrorMessage(error, 'Could not update this trip place.'),
      };
    }
  };

  const removeTripPlace = async (tripId, tripPlaceId) => {
    if (!tripId || !tripPlaceId || !currentUser) {
      return {
        success: false,
        message: 'Sign in required',
      };
    }

    try {
      await removeTripPlaceInSupabase(tripId, tripPlaceId);
      await loadTrips();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getSupabaseErrorMessage(error, 'Could not remove this place from the trip.'),
      };
    }
  };

  const inviteUserToTrip = async (tripId, username) => {
    if (!tripId || !currentUser) {
      return {
        success: false,
        message: 'Sign in required',
      };
    }

    try {
      const member = await inviteUserToTripInSupabase(
        tripId,
        username,
        currentUser.id
      );
      await loadTrips();
      return {
        success: true,
        member,
      };
    } catch (error) {
      return {
        success: false,
        message: getSupabaseErrorMessage(error, 'Could not invite this user.'),
      };
    }
  };

  const removeTripMember = async (tripId, userId) => {
    if (!tripId || !userId || !currentUser) {
      return {
        success: false,
        message: 'Sign in required',
      };
    }

    try {
      await removeTripMemberInSupabase(tripId, userId);
      await loadTrips();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getSupabaseErrorMessage(error, 'Could not remove this member.'),
      };
    }
  };

  const updateLanguage = async (languageCode) => {
    const supportedLanguage = languages.find((language) => language.code === languageCode);

    if (!supportedLanguage) {
      return {
        success: false,
        message: t('language.unsupported'),
      };
    }

    try {
      if (currentUser) {
        const updatedUser = await updatePreferredLanguage(currentUser.id, languageCode);
        setCurrentUser(normalizeUser(updatedUser));
      }

      await applyLanguage(languageCode);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getSupabaseErrorMessage(error, t('language.saveError')),
      };
    }
  };

  const uploadProfilePicture = async (asset) => {
    if (!currentUser || !asset?.uri) {
      return {
        success: false,
        message: t('account.profilePicture'),
      };
    }

    try {
      const user = normalizeUser(
        await uploadProfilePictureToSupabase(currentUser.id, asset)
      );
      setCurrentUser(user);

      return {
        success: true,
        user,
      };
    } catch (error) {
      return {
        success: false,
        message: getSupabaseErrorMessage(error, t('account.profilePicture')),
      };
    }
  };

  const resetProfilePicture = async () => {
    if (!currentUser) {
      return {
        success: false,
        message: t('profile.loginToFollow'),
      };
    }

    try {
      const user = normalizeUser(await resetProfilePictureInSupabase(currentUser.id));
      setCurrentUser(user);

      return {
        success: true,
        user,
      };
    } catch (error) {
      return {
        success: false,
        message: getSupabaseErrorMessage(error, t('account.profilePicture')),
      };
    }
  };

  const savePlace = async (place) => {
    const placeId = place?.seededId || place?.id;

    if (!placeId) {
      return;
    }

    if (!currentUser) {
      const alreadySaved = guestSavedPlaces
        .filter(Boolean)
        .some((item) => findByAnyPlaceId([item], placeId));

      if (alreadySaved) {
        return;
      }

      await persistGuestSavedPlaces([...guestSavedPlaces.filter(Boolean), place]);
      return;
    }

    try {
      await savePlaceToSupabase(currentUser.id, placeId);
      await loadSavedPlaces();
      return { success: true };
    } catch (error) {
      console.warn('Could not save place:', error?.message);
      return {
        success: false,
        message: getSupabaseErrorMessage(error, 'Could not save this place.'),
      };
    }
  };

  const removeSavedPlace = async (placeId) => {
    if (!placeId) {
      return;
    }

    if (!currentUser) {
      await persistGuestSavedPlaces(
        guestSavedPlaces.filter((item) => item && !findByAnyPlaceId([item], placeId))
      );
      return;
    }

    try {
      const savedPlace = findByAnyPlaceId(savedPlaces, placeId);
      await removeSavedPlaceFromSupabase(currentUser.id, savedPlace?.id || placeId);
      await loadSavedPlaces();
      return { success: true };
    } catch (error) {
      console.warn('Could not remove saved place:', error?.message);
      return {
        success: false,
        message: getSupabaseErrorMessage(error, 'Could not remove this saved place.'),
      };
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
      resendEmailVerification,
      logout,
      getSavedPlaces,
      getTrips,
      getTrip,
      createTrip,
      updateTrip,
      deleteTrip,
      addPlaceToTrip,
      updateTripPlace,
      removeTripPlace,
      inviteUserToTrip,
      removeTripMember,
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
