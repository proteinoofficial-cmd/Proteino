const BACKEND_URL = import.meta.env.VITE_API_URL || '';

export function getApiUrl(path: string): string {
  if (path.startsWith('/api/') || path.startsWith('/auth/')) {
    // If VITE_API_URL is explicitly set, use it.
    if (BACKEND_URL) {
      return `${BACKEND_URL}${path}`;
    }
    
    // If we're on a custom domain or localhost, and VITE_API_URL is not set, 
    // it means the frontend and backend are hosted together (e.g., on Render).
    // In this case, use relative paths so they hit the same domain.
    const isGoogleCloudRun = window.location.hostname.includes('run.app');
    if (isGoogleCloudRun) {
      // Use the current environment's origin dynamically (dev vs pre) instead of a hardcoded pre domain.
      // This prevents "Failed to fetch" (CORS/discrepancy) errors in development and testing.
      return `${window.location.origin}${path}`;
    }
  }
  return path;
}

export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input as Request).url);
  const targetUrl = getApiUrl(url);
  return fetch(targetUrl, init);
}
