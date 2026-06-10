import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '',                        renderMode: RenderMode.Prerender },
  { path: 'rifa/:slug',              renderMode: RenderMode.Server },
  { path: 'auth/**',                 renderMode: RenderMode.Client },
  { path: 'dashboard/**',            renderMode: RenderMode.Client },
  { path: '**',                      renderMode: RenderMode.Client },
];
