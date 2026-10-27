// Cletusplash — original Unsplash search, theme and infinite-scroll logic retained and improved.
const section = document.querySelector('.section');
const toggle = document.getElementById('themeToggle');
const searchForm = document.querySelector('.searchBTN');
const searchInput = document.querySelector('.searchBTN input');
const imageContainer = document.getElementById('image-container');
const loader = document.querySelector('.load_container');
const loadMoreBtn = document.getElementById('load-more');
const statusMessage = document.getElementById('status-message');
const modal = document.getElementById('preview-modal');
const previewImage = document.getElementById('preview-image');
const previewTitle = document.getElementById('preview-title');
const previewCredit = document.getElementById('preview-credit');
const previewDownload = document.getElementById('preview-download');
const previewShare = document.getElementById('preview-share');
const previewSource = document.getElementById('preview-source');
const toast = document.getElementById('toast');

let searchQuery = '';
let photosArray = [];
let ready = false;
let isLoading = false;
let page = 1;
let currentPhoto = null;
let toastTimeout;
const count = 24;
// Note: a client-side Unsplash key is visible to visitors. Restrict it in your Unsplash dashboard.
const apiKey = '57XBtDyaGJ8LHrPuBSuqt4sCRZsSym98VZtoGKdkTGE';

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 2800);
}

function setLoading(active) {
  isLoading = active;
  loader.style.display = active ? 'flex' : 'none';
  loadMoreBtn.disabled = active;
  loadMoreBtn.textContent = active ? 'Loading images…' : 'Load more images ↓';
}

// Theme preference from the original project is preserved.
function applyTheme(isDark) {
  section.classList.toggle('dark-mode', isDark);
  toggle.checked = isDark;
  try { localStorage.setItem('sectionTheme', isDark ? 'dark' : 'light'); } catch (_) {}
}
toggle.addEventListener('change', () => applyTheme(toggle.checked));
try { applyTheme(localStorage.getItem('sectionTheme') === 'dark'); } catch (_) { applyTheme(false); }

function getApiUrl() {
  const params = new URLSearchParams({ client_id: apiKey, per_page: String(count), page: String(page) });
  if (searchQuery) {
    params.set('query', searchQuery);
    return `https://api.unsplash.com/search/photos?${params.toString()}`;
  }
  params.set('count', String(count));
  params.delete('per_page');
  return `https://api.unsplash.com/photos/random?${params.toString()}`;
}

function safeText(value, fallback = 'Untitled photo') {
  return (typeof value === 'string' && value.trim()) ? value.trim() : fallback;
}

function makeAction(label, text, handler) {
  const button = document.createElement('button');
  button.type = 'button';
  // button.textContent = text;
  button.innerHTML = text;
  button.setAttribute('aria-label', label);
  button.title = label;
  button.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); handler(); });
  return button;
}


const photoObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show-photo');

            // Animate only the first time it enters view
            photoObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.15
});


