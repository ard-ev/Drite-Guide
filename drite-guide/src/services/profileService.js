import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';

import { STORAGE_BUCKETS, assertSupabaseConfigured, supabase } from '../lib/supabase';
import {
  isMissingAuthUserIdColumnError,
  isMissingUserProfileColumnError,
  isValidEmailAddress,
  normalizeEmail,
  normalizeUsername,
  sanitizeSearchTerm,
  throwIfSupabaseError,
} from './supabaseService';

const DEFAULT_PROFILE_PICTURE_PATH = null;
const MIME_TYPES_BY_EXTENSION = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
};

function getProfileId(profile) {
  return profile?.usr_id || profile?.id;
}

function pickProfileMetadata(authUser, fallback = {}) {
  const metadata = authUser?.user_metadata || {};
  const email = authUser?.email || fallback.email || '';
  const username =
    normalizeUsername(metadata.username || fallback.username) ||
    normalizeUsername(email.split('@')[0]);

  return {
    auth_user_id: authUser?.id || fallback.auth_user_id || fallback.authUserId,
    first_name: metadata.first_name || fallback.first_name || fallback.firstName || '',
    last_name: metadata.last_name || fallback.last_name || fallback.lastName || '',
    email: email.toLowerCase(),
    username,
    preferred_language:
      metadata.preferred_language ||
      fallback.preferred_language ||
      fallback.preferredLanguage ||
      'en',
    profile_picture_path:
      metadata.profile_picture_path ||
      fallback.profile_picture_path ||
      DEFAULT_PROFILE_PICTURE_PATH,
    email_verified: Boolean(authUser?.email_confirmed_at || fallback.email_verified),
  };
}

async function countRows(tableName, columnName, value) {
  if (!value) {
    return 0;
  }

  const { count, error } = await supabase
    .from(tableName)
    .select('*', { count: 'exact', head: true })
    .eq(columnName, value);

  if (error) {
    return 0;
  }

  return count || 0;
}

async function isFollowingProfile(currentUserId, targetUserId) {
  if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
    return false;
  }

  const { data, error } = await supabase
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', currentUserId)
    .eq('following_id', targetUserId)
    .maybeSingle();

  if (error) {
    return false;
  }

  return Boolean(data);
}

export async function hydrateProfile(profile, currentUserId = null, authUser = null) {
  if (!profile) {
    return null;
  }

  const profileId = getProfileId(profile);
  const [
    followersCount,
    followingCount,
    savedPlacesCount,
    tripsCount,
    isFollowing,
  ] = await Promise.all([
    countRows('user_follows', 'following_id', profileId),
    countRows('user_follows', 'follower_id', profileId),
    countRows('saved_places', 'user_id', profileId),
    countRows('trips', 'owner_id', profileId),
    isFollowingProfile(currentUserId, profileId),
  ]);

  return {
    ...profile,
    id: profileId,
    usrId: profileId,
    email_verified: Boolean(profile.email_verified || authUser?.email_confirmed_at),
    followers_count: followersCount,
    following_count: followingCount,
    saved_places_count: savedPlacesCount,
    trips_count: tripsCount,
    is_following: isFollowing,
  };
}

export async function getProfileById(userId, currentUserId = null, authUser = null) {
  assertSupabaseConfigured();

  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from('user_profile')
    .select('*')
    .eq('usr_id', userId)
    .maybeSingle();

  throwIfSupabaseError(error, 'Could not load profile.');
  return hydrateProfile(data, currentUserId, authUser);
}

export async function getProfileByAuthUserId(
  authUserId,
  currentUserId = null,
  authUser = null
) {
  assertSupabaseConfigured();

  if (!authUserId) {
    return null;
  }

  let { data, error } = await supabase
    .from('user_profile')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  if (isMissingAuthUserIdColumnError(error) && authUser?.email) {
    const fallbackResult = await supabase
      .from('user_profile')
      .select('*')
      .eq('email', String(authUser.email).toLowerCase())
      .maybeSingle();

    data = fallbackResult.data;
    error = fallbackResult.error;
  }

  throwIfSupabaseError(error, 'Could not load profile.');
  return hydrateProfile(data, currentUserId, authUser);
}

