const toggle = document.querySelector('#theme-toggle');

const updateLabel = () => {
  const isDark = document.documentElement.classList.contains('dark');
  toggle?.setAttribute(
    'aria-label',
    `Switch to ${isDark ? 'light' : 'dark'} mode`,
  );
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
