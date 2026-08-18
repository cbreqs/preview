/* Make an embedded Jotform sit in the page instead of in a window.

   Two things make an iframe look pasted-on: the frame itself, and a fixed
   height that leaves the form scrolling inside its own little box. The border
   is handled in CSS; the height is handled here.

   Jotform posts its rendered height to the parent as it changes — on load,
   when a conditional field appears, when validation adds an error line. We
   listen and grow the iframe to match, so there is never an inner scrollbar
   and the page scrolls as one thing.

   Cross-origin means we cannot style the form from out here; that has to be
   done in Jotform itself. This only handles the seam. */

const JOTFORM_HOST = /(^|\.)jotform\.com$/;

/** Grow `iframe` to whatever height the embedded form reports. */
export function autoResize(iframe) {
  if (!iframe) return;

  window.addEventListener('message', (event) => {
    // Only listen to the form. Any page can postMessage at us.
    let host;
    try {
      host = new URL(event.origin).hostname;
    } catch {
      return;
    }
    if (!JOTFORM_HOST.test(host)) return;
    if (event.source !== iframe.contentWindow) return;

    // Jotform sends "setHeight:<px>:<formId>" as a plain string.
    const message = typeof event.data === 'string' ? event.data : '';
    const match = message.match(/^setHeight:(\d+)/);
    if (!match) return;

    const height = Number(match[1]);
    // Ignore the nonsense values it occasionally sends mid-render, which
    // would otherwise collapse the form to a sliver.
    if (height < 200) return;

    iframe.style.height = `${height}px`;
  });
}
