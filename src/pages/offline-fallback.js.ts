import type { APIRoute } from 'astro';
import { renderOfflineFallback } from '../offline-fallback';

// This module becomes part of the installed service worker, so it remains
// available even if the runtime Cache Storage entry for /offline.html is lost.
export const GET: APIRoute = () =>
  new Response(
    `export const OFFLINE_FALLBACK_HTML = ${JSON.stringify(renderOfflineFallback())};\n`,
    {
      headers: { 'Content-Type': 'text/javascript; charset=utf-8' },
    },
  );
