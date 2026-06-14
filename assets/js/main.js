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
    const newlineIndices = (heroTitle.dataset.newline || '')
      .split(',')
      .map(n => parseInt(n.trim(), 10))
      .filter(n => !isNaN(n));
    words.forEach((w, i) => {
      if (newlineIndices.includes(i)) {
        heroTitle.appendChild(document.createElement('br'));
      }
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

  /* ---------- Reveal on scroll (staggered per sibling group) ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    // Stagger items that share a parent so groups (card grids, stat rows,
    // etc.) cascade in one after another instead of fading all at once.
    const groups = new Map();
    reveals.forEach(el => {
      const siblings = groups.get(el.parentElement) || [];
      siblings.push(el);
      groups.set(el.parentElement, siblings);
    });
    groups.forEach(siblings => {
      siblings.forEach((el, i) => {
        const delay = Math.min(i, 5) * 0.08; // 80ms per item, capped
        el.style.setProperty('--reveal-delay', delay + 's');
      });
    });

    if (reducedMotion) {
      reveals.forEach(el => el.classList.add('visible'));
    } else {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
      }, { threshold: 0.12 });
      reveals.forEach(el => observer.observe(el));
    }
  }

  /* ---------- Process section: scroll-synced line-draw animation ---------- */
  const processGrid = document.querySelector('.process-grid');
  const processIcons = document.querySelectorAll('.process-visual .anim-icon');
  const stepEls = document.querySelectorAll('.process-steps .step');
  const dotEls = document.querySelectorAll('.process-dot');
  if (processGrid && processIcons.length) {
    const segments = processIcons.length;
    let ticking = false;

    // Lets progress (and so the first icon's draw-in) start ticking up
    // slightly before the grid's top edge reaches the viewport top —
    // i.e. while the "How It Works" heading above is still on screen —
    // instead of staying frozen at 0 until the heading scrolls away.
    const LEAD = 350;

    const updateProcess = () => {
      const rect = processGrid.getBoundingClientRect();
      const vh = window.innerHeight;
      const scrollable = rect.height - vh;
      let progress = scrollable > 0 ? (LEAD - rect.top) / (scrollable + LEAD) : 0;
      progress = Math.min(1, Math.max(0, progress));
      const activeIndex = Math.min(segments - 1, Math.floor(progress * segments));

      // Each icon gets its own window with a gap before/after, so one
      // fully erases (and the line returns to its shared starting point)
      // before the next one starts drawing — no overlap.
      const windowW = 0.8 / segments;          // active drawing window
      const step = 1 / segments;               // window + gap per icon
      processIcons.forEach((icon, i) => {
        const start = i * step;
        const local = (progress - start) / windowW;
        let net = 0;
        if (local > 0 && local < 1) {
          if (local < 0.35) net = local / 0.35;            // draw in
          else if (local < 0.6) net = 1;                    // hold
          else net = 1 - (local - 0.6) / 0.4;               // erase out
        }
        net = Math.min(1, Math.max(0, net));
        icon.style.strokeDashoffset = String(100 - net * 100);
        icon.style.opacity = net > 0.02 ? '1' : '0';
      });

      stepEls.forEach((step, i) => step.classList.toggle('active', i === activeIndex));
      dotEls.forEach((dot, i) => dot.classList.toggle('active', i === activeIndex));
      ticking = false;
    };

    updateProcess();
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateProcess);
        ticking = true;
      }
    }, { passive: true });
    window.addEventListener('resize', updateProcess);
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
  const DURATION = 750;
  const FRINGE   = 170;   // px — must match CSS 180px offset (a little less so dots reach edge)
  const GRID     = 12;    // dot grid spacing
  const MAX_R    = 5.5;   // max dot radius
  const RED      = '#ec3750';

  function makeHalftone(denseAtBottom) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.ceil(window.innerWidth * 1.12); // matches panel's 110% width + buffer
    const canvas = document.createElement('canvas');
    canvas.width  = W * dpr;
    canvas.height = FRINGE * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = FRINGE + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.fillStyle = RED;

    for (let x = GRID / 2; x < W + GRID; x += GRID) {
      for (let y = GRID / 2; y < FRINGE + GRID; y += GRID) {
        // t=1 → full size dot, t=0 → invisible
        const t = denseAtBottom
          ? Math.pow(y / FRINGE, 1.6)             // dense at bottom (near solid panel)
          : Math.pow((FRINGE - y) / FRINGE, 1.6); // dense at top    (near solid panel)
        const r = MAX_R * t;
        if (r < 0.4) continue;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return canvas;
  }

  const overlay = document.createElement('div');
  overlay.id = 'page-transition';
  overlay.innerHTML = '<div class="pt-panel"></div>';
  document.body.appendChild(overlay);
  const panel = overlay.querySelector('.pt-panel');

  // Top fringe: sits above panel — dense at bottom edge (touching panel)
  const dotsTop = makeHalftone(true);
  dotsTop.className = 'pt-dots pt-dots-top';
  panel.appendChild(dotsTop);

  // Bottom fringe: sits below panel — dense at top edge (touching panel)
  const dotsBot = makeHalftone(false);
  dotsBot.className = 'pt-dots pt-dots-bot';
  panel.appendChild(dotsBot);

  if (sessionStorage.getItem('pt-active')) {
    sessionStorage.removeItem('pt-active');
    panel.style.transform = 'translateY(0)';
    overlay.style.pointerEvents = 'all';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      overlay.classList.add('pt-revealing');
      setTimeout(() => {
        overlay.classList.remove('pt-revealing');
        panel.style.transform = 'translateY(calc(100% + 180px))';
        overlay.style.pointerEvents = 'none';
      }, DURATION + 60);
    }));
  }

  // Fix: when a page is restored from the back/forward cache (bfcache), this
  // script does NOT re-run, so an overlay left mid-"pt-covering" (about to
  // navigate away) stays stuck covering the whole viewport in red forever.
  // Reset it on bfcache restore.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      overlay.classList.remove('pt-covering', 'pt-revealing');
      overlay.style.pointerEvents = 'none';
      panel.style.transform = 'translateY(calc(100% + 180px))';
      sessionStorage.removeItem('pt-active');
    }
  });

  document.addEventListener('click', function (e) {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href) return;
    const isExternal = link.target === '_blank' || /^(https?:)?\/\//.test(href);
    const isAnchorOnly = /^#/.test(href);
    const isSpecial = /^(mailto:|tel:)/.test(href);
    // Same-page links (e.g. "index.html#services" clicked while already on
    // index.html) don't trigger a real navigation/reload — they just scroll
    // to the anchor. If we still play the covering animation, the overlay
    // never gets revealed again and is left stuck covering the page in red.
    let isSamePage = false;
    try {
      const target = new URL(href, window.location.href);
      isSamePage = target.pathname === window.location.pathname && !!target.hash;
    } catch (_) {}
    if (isExternal || isAnchorOnly || isSpecial || isSamePage) return;

    e.preventDefault();
    overlay.style.pointerEvents = 'all';
    overlay.classList.add('pt-covering');
    sessionStorage.setItem('pt-active', '1');
    setTimeout(() => { window.location.href = href; }, DURATION);
  });
})();