function displayPhotos(photos, append = false) {
  if (!append) imageContainer.innerHTML = '';
  photos.forEach((photo) => {
    const card = document.createElement('article');
    card.className = 'imgContainer';
    const img = document.createElement('img');
    const title = safeText(photo.alt_description || photo.description, 'Beautiful Unsplash photo');
    img.src = photo.urls?.small || photo.urls?.regular || '';
    img.alt = title;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('click', () => openPreview(photo));
    img.addEventListener('keydown', (event) => { if (event.key === 'Enter') openPreview(photo); });
    img.tabIndex = 0;
    img.addEventListener('error', () => { card.remove(); });

    const actions = document.createElement('div');
    actions.className = 'image-card-actions';
    actions.append(
      makeAction('Preview image', `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-emoji-heart-eyes-fill" viewBox="0 0 16 16">
  <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0M4.756 4.566c.763-1.424 4.02-.12.952 3.434-4.496-1.596-2.35-4.298-.952-3.434m6.559 5.448a.5.5 0 0 1 .548.736A4.5 4.5 0 0 1 7.965 13a4.5 4.5 0 0 1-3.898-2.25.5.5 0 0 1 .548-.736h.005l.017.005.067.015.252.055c.215.046.515.108.857.169.693.124 1.522.242 2.152.242s1.46-.118 2.152-.242a27 27 0 0 0 1.109-.224l.067-.015.017-.004.005-.002zm-.07-5.448c1.397-.864 3.543 1.838-.953 3.434-3.067-3.554.19-4.858.952-3.434z"/>
</svg>`, () => openPreview(photo)),
      makeAction('Download image', `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-download" viewBox="0 0 16 16">
  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5"/>
  <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708z"/>
</svg>`, () => downloadPhoto(photo)),
      makeAction('Share image', `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-share-fill" viewBox="0 0 16 16">
  <path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5"/>
</svg>`, () => sharePhoto(photo))





// makeAction('Share image', `
//   <svg xmlns="http://www.w3.org/2000/svg"
//        width="20"
//        height="20"
//        fill="currentColor"
//        viewBox="0 0 16 16"
//        aria-hidden="true">
//     <path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.5 2.5 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5"/>
//   </svg>
// `, () => sharePhoto(photo))
    );
    card.append(img, actions);
    imageContainer.appendChild(card);

        // NEW: Animate this card when it enters the viewport
    photoObserver.observe(card);
  });
}











// function displayPhotos(photos, append = false) {
//   if (!append) imageContainer.innerHTML = '';

//   photos.forEach((photo) => {
//     const card = document.createElement('article');
//     card.className = 'imgContainer';

//     const img = document.createElement('img');
//     const title = safeText(
//       photo.alt_description || photo.description,
//       'Beautiful Unsplash photo'
//     );

//     img.src = photo.urls?.small || photo.urls?.regular || '';
//     img.alt = title;
//     img.loading = 'lazy';
//     img.decoding = 'async';

//     img.addEventListener('click', () => openPreview(photo));

//     img.addEventListener('keydown', (event) => {
//       if (event.key === 'Enter') openPreview(photo);
//     });

//     img.tabIndex = 0;

//     img.addEventListener('error', () => {
//       card.remove();
//     });

//     const actions = document.createElement('div');
//     actions.className = 'image-card-actions';

//     actions.append(
//       makeAction('Preview image', '⌕', () => openPreview(photo)),
//       makeAction('Download image', '↓', () => downloadPhoto(photo)),
//       makeAction('Share image', '↗', () => sharePhoto(photo))
//     );

//     card.append(img, actions);
//     imageContainer.appendChild(card);

//     // NEW: Animate this card when it enters the viewport
//     photoObserver.observe(card);
//   });
// }






function openPreview(photo) {
  currentPhoto = photo;

  previewImage.src =
    photo.urls?.regular ||
    photo.urls?.full ||
    photo.urls?.small ||
    '';

  previewImage.alt = safeText(
    photo.alt_description || photo.description
  );

  previewTitle.textContent = safeText(
    photo.alt_description || photo.description,
    'Beautiful image'
  );

  const photographer = photo.user?.name
    ? `Photo by ${photo.user.name} on Unsplash`
    : 'Photo from Unsplash';

  previewCredit.textContent = photographer;
  previewSource.href = photo.links?.html || 'https://unsplash.com';

  // Reset previous animation classes
  modal.classList.remove('animate__zoomOut', 'animate__zoomIn');

  // Set animation duration
  modal.style.setProperty('--animate-duration', '0.5s');

  // Show the modal
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');

  document.body.style.overflow = 'hidden';

  // Restart the zoom-in animation
  void modal.offsetWidth;

  modal.classList.add('animate__animated', 'animate__zoomIn');

  document.getElementById('modal-close').focus();
}




function closePreview() {

  // Remove the opening animation
  modal.classList.remove('animate__zoomIn');

  // Add the closing animation
  modal.classList.add('animate__animated', 'animate__zoomOut');

  modal.style.setProperty('--animate-duration', '0.5s');

  // Wait until the zoom-out animation finishes
  modal.addEventListener('animationend', function handleAnimationEnd(event) {

    // Ignore animations from child elements
    if (event.target !== modal) return;

    modal.removeEventListener('animationend', handleAnimationEnd);

    // Hide the modal after animation
    modal.classList.remove('open');

    modal.setAttribute('aria-hidden', 'true');

    document.body.style.overflow = '';

    previewImage.removeAttribute('src');

    currentPhoto = null;

    // Clean up so the next preview can animate
    modal.classList.remove('animate__animated', 'animate__zoomOut');
  });
}


