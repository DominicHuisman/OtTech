/* ============================================================
   OTTECH Solutions — Interactions
   ============================================================ */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Loader ---------- */
  window.addEventListener('load', () => {
    const loader = $('#loader');
    if (!loader) return;
    setTimeout(() => loader.classList.add('is-hidden'), 500);
  });

  /* ---------- Current year ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Nav: scroll blur + mobile toggle ---------- */
  const nav = $('#nav');
  const navToggle = $('#navToggle');
  const navLinks = $('#navLinks');

  const onScrollNav = () => {
    if (window.scrollY > 20) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  onScrollNav();

  if (navToggle && navLinks) {
    // iOS-safe scroll lock: save the current scroll position, pin the
    // body with position:fixed while the menu is open, then restore
    // the exact scroll position on close. Prevents jolt/rubber-band
    // and preserves where the user was in the page.
    let savedScrollY = 0;
    const openMenu = () => {
      savedScrollY = window.scrollY || window.pageYOffset || 0;
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.classList.add('nav-open');
      navLinks.classList.add('is-open');
      navToggle.classList.add('is-open');
      navToggle.setAttribute('aria-expanded', 'true');
    };
    const closeMenu = () => {
      navLinks.classList.remove('is-open');
      navToggle.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('nav-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      // Force instant restore — html { scroll-behavior: smooth }
      // would otherwise animate the jump and drift the final position.
      const prevBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, savedScrollY);
      document.documentElement.style.scrollBehavior = prevBehavior;
    };

    navToggle.addEventListener('click', () => {
      if (navLinks.classList.contains('is-open')) closeMenu();
      else openMenu();
    });
    navLinks.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;
      // Close first so scroll position is restored, then jump.
      const href = link.getAttribute('href');
      closeMenu();
      if (href && href.startsWith('#')) {
        e.preventDefault();
        // Wait one frame so layout settles after unlocking the body,
        // then scroll to the target section.
        requestAnimationFrame(() => {
          const target = document.querySelector(href);
          if (target) target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
        });
      }
    });
    // Escape key closes the mobile overlay
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('is-open')) closeMenu();
    });
  }

  /* ---------- Scroll progress + back-to-top ---------- */
  const progress = $('#scrollProgress');
  const backToTop = $('#backToTop');

  const onScroll = () => {
    onScrollNav();
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (progress) progress.style.width = pct + '%';
    if (backToTop) backToTop.classList.toggle('is-visible', scrollTop > 600);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  }

  /* ---------- Reveal on scroll (Intersection Observer) ---------- */
  const revealEls = $$('[data-reveal]');
  // staggered delay for grouped cards
  const stagger = (els) => els.forEach((el, i) => {
    const parent = el.parentElement;
    const siblings = $$('[data-reveal]', parent);
    const idx = siblings.indexOf(el);
    el.style.transitionDelay = (idx > 0 ? Math.min(idx, 6) * 0.08 : 0) + 's';
  });
  stagger(revealEls);

  if ('IntersectionObserver' in window && !prefersReduced) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -22% 0px' });
    revealEls.forEach((el) => io.observe(el));

    // Hero line reveals
    const lineObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('is-visible'); });
    }, { threshold: 0.3 });
    $$('.reveal-line').forEach((el, i) => {
      el.style.transitionDelay = 0.15 + i * 0.12 + 's';
      lineObserver.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
    $$('.reveal-line').forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Immersive: magnetic buttons ---------- */
  if (!prefersReduced && window.matchMedia('(pointer: fine)').matches) {
    $$('.btn--primary, .btn--ghost, .btn--dark').forEach((btn) => {
      const strength = 0.35;
      btn.addEventListener('mousemove', (e) => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * strength;
        const y = (e.clientY - r.top - r.height / 2) * strength;
        btn.style.transform = `translate(${x}px, ${y - 2}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- Immersive: 3D tilt + spotlight tracking ---------- */
  if (!prefersReduced && window.matchMedia('(pointer: fine)').matches) {
    // Service cards: tilt + spotlight
    $$('.service').forEach((card) => {
      const maxTilt = 7;
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const rx = (0.5 - py) * maxTilt;
        const ry = (px - 0.5) * maxTilt;
        card.style.transform = `translateY(-8px) perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
        card.style.setProperty('--mx', px * 100 + '%');
        card.style.setProperty('--my', py * 100 + '%');
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });

    // Why cards: spotlight only (glass panels)
    $$('.why__card').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
      });
    });
  }

  /* ---------- Soft parallax on hero glows ---------- */
  if (!prefersReduced) {
    const glow1 = $('.hero__glow--1');
    const glow2 = $('.hero__glow--2');
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY;
          if (glow1) glow1.style.transform = `translateY(${y * 0.15}px)`;
          if (glow2) glow2.style.transform = `translateY(${y * -0.1}px)`;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ---------- Smooth scroll for in-page anchors ---------- */
  const mqPage = window.matchMedia('(max-width: 640px)');
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (mqPage.matches) {
        // On the mobile page-per-section layout, sections have their
        // own top padding to clear the fixed nav, so scroll flush to top.
        target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
        return;
      }
      const offset = 76;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });

  /* ---------- Contact form validation ---------- */
  const form = $('#contactForm');
  if (form) {
    const showError = (field, msg) => {
      field.classList.add('is-invalid');
      const err = $('[data-error]', field);
      if (err) err.textContent = msg;
    };
    const clearError = (field) => {
      field.classList.remove('is-invalid');
      const err = $('[data-error]', field);
      if (err) err.textContent = '';
    };
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;

      const nameField = $('#name').closest('.field');
      const emailField = $('#email').closest('.field');
      const msgField = $('#message').closest('.field');

      if (!$('#name').value.trim()) { showError(nameField, 'Please enter your name.'); valid = false; }
      else clearError(nameField);

      const emailVal = $('#email').value.trim();
      if (!emailVal) { showError(emailField, 'Please enter your email.'); valid = false; }
      else if (!emailRe.test(emailVal)) { showError(emailField, 'Please enter a valid email address.'); valid = false; }
      else clearError(emailField);

      if (!$('#message').value.trim()) { showError(msgField, 'Please tell us a little about your needs.'); valid = false; }
      else clearError(msgField);

      if (!valid) return;

      const btn = $('button[type="submit"]', form);
      const original = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = 'Sending…';

      // Simulated async submission (no backend). Replace with real endpoint as needed.
      setTimeout(() => {
        form.reset();
        btn.disabled = false;
        btn.innerHTML = original;
        const success = $('#formSuccess');
        if (success) {
          success.hidden = false;
          success.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'nearest' });
          setTimeout(() => { success.hidden = true; }, 6000);
        }
      }, 1100);
    });

    form.addEventListener('input', (e) => {
      const field = e.target.closest('.field');
      if (field && field.classList.contains('is-invalid')) clearError(field);
    });
  }

  /* ---------- Animated network background (canvas) ---------- */
  const canvas = $('#network');
  if (canvas && !prefersReduced) {
    const ctx = canvas.getContext('2d');
    let width, height, points, raf;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const mouse = { x: null, y: null, active: false };
    const heroEl = $('#hero');
    const cursorGlow = $('#heroCursor');

    // Predefined constellation shapes — stars use normalized coords (-1..1),
    // edges list index pairs describing the "connect-the-dots" pattern.
    const CONSTELLATIONS = [
      { // Big Dipper
        stars: [[-1,-.35],[-.55,-.15],[-.15,-.05],[.25,.1],[.45,-.25],[.75,-.5],[1,-.15]],
        edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[3,6]],
      },
      { // Orion (belt + shoulders + feet)
        stars: [[-.7,-.9],[.7,-.8],[-.2,-.15],[0,-.05],[.2,.05],[-.85,.75],[.75,.85],[-.35,.3]],
        edges: [[0,2],[1,4],[2,3],[3,4],[2,5],[4,6],[3,7]],
      },
      { // Cassiopeia (W)
        stars: [[-1,-.2],[-.5,.4],[0,-.3],[.5,.4],[1,-.15]],
        edges: [[0,1],[1,2],[2,3],[3,4]],
      },
      { // Cygnus (cross)
        stars: [[0,-1],[-.05,-.2],[-.9,.1],[.85,.05],[.05,.9]],
        edges: [[0,1],[1,2],[1,3],[1,4]],
      },
      { // Lyra (small parallelogram + star)
        stars: [[0,-1],[-.4,-.15],[.4,-.05],[-.3,.6],[.45,.7]],
        edges: [[0,1],[0,2],[1,3],[2,4],[3,4]],
      },
      { // Corona Borealis (arc)
        stars: [[-1,.35],[-.65,-.05],[-.25,-.35],[.2,-.4],[.6,-.2],[.9,.15]],
        edges: [[0,1],[1,2],[2,3],[3,4],[4,5]],
      },
      { // Triangulum
        stars: [[-.9,.5],[.9,.4],[-.1,-.8]],
        edges: [[0,1],[1,2],[2,0]],
      },
      { // Ursa Minor (little dipper)
        stars: [[-.9,-.4],[-.45,-.2],[-.05,-.05],[.35,.15],[.65,-.15],[.9,-.45],[.6,.35]],
        edges: [[0,1],[1,2],[2,3],[3,4],[4,5],[3,6]],
      },
    ];

    const constellations = [];

    const config = () => {
      if (width < 640) return 22; // lighter density on phones
      const area = window.innerWidth * window.innerHeight;
      return Math.min(Math.max(Math.floor(area / 12000), 40), 120);
    };

    const resize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * DPR;
      canvas.height = height * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };

    const buildConstellations = () => {
      constellations.length = 0;
      const isSmall = width < 640;
      // Scale count with viewport size (roughly 1 per 220k px^2)
      const target = isSmall
        ? Math.min(Math.max(Math.round((width * height) / 260000), 2), 3)
        : Math.min(Math.max(Math.round((width * height) / 220000), 3), 8);
      const shuffled = CONSTELLATIONS.slice().sort(() => Math.random() - 0.5);
      for (let i = 0; i < target; i++) {
        const shape = shuffled[i % shuffled.length];
        const scale = isSmall
          ? 42 + Math.random() * 34   // 42–76px on phones
          : 60 + Math.random() * 70;  // 60–130px otherwise
        const pad = scale + 20;
        const cx = pad + Math.random() * Math.max(1, width - pad * 2);
        const cy = pad + Math.random() * Math.max(1, height - pad * 2);
        const rot = Math.random() * Math.PI * 2;
        const cos = Math.cos(rot), sin = Math.sin(rot);
        const stars = shape.stars.map(([nx, ny]) => {
          const rx = nx * cos - ny * sin;
          const ry = nx * sin + ny * cos;
          return {
            ox: rx * scale,   // offset from center (rotated + scaled)
            oy: ry * scale,
            x: cx + rx * scale,
            y: cy + ry * scale,
            r: 1.1 + Math.random() * 1.3,
            tw: Math.random() * Math.PI * 2, // twinkle phase
          };
        });
        constellations.push({
          cx, cy,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
          stars,
          edges: shape.edges,
        });
      }
    };

    const init = () => {
      resize();
      const count = config();
      points = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 1.6 + 0.6,
      }));
      buildConstellations();
    };

    let tick = 0;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      tick += 0.016;
      const maxDist = 130;
      const mouseDist = 180;

      // --- Constellations: drift, draw fixed connections, twinkling stars ---
      for (const c of constellations) {
        c.cx += c.vx; c.cy += c.vy;
        // Bounce softly against edges based on farthest star extent
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        for (const s of c.stars) {
          s.x = c.cx + s.ox;
          s.y = c.cy + s.oy;
          if (s.x < minX) minX = s.x; if (s.x > maxX) maxX = s.x;
          if (s.y < minY) minY = s.y; if (s.y > maxY) maxY = s.y;
        }
        if (minX < 0 && c.vx < 0) c.vx *= -1;
        if (maxX > width && c.vx > 0) c.vx *= -1;
        if (minY < 0 && c.vy < 0) c.vy *= -1;
        if (maxY > height && c.vy > 0) c.vy *= -1;

        // Fixed constellation lines
        for (const [a, b] of c.edges) {
          const s1 = c.stars[a], s2 = c.stars[b];
          ctx.beginPath();
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
          ctx.strokeStyle = 'rgba(124,196,255,0.28)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        // Stars (with subtle twinkle + halo)
        for (const s of c.stars) {
          const tw = 0.75 + Math.sin(tick * 1.4 + s.tw) * 0.25;
          // halo
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 3.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(124,196,255,${0.08 * tw})`;
          ctx.fill();
          // core
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(210,230,255,${0.85 * tw})`;
          ctx.fill();

          // Cursor connection line to constellation stars
          if (mouse.active && mouse.x !== null) {
            const cdx = s.x - mouse.x, cdy = s.y - mouse.y;
            const cd = Math.hypot(cdx, cdy);
            if (cd < mouseDist) {
              const a = (1 - cd / mouseDist) * 0.55;
              ctx.beginPath();
              ctx.moveTo(s.x, s.y);
              ctx.lineTo(mouse.x, mouse.y);
              ctx.strokeStyle = `rgba(160,210,255,${a})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }
      }

      // --- Free-floating background points (with mouse interactivity) ---
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Gentle drift toward the cursor for an interactive, living feel
        if (mouse.active && mouse.x !== null) {
          const mdx = mouse.x - p.x, mdy = mouse.y - p.y;
          const md = Math.hypot(mdx, mdy);
          if (md < mouseDist && md > 0.5) {
            const pull = (1 - md / mouseDist) * 0.18;
            p.x += (mdx / md) * pull;
            p.y += (mdy / md) * pull;
          }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(124,196,255,0.75)';
        ctx.fill();

        // Connect points to the cursor with brighter lines
        if (mouse.active && mouse.x !== null) {
          const cdx = p.x - mouse.x, cdy = p.y - mouse.y;
          const cd = Math.hypot(cdx, cdy);
          if (cd < mouseDist) {
            const a = (1 - cd / mouseDist) * 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(124,196,255,${a})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        for (let j = i + 1; j < points.length; j++) {
          const q = points[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.hypot(dx, dy);
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.35;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(90,150,255,${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };

    init();
    draw();

    // Pointer tracking for interactive network + cursor glow
    if (heroEl && window.matchMedia('(pointer: fine)').matches) {
      heroEl.addEventListener('pointermove', (e) => {
        const r = canvas.getBoundingClientRect();
        mouse.x = e.clientX - r.left;
        mouse.y = e.clientY - r.top;
        mouse.active = true;
        heroEl.classList.add('is-pointer');
        if (cursorGlow) cursorGlow.style.transform = `translate3d(${mouse.x}px, ${mouse.y}px, 0)`;
      });
      heroEl.addEventListener('pointerleave', () => {
        mouse.active = false;
        mouse.x = mouse.y = null;
        heroEl.classList.remove('is-pointer');
      });
    }

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { cancelAnimationFrame(raf); init(); draw(); }, 200);
    });

    // Pause when hero not visible (performance)
    const hero = $('#hero');
    if (hero && 'IntersectionObserver' in window) {
      const heroObs = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { if (!raf) draw(); }
          else { cancelAnimationFrame(raf); raf = null; }
        });
      }, { threshold: 0 });
      heroObs.observe(hero);
    }
  }

  /* ---------- Active nav link on scroll ---------- */
  const sections = $$('main section[id]');
  const navMap = {};
  $$('.nav__link').forEach((l) => { navMap[l.getAttribute('href')] = l; });

  /* ---------- Mobile page dots + light-section theme tracking ---------- */
  const pageDots = $$('.page-dot');
  const dotMap = {};
  pageDots.forEach((d) => { dotMap[d.dataset.target] = d; });
  pageDots.forEach((d) => {
    d.addEventListener('click', () => {
      const t = document.querySelector(d.dataset.target);
      if (!t) return;
      t.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
    });
  });
  // Sections whose visible background is a light color — dots invert here
  const LIGHT_SECTIONS = new Set(['about', 'services', 'contact']);
  // Theme-color per section so the mobile status bar / safe-area
  // matches what's actually on screen instead of flashing white.
  const themeMeta = document.getElementById('themeColor');
  const THEME_COLORS = {
    hero: '#060b1c',
    about: '#fbfcfe',
    services: '#ffffff',
    why: '#060b1c',
    contact: '#fbfcfe'
  };
  const setTheme = (id) => {
    if (!themeMeta) return;
    const c = THEME_COLORS[id];
    if (c) themeMeta.setAttribute('content', c);
  };

  if ('IntersectionObserver' in window) {
    const secObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          $$('.nav__link').forEach((l) => l.classList.remove('is-active'));
          const link = navMap['#' + e.target.id];
          if (link) link.classList.add('is-active');

          // Mobile page dots
          pageDots.forEach((d) => d.classList.remove('is-active'));
          const dot = dotMap['#' + e.target.id];
          if (dot) dot.classList.add('is-active');

          // Toggle light/dark theme for the page-dot rail
          if (LIGHT_SECTIONS.has(e.target.id)) document.body.classList.add('on-light');
          else document.body.classList.remove('on-light');

          // Sync the browser chrome theme-color meta
          setTheme(e.target.id);
        }
      });
    }, { threshold: 0.5 });
    sections.forEach((s) => secObs.observe(s));
  }
})();
