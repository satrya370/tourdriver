const toggle = document.querySelector('#menu-toggle');
const menu = document.querySelector('#mobile-nav');
function closeMenu() {
  menu.hidden = true;
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Open menu');
}
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  menu.hidden = !open;
});
menu.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !menu.hidden) { closeMenu(); toggle.focus(); }
});
matchMedia('(min-width: 1024px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
document.querySelectorAll('[data-route]').forEach(link => {
  link.addEventListener('click', () => { document.querySelector('#route').value = link.dataset.route; });
});
const date = document.querySelector('#trip-date');
const today = new Date();
date.min = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
document.querySelector('#enquiry').addEventListener('submit', event => {
  event.preventDefault();
  if (date.value < date.min) { date.setCustomValidity('Please choose today or a future date.'); date.reportValidity(); return; }
  const fields = new FormData(event.currentTarget);
  const message = `Hi Wayan! I'd love to plan a Bali day.\nDate: ${fields.get('date')}\nGroup: ${fields.get('guests')}\nInterested in: ${fields.get('route')}\nCould you share availability and a quote?`;
  const url = `https://wa.me/6281200000000?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  document.querySelector('#enquiry-status').textContent = 'Your WhatsApp message is ready. Demo number: replace it before publishing.';
});
date.addEventListener('input', () => date.setCustomValidity(''));
