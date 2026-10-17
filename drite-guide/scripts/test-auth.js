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
  console.log('PASS: auth lock release, duplicate login prevention, retry, rate-limit classification and error details');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
