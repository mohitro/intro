/**
 * Main JavaScript for Mohit Roy's portfolio website.
 * Handles preloader, theme switching, navigation, voice greeting,
 * typewriter, age calculation, scroll animations, results management,
 * contact links, live location map and footer year.
 */

// Store results uploaded during the current session
let results = [];

// Track whether the voice greeting has already been spoken
let greetingSpoken = false;

// Default owner location (update these values with your actual coordinates)
const OWNER_LOCATION = { lat: 28.6139, lng: 77.2090 };

// DOM elements that are reused across the script
const preloader = document.getElementById('preloader');
const themeToggle = document.getElementById('theme-toggle');
const menuToggle = document.getElementById('menu-toggle');
const nav = document.getElementById('nav');
const navLinks = document.querySelectorAll('.nav-link');
const typewriterEl = document.getElementById('typewriter');
const ageValueEl = document.getElementById('age-value');
const resultsGrid = document.getElementById('results-grid');
const resultsEmpty = document.getElementById('results-empty');
const addResultForm = document.getElementById('add-result-form');
const excelModal = document.getElementById('excel-modal');
const modalBackdrop = document.getElementById('modal-backdrop');
const modalClose = document.getElementById('modal-close');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const yearEl = document.getElementById('year');

/* ------------------------------------------------------------------ */
/* Preloader                                                          */
/* ------------------------------------------------------------------ */

window.addEventListener('load', () => {
  // Keep the preloader visible briefly for a smooth entrance
  setTimeout(() => {
    preloader.classList.add('hidden');
    // Try to speak the greeting once the page is fully loaded
    trySpeakGreeting();
    // Start typewriter animation
    startTypewriter();
  }, 900);
});

/* ------------------------------------------------------------------ */
/* Theme Toggle                                                       */
/* ------------------------------------------------------------------ */

function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

themeToggle.addEventListener('click', toggleTheme);
initTheme();

/* ------------------------------------------------------------------ */
/* Mobile Navigation                                                  */
/* ------------------------------------------------------------------ */

function toggleMenu() {
  const isOpen = nav.classList.toggle('open');
  menuToggle.classList.toggle('active', isOpen);
  menuToggle.setAttribute('aria-expanded', String(isOpen));
}

menuToggle.addEventListener('click', toggleMenu);

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    menuToggle.classList.remove('active');
    menuToggle.setAttribute('aria-expanded', 'false');
  });
});

/* ------------------------------------------------------------------ */
/* Smooth Scroll Offset for Fixed Header                              */
/* ------------------------------------------------------------------ */

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const targetId = anchor.getAttribute('href');
    if (!targetId || targetId === '#') return;
    const target = document.querySelector(targetId);
    if (!target) return;

    e.preventDefault();
    const headerOffset = 80;
    const elementPosition = target.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });
  });
});

/* ------------------------------------------------------------------ */
/* Voice Greeting                                                     */
/* ------------------------------------------------------------------ */

function getGreetingText() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'Hey Friends, Good Morning';
  }
  if (hour >= 12 && hour < 17) {
    return 'Hey Friends, Good Afternoon';
  }
  return 'Hey Friends, Good Night';
}

function speakGreeting() {
  if (greetingSpoken) return;
  if (!('speechSynthesis' in window)) return;

  const text = getGreetingText();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1;

  window.speechSynthesis.speak(utterance);
  greetingSpoken = true;
}

function trySpeakGreeting() {
  try {
    speakGreeting();
  } catch (err) {
    // Some browsers block audio/autoplay until the user interacts.
    // Fall back to speaking on the first user interaction.
    document.body.addEventListener('click', speakGreeting, { once: true });
  }
}

/* ------------------------------------------------------------------ */
/* Typewriter Effect                                                  */
/* ------------------------------------------------------------------ */

function startTypewriter() {
  if (!typewriterEl) return;

  const words = [
    'Coding & Trading.',
    'Boxing & Karate.',
    'learning new things.',
  ];
  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let pauseEnd = 0;

  const typeSpeed = 100;
  const deleteSpeed = 50;
  const pauseTime = 1500;

  function tick() {
    const currentWord = words[wordIndex];

    if (isDeleting) {
      typewriterEl.textContent = currentWord.substring(0, charIndex - 1);
      charIndex--;
    } else {
      typewriterEl.textContent = currentWord.substring(0, charIndex + 1);
      charIndex++;
    }

    let nextDelay = isDeleting ? deleteSpeed : typeSpeed;

    if (!isDeleting && charIndex === currentWord.length) {
      nextDelay = pauseTime;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % words.length;
    }

    setTimeout(tick, nextDelay);
  }

  tick();
}

/* ------------------------------------------------------------------ */
/* Age Calculation from Date of Birth                                 */
/* ------------------------------------------------------------------ */

function calculateAge() {
  if (!ageValueEl) return;

  const birthDate = new Date('2004-12-14T00:00:00');
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();

  const hasHadBirthdayThisYear =
    today.getMonth() > birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

  if (!hasHadBirthdayThisYear) {
    age--;
  }

  ageValueEl.textContent = age;
}

calculateAge();

/* ------------------------------------------------------------------ */
/* Scroll Reveal Animations                                           */
/* ------------------------------------------------------------------ */

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
);

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

/* ------------------------------------------------------------------ */
/* Results Section - Upload, Display, View & Download                 */
/* ------------------------------------------------------------------ */

