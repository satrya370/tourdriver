// Sawah template — JS minimal (< 3 KB). Tidak ada framework.
(function () {
  var toggle = document.querySelector('[data-nav-toggle]');
  var panel = document.querySelector('[data-nav-panel]');
  if (toggle && panel) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      panel.hidden = open;
    });
  }

  // Tab hari pada halaman itinerary: tampilkan satu hari, sembunyikan sisanya.
  var dayLinks = document.querySelectorAll('[data-day-link]');
  var days = document.querySelectorAll('[data-day]');
  function showDay(id) {
    days.forEach(function (d) { d.hidden = d.id !== id; });
    dayLinks.forEach(function (a) { a.setAttribute('aria-current', a.hash === '#' + id ? 'true' : 'false'); });
  }
  if (dayLinks.length && days.length) {
    dayLinks.forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); showDay(a.hash.slice(1)); history.replaceState(null, '', a.hash); });
    });
    var initial = location.hash.slice(1);
    showDay(document.getElementById(initial) ? initial : days[0].id);
  }
})();

// Formulir pemesanan cepat: menyusun pesan WhatsApp dari pilihan tur + tanggal.
(function () {
  var form = document.querySelector('[data-wa-form]');
  if (!form) return;
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var tour = form.elements.tour ? form.elements.tour.value : '';
    var date = form.elements.date && form.elements.date.value ? form.elements.date.value : 'a date I will confirm';
    var text = 'Hello, I would like to check availability for ' + tour + ' on ' + date + '.';
    window.open('https://wa.me/' + form.getAttribute('data-wa-number') + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
  });
})();
