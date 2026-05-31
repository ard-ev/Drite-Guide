import * as Linking from 'expo-linking';

import { assertSupabaseConfigured, supabase } from '../lib/supabase';
import {
  ensureUserProfile,
  getProfileByUsername,
  isUsernameAvailable,
} from './profileService';
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
const DEFAULT_AUTH_REDIRECT_URL = 'https://driteguide.com';

const EMAIL_NOT_VERIFIED_CODE = 'email_not_verified';
const EMAIL_RATE_LIMIT_CODE = 'email_rate_limit_exceeded';
const SIGNUP_VERIFICATION_PENDING_CODE = 'signup_verification_pending';

function createEmailNotVerifiedError() {
  const error = new Error('Please verify your email before logging in.');
  error.code = EMAIL_NOT_VERIFIED_CODE;
  return error;
}

function createCodedError(message, code, status = null) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function isDuplicateEmailError(error) {
  const message = getSupabaseErrorMessage(error, '').toLowerCase();
  return (
    error?.code === 'email_exists' ||
    message.includes('already registered') ||
    message.includes('already been registered') ||
    message.includes('user already registered') ||
    message.includes('email already')
  );
}

function isDuplicateUsernameError(error) {
  const message = getSupabaseErrorMessage(error, '').toLowerCase();
  return (
    message.includes('username already taken') ||
    (
      message.includes('duplicate key') &&
      message.includes('user_profile') &&
      message.includes('username')
    )
  );
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
    return process.env.EXPO_PUBLIC_AUTH_REDIRECT_URL || DEFAULT_AUTH_REDIRECT_URL;
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
    rawUrl.includes('error_description=') ||
    rawUrl.includes('code=')
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
  const cleanPassword = String(password || '');

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
    password: cleanPassword,
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

  let profile = null;

  try {
    profile = await ensureUserProfile(data.user);
  } catch (profileError) {
    console.log('SUPABASE PROFILE LOAD ERROR:', profileError);
    profile = {
      id: data.user.id,
      email: data.user.email || email,
      username: normalizeUsername(data.user.user_metadata?.username || email.split('@')[0]),
      first_name: data.user.user_metadata?.first_name || '',
      last_name: data.user.user_metadata?.last_name || '',
      preferred_language: data.user.user_metadata?.preferred_language || 'en',
      email_verified: Boolean(data.user.email_confirmed_at),
    };
  }

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

  const cleanFirstName = String(firstName || '').trim();
  const cleanLastName = String(lastName || '').trim();
  const cleanEmail = normalizeEmail(email);
  const cleanUsername = normalizeUsername(username);
  const cleanPassword = String(password || '');
  const cleanPreferredLanguage = String(preferredLanguage || 'en').trim() || 'en';

  if (!cleanFirstName) {
    throw createCodedError('First name is required.', 'missing_first_name', 400);
  }

  if (!cleanLastName) {
    throw createCodedError('Last name is required.', 'missing_last_name', 400);
  }

  if (!isValidEmailAddress(cleanEmail)) {
    throw createCodedError('Please enter a valid email address.', 'invalid_email', 400);
  }

  if (!/^[a-z0-9_.]{3,30}$/.test(cleanUsername)) {
    throw createCodedError(
      'Username must be 3 to 30 characters and may only contain letters, numbers, underscore and dot.',
      'invalid_username',
      400
    );
  }

  if (!isStrongSignupPassword(cleanPassword)) {
    throw createCodedError(
      'Password must be at least 8 characters and include one uppercase letter, one lowercase letter and one number.',
      'weak_password',
      400
    );
  }

  const usernameAvailable = await isUsernameAvailable(cleanUsername);

  if (!usernameAvailable) {
    throw createCodedError('Username already taken', 'username_taken', 409);
  }

  const signupPayload = {
    email: cleanEmail,
    password: cleanPassword,
    options: {
      emailRedirectTo: getAuthRedirectUrl(AUTH_CALLBACK_PATH),
      data: {
        first_name: cleanFirstName,
        last_name: cleanLastName,
        username: cleanUsername,
        preferred_language: cleanPreferredLanguage,
      },
    },
  };

  console.log('SUPABASE SIGNUP PAYLOAD:', {
    email: signupPayload.email,
    options: signupPayload.options,
  });

  const { data, error } = await supabase.auth.signUp(signupPayload);

  if (error) {
    console.log('SUPABASE SIGNUP ERROR:', {
      message: error?.message,
      name: error?.name,
      status: error?.status,
      code: error?.code,
      details: error?.details,
    });

    if (isDuplicateUsernameError(error)) {
      throw createCodedError('Username already taken', 'username_taken', 409);
    }

    if (isDuplicateEmailError(error)) {
      throw createCodedError('Email already exists.', 'email_taken', 409);
    }

    throwIfSupabaseError(error, 'Signup failed.');
  }

  const user = data?.user || null;
  const session = data?.session || null;

  if (!user?.id) {
    throw createCodedError(
      'This email may already have a pending account. Please check your inbox or resend the verification email from the login screen.',
      SIGNUP_VERIFICATION_PENDING_CODE,
      409
    );
  }

  if (user && Array.isArray(user.identities) && user.identities.length === 0) {
    throw createCodedError(
      'This email is already registered. Please log in or resend the verification email.',
      SIGNUP_VERIFICATION_PENDING_CODE,
      409
    );
  }

  const emailIsVerified = Boolean(user?.email_confirmed_at);

  const fallbackProfile = {
    id: user?.id || null,
    first_name: cleanFirstName,
    last_name: cleanLastName,
    email: cleanEmail,
    username: cleanUsername,
    preferred_language: cleanPreferredLanguage,
    email_verified: emailIsVerified,
  };

  let profile = fallbackProfile;

  if (session && emailIsVerified && user) {
    profile = await ensureUserProfile(user, {
      firstName: cleanFirstName,
      lastName: cleanLastName,
      email: cleanEmail,
      username: cleanUsername,
      preferredLanguage: cleanPreferredLanguage,
    });
  }

  if (session && !emailIsVerified) {
    await supabase.auth.signOut();
  }

  return {
    session: emailIsVerified ? session : null,
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
      redirectTo: getAuthRedirectUrl(PASSWORD_RESET_PATH),
    }
  );

  throwIfSupabaseError(error, 'Could not send password reset email.');
}

export async function resendVerificationEmail(email) {
  assertSupabaseConfigured();

  const cleanEmail = normalizeEmail(email);

  if (!isValidEmailAddress(cleanEmail)) {
    throw createCodedError('Please enter a valid email address.', 'invalid_email', 400);
  }

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: cleanEmail,
    options: {
      emailRedirectTo: getAuthRedirectUrl(AUTH_CALLBACK_PATH),
    },
  });

  throwIfSupabaseError(error, 'Could not send verification email.');
}
