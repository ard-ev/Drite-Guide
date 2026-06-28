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

function normalizeEmail(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function normalizeUsername(value: unknown) {
  return String(value || '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9._]+/g, '')
    .slice(0, 30);
}

function getBearerToken(req: Request) {
  const authorization = req.headers.get('authorization') || '';
  const [, token] = authorization.match(/^Bearer\s+(.+)$/i) || [];
  return token || '';
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
      { error: 'Login lookup is not configured.', code: 'login_lookup_not_configured' },
      500
    );
  }

  const requestKey = req.headers.get('apikey') || getBearerToken(req);

  if (requestKey !== SUPABASE_ANON_KEY) {
    return jsonResponse({ error: 'Unauthorized', code: 'unauthorized' }, 401);
  }

  const payload = await req.json().catch(() => null);
  const identifier = normalizeEmail(payload?.identifier);
  const username = normalizeUsername(identifier);

  if (!identifier) {
    return jsonResponse({ email: null, code: 'missing_identifier' }, 400);
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const query = admin
    .from('user_profile')
    .select('email')
    .limit(1);

  const { data, error } = identifier.includes('@')
    ? await query.eq('email', identifier).maybeSingle()
    : await query.eq('normalized_username', username).maybeSingle();

  if (error) {
    return jsonResponse(
      { error: 'Could not resolve login.', code: 'login_lookup_failed' },
      500
    );
  }

  return jsonResponse({
    email: normalizeEmail(data?.email) || null,
  });
});
