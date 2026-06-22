import axios from 'axios';
import { resolveApiBaseUrl } from '@/lib/constants';

let apiBaseUrl = resolveApiBaseUrl();

export function setApiBaseUrl(url: string) {
  apiBaseUrl = url.replace(/\/$/, '');
  apiClient.defaults.baseURL = apiBaseUrl;
}

export function getApiBaseUrl() {
  return apiBaseUrl;
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 60_000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      error.message ||
      'Request failed';
    return Promise.reject(new Error(message));
  },
);