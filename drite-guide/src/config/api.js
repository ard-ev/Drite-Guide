import Constants from 'expo-constants';

const PRODUCTION_API_BASE_URL = 'https://drite-guide-api-production.up.railway.app/api/v1';

const configuredBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl || PRODUCTION_API_BASE_URL;

function normalizeApiBaseUrl(url) {
  if (!url || typeof url !== 'string') {
    return PRODUCTION_API_BASE_URL;
  }

  const trimmedUrl = url.trim().replace(/\/$/, '');

  if (trimmedUrl.endsWith('/api/v1')) {
    return trimmedUrl;
  }

  return `${trimmedUrl}/api/v1`;
}

export const API_BASE_URL = normalizeApiBaseUrl(configuredBaseUrl);

export function ensureApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error(
      `Set expo.extra.apiBaseUrl in app.json, for example ${PRODUCTION_API_BASE_URL}`
    );
  }

  return API_BASE_URL;
}

export function toAbsoluteAssetUrl(path) {
  if (!path) {
    return null;
  }

  if (typeof path !== 'string') {
    return path;
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const baseUrl = ensureApiBaseUrl().replace(/\/api\/v1$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
