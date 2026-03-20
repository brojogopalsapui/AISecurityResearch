const btn = document.querySelector('.menu-btn');
const nav = document.querySelector('.nav');

if (btn && nav) {
  btn.addEventListener('click', () => nav.classList.toggle('open'));
}

document.addEventListener('DOMContentLoaded', () => {
  const expandButtons = document.querySelectorAll('.img-expand-btn');

  if (!expandButtons.length) return;

  const overlay = document.createElement('div');
  overlay.className = 'image-lightbox';
  overlay.innerHTML = `
    <div class="image-lightbox__dialog" role="dialog" aria-modal="true" aria-label="Expanded image view">
      <button class="image-lightbox__close" type="button" aria-label="Close expanded image">×</button>
      <img class="image-lightbox__img" src="" alt="" />
    </div>
  `;

  document.body.appendChild(overlay);

  const overlayImg = overlay.querySelector('.image-lightbox__img');
  const closeBtn = overlay.querySelector('.image-lightbox__close');

  const closeLightbox = () => {
    overlay.classList.remove('open');
    overlayImg.src = '';
    overlayImg.alt = '';
    document.body.style.overflow = '';
  };

  expandButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      const fullSrc = button.getAttribute('data-full');
      const altText = button.getAttribute('data-alt') || '';

      overlayImg.src = fullSrc;
      overlayImg.alt = altText;
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  closeBtn.addEventListener('click', closeLightbox);

  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay.classList.contains('open')) {
      closeLightbox();
    }
  });
});