// -------- Nunjucks helper with fetch fallback --------
// Renders a Nunjucks template by name with the given context object.
// If the template isn't pre-registered, it fetches the file and renders from the source string.
function renderTpl(name, ctx = {}) {
  return new Promise(async (resolve, reject) => {
    window.nunjucks.render(name, ctx, async (err, html) => {
      if (!err && html != null) return resolve(html); // Primary path: template exists in Nunjucks environment.

      try {
        const res = await fetch(`templates/${name}`);  // Fallback: fetch template file by path.
        if (!res.ok) throw new Error(`Template fetch failed: ${name} (${res.status})`);
        const src = await res.text();                  // Read template source.
        resolve(window.nunjucks.renderString(src, ctx)); // Render from source string.
      } catch (e) { reject(e); }                      // If both fail, surface the error to caller.
    });
  });
}

/* ===================== SHARED HELPERS ===================== */

// Validate that each object in an array contains all required keys
// - arr: array to validate
// - keys: list of required property names
// - where: string used in error messages to identify the data source
function ensureKeys(arr, keys, where){
  if (!Array.isArray(arr)) throw new Error(`Invalid JSON in ${where}: expected an array`);
  const bad = arr.find(o => !keys.every(k => k in o));
  if (bad) {
    const missing = keys.filter(k => !(k in bad)).join(', ');
    throw new Error(`Invalid JSON in ${where}: missing ${missing}`);
  }
}

// Render an error card into a selector (uses templates/error.njk)
// If the error template is not available, it falls back to a simple inline card.
async function showError(sel, message, title = 'Data error'){
  const host = document.querySelector(sel);
  if (!host) return;
  try {
    host.innerHTML = await renderTpl('error.njk', { title, message });
  } catch {
    host.innerHTML = `<div class="card" style="border-color:#f2b8b8">
        <h3>${title}</h3><p>${message}</p>
      </div>`;
  }
}

// Small helper for JSON
// Uses fetch and throws a helpful error if the HTTP status is not OK.
async function getJSON(path){
  const r = await fetch(path, { cache: 'no-store' });
  if (!r.ok) throw new Error(`${path} (${r.status})`);
  return r.json();
}

/* ===================== NAV TICKER (quick fact in header) ===================== */
// Populates the small "quick fact" text in the header with the latest penetration figure.
// Falls back to a demo string if penetration.json isn't available.
async function setNavTicker(){
  const el = document.querySelector('.nav-ticker');
  if (!el) return;
  try {
    // Prefer penetration.json → last point
    const pen = await getJSON('data/penetration.json');
    ensureKeys(pen.series, ['year','value'], 'penetration.series');
    const latest = pen.series[pen.series.length - 1]; // Pick the most recent year.
    el.textContent = `≈${latest.value}% of Egyptians are online (${latest.year}, demo)`;
  } catch {
    // Fallback
    el.textContent = '≈58% of Egyptians are online (2025, demo)';
  }
}

/* ===================== HOME ===================== */
// Simple cache so we only fetch home.json once per session.
let homeCache = null;
async function getHomeData(){
  if (homeCache) return homeCache;
  homeCache = await getJSON('data/home.json').catch(()=>({}));
  return homeCache;
}

