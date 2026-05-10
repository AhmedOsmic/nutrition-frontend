type RuntimeAppConfig = {
  apiUrl?: string;
};

declare global {
  interface Window {
    __APP_CONFIG__?: RuntimeAppConfig;
  }
}

const localApiUrl = 'http://localhost:8080';

function normalizeApiUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

export const API_BASE_URL =
  typeof window !== 'undefined' && window.__APP_CONFIG__?.apiUrl
    ? normalizeApiUrl(window.__APP_CONFIG__.apiUrl)
    : localApiUrl;
