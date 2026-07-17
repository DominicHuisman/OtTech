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
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('is-open');
      navToggle.classList.toggle('is-open', open);
      navToggle.setAttribute('aria-expanded', String(open));
    });
    navLinks.addEventListener('click', (e) => {
      if (e.target.closest('a')) {
        navLinks.classList.remove('is-open');
        navToggle.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
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
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
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

    const config = () => {
      const area = window.innerWidth * window.innerHeight;
      return Math.min(Math.max(Math.floor(area / 15000), 30), 90);
    };

    const resize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * DPR;
      canvas.height = height * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
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
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const maxDist = 130;
      const mouseDist = 180;
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
  if ('IntersectionObserver' in window) {
    const secObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          $$('.nav__link').forEach((l) => l.classList.remove('is-active'));
          const link = navMap['#' + e.target.id];
          if (link) link.classList.add('is-active');
        }
      });
    }, { threshold: 0.5 });
    sections.forEach((s) => secObs.observe(s));
  }
})();
