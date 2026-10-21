(() => {
  const STORAGE_KEY = 'theme';
  const button = document.querySelector('#theme-menu-button');
  const menu = document.querySelector('#theme-menu');

  if (!button || !menu) return;

  const items = Array.from(menu.querySelectorAll('[role="menuitemradio"]'));
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const labels = { system: 'System', light: 'Light', dark: 'Dark' };

  const getTheme = () => document.documentElement.dataset.theme || 'system';

  const applyTheme = (theme) => {
    const isDark = theme === 'dark' || (theme === 'system' && media.matches);
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // The selected theme still applies for this page when storage is unavailable.
    }
  };

  const syncItems = () => {
    const current = getTheme();
    for (const item of items) {
      const checked = item.dataset.themeOption === current;
      item.setAttribute('aria-checked', String(checked));
      item.tabIndex = checked ? 0 : -1;
      const check = item.querySelector('[data-theme-check]');
      // SVG elements have no `hidden` property, so set the attribute directly.
      check?.toggleAttribute('hidden', !checked);
    }
    button.setAttribute('aria-label', `Theme: ${labels[current]}`);
  };

  const closeMenu = ({ focusButton = false } = {}) => {
    menu.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    if (focusButton) button.focus();
  };

  const openMenu = (focusTarget = 'checked') => {
    syncItems();
    menu.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    const checked = items.find(
      (item) => item.getAttribute('aria-checked') === 'true',
    );
    const target = {
      checked: checked ?? items[0],
      first: items[0],
      last: items[items.length - 1],
    }[focusTarget];
    target?.focus();
  };

  button.addEventListener('click', () => {
    if (menu.hidden) {
      openMenu();
    } else {
      closeMenu();
    }
  });

  button.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      openMenu(event.key === 'ArrowDown' ? 'first' : 'last');
    }
  });

  menu.addEventListener('keydown', (event) => {
    const currentIndex = items.indexOf(document.activeElement);

    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu({ focusButton: true });
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      items[(currentIndex + 1) % items.length]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      items[(currentIndex - 1 + items.length) % items.length]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      items[items.length - 1]?.focus();
    } else if (event.key === 'Tab') {
      closeMenu();
    }
  });

  for (const item of items) {
    item.addEventListener('click', () => {
      applyTheme(item.dataset.themeOption);
      syncItems();
      closeMenu({ focusButton: true });
    });
  }

  // `document` outlives client-side navigations, but this script reruns on each
  // one, so drop the previous page's listener when the page is swapped out.
  const documentListeners = new AbortController();
  document.addEventListener(
    'click',
    (event) => {
      if (
        !menu.hidden &&
        !menu.contains(event.target) &&
        !button.contains(event.target)
      ) {
        closeMenu();
      }
    },
    { signal: documentListeners.signal },
  );
  document.addEventListener(
    'astro:before-swap',
    () => documentListeners.abort(),
    { once: true, signal: documentListeners.signal },
  );

  syncItems();
})();
