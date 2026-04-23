import axios from 'axios';

import { ensureApiBaseUrl } from '../config/api';

export const api = axios.create({
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const nextConfig = { ...config };
  nextConfig.baseURL = ensureApiBaseUrl();
  return nextConfig;
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete api.defaults.headers.common.Authorization;
}

export async function extractApiErrorMessage(error, fallbackMessage) {
  const detail = error?.response?.data?.detail;

  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    return detail[0]?.msg || fallbackMessage;
  }

  if (error?.message) {
    return error.message;
  }

  return fallbackMessage;
}

