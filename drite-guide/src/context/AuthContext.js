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
  clearInvalidAuthSession,
  getCurrentSession,
  handleAuthRedirectUrl,
  isEmailRateLimitError,
  isEmailNotVerifiedError,
  isInvalidRefreshTokenError,
  onAuthStateChange,
  resendVerificationEmail,
  signIn,
  signOut,
  signUp,
} from '../services/authService';
import {
  ensureUserProfile,
  isEmailAvailable,
  isUsernameAvailable,
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
  acceptTripInvite as acceptTripInviteInSupabase,
  createTrip as createTripInSupabase,
  deleteTrip as deleteTripInSupabase,
  declineTripInvite as declineTripInviteInSupabase,
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
  isValidEmailAddress,
  normalizeEmail,
  normalizeUsername,
} from '../services/supabaseService';
import { safeGetItem, safeSetItem } from '../utils/storage';
import { logWarning } from '../utils/logger';
import { translate } from '../i18n/translations';

const AuthContext = createContext(null);

const LANGUAGE_KEY = '@drite_guide_language';
const LOCAL_SAVED_PLACES_KEY = '@drite_guide_local_saved_places';
const LOCAL_TRIPS_KEY_PREFIX = '@drite_guide_local_trips:';

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
  return (items || [])
    .filter(Boolean)
    .find(
      (item) =>
        item.id === placeId ||
        String(item.id) === String(placeId)
    );
}

