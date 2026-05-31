import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';

import { STORAGE_BUCKETS, assertSupabaseConfigured, supabase } from '../lib/supabase';
import {
  normalizeUsername,
  sanitizeSearchTerm,
  throwIfSupabaseError,
} from './supabaseService';

const DEFAULT_PROFILE_PICTURE_PATH = null;
const PUBLIC_PROFILE_SELECT = [
  'id',
  'first_name',
  'last_name',
  'username',
  'normalized_username',
  'profile_picture_path',
  'bio',
  'preferred_language',
  'created_at',
  'updated_at',
].join(',');
const MAX_PROFILE_PICTURE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PROFILE_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);
const MIME_TYPES_BY_EXTENSION = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

function getProfileId(profile) {
  return profile?.id || null;
}

function pickProfileMetadata(authUser, fallback = {}) {
  const metadata = authUser?.user_metadata || {};
  const email = authUser?.email || fallback.email || '';
  const username =
    normalizeUsername(metadata.username || fallback.username) ||
    normalizeUsername(email.split('@')[0]);

  return {
    id: authUser?.id || fallback.id || fallback.authUserId,
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
    .from('user_followers')
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
    countRows('user_followers', 'following_id', profileId),
    countRows('user_followers', 'follower_id', profileId),
    countRows('saved_places', 'user_id', profileId),
    countRows('trips', 'owner_id', profileId),
    isFollowingProfile(currentUserId, profileId),
  ]);

  return {
    ...profile,
    id: profileId,
    email: authUser?.email || profile.email,
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
    .select(PUBLIC_PROFILE_SELECT)
    .eq('id', userId)
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

  const { data, error } = await supabase
    .from('user_profile')
    .select(PUBLIC_PROFILE_SELECT)
    .eq('id', authUserId)
    .maybeSingle();

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
    return existingProfile;
  }

  return hydrateProfile(pickProfileMetadata(authUser, fallback), authUser.id, authUser);
}

export async function getProfileByUsername(username, currentUserId = null) {
  assertSupabaseConfigured();

  const normalizedUsername = normalizeUsername(username);

  if (!normalizedUsername) {
    return null;
  }

  const { data, error } = await supabase
    .from('user_profile')
    .select(PUBLIC_PROFILE_SELECT)
    .eq('normalized_username', normalizedUsername)
    .maybeSingle();

  throwIfSupabaseError(error, 'Could not load profile.');
  return hydrateProfile(data, currentUserId);
}

export async function isUsernameAvailable(username) {
  assertSupabaseConfigured();

  const normalizedUsername = normalizeUsername(username);

  if (!/^[a-z0-9_.]{3,30}$/.test(normalizedUsername)) {
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

  const { data, error: rpcError } = await supabase
    .rpc('is_username_available', { username_value: normalizedUsername });

  if (!rpcError) {
    return Boolean(data);
  }

  const { count, error } = await supabase
    .from('user_profile')
    .select('id', { count: 'exact', head: true })
    .eq('normalized_username', normalizedUsername);

  if (!error) {
    return (count || 0) === 0;
  }

  throwIfSupabaseError(rpcError || error, 'Could not check username.');
  return false;
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
    .select(PUBLIC_PROFILE_SELECT)
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
  };

  delete safeUpdates.id;
  delete safeUpdates.email;
  delete safeUpdates.email_verified;
  delete safeUpdates.role;
  delete safeUpdates.normalized_username;
  delete safeUpdates.created_at;
  delete safeUpdates.updated_at;

  if (safeUpdates.username) {
    safeUpdates.username = normalizeUsername(safeUpdates.username);
  }

  const { data, error } = await supabase
    .from('user_profile')
    .update(safeUpdates)
    .eq('id', userId)
    .select(PUBLIC_PROFILE_SELECT)
    .single();

  throwIfSupabaseError(error, 'Could not update profile.');
  return hydrateProfile(data, userId);
}

export async function updatePreferredLanguage(userId, languageCode) {
  return updateProfile(userId, { preferred_language: languageCode });
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

function getAssetExtension(asset) {
  return getAssetFileName(asset).split('.').pop()?.toLowerCase() || '';
}

async function getAssetFileSize(asset) {
  if (Number.isFinite(asset?.fileSize)) {
    return Number(asset.fileSize);
  }

  if (asset?.base64) {
    return Math.ceil(stripBase64DataUrl(asset.base64).length * 0.75);
  }

  if (asset?.uri?.startsWith('data:')) {
    return Math.ceil(stripBase64DataUrl(asset.uri).length * 0.75);
  }

  const fileInfo = await FileSystem.getInfoAsync(asset.uri, { size: true });
  return Number(fileInfo?.size || 0);
}

async function validateProfilePictureAsset(asset) {
  const mimeType = getAssetMimeType(asset);
  const extension = getAssetExtension(asset);

  if (!ALLOWED_PROFILE_IMAGE_MIME_TYPES.has(mimeType)) {
    throw new Error('Profile picture must be a JPG, PNG, or WebP image.');
  }

  if (!['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
    throw new Error('Profile picture file extension is not allowed.');
  }

  const fileSize = await getAssetFileSize(asset);

  if (!fileSize) {
    throw new Error('Profile image file is empty.');
  }

  if (fileSize > MAX_PROFILE_PICTURE_BYTES) {
    throw new Error('Profile picture must be 5 MB or smaller.');
  }
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

  await validateProfilePictureAsset(asset);

  const fileName = getAssetFileName(asset);
  const mimeType = getAssetMimeType(asset);
  const fileBody = await readAssetAsArrayBuffer(asset);
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
    .from('user_followers')
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
    .from('user_followers')
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
    .from('user_followers')
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
    .select(PUBLIC_PROFILE_SELECT)
    .in('id', targetIds);

  throwIfSupabaseError(profilesError, 'Could not load connections.');

  const profileById = new Map(
    (profiles || []).map((item) => [getProfileId(item), item])
  );
  const orderedProfiles = targetIds.map((id) => profileById.get(id)).filter(Boolean);

  return Promise.all(
    orderedProfiles.map((item) => hydrateProfile(item, currentUserId))
  );
}
