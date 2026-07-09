const BACKEND_URL = import.meta.env.VITE_API_URL || '';

export function getApiUrl(path: string): string {
  if (path.startsWith('/api/') || path.startsWith('/auth/')) {
    // If VITE_API_URL is explicitly set, use it.
    if (BACKEND_URL) {
      return `${BACKEND_URL}${path}`;
    }
    
    // Use the current origin dynamically so that it works across dev, pre, custom domains, and local environments.
    return `${window.location.origin}${path}`;
  }
  return path;
}

export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input as Request).url);
  const targetUrl = getApiUrl(url);
  return fetch(targetUrl, init);
}
