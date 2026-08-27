export const SITE_TITLE = 'Kevin Kelchen';
export const SITE_DESCRIPTION =
  'Kevin Kelchen is a software engineer. Writing on software engineering and whatever else earns a spot.';

export const SOCIALS = {
  github: 'https://github.com/KevinKelchen',
  linkedin: 'https://www.linkedin.com/in/kevin-kelchen/',
  x: 'https://x.com/kevinkelchen',
} as const;

export const HEADER_LINKS = [
  { label: 'Blog', href: '/blog' },
  { label: 'About', href: '/about' },
] as const;

export const FOOTER_LINKS = [
  { label: 'X', href: SOCIALS.x },
  { label: 'LinkedIn', href: SOCIALS.linkedin },
  { label: 'GitHub', href: SOCIALS.github },
  { label: 'RSS', href: '/rss.xml' },
] as const;
