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
    cursor.innerHTML = '<div class="cursor-dot"></div>';
    document.body.appendChild(cursor);

    const dot = cursor.querySelector('.cursor-dot');

    document.addEventListener('mousemove', e => {
      dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px';
    });

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

    const revealChecks = el => el.querySelectorAll('.np-check').forEach(c => c.classList.add('revealed'));

    if (reducedMotion) {
      reveals.forEach(el => { el.classList.add('visible'); revealChecks(el); });
    } else {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('visible'); revealChecks(e.target); }
        });
      }, { threshold: 0.12 });
      reveals.forEach(el => observer.observe(el));
    }
  }

  /* ---------- Hero logo-mark + glow: hue-cycle only while scrolled into view ---------- */
  const heroLogoMark = document.querySelector('.hero-logo-mark');
  const heroGlowEl   = document.querySelector('.hero-glow');
  const hueTargets   = [heroLogoMark, heroGlowEl].filter(Boolean);
  if (hueTargets.length) {
    if (reducedMotion) {
      hueTargets.forEach(el => el.classList.add('in-view'));
    } else {
      const logoObserver = new IntersectionObserver(entries => {
        entries.forEach(e => e.target.classList.toggle('in-view', e.isIntersecting));
      }, { threshold: 0.1 });
      hueTargets.forEach(el => logoObserver.observe(el));
    }
  }

  /* ---------- Auto-pulse animated icons every ~2s (instead of hover-only) ---------- */
  const pulseTargets = document.querySelectorAll('.icon-plug, .service-card, .testimonial-shell, .np-check');
  if (pulseTargets.length && !reducedMotion) {
    setInterval(() => {
      const pt = document.getElementById('page-transition');
      if (pt && (pt.classList.contains('pt-covering') || pt.classList.contains('pt-revealing'))) return;
      pulseTargets.forEach((el, i) => {
        setTimeout(() => {
          el.classList.add('pulse');
          setTimeout(() => el.classList.remove('pulse'), 700);
        }, (i % 5) * 90); // slight stagger so a page full of icons doesn't pulse as one block
      });
    }, 2000);
  }

  /* ---------- Process section: scroll-synced line-draw + mobile carousel ---------- */
  const processHeader  = document.querySelector('.process-header');
  const processSteps   = document.querySelector('.process-steps');
  const stepStack      = document.querySelector('.step-stack');
  // Desktop icons (inside .process-visual) and mobile icons (inside .process-visual-mob)
  const desktopIcons   = Array.from(document.querySelectorAll('.process-visual .anim-icon'));
  const mobileIcons    = Array.from(document.querySelectorAll('.process-visual-mob .anim-icon'));
  const stepEls        = document.querySelectorAll('.process-steps .step');
  const dotEls         = document.querySelectorAll('.process-dot');
  const isMobileProcess = () => window.matchMedia('(max-width: 900px)').matches;
  const segments = Math.max(desktopIcons.length, mobileIcons.length, 1);

  if (processHeader && processSteps && segments > 0) {
    let ticking = false;

    const applyIconAnim = (icons, progress, segments, instant) => {
      const w = 1 / segments;
      icons.forEach((icon, i) => {
        if (instant) {
          // Mobile: snap to active icon with smooth CSS transition
          const active = i === Math.min(segments - 1, Math.floor(progress * segments));
          icon.style.transition = 'stroke-dashoffset .55s cubic-bezier(.22,1,.36,1), opacity .3s ease';
          icon.style.strokeDashoffset = active ? '0' : '100';
          icon.style.opacity = active ? '1' : '0';
        } else {
          // Desktop: magnetic draw-in / hold / erase
          const local = (progress - i * w) / w;
          let net = 0;
          let pull = 0; // 0->1->0 bump used to overshoot-scale the icon as it snaps in
          if (local > 0 && local < 1) {
            if (local < 0.16) {
              const t = local / 0.16;
              net = 1 - Math.pow(1 - t, 4); // sharper, snappier "magnetic" pull-in
              pull = Math.sin(t * Math.PI);
            } else if (local < 0.58) {
              net = 1;
            } else {
              const t = (local - 0.58) / 0.42;
              net = 1 - Math.pow(t, 2.2);
            }
          }
          net = Math.min(1, Math.max(0, net));
          icon.style.strokeDashoffset = String(100 - net * 100);
          icon.style.opacity = net > 0.02 ? '1' : '0';
          icon.style.transform = `scale(${1 + pull * 0.16})`;
        }
      });
    };

    const updateProcess = () => {
      const mobile = isMobileProcess();
      const vh = window.innerHeight;

      if (mobile) {
        // Mobile: progress is how far through process-steps we've scrolled
        const navH = 64;
        const visH = 48 / 100 * vh; // matches the 48vh sticky visual
        const stickyOff = navH + visH;
        const rect = processSteps.getBoundingClientRect();
        const scrollable = rect.height - (vh - stickyOff);
        const scrolled   = stickyOff - rect.top;
        let progress = scrollable > 0 ? scrolled / scrollable : 0;
        progress = Math.min(1, Math.max(0, progress));

        const activeIndex = Math.min(segments - 1, Math.floor(progress * segments));
        dotEls.forEach((dot, i) => dot.classList.toggle('active', i === activeIndex));
        stepEls.forEach((step, i) => step.classList.toggle('active', i === activeIndex));

        // Slide the step-stack horizontally
        if (stepStack) {
          const maxScroll = stepStack.scrollWidth - stepStack.clientWidth;
          stepStack.scrollLeft = progress * maxScroll;
        }

        applyIconAnim(mobileIcons, progress, segments, true);
      } else {
        // Desktop: sticky header sits at 72px, progress through steps below it
        const headerH  = processHeader.getBoundingClientRect().height;
        const stickyTop = 72 + headerH;
        const rect      = processSteps.getBoundingClientRect();
        const scrollable = rect.height - (vh - stickyTop);
        const scrolled   = stickyTop - rect.top;
        let progress = scrollable > 0 ? scrolled / scrollable : 0;
        progress = Math.min(1, Math.max(0, progress));

        const activeIndex = Math.min(segments - 1, Math.floor(progress * segments));
        dotEls.forEach((dot, i) => dot.classList.toggle('active', i === activeIndex));
        stepEls.forEach((step, i) => step.classList.toggle('active', i === activeIndex));

        // Fade/rise each step based on proximity to focal point
        const focalY = (stickyTop + vh) / 2;
        stepEls.forEach(step => {
          const r = step.getBoundingClientRect();
          const center = r.top + r.height / 2;
          const dist   = Math.abs(center - focalY);
          const raw    = Math.max(0, 1 - dist / ((vh - stickyTop) * 0.55));
          const fade   = Math.pow(raw, 0.5);
          step.style.opacity   = String(Math.max(0.1, fade));
          step.style.transform = `translateY(${(1 - fade) * 28}px)`;
        });

        applyIconAnim(desktopIcons, progress, segments, false);
      }

      ticking = false;
    };

    updateProcess();
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(updateProcess); ticking = true; }
    }, { passive: true });
    window.addEventListener('resize', updateProcess);
  }

  /* ---------- Stat counter animation ---------- */
  const countEls = document.querySelectorAll('[data-count]');
  if (countEls.length) {
    const countObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting || e.target.dataset.counted) return;
        e.target.dataset.counted = '1';
        const target = parseInt(e.target.dataset.count, 10);
        const suffix = e.target.dataset.suffix || '';
        const start  = performance.now();
        const dur    = 1600;
        const tick = now => {
          const t     = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          e.target.textContent = Math.round(eased * target) + suffix;
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });
    countEls.forEach(el => countObs.observe(el));
  }

  /* ---------- Hero glow mouse parallax ---------- */
  const heroGlow = document.querySelector('.hero-glow');
  const heroEl   = document.querySelector('.hero');
  if (heroGlow && heroEl) {
    let mx = 0, my = 0, tx = 0, ty = 0;
    heroEl.addEventListener('mousemove', e => {
      const r = heroEl.getBoundingClientRect();
      mx = (e.clientX / r.width  - 0.5) * 48;
      my = (e.clientY / r.height - 0.5) * 28;
    }, { passive: true });
    (function glowParallax() {
      tx += (mx - tx) * 0.06;
      ty += (my - ty) * 0.06;
      heroGlow.style.transform = `translate(${tx}px, ${ty}px)`;
      requestAnimationFrame(glowParallax);
    })();
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
    document.body.classList.add('pt-navigating');
    panel.style.transform = 'translateY(0)';
    overlay.style.pointerEvents = 'all';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      overlay.classList.add('pt-revealing');
      setTimeout(() => {
        overlay.classList.remove('pt-revealing');
        document.body.classList.remove('pt-navigating');
        panel.style.transform = 'translateY(calc(100% + 180px))';
        overlay.style.pointerEvents = 'none';
      }, DURATION + 60);
    }));
  }

  // Reset on bfcache restore — the script doesn't re-run, so an overlay
  // stuck mid-cover would freeze the page in red. Also fires on any pageshow
  // so we always start clean if somehow the flag wasn't consumed.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      navigating = false;
      overlay.classList.remove('pt-covering', 'pt-revealing');
      overlay.style.pointerEvents = 'none';
      panel.style.transform = 'translateY(calc(100% + 180px))';
      sessionStorage.removeItem('pt-active');
    }
  });

  // Guard: ignore rapid second clicks while the cover animation is playing.
  let navigating = false;

  document.addEventListener('click', function (e) {
    if (navigating) return;
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
    navigating = true;
    overlay.style.pointerEvents = 'all';
    overlay.classList.add('pt-covering');
    // Heavy filter-based animations (hue-rotate on the logo/glow) compete with the
    // compositor during the cover/reveal — pause them so the panel slide stays smooth.
    document.body.classList.add('pt-navigating');
    sessionStorage.setItem('pt-active', '1');
    setTimeout(() => { window.location.href = href; }, DURATION);
  });
})();
