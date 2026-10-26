/* Matthews Outdoor Services: site behavior.
   Requests and sign-in go through window.MOS (see firebase.js). */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---- tabs ---- */
  const tabs = $$('.tab');
  function showTab(name, focus) {
    tabs.forEach(t => {
      const on = t.id === 'tab-' + name;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
      if (on && focus) t.focus();
    });
  }
  tabs.forEach(t => t.addEventListener('click', () => showTab(t.id.replace('tab-', ''))));
  $('.tabs').addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const i = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
    const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
    showTab(n.id.replace('tab-', ''), true);
  });
  $$('[data-tab]').forEach(a => a.addEventListener('click', () => showTab(a.dataset.tab)));

  /* ---- day chips: open days from Aiden's availability ---- */
  const daysEl = $('#days');
  const fmtDay = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
  const fmtMon = new Intl.DateTimeFormat('en-US', { month: 'short' });
  const fmtLong = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const WINDOWS = ['Morning', 'Afternoon'];
  let cfg = { weekdays: [1, 2, 3, 4, 5, 6], leadDays: 1, horizonDays: 21, blocked: [] };
  let taken = {};
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

  function syncWindows(date) {
    const radios = $$('input[name=window]', $('#form-book'));
    radios.forEach(r => {
      const off = !!(date && taken[date + '_' + r.value]);
      r.disabled = off;
      r.closest('.chip').style.opacity = off ? '.45' : '';
      r.closest('.chip').title = off ? 'Already booked' : '';
    });
    const cur = radios.find(r => r.checked && !r.disabled) || radios.find(r => !r.disabled);
    if (cur) cur.checked = true;
  }

  function renderDays() {
    daysEl.textContent = '';
    const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + (cfg.leadDays || 1));
    let made = 0;
    for (let i = 0; i < (cfg.horizonDays || 21) && made < 10; i++, d.setDate(d.getDate() + 1)) {
      if ((cfg.weekdays || []).indexOf(d.getDay()) < 0) continue;
      const key = iso(d);
      if ((cfg.blocked || []).indexOf(key) > -1) continue;
      if (WINDOWS.every(w => taken[key + '_' + w])) continue;
      const label = document.createElement('label');
      label.className = 'chip';
      label.innerHTML = `<input type="radio" name="day" id="day-${made}" value="${fmtLong.format(d)}" data-date="${key}"><span><small>${fmtDay.format(d)}</small><b>${d.getDate()}</b><small>${fmtMon.format(d)}</small></span>`;
      label.querySelector('input').addEventListener('change', () => syncWindows(key));
      daysEl.appendChild(label);
      made++;
    }
    if (!made) {
      const p = document.createElement('p'); p.className = 'fine'; p.style.textAlign = 'left';
      p.textContent = 'No open days right now. Send an estimate request and I will reach out with times.';
      daysEl.appendChild(p);
    }
  }
  renderDays();
  function loadAvailability() {
    Promise.all([window.MOS.getAvailability(), window.MOS.getSlots()]).then(r => {
      if (r[0]) cfg = Object.assign(cfg, r[0]);
      taken = r[1] || {};
      renderDays();
    }).catch(() => {});
  }
  if (window.MOS) loadAvailability(); else window.addEventListener('mos-ready', loadAvailability, { once: true });

  /* ---- forms ---- */
  function fail(box, text) { box.textContent = text; box.hidden = false; }
  function address(form) { return [form.street.value.trim(), form.city && form.city.value.trim()].filter(Boolean).join(', '); }
  function fill(root, key, val) { $$(`[data-fill="${key}"]`, root).forEach(n => n.textContent = val); }

  const SEND_FAIL = 'That did not send. Please try again, or email service@matthewsoutdoorservices.com.';
  function save(data) {
    if (!window.MOS) return Promise.reject(new Error('offline'));
    return window.MOS.saveRequest(data);
  }
  function busy(f, on) {
    const b = f.querySelector('button[type=submit]');
    b.disabled = on; b.setAttribute('aria-busy', String(on));
  }

  $('#form-estimate').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target, err = $('#e-error');
    err.hidden = true;
    if (!f.street.value.trim()) return fail(err, 'Add the street address so I can find the property.'), f.street.focus();
    if (!f.city.value.trim()) return fail(err, 'Add a city or ZIP.'), f.city.focus();
    if (!f.name.value.trim()) return fail(err, 'What should I call you?'), f.name.focus();
    if (!f.contact.value.trim()) return fail(err, 'Add a phone or email so I can reply.'), f.contact.focus();
    const done = $('#done-estimate');
    busy(f, true);
    save({
      type: 'estimate',
      street: f.street.value.trim(),
      city: f.city.value.trim(),
      name: f.name.value.trim(),
      contact: f.contact.value.trim(),
      chips: $$('input[name=what]:checked', f).map(x => x.value),
      notes: f.notes.value.trim()
    }).then(() => {
      fill(done, 'name', f.name.value.trim());
      fill(done, 'address', address(f));
      f.hidden = true; done.hidden = false; done.focus();
    }).catch(() => fail(err, SEND_FAIL)).finally(() => busy(f, false));
  });

  $('#form-book').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target, err = $('#b-error');
    err.hidden = true;
    const day = f.querySelector('input[name=day]:checked');
    if (!f.street.value.trim()) return fail(err, 'Add the street address.'), f.street.focus();
    if (!day) return fail(err, 'Pick a day. I can adjust it if needed.');
    if (!f.name.value.trim()) return fail(err, 'What should I call you?'), f.name.focus();
    if (!f.contact.value.trim()) return fail(err, 'Add a phone or email so I can confirm.'), f.contact.focus();
    const wEl = f.querySelector('input[name=window]:checked');
    if (!wEl) return fail(err, 'Pick morning or afternoon.');
    const w = wEl.value;
    const done = $('#done-book');
    busy(f, true);
    save({
      type: 'booking',
      street: f.street.value.trim(),
      name: f.name.value.trim(),
      contact: f.contact.value.trim(),
      day: day.value,
      date: day.dataset.date,
      window: w
    }).then(() => {
      fill(done, 'when', day.value + (w === 'Any' ? '' : ', ' + w.toLowerCase()));
      fill(done, 'address', f.street.value.trim());
      f.hidden = true; done.hidden = false; done.focus();
    }).catch(() => fail(err, SEND_FAIL)).finally(() => busy(f, false));
  });

  $$('[data-reset]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.reset;
    $('#done-' + k).hidden = true;
    const f = $('#form-' + (k === 'estimate' ? 'estimate' : 'book'));
    f.reset(); f.hidden = false; f.querySelector('input[type=text]').focus();
  }));

  /* ---- sign in (email link) ---- */
  const sMsg = $('#s-msg');
  function say(box, text) { box.textContent = text; box.hidden = false; }
  $('#form-signin').addEventListener('submit', e => {
    e.preventDefault();
    const v = $('#s-email').value.trim();
    if (!v) { say(sMsg, 'Add your email above first.'); $('#s-email').focus(); return; }
    if (!window.MOS) { say(sMsg, 'Sign-in is not available right now. Please try again in a moment.'); return; }
    const btn = $('#s-send'); btn.disabled = true;
    window.MOS.sendLink(v)
      .then(() => say(sMsg, 'Sent. Check ' + v + ' and tap the link. It may take a minute, and check spam too.'))
      .catch(() => say(sMsg, 'That did not send. Check the email address and try again.'))
      .finally(() => { btn.disabled = false; });
  });
  $('#signin-link').addEventListener('click', () => setTimeout(() => $('#s-email').focus({ preventScroll: true }), 400));
  $('#signout').addEventListener('click', () => window.MOS && window.MOS.signOut());

  const STATUS = {
    new: ['s-new', 'Received'],
    scheduled: ['s-sched', 'Scheduled'],
    quoted: ['s-wait', 'Needs your OK'],
    done: ['s-sched', 'Done'],
    declined: ['s-wait', 'Needs a new time'],
    proposed: ['s-wait', 'New time suggested']
  };
  const ADMINS = ['singularity@reqs.tech', 'service@matthewsoutdoorservices.com']; // menu link only; Firestore rules enforce access
  const dMsg = $('#d-msg');
  function titleFor(r) {
    if (r.type === 'seasonal') return r.notes || 'Seasonal request';
    if (r.type === 'booking') return 'Power washing visit';
    return 'Estimate: ' + ((r.chips && r.chips.length) ? r.chips.join(', ') : 'power washing');
  }
  function renderRows(rows) {
    const list = $('#d-list');
    list.textContent = '';
    if (!rows.length) {
      const p = document.createElement('p'); p.className = 'fine'; p.style.textAlign = 'left';
      p.textContent = 'Nothing yet. Ask for an estimate above, or request a seasonal job below.';
      list.appendChild(p); return;
    }
    rows.forEach(r => {
      const row = document.createElement('div'); row.className = 'req';
      const b = document.createElement('b'); b.textContent = titleFor(r);
      const sm = document.createElement('small');
      const shown = r.status === 'proposed' && r.proposedDay ? 'Suggested: ' + r.proposedDay + (r.proposedWindow ? ', ' + r.proposedWindow.toLowerCase() : '') : (r.day && (r.day + (r.window && r.window !== 'Any' ? ', ' + r.window.toLowerCase() : '')));
      sm.textContent = [r.street, shown, r.quote && ('Estimate: ' + r.quote)].filter(Boolean).join(' · ');
      const st = STATUS[r.status] || STATUS.new;
      const sp = document.createElement('span'); sp.className = 'status ' + st[0]; sp.textContent = st[1];
      row.append(b, sm, sp);
      if (r.reply) { const p = document.createElement('p'); p.className = 'reply'; p.textContent = r.reply; row.appendChild(p); }
      const ask = r.status === 'quoted' || r.status === 'proposed';
      if (ask && !r.response) {
        const box = document.createElement('div'); box.className = 'req-actions';
        const yes = document.createElement('button'); yes.type = 'button'; yes.textContent = r.status === 'quoted' ? 'Looks good' : 'Works for me';
        const no = document.createElement('button'); no.type = 'button'; no.textContent = r.status === 'quoted' ? 'Not now' : "Doesn't work";
        [[yes, 'accepted'], [no, 'declined']].forEach(x => x[0].addEventListener('click', () => {
          yes.disabled = no.disabled = true;
          window.MOS.respond(r.id, x[1]).then(refresh).catch(() => { yes.disabled = no.disabled = false; });
        }));
        box.append(yes, no); row.appendChild(box);
      } else if (ask && r.response) {
        const p = document.createElement('p'); p.className = 'reply';
        p.textContent = r.response === 'accepted' ? 'Thanks. Aiden will confirm.' : 'Got it. Aiden will follow up.';
        row.appendChild(p);
      }
      list.appendChild(row);
    });
  }
  let lastRows = [];
  function refresh() {
    return window.MOS.myRequests().then(rows => { lastRows = rows; renderRows(rows); })
      .catch(() => say(dMsg, 'Could not load your requests. Please refresh.'));
  }
  function onUser(u) {
    $('#form-signin').hidden = !!u;
    $('#signed').hidden = !u;
    $('#dash-sample').hidden = !!u;
    $('#dash-live').hidden = !u;
    $('.dash').setAttribute('aria-label', u ? 'Your requests' : 'Sample customer dashboard');
    const nb = $('#signin-link');
    nb.classList.toggle('is-in', !!u);
    nb.textContent = u ? '\u2713 Signed in' : 'Sign in';
    nb.setAttribute('aria-label', u ? 'Signed in as ' + u.email + '. Go to your requests.' : 'Sign in');
    $('#nav-admin').hidden = !(u && ADMINS.indexOf((u.email || '').toLowerCase()) > -1);
    if (u) { $('#s-who').textContent = u.email; refresh(); }
  }
  $$('#dash-live [data-svc]').forEach(b => b.addEventListener('click', () => {
    const u = window.MOS.user(); if (!u) return;
    const last = lastRows.find(r => r.street);
    b.disabled = true; dMsg.hidden = true;
    window.MOS.saveRequest({
      type: 'seasonal',
      street: last ? last.street : 'Address on file',
      name: (last && last.name) || u.email.split('@')[0],
      contact: u.email.toLowerCase(),
      notes: b.dataset.svc
    }).then(() => { say(dMsg, 'Got it. I\'ll follow up on ' + b.dataset.svc.toLowerCase() + '.'); return refresh(); })
      .catch(() => say(dMsg, 'That did not send. Please try again.'))
      .finally(() => { b.disabled = false; });
  }));
  window.addEventListener('mos-auth-error', () => say(sMsg, 'That link did not work. It may have expired. Send yourself a new one.'));
  function hookAuth() { window.MOS.onUser(onUser); }
  if (window.MOS) hookAuth(); else window.addEventListener('mos-ready', hookAuth, { once: true });

  /* ---- before / after ---- */
  const ba = $('#ba'), range = $('#ba-range');
  range.addEventListener('input', () => ba.style.setProperty('--pos', range.value + '%'));
  const alts = {
    fence: ['Fence after power washing: bright, clean white panels', 'Fence before power washing: white panels streaked with green grime'],
    porch: ['Porch slab after power washing: clean, even concrete', 'Porch slab before power washing: dark stains and mildew'],
    yard: ['Yard after cleanup: fresh mulch bed and trimmed lawn edge', 'Yard before cleanup: overgrown bed with cut branches on the lawn']
  };
  $$('.scene-tabs button').forEach(b => b.addEventListener('click', () => {
    const s = b.dataset.scene;
    $$('.scene-tabs button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $('#img-after').src = `img/${s}-after.jpg`;  $('#img-after').alt = alts[s][0];
    $('#img-before').src = `img/${s}-before.jpg`; $('#img-before').alt = alts[s][1];
  }));
})();
