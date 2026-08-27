import { FOOTER_LINKS, HEADER_LINKS, SITE_TITLE } from './consts';

// Keep the fallback self-contained: the site's hashed CSS may not be cached
// when the service worker serves this page. Both the HTML route and the
// worker's emergency response are generated from this one source.
export const renderOfflineFallback = () => `<!doctype html>
<html lang="en">
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

      .theme-toggle {
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

      .theme-toggle:hover {
        color: var(--text);
        background: color-mix(in srgb, var(--text) 8%, transparent);
      }

      .theme-toggle svg {
        width: 1.25rem;
        height: 1.25rem;
      }

      .sun-icon,
      .dark .moon-icon {
        display: none;
      }

      .dark .sun-icon {
        display: block;
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
    <script>
      (() => {
        try {
          const savedTheme = localStorage.getItem('theme');
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.classList.toggle(
            'dark',
            savedTheme === 'dark' || (savedTheme === null && prefersDark),
          );
        } catch {
          document.documentElement.classList.toggle(
            'dark',
            window.matchMedia('(prefers-color-scheme: dark)').matches,
          );
        }
      })();
    </script>
  </head>
  <body>
    <header>
      <a href="/" class="site-title">${SITE_TITLE}</a>
      <nav aria-label="Primary navigation">
        ${HEADER_LINKS.map((link) => `<a href="${link.href}">${link.label}</a>`).join('\n        ')}
        <button id="theme-toggle" class="theme-toggle" type="button" aria-label="Switch to dark mode">
          <svg class="moon-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"></path>
          </svg>
          <svg class="sun-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"></path>
          </svg>
        </button>
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
    <script>
      const toggle = document.querySelector('#theme-toggle');

      const updateLabel = () => {
        const isDark = document.documentElement.classList.contains('dark');
        toggle?.setAttribute('aria-label', 'Switch to ' + (isDark ? 'light' : 'dark') + ' mode');
      };

      toggle?.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        try {
          localStorage.setItem('theme', isDark ? 'dark' : 'light');
        } catch {
          // The selected theme still applies for this page when storage is unavailable.
        }
        updateLabel();
      });

      updateLabel();
    </script>
  </body>
</html>
`;
