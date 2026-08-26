# kevinkelchen.com

Kevin Kelchen's personal site: a professional site whose primary content is writing. Built with Astro (static output) and Tailwind, deployed to Netlify.

Read [`CONTEXT.md`](./CONTEXT.md) for the domain vocabulary and [`docs/adr/`](./docs/adr/) for recorded decisions before changing the site's structure.

## Writing a post

Add a Markdown file to `src/content/blog/`. The filename becomes the URL slug: `my-post.md` → `/blog/my-post`. Copy the frontmatter from `hello-world.md` (a permanent draft kept as a template). `draft: true` posts build locally but never in production.

## Commands

| Command           | Action                                    |
| :---------------- | :---------------------------------------- |
| `npm install`     | Install dependencies                      |
| `npm run dev`     | Dev server at `localhost:4321`            |
| `npm run build`   | Production build to `./dist/`             |
| `npm run preview` | Preview the production build locally      |
