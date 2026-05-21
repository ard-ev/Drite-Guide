import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function normalizeUsername(value: unknown) {
  return String(value || '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '')
    .slice(0, 32);
}

function normalizeEmail(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function normalizeName(value: unknown) {
  return String(value || '').trim().slice(0, 80);
}

function isStrongSignupPassword(password: string) {
  return password.length >= 8 && /[A-Z]/.test(password) && /\d/.test(password);
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function getClientIp(req: Request) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function getBearerToken(req: Request) {
  const authorization = req.headers.get('authorization') || '';
  const [, token] = authorization.match(/^Bearer\s+(.+)$/i) || [];
  return token || '';
}

function publicUser(profile: Record<string, unknown> | null) {
  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    first_name: profile.first_name,
    last_name: profile.last_name,
    email: profile.email,
    username: profile.username,
    profile_picture_path: profile.profile_picture_path,
    role: profile.role,
    preferred_language: profile.preferred_language,
    email_verified: profile.email_verified,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse(
      { error: 'Signup is not configured.', code: 'signup_not_configured' },
      500
    );
  }

  const requestKey = req.headers.get('apikey') || getBearerToken(req);

  if (requestKey !== SUPABASE_ANON_KEY) {
    return jsonResponse({ error: 'Unauthorized', code: 'unauthorized' }, 401);
  }

  const payload = await req.json().catch(() => null);
  const firstName = normalizeName(payload?.firstName);
  const lastName = normalizeName(payload?.lastName);
  const email = normalizeEmail(payload?.email);
  const username = normalizeUsername(payload?.username);
  const password = String(payload?.password || '');
  const preferredLanguage = String(payload?.preferredLanguage || 'en')
    .trim()
    .slice(0, 8) || 'en';

  if (!firstName || !lastName || !email || !username || !password) {
    return jsonResponse(
      { error: 'Please fill in all signup fields.', code: 'missing_signup_fields' },
      400
    );
  }

  if (!email.includes('@')) {
    return jsonResponse(
      { error: 'Please enter a valid email address.', code: 'invalid_email' },
      400
    );
  }

  if (username.length < 3) {
    return jsonResponse(
      { error: 'Username must be at least 3 characters.', code: 'invalid_username' },
      400
    );
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: passwordIsStrong, error: passwordPolicyError } = await admin
    .rpc('is_strong_signup_password', { password_value: password });

  if (passwordPolicyError) {
    return jsonResponse(
      {
        error: 'Could not validate password policy.',
        code: 'password_policy_check_failed',
      },
      500
    );
  }

  if (!passwordIsStrong || !isStrongSignupPassword(password)) {
    return jsonResponse(
      {
        error:
          'Password must be at least 8 characters and include one uppercase letter and one number.',
        code: 'weak_password',
      },
      400
    );
  }

  const [emailHash, ipHash] = await Promise.all([
    sha256(email),
    sha256(getClientIp(req)),
  ]);
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { count: recentAttempts, error: attemptsError } = await admin
    .from('signup_attempts')
    .select('*', { count: 'exact', head: true })
    .or(`email_hash.eq.${emailHash},ip_hash.eq.${ipHash}`)
    .gte('created_at', oneHourAgo);

  if (attemptsError) {
    return jsonResponse(
      { error: 'Could not validate signup rate limit.', code: 'signup_rate_limit_failed' },
      500
    );
  }

  if ((recentAttempts || 0) >= 5) {
    return jsonResponse(
      {
        error: 'Too many signup attempts. Please try again later.',
        code: 'signup_rate_limited',
      },
      429
    );
  }

  await admin.from('signup_attempts').insert({
    email_hash: emailHash,
    ip_hash: ipHash,
  });

  const { data: existingUsername, error: usernameError } = await admin
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (usernameError) {
    return jsonResponse(
      { error: 'Could not check username availability.', code: 'username_check_failed' },
      500
    );
  }

  if (existingUsername) {
    return jsonResponse(
      { error: 'Username is already taken.', code: 'username_taken' },
      409
    );
  }

  const { data: createdUser, error: createUserError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
      username,
      preferred_language: preferredLanguage,
    },
  });

  if (createUserError || !createdUser?.user) {
    const message = createUserError?.message || 'Could not create account.';
    const status = message.toLowerCase().includes('already') ? 409 : 400;
    return jsonResponse(
      { error: message, code: status === 409 ? 'email_taken' : 'signup_failed' },
      status
    );
  }

  const profilePayload = {
    id: createdUser.user.id,
    first_name: firstName,
    last_name: lastName,
    email,
    username,
    preferred_language: preferredLanguage,
    email_verified: true,
  };

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .upsert(profilePayload, { onConflict: 'id' })
    .select('*')
    .single();

  if (profileError) {
    await admin.auth.admin.deleteUser(createdUser.user.id);
    return jsonResponse(
      { error: 'Could not create profile.', code: 'profile_create_failed' },
      500
    );
  }

  const { data: sessionData, error: signInError } = await authClient.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !sessionData?.session) {
    return jsonResponse(
      {
        error: signInError?.message || 'Account was created, but login failed.',
        code: 'signup_login_failed',
      },
      500
    );
  }

  return jsonResponse({
    session: sessionData.session,
    profile: publicUser(profile),
    requiresEmailVerification: false,
  });
});
