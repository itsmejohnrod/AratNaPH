// gallery.js - simple, dependency-free lightbox with prev/next, thumbnails, keyboard support

const Gallery = (function(){
  const modal = document.getElementById('gallery-modal');
  const mainImage = document.getElementById('gallery-main-image');
  const thumbs = document.getElementById('gallery-thumbs');
  const closeBtn = modal ? modal.querySelector('.gallery-close') : null;
  const nextBtn = modal ? modal.querySelector('.gallery-next') : null;
  const prevBtn = modal ? modal.querySelector('.gallery-prev') : null;
  const backdrop = modal ? modal.querySelector('.gallery-backdrop') : null;

  let images = [];
  let index = 0;
  let lastActiveThumb = null;
  const _preloaded = Object.create(null);

  function ensureDOM(){
    if(!modal) return false;
    // ensure main image has a smooth fade transition and inject blur CSS
    if(mainImage && !mainImage.style.transition){
      mainImage.style.transition = 'opacity .28s ease-in-out';
      // start hidden until first load
      mainImage.style.opacity = '0';
    }
    if(!document.getElementById('gallery-blur-style')){
      const s = document.createElement('style');
      s.id = 'gallery-blur-style';
      s.textContent = `
        #gallery-main-image.loading { filter: blur(10px) scale(1.02); transition: filter .36s ease, transform .36s ease, opacity .28s ease; }
        #gallery-main-image { transition: opacity .28s ease-in-out, filter .36s ease; will-change: opacity, filter; }
      `;
      document.head.appendChild(s);
    }
    return true;
  }

  function open(list, startIndex=0){
    if(!ensureDOM()) return;
    images = Array.isArray(list) ? list : [];
    index = Math.max(0, Math.min(startIndex || 0, images.length-1));
    // prefetch images for smoother transitions
    preloadImages(images);
    renderThumbs();
    showAt(index);
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
  }

  function close(){
    if(!ensureDOM()) return;
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
  }

  function showAt(i){
    if(images.length===0) return;
    index = (i + images.length) % images.length;
    // Use preloaded Image if available to reduce flicker and fade when loaded
    const src = images[index];
    mainImage.alt = `Photo ${index+1} of ${images.length}`;
    // prepare fade-out
    if(mainImage) mainImage.style.opacity = '0';

    const setSrcAndFade = (finalSrc, alreadyLoaded)=>{
      if(!mainImage) return;
      // mark as loading to apply blur
      mainImage.classList.add('loading');
      if(alreadyLoaded){
        // set src then fade in on next frame, then remove blur class
        mainImage.src = finalSrc;
        requestAnimationFrame(()=>{ requestAnimationFrame(()=>{ mainImage.style.opacity = '1'; mainImage.classList.remove('loading'); }); });
      } else {
        // attach one-time load handler
        const onLoad = function(){
          mainImage.style.opacity = '1';
          mainImage.classList.remove('loading');
          mainImage.removeEventListener('load', onLoad);
        };
        mainImage.addEventListener('load', onLoad);
        mainImage.src = finalSrc;
      }
    };

    try{
      if(_preloaded[src] && _preloaded[src].complete){
        setSrcAndFade(_preloaded[src].src, true);
      } else {
        // begin preloading for this and surrounding images
        preloadImages(images);
        setSrcAndFade(src, false);
      }
    }catch(e){
      // fallback: set immediately
      mainImage.src = src;
      mainImage.style.opacity = '1';
    }
    // highlight thumb
    const imgs = thumbs.querySelectorAll('img');
    imgs.forEach((el, idx) => el.classList.toggle('active', idx===index));
  }

  function next(){ showAt(index+1); }
  function prev(){ showAt(index-1); }

  function renderThumbs(){
    if(!thumbs) return;
    // create thumbnail elements; use preloaded images as sources when available
    thumbs.innerHTML = images.map((src, i)=>{
      const thumbSrc = _preloaded[src] && _preloaded[src].src ? _preloaded[src].src : src;
      return `<img src="${thumbSrc}" data-index="${i}" alt="thumb-${i}">`;
    }).join('');
    // attach click handlers
    thumbs.querySelectorAll('img').forEach(img=>{
      img.addEventListener('click', e => {
        const idx = Number(img.getAttribute('data-index'));
        showAt(idx);
      });
    });
  }

  function preloadImages(list){
    if(!Array.isArray(list)) return;
    list.forEach(src => {
      if(!src) return;
      if(_preloaded[src]) return;
      try{
        const img = new Image();
        img.src = src;
        // Optionally set crossOrigin if images come from CDN
        _preloaded[src] = img;
      }catch(e){ /* ignore preload errors */ }
    });
  }

  function onKey(e){
    if(e.key === 'Escape') { close(); }
    else if(e.key === 'ArrowRight') { next(); }
    else if(e.key === 'ArrowLeft') { prev(); }
  }

  function onDocClick(e){
    if(!modal) return;
    const action = e.target.getAttribute('data-action');
    if(action === 'close') close();
    if(action === 'next') next();
    if(action === 'prev') prev();
  }

  // wire events
  if(backdrop) backdrop.addEventListener('click', onDocClick);
  if(closeBtn) closeBtn.addEventListener('click', onDocClick);
  if(nextBtn) nextBtn.addEventListener('click', onDocClick);
  if(prevBtn) prevBtn.addEventListener('click', onDocClick);

  return { open, close, next, prev };
})();
