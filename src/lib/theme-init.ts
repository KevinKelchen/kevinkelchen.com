export const THEME_INIT_SCRIPT = `(() => {
  try {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)',
    ).matches;
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
})();`;
