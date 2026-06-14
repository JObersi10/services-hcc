/* ============================================================
   HACK CLUB CURAÇAO — SHARED SITE BEHAVIOR
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Custom cursor (fine pointer + no reduced motion only) ---------- */
  const fineCursor = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (fineCursor && !reducedMotion) {
    document.body.classList.add('has-fine-cursor');
    const cursor = document.createElement('div');
    cursor.className = 'cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<div class="cursor-ring"></div><div class="cursor-dot"></div>';
    document.body.appendChild(cursor);

    const ring = cursor.querySelector('.cursor-ring');
    const dot = cursor.querySelector('.cursor-dot');
    let mx = 0, my = 0, rx = 0, ry = 0;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px'; dot.style.top = my + 'px';
    });

    (function animRing() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      requestAnimationFrame(animRing);
    })();

    const hoverables = 'a, button, .service-card, .plan, .step, .work-card, .filter-btn, .team-card, input, textarea, select, .faq-question';
    document.querySelectorAll(hoverables).forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  }

  /* ---------- Scroll progress bar ---------- */
  const progress = document.getElementById('progress');
  if (progress) {
    window.addEventListener('scroll', () => {
      const h = document.body.scrollHeight - window.innerHeight;
      const pct = h > 0 ? window.scrollY / h : 0;
      progress.style.transform = `scaleX(${pct})`;
    }, { passive: true });
  }

  /* ---------- Nav scrolled state ---------- */
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile nav toggle ---------- */
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }));
    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && links.classList.contains('open')) {
        links.classList.remove('open');
        toggle.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
        toggle.focus();
      }
    });
  }

  /* ---------- Hero title typewriter (data-words / data-accent on #heroTitle) ---------- */
  const heroTitle = document.getElementById('heroTitle');
  if (heroTitle) {
    let words = [];
    try { words = JSON.parse(heroTitle.dataset.words || '[]'); } catch (e) { words = []; }
    const accentIndex = parseInt(heroTitle.dataset.accent || '-1', 10);
    words.forEach((w, i) => {
      const span = document.createElement('span');
      span.className = 'word' + (i === accentIndex ? ' accent' : '');
      span.textContent = w.trim() + ' ';
      span.style.animationDelay = (0.25 + i * 0.15) + 's';
      heroTitle.appendChild(span);
    });
  }

  /* ---------- Marquee (data-items JSON array on #marquee) ---------- */
  const track = document.getElementById('marquee');
  if (track) {
    let items = [];
    try { items = JSON.parse(track.dataset.items || '[]'); } catch (e) { items = []; }
    [...items, ...items].forEach(item => {
      const d = document.createElement('div');
      d.className = 'marquee-item';
      d.innerHTML = `<span>&#10022;</span>${item}`;
      track.appendChild(d);
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    if (reducedMotion) {
      reveals.forEach(el => el.classList.add('visible'));
    } else {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
      }, { threshold: 0.12 });
      reveals.forEach(el => observer.observe(el));
    }
  }

  /* ---------- Service card mouse-follow glow ---------- */
  document.querySelectorAll('.service-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - rect.left) / rect.width * 100) + '%');
      card.style.setProperty('--my', ((e.clientY - rect.top) / rect.height * 100) + '%');
    });
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const list = item.parentElement;
      const isOpen = item.classList.contains('open');
      list.querySelectorAll('.faq-item.open').forEach(i => {
        if (i !== item) {
          i.classList.remove('open');
          i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        }
      });
      item.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  /* ---------- Work / portfolio filter ---------- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const workCards = document.querySelectorAll('.work-card');
  if (filterBtns.length && workCards.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        const f = btn.dataset.filter;
        workCards.forEach(card => {
          card.hidden = !(f === 'all' || card.dataset.category === f);
        });
      });
    });
  }

  /* ---------- Contact form (static demo handler) ---------- */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const status = document.getElementById('formStatus');
      if (status) {
        status.textContent = "Thanks! This form isn't wired up to a server yet — for now, please email us directly at hello@hackclubcuracao.org.";
        status.hidden = false;
      }
    });
  }
});

/* ── Page transition ── */
(function () {
  const DURATION = 600;
  const overlay = document.createElement('div');
  overlay.id = 'page-transition';
  overlay.innerHTML = '<div class="pt-panel"></div>';
  document.body.appendChild(overlay);

  const panel = overlay.querySelector('.pt-panel');

  if (sessionStorage.getItem('pt-active')) {
    sessionStorage.removeItem('pt-active');
    // New page: start with panel fully covering, then reveal
    panel.style.transform = 'translateY(0)';
    panel.style.borderRadius = '0';
    overlay.style.pointerEvents = 'all';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      overlay.classList.add('pt-revealing');
      setTimeout(() => {
        overlay.classList.remove('pt-revealing');
        panel.style.transform = 'translateY(106%)';
        overlay.style.pointerEvents = 'none';
      }, DURATION + 50);
    }));
  }

  document.addEventListener('click', function (e) {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href) return;

    const isExternal = link.target === '_blank' || /^(https?:)?\/\//.test(href);
    const isAnchorOnly = /^#/.test(href);
    const isSpecial = /^(mailto:|tel:)/.test(href);
    if (isExternal || isAnchorOnly || isSpecial) return;

    e.preventDefault();
    overlay.style.pointerEvents = 'all';
    overlay.classList.add('pt-covering');
    sessionStorage.setItem('pt-active', '1');

    setTimeout(() => { window.location.href = href; }, DURATION);
  });
})();