function renderResults() {
  if (!resultsGrid || !resultsEmpty) return;

  resultsGrid.innerHTML = '';

  if (results.length === 0) {
    resultsEmpty.style.display = 'block';
    return;
  }

  resultsEmpty.style.display = 'none';

  results.forEach((result, index) => {
    const card = document.createElement('div');
    card.className = 'result-card glass-card';

    const actions = [];

    if (result.pdfUrl && result.pdfFile) {
      actions.push(
        `<a href="${result.pdfUrl}" target="_blank" class="btn btn-outline">View PDF</a>`,
        `<a href="${result.pdfUrl}" download="${result.pdfFile.name}" class="btn btn-primary">Download PDF</a>`
      );
    }

    if (result.excelUrl && result.excelFile) {
      actions.push(
        `<button type="button" class="btn btn-outline" data-excel-index="${index}">View Excel</button>`,
        `<a href="${result.excelUrl}" download="${result.excelFile.name}" class="btn btn-primary">Download Excel</a>`
      );
    }

    card.innerHTML = `
      <div class="result-header">
        <div class="result-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
        </div>
        <h3 class="result-title">${escapeHtml(result.title)}</h3>
      </div>
      <div class="result-actions">
        ${actions.join('')}
      </div>
    `;

    resultsGrid.appendChild(card);
  });

  // Attach listeners for Excel preview buttons
  document.querySelectorAll('[data-excel-index]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-excel-index'));
      openExcelPreview(idx);
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

addResultForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const titleInput = document.getElementById('result-title');
  const pdfInput = document.getElementById('result-pdf');
  const excelInput = document.getElementById('result-excel');

  const title = titleInput.value.trim();
  const pdfFile = pdfInput.files[0] || null;
  const excelFile = excelInput.files[0] || null;

  if (!title) return;

  const result = {
    title,
    pdfFile,
    excelFile,
    pdfUrl: pdfFile ? URL.createObjectURL(pdfFile) : null,
    excelUrl: excelFile ? URL.createObjectURL(excelFile) : null,
  };

  results.push(result);
  renderResults();
  addResultForm.reset();
});

/* ------------------------------------------------------------------ */
/* Excel Preview Modal                                                */
/* ------------------------------------------------------------------ */

function openModal() {
  excelModal.classList.add('active');
  excelModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  excelModal.classList.remove('active');
  excelModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

modalBackdrop.addEventListener('click', closeModal);
modalClose.addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

async function openExcelPreview(index) {
  const result = results[index];
  if (!result || !result.excelFile) return;

  modalTitle.textContent = `Excel Preview - ${result.title}`;
  modalBody.innerHTML = '<p>Reading file...</p>';
  openModal();

  // If SheetJS is available, parse the workbook and show the first sheet
  if (window.XLSX) {
    try {
      const data = await result.excelFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

      if (json.length === 0) {
        modalBody.innerHTML = '<p>The file appears to be empty.</p>';
        return;
      }

      const table = document.createElement('table');
      table.className = 'modal-table';

      json.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');
        row.forEach((cell) => {
          const cellEl = document.createElement(rowIndex === 0 ? 'th' : 'td');
          cellEl.textContent = cell;
          tr.appendChild(cellEl);
        });
        table.appendChild(tr);
      });

      modalBody.innerHTML = '';
      modalBody.appendChild(table);
    } catch (err) {
      modalBody.innerHTML = '<p>Could not preview the Excel file. You can still download it.</p>';
    }
  } else {
    modalBody.innerHTML = '<p>Excel preview library is not loaded. Please download the file to view it.</p>';
  }
}

/* ------------------------------------------------------------------ */
/* Live Location Map & Distance Calculation                           */
/* ------------------------------------------------------------------ */

function initMap() {
  const mapContainer = document.getElementById('map');
  const infoPanel = document.getElementById('location-info');
  if (!mapContainer || typeof L === 'undefined') return;

  // Create the Leaflet map
  const map = L.map('map', { zoomControl: false }).setView(
    [OWNER_LOCATION.lat, OWNER_LOCATION.lng],
    12
  );

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // Owner marker
  const ownerMarker = L.marker([OWNER_LOCATION.lat, OWNER_LOCATION.lng]).addTo(map);
  ownerMarker.bindPopup('<strong>My Location</strong>').openPopup();

  // Try to get visitor location
  if ('geolocation' in navigator) {
    infoPanel.innerHTML =
      '<p>Detecting your location... Please allow location access if prompted.</p>';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const visitor = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        const visitorMarker = L.marker([visitor.lat, visitor.lng]).addTo(map);
        visitorMarker.bindPopup('<strong>Your Location</strong>');

        // Fit bounds to show both markers
        const group = L.featureGroup([ownerMarker, visitorMarker]);
        map.fitBounds(group.getBounds().pad(0.15));

        // Calculate approximate distance
        const distance = calculateDistance(
          OWNER_LOCATION.lat,
          OWNER_LOCATION.lng,
          visitor.lat,
          visitor.lng
        );

        infoPanel.innerHTML = `<p><strong>Distance between us:</strong> approximately <strong>${distance} km</strong></p>`;
      },
      () => {
        infoPanel.innerHTML =
          '<p>Location access was denied or unavailable. The map shows my default location.</p>';
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  } else {
    infoPanel.innerHTML =
      '<p>Geolocation is not supported by your browser. The map shows my default location.</p>';
  }
}

/**
 * Calculate the great-circle distance between two coordinates using the Haversine formula.
 * Returns the distance rounded to two decimal places in kilometers.
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = degToRad(lat2 - lat1);
  const dLng = degToRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degToRad(lat1)) *
      Math.cos(degToRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return (R * c).toFixed(2);
}

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

initMap();

/* ------------------------------------------------------------------ */
/* Footer Current Year                                                */
/* ------------------------------------------------------------------ */

if (yearEl) {
  yearEl.textContent = String(new Date().getFullYear());
}
