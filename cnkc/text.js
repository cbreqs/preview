/* Turn plain web addresses in typed text into real links.

   Descriptions are written by people, not by anyone who wants to think about
   markup — so pasting <a href="…"> into a field does nothing useful, and it
   shouldn't: rendering typed HTML would mean any pasted script tag runs on the
   public site. Instead, anything that looks like an address becomes a link.
   She types "Also visit https://typical.solutions" and it just works.

   Every node here is built with DOM calls, never innerHTML, so the text can
   never turn into markup. The pattern requires an http(s) scheme, which also
   rules out javascript: URLs. */

// Stops before trailing punctuation, so "see https://x.com, then…" doesn't
// swallow the comma into the link.
const WEB_ADDRESS = /https?:\/\/[^\s<>()]+[^\s<>().,!?;:'"]/g;

/** Returns a DocumentFragment: plain text with any addresses as <a>. */
export function linkify(text) {
  const fragment = document.createDocumentFragment();
  if (!text) return fragment;

  let cursor = 0;
  for (const match of text.matchAll(WEB_ADDRESS)) {
    if (match.index > cursor) {
      fragment.append(text.slice(cursor, match.index));
    }
    const link = document.createElement('a');
    link.href = match[0];
    link.textContent = match[0];
    link.target = '_blank';
    link.rel = 'noopener';
    fragment.append(link);
    cursor = match.index + match[0].length;
  }

  if (cursor < text.length) fragment.append(text.slice(cursor));
  return fragment;
}

/** Set an element's content to `text`, with addresses linked. */
export function setLinkedText(element, text) {
  element.replaceChildren(linkify(text));
  return element;
}
