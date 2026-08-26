import { SITE_TITLE, SOCIALS } from './consts';

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
      :root {
        color-scheme: light;
        font-family:
          ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.5;
        color: #111827;
        background: #ffffff;
      }

      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      body {
        min-height: 100vh;
        margin: 0;
        padding: 0 1.5rem;
        display: flex;
        flex-direction: column;
        width: 100%;
        max-width: 42rem;
        margin-inline: auto;
      }

      main {
        flex: 1;
        padding-bottom: 4rem;
      }

      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1.5rem 0;
      }

      header nav,
      footer nav {
        display: flex;
        gap: 1.25rem;
      }

      header nav {
        font-size: 0.875rem;
        color: #4b5563;
      }

      .site-title {
        font-weight: 600;
        letter-spacing: -0.025em;
        text-decoration: none;
      }

      .offline-message {
        padding: 2rem 0;
      }

      h1 {
        margin: 0;
        font-size: 1.5rem;
        line-height: 1.2;
        letter-spacing: 0;
      }

      p {
        margin: 1rem 0 0;
        color: #374151;
      }

      a {
        min-height: 44px;
        min-width: 44px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: #111827;
        cursor: pointer;
      }

      a:hover {
        text-decoration: underline;
      }

      footer {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
        padding: 2rem 0;
        border-top: 1px solid #e5e7eb;
        color: #4b5563;
        font-size: 0.875rem;
      }

      footer p {
        margin: 0;
        color: inherit;
      }

      @media (min-width: 640px) {
        footer {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
        }
      }
    </style>
  </head>
  <body>
    <header>
      <a href="/" class="site-title">${SITE_TITLE}</a>
      <nav>
        <a href="/blog">Blog</a>
        <a href="/about">About</a>
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
      <p>© ${new Date().getFullYear()} ${SITE_TITLE}</p>
      <nav>
        <a href="${SOCIALS.github}" target="_blank" rel="noopener noreferrer">GitHub</a>
        <a href="${SOCIALS.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        <a href="${SOCIALS.x}" target="_blank" rel="noopener noreferrer">X</a>
        <a href="/rss.xml" target="_blank" rel="noopener noreferrer">RSS</a>
      </nav>
    </footer>
  </body>
</html>
`;
