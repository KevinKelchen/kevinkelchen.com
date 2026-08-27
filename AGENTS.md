## Domain model

Read `CONTEXT.md` for this site's vocabulary (Post, Tag, Homepage, Archive, Feed, About) and `docs/adr/` for recorded decisions. Rules that aren't visible in the code: the professional bar is editorial, so Posts never carry a professional/personal classification; contact is via LinkedIn and X links only — no email address; and the site never states Kevin's location, even if LinkedIn or X do.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Deployment gate

Pushing deploys the site. Immediately before any push, run `npm run verify` against the final working tree. Push only after it succeeds; if it changes files, include those changes and rerun it before pushing.

## Responsive design

Support viewports down to 320 CSS pixels. For layout changes, run the responsive browser tests and visually verify the Homepage, Archive, About, and a representative Post at 320, 375, 768, and 1280 pixels. Completion requires no horizontal overflow and usable navigation, footer, content, and touch targets at every width.

## Accessibility

User-facing pages and components must support WCAG 2.2 Level AA, including Level A requirements. For changes to markup, content, interaction, or visual styling, run the lint and accessibility browser tests and fix new violations. Manually verify affected behavior that automated tools cannot decide, including keyboard operation, visible focus, logical focus order, semantic structure and accessible names, and zoom/reflow. Automated results are a regression gate, not a claim of conformance.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