/export async function renderHome(){
  setNavTicker().catch(()=>{});

  // Remove any stray fallback list that some browsers/readers may inject
  const badList = document.querySelector('#home-glance > h2#glance-title + ul');
  if (badList) badList.remove();

  // snapshots
  try{
    const data = await getHomeData();
    const snaps = Array.isArray(data.snapshots) ? data.snapshots : [];
    ensureKeys(snaps, ['value','label'], 'home.snapshots');

    const cards = await Promise.all(snaps.map(s => renderTpl('snapshot.njk', s)));
    const slot = document.querySelector('#home-snapshots');
    if (slot) slot.innerHTML = cards.join('');
  }catch(e){
    await showError('#home-snapshots', e.message);
  }

  // mini timeline preview
  try{
    const all = await getJSON('data/timeline.json');
    ensureKeys(all, ['year','title','text'], 'timeline');
    const items = all
      .filter(m => Number(m.year) >= 2000 && Number(m.year) <= 2025)
      .sort((a,b) => Number(a.year) - Number(b.year))
      .slice(0, 6);
    const html = await renderTpl('mini-timeline.njk', { items });
    const slot = document.querySelector('#mini-tl');
    if (slot) slot.innerHTML = html;
  }catch(e){
    await showError('section .mini-timeline', e.message, 'Timeline preview');
  }

  // ISPs + Facts
  await renderISPsInto('#isp-grid').catch(async e=>{
    await showError('#isp-grid', e.message, 'ISP data');
  });
  await renderFactsInto('#facts-grid').catch(async e=>{
    await showError('#facts-grid', e.message, 'Facts');
  });
}

  // mini timeline preview
  try{
    const all = await getJSON('data/timeline.json');
    ensureKeys(all, ['year','title','text'], 'timeline');
    const items = all
      .filter(m => Number(m.year) >= 2000 && Number(m.year) <= 2025)
      .sort((a,b) => Number(a.year) - Number(b.year))
      .slice(0, 6);
    const html = await renderTpl('mini-timeline.njk', { items });
    const slot = document.querySelector('#mini-tl');
    if (slot) slot.innerHTML = html;
  }catch(e){
    await showError('section .mini-timeline', e.message, 'Timeline preview');
  }

  // ISPs + Facts
  await renderISPsInto('#isp-grid').catch(async e=>{
    await showError('#isp-grid', e.message, 'ISP data');
  });
  await renderFactsInto('#facts-grid').catch(async e=>{
    await showError('#facts-grid', e.message, 'Facts');
  });
}

/* ===================== GROWTH ===================== */
export async function renderGrowth(){
  setNavTicker().catch(()=>{});

  try{
    const pen   = await getJSON('data/penetration.json');        // { series:[{year,value}] }
    const extra = await getJSON('data/growth.json');             // { stats, types, speeds, facts }

    ensureKeys(pen.series, ['year','value'], 'penetration.series');
    if (Array.isArray(extra.stats))   ensureKeys(extra.stats,  ['value','label'], 'growth.stats');
    if (Array.isArray(extra.types))   ensureKeys(extra.types,  ['name','share'],  'growth.types');
    if (Array.isArray(extra.speeds))  ensureKeys(extra.speeds, ['name','mbps'],   'growth.speeds');
    if (Array.isArray(extra.facts))   ensureKeys(extra.facts,  ['title','text'],  'growth.facts');

    renderStats(extra.stats||[]);
    drawUsersTrend(pen.series||[]);
    drawTypeDonut(extra.types||[]);
    drawSpeedBars(extra.speeds||[]);
    renderFacts(extra.facts||[]);
  }catch(e){
    const main = document.querySelector('main');
    if (main) {
      main.insertAdjacentHTML('beforeend',
        `<p style="color:#a00;margin-top:16px">Couldn’t load growth data: ${e.message}</p>`);
    }
  }
}

// KPI tiles
function renderStats(stats=[]){
  const el = document.querySelector('#growth-stats');
  if(!el) return;
  el.innerHTML = stats.map(s => `
    <div class="stat-card">
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label}</div>
      ${s.caption ? `<p class="stat-caption">${s.caption}</p>` : ''}
    </div>
  `).join('');
}

// Chart instances
let usersChart,typeChart,speedChart;

// Users over time (line)
function drawUsersTrend(series){
  const labels = series.map(p=>p.year);
  const values = series.map(p=>p.value);
  const ctx = document.getElementById('usersChart');
  if(!ctx || !window.Chart) return;
  if(usersChart) usersChart.destroy();
  usersChart = new Chart(ctx, {
    type:'line',
    data:{ labels, datasets:[{ data:values, fill:true }] },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:false } },
      elements:{ line:{ tension:.35 }, point:{ radius:4 } },
      scales:{ y:{ suggestedMin:10, suggestedMax:60 } }
    }
  });
}

