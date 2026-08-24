/* Shared booking logic — pricing, and the transactional write that turns an
   open slot into a confirmed booking.

   Kept separate from book.html so "book a slot" has one place to live no
   matter how many different UIs end up calling it (the public wizard today;
   maybe an admin "book this in for someone who called" flow later).

   Availability model for v1: an admin creates specific slots by hand (date,
   time, capacity) — same mental model as adding a calendar event. No
   recurring weekly-hours generator yet; see README for why that's deferred.

   Money isn't collected anywhere in this flow yet (no Stripe wired in) —
   `price` on a booking is informational only, computed here so the customer
   sees what they'd owe. Revisit the trust model in bookSlot() before that
   changes; see the comment on BookingError. */

import {
  doc, collection, runTransaction, serverTimestamp, setDoc,
} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js';

export class BookingError extends Error {
  /** `code` is one of: 'slot-gone' | 'slot-cancelled' | 'slot-past' | 'slot-full'.
      Always the reason a *retry* would also fail without picking a different
      slot — nothing here is a transient/network failure, those reject with
      whatever Firestore throws instead. */
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/** Total price for `partySize` people at `clientType`, in whole currency
    units. `bookingType.priceByClientType` overrides the flat `price` for a
    specific client type when present (e.g. business clients pay a different
    rate); `priceModel: 'perPerson'` multiplies by the party size instead of
    charging the same total regardless of how many people came. */
export function priceFor(bookingType, clientType, partySize) {
  const unit = bookingType.priceByClientType?.[clientType] ?? bookingType.price ?? 0;
  return bookingType.priceModel === 'perPerson' ? unit * partySize : unit;
}

/** How many spots are still open in a slot, given its current data. */
export function remainingCapacity(slot) {
  return Math.max(0, (slot.capacity ?? 0) - (slot.bookedCount ?? 0));
}

/** Book `partySize` spots in `slotId`, atomically — the read-check-write all
    happens inside one Firestore transaction, so two people submitting the
    same nearly-full slot at once can't both succeed and overbook it.

    KNOWN GAP, deliberately accepted for v1: the security rules cap how much
    `bookedCount` a write can add (never past `capacity`), but they don't
    cross-check that increment against this booking's actual `partySize` — a
    tampered client could under-report the increment while still recording a
    larger party. Harmless today because no payment moves through this flow;
    close it with a Cloud Function (or at least a `getAfter()` rule) before
    Stripe is wired in. See firestore.rules for the enforced half of this. */
export async function bookSlot(db, {
  siteId, slotId, bookingType, partySize, clientType, contact, note,
}) {
  const result = await runBookingTransaction(db, { siteId, slotId, bookingType, partySize, clientType, contact, note });

  // Best-effort, after the fact: the booking above is already real and
  // confirmed by this point. A rules mismatch, a missing extension install,
  // or a network hiccup here must never look like the booking itself
  // failed — the customer keeps their slot either way, they just might not
  // get an emailed copy of it.
  try {
    await queueConfirmation(db, {
      siteId, bookingId: result.id, bookingType, start: result.start, partySize, clientType, contact, note,
    });
  } catch (error) {
    console.warn('Booking confirmation email not queued:', error);
  }

  return result;
}

async function runBookingTransaction(db, {
  siteId, slotId, bookingType, partySize, clientType, contact, note,
}) {
  const slotRef = doc(db, 'sites', siteId, 'public', 'schedule', 'slots', slotId);
  const bookingsCol = collection(db, 'sites', siteId, 'public', 'orders', 'bookings');

  return runTransaction(db, async (tx) => {
    const slotSnap = await tx.get(slotRef);
    if (!slotSnap.exists()) throw new BookingError('slot-gone', 'That slot no longer exists. Pick another.');
    const slot = slotSnap.data();

    if (slot.isCancelled) throw new BookingError('slot-cancelled', 'That slot has been cancelled. Pick another.');
    if (slot.start.toMillis() < Date.now()) throw new BookingError('slot-past', 'That slot has already passed. Pick another.');

    const remaining = remainingCapacity(slot);
    if (partySize > remaining) {
      throw new BookingError('slot-full', remaining <= 0
        ? 'That slot just filled up. Pick another.'
        : `Only ${remaining} spot${remaining === 1 ? '' : 's'} left in that slot — try a smaller group or another slot.`);
    }

    const bookingRef = doc(bookingsCol);
    tx.update(slotRef, { bookedCount: (slot.bookedCount ?? 0) + partySize });
    tx.set(bookingRef, {
      slotId,
      bookingTypeId: bookingType.id,
      bookingTypeName: bookingType.name,
      start: slot.start,
      partySize,
      clientType,
      name: contact.name,
      email: contact.email,
      phone: contact.phone ?? '',
      note: note ?? '',
      price: priceFor(bookingType, clientType, partySize),
      status: 'confirmed',
      createdAt: serverTimestamp(),
    });

    return { id: bookingRef.id, start: slot.start };
  });
}

/** Plain-text + HTML confirmation email for a just-made booking. Kept as a
    plain template literal, not a templating library — one email, no reason
    to take on a dependency for it. */
function confirmationEmail({ bookingType, start, partySize, clientType, contact, note }) {
  const when = new Intl.DateTimeFormat(undefined, {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  }).format(start.toDate());
  const total = priceFor(bookingType, clientType, partySize);
  const priceLine = total > 0 ? `Total: $${total.toFixed(2)} — pay when you arrive.\n` : '';

  const text = `Hi ${contact.name},\n\n`
    + `You're booked for ${bookingType.name}.\n\n`
    + `When: ${when}\n`
    + `People: ${partySize}\n`
    + priceLine
    + (note ? `Note: ${note}\n` : '')
    + `\nIf anything here is wrong, just reply to this email.`;

  const html = `<p>Hi ${escapeHtml(contact.name)},</p>`
    + `<p>You're booked for <strong>${escapeHtml(bookingType.name)}</strong>.</p>`
    + `<p>${escapeHtml(when)}<br>${partySize} people</p>`
    + (total > 0 ? `<p>Total: $${total.toFixed(2)} — pay when you arrive.</p>` : '')
    + (note ? `<p>Note: ${escapeHtml(note)}</p>` : '')
    + `<p>If anything here is wrong, just reply to this email.</p>`;

  return { subject: `You're booked: ${bookingType.name}`, text, html };
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

/** Queue a confirmation email for a booking that's already been created.
    Best-effort and never blocks or undoes the booking itself — see the call
    site in bookSlot(). Reuses the booking's own id as the mail doc's id,
    which is what firestore.rules cross-checks the `to` address against. */
async function queueConfirmation(db, { siteId, bookingId, bookingType, start, partySize, clientType, contact, note }) {
  const { subject, text, html } = confirmationEmail({ bookingType, start, partySize, clientType, contact, note });
  await setDoc(doc(db, 'sites', siteId, 'public', 'mail', 'queue', bookingId), {
    to: [contact.email],
    message: { subject, text, html },
  });
}
