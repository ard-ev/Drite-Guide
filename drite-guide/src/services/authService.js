import * as Linking from 'expo-linking';

import { assertSupabaseConfigured, supabase } from '../lib/supabase';
import { ensureUserProfile, getProfileByUsername } from './profileService';
import {
  getSupabaseErrorMessage,
  isStrongSignupPassword,
  isValidEmailAddress,
  normalizeEmail,
  normalizeUsername,
  throwIfSupabaseError,
} from './supabaseService';

const AUTH_CALLBACK_PATH = 'auth/callback';
const PASSWORD_RESET_PATH = 'reset-password';
const EMAIL_NOT_VERIFIED_CODE = 'email_not_verified';
const EMAIL_RATE_LIMIT_CODE = 'email_rate_limit_exceeded';

function createEmailNotVerifiedError() {
  const error = new Error('Please verify your email address before logging in.');
  error.code = EMAIL_NOT_VERIFIED_CODE;
  return error;
}

function createCodedError(message, code, status = null) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

export function isEmailNotVerifiedError(error) {
  const message = getSupabaseErrorMessage(error, '').toLowerCase();
  return (
    error?.code === EMAIL_NOT_VERIFIED_CODE ||
    message.includes('email not confirmed') ||
    message.includes('not verified')
  );
}

export function isEmailRateLimitError(error) {
  const message = getSupabaseErrorMessage(error, '').toLowerCase();
  return (
    error?.code === EMAIL_RATE_LIMIT_CODE ||
    error?.status === 429 ||
    message.includes('email rate limit') ||
    message.includes('over_email_send_rate_limit') ||
    message.includes('rate limit exceeded')
  );
}

export function isInvalidRefreshTokenError(error) {
  const message = getSupabaseErrorMessage(error, '').toLowerCase();
  return (
    message.includes('invalid refresh token') ||
    message.includes('refresh token not found')
  );
}

export async function clearInvalidAuthSession() {
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch (_error) {
    try {
      await supabase.auth.signOut();
    } catch (_signOutError) {
      // Best-effort cleanup only.
    }
  }
}

function getConfiguredRedirectUrl(path) {
  if (path === AUTH_CALLBACK_PATH) {
    return process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL || '';
  }

  if (path === PASSWORD_RESET_PATH) {
    return process.env.EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL || '';
  }

  return '';
}

function getAuthRedirectUrl(path) {
  return getConfiguredRedirectUrl(path) || Linking.createURL(path);
}

function getUrlParams(url) {
  const params = {};
  const parsed = Linking.parse(url);

  Object.entries(parsed?.queryParams || {}).forEach(([key, value]) => {
    params[key] = value;
  });

  const hash = String(url || '').split('#')[1] || '';
  const hashParams = new URLSearchParams(hash.replace(/^\?/, ''));
  hashParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
}

export function isAuthRedirectUrl(url) {
  if (!url) {
    return false;
  }

  const rawUrl = String(url);
  return (
    rawUrl.includes(AUTH_CALLBACK_PATH) ||
    rawUrl.includes('access_token=') ||
    rawUrl.includes('token_hash=') ||
    rawUrl.includes('error_description=')
  );
}

export async function handleAuthRedirectUrl(url) {
  assertSupabaseConfigured();

  if (!isAuthRedirectUrl(url)) {
    return null;
  }

  const params = getUrlParams(url);

  if (params.error || params.error_description) {
    throw new Error(
      String(params.error_description || params.error || 'Authentication link failed.')
    );
  }

  if (params.access_token && params.refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token: String(params.access_token),
      refresh_token: String(params.refresh_token),
    });

    throwIfSupabaseError(error, 'Could not verify your email.');
    return data?.session || true;
  }

  if (params.token_hash && params.type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: String(params.token_hash),
      type: String(params.type),
    });

    throwIfSupabaseError(error, 'Could not verify your email.');
    return data?.session || true;
  }

  if (params.code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(
      String(params.code)
    );

    throwIfSupabaseError(error, 'Could not verify your email.');
    return data?.session || true;
  }

  return true;
}

