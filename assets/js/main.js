/* AI LAB ENTERPRISE — interactions */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  $('#year').textContent = new Date().getFullYear();

  /* ---------- Split hero title into animated lines ---------- */
  const title = $('[data-split]');
  if (title) {
    const parts = title.innerHTML.split(/<br\s*\/?>/i);
    // keep the gold span intact across its own <br>
    const html = title.innerHTML
      .replace(/<span class="gold-text">([\s\S]*?)<\/span>/, (_, inner) =>
        inner.split(/<br\s*\/?>/i).map(l => `<span class="split-line"><span class="gold-text">${l.trim()}</span></span>`).join(''))
      .split(/<br\s*\/?>/i)
      .map(chunk => chunk.includes('split-line') ? chunk : `<span class="split-line"><span>${chunk.trim()}</span></span>`)
      .join('');
    if (parts.length) title.innerHTML = html;
    $$('.split-line > span', title).forEach((s, i) => (s.style.transitionDelay = `${0.1 + i * 0.12}s`));
    requestAnimationFrame(() => setTimeout(() => title.classList.add('is-in'), 80));
  }

  /* ---------- Reveal on scroll ---------- */
  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      revealIO.unobserve(e.target);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => {
    const sibs = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
    el.style.setProperty('--d', `${Math.min(sibs.indexOf(el), 6) * 0.08}s`);
    revealIO.observe(el);
  });

  /* ---------- Counters ---------- */
  const fmt = (n, el) => {
    let s = el.hasAttribute('data-fmt') ? n.toLocaleString('en-US') : String(n);
    const pad = +el.dataset.pad || 0;
    return s.padStart(pad, '0');
  };
  const runCount = el => {
    const target = +el.dataset.count;
    if (reduced) { el.textContent = fmt(target, el); return; }
    const dur = 1600, t0 = performance.now();
    const step = t => {
      const p = clamp((t - t0) / dur, 0, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(Math.round(target * eased), el);
      if (p < 1) requestAnimationFrame(step);
      else if (el.hasAttribute('data-live')) liveTicker(el, target);
    };
    requestAnimationFrame(step);
  };
  const liveTicker = (el, base) => {
    let v = base;
    setInterval(() => {
      v = clamp(v + Math.round((Math.random() - 0.45) * 6), base - 15, base + 30);
      el.textContent = v;
      $$('.live-count').forEach(l => (l.textContent = v));
    }, 1800);
  };
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      runCount(e.target);
      countIO.unobserve(e.target);
    });
  }, { threshold: 0.4 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---------- Header, progress, active section ---------- */
  const header = $('.site-header');
  const progress = $('.scroll-progress');
  const sectionNav = $('.section-nav');
  const sections = $$('main section[id]');
  const navLinks = $$('.main-nav a, .section-nav a');
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('scrolled', y > 30);
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty('--p', max > 0 ? y / max : 0);

    const mid = innerHeight * 0.45;
    let current = sections[0];
    sections.forEach(s => { if (s.getBoundingClientRect().top <= mid) current = s; });
    const diag = $('#diagnostic');
    let id = current.id;
    if (diag.getBoundingClientRect().top <= mid) id = 'diagnostic';
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
    sectionNav.classList.toggle('on-light', current.classList.contains('light'));

    // CTA parallax
    const cta = $('.cta-visual');
    if (cta) {
      const r = cta.getBoundingClientRect();
      cta.style.setProperty('--cy', `${((r.top + r.height / 2 - innerHeight / 2) / innerHeight) * -24}px`);
    }
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  const toggle = $('.menu-toggle');
  toggle.addEventListener('click', () => {
    const open = header.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  $$('.main-nav a').forEach(a => a.addEventListener('click', () => {
    header.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));

  /* ---------- Cursor glow & panel spotlight ---------- */
  if (fine && !reduced) {
    const glow = $('.cursor-glow');
    addEventListener('pointermove', e => {
      glow.style.setProperty('--mx', `${e.clientX}px`);
      glow.style.setProperty('--my', `${e.clientY}px`);
    }, { passive: true });
    $$('.panel').forEach(p => p.addEventListener('pointermove', e => {
      const r = p.getBoundingClientRect();
      p.style.setProperty('--gx', `${e.clientX - r.left}px`);
      p.style.setProperty('--gy', `${e.clientY - r.top}px`);
    }));
  } else {
    $('.cursor-glow').style.display = 'none';
  }

  /* ---------- 3D tilt cards ---------- */
  if (fine && !reduced) {
    $$('.tilt').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(800px) rotateX(${-y * 10}deg) rotateY(${x * 12}deg) translateZ(6px)`;
      });
      el.addEventListener('pointerleave', () => (el.style.transform = ''));
    });

    /* Magnetic buttons */
    $$('.magnetic').forEach(b => {
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      b.addEventListener('pointerleave', () => (b.style.transform = ''));
    });
  }

  /* ---------- Hero 3D orchestration scene ---------- */
  const orchestra = $('#orchestra');
  const scene = $('.orchestra-scene');
  if (orchestra && !reduced) {
    let tx = -10, ty = 8, scrollTilt = 0;
    const apply = () => {
      scene.style.setProperty('--ry', `${tx}deg`);
      scene.style.setProperty('--rx', `${ty + scrollTilt}deg`);
    };
    if (fine) {
      addEventListener('pointermove', e => {
        const hero = $('#hero').getBoundingClientRect();
        if (e.clientY > hero.bottom) return;
        tx = ((e.clientX / innerWidth) - 0.5) * 26;
        ty = -((e.clientY / innerHeight) - 0.5) * 18 + 6;
        apply();
      }, { passive: true });
    }
    addEventListener('scroll', () => {
      scrollTilt = clamp(scrollY / 18, 0, 30);
      apply();
    }, { passive: true });

    // agents pinging in sequence
    const agents = $$('.o-card.agent');
    let i = 0;
    setInterval(() => {
      agents.forEach(a => a.classList.remove('is-ping'));
      const a = agents[i++ % agents.length];
      a.classList.add('is-ping');
      a.querySelector('em').textContent = 'EXECUTING';
      setTimeout(() => (a.querySelector('em').textContent = 'NOMINAL'), 1400);
    }, 1600);
  }

  /* ---------- System steps ---------- */
  const bar = $('.steps-bar');
  if (bar) {
    const dotsWrap = $('.steps-dots', bar);
    const N = 13;
    for (let k = 0; k < N; k++) dotsWrap.appendChild(document.createElement('i'));
    const dots = $$('i', dotsWrap);
    const line = $('.steps-line', bar);
    const status = $('.status-text', bar);
    const run = () => {
      bar.classList.remove('done');
      status.textContent = 'EXECUTING…';
      dots.forEach(d => d.classList.remove('on'));
      line.style.setProperty('--sp', 0);
      let k = 0;
      const t = setInterval(() => {
        dots[k].classList.add('on');
        line.style.setProperty('--sp', k / (N - 1));
        status.textContent = `STEP ${String(k + 1).padStart(2, '0')} / ${N}`;
        k++;
        if (k === N) {
          clearInterval(t);
          bar.classList.add('done');
          status.textContent = 'EXECUTION COMPLETE';
          setTimeout(run, 6000);
        }
      }, reduced ? 0 : 260);
    };
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { run(); io.disconnect(); } }, { threshold: 0.6 });
    io.observe(bar);
  }

  /* ---------- Category orbit tilt ---------- */
  const orbit = $('#orbit');
  if (orbit && fine && !reduced) {
    const wrap = orbit.parentElement;
    wrap.addEventListener('pointermove', e => {
      const r = wrap.getBoundingClientRect();
      orbit.style.setProperty('--ory', `${((e.clientX - r.left) / r.width - 0.5) * 30}deg`);
      orbit.style.setProperty('--orx', `${-((e.clientY - r.top) / r.height - 0.5) * 30}deg`);
    });
    wrap.addEventListener('pointerleave', () => {
      orbit.style.setProperty('--ory', '0deg');
      orbit.style.setProperty('--orx', '0deg');
    });
  }

  /* ---------- Architecture 3D carousel ---------- */
  const viewport = $('.arch-viewport');
  const layers = $$('.layer');
  const tabs = $$('.arch-tab');
  const DUR = 8000;
  let active = 0, timer = null, paused = false;

  const typed = $('.typed');
  let typeTimer;
  const typeIt = () => {
    clearInterval(typeTimer);
    const full = typed.dataset.typed;
    let n = 0;
    typed.textContent = '';
    typeTimer = setInterval(() => {
      typed.textContent = full.slice(0, ++n);
      if (n >= full.length) clearInterval(typeTimer);
    }, 35);
  };

  const go = (idx, user) => {
    const n = layers.length;
    active = (idx + n) % n;
    layers.forEach((l, k) => {
      l.classList.toggle('is-active', k === active);
      l.classList.toggle('is-before', k < active);
      l.classList.toggle('is-after', k > active);
      l.setAttribute('aria-hidden', k !== active);
    });
    tabs.forEach((t, k) => {
      t.classList.toggle('is-active', k === active);
      t.setAttribute('aria-selected', k === active);
      // restart progress animation
      const p = $('.tab-progress', t);
      p.style.animation = 'none'; void p.offsetWidth; p.style.animation = '';
    });
    if (active === 0) typeIt();
    if (user) restart();
  };
  const restart = () => {
    clearInterval(timer);
    if (reduced) return;
    timer = setInterval(() => { if (!paused) go(active + 1); }, DUR);
  };
  viewport.style.setProperty('--dur', `${DUR}ms`);
  tabs.forEach((t, k) => t.addEventListener('click', () => go(k, true)));
  $('.arch-arrow.prev').addEventListener('click', () => go(active - 1, true));
  $('.arch-arrow.next').addEventListener('click', () => go(active + 1, true));
  viewport.addEventListener('pointerenter', () => { paused = true; viewport.classList.add('paused'); });
  viewport.addEventListener('pointerleave', () => { paused = false; viewport.classList.remove('paused'); restart(); });
  $('.arch-tabs').addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { go(active + 1, true); tabs[active].focus(); }
    if (e.key === 'ArrowLeft') { go(active - 1, true); tabs[active].focus(); }
  });
  // swipe
  let sx = null;
  viewport.addEventListener('touchstart', e => (sx = e.touches[0].clientX), { passive: true });
  viewport.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) go(active + (dx < 0 ? 1 : -1), true);
    sx = null;
  });
  const archIO = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { go(active); restart(); archIO.disconnect(); }
  }, { threshold: 0.3 });
  archIO.observe(viewport);
  go(0);

  /* Execution terminal stream */
  const term = $('#terminal');
  if (term) {
    const agents = ['FINANCE', 'SALES', 'SUPPORT', 'CONTENT', 'OPS', 'MARKET'];
    const tasks = [
      ['reconciled INV-3902 against ledger', 'ok'], ['drafted Q3 board summary', 'ok'],
      ['qualified 14 inbound leads', 'ok'], ['resolved ticket #8812 · refund issued', 'ok'],
      ['PO #4471 · $18,400 → human checkpoint', 'hold'], ['published 3 product briefs', 'ok'],
      ['competitor pricing scan · 2 alerts', 'ok'], ['onboarding sequence sent · ACCT 1042', 'ok'],
      ['forecast updated · variance −2.1%', 'ok'], ['supplier SLA breach flagged', 'hold'],
      ['synced CRM ↔ billing · 212 records', 'ok'], ['weekly ops report generated', 'ok'],
    ];
    const line = () => {
      const d = new Date();
      const [txt, st] = tasks[Math.floor(Math.random() * tasks.length)];
      const ag = agents[Math.floor(Math.random() * agents.length)];
      const el = document.createElement('div');
      el.innerHTML = `<span class="t-time">${d.toTimeString().slice(0, 8)}</span> <span class="t-agent">[${ag}]</span> ${txt} <span class="${st === 'ok' ? 't-ok' : 't-hold'}">${st === 'ok' ? '✓ DONE' : '◆ REVIEW'}</span>`;
      term.appendChild(el);
      while (term.children.length > 16) term.firstChild.remove();
    };
    for (let k = 0; k < 10; k++) line();
    setInterval(line, 1100);
  }

  /* Approve checkpoint */
  const approve = $('.mini-btn');
  if (approve) approve.addEventListener('click', () => {
    approve.textContent = 'APPROVED ✓';
    approve.classList.add('ok');
    setTimeout(() => { approve.textContent = 'APPROVE'; approve.classList.remove('ok'); }, 2500);
  });

  /* ---------- Modal ---------- */
  const modal = $('#story-modal');
  let lastFocus;
  const openModal = () => {
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    $('.modal-close', modal).focus();
  };
  const closeModal = () => {
    modal.hidden = true;
    document.body.style.overflow = '';
    lastFocus && lastFocus.focus();
  };
  $$('[data-open-modal]').forEach(b => b.addEventListener('click', openModal));
  $$('[data-close-modal]', modal).forEach(b => b.addEventListener('click', closeModal));
  addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });

  /* ---------- Background network canvas ---------- */
  const cv = $('#bg-canvas');
  const ctx = cv.getContext('2d');
  let W, H, pts = [], dpr = Math.min(devicePixelRatio || 1, 2);
  const mouse = { x: -9999, y: -9999 };
  const resize = () => {
    W = cv.width = innerWidth * dpr;
    H = cv.height = innerHeight * dpr;
    const count = Math.round(clamp((innerWidth * innerHeight) / 18000, 30, 90));
    pts = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.25 * dpr, vy: (Math.random() - 0.5) * 0.25 * dpr,
      r: (Math.random() * 1.4 + 0.4) * dpr,
    }));
  };
  resize();
  addEventListener('resize', resize);
  addEventListener('pointermove', e => { mouse.x = e.clientX * dpr; mouse.y = e.clientY * dpr; }, { passive: true });
  const LINK = 130 * dpr;
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      const dx = p.x - mouse.x, dy = p.y - mouse.y, dm = Math.hypot(dx, dy);
      if (dm < 140 * dpr) { p.x += dx / dm * 0.6; p.y += dy / dm * 0.6; }
    }
    for (let a = 0; a < pts.length; a++) {
      for (let b = a + 1; b < pts.length; b++) {
        const dx = pts[a].x - pts[b].x, dy = pts[a].y - pts[b].y;
        const d = dx * dx + dy * dy;
        if (d < LINK * LINK) {
          ctx.strokeStyle = `rgba(80,150,255,${(1 - Math.sqrt(d) / LINK) * 0.22})`;
          ctx.lineWidth = dpr * 0.6;
          ctx.beginPath(); ctx.moveTo(pts[a].x, pts[a].y); ctx.lineTo(pts[b].x, pts[b].y); ctx.stroke();
        }
      }
    }
    for (const p of pts) {
      ctx.fillStyle = 'rgba(140,190,255,.7)';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    if (!reduced) requestAnimationFrame(draw);
  };
  draw();
})();
