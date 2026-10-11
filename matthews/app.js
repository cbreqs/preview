/* Matthews Home Exteriors: prototype behavior.
   Nothing here talks to a server yet. Forms show their "what happens next"
   state so the flow can be judged. Wiring notes are in README.md. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---- accent swatches (so Aiden can try colors) ---- */
  $$('.swatch').forEach(b => b.addEventListener('click', () => {
    document.documentElement.dataset.accent = b.dataset.set;
    $$('.swatch').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
  }));

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

  /* ---- day chips: next 10 days, no Sundays ---- */
  const daysEl = $('#days');
  const fmtDay = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
  const fmtMon = new Intl.DateTimeFormat('en-US', { month: 'short' });
  const fmtLong = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  let d = new Date(); d.setHours(12, 0, 0, 0);
  let made = 0;
  while (made < 10) {
    d = new Date(d.getTime() + 86400000);
    if (d.getDay() === 0) continue;
    const id = 'day-' + made;
    const label = document.createElement('label');
    label.className = 'chip';
    label.innerHTML = `<input type="radio" name="day" id="${id}" value="${fmtLong.format(d)}"><span><small>${fmtDay.format(d)}</small><b>${d.getDate()}</b><small>${fmtMon.format(d)}</small></span>`;
    daysEl.appendChild(label);
    made++;
  }

  /* ---- forms ---- */
  function fail(box, text) { box.textContent = text; box.hidden = false; }
  function address(form) { return [form.street.value.trim(), form.city && form.city.value.trim()].filter(Boolean).join(', '); }
  function fill(root, key, val) { $$(`[data-fill="${key}"]`, root).forEach(n => n.textContent = val); }

  $('#form-estimate').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target, err = $('#e-error');
    err.hidden = true;
    if (!f.street.value.trim()) return fail(err, 'Add the street address so I can find the property.'), f.street.focus();
    if (!f.city.value.trim()) return fail(err, 'Add a city or ZIP.'), f.city.focus();
    if (!f.name.value.trim()) return fail(err, 'What should I call you?'), f.name.focus();
    if (!f.contact.value.trim()) return fail(err, 'Add a phone or email so I can reply.'), f.contact.focus();
    const done = $('#done-estimate');
    fill(done, 'name', f.name.value.trim());
    fill(done, 'address', address(f));
    f.hidden = true; done.hidden = false; done.focus();
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
    const w = f.querySelector('input[name=window]:checked').value;
    const done = $('#done-book');
    fill(done, 'when', day.value + (w === 'Any' ? '' : ', ' + w.toLowerCase()));
    fill(done, 'address', f.street.value.trim());
    f.hidden = true; done.hidden = false; done.focus();
  });

  $$('[data-reset]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.reset;
    $('#done-' + k).hidden = true;
    const f = $('#form-' + (k === 'estimate' ? 'estimate' : 'book'));
    f.reset(); f.hidden = false; f.querySelector('input[type=text]').focus();
  }));

  /* ---- sign in (prototype only) ---- */
  const sMsg = $('#s-msg');
  $('#form-signin').addEventListener('submit', e => {
    e.preventDefault();
    sMsg.textContent = 'Prototype only: sign-in isn\'t connected yet. The panel on the right shows what you\'d see.';
    sMsg.hidden = false;
  });
  $('#magic').addEventListener('click', () => {
    const v = $('#s-email').value.trim();
    sMsg.textContent = v ? 'Prototype only. In the real site, a sign-in link would be sent to ' + v + '.' : 'Add your email above first.';
    sMsg.hidden = false;
    if (!v) $('#s-email').focus();
  });
  $('#signin-link').addEventListener('click', () => setTimeout(() => $('#s-email').focus({ preventScroll: true }), 400));

  /* ---- before / after ---- */
  const ba = $('#ba'), range = $('#ba-range');
  range.addEventListener('input', () => ba.style.setProperty('--pos', range.value + '%'));
  const alts = {
    driveway: ['Driveway after power washing: light, clean concrete', 'Driveway before power washing: dark, stained concrete with weeds'],
    fence: ['Fence after power washing: warm, clean cedar', 'Fence before power washing: gray, mossy wood'],
    house: ['House after power washing: bright siding and a blue door', 'House before power washing: dingy, streaked siding']
  };
  $$('.scene-tabs button').forEach(b => b.addEventListener('click', () => {
    const s = b.dataset.scene;
    $$('.scene-tabs button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    $('#img-after').src = `img/${s}-after.svg`;  $('#img-after').alt = alts[s][0];
    $('#img-before').src = `img/${s}-before.svg`; $('#img-before').alt = alts[s][1];
  }));
})();
