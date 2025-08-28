/* ========== small utils ========== */
function q(sel){ return document.querySelector(sel); }
async function getJSON(path){
  const r = await fetch(path);
  if(!r.ok) throw new Error(`${path} (${r.status})`);
  return r.json();
}
function ensureKeys(arr, keys, where){
  if(!Array.isArray(arr)) throw new Error(`Invalid JSON in ${where}: expected array`);
  const bad = arr.find(o => !keys.every(k => k in o));
  if(bad){
    const missing = keys.filter(k => !(k in bad)).join(', ');
    throw new Error(`Invalid JSON in ${where}: missing ${missing}`);
  }
}
function errorCard(title, message){
  return `<div class="card" style="border-color:#f2b8b8">
    <h3>${title}</h3><p>${message}</p>
  </div>`;
}

/* ========== ticker (top-right) ========== */
export async function setNavTicker(){
  const el = q('.nav-ticker');
  if(!el) return;
  try{
    // Use the correct path for your repo. If your JSON is in /data, change to 'data/penetration.json'
    const pen = await getJSON('data/penetration.json');
    ensureKeys(pen.series, ['year','value'], 'penetration.series');
    const latest = pen.series[pen.series.length-1];
    el.textContent = `≈${latest.value}% of Egyptians are online (${latest.year}, demo)`;
  }catch{
    el.textContent = '≈58% of Egyptians are online (2025, demo)';
  }
}

/* ========== HOME ========== */
let homeCache=null;
async function getHomeData(){
  if(homeCache) return homeCache;
  homeCache = await getJSON('data/home.json').catch(()=>({}));
  return homeCache;
}
export async function renderHome(){
  setNavTicker().catch(()=>{});

  // snapshots
  try{
    const data = await getHomeData();
    const snaps = Array.isArray(data.snapshots) ? data.snapshots : [];
    ensureKeys(snaps, ['value','label'], 'home.snapshots');
    const html = snaps.map(s => `
      <div class="snapshot-card">
        <div class="snapshot-value">${s.value}</div>
        <div class="snapshot-label">${s.label}</div>
        ${s.caption ? `<p class="snapshot-caption">${s.caption}</p>` : ''}
      </div>
    `).join('');
    const slot = q('#home-snapshots'); if(slot) slot.innerHTML = html;
  }catch(e){
    const slot = q('#home-snapshots'); if(slot) slot.innerHTML = errorCard('Snapshot data', e.message);
  }

  // mini-timeline preview (first 6 items; render <li> directly → no bullets)
  try{
    const all = await getJSON('data/timeline.json');
    ensureKeys(all, ['year','title','text'], 'timeline');
    const items = all
      .filter(m => Number(m.year)>=2000 && Number(m.year)<=2025)
      .sort((a,b) => Number(a.year)-Number(b.year))
      .slice(0,6);
    const html = items.map(m => `
      <li>
        <span class="pill">${m.year}</span>
        <strong class="mini-tl-title">${m.title}</strong>
        <span class="mini-tl-text">${m.text}</span>
      </li>`).join('');
    const slot = q('#mini-tl'); if(slot) slot.innerHTML = html;
  }catch(e){
    const slot = q('section .mini-timeline'); if(slot) slot.innerHTML = errorCard('Timeline preview', e.message);
  }

  // ISPs
  try{
    const raw = await getJSON('data/isps.json');
    if(!Array.isArray(raw) || raw.length===0) throw new Error('Empty isps.json');
    const items = raw.map(i => ({
      name:  i.name ?? i.provider ?? i.title ?? '',
      logo:  i.logo ?? i.logoUrl ?? i.icon ?? '',
      avg:   i.avg  ?? i.speed    ?? i.mbps ?? '',
      price: i.price?? i.cost     ?? i.monthly ?? ''
    }));
    ensureKeys(items, ['name','avg','price'], 'isps (normalized)');
    const html = items.map(i => `
      <div class="isp-card">
        <div class="isp-logo">${i.logo ? `<img src="${i.logo}" alt="">` : ''}</div>
        <div>
          <h4 class="isp-name">${i.name}</h4>
          <p class="isp-speed">Avg speed: ${i.avg}</p>
          <p class="isp-price">Typical price: ${i.price}</p>
        </div>
      </div>`).join('');
    const slot = q('#isp-grid'); if(slot) slot.innerHTML = html;
  }catch(e){
    const slot = q('#isp-grid'); if(slot) slot.innerHTML = errorCard('ISP data', e.message);
  }

  // Did you know
  try{
    const data = await getHomeData();
    const facts = Array.isArray(data.facts) ? data.facts : [];
    ensureKeys(facts, ['title','text'], 'home.facts');
    const html = facts.map(f => `
      <div class="fact-card">
        <div class="fact-dot" aria-hidden="true"></div>
        <div>
          <h4 class="fact-title">${f.title}</h4>
          <p class="fact-text">${f.text}</p>
        </div>
      </div>`).join('');
    const slot = q('#facts-grid'); if(slot) slot.innerHTML = html;
  }catch(e){
    const slot = q('#facts-grid'); if(slot) slot.innerHTML = errorCard('Facts', e.message);
  }
}

