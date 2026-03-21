// ============================================
// SCROLL-BASED NAVIGATION STYLING
// ============================================

const nav = document.getElementById('nav');
const heroSection = document.getElementById('hero');

function updateOnScroll() {
  const heroBottom = heroSection ? heroSection.offsetHeight : 0;

  if (window.scrollY > 60) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }

  if (window.scrollY > heroBottom - 80) {
    nav.classList.add('hidden');
  } else {
    nav.classList.remove('hidden');
  }
}

window.addEventListener('scroll', updateOnScroll, { passive: true });

// ============================================
// SCROLL REVEAL ANIMATIONS
// ============================================

function setupRevealAnimations() {
  const revealElements = document.querySelectorAll(
    '.project-card, .section-title, .about-lead, .about-skills-label, .skill-group, .credential-card, .contact-social'
  );

  revealElements.forEach(el => el.classList.add('reveal'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  revealElements.forEach((el, i) => {
    el.style.transitionDelay = `${(i % 4) * 0.1}s`;
    observer.observe(el);
  });
}

// ============================================
// PROJECT MODAL
// ============================================

const projectData = {
  weather: {
    title: 'WEATHER WHERE IT MATTERS',
    description: 'A data visualization project analyzing weather patterns and their impact on urban environments. Uses real-time climate data to generate insights for architectural and urban design decisions.',
    tags: ['Python', 'Data Visualization', 'Climate Analysis', 'Grasshopper'],
  },
  urbanlens: {
    title: 'URBAN LENS',
    description: 'A web-based urban analysis tool that combines 3D modeling with geospatial data to provide comprehensive views of urban environments. Features interactive mapping, building analysis, and environmental assessments.',
    tags: ['Web App', 'Three.js', 'GIS', 'Urban Planning'],
  },
  robotic: {
    title: 'ROBOTIC COMPUTING',
    description: 'Exploration of parametric design and robotic fabrication techniques for creating complex 3D-printed architectural components. Investigates the intersection of computational algorithms and physical manufacturing.',
    tags: ['Grasshopper', '3D Printing', 'Parametric Design', 'Robotic Fabrication'],
  },
  pictoproject: {
    title: 'PIC TO PROJECT',
    description: 'A computer vision application that analyzes photographs of buildings to estimate construction costs, material quantities, and energy performance. Streamlines the early-stage project feasibility process.',
    tags: ['Computer Vision', 'Machine Learning', 'Cost Estimation', 'Web App'],
  },
  'urban-envelopes': {
    title: 'URBAN ENVELOPES',
    description: 'An analytical tool for studying building envelope regulations and their spatial implications in urban contexts. Generates 3D envelope models based on zoning parameters and site constraints.',
    tags: ['Urban Planning', 'Zoning Analysis', 'Rhino', 'Grasshopper'],
  },
  karamba: {
    title: 'KARAMBA WITH GRID SHELLS',
    description: 'Structural analysis of grid shell structures using Karamba 3D. Explores form-finding techniques and structural optimization for lightweight, efficient shell structures in architecture.',
    tags: ['Karamba 3D', 'Structural Analysis', 'Grid Shells', 'Form Finding'],
  },
};

const modal = document.getElementById('project-modal');
const modalTitle = document.getElementById('modal-title');
const modalDescription = document.getElementById('modal-description');
const modalTags = document.getElementById('modal-tags');
const modalScreen = document.getElementById('modal-screen');
const modalClose = document.querySelector('.modal-close');

function openModal(projectKey) {
  const data = projectData[projectKey];
  if (!data) return;

  modalTitle.textContent = data.title;
  modalDescription.textContent = data.description;
  modalTags.innerHTML = data.tags.map(t => `<span>${t}</span>`).join('');
  modalScreen.textContent = data.title;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// Project cards now navigate to projects.html via <a> tags

if (modalClose) {
  modalClose.addEventListener('click', closeModal);
}

if (modal) {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ============================================
// PROJECT CARD 3D TILT
// ============================================

function setupCardTilt() {
  const cards = document.querySelectorAll('.project-card');
  const MAX_ANGLE = 7.06;
  const EASE = 0.12;

  const state = new Map();
  cards.forEach(card => {
    state.set(card, { rx: 0, ry: 0, targetRx: 0, targetRy: 0 });
  });

  document.addEventListener('mousemove', (e) => {
    cards.forEach(card => {
      const wrap = card.querySelector('.project-img-wrap');
      if (!wrap) return;

      const rect = wrap.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);

      const clampedX = Math.max(-1, Math.min(1, dx));
      const clampedY = Math.max(-1, Math.min(1, dy));

      const s = state.get(card);
      s.targetRy = clampedX * MAX_ANGLE;
      s.targetRx = -clampedY * MAX_ANGLE;
    });
  });

  function animate() {
    cards.forEach(card => {
      const wrap = card.querySelector('.project-img-wrap');
      if (!wrap) return;
      const s = state.get(card);

      s.rx += (s.targetRx - s.rx) * EASE;
      s.ry += (s.targetRy - s.ry) * EASE;

      wrap.style.transform =
        `rotateX(${s.rx.toFixed(3)}deg) rotateY(${s.ry.toFixed(3)}deg)`;
    });
    requestAnimationFrame(animate);
  }

  animate();
}

// ============================================
// Hero "PROJECTS" chevron → scroll to project cards on same page (NOT projects.html)
// Nav "Projects" link → projects.html (red page) — kept separate
// ============================================

const heroScroll = document.querySelector('.hero-scroll');
if (heroScroll) {
  heroScroll.style.cursor = 'pointer';
  heroScroll.addEventListener('click', () => {
    const projectsSection = document.getElementById('projects');
    if (projectsSection) {
      projectsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  setupRevealAnimations();
  setupCardTilt();
});
