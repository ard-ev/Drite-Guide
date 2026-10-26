const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.dirname(require.resolve('../package.json'));
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const auth = read('src/services/authService.js');
const helpers = read('src/services/supabaseService.js');
const contextSource = read('src/context/AuthContext.js');
const loginSource = read('src/screens/LoginScreen.js');
const signupSource = read('src/screens/SignupScreen.js');

function loadFunction(context, source, name) {
  const match = source.match(new RegExp(`export function ${name}\\([^]*?\\n\\}`));
  assert.ok(match, `Missing function ${name}`);
  vm.runInContext(match[0].replace('export ', ''), context);
}

async function main() {
  const context = vm.createContext({
    EMAIL_RATE_LIMIT_CODE: 'email_rate_limit_exceeded',
    EMAIL_NOT_VERIFIED_CODE: 'email_not_verified',
  });
  loadFunction(context, helpers, 'getSupabaseErrorMessage');
  loadFunction(context, helpers, 'throwIfSupabaseError');
  loadFunction(context, auth, 'isEmailRateLimitError');
  loadFunction(context, auth, 'isAuthRateLimitError');
  loadFunction(context, auth, 'isEmailNotVerifiedError');

  for (const error of [
    { status: 429, code: 'over_request_rate_limit', message: 'Request rate limit exceeded' },
    { status: 429, message: 'For security purposes, try again later' },
  ]) {
    assert.equal(context.isEmailRateLimitError(error), false);
    assert.equal(context.isAuthRateLimitError(error), true);
  }
  assert.equal(context.isEmailRateLimitError({ code: 'over_email_send_rate_limit' }), true);
  assert.equal(context.isAuthRateLimitError({ status: 400, code: 'invalid_credentials' }), false);
  assert.equal(context.isEmailNotVerifiedError({ code: 'email_not_confirmed' }), true);
  assert.throws(
    () => context.throwIfSupabaseError({ message: 'limited', code: 'over_request_rate_limit', status: 429 }),
    (error) => error.code === 'over_request_rate_limit' && error.status === 429
  );

  // Simulate the SDK holding its session lock until the event callback returns.
  let locked = true;
  let synced = false;
  Object.assign(context, {
    setTimeout,
    clearTimeout,
    onAuthStateChange: (callback) => {
      assert.equal(callback('SIGNED_IN', { user: { id: 'test' } }), undefined);
      return { data: {} };
    },
    syncAuthSession: async () => {
      assert.equal(locked, false, 'Profile queries must run after the auth lock is released');
      synced = true;
    },
    logWarning: (message, error) => { throw new Error(`${message} ${error}`); },
  });
  const listener = contextSource.match(/onAuthStateChange\(\(_event, session\) => \{[^]*?\n    \}\);/);
  assert.ok(listener);
  vm.runInContext(`let pendingAuthSync; ${listener[0]}`, context);
  locked = false;
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(synced, true);

  // Rapid taps must produce one login request, then allow retry after failure.
  let requests = 0;
  let finishLogin;
  Object.assign(context, {
    loginInFlight: { current: false }, isBootstrapping: false,
    setIsSubmitting: () => {}, identifier: 'test@example.com', password: 'test',
    login: () => { requests++; return new Promise((resolve) => { finishLogin = resolve; }); },
    setPendingVerificationEmail: () => {}, Alert: { alert: () => {} }, t: (key) => key,
  });
  const handler = loginSource.match(/const handleLogin = async \(\) => \{[^]*?\n    \};/);
  assert.ok(handler);
  vm.runInContext(`${handler[0]} globalThis.runLogin = handleLogin;`, context);
  const first = context.runLogin();
  await context.runLogin();
  assert.equal(requests, 1);
  finishLogin({ success: false, message: 'limited' });
  await first;
  assert.equal(context.loginInFlight.current, false);
  const retry = context.runLogin();
  assert.equal(requests, 2);
  finishLogin({ success: false });
  await retry;

  // Mail failures must retain the provider's reason, code and HTTP status.
  Object.assign(context, {
    assertSupabaseConfigured: () => {},
    normalizeEmail: (email) => String(email || '').trim().toLowerCase(),
    isValidEmailAddress: () => true,
    PASSWORD_RESET_REDIRECT_URL: 'https://driteguide.com/reset-password',
    supabase: { auth: { resetPasswordForEmail: async () => ({
      error: { message: 'Email address not authorized', code: 'email_address_not_authorized', status: 403 },
    }) } },
  });
  const resetService = auth.match(/export async function sendPasswordResetEmail\([^]*?\n\}/);
  vm.runInContext(resetService[0].replace('export ', ''), context);
  await assert.rejects(() => context.sendPasswordResetEmail('test@example.com'),
    (error) => error.message === 'Email address not authorized' &&
      error.code === 'email_address_not_authorized' && error.status === 403);

  let resetRequests = 0;
  let finishReset;
  Object.assign(context, {
    passwordResetInFlight: { current: false },
    requestPasswordReset: () => {
      resetRequests++;
      return new Promise((resolve) => { finishReset = resolve; });
    },
  });
  const resetHandler = loginSource.match(/const sendPasswordReset = async \(email\) => \{[^]*?\n    \};/);
  vm.runInContext(`${resetHandler[0]} globalThis.runReset = sendPasswordReset;`, context);
  const reset = context.runReset('test@example.com');
  await context.runReset('test@example.com');
  assert.equal(resetRequests, 1);
  finishReset({ success: false, message: 'failed' });
  await reset;
  assert.equal(context.passwordResetInFlight.current, false);

  // Rapid signup taps must send one request and allow a retry after failure.
  let signupRequests = 0;
  let finishSignup;
  Object.assign(context, {
    signupInFlight: { current: false }, isSubmitting: false,
    firstName: 'Test', lastName: 'User', email: 'test@example.com', username: 'test_user',
    password: 'Test-password-123!', confirmPassword: 'Test-password-123!',
    emailCooldownUntil: 0, normalizeUsername: (value) => value,
    usernameStatus: 'available', isStrongSignupPassword: () => true,
    signup: () => {
      signupRequests++;
      return new Promise((resolve) => { finishSignup = resolve; });
    },
  });
  const signupHandler = signupSource.match(/const handleSignUp = async \(\) => \{[^]*?\n    \};/);
  vm.runInContext(`${signupHandler[0]} globalThis.runSignup = handleSignUp;`, context);
  const signupAttempt = context.runSignup();
  await context.runSignup();
  assert.equal(signupRequests, 1);
  finishSignup({ success: false, message: 'temporary failure' });
  await signupAttempt;
  assert.equal(context.signupInFlight.current, false);
  const signupRetry = context.runSignup();
  assert.equal(signupRequests, 2);
  finishSignup({ success: false, message: 'temporary failure' });
  await signupRetry;
  console.log('PASS: duplicate signup prevention and retry');

  // A successful lookup with no matching username must not call the private RPC.
  Object.assign(context, {
    supabase: {
      functions: { invoke: async () => ({ data: { email: null }, error: null }) },
      rpc: () => { throw new Error('Must not call the private login lookup RPC'); },
    },
  });
  const resolveLogin = auth.match(/async function resolveLoginEmail\([^]*?\n\}/);
  vm.runInContext(resolveLogin[0], context);
  assert.equal(await context.resolveLoginEmail('unknown_username'), '');
  context.supabase.functions.invoke = async () => ({ data: { email: 'User@Example.com' }, error: null });
  assert.equal(await context.resolveLoginEmail('existing_username'), 'user@example.com');
  console.log('PASS: username lookup handles missing and existing accounts without private RPC');

  // A temporary profile outage must not discard a valid persisted session.
  let appliedSession;
  const session = { user: { id: 'existing-user' } };
  Object.assign(context, {
    safeGetItem: async () => 'en', LANGUAGE_KEY: 'language',
    applyLanguage: async () => {}, loadLanguages: async () => {},
    isSupabaseConfigured: true,
    syncSessionFromAuthRedirect: async () => {}, Linking: { getInitialURL: async () => null },
    getCurrentSession: async () => session,
    ensureUserProfile: async () => { throw new Error('temporary database failure'); },
    createFallbackProfileFromAuthUser: (user) => ({ id: user.id }),
    applySessionState: async (value, profile) => { appliedSession = { value, profile }; },
    logWarning: () => {}, setIsBootstrapping: () => {},
    clearSessionState: () => { throw new Error('Valid session must be preserved'); },
  });
  const bootstrap = contextSource.match(/const bootstrapAuth = async \(\) => \{[^]*?\n  \};/);
  vm.runInContext(`${bootstrap[0]} globalThis.runBootstrap = bootstrapAuth;`, context);
  await context.runBootstrap();
  assert.equal(appliedSession.value, session);
  assert.equal(appliedSession.profile.id, session.user.id);
  console.log('PASS: reset provider errors, duplicate reset prevention and persisted session profile fallback');
  console.log('PASS: auth lock release, duplicate login prevention, retry, rate-limit classification and error details');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