function createLocalId(prefix) {
  if (globalThis.crypto?.randomUUID) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isLocalTripId(tripId) {
  return String(tripId || '').startsWith('local-trip-');
}

function isPermissionPolicyError(error) {
  const message = getSupabaseErrorMessage(error, '').toLowerCase();

  return (
    message.includes('row level security') ||
    message.includes('permission denied') ||
    message.includes('violates row-level security') ||
    message.includes('violates row level security')
  );
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [accessToken, setAccessTokenState] = useState(null);
  const [refreshToken, setRefreshTokenState] = useState(null);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [trips, setTrips] = useState([]);
  const [tripInvites, setTripInvites] = useState([]);
  const [languages, setLanguages] = useState(FALLBACK_LANGUAGES);
  const [currentLanguage, setCurrentLanguageState] = useState('en');
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const isLoggedIn = !!currentUser;

  const t = (key, params) => translate(currentLanguage, key, params);

  const applyLanguage = async (languageCode) => {
    const nextLanguage = languageCode || 'en';
    setCurrentLanguageState(nextLanguage);
    await safeSetItem(LANGUAGE_KEY, nextLanguage);
  };

  const applySessionState = async (session, user) => {
    setAccessTokenState(session?.access_token || null);
    setRefreshTokenState(session?.refresh_token || null);

    const normalizedUser = normalizeUser(user);
    setCurrentUser(normalizedUser);

    if (normalizedUser?.preferred_language) {
      await applyLanguage(normalizedUser.preferred_language);
    }
  };

  const clearSessionState = () => {
    setAccessTokenState(null);
    setRefreshTokenState(null);
    setCurrentUser(null);
    setSavedPlaces([]);
    setTrips([]);
    setTripInvites([]);
  };

  const loadLocalSavedPlaces = async () => {
    try {
      const storedPlaces = await safeGetItem(LOCAL_SAVED_PLACES_KEY);
      const parsedPlaces = storedPlaces ? JSON.parse(storedPlaces) : [];
      setSavedPlaces(
        (Array.isArray(parsedPlaces) ? parsedPlaces : [])
          .map(normalizePlace)
          .filter(Boolean)
      );
    } catch (error) {
      logWarning('Could not load local saved places:', error?.message);
      setSavedPlaces([]);
    }
  };

  const persistLocalSavedPlaces = async (nextSavedPlaces) => {
    const normalizedPlaces = (nextSavedPlaces || [])
      .map(normalizePlace)
      .filter(Boolean);

    setSavedPlaces(normalizedPlaces);
    await safeSetItem(LOCAL_SAVED_PLACES_KEY, JSON.stringify(normalizedPlaces));

    return normalizedPlaces;
  };

  const getLocalTripsKey = (userId = currentUser?.id) =>
    `${LOCAL_TRIPS_KEY_PREFIX}${userId || 'guest'}`;

  const loadLocalTrips = async (userId = currentUser?.id) => {
    if (!userId) {
      return [];
    }

    try {
      const storedTrips = await safeGetItem(getLocalTripsKey(userId));
      const parsedTrips = storedTrips ? JSON.parse(storedTrips) : [];
      return (Array.isArray(parsedTrips) ? parsedTrips : [])
        .map(normalizeTrip)
        .filter(Boolean);
    } catch (error) {
      logWarning('Could not load local trips:', error?.message);
      return [];
    }
  };

  const persistLocalTrips = async (nextTrips, userId = currentUser?.id) => {
    if (!userId) {
      return [];
    }

    const normalizedTrips = (nextTrips || [])
      .map(normalizeTrip)
      .filter(Boolean);

    await safeSetItem(getLocalTripsKey(userId), JSON.stringify(normalizedTrips));
    return normalizedTrips;
  };

  const mergeTrips = (remoteTrips = [], localTrips = []) => {
    const tripById = new Map();

    [...remoteTrips, ...localTrips]
      .map(normalizeTrip)
      .filter(Boolean)
      .forEach((trip) => {
        tripById.set(String(trip.id), trip);
      });

    return Array.from(tripById.values()).sort((left, right) =>
      String(left.start_date || '').localeCompare(String(right.start_date || ''))
    );
  };

  const isAcceptedTripForUser = (trip, userId = currentUser?.id) => {
    if (!trip?.id || !userId) {
      return false;
    }

    if (String(trip.ownerId || trip.owner_id) === String(userId) || trip.role === 'owner') {
      return true;
    }

    const member = trip.currentMember || (trip.members || []).find(
      (item) => String(item?.userId || item?.user_id) === String(userId)
    );

    return member?.status === 'accepted' || trip.currentMemberStatus === 'accepted';
  };

  const isPendingInviteForUser = (trip, userId = currentUser?.id) => {
    if (!trip?.id || !userId) {
      return false;
    }

    if (String(trip.ownerId || trip.owner_id) === String(userId) || trip.role === 'owner') {
      return false;
    }

    const member = trip.currentMember || (trip.members || []).find(
      (item) => String(item?.userId || item?.user_id) === String(userId)
    );

    return member?.status === 'invited' || trip.currentMemberStatus === 'invited';
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
      const profile = await ensureUserProfile(session.user);
      await applySessionState(session, profile);
    }

    return true;
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
      logWarning('Could not load saved places:', error?.message);
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
      const localTrips = await loadLocalTrips(currentUser.id);
      const normalizedRemoteTrips = (nextTrips || []).map(normalizeTrip).filter(Boolean);
      setTrips(
        mergeTrips(
          normalizedRemoteTrips.filter((trip) =>
            isAcceptedTripForUser(trip, currentUser.id)
          ),
          localTrips
        )
      );
      setTripInvites(
        normalizedRemoteTrips.filter((trip) =>
          isPendingInviteForUser(trip, currentUser.id)
        )
      );
    } catch (error) {
      logWarning('Could not load trips:', error?.message);
      setTrips(await loadLocalTrips(currentUser.id));
      setTripInvites([]);
    }
  };

  const bootstrapAuth = async () => {
    try {
      const storedLanguage = await safeGetItem(LANGUAGE_KEY);

      await applyLanguage(storedLanguage || 'en');
      await loadLanguages();

      if (!isSupabaseConfigured) {
        await loadLocalSavedPlaces();
        return;
      }

      await syncSessionFromAuthRedirect(await Linking.getInitialURL());

      const session = await getCurrentSession();

      if (!session?.user) {
        await loadLocalSavedPlaces();
        return;
      }

      const profile = await ensureUserProfile(session.user);
      await applySessionState(session, profile);
    } catch (error) {
      if (isInvalidRefreshTokenError(error)) {
        await clearInvalidAuthSession();
        clearSessionState();
        return;
      }

      logWarning('Auth bootstrap failed:', error?.message);
      clearSessionState();
    } finally {
      setIsBootstrapping(false);
    }
  };

  // Auth bootstrap must run once; called helpers intentionally share this mount scope.
  useEffect(() => {
    let isMounted = true;

    bootstrapAuth();

    const linkingSubscription = Linking.addEventListener('url', async ({ url }) => {
      if (!isMounted) return;

      try {
        await syncSessionFromAuthRedirect(url);
      } catch (error) {
        logWarning('Auth redirect failed:', error?.message);
      }
    });

    if (!isSupabaseConfigured) {
      return () => {
        isMounted = false;
        linkingSubscription?.remove?.();
      };
    }

    const { data } = onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      if (!session?.user) {
        clearSessionState();
        await loadLocalSavedPlaces();
        return;
      }

      try {
        const profile = await ensureUserProfile(session.user);

        if (isMounted) {
          await applySessionState(session, profile);
        }
      } catch (error) {
        if (isInvalidRefreshTokenError(error)) {
          await clearInvalidAuthSession();

          if (isMounted) {
            clearSessionState();
          }

          return;
        }

        logWarning('Auth state sync failed:', error?.message);
      }
    });

    return () => {
      isMounted = false;
      data?.subscription?.unsubscribe?.();
      linkingSubscription?.remove?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reload user-owned data only when the active user changes.
  useEffect(() => {
    if (currentUser?.id) {
      loadSavedPlaces();
      loadTrips();
      return;
    }

    setSavedPlaces([]);
    loadLocalSavedPlaces();
    setTrips([]);
    setTripInvites([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const login = async (identifier, password) => {
    const trimmedIdentifier = String(identifier || '').trim();
    const cleanPassword = String(password || '');

    if (!trimmedIdentifier || !cleanPassword) {
      return {
        success: false,
        message: t('auth.missingLogin') || 'Please enter email/username and password.',
      };
    }

    try {
      const result = await signIn(trimmedIdentifier, cleanPassword);
      await applySessionState(result.session, result.user);

      return {
        success: true,
        user: result.user,
      };
    } catch (error) {
      return {
        success: false,
        requiresEmailVerification: isEmailNotVerifiedError(error),
        verificationEmail: error?.verificationEmail || null,
        message: isEmailNotVerifiedError(error)
          ? t('auth.emailNotVerified') || 'Please verify your email first.'
          : getSupabaseErrorMessage(
            error,
            t('auth.loginFailedFallback') || 'Login failed.'
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
    const cleanFirstName = String(firstName || '').trim();
    const cleanLastName = String(lastName || '').trim();
    const cleanEmail = normalizeEmail(email);
    const cleanUsername = normalizeUsername(username);
    const cleanPassword = String(password || '');
    const cleanConfirmPassword = String(confirmPassword || '');

    if (
      !cleanFirstName ||
      !cleanLastName ||
      !cleanEmail ||
      !cleanUsername ||
      !cleanPassword ||
      !cleanConfirmPassword
    ) {
      return {
        success: false,
        message: t('auth.missingSignupFields') || 'Please fill in all fields.',
      };
    }

    if (!isValidEmailAddress(cleanEmail)) {
      return {
        success: false,
        message: t('auth.invalidEmail') || 'Please enter a valid email address.',
      };
    }

    if (!/^[a-z0-9_.]{3,30}$/.test(cleanUsername)) {
      return {
        success: false,
        message:
          t('auth.invalidUsername') ||
          'Username must be 3 to 30 characters and may only contain letters, numbers, underscore and dot.',
      };
    }

    if (!isStrongSignupPassword(cleanPassword)) {
      return {
        success: false,
        message:
          t('auth.passwordRequirements') ||
          'Password must have at least 8 characters, one uppercase letter, one lowercase letter and one number.',
      };
    }

    if (cleanPassword !== cleanConfirmPassword) {
      return {
        success: false,
        message: t('auth.passwordsMismatch') || 'Passwords do not match.',
      };
    }

    try {
      const emailAvailable = await isEmailAvailable(cleanEmail);

      if (!emailAvailable) {
        return {
          success: false,
          message:
            t('auth.emailTaken') ||
            'This email is already registered. Please log in or use another email.',
        };
      }

      const usernameAvailable = await isUsernameAvailable(cleanUsername);

      if (!usernameAvailable) {
        return {
          success: false,
          message: t('auth.usernameTaken') || 'Username already taken.',
        };
      }

      const result = await signUp({
        firstName: cleanFirstName,
        lastName: cleanLastName,
        email: cleanEmail,
        username: cleanUsername,
        password: cleanPassword,
        preferredLanguage: currentLanguage || 'en',
      });

      if (result?.session) {
        await applySessionState(result.session, result.user);
      }

      return {
        success: true,
        user: result?.user || null,
        requiresEmailVerification: result?.requiresEmailVerification ?? !result?.session,
        message: result?.session
          ? t('auth.accountCreatedMessage', {
            name: result?.user?.first_name || cleanFirstName,
          })
          : t('auth.accountCreatedVerify') ||
          'Account created. Please verify your email.',
      };
    } catch (error) {
      return {
        success: false,
        message:
          error?.code === 'username_taken'
            ? t('auth.usernameTaken') || 'Username already taken'
            : error?.code === 'email_taken' ||
              error?.code === 'signup_verification_pending'
              ? t('auth.emailTaken') ||
                'This email is already registered. Please log in or resend the verification email.'
              : isEmailRateLimitError(error)
                ? t('auth.emailRateLimit') || 'Too many emails sent. Please try again later.'
                : getSupabaseErrorMessage(
                  error,
                  error?.message ||
                  t('auth.signupFailedFallback') ||
                  'Sign up failed.'
                ),
      };
    }
  };

  const resendEmailVerification = async (email) => {
    const cleanEmail = normalizeEmail(email);

    if (!isValidEmailAddress(cleanEmail)) {
      return {
        success: false,
        message:
          t('auth.emailRequiredForVerification') ||
          'Please enter a valid email address.',
      };
    }

    try {
      await resendVerificationEmail(cleanEmail);

      return {
        success: true,
        message:
          t('auth.verificationEmailSent', { email: cleanEmail }) ||
          `Verification email sent to ${cleanEmail}.`,
      };
    } catch (error) {
      return {
        success: false,
        message: isEmailRateLimitError(error)
          ? t('auth.emailRateLimit') || 'Too many emails sent. Please try again later.'
          : getSupabaseErrorMessage(
            error,
            t('auth.verificationEmailFailed') ||
            'Verification email could not be sent.'
          ),
      };
    }
  };

  const logout = async () => {
    try {
      if (isSupabaseConfigured) {
        await signOut();
      }
    } catch (error) {
      logWarning('Logout request failed:', error?.message);
    } finally {
      clearSessionState();
      await loadLocalSavedPlaces();
    }
  };

  const getSavedPlaces = () => savedPlaces.filter(Boolean);

  const getTrips = () => trips.filter((trip) => trip?.id);

  const getTripInvites = () => tripInvites.filter((trip) => trip?.id);

  const createLocalTrip = async (payload, user = currentUser) => {
    const now = new Date().toISOString();
    const tripId = createLocalId('local-trip');
    const ownerMember = {
      id: createLocalId('local-member'),
      trip_id: tripId,
      user_id: user.id,
      role: 'owner',
      status: 'accepted',
      invited_by_user_id: user.id,
      created_at: now,
      updated_at: now,
      user,
    };
    const trip = normalizeTrip({
      id: tripId,
      owner_id: user.id,
      title: payload.title,
      description: payload.description || null,
      start_date: payload.start_date,
      end_date: payload.end_date,
      shared_note: payload.shared_note ?? payload.sharedNote ?? null,
      members: [ownerMember],
      places: [],
      role: 'owner',
      created_at: now,
      updated_at: now,
    });
    const localTrips = await loadLocalTrips(user.id);
    const nextLocalTrips = await persistLocalTrips([trip, ...localTrips], user.id);

    setTrips((currentTrips) =>
      mergeTrips(
        currentTrips.filter((item) => !isLocalTripId(item?.id)),
        nextLocalTrips
      )
    );

    return trip;
  };

  const updateLocalTrip = async (tripId, updates, userId = currentUser?.id) => {
    const localTrips = await loadLocalTrips(userId);
    let updatedTrip = null;
    const nextLocalTrips = localTrips.map((trip) => {
      if (String(trip.id) !== String(tripId)) {
        return trip;
      }

      updatedTrip = normalizeTrip({
        ...trip,
        ...updates,
        updated_at: new Date().toISOString(),
      });

      return updatedTrip;
    });

    if (!updatedTrip) {
      throw new Error('Trip could not be found.');
    }

    await persistLocalTrips(nextLocalTrips, userId);
    setTrips((currentTrips) =>
      currentTrips.map((trip) =>
        String(trip.id) === String(tripId) ? updatedTrip : trip
      )
    );

    return updatedTrip;
  };

  const deleteLocalTrip = async (tripId, userId = currentUser?.id) => {
    const localTrips = await loadLocalTrips(userId);
    const nextLocalTrips = localTrips.filter(
      (trip) => String(trip.id) !== String(tripId)
    );

    await persistLocalTrips(nextLocalTrips, userId);
    setTrips((currentTrips) =>
      currentTrips.filter((trip) => String(trip.id) !== String(tripId))
    );
  };

  const addLocalPlaceToTrip = async (tripId, payload, userId = currentUser?.id) => {
    const trip = trips.find((item) => String(item.id) === String(tripId));
    const existingPlaces = (trip?.places || []).filter(Boolean);
    const placeId = payload.place_id || payload.placeId;

    if (!trip) {
      throw new Error('Trip could not be found.');
    }

    if (!placeId) {
      throw new Error('Invalid place.');
    }

    if (
      existingPlaces.some(
        (tripPlace) => String(tripPlace.place_id || tripPlace.placeId) === String(placeId)
      )
    ) {
      throw new Error('This place is already in the trip.');
    }

    const now = new Date().toISOString();
    const tripPlace = normalizeTripPlace({
      id: createLocalId('local-trip-place'),
      trip_id: tripId,
      place_id: placeId,
      visit_date: payload.visit_date || null,
      visit_start_time: payload.visit_start_time || null,
      visit_end_time: payload.visit_end_time || null,
      note: payload.note || null,
      order_index: payload.order_index ?? existingPlaces.length,
      created_at: now,
      updated_at: now,
    });
    const updatedTrip = await updateLocalTrip(
      tripId,
      {
        places: [...existingPlaces, tripPlace],
      },
      userId
    );

    return {
      tripPlace,
      trip: updatedTrip,
    };
  };

  const updateLocalTripPlace = async (
    tripId,
    tripPlaceId,
    payload,
    userId = currentUser?.id
  ) => {
    const trip = trips.find((item) => String(item.id) === String(tripId));

    if (!trip) {
      throw new Error('Trip could not be found.');
    }

    let updatedTripPlace = null;
    const nextPlaces = (trip.places || []).filter(Boolean).map((tripPlace) => {
      if (String(tripPlace.id) !== String(tripPlaceId)) {
        return tripPlace;
      }

      updatedTripPlace = normalizeTripPlace({
        ...tripPlace,
        visit_date: payload.visit_date || null,
        visit_start_time: payload.visit_start_time || null,
        visit_end_time: payload.visit_end_time || null,
        note: payload.note || null,
        order_index: payload.order_index ?? tripPlace.orderIndex ?? tripPlace.order_index ?? 0,
        updated_at: new Date().toISOString(),
      });

      return updatedTripPlace;
    });

    if (!updatedTripPlace) {
      throw new Error('Trip place could not be found.');
    }

    await updateLocalTrip(tripId, { places: nextPlaces }, userId);
    return updatedTripPlace;
  };

  const removeLocalTripPlace = async (
    tripId,
    tripPlaceId,
    userId = currentUser?.id
  ) => {
    const trip = trips.find((item) => String(item.id) === String(tripId));

    if (!trip) {
      throw new Error('Trip could not be found.');
    }

    const currentPlaces = (trip.places || []).filter(Boolean);
    const nextPlaces = currentPlaces.filter(
      (tripPlace) => String(tripPlace.id) !== String(tripPlaceId)
    );

    if (nextPlaces.length === currentPlaces.length) {
      throw new Error('Trip place could not be found.');
    }

    await updateLocalTrip(tripId, { places: nextPlaces }, userId);
  };

  const getTrip = async (tripId) => {
    if (!tripId || !currentUser) {
      return {
        success: false,
        message: 'Sign in required',
      };
    }

    if (isLocalTripId(tripId)) {
      const trip =
        trips.find((item) => String(item.id) === String(tripId)) ||
        (await loadLocalTrips(currentUser.id)).find(
          (item) => String(item.id) === String(tripId)
        );

      return trip
        ? {
            success: true,
            trip,
          }
        : {
            success: false,
            message: 'Trip could not be found.',
          };
    }

    try {
      const trip = normalizeTrip(await fetchTrip(tripId));

      if (isAcceptedTripForUser(trip, currentUser.id)) {
        setTrips((currentTrips) => {
          const existingTrips = currentTrips.filter(Boolean);
          const hasTrip = existingTrips.some(
            (item) => String(item.id) === String(trip.id)
          );

          return hasTrip
            ? existingTrips.map((item) =>
              String(item.id) === String(trip.id) ? trip : item
            )
            : [trip, ...existingTrips];
        });
      } else if (isPendingInviteForUser(trip, currentUser.id)) {
        setTripInvites((currentInvites) => {
          const existingInvites = currentInvites.filter(Boolean);
          const hasInvite = existingInvites.some(
            (item) => String(item.id) === String(trip.id)
          );

          return hasInvite
            ? existingInvites.map((item) =>
              String(item.id) === String(trip.id) ? trip : item
            )
            : [trip, ...existingInvites];
        });
      }

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
      if (isPermissionPolicyError(error)) {
        try {
          const trip = await createLocalTrip(payload);

          return {
            success: true,
            trip,
            isLocalFallback: true,
          };
        } catch (localError) {
          return {
            success: false,
            message: getSupabaseErrorMessage(
              localError,
              'Trip creation failed.'
            ),
          };
        }
      }

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

    if (isLocalTripId(tripId)) {
      try {
        const trip = await updateLocalTrip(tripId, {
          ...payload,
          description: payload.description || null,
          shared_note: payload.shared_note ?? payload.sharedNote ?? null,
        });

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

    if (isLocalTripId(tripId)) {
      try {
        await deleteLocalTrip(tripId);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: getSupabaseErrorMessage(error, 'Trip deletion failed.'),
        };
      }
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

    if (isLocalTripId(tripId)) {
      try {
        const { tripPlace, trip } = await addLocalPlaceToTrip(tripId, payload);

        return {
          success: true,
          tripPlace,
          trip,
        };
      } catch (error) {
        return {
          success: false,
          message: getSupabaseErrorMessage(
            error,
            'Could not add this place to the trip.'
          ),
        };
      }
    }

    try {
      const tripPlace = normalizeTripPlace(
        await addPlaceToTripInSupabase(tripId, payload)
      );

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
        message: getSupabaseErrorMessage(
          error,
          'Could not add this place to the trip.'
        ),
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

    if (isLocalTripId(tripId)) {
      try {
        const tripPlace = await updateLocalTripPlace(
          tripId,
          tripPlaceId,
          payload
        );

        return {
          success: true,
          tripPlace,
        };
      } catch (error) {
        return {
          success: false,
          message: getSupabaseErrorMessage(
            error,
            'Could not update this trip place.'
          ),
        };
      }
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
        message: getSupabaseErrorMessage(
          error,
          'Could not update this trip place.'
        ),
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

    if (isLocalTripId(tripId)) {
      try {
        await removeLocalTripPlace(tripId, tripPlaceId);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          message: getSupabaseErrorMessage(
            error,
            'Could not remove this place from the trip.'
          ),
        };
      }
    }

    try {
      await removeTripPlaceInSupabase(tripId, tripPlaceId);
      await loadTrips();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getSupabaseErrorMessage(
          error,
          'Could not remove this place from the trip.'
        ),
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

    if (isLocalTripId(tripId)) {
      return {
        success: false,
        message:
          'This trip is saved locally because Supabase blocked trip writes. Run supabase/fix-trips-rls.sql to enable shared invites.',
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

    if (isLocalTripId(tripId)) {
      return {
        success: false,
        message:
          'This trip is saved locally because Supabase blocked trip writes. Run supabase/fix-trips-rls.sql to enable shared members.',
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

  const acceptTripInvite = async (tripId) => {
    if (!tripId || !currentUser) {
      return {
        success: false,
        message: 'Sign in required',
      };
    }

    try {
      const trip = normalizeTrip(
        await acceptTripInviteInSupabase(tripId, currentUser.id)
      );

      setTripInvites((currentInvites) =>
        currentInvites.filter((item) => String(item?.id) !== String(tripId))
      );
      await loadTrips();

      return {
        success: true,
        trip,
      };
    } catch (error) {
      return {
        success: false,
        message: getSupabaseErrorMessage(error, 'Could not accept this trip invite.'),
      };
    }
  };

  const declineTripInvite = async (tripId) => {
    if (!tripId || !currentUser) {
      return {
        success: false,
        message: 'Sign in required',
      };
    }

    try {
      await declineTripInviteInSupabase(tripId, currentUser.id);
      setTripInvites((currentInvites) =>
        currentInvites.filter((item) => String(item?.id) !== String(tripId))
      );
      setTrips((currentTrips) =>
        currentTrips.filter((item) => String(item?.id) !== String(tripId))
      );

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: getSupabaseErrorMessage(error, 'Could not decline this trip invite.'),
      };
    }
  };

  const updateLanguage = async (languageCode) => {
    const supportedLanguage = languages.find(
      (language) => language.code === languageCode
    );

    if (!supportedLanguage) {
      return {
        success: false,
        message: t('language.unsupported') || 'Unsupported language.',
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
        message: getSupabaseErrorMessage(
          error,
          t('language.saveError') || 'Language could not be saved.'
        ),
      };
    }
  };

  const uploadProfilePicture = async (asset) => {
    if (!currentUser || !asset?.uri) {
      return {
        success: false,
        message: t('account.profilePicture') || 'Profile picture required.',
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
        message: getSupabaseErrorMessage(
          error,
          t('account.profilePicture') || 'Profile picture could not be uploaded.'
        ),
      };
    }
  };

  const resetProfilePicture = async () => {
    if (!currentUser) {
      return {
        success: false,
        message: t('profile.loginToFollow') || 'Sign in required.',
      };
    }

    try {
      const user = normalizeUser(
        await resetProfilePictureInSupabase(currentUser.id)
      );

      setCurrentUser(user);

      return {
        success: true,
        user,
      };
    } catch (error) {
      return {
        success: false,
        message: getSupabaseErrorMessage(
          error,
          t('account.profilePicture') || 'Profile picture could not be reset.'
        ),
      };
    }
  };

  const savePlace = async (place) => {
    const placeId = place?.id;

    if (!placeId) {
      return {
        success: false,
        message: 'Invalid place.',
      };
    }

    if (!currentUser) {
      const normalizedPlace = normalizePlace(place);

      if (!normalizedPlace?.id) {
        return {
          success: false,
          message: 'Invalid place.',
        };
      }

      try {
        await persistLocalSavedPlaces([
          normalizedPlace,
          ...savedPlaces.filter(
            (item) => String(item?.id) !== String(normalizedPlace.id)
          ),
        ]);

        return { success: true };
      } catch (error) {
        logWarning('Could not save place locally:', error?.message);

        return {
          success: false,
          message: getSupabaseErrorMessage(error, 'Could not save this place.'),
        };
      }
    }

    try {
      await savePlaceToSupabase(currentUser.id, placeId);
      await loadSavedPlaces();

      return { success: true };
    } catch (error) {
      logWarning('Could not save place:', error?.message);

      return {
        success: false,
        message: getSupabaseErrorMessage(error, 'Could not save this place.'),
      };
    }
  };

  const removeSavedPlace = async (placeId) => {
    if (!placeId) {
      return {
        success: false,
        message: 'Invalid place.',
      };
    }

    if (!currentUser) {
      try {
        await persistLocalSavedPlaces(
          savedPlaces.filter((item) => String(item?.id) !== String(placeId))
        );

        return { success: true };
      } catch (error) {
        logWarning('Could not remove local saved place:', error?.message);

        return {
          success: false,
          message: getSupabaseErrorMessage(
            error,
            'Could not remove this saved place.'
          ),
        };
      }
    }

    try {
      const savedPlace = findByAnyPlaceId(savedPlaces, placeId);

      await removeSavedPlaceFromSupabase(
        currentUser.id,
        savedPlace?.id || placeId
      );

      await loadSavedPlaces();

      return { success: true };
    } catch (error) {
      logWarning('Could not remove saved place:', error?.message);

      return {
        success: false,
        message: getSupabaseErrorMessage(
          error,
          'Could not remove this saved place.'
        ),
      };
    }
  };

  // Keep provider updates tied to state changes that affect consumers.
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
      getTripInvites,
      getTrip,

      createTrip,
      updateTrip,
      deleteTrip,

      addPlaceToTrip,
      updateTripPlace,
      removeTripPlace,

      inviteUserToTrip,
      removeTripMember,
      acceptTripInvite,
      declineTripInvite,

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      currentUser,
      isLoggedIn,
      isBootstrapping,
      accessToken,
      refreshToken,
      savedPlaces,
      trips,
      tripInvites,
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
