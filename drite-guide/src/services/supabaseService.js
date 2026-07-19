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
    .from('user_profile')
    .select('id')
    .eq('id', authUserId)
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
    .replace(/[^a-z0-9._]+/g, '')
    .slice(0, 30);
}

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export function isValidEmailAddress(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

export const SIGNUP_PASSWORD_RULES = [
  {
    key: 'length',
    translationKey: 'auth.passwordRuleLength',
    fallbackLabel: 'At least 8 characters',
    test: (password) => String(password || '').length >= 8,
  },
  {
    key: 'uppercase',
    translationKey: 'auth.passwordRuleUppercase',
    fallbackLabel: 'One uppercase letter',
    test: (password) => /[A-Z]/.test(String(password || '')),
  },
  {
    key: 'lowercase',
    translationKey: 'auth.passwordRuleLowercase',
    fallbackLabel: 'One lowercase letter',
    test: (password) => /[a-z]/.test(String(password || '')),
  },
  {
    key: 'number',
    translationKey: 'auth.passwordRuleNumber',
    fallbackLabel: 'One number',
    test: (password) => /\d/.test(String(password || '')),
  },
  {
    key: 'special',
    translationKey: 'auth.passwordRuleSpecial',
    fallbackLabel: 'One special character',
    test: (password) => /[^A-Za-z0-9]/.test(String(password || '')),
  },
];

export function isStrongSignupPassword(value) {
  return SIGNUP_PASSWORD_RULES.every((rule) => rule.test(value));
}

export function sanitizeSearchTerm(value) {
  return String(value || '')
    .trim()
    .replace(/[%,()]/g, '')
    .slice(0, 80);
}