/* ========== GROWTH ========== */
export async function renderGrowth(){
  setNavTicker().catch(()=>{});
  try{
    const pen   = await getJSON('data/penetration.json');
    const extra = await getJSON('data/growth.json');

    ensureKeys(pen.series, ['year','value'], 'penetration.series');
    if(Array.isArray(extra.stats))  ensureKeys(extra.stats,  ['value','label'], 'growth.stats');
    if(Array.isArray(extra.types))  ensureKeys(extra.types,  ['name','share'],  'growth.types');
    if(Array.isArray(extra.speeds)) ensureKeys(extra.speeds, ['name','mbps'],   'growth.speeds');
    if(Array.isArray(extra.facts))  ensureKeys(extra.facts,  ['title','text'],  'growth.facts');

    // KPI tiles
    const statsEl = q('#growth-stats');
    if(statsEl){
      statsEl.innerHTML = (extra.stats||[]).map(s => `
        <div class="stat-card">
          <div class="stat-value">${s.value}</div>
          <div class="stat-label">${s.label}</div>
          ${s.caption ? `<p class="stat-caption">${s.caption}</p>` : ''}
        </div>`).join('');
    }

    // charts are drawn in main.js (to keep this file standalone across pages)
    window.__GROWTH_DATA__ = { pen: pen.series || [], types: extra.types||[], speeds: extra.speeds||[] };

    // Highlights
    const factsEl = q('#growth-facts');
    if(factsEl){
      factsEl.innerHTML = (extra.facts||[]).map(f => `
        <div class="fact-card">
          <div class="fact-dot" aria-hidden="true"></div>
          <div>
            <h4 class="fact-title">${f.title}</h4>
            <p class="fact-text">${f.text}</p>
          </div>
        </div>`).join('');
    }
  }catch(e){
    const main = q('main');
    if(main) main.insertAdjacentHTML('beforeend', `<p style="color:#a00;margin-top:16px">Couldn’t load growth data: ${e.message}</p>`);
  }
}

/* ========== TIMELINE (3-up grid) ========== */
export async function renderTimeline(){
  setNavTicker().catch(()=>{});
  const wrap = q('#tl-masonry');
  if(!wrap) return;
  try{
    const all = await getJSON('data/timeline.json');
    ensureKeys(all, ['year','title','text'], 'timeline');
    const items = all
      .filter(m => Number(m.year)>=2000 && Number(m.year)<=2025)
      .sort((a,b)=> Number(a.year)-Number(b.year));
    wrap.innerHTML = items.map(m => `
      <article class="ms-card">
        <span class="pill">${m.year}</span>
        <h4 class="ms-title">${m.title}</h4>
        <p class="ms-text">${m.text}</p>
      </article>`).join('');
  }catch(e){
    wrap.innerHTML = errorCard('Timeline', e.message);
  }
}

/* ========== TODAY ========== */
export async function renderToday(){ setNavTicker().catch(()=>{}); }
