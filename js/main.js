// js/main.js
// High-level: bootstraps the UI for every page.
// - Adds a sliding underline to the active/hovered navbar link
// - Rotates a small “quick-facts” ticker in the header
// - Configures Nunjucks templating
// - Routes to the correct page renderer (home/growth/timeline/today) via <body data-page="...">

// ---------- Sliding underline for the navbar ----------
// Creates/positions a red underline that slides to whichever nav link is active or hovered.
function initNavUnderline(){
  const container = document.querySelector('header.navbar .container');
  if (!container) return;

  // Reuse an existing underline element if present; otherwise create it.
  let underline = container.querySelector('.nav-underline');
  if (!underline) {
    underline = document.createElement('span');
    underline.className = 'nav-underline';
    container.appendChild(underline);
  }

  // Gather all nav links and detect the "current" one via aria-current.
  const links = [...container.querySelectorAll('a')];
  const active = container.querySelector('a[aria-current="page"]') || links[0];

  // Moves the underline to sit under a specific link.
  function moveTo(link){
    if (!link) return;
    const cRect = container.getBoundingClientRect();
    const r = link.getBoundingClientRect();
    const left = r.left - cRect.left;
    underline.style.width = `${r.width}px`;
    underline.style.transform = `translateX(${left}px)`;
  }

  // Initial placement under the current/first link.
  moveTo(active);

  // Hover/focus interactions slide the underline to the corresponding link.
  links.forEach(a=>{
    a.addEventListener('mouseenter', ()=>moveTo(a));
    a.addEventListener('focus',     ()=>moveTo(a));
  });

  // When the pointer leaves the nav area or the window resizes,
  // snap the underline back to the current page link.
  container.addEventListener('mouseleave', ()=>moveTo(
    container.querySelector('a[aria-current="page"]') || active
  ));
  window.addEventListener('resize', ()=>moveTo(
    container.querySelector('a[aria-current="page"]') || active
  ));
}

// ---------- NEW: Quick-facts ticker ----------
// Rotates a short list of headline facts in the header (static demo values).
function initNavTicker(){
  const el = document.querySelector('.nav-ticker');
  if(!el) return;

  // Static demo facts. If you want live data, we can wire these to JSON later.
  const facts = [
    '≈58% of Egyptians are online (2025, demo)',
    '≈75% of households have internet (demo)',
    'Average mobile speed ≈ 35 Mbps (demo)',
    'Average fixed speed ≈ 55 Mbps (demo)'
  ];

  // Cycles through the list and injects a <span> with the current fact.
  let i = 0;
  const show = () => {
    el.innerHTML = `<span>${facts[i]}</span>`;
    i = (i + 1) % facts.length;
  };

  // Show the first fact immediately, then rotate on a timer.
  show();
  setInterval(show, 3600);
}

// ---------- Page boot ----------
// Runs after DOM is ready:
// 1) sets up navbar polish (underline + ticker)
// 2) configures Nunjucks template engine
// 3) lazy-loads the appropriate renderer based on body[data-page]
window.addEventListener('DOMContentLoaded', () => {
  // Navbar polish
  initNavUnderline();
  initNavTicker();

  // Templating
  const nj = window.nunjucks;
  if (!nj) { console.error('Nunjucks failed to load.'); return; }
  nj.configure('templates', { autoescape: true, web: { useCache: false } });

  // Simple page router (uses data-page on <body>)
  const page = document.body.dataset.page;
  if (page === 'home') {
    import('./render.js').then(m => m.renderHome());
  } else if (page === 'growth') {
    import('./render.js').then(m => m.renderGrowth());
  } else if (page === 'timeline') {
    import('./render.js').then(m => m.renderTimeline());
  } else if (page === 'today') {
    import('./render.js').then(m => m.renderToday?.());
  }
});