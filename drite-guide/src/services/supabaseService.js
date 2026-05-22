import { supabase } from '../lib/supabase';

export function getSupabaseErrorMessage(error, fallbackMessage = 'Something went wrong.') {
  if (!error) {
    return fallbackMessage;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error.message) {
    return error.message;
  }

  if (error.error_description) {
    return error.error_description;
  }

  return fallbackMessage;
}

export function throwIfSupabaseError(error, fallbackMessage) {
  if (error) {
    throw new Error(getSupabaseErrorMessage(error, fallbackMessage));
  }
}

export async function getAuthenticatedProfileId(expectedProfileId = null) {
  const { data, error } = await supabase.auth.getUser();

  throwIfSupabaseError(error, 'Please sign in again.');

  const authUserId = data?.user?.id;

  if (!authUserId) {
    throw new Error('Please sign in again.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', authUserId)
    .maybeSingle();

  throwIfSupabaseError(profileError, 'Please sign in again.');

  const profileId = profile?.id;

  if (!profileId) {
    throw new Error('Profile could not be loaded. Please sign out and sign back in.');
  }

  if (expectedProfileId && String(expectedProfileId) !== String(profileId)) {
    throw new Error('Your session changed. Please sign out and sign back in.');
  }

  return profileId;
}

export const getAuthenticatedUserId = getAuthenticatedProfileId;

export function normalizeUsername(value) {
  return String(value || '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '')
    .slice(0, 32);
}

export function isStrongSignupPassword(value) {
  const password = String(value || '');
  return password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);
}

export function sanitizeSearchTerm(value) {
  return String(value || '')
    .trim()
    .replace(/[%,()]/g, '')
    .slice(0, 80);
}
