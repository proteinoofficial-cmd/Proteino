const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://ais-pre-r7sluimpqgkvpybsu47oqz-783985883356.asia-southeast1.run.app';

export function getApiUrl(path: string): string {
  if (path.startsWith('/api/') || path.startsWith('/auth/')) {
    const isCustomDomain = window.location.hostname !== 'localhost' && !window.location.hostname.includes('run.app');
    if (isCustomDomain) {
      return `${BACKEND_URL}${path}`;
    }
  }
  return path;
}

export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input as Request).url);
  const targetUrl = getApiUrl(url);
  return fetch(targetUrl, init);
}
