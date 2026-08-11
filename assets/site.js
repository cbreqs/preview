/* Theme toggle, shared by every page.
   The initial value is set by a tiny inline script in each <head> so the page
   never flashes the wrong theme; this file only handles the button. */

function toggleTheme() {
  const html = document.documentElement;
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  try {
    localStorage.setItem('theme', next);
  } catch {
    // Private browsing with storage blocked — the toggle still works for this
    // page, it just won't be remembered.
  }
}

document.addEventListener('click', (event) => {
  if (event.target.closest('.theme-btn')) toggleTheme();
});
