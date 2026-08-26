import type { APIRoute } from 'astro';
import { renderOfflineFallback } from '../offline-fallback';

export const GET: APIRoute = () =>
  new Response(renderOfflineFallback(), {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
