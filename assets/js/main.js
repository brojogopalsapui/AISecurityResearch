const btn = document.querySelector('.menu-btn');
const nav = document.querySelector('.nav');
if (btn && nav) {
  btn.addEventListener('click', () => nav.classList.toggle('open'));
}


const zoomableImages = document.querySelectorAll('.zoom-img');

if (zoomableImages.length) {
  const overlay = document.createElement('div');
  overlay.className = 'image-lightbox';
  overlay.innerHTML = `
    <div class="image-lightbox__dialog" role="dialog" aria-modal="true" aria-label="Expanded diagram view">
      <button class="image-lightbox__close" type="button" aria-label="Close expanded image">×</button>
      <img class="image-lightbox__img" alt="Expanded diagram" />
    </div>
  `;
  document.body.appendChild(overlay);

  const overlayImg = overlay.querySelector('.image-lightbox__img');
  const closeBtn = overlay.querySelector('.image-lightbox__close');

  const closeLightbox = () => {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  };

  zoomableImages.forEach((img) => {
    img.addEventListener('click', () => {
      overlayImg.src = img.currentSrc || img.src;
      overlayImg.alt = img.alt;
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  closeBtn.addEventListener('click', closeLightbox);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) closeLightbox();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay.classList.contains('open')) closeLightbox();
  });
}
