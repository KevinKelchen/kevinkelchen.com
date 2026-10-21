import { FOOTER_LINKS, HEADER_LINKS, SITE_TITLE } from './consts';
import { THEME_INIT_SCRIPT } from './lib/theme-init';
import { CHECK_ICON, DEFAULT_THEME, THEME_OPTIONS } from './lib/theme-options';

// Keep the fallback self-contained: the site's hashed CSS may not be cached
// when the service worker serves this page. Both the HTML route and the
// worker's emergency response are generated from this one source.
export const renderOfflineFallback = () => `<!doctype html>
<html lang="en" data-theme="${DEFAULT_THEME}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>Offline · ${SITE_TITLE}</title>
    <meta name="robots" content="noindex" />
    <style>
      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      html {
        color-scheme: light;
        --background: #ffffff;
        --border: oklch(0.928 0.006 264.531);
        --muted: oklch(0.446 0.03 256.802);
        --secondary-text: oklch(0.373 0.034 259.733);
        --text: oklch(0.21 0.034 264.665);
        background: var(--background);
      }

      html.dark {
        color-scheme: dark;
        --background: #030712;
        --border: #1f2937;
        --muted: #9ca3af;
        --secondary-text: #d1d5db;
        --text: #f3f4f6;
      }

      body {
        min-height: 100vh;
        margin: 0 auto;
        padding: 0 1.5rem;
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: 42rem;
        color: var(--text);
        background: var(--background);
        font-family:
          -apple-system, "system-ui", "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial,
          sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
        font-size: 16px;
        line-height: 24px;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      main {
        flex: 1;
        padding-bottom: 4rem;
      }

      a {
        color: inherit;
        text-decoration: none;
        cursor: pointer;
      }

      a:hover {
        text-decoration: underline;
      }

      button {
        color: inherit;
        font: inherit;
        cursor: pointer;
      }

      button:focus-visible {
        outline: 2px solid var(--text);
        outline-offset: 2px;
      }

      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.5rem 0;
      }

      .site-title {
        display: inline-flex;
        min-height: 44px;
        align-items: center;
        font-weight: 600;
        letter-spacing: -0.025em;
      }

      header nav,
      footer nav {
        display: flex;
        gap: 0.5rem;
      }

      header nav {
        align-items: center;
        font-size: 0.875rem;
        line-height: 1.25rem;
        color: var(--muted);
      }

      header nav a,
      footer nav a {
        display: inline-flex;
        min-height: 44px;
        align-items: center;
      }

      header nav a {
        min-width: 44px;
        justify-content: center;
      }

      footer nav a {
        position: relative;
      }

      footer nav a::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        width: 44px;
        height: 44px;
        transform: translate(-50%, -50%);
      }

      header nav a:hover,
      footer nav a:hover {
        color: var(--text);
      }

      .theme-control {
        position: relative;
      }

      .theme-menu-button {
        flex: none;
        width: 44px;
        height: 44px;
        padding: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 0;
        border-radius: 0.375rem;
        background: transparent;
      }

      .theme-menu-button:hover {
        color: var(--text);
        background: color-mix(in srgb, var(--text) 8%, transparent);
      }

      .theme-menu-button svg {
        width: 1.25rem;
        height: 1.25rem;
      }

      [data-theme-icon] {
        display: none;
      }

      html[data-theme="system"] [data-theme-icon="system"],
      html[data-theme="light"] [data-theme-icon="light"],
      html[data-theme="dark"] [data-theme-icon="dark"] {
        display: block;
      }

      .theme-menu {
        position: absolute;
        top: 100%;
        right: 0;
        z-index: 10;
        margin-top: 0.5rem;
        min-width: 9rem;
        overflow: hidden;
        border: 1px solid var(--border);
        border-radius: 0.375rem;
        background: var(--background);
        padding: 0.25rem 0;
        font-size: 0.875rem;
        box-shadow:
          0 4px 6px -1px rgb(0 0 0 / 0.1),
          0 2px 4px -2px rgb(0 0 0 / 0.1);
      }

      .theme-menu-item {
        display: flex;
        width: 100%;
        align-items: center;
        gap: 0.5rem;
        border: 0;
        background: transparent;
        min-height: 44px;
        padding: 0 0.75rem;
        text-align: left;
        color: var(--secondary-text);
      }

      .theme-menu-item:hover,
      .theme-menu-item:focus-visible {
        color: var(--text);
        background: color-mix(in srgb, var(--text) 8%, transparent);
      }

      .theme-menu-item:focus-visible {
        outline-offset: -2px;
      }

      .theme-menu-item svg {
        width: 1rem;
        height: 1rem;
        flex: none;
      }

      .theme-menu-item svg[data-theme-check] {
        margin-left: auto;
      }

      .theme-menu-item svg[data-theme-check][hidden] {
        display: none;
      }

      .offline-message {
        padding: 2rem 0;
      }

      h1 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 700;
        line-height: 2rem;
        letter-spacing: -0.025em;
      }

      p {
        margin: 1rem 0 0;
        color: var(--secondary-text);
      }

      footer {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
        padding: 2rem 0;
        border-top: 1px solid var(--border);
        color: var(--muted);
        font-size: 0.875rem;
        line-height: 1.25rem;
      }

      footer p {
        margin: 0;
        color: inherit;
      }

      @media (min-width: 640px) {
        header nav,
        footer nav {
          gap: 1.25rem;
        }
      }
    </style>
    <script>${THEME_INIT_SCRIPT}</script>
    <script src="/theme-menu.js" defer></script>
  </head>
  <body>
    <header>
      <a href="/" class="site-title">${SITE_TITLE}</a>
      <nav aria-label="Primary navigation">
        ${HEADER_LINKS.map((link) => `<a href="${link.href}">${link.label}</a>`).join('\n        ')}
        <div class="theme-control">
          <button
            id="theme-menu-button"
            class="theme-menu-button"
            type="button"
            aria-haspopup="menu"
            aria-expanded="false"
            aria-controls="theme-menu"
            aria-label="Theme: System"
          >
            ${THEME_OPTIONS.map((option) => `<svg data-theme-icon="${option.value}" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${option.icon}</svg>`).join('\n            ')}
          </button>
          <div id="theme-menu" class="theme-menu" role="menu" aria-label="Theme" hidden>
            ${THEME_OPTIONS.map(
              (option) =>
                `<button type="button" role="menuitemradio" data-theme-option="${option.value}" aria-checked="${option.value === DEFAULT_THEME}" class="theme-menu-item">
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${option.icon}</svg>
              <span>${option.label}</span>
              <svg data-theme-check${option.value === DEFAULT_THEME ? '' : ' hidden'} aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${CHECK_ICON}</svg>
            </button>`,
            ).join('\n            ')}
          </div>
        </div>
      </nav>
    </header>
    <main data-offline-fallback>
      <section class="offline-message">
        <h1>You're offline</h1>
        <p>
          This page has not been saved for offline reading yet. Reconnect and visit it once, then it
          should be available the next time you lose connection.
        </p>
      </section>
    </main>
    <footer>
      <nav>
        ${FOOTER_LINKS.map(
          (link) =>
            `<a href="${link.href}" target="_blank" rel="noopener noreferrer">${link.label}</a>`,
        ).join('\n        ')}
      </nav>
      <p>© ${new Date().getFullYear()} ${SITE_TITLE}</p>
    </footer>
  </body>
</html>
`;
