import Constants from 'expo-constants';

const configuredBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl;

export const API_BASE_URL =
  configuredBaseUrl && configuredBaseUrl !== 'http://YOUR_LOCAL_IP:8000/api/v1'
    ? configuredBaseUrl
    : null;

export function ensureApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error(
      'Set expo.extra.apiBaseUrl in app.json to your computer IP, for example http://192.168.1.50:8000/api/v1'
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

