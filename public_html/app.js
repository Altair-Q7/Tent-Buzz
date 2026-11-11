'use strict';

const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Native anchors and visible content remain useful when JavaScript is unavailable.
if ('IntersectionObserver' in window && !prefersReducedMotion) {
  document.documentElement.classList.add('js-motion');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.07 });
  $$('.reveal').forEach(element => observer.observe(element));
}

const menuButton = $('.menu-toggle');
const mobileNav = $('#mobile-nav');
function setMenu(open) {
  if (!menuButton || !mobileNav) return;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  mobileNav.classList.toggle('is-open', open);
  mobileNav.inert = !open;
  document.body.classList.toggle('menu-open', open);
}
menuButton?.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
$$('a', mobileNav || document.createElement('nav')).forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuButton.focus();
  }
  if (event.key === 'Tab' && menuButton?.getAttribute('aria-expanded') === 'true') {
    const focusable = [menuButton, ...$$('a', mobileNav)];
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
window.matchMedia('(min-width: 701px)').addEventListener('change', event => { if (event.matches) setMenu(false); });

const heroImages = $$('.hero-image');
let heroIndex = 0;
const heroSection = $('.hero');
const floatingContact = $('.floating-whatsapp');
if (heroSection && floatingContact && 'IntersectionObserver' in window) {
  const contactObserver = new IntersectionObserver(([entry]) => {
    floatingContact.classList.toggle('is-hidden', entry.isIntersecting);
    floatingContact.inert = entry.isIntersecting;
  }, { threshold: 0.1 });
  contactObserver.observe(heroSection);
}
function showHero(direction) {
  if (!heroImages.length) return;
  heroImages[heroIndex].classList.remove('is-active');
  heroIndex = (heroIndex + direction + heroImages.length) % heroImages.length;
  heroImages[heroIndex].classList.add('is-active');
  $('#hero-counter').innerHTML = `${String(heroIndex + 1).padStart(2, '0')} <i>/ ${String(heroImages.length).padStart(2, '0')}</i>`;
}
$('[data-hero-prev]')?.addEventListener('click', () => showHero(-1));
$('[data-hero-next]')?.addEventListener('click', () => showHero(1));

const galleryPhotos = $$('.gallery-photo');
$$('[data-filter]').forEach(button => button.addEventListener('click', () => {
  const filter = button.dataset.filter;
  $$('[data-filter]').forEach(item => {
    const active = item === button;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  galleryPhotos.forEach(photo => { photo.hidden = filter !== 'all' && photo.dataset.category !== filter; });
  $('.gallery-grid')?.classList.toggle('is-filtered', filter !== 'all');
}));

const lightbox = $('#lightbox');
let lightboxItems = [];
let lightboxIndex = 0;
let lightboxOrigin = null;
function renderLightbox() {
  const item = lightboxItems[lightboxIndex];
  if (!item) return;
  const image = $('#lightbox-image');
  image.src = item.dataset.lightbox;
  image.alt = $('img', item)?.alt || item.dataset.caption;
  $('#lightbox-caption').textContent = item.dataset.caption || '';
  $('.lightbox-counter').textContent = `${lightboxIndex + 1} / ${lightboxItems.length}`;
  $('.lightbox-prev').hidden = lightboxItems.length < 2;
  $('.lightbox-next').hidden = lightboxItems.length < 2;
}
function moveLightbox(direction) {
  lightboxIndex = (lightboxIndex + direction + lightboxItems.length) % lightboxItems.length;
  renderLightbox();
}
$$('[data-lightbox]').forEach(button => button.addEventListener('click', () => {
  if (!lightbox) return;
  lightboxOrigin = button;
  lightboxItems = button.classList.contains('gallery-photo') ? galleryPhotos.filter(item => !item.hidden) : [button];
  lightboxIndex = lightboxItems.indexOf(button);
  renderLightbox();
  lightbox.showModal();
  document.body.classList.add('dialog-open');
  $('.lightbox-close').focus();
}));
$('.lightbox-close')?.addEventListener('click', () => lightbox.close());
$('.lightbox-prev')?.addEventListener('click', () => moveLightbox(-1));
$('.lightbox-next')?.addEventListener('click', () => moveLightbox(1));
lightbox?.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });
lightbox?.addEventListener('close', () => { document.body.classList.remove('dialog-open'); lightboxOrigin?.focus(); });
lightbox?.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); moveLightbox(-1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); moveLightbox(1); }
});

