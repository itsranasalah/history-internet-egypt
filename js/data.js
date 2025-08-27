/* Demo data used by renderers + validator. Edit freely. */

// ---------- HOME ----------
window.HOME_DATA = {
  snapshots: [
    { value: "≈58%", label: "People online (2025)", caption: "share of population (demo)" },
    { value: "≈75%", label: "Households with internet", caption: "urban + rural (demo)" },
    { value: "Mobile", label: "Most-used access", caption: "mobile-first usage pattern" }
  ],
  isps: [
    { name: "Vodafone", speedMbps: 15, priceEgp: 360, logo: "assets/img/isp/vodafone.png" },
    { name: "Orange",   speedMbps: 20, priceEgp: 350, logo: "assets/img/isp/orange.png" },
    { name: "WE",       speedMbps: 10, priceEgp: 250, logo: "assets/img/isp/we.png" },
    { name: "Etisalat", speedMbps: 25, priceEgp: 400, logo: "assets/img/isp/etisalat.png" }
  ],
  facts: [
    { title: "Dial-up to fiber", text: "In two decades, home access jumped from dial-up lines to fiber and 4G." },
    { title: "App habits",      text: "Many users’ first contact with the web was through mobile apps, not browsers." },
    { title: "Local hosting",   text: "Growing data-center capacity helps keep popular content closer to users." }
  ]
};

// ---------- TIMELINE ----------
window.TIMELINE_DATA = {
  milestones: [
    { year: 2000, title: "Dial-up becomes common", text: "Access via dial-up from ISPs such as TE Data; cafés popularize public access." },
    { year: 2001, title: "Internet cafés & portals", text: "Cafés spread; local web portals and forums become destinations." },
    { year: 2002, title: "Early broadband pilots", text: "ADSL pilot projects appear for homes and small businesses." },
    { year: 2003, title: "Always-on connections", text: "ADSL trials expand; ‘always-on’ begins replacing dial-up." },
    { year: 2006, title: "ADSL goes mainstream", text: "Lower entry prices and bundled modems bring ADSL to more homes." },
    { year: 2007, title: "Social networks arrive", text: "Early adoption grows; photo-sharing and messaging move online." },
    { year: 2008, title: "ADSL expansion & speed bumps", text: "Wider coverage and higher entry speeds accelerate shift away from dial-up." },
    { year: 2009, title: "USB modems & mobile data", text: "Prepaid mobile broadband sticks offer flexible laptop access." },
    { year: 2010, title: "3G era", text: "Smartphones spread; mobile usage climbs with app stores and maps." },
    { year: 2011, title: "Social media surges", text: "News and live video shift to social platforms during major events." },
    { year: 2013, title: "Government services go online", text: "Public-service portals expand for payments and forms." },
    { year: 2014, title: "Backbone upgrades", text: "National fiber backbone and international capacity improve latency." },
    { year: 2015, title: "4G preparations", text: "Spectrum refarming and trials prepare networks." },
    { year: 2016, title: "LTE licensing & rollout prep", text: "Operators secure spectrum; device ecosystem matures." },
    { year: 2017, title: "4G LTE launch", text: "Nationwide services arrive; typical speeds jump." },
    { year: 2018, title: "Fiber closer to homes", text: "FTTx build-outs expand; higher-speed plans appear." },
    { year: 2020, title: "COVID-19 demand surge", text: "Remote work and classes push record traffic; operators boost capacity." },
    { year: 2022, title: "Digital payments mainstream", text: "E-payments, QR and utility top-ups within super-apps become routine." },
    { year: 2023, title: "Cloud & data centers", text: "New capacity and on-ramps reduce latency for local users and businesses." },
    { year: 2024, title: "FTTH coverage widens", text: "More districts gain full-fiber options; base plans increase in speed." },
    { year: 2025, title: "Most Egyptians online", text: "A majority of the population uses the internet regularly." }
  ]
};

// ---------- GROWTH ----------
window.GROWTH_DATA = {
  stats: [
    { label: "People online (2025)", value: "58%", caption: "share of population (demo)" },
    { label: "Households with internet", value: "75%", caption: "urban + rural (demo)" }
  ],
  types: [
    { name: "Mobile data", share: 70 },
    { name: "Fixed (ADSL/Fiber)", share: 30 }
  ],
  speeds: [
    { name: "Mobile (avg Mbps)", mbps: 35 },
    { name: "Fixed (avg Mbps)",  mbps: 55 }
  ],
  facts: [
    { title: "Payments", text: "Top-ups, bills and subscriptions are simpler via e-payments." },
    { title: "Coverage", text: "Broader 4G footprint; pilot 5G zones appear." },
    { title: "Fiber closer", text: "Exchange upgrades and FTTH in dense areas." }
  ]
};
