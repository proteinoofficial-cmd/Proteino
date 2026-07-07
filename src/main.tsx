import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Global fetch interceptor to support custom domains / Vercel hosting
try {
  const isCustomDomain = window.location.hostname !== 'localhost' && !window.location.hostname.includes('run.app');
  if (isCustomDomain) {
    const originalFetch = window.fetch;
    Object.defineProperty(window, 'fetch', {
      configurable: true,
      writable: true,
      value: function (input: RequestInfo | URL, init?: RequestInit) {
        let url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input as Request).url);

        if (url.startsWith('/api/') || url.startsWith('/auth/')) {
          // Point directly to the Cloud Run server backend
          const backendUrl = 'https://ais-pre-r7sluimpqgkvpybsu47oqz-783985883356.asia-southeast1.run.app';
          url = `${backendUrl}${url}`;
        }

        return originalFetch(url, init);
      }
    });
  }
} catch (e) {
  console.warn('Unable to override window.fetch directly:', e);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