// How people connect (donut)
function drawTypeDonut(types){
  const ctx = document.getElementById('typeChart');
  if(!ctx || !window.Chart) return;
  if(typeChart) typeChart.destroy();
  typeChart = new Chart(ctx, {
    type:'doughnut',
    data:{ labels: types.map(t=>t.name), datasets:[{ data: types.map(t=>t.share) }] },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'bottom' } },
      cutout:'60%'
    }
  });
}

// Average download speeds (bar)
function drawSpeedBars(speeds){
  const ctx = document.getElementById('speedChart');
  if(!ctx || !window.Chart) return;
  if(speedChart) speedChart.destroy();
  speedChart = new Chart(ctx, {
    type:'bar',
    data:{
      labels: speeds.map(s=>s.name),
      datasets:[{ data: speeds.map(s=>s.mbps) }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:false } },
      scales:{ y:{ beginAtZero:true } }
    }
  });
}

// Growth “Highlights”
function renderFacts(facts=[]){
  const el = document.querySelector('#growth-facts');
  if(!el) return;
  el.innerHTML = facts.map(f => `
    <div class="fact-card">
      <div class="fact-dot" aria-hidden="true"></div>
      <div>
        <h4 class="fact-title">${f.title}</h4>
        <p class="fact-text">${f.text}</p>
      </div>
    </div>
  `).join('');
}

/* ===================== TIMELINE ===================== */
export async function renderTimeline(){
  setNavTicker().catch(()=>{});

  const wrap = document.getElementById('tl-masonry');
  if(!wrap) return;

  try{
    const all = await getJSON('data/timeline.json');
    ensureKeys(all, ['year','title','text'], 'timeline');

    const items = all
      .filter(m => Number(m.year) >= 2000 && Number(m.year) <= 2025)
      .sort((a,b)=> Number(a.year) - Number(b.year));

    wrap.innerHTML = items.map(m => `
      <article class="ms-card">
        <span class="pill">${m.year}</span>
        <h4 class="ms-title">${m.title}</h4>
        <p class="ms-text">${m.text}</p>
      </article>
    `).join('');
  }catch(e){
    await showError('#tl-masonry', e.message, 'Timeline');
  }
}

/* ===================== TODAY ===================== */
export async function renderToday(){
  setNavTicker().catch(()=>{});
  // static article page
}

/* ===================== SHARED RENDERERS ===================== */
// ISPs
async function renderISPsInto(sel){
  const el = document.querySelector(sel);
  if (!el) return;

  try{
    const raw = await getJSON('data/isps.json');
    if (!Array.isArray(raw) || raw.length === 0) throw new Error('Empty isps.json');

    const normalized = raw.map(i => ({
      name:  i.name ?? i.provider ?? i.title ?? '',
      logo:  i.logo ?? i.logoUrl ?? i.icon ?? '',
      avg:   i.avg  ?? i.speed    ?? i.mbps ?? i.bandwidth ?? '',
      price: i.price?? i.cost     ?? i.monthly ?? ''
    }));

    ensureKeys(normalized, ['name','avg','price'], 'isps (normalized)');

    const parts = await Promise.all(
      normalized.map(i => renderTpl('isp-card.njk', i))
    );
    el.innerHTML = parts.join('');

  }catch(e){
    await showError(sel, e.message, 'ISP data');
  }
}

// “Did you know?” facts on Home
async function renderFactsInto(sel){
  const el = document.querySelector(sel);
  if (!el) return;
  const data = await getHomeData();
  const facts = Array.isArray(data.facts) ? data.facts : [];
  ensureKeys(facts, ['title','text'], 'home.facts');

  const parts = await Promise.all(facts.map(f => renderTpl('fact.njk', f)));
  el.innerHTML = parts.join('');
}

