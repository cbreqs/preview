/* Turn web addresses in typed text into real links.

   Descriptions are written by people, not by anyone who wants to think about
   markup. Two things therefore have to work:

     1. A bare address — "Also visit https://typical.solutions" — becomes a
        link with nothing to learn.
     2. A pasted <a href="…">label</a> becomes that link too, showing the
        label rather than the raw tag. People copy links out of other sites
        and email all the time, and leaving the tags visible on the page
        looks like the site is broken.

   Nothing else in the text is treated as markup. A pasted <script> stays
   inert text, because every node here is built with DOM calls and never
   innerHTML, and only http(s) URLs are ever turned into links — so
   javascript: hrefs are left as plain words. */

// One pass matches either an anchor tag or a bare address, so an address
// inside an anchor's label can't be linked twice.
const TOKEN = new RegExp(
  // <a … href="URL" …>label</a>
  '<a\\s[^>]*?href\\s*=\\s*["\']([^"\']+)["\'][^>]*>([\\s\\S]*?)<\\/a>'
  + '|'
  // a bare address, stopping before trailing punctuation so "see https://x.com,"
  // doesn't swallow the comma
  + 'https?:\\/\\/[^\\s<>()]+[^\\s<>().,!?;:\'"]',
  'gi',
);

const SAFE_SCHEME = /^https?:\/\//i;

function anchor(href, label) {
  const link = document.createElement('a');
  link.href = href;
  link.textContent = label;
  link.target = '_blank';
  link.rel = 'noopener';
  return link;
}

/** Returns a DocumentFragment: plain text with addresses as <a>. */
export function linkify(text) {
  const fragment = document.createDocumentFragment();
  if (!text) return fragment;

  let cursor = 0;
  for (const match of text.matchAll(TOKEN)) {
    if (match.index > cursor) fragment.append(text.slice(cursor, match.index));
    cursor = match.index + match[0].length;

    const [whole, href, rawLabel] = match;

    if (href === undefined) {
      fragment.append(anchor(whole, whole));   // bare address
      continue;
    }

    // Any tags inside the label are dropped rather than rendered, so nested
    // markup can't sneak through as anything but words.
    const label = (rawLabel || '').replace(/<[^>]*>/g, '').trim();

    if (!SAFE_SCHEME.test(href)) {
      // Not a web address — keep the visible words, drop the link entirely.
      if (label) fragment.append(label);
      continue;
    }

    fragment.append(anchor(href, label || href));
  }

  if (cursor < text.length) fragment.append(text.slice(cursor));
  return fragment;
}

/** Set an element's content to `text`, with addresses linked. */
export function setLinkedText(element, text) {
  element.replaceChildren(linkify(text));
  return element;
}
