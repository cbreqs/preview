/* The one lead-capture form the real site uses everywhere — Tours (private
   group inquiries), B2B (sponsorship inquiries), and the general Signup
   page all funnel through the same fields ("Interested In" dropdown +
   contact info + a free-text message). One module, mounted wherever it's
   needed, instead of copy-pasting the form three times.

   Replaces an earlier build's fabricated "raffle" concept — the real site
   has no raffle, just this inquiry form. */

import { db, SITE_ID } from './firebase.js';
import {
  collection, addDoc, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js';

const INTERESTED_IN_OPTIONS = [
  'Blazing Trails Community Sponsorship',
  'Official Tour Stop Partnership (Dispensary/Brewery)',
  'Presenting Platform Sponsorship',
  'Private Group Tour Inquiry (10+ Guests)',
  'Other Partnership Idea',
];

/** Mounts the inquiry form into `container`. `defaultInterest` preselects
    the dropdown — e.g. tours.html defaults to the private-group option,
    b2b.html leaves it on the placeholder. */
export function mountInquiryForm(container, { defaultInterest = '' } = {}) {
  container.innerHTML = `
    <form class="inquiry-form" id="inquiry-form" novalidate>
      <div class="field">
        <label for="inq-company">Company name <span class="optional">— if relevant</span></label>
        <input type="text" id="inq-company" />
      </div>
      <div class="row">
        <div class="field">
          <label for="inq-first">First name</label>
          <input type="text" id="inq-first" required />
        </div>
        <div class="field">
          <label for="inq-last">Last name</label>
          <input type="text" id="inq-last" required />
        </div>
      </div>
      <div class="row">
        <div class="field">
          <label for="inq-email">Email</label>
          <input type="email" id="inq-email" required />
        </div>
        <div class="field">
          <label for="inq-phone">Phone number</label>
          <input type="tel" id="inq-phone" required />
        </div>
      </div>
      <div class="field">
        <label for="inq-interest">Interested in</label>
        <select id="inq-interest">
          <option value="">Please select…</option>
          ${INTERESTED_IN_OPTIONS.map((o) => `<option value="${o}">${o}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label for="inq-message">Requesting information regarding</label>
        <textarea id="inq-message"></textarea>
      </div>
      <button type="submit" class="submit-button">Submit request</button>
      <p class="form-message" id="inquiry-status" role="status" aria-live="polite"></p>
    </form>
  `;

  const $ = (id) => container.querySelector(`#${id}`);
  if (defaultInterest) $('inq-interest').value = defaultInterest;

  const status = $('inquiry-status');
  function setStatus(message, kind = '') {
    status.textContent = message;
    status.className = `form-message${kind ? ` ${kind}` : ''}`;
  }

  $('inquiry-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const first = $('inq-first').value.trim();
    const last = $('inq-last').value.trim();
    const email = $('inq-email').value.trim();
    const phone = $('inq-phone').value.trim();

    if (!first || !last || !email || !phone) {
      setStatus('First name, last name, email and phone are required.', 'error');
      return;
    }

    const button = container.querySelector('button[type="submit"]');
    button.disabled = true;
    setStatus('Sending…');

    try {
      await addDoc(collection(db, 'sites', SITE_ID, 'public', 'leads', 'entries'), {
        companyName: $('inq-company').value.trim(),
        firstName: first,
        lastName: last,
        email,
        phone,
        interestedIn: $('inq-interest').value,
        message: $('inq-message').value.trim(),
        createdAt: serverTimestamp(),
      });
      container.querySelector('#inquiry-form').reset();
      if (defaultInterest) $('inq-interest').value = defaultInterest;
      setStatus("Thanks — we'll be in touch soon.", 'ok');
    } catch (error) {
      console.error('Inquiry submission failed:', error);
      setStatus('Something went wrong. Please try again, or call 816-433-1232.', 'error');
    } finally {
      button.disabled = false;
    }
  });
}
