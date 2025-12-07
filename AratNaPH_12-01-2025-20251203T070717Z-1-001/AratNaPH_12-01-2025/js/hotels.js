// hotels.js - render hotel cards from data/hotels.json

function formatPrice(v){
  try{ return new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(Number(v)); }
  catch(e){ return '₱'+v; }
}

function hotelCardHTML(h){
  return `
  <div class="card clickable" data-id="${h.id}">
    <img src="${h.image}" alt="${h.name}">
    <div class="info">
      <h3>${h.name}</h3>
      <p>${h.short}</p>
      <div class="location">📍 ${h.location}</div>
      <div class="rating">${h.ratingLabel} <span class="score">${h.score}</span></div>
      <button class="btn" data-url="${h.detailsUrl}">See Prices</button>
    </div>
  </div>
  `;
}

function attachHandlers(container){
  container.addEventListener('click', (e)=>{
    // find nearest card
    const card = e.target.closest('.card.clickable');
    if(!card) return;
    const btn = e.target.closest('.btn');
    const url = btn ? btn.getAttribute('data-url') : null;
    if(url){ window.location.href = url; return; }
    // otherwise click the card open details
    const idxUrl = card.querySelector('.btn') ? card.querySelector('.btn').getAttribute('data-url') : null;
    if(idxUrl) window.location.href = idxUrl;
  });
}

function renderHotels(list){
  const grid = document.getElementById('hotel-grid');
  if(!grid) return;
  if(list.length === 0){
    grid.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:#666;">No hotels available.</div>';
    return;
  }
  grid.innerHTML = list.map(hotelCardHTML).join('\n');
  attachHandlers(grid);
}

// init
document.addEventListener('DOMContentLoaded', ()=>{
  fetch('data/hotels.json')
    .then(r=>r.json())
    .then(data=>{
      renderHotels(data);
    })
    .catch(err=>{
      console.error('Failed to load hotels.json', err);
      const grid = document.getElementById('hotel-grid');
      if(grid) grid.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:#900;">Failed to load hotels.</div>';
    });
});