export async function ensureUserProfile(authUser, fallback = {}) {
  assertSupabaseConfigured();

  if (!authUser?.id) {
    return null;
  }

  const existingProfile = await getProfileByAuthUserId(
    authUser.id,
    null,
    authUser
  );

  if (existingProfile) {
    const updatePayload = {
      email: authUser.email || existingProfile.email,
      email_verified: Boolean(authUser.email_confirmed_at),
      updated_at: new Date().toISOString(),
    };

    let { data, error } = await supabase
      .from('user_profile')
      .update(updatePayload)
      .eq('auth_user_id', authUser.id)
      .select('*')
      .single();

    if (isMissingAuthUserIdColumnError(error)) {
      const fallbackResult = await supabase
        .from('user_profile')
        .update(updatePayload)
        .eq('usr_id', existingProfile.id)
        .select('*')
        .single();

      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      return existingProfile;
    }

    return hydrateProfile(data, existingProfile.id, authUser);
  }

  const profilePayload = {
    ...pickProfileMetadata(authUser, fallback),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  let { data, error } = await supabase
    .from('user_profile')
    .insert(profilePayload)
    .select('*')
    .single();

  if (
    isMissingAuthUserIdColumnError(error) ||
    isMissingUserProfileColumnError(error, 'preferred_language')
  ) {
    const {
      auth_user_id: _authUserId,
      preferred_language: _preferredLanguage,
      ...fallbackPayload
    } = profilePayload;
    const fallbackResult = await supabase
      .from('user_profile')
      .insert(fallbackPayload)
      .select('*')
      .single();

    data = fallbackResult.data;
    error = fallbackResult.error;
  }

  throwIfSupabaseError(error, 'Could not create profile.');
  return hydrateProfile(data, getProfileId(data), authUser);
}

export async function getProfileByUsername(username, currentUserId = null) {
  assertSupabaseConfigured();

  const normalizedUsername = normalizeUsername(username);

  if (!normalizedUsername) {
    return null;
  }

  const { data, error } = await supabase
    .from('user_profile')
    .select('*')
    .eq('username', normalizedUsername)
    .maybeSingle();

  throwIfSupabaseError(error, 'Could not load profile.');
  return hydrateProfile(data, currentUserId);
}

export async function isUsernameAvailable(username) {
  assertSupabaseConfigured();

  const normalizedUsername = normalizeUsername(username);

  if (normalizedUsername.length < 3) {
    return false;
  }

  const { data: functionData, error: functionError } = await supabase.functions.invoke(
    'check-username',
    {
      body: { username: normalizedUsername },
    }
  );

  if (!functionError && typeof functionData?.available === 'boolean') {
    return functionData.available;
  }

  const { count, error } = await supabase
    .from('user_profile')
    .select('usr_id', { count: 'exact', head: true })
    .eq('username', normalizedUsername);

  if (!error) {
    return (count || 0) === 0;
  }

  const { data, error: rpcError } = await supabase
    .rpc('is_username_available', { username_value: normalizedUsername });

  throwIfSupabaseError(rpcError || error, 'Could not check username.');
  return Boolean(data);
}

export async function isEmailAvailable(email) {
  assertSupabaseConfigured();

  const normalizedEmail = normalizeEmail(email);

  if (!isValidEmailAddress(normalizedEmail)) {
    return false;
  }

  const { count, error } = await supabase
    .from('user_profile')
    .select('usr_id', { count: 'exact', head: true })
    .eq('email', normalizedEmail);

  throwIfSupabaseError(error, 'Could not check email.');
  return (count || 0) === 0;
}

export async function searchProfiles(query, currentUserId = null, limit = 8) {
  assertSupabaseConfigured();

  const term = sanitizeSearchTerm(query);

  if (!term) {
    return [];
  }

  const normalizedTerm = normalizeUsername(term);
  const { data, error } = await supabase
    .from('user_profile')
    .select('*')
    .or(
      `username.ilike.%${normalizedTerm}%,first_name.ilike.%${term}%,last_name.ilike.%${term}%`
    )
    .order('username', { ascending: true })
    .limit(limit);

  throwIfSupabaseError(error, 'Could not search profiles.');

  return Promise.all(
    (data || []).map((profile) => hydrateProfile(profile, currentUserId))
  );
}

export async function updateProfile(userId, updates) {
  assertSupabaseConfigured();

  const safeUpdates = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  delete safeUpdates.id;
  delete safeUpdates.usr_id;

  if (safeUpdates.username) {
    safeUpdates.username = normalizeUsername(safeUpdates.username);
  }

  const { data, error } = await supabase
    .from('user_profile')
    .update(safeUpdates)
    .eq('usr_id', userId)
    .select('*')
    .single();

  throwIfSupabaseError(error, 'Could not update profile.');
  return hydrateProfile(data, userId);
}

export async function updatePreferredLanguage(userId, languageCode) {
  try {
    return await updateProfile(userId, { preferred_language: languageCode });
  } catch (error) {
    if (isMissingUserProfileColumnError(error, 'preferred_language')) {
      return getProfileById(userId, userId);
    }

    throw error;
  }
}

function getAssetFileName(asset) {
  const rawName =
    asset?.name ||
    asset?.fileName ||
    `profile-picture.${(asset?.mimeType || 'image/jpeg').split('/')[1] || 'jpg'}`;

  return String(rawName)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'profile-picture.jpg';
}

function getAssetMimeType(asset) {
  if (asset?.mimeType) {
    return asset.mimeType;
  }

  const fileName = getAssetFileName(asset);
  const extension = fileName.split('.').pop()?.toLowerCase();
  return MIME_TYPES_BY_EXTENSION[extension] || 'image/jpeg';
}

function stripBase64DataUrl(value) {
  return String(value || '').replace(/^data:[^;]+;base64,/, '');
}

async function readAssetAsArrayBuffer(asset) {
  const base64 =
    asset?.base64 ||
    (asset?.uri?.startsWith('data:')
      ? stripBase64DataUrl(asset.uri)
      : await FileSystem.readAsStringAsync(asset.uri, {
          encoding: FileSystem.EncodingType.Base64,
        }));

  const fileBody = decode(stripBase64DataUrl(base64).replace(/\s/g, ''));

  if (!fileBody.byteLength) {
    throw new Error('Profile image file is empty.');
  }

  return fileBody;
}

export async function uploadProfilePicture(userId, asset) {
  assertSupabaseConfigured();

  if (!userId || !asset?.uri) {
    throw new Error('Missing profile image.');
  }

  const fileBody = await readAssetAsArrayBuffer(asset);
  const fileName = getAssetFileName(asset);
  const mimeType = getAssetMimeType(asset);
  const filePath = `${userId}/${Date.now()}-${fileName}`;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.profilePictures)
    .upload(filePath, fileBody, {
      cacheControl: '3600',
      contentType: mimeType,
      upsert: true,
    });

  throwIfSupabaseError(error, 'Could not upload profile picture.');

  return updateProfile(userId, {
    profile_picture_path: data?.path || filePath,
  });
}

