const header = document.querySelector('#header');
const journey = document.querySelector('#journey');
const pin = document.querySelector('#journey-pin');
const path = document.querySelector('#flight-path');
const plane = document.querySelector('#plane');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const length = path.getTotalLength();
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => value * value * (3 - 2 * value);
path.style.strokeDasharray = `${length} ${length}`;
let framePending = false;

function renderJourney() {
  framePending = false;
  header.classList.toggle('scrolled', window.scrollY > 25);
  const bounds = journey.getBoundingClientRect();
  const progress = reducedMotion.matches ? 0 : clamp(-bounds.top / Math.max(1, journey.offsetHeight - pin.clientHeight));
  const flight = clamp(progress / .76);
  const arrival = ease(clamp((progress - .79) / .21));
  pin.style.setProperty('--flight', flight);
  pin.style.setProperty('--fade', 1 - ease(clamp((progress - .79) / .14)));
  pin.style.setProperty('--zoom', 1 + arrival * 2.8);
  pin.style.setProperty('--wash', ease(clamp((progress - .90) / .10)));
  path.style.strokeDashoffset = length * (1 - flight);
  const matrix = path.getScreenCTM();
  if (!matrix || reducedMotion.matches) return;
  const position = flight * length;
  const point = path.getPointAtLength(position).matrixTransform(matrix);
  const before = path.getPointAtLength(Math.max(0, position - 1)).matrixTransform(matrix);
  const after = path.getPointAtLength(Math.min(length, position + 1)).matrixTransform(matrix);
  const pinBounds = pin.getBoundingClientRect();
  // The paper plane artwork points up and right, 39 degrees above its x axis.
  const angle = Math.atan2(after.y - before.y, after.x - before.x) * 180 / Math.PI + 39;
  plane.style.left = `${point.x - pinBounds.left}px`;
  plane.style.top = `${point.y - pinBounds.top}px`;
  plane.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;
}
function scheduleRender() {
  if (framePending) return;
  framePending = true;
  requestAnimationFrame(renderJourney);
}
window.addEventListener('scroll', scheduleRender, { passive: true });
window.addEventListener('resize', scheduleRender);
reducedMotion.addEventListener('change', scheduleRender);
if (document.fonts) document.fonts.ready.then(scheduleRender);
renderJourney();

const track = document.querySelector('#photo-carousel');
const cards = [...track.querySelectorAll('.photo-card')];
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const status = document.querySelector('#carousel-status');
function updateCarousel() {
  previous.disabled = track.scrollLeft <= 2;
  next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  const step = cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap);
  const index = Math.min(cards.length - 1, Math.round(track.scrollLeft / step));
  status.textContent = previous.disabled && next.disabled ? `${cards.length} sweet moments` : `Image ${index + 1} of ${cards.length}`;
}
function moveCarousel(direction) {
  const step = cards[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap);
  track.scrollBy({ left: direction * step, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
}
previous.addEventListener('click', () => moveCarousel(-1));
next.addEventListener('click', () => moveCarousel(1));
track.addEventListener('scroll', updateCarousel, { passive: true });
track.addEventListener('keydown', event => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  event.preventDefault();
  moveCarousel(event.key === 'ArrowLeft' ? -1 : 1);
});
new ResizeObserver(updateCarousel).observe(track);
updateCarousel();

const contactForm = document.querySelector('#contact-form');
contactForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;
  const data = new FormData(contactForm);
  const name = String(data.get('name') || '').trim();
  const message = String(data.get('text') || '').trim();
  if (!name || !message) {
    const field = contactForm.querySelector(!name ? '#contact-name' : '#contact-message');
    field.setCustomValidity('Please fill in this field.');
    field.reportValidity();
    field.addEventListener('input', () => field.setCustomValidity(''), { once: true });
    return;
  }
  const phone = String(data.get('phone') || '').trim();
  const text = `Hi Sana! My name is ${name}.${phone ? `\nPhone: ${phone}` : ''}\n\n${message}`;
  window.open(`https://wa.me/919307809805?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
});
