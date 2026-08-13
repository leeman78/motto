// Mobile navigation toggle. Shared by index.html and product.html.
//
// Below 1080px the .links row is hidden by CSS and this burger takes over.
// The panel is fixed under the nav bar, so it needs to know how tall the
// announcement strip above the nav currently is; that strip scrolls away
// on some pages, so the offset is measured rather than hard coded.

(function () {
  const burger = document.getElementById('burger');
  const menu   = document.getElementById('mobmenu');
  if (!burger || !menu) return;

  function topOffset() {
    const strip = document.querySelector('.top');
    if (!strip) return 0;
    const r = strip.getBoundingClientRect();
    // only the part still on screen counts
    return Math.max(0, r.bottom);
  }

  function place() {
    document.documentElement.style.setProperty('--top-h', topOffset() + 'px');
  }

  function setOpen(on) {
    if (on) place();
    menu.classList.toggle('on', on);
    burger.setAttribute('aria-expanded', on ? 'true' : 'false');
    // stop the page behind the panel from scrolling under a finger
    document.body.style.overflow = on ? 'hidden' : '';
  }

  const isOpen = () => burger.getAttribute('aria-expanded') === 'true';

  burger.addEventListener('click', () => setOpen(!isOpen()));

  // any link closes it, including the in-page anchors
  menu.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => setOpen(false))
  );

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen()) setOpen(false);
  });

  // tapping outside the panel closes it
  document.addEventListener('click', e => {
    if (!isOpen()) return;
    if (menu.contains(e.target) || burger.contains(e.target)) return;
    setOpen(false);
  });

  // rotating a phone can cross the 1080px line while the panel is open
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1080 && isOpen()) setOpen(false);
    else if (isOpen()) place();
  });

  window.addEventListener('scroll', () => { if (isOpen()) place(); }, { passive: true });
})();
