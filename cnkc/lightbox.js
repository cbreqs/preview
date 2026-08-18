/* Tap a flyer to see it full size.

   Event flyers carry the information people actually need — date, address,
   times, cover charge — and none of that is legible in an 84px thumbnail. So
   every thumbnail is a real <button>, not a bare <img>: it's reachable by
   keyboard, announced as a control, and gets a focus ring like everything
   else on the site.

   The overlay is built once, on first use, and reused. */

let overlay = null;
let image = null;
let caption = null;
let lastFocused = null;

function build() {
  if (overlay) return;

  overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Full size image');

  const close = document.createElement('button');
  close.className = 'lightbox-close';
  close.type = 'button';
  close.setAttribute('aria-label', 'Close');
  close.textContent = '×';
  close.addEventListener('click', hide);

  image = document.createElement('img');
  image.className = 'lightbox-img';
  image.alt = '';

  caption = document.createElement('p');
  caption.className = 'lightbox-caption';

  const frame = document.createElement('div');
  frame.className = 'lightbox-frame';
  frame.append(image, caption);

  overlay.append(close, frame);

  // Backdrop click closes; clicks on the picture itself must not.
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay || event.target === frame) hide();
  });

  document.addEventListener('keydown', (event) => {
    if (overlay.hidden) return;
    if (event.key === 'Escape') hide();
    // Only two focusable things exist in here, so a full focus trap is
    // overkill — just keep Tab from wandering back to the page behind.
    if (event.key === 'Tab') event.preventDefault();
  });

  document.body.append(overlay);
}

function show(src, text, trigger) {
  build();
  // The element to return focus to on close. Passed in rather than read from
  // document.activeElement, which is the <body> when the click came from
  // anything that didn't focus first — closing would then dump a keyboard
  // user at the top of the page instead of back at the thumbnail they opened.
  lastFocused = trigger ?? document.activeElement;
  image.src = src;
  image.alt = text || '';
  caption.textContent = text || '';
  caption.hidden = !text;
  overlay.hidden = false;
  // Stop the page behind scrolling under the overlay on touch.
  document.body.style.overflow = 'hidden';
  overlay.querySelector('.lightbox-close').focus();
}

function hide() {
  if (!overlay || overlay.hidden) return;
  overlay.hidden = true;
  image.src = '';
  document.body.style.overflow = '';
  lastFocused?.focus();
}

/** A thumbnail that opens full size when clicked.
    Returns the <button> to append; `className` styles the inner <img>. */
export function thumbButton(src, className, label) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'thumb-btn';
  button.setAttribute('aria-label', label ? `View ${label} full size` : 'View image full size');

  const img = document.createElement('img');
  img.className = className;
  img.src = src;
  img.alt = '';
  img.loading = 'lazy';
  button.append(img);

  button.addEventListener('click', () => show(src, label, button));
  return button;
}
