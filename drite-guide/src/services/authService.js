import * as Linking from 'expo-linking';

import { assertSupabaseConfigured, supabase } from '../lib/supabase';
import { ensureUserProfile, getProfileByUsername } from './profileService';
import {
  getSupabaseErrorMessage,
  isStrongSignupPassword,
  normalizeUsername,
  throwIfSupabaseError,
} from './supabaseService';

const AUTH_CALLBACK_PATH = 'auth/callback';
const PASSWORD_RESET_PATH = 'reset-password';
const SIGNUP_FUNCTION_NAME = 'signup-with-profile';
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

function isSignupFunctionMissingError(error) {
  const message = getSupabaseErrorMessage(error, '').toLowerCase();
  return error?.status === 404 || message.includes('function not found');
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

async function getFunctionErrorPayload(error) {
  if (!error?.context?.json) {
    return null;
  }

  try {
    return await error.context.json();
  } catch (_parseError) {
    return null;
  }
}

async function signUpWithSupabaseFunction(payload) {
  const { data, error } = await supabase.functions.invoke(SIGNUP_FUNCTION_NAME, {
    body: payload,
  });

  if (error) {
    const errorPayload = await getFunctionErrorPayload(error);
    const message =
      errorPayload?.message ||
      errorPayload?.error ||
      getSupabaseErrorMessage(error, 'Signup failed.');
    throw createCodedError(message, errorPayload?.code || error.code, error.status);
  }

  if (data?.error) {
    throw createCodedError(data.message || data.error, data.code, data.status);
  }

  if (!data?.session?.access_token || !data?.session?.refresh_token) {
    throw new Error('Signup did not return a valid session.');
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  throwIfSupabaseError(sessionError, 'Could not start your session.');

  return {
    session: sessionData?.session || data.session,
    user: data.profile || data.user || null,
    requiresEmailVerification: false,
  };
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

  return true;
}

export async function getCurrentSession() {
  assertSupabaseConfigured();

  const { data, error } = await supabase.auth.getSession();
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
      throw createEmailNotVerifiedError();
    }

    throwIfSupabaseError(error, 'Login failed.');
  }

  if (!data?.user?.email_confirmed_at) {
    await supabase.auth.signOut();
    throw createEmailNotVerifiedError();
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

  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedUsername = normalizeUsername(username);

  if (!isStrongSignupPassword(password)) {
    throw createCodedError(
      'Password must be at least 8 characters and include one uppercase letter and one number.',
      'weak_password',
      400
    );
  }

  const signupPayload = {
    firstName: String(firstName || '').trim(),
    lastName: String(lastName || '').trim(),
    email: normalizedEmail,
    username: normalizedUsername,
    password,
    preferredLanguage,
  };

  try {
    return await signUpWithSupabaseFunction(signupPayload);
  } catch (edgeFunctionError) {
    if (!isSignupFunctionMissingError(edgeFunctionError)) {
      throw edgeFunctionError;
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      emailRedirectTo: getAuthRedirectUrl('auth/callback'),
      data: {
        first_name: String(firstName || '').trim(),
        last_name: String(lastName || '').trim(),
        username: normalizedUsername,
        preferred_language: preferredLanguage,
      },
    },
  });

  throwIfSupabaseError(error, 'Signup failed.');

  let profile = null;

  try {
    profile = data?.user
      ? await ensureUserProfile(data.user, {
          firstName,
          lastName,
          email: normalizedEmail,
          username: normalizedUsername,
          preferredLanguage,
        })
      : null;
  } catch (_profileError) {
    profile = {
      id: null,
      auth_user_id: data?.user?.id,
      first_name: String(firstName || '').trim(),
      last_name: String(lastName || '').trim(),
      email: normalizedEmail,
      username: normalizedUsername,
      email_verified: false,
    };
  }

  const emailIsVerified = Boolean(data?.user?.email_confirmed_at);

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
    String(email || '').trim().toLowerCase(),
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
    email: String(email || '').trim().toLowerCase(),
    options: {
      emailRedirectTo: getAuthRedirectUrl(AUTH_CALLBACK_PATH),
    },
  });

  throwIfSupabaseError(error, 'Could not send verification email.');
}
