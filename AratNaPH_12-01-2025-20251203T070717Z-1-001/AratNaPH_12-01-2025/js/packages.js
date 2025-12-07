// packages.js - render package cards from data/tours.json and enable client-side filters

let TOURS = [];

function formatCurrencyPHP(v){
  try{ return new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(Number(v)); }catch(e){ return '₱'+v; }
}

function createCardHTML(tour){
  return `
  <div class="card" data-price="${tour.price}" data-destination="${tour.destination}">
    <img src="${tour.image}" alt="${tour.title}" loading="lazy" data-id="${tour.id || ''}" data-images='${JSON.stringify(tour.images || [tour.image])}' onerror="this.onerror=null;this.src='images/placeholder.svg'">
    <div class="info">
      <h3><a href="${tour.detailsUrl}">${tour.title}</a></h3>
      <p>${tour.description}</p>
      <div class="details"><i class="fas fa-clock"></i> ${tour.duration}</div>
      <div class="booking-bar">
        <div class="price">${formatCurrencyPHP(tour.price)}</div>
        <button onclick="window.location.href='${tour.detailsUrl}'">View Details</button>
      </div>
    </div>
  </div>
  `;
}

function renderGrid(list){
  const grid = document.getElementById('package-grid');
  if(!grid) return;
  if(list.length === 0){
    grid.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:#666;">No packages match your filters.</div>';
    return;
  }
  grid.innerHTML = list.map(createCardHTML).join('\n');
  // attach gallery handlers for images rendered in cards
  attachGalleryHandlers();
}

function attachGalleryHandlers(){
  const grid = document.getElementById('package-grid');
  if(!grid) return;
  const imgs = grid.querySelectorAll('.card img');
  imgs.forEach((img)=>{
    // avoid double-binding
    if(img.dataset.galleryAttached) return;
    img.dataset.galleryAttached = '1';
    img.style.cursor = 'pointer';
    img.addEventListener('click', ()=>{
      try{
        const data = img.getAttribute('data-images');
        const imgsList = data ? JSON.parse(data) : [img.src];
        if(window.Gallery) Gallery.open(imgsList, 0);
        else window.open(img.src, '_blank');
      }catch(e){ window.open(img.src, '_blank'); }
    });
  });
}

function applyFilters(){
  const priceFilter = document.getElementById('price-filter').value;
  const destinationFilter = document.getElementById('destination-filter').value;

  const filtered = TOURS.filter(t => {
    let okPrice = true;
    let okDest = true;
    if(priceFilter === 'under10k') okPrice = Number(t.price) < 10000;
    else if(priceFilter === 'over10k') okPrice = Number(t.price) >= 10000;
    if(destinationFilter && destinationFilter !== 'all') okDest = t.destination === destinationFilter;
    return okPrice && okDest;
  });
  renderGrid(filtered);
}

// Initialize
document.addEventListener('DOMContentLoaded', ()=>{
  fetch('data/tours.json')
    .then(r => r.json())
    .then(data => {
      TOURS = data;
      renderGrid(TOURS);

      // wire filters
      const dest = document.getElementById('destination-filter');
      const price = document.getElementById('price-filter');
      if(dest) dest.addEventListener('change', applyFilters);
      if(price) price.addEventListener('change', applyFilters);

      // if query params exist (e.g., ?destination=cebu) apply it
      const params = new URLSearchParams(location.search);
      const qdest = params.get('destination');
      const qprice = params.get('price');
      if(qdest){
        const el = document.getElementById('destination-filter');
        if(el) el.value = qdest;
      }
      if(qprice){
        const el = document.getElementById('price-filter');
        if(el) el.value = qprice;
      }
      // apply filters after settings
      applyFilters();
    })
    .catch(err => {
      console.error('Failed to load tours.json', err);
      // leave existing static cards if any, or show message
      const grid = document.getElementById('package-grid');
      if(grid) grid.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:#900;">Failed to load packages.</div>';
    });
});

// Backwards-compatible wrapper for inline onchange handlers in HTML
function filterPackages(){ if(typeof applyFilters === 'function') applyFilters(); }