export async function getCurrentSession() {
  assertSupabaseConfigured();

  const { data, error } = await supabase.auth.getSession();
  if (isInvalidRefreshTokenError(error)) {
    await clearInvalidAuthSession();
    return null;
  }

  throwIfSupabaseError(error, 'Could not load current session.');
  return data?.session || null;
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

export async function signIn(identifier, password) {
  assertSupabaseConfigured();

  const trimmedIdentifier = String(identifier || '').trim();
  let email = trimmedIdentifier.toLowerCase();

  if (!email.includes('@')) {
    const profile = await getProfileByUsername(normalizeUsername(email));
    email = profile?.email || '';
  }

  if (!email) {
    throw new Error('User account could not be found.');
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (isEmailNotVerifiedError(error)) {
      const emailNotVerifiedError = createEmailNotVerifiedError();
      emailNotVerifiedError.verificationEmail = email;
      throw emailNotVerifiedError;
    }

    throwIfSupabaseError(error, 'Login failed.');
  }

  if (!data?.user?.email_confirmed_at) {
    await supabase.auth.signOut();
    const emailNotVerifiedError = createEmailNotVerifiedError();
    emailNotVerifiedError.verificationEmail = data?.user?.email || email;
    throw emailNotVerifiedError;
  }

  const profile = await ensureUserProfile(data.user);

  return {
    session: data.session,
    user: profile,
  };
}

export async function signUp({
  firstName,
  lastName,
  email,
  username,
  password,
  preferredLanguage = 'en',
}) {
  assertSupabaseConfigured();

  const normalizedEmail = normalizeEmail(email);
  const normalizedUsername = normalizeUsername(username);

  if (!isValidEmailAddress(normalizedEmail)) {
    throw createCodedError('Please enter a valid email address.', 'invalid_email', 400);
  }

  if (!isStrongSignupPassword(password)) {
    throw createCodedError(
      'Password must be at least 8 characters and include one uppercase letter and one number.',
      'weak_password',
      400
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      emailRedirectTo: getAuthRedirectUrl(AUTH_CALLBACK_PATH),
      data: {
        first_name: String(firstName || '').trim(),
        last_name: String(lastName || '').trim(),
        username: normalizedUsername,
        preferred_language: preferredLanguage,
      },
    },
  });

  throwIfSupabaseError(error, 'Signup failed.');

  const emailIsVerified = Boolean(data?.user?.email_confirmed_at);
  let profile = {
    id: null,
    usr_id: null,
    auth_user_id: data?.user?.id,
    first_name: String(firstName || '').trim(),
    last_name: String(lastName || '').trim(),
    email: normalizedEmail,
    username: normalizedUsername,
    preferred_language: preferredLanguage,
    email_verified: emailIsVerified,
  };

  if (data?.session && emailIsVerified && data?.user) {
    profile = await ensureUserProfile(data.user, {
      firstName,
      lastName,
      email: normalizedEmail,
      username: normalizedUsername,
      preferredLanguage,
    });
  }

  if (data?.session && !emailIsVerified) {
    await supabase.auth.signOut();
  }

  return {
    session: emailIsVerified ? data?.session || null : null,
    user: profile,
    requiresEmailVerification: !emailIsVerified,
  };
}

export async function signOut() {
  assertSupabaseConfigured();

  const { error } = await supabase.auth.signOut();
  throwIfSupabaseError(error, 'Logout failed.');
}

export async function sendPasswordResetEmail(email) {
  assertSupabaseConfigured();

  const { error } = await supabase.auth.resetPasswordForEmail(
    normalizeEmail(email),
    {
      redirectTo: getAuthRedirectUrl('reset-password'),
    }
  );

  throwIfSupabaseError(error, 'Could not send password reset email.');
}

export async function resendVerificationEmail(email) {
  assertSupabaseConfigured();

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: normalizeEmail(email),
    options: {
      emailRedirectTo: getAuthRedirectUrl(AUTH_CALLBACK_PATH),
    },
  });

  throwIfSupabaseError(error, 'Could not send verification email.');
}