document.getElementById('modal-close').addEventListener('click', ()=> {


  closePreview();
} );
modal.addEventListener('click', (event) => { if (event.target === modal) closePreview(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && modal.classList.contains('open')) closePreview(); });

async function downloadPhoto(photo) {
  const url = photo.links?.download_location || photo.urls?.full || photo.urls?.regular;
  if (!url) return showToast('This image does not have a download link.');
  try {
    // Unsplash recommends calling download_location when a user initiates a download.
    if (photo.links?.download_location) {
      fetch(`${photo.links.download_location}?client_id=${encodeURIComponent(apiKey)}`).catch(() => {});
    }
    const response = await fetch(photo.urls?.full || photo.urls?.regular || photo.urls?.small);
    if (!response.ok) throw new Error('Download unavailable');
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `cletusplash-${photo.id || 'photo'}.jpg`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    showToast('Your download has started.');
  } catch (error) {
    // Cross-origin restrictions can block direct downloads. Opening the image is a useful fallback.
    const fallbackUrl = photo.urls?.full || photo.urls?.regular || url;
    window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    showToast('Opened the image in a new tab. Use your browser to save it.');
  }
}

async function sharePhoto(photo) {
  const shareUrl = photo.links?.html || photo.urls?.regular;
  const shareData = { title: 'Found on Cletusplash', text: safeText(photo.alt_description, 'Check out this photo'), url: shareUrl };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Photo link copied. You can paste it anywhere.');
    } else {
      window.prompt('Copy this photo link:', shareUrl);
    }
  } catch (error) {
    if (error.name !== 'AbortError') showToast('Sharing was not available. Try copying the source link.');
  }
}

previewDownload.addEventListener('click', () => currentPhoto && downloadPhoto(currentPhoto));
previewShare.addEventListener('click', () => currentPhoto && sharePhoto(currentPhoto));

async function getPhotos({ reset = false } = {}) {
  if (isLoading) return;
  if (reset) {
    page = 1;
    ready = false;
    imageContainer.innerHTML = '';
    statusMessage.textContent = '';
  }
  setLoading(true);
  try {
    const response = await fetch(getApiUrl());
    if (!response.ok) throw new Error(response.status === 403 ? 'Unsplash API rate limit reached. Please try again later.' : `Image search failed (${response.status}).`);
    const data = await response.json();
    photosArray = searchQuery ? (data.results || []) : (Array.isArray(data) ? data : []);
    if (!photosArray.length && page === 1) {
      statusMessage.textContent = 'No images found. Try a different search term.';
    } else {
      displayPhotos(photosArray, !reset && page > 1);
      statusMessage.textContent = searchQuery ? `Showing results for “${searchQuery}”.` : 'A fresh collection, selected for you.';
    }
    ready = true;
    page += 1;
  } catch (error) {
    console.error('Error fetching Unsplash photos:', error);
    statusMessage.textContent = error.message || 'Could not load images. Check your connection and try again.';
    showToast('Could not load images. Please try again.');
  } finally {
    setLoading(false);
  }
}

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  searchQuery = searchInput.value.trim();
  getPhotos({ reset: true });
});
document.querySelectorAll('[data-query]').forEach((button) => {
  button.addEventListener('click', () => {
    searchInput.value = button.dataset.query;
    searchQuery = button.dataset.query;
    getPhotos({ reset: true });
    document.getElementById('discover').scrollIntoView({ behavior: 'smooth' });
  });
});
loadMoreBtn.addEventListener('click', () => { if (ready && !isLoading) getPhotos(); });

// Keep infinite scroll from the original project, with a loading guard to avoid duplicate requests.
window.addEventListener('scroll', () => {
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 900 && ready && !isLoading) getPhotos();
}, { passive: true });

getPhotos({ reset: true });