const bookingForm = $('#booking-form');
if (bookingForm) {
  const checkIn = $('#check-in');
  const checkOut = $('#check-out');
  const isoDate = date => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  const nextDay = value => {
    const date = new Date(value + 'T12:00:00+05:30');
    return isoDate(new Date(date.getTime() + 86400000));
  };
  checkIn.min = isoDate(new Date());
  checkOut.min = nextDay(checkIn.min);
  checkIn.addEventListener('change', () => {
    checkOut.min = checkIn.value ? nextDay(checkIn.value) : nextDay(checkIn.min);
    if (checkOut.value && checkOut.value < checkOut.min) checkOut.value = '';
    checkOut.setCustomValidity('');
  });
  checkOut.addEventListener('change', () => checkOut.setCustomValidity(''));
  bookingForm.addEventListener('submit', event => {
    event.preventDefault();
    checkOut.setCustomValidity('');
    if (checkOut.value <= checkIn.value) checkOut.setCustomValidity('Please choose a check-out date after your check-in.');
    if (!bookingForm.reportValidity()) return;
    const format = value => new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(value + 'T12:00:00+05:30'));
    const message = `Hi Tent Buzz! I’d love to plan a camping stay.\n\nCheck-in: ${format(checkIn.value)}\nCheck-out: ${format(checkOut.value)}\nOur crew: ${$('#guests').value}\n\nCould you please share availability, rates, meal options, and booking details?`;
    const url = `https://wa.me/917012549782?text=${encodeURIComponent(message)}`;
    const opened = window.open(url, '_blank', 'noopener,noreferrer');
    // The enquiry is sent only after the guest chooses to send it in WhatsApp.
    if (opened) opened.opener = null;
  });
}

const phaseTabs = $$('[data-phase]');
function activatePhase(tab, focus = false) {
  phaseTabs.forEach(item => {
    const active = item === tab;
    item.setAttribute('aria-selected', String(active));
    item.tabIndex = active ? 0 : -1;
    const panel = document.getElementById(item.getAttribute('aria-controls'));
    if (panel) panel.hidden = !active;
  });
  if (focus) tab.focus();
}
phaseTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activatePhase(tab));
  tab.addEventListener('keydown', event => {
    let nextIndex;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % phaseTabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + phaseTabs.length) % phaseTabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = phaseTabs.length - 1;
    if (nextIndex !== undefined) { event.preventDefault(); activatePhase(phaseTabs[nextIndex], true); }
  });
});
const occupancy = $('#occupancy');
if (occupancy) {
  const money = amount => `₹${(amount / 100000).toFixed(2)} lakh`;
  function updateModel() {
    const ratio = Number(occupancy.value) / 100;
    const villa = 25000 * 365 * ratio;
    const cottages = 6 * 6000 * 365 * ratio;
    const camping = 12 * 8 * 12 * 2000;
    $('#occupancy-output').textContent = occupancy.value + '%';
    $('#villa-revenue').textContent = money(villa);
    $('#cottage-revenue').textContent = money(cottages);
    $('#camp-revenue').textContent = money(camping);
    $('#total-revenue').textContent = `₹${((villa + cottages + camping) / 10000000).toFixed(2)} crore`;
    $('#total-detail').textContent = `${money(villa + cottages + camping)} per year · before costs and taxes`;
    occupancy.setAttribute('aria-valuetext', `${occupancy.value}% room occupancy. Illustrative gross annual revenue: ${money(villa + cottages + camping)}.`);
  }
  occupancy.addEventListener('input', updateModel);
  updateModel();
}
$$('[data-year]').forEach(element => { element.textContent = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Kolkata', year: 'numeric' }).format(new Date()); });
