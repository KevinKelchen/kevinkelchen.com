# Post URLs are /blog/<slug>, with no dates

Post URLs are a promise: once shared and indexed they cannot change. We chose `/blog/<slug>` over date-based paths (dates punish evergreen posts and revisions), over `/<slug>` at the root (which would collide with every future page like `/about` or `/talks`, forever), and over `/posts/<slug>` (no advantage, less conventional). Dates live in frontmatter, not URLs.
