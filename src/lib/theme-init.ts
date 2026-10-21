export const THEME_INIT_SCRIPT = `(() => {
  const STORAGE_KEY = 'theme';
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  const getStoredTheme = () => {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      return value === 'light' || value === 'dark' || value === 'system'
        ? value
        : 'system';
    } catch {
      return 'system';
    }
  };

  const applyTheme = (theme) => {
    const isDark = theme === 'dark' || (theme === 'system' && media.matches);
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', isDark);
  };

  applyTheme(getStoredTheme());

  media.addEventListener('change', () => {
    if (getStoredTheme() === 'system') {
      applyTheme('system');
    }
  });

  document.addEventListener('astro:before-swap', (event) => {
    const nextDocument = event.newDocument;

    if (nextDocument) {
      nextDocument.documentElement.dataset.theme =
        document.documentElement.dataset.theme;
      nextDocument.documentElement.classList.toggle(
        'dark',
        document.documentElement.classList.contains('dark'),
      );
    }
  });
})();`;