export async function resetProfilePicture(userId) {
  return updateProfile(userId, {
    profile_picture_path: DEFAULT_PROFILE_PICTURE_PATH,
  });
}

export async function followProfile(username, currentUserId) {
  assertSupabaseConfigured();

  const targetProfile = await getProfileByUsername(username, currentUserId);

  if (!targetProfile?.id || targetProfile.id === currentUserId) {
    throw new Error('This profile cannot be followed.');
  }

  const { error } = await supabase
    .from('user_follows')
    .insert({
      follower_id: currentUserId,
      following_id: targetProfile.id,
    });

  throwIfSupabaseError(error, 'Could not follow this user.');
  return getProfileByUsername(username, currentUserId);
}

export async function unfollowProfile(username, currentUserId) {
  assertSupabaseConfigured();

  const targetProfile = await getProfileByUsername(username, currentUserId);

  if (!targetProfile?.id || targetProfile.id === currentUserId) {
    throw new Error('This profile cannot be unfollowed.');
  }

  const { error } = await supabase
    .from('user_follows')
    .delete()
    .eq('follower_id', currentUserId)
    .eq('following_id', targetProfile.id);

  throwIfSupabaseError(error, 'Could not unfollow this user.');
  return getProfileByUsername(username, currentUserId);
}

export async function getProfileConnections(username, listType, currentUserId = null) {
  assertSupabaseConfigured();

  const profile = await getProfileByUsername(username, currentUserId);

  if (!profile?.id) {
    return [];
  }

  const isFollowingList = listType === 'following';
  const filterColumn = isFollowingList ? 'follower_id' : 'following_id';
  const targetColumn = isFollowingList ? 'following_id' : 'follower_id';

  const { data, error } = await supabase
    .from('user_follows')
    .select(`${targetColumn}, created_at`)
    .eq(filterColumn, profile.id)
    .order('created_at', { ascending: false });

  throwIfSupabaseError(error, 'Could not load connections.');

  const targetIds = (data || []).map((item) => item[targetColumn]).filter(Boolean);

  if (targetIds.length === 0) {
    return [];
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('user_profile')
    .select('*')
    .in('usr_id', targetIds);

  throwIfSupabaseError(profilesError, 'Could not load connections.');

  const profileById = new Map(
    (profiles || []).map((item) => [getProfileId(item), item])
  );
  const orderedProfiles = targetIds.map((id) => profileById.get(id)).filter(Boolean);

  return Promise.all(
    orderedProfiles.map((item) => hydrateProfile(item, currentUserId))
  );
}
