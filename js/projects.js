// ============================================
// PROJECTS PAGE — SCROLL & NAVIGATION
// ============================================

(function () {
  const arrowBtn = document.querySelector('.projects-hero-arrow');
  const sections = document.querySelectorAll('.project-detail');
  const nav = document.getElementById('nav');
  const rail = document.getElementById('projects-rail');
  const railTab = document.getElementById('projects-rail-tab');
  const railLinks = document.querySelectorAll('.projects-rail-link');
  const projectsHeroEl = document.getElementById('projects-hero');

  let stopProgrammaticScroll = null;

  function easeInOutCubic(t) {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /** Smooth scroll that yields as soon as the user scrolls (wheel / touch / keys). */
  function smoothScrollTo(targetY, duration) {
    if (typeof stopProgrammaticScroll === 'function') {
      stopProgrammaticScroll();
      stopProgrammaticScroll = null;
    }

    const startY = window.scrollY;
    const diff = targetY - startY;
    if (Math.abs(diff) < 2) return;

    let startTime = null;
    let rafId = 0;
    let done = false;

    function teardown() {
      window.removeEventListener('wheel', onUserScroll, { passive: true });
      window.removeEventListener('touchstart', onUserScroll, { passive: true });
      window.removeEventListener('touchmove', onUserScroll, { passive: true });
      window.removeEventListener('keydown', onUserKey);
      stopProgrammaticScroll = null;
    }

    function finish() {
      if (done) return;
      done = true;
      cancelAnimationFrame(rafId);
      teardown();
    }

    function onUserScroll() {
      finish();
    }

    function onUserKey(e) {
      const keys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'];
      if (keys.includes(e.key)) finish();
    }

    window.addEventListener('wheel', onUserScroll, { passive: true });
    window.addEventListener('touchstart', onUserScroll, { passive: true });
    window.addEventListener('touchmove', onUserScroll, { passive: true });
    window.addEventListener('keydown', onUserKey);

    stopProgrammaticScroll = finish;

    function step(timestamp) {
      if (done) return;
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      window.scrollTo(0, startY + diff * easeInOutCubic(progress));
      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        finish();
      }
    }

    rafId = requestAnimationFrame(step);
  }

  /** Align scroll so `.project-detail-name` sits just below the fixed nav (same as hash deep links). */
  function scrollYForProjectTitle(titleEl) {
    const navEl = document.getElementById('nav');
    const navH = navEl ? navEl.offsetHeight : 0;
    const gap = 28;
    const y = titleEl.getBoundingClientRect().top + window.scrollY - navH - gap;
    return Math.max(0, y);
  }

  // Arrow button → first project: land on the title, not the section top (nav-safe)
  if (arrowBtn) {
    arrowBtn.addEventListener('click', () => {
      const firstSection = sections[0];
      const title = firstSection?.querySelector('.project-detail-name');
      if (title) {
        smoothScrollTo(scrollYForProjectTitle(title), 700);
      } else if (firstSection) {
        smoothScrollTo(firstSection.getBoundingClientRect().top + window.scrollY, 700);
      }
    });
  }

  // Nav show/hide — rAF-throttle to avoid layout thrash on long pages
  let lastScroll = 0;
  let navScrollScheduled = false;
  function handleNavScroll() {
    if (navScrollScheduled) return;
    navScrollScheduled = true;
    requestAnimationFrame(() => {
      navScrollScheduled = false;
      const y = window.scrollY;
      if (y > 100 && y > lastScroll) {
        nav.classList.add('hidden');
      } else {
        nav.classList.remove('hidden');
      }
      lastScroll = y;
    });
  }
  window.addEventListener('scroll', handleNavScroll, { passive: true });

  // Scroll reveal for project sections
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );

  sections.forEach(section => sectionObserver.observe(section));

  // Scroll reveal for collage rows — lighter animation to reduce paint cost while scrolling
  const rowObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          rowObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
  );

  document.querySelectorAll('.collage-row').forEach(row => rowObserver.observe(row));

  // WWIM diagram carousel
  document.querySelectorAll('[data-diagram-carousel]').forEach((root) => {
    const slides = root.querySelectorAll('.diagram-presentation__slide');
    const prevBtn = root.querySelector('[data-dir="prev"]');
    const nextBtn = root.querySelector('[data-dir="next"]');
    const n = slides.length;
    if (n === 0) return;

    let index = 0;

    function show(nextIndex) {
      index = ((nextIndex % n) + n) % n;
      slides.forEach((slide, j) => {
        const active = j === index;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      });
    }

    slides.forEach((slide, j) => {
      slide.setAttribute('aria-hidden', j === 0 ? 'false' : 'true');
    });

    prevBtn?.addEventListener('click', () => show(index - 1));
    nextBtn?.addEventListener('click', () => show(index + 1));

    root.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        show(index - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        show(index + 1);
      }
    });
  });

  // Robotic & Karamba — object/grid buttons → show explanation bubble
  const bubble = document.getElementById('robotic-bubble');
  const bubbleImg = bubble?.querySelector('.robotic-bubble-img');
  const bubbleRich = bubble?.querySelector('.robotic-bubble-rich');
  const bubbleClose = bubble?.querySelector('.robotic-bubble-close');

  function pauseVideosInBubble() {
    bubbleRich?.querySelectorAll('video').forEach((v) => {
      v.pause();
      v.currentTime = 0;
    });
  }

  function openBubbleImage(src) {
    if (!bubbleImg || !src) return;
    pauseVideosInBubble();
    if (bubbleRich) {
      bubbleRich.innerHTML = '';
      bubbleRich.hidden = true;
    }
    bubbleImg.hidden = false;
    bubbleImg.src = src;
    bubble?.classList.add('is-visible');
    bubble?.setAttribute('aria-hidden', 'false');
  }

  function openKarambaRich(key) {
    const source = document.getElementById(`karamba-explanation-${key}`);
    if (!source || !bubbleRich) return;
    pauseVideosInBubble();
    bubbleImg.hidden = true;
    bubbleImg.removeAttribute('src');
    bubbleImg.alt = '';
    bubbleRich.innerHTML = source.innerHTML;
    bubbleRich.hidden = false;
    bubble?.classList.add('is-visible');
    bubble?.setAttribute('aria-hidden', 'false');
  }

  document.querySelectorAll('.robotic-object-btn').forEach((btn) => {
    btn.addEventListener('click', () => openBubbleImage(btn.getAttribute('data-explanation')));
  });
  document.querySelectorAll('.goatisland-lightbox-btn').forEach((btn) => {
    btn.addEventListener('click', () => openBubbleImage(btn.getAttribute('data-explanation')));
  });
  document.querySelectorAll('.karamba-grid-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-karamba-explanation');
      const src = btn.getAttribute('data-explanation');
      if (key) openKarambaRich(key);
      else if (src) openBubbleImage(src);
    });
  });

  function closeBubble() {
    pauseVideosInBubble();
    bubble?.classList.remove('is-visible');
    bubble?.setAttribute('aria-hidden', 'true');
    if (bubbleRich) {
      bubbleRich.innerHTML = '';
      bubbleRich.hidden = true;
    }
    if (bubbleImg) {
      bubbleImg.hidden = false;
      bubbleImg.removeAttribute('src');
    }
  }
  bubbleClose?.addEventListener('click', closeBubble);
  bubble?.addEventListener('click', (e) => {
    if (e.target === bubble) closeBubble();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && bubble?.classList.contains('is-visible')) {
      closeBubble();
      return;
    }
    if (
      e.key === 'Escape' &&
      rail &&
      !rail.classList.contains('is-on-hero') &&
      !rail.classList.contains('is-collapsed')
    ) {
      rail.classList.add('is-collapsed');
      railTab?.setAttribute('aria-expanded', 'false');
      if (railTab) railTab.title = 'Show project menu';
    }
  });

  // Floating project rail — toggle, smooth jump, active state while scrolling
  if (rail && railTab && railLinks.length) {
    function updateRailHeroMode() {
      if (!projectsHeroEl) return;
      const pastHero = window.scrollY >= projectsHeroEl.offsetHeight - 40;
      if (!pastHero) {
        rail.classList.add('is-on-hero');
        rail.classList.remove('is-collapsed');
        railTab.setAttribute('aria-expanded', 'true');
        railTab.title = 'Hide project menu';
      } else {
        rail.classList.remove('is-on-hero');
      }
    }

    railTab.addEventListener('click', () => {
      if (rail.classList.contains('is-on-hero')) return;
      const collapsed = rail.classList.toggle('is-collapsed');
      railTab.setAttribute('aria-expanded', String(!collapsed));
      railTab.title = collapsed ? 'Show project menu' : 'Hide project menu';
    });

    railLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const hash = link.getAttribute('href');
        const id = hash?.replace(/^#/, '');
        const section = id ? document.getElementById(id) : null;
        const title = section?.querySelector('.project-detail-name');
        if (title) {
          smoothScrollTo(scrollYForProjectTitle(title), 700);
          history.replaceState(null, '', hash);
        } else if (section) {
          smoothScrollTo(section.getBoundingClientRect().top + window.scrollY, 700);
          history.replaceState(null, '', hash);
        }
      });
    });

    let railRaf = 0;
    function updateRailActive() {
      railRaf = 0;
      updateRailHeroMode();
      if (!sections.length) return;
      const firstRect = sections[0].getBoundingClientRect();
      if (firstRect.top > window.innerHeight * 0.42) {
        railLinks.forEach((l) => l.classList.remove('is-active'));
        return;
      }
      const navH = nav ? nav.offsetHeight : 0;
      const targetY = navH + window.innerHeight * 0.22;
      let bestId = null;
      let bestDist = Infinity;
      sections.forEach((sec) => {
        const r = sec.getBoundingClientRect();
        if (r.bottom < navH + 24 || r.top > window.innerHeight - 32) return;
        const anchor = r.top + Math.min(r.height * 0.15, 72);
        const dist = Math.abs(anchor - targetY);
        if (dist < bestDist) {
          bestDist = dist;
          bestId = sec.id;
        }
      });
      railLinks.forEach((l) => {
        const href = l.getAttribute('href');
        l.classList.toggle('is-active', Boolean(bestId && href === `#${bestId}`));
      });
    }

    function scheduleRailActive() {
      if (railRaf) return;
      railRaf = requestAnimationFrame(updateRailActive);
    }

    window.addEventListener('scroll', scheduleRailActive, { passive: true });
    window.addEventListener('resize', scheduleRailActive, { passive: true });
    updateRailActive();
  }

  // Deep links use the browser's default anchor jump.
})();
