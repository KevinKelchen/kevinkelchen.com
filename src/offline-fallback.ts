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
        background: #ffffff;
      }

      body {
        min-height: 100vh;
        margin: 0 auto;
        padding: 0 1.5rem;
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: 42rem;
        color: oklch(0.21 0.034 264.665);
        background: #ffffff;
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
        gap: 1.25rem;
      }

      header nav {
        font-size: 0.875rem;
        line-height: 1.25rem;
        color: oklch(0.446 0.03 256.802);
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
        color: oklch(0.21 0.034 264.665);
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
        color: oklch(0.373 0.034 259.733);
      }

      footer {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
        padding: 2rem 0;
        border-top: 1px solid oklch(0.928 0.006 264.531);
        color: oklch(0.446 0.03 256.802);
        font-size: 0.875rem;
        line-height: 1.25rem;
      }

      footer p {
        margin: 0;
        color: inherit;
      }
    </style>
  </head>
  <body>
    <header>
      <a href="/" class="site-title">${SITE_TITLE}</a>
      <nav>
        ${HEADER_LINKS.map((link) => `<a href="${link.href}">${link.label}</a>`).join('\n        ')}
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
