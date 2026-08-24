/* Mobile hamburger toggle for this client's header.
   Tied to this client's specific markup (#main-nav, .hamburger-menu), so it
   lives here rather than in core/ — no other client uses this header shape. */
const toggle = document.querySelector('.hamburger-menu');
const nav = document.getElementById('main-nav');

toggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('active');
  toggle.setAttribute('aria-expanded', String(open));
});

// Picking a link closes the menu — without this, following an in-page
// anchor (e.g. #tours) leaves the mobile menu open over the section you
// just navigated to.
nav?.addEventListener('click', (event) => {
  if (event.target.tagName === 'A') {
    nav.classList.remove('active');
    toggle?.setAttribute('aria-expanded', 'false');
  }
});
