export const THEME_OPTIONS = [
  {
    value: 'system',
    label: 'System',
    icon: '<rect x="3" y="4" width="18" height="12" rx="1"></rect><path d="M8 20h8M12 16v4"></path>',
  },
  {
    value: 'light',
    label: 'Light',
    icon: '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"></path>',
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: '<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"></path>',
  },
] as const;

export const DEFAULT_THEME = 'system';

export const CHECK_ICON = '<path d="M4 12.5 9 17 20 6"></path>';
