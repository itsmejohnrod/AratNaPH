// hotel-detail.js - load hotel by id from data/hotels.json and render page

let HOTEL = null;
let currentImageIndex = 0;
let selectedRoom = null;

function fmt(v){
  try{ return new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(Number(v)); }catch(e){ return '₱'+v; }
}

function nightsBetween(a,b){
  const A=new Date(a); const B=new Date(b); const diff=Math.round((B-A)/(1000*60*60*24)); return Math.max(1,diff);
}

function updateCarousel(){
  const img = document.getElementById('carousel-image');
  if(!HOTEL || !HOTEL.images || HOTEL.images.length===0) { img.src='images/Hotel1.jpg'; return; }
  img.src = HOTEL.images[currentImageIndex%HOTEL.images.length];
}

function renderHotel(){
  if(!HOTEL) return;
  document.title = HOTEL.name + ' — AratNaPH';
  document.getElementById('hotel-name').textContent = HOTEL.name;
  document.getElementById('hotel-address').textContent = HOTEL.location;
  document.getElementById('hotel-rating').textContent = `${HOTEL.ratingLabel} ${HOTEL.score}`;
  document.getElementById('hotel-reviews').textContent = `${HOTEL.reviews ? HOTEL.reviews.length : 0} reviews`;
  document.getElementById('hotel-description').textContent = HOTEL.description || '';
  document.getElementById('price-badge').textContent = fmt(HOTEL.priceFrom || (HOTEL.rooms && HOTEL.rooms[0] && HOTEL.rooms[0].price) || 0);

  // amenities
  const am = document.getElementById('amenities-list');
  am.innerHTML = (HOTEL.amenities || []).map(a=>`<div class="flex gap-2"><i class="fas fa-check text-blue-500"></i>${a}</div>`).join('');

  // images
  currentImageIndex = 0; updateCarousel();

  // rooms
  const rooms = document.getElementById('rooms-list');
  rooms.innerHTML = (HOTEL.rooms || []).map(r=>`
    <article class="p-4 border rounded bg-white flex justify-between items-center">
      <div>
        <div class="font-semibold">${r.name}</div>
        <div class="text-sm text-gray-600">Capacity: ${r.capacity} • ${r.refundable ? 'Free cancellation' : 'Non-refundable'}</div>
      </div>
      <div class="text-right">
        <div class="text-lg font-bold">${fmt(r.price)}</div>
        <div class="mt-2">
          <button onclick="selectRoom('${r.id}')" class="px-3 py-1 border rounded hover:bg-gray-50">Select</button>
        </div>
      </div>
    </article>
  `).join('');

  // select first room
  selectedRoom = HOTEL.rooms && HOTEL.rooms[0] ? HOTEL.rooms[0] : null;
  updateBooking();
}

function selectRoom(roomId){
  selectedRoom = HOTEL.rooms.find(r=>r.id===roomId) || selectedRoom;
  // re-render rooms to show selection highlight (not implemented visually but will update booking)
  updateBooking();
}

function updateBooking(){
  if(!selectedRoom) return;
  const checkIn = document.getElementById('check-in').value;
  const checkOut = document.getElementById('check-out').value;
  if(!checkIn || !checkOut){
    // set defaults
    const now = new Date(); now.setDate(now.getDate()+7);
    const next = new Date(now); next.setDate(next.getDate()+1);
    document.getElementById('check-in').value = now.toISOString().slice(0,10);
    document.getElementById('check-out').value = next.toISOString().slice(0,10);
  }
  const ci = document.getElementById('check-in').value;
  const co = document.getElementById('check-out').value;
  const nights = nightsBetween(ci, co);
  const total = (selectedRoom.price||0) * nights;
  document.getElementById('selected-room-name').textContent = selectedRoom.name;
  document.getElementById('selected-room-price').textContent = `${fmt(selectedRoom.price)} / night`;
  document.getElementById('total-price').textContent = fmt(total);
  document.getElementById('nights-count').textContent = `Total for ${nights} night(s)`;
}

function handleBook(){
  const guests = document.getElementById('guests').value;
  const msg = document.getElementById('booking-message');
  msg.textContent = 'Processing booking...';
  setTimeout(()=>{ msg.textContent = `Booking confirmed! (demo) — ${selectedRoom.name} for ${guests} guest(s).`; },700);
}

function getParamId(){
  const params = new URLSearchParams(location.search);
  return params.get('id');
}

// init
document.addEventListener('DOMContentLoaded', ()=>{
  fetch('data/hotels.json').then(r=>r.json()).then(list=>{
    const id = getParamId() || list[0].id;
    HOTEL = list.find(h=>h.id===id) || list[0];
    renderHotel();

    // wire inputs
    document.getElementById('check-in').addEventListener('change', updateBooking);
    document.getElementById('check-out').addEventListener('change', updateBooking);
    document.getElementById('guests').addEventListener('change', updateBooking);
    document.getElementById('reserve-btn').addEventListener('click', handleBook);

    // allow clicking main image to open gallery
    document.getElementById('carousel-image').addEventListener('click', ()=>{
      if(window.Gallery && HOTEL && HOTEL.images){
        Gallery.open(HOTEL.images, currentImageIndex);
      } else {
        currentImageIndex = (currentImageIndex+1) % (HOTEL.images.length||1); updateCarousel();
      }
    });
  }).catch(err=>{
    console.error('failed to load hotels.json', err);
  });
});
