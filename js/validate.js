// js/validate.js — JSON validator adapted to your current schemas
(function () {
  const TAG = '%c[Validator]';
  const STYLE_TAG = 'color:#555;font-weight:600';
  const STYLE_OK  = 'color:#1a7f37;font-weight:700';
  const STYLE_ERR = 'color:#b42318;font-weight:700';

  const q = new URLSearchParams(location.search);
  const wantValidate = q.has('validate') && q.get('validate') !== '0';

  async function fetchJSON(path) {
    const r = await fetch(path, { cache: 'no-store' });
    if (!r.ok) throw new Error(`${path} ${r.status}`);
    return r.json();
  }

  function ensureArray(arr, where) {
    if (!Array.isArray(arr)) throw new Error(`${where} must be an array`);
  }

  function ensureKeys(arr, keys, where) {
    ensureArray(arr, where);
    const missing = [];
    arr.forEach((obj, i) => {
      keys.forEach((k) => {
        if (!(k in (obj || {}))) missing.push(`${where}[${i}].${k}`);
      });
    });
    if (missing.length) {
      throw new Error(`Missing required keys:\n - ${missing.join('\n - ')}`);
    }
  }

  function ok(label, file) {
    console.log(TAG, STYLE_TAG, `${label}: ${file}`, STYLE_OK, '✓ OK');
  }
  function warn(label, message) {
    console.warn(TAG, STYLE_TAG, `${label}:`, message);
  }
  function fail(label, err) {
    console.error(TAG, STYLE_TAG, `${label}:`, STYLE_ERR, err?.message || err);
    showErrorCard(`${label}`, err?.message || String(err));
  }

  // ---- optional on-page error card (uses nunjucks if available) -------------
  function showErrorCard(title, message) {
    try {
      if (window.nunjucks) {
        const host = document.querySelector('main.container') || document.body;
        const mount = document.createElement('div');
        host.prepend(mount);
        nunjucks.configure('templates');
        const html = nunjucks.render('error.njk', {
          title: `Validation error — ${title}`,
          message
        });
        mount.innerHTML = html;
        return;
      }
    } catch (_) {}
    const host = document.querySelector('main.container') || document.body;
    const card = document.createElement('article');
    card.className = 'card';
    card.style.border = '1px solid #e7e9ee';
    card.style.background = '#fff';
    card.style.borderRadius = '12px';
    card.style.padding = '16px';
    card.style.marginBottom = '16px';
    card.innerHTML = `
      <h3 style="margin:0 0 8px;color:#b42318">Validation error — ${escapeHtml(title)}</h3>
      <pre style="white-space:pre-wrap;margin:0;color:#4a4f57">${escapeHtml(message)}</pre>
    `;
    host.prepend(card);
  }
  const escapeHtml = s => String(s)
    .replaceAll('&','&amp;').replaceAll('<','&lt;')
    .replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');

  // ---- validators ------------------------------------------------------------
  async function validateHome() {
    const data = await fetchJSON('data/home.json');
    // Required in your file: snapshots[], optional: facts[]
    ensureKeys(data.snapshots, ['value','label'], 'home.snapshots');
    if (Array.isArray(data.facts)) {
      ensureKeys(data.facts, ['title','text'], 'home.facts');
    } else {
      warn('home', 'facts[] not present — skipping facts validation.');
    }
    // miniTimeline is NOT in your home.json; timeline is a separate file.
    ok('home', 'home.json');
  }

  async function validateTimeline() {
    const list = await fetchJSON('data/timeline.json');
    ensureKeys(list, ['year','title','text'], 'timeline');
    const badYears = list.filter(m => Number.isNaN(+m.year) || +m.year < 1980 || +m.year > 2100);
    if (badYears.length) {
      warn('timeline', `Unexpected year values: ${badYears.map(m => m.year).join(', ')}`);
    }
    ok('timeline', 'timeline.json');
  }

  async function validateGrowth() {
    const g = await fetchJSON('data/growth.json');
    // Your file has stats[], types[], speeds[], facts[].
    if (Array.isArray(g.stats)) ensureKeys(g.stats, ['label','value'], 'growth.stats');
    if (Array.isArray(g.types)) ensureKeys(g.types, ['name','share'], 'growth.types');
    if (Array.isArray(g.speeds)) ensureKeys(g.speeds, ['name','mbps'], 'growth.speeds');
    if (Array.isArray(g.facts))  ensureKeys(g.facts,  ['title','text'], 'growth.facts');
    ok('growth', 'growth.json');
  }

  async function validateIsps() {
    const isps = await fetchJSON('data/isps.json');
    ensureArray(isps, 'isps');
    // Your entries use mixed key names. Accept synonyms but warn if missing.
    const reports = [];
    isps.forEach((row, i) => {
      const name = row.name ?? row.title ?? row.provider;
      const logo = row.logo ?? row.logoUrl ?? row.icon;
      const avg  = row.avg  ?? row.speed   ?? row.bandwidth ?? row.mbps;
      const price= row.price?? row.cost    ?? row.monthly;
      const miss = [];
      if (!name) miss.push('name/title/provider');
      if (!logo) miss.push('logo/logoUrl/icon');
      if (!avg)  miss.push('avg/speed/bandwidth/mbps');
      if (!price)miss.push('price/cost/monthly');
      if (miss.length) {
        reports.push(` - isps[${i}]: missing ${miss.join(', ')}`);
      }
    });
    if (reports.length) {
      fail('isps', new Error(`Missing required keys:\n${reports.join('\n')}`));
    } else {
      ok('isps', 'isps.json');
    }
  }

  async function validatePenetration() {
    const p = await fetchJSON('data/penetration.json');
    // Accept either an array of {year,value} OR an object with series[].
    const series = Array.isArray(p) ? p
                 : Array.isArray(p.series) ? p.series
                 : null;
    if (!series) throw new Error('penetration must be an array OR an object with a series[] array');
    ensureKeys(series, ['year','value'], 'penetration.series');
    ok('penetration', 'penetration.json');
  }

  async function runAll() {
    console.groupCollapsed('%cData validation', 'color:#0366d6;font-weight:700');
    const tasks = [
      ['home',         validateHome],
      ['timeline',     validateTimeline],
      ['growth',       validateGrowth],
      ['isps',         validateIsps],
      ['penetration',  validatePenetration],
    ];
    for (const [label, fn] of tasks) {
      try { await fn(); }
      catch (e) { fail(label, e); }
    }
    console.groupEnd();
  }

  window.validator = { runAll };
  console.log(TAG, STYLE_TAG, 'ready — add ?validate=1 to the URL to run.');
  if (wantValidate) runAll();
})();
