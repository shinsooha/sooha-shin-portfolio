const container = document.getElementById('laptop-canvas-container');

const MOVE_RANGE = 250;

const STATE = {
  targetMoveX: 0,
  targetMoveY: 0,
  currentMoveX: 0,
  currentMoveY: 0,
  targetTiltX: 0,
  targetTiltY: 0,
  currentTiltX: 0,
  currentTiltY: 0,
  targetScale: 1,
  currentScale: 1,
  isHandTracking: false,
};

let video;

function init() {
  if (!container) return;

  video = document.createElement('video');
  video.src = 'assets/laptop-rotation.mp4';
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;
  video.loop = true;
  video.preload = 'auto';
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');

  video.style.width = '100%';
  video.style.height = '100%';
  video.style.objectFit = 'contain';
  video.style.display = 'block';
  video.style.pointerEvents = 'none';
  video.style.willChange = 'transform';

  container.appendChild(video);

  video.addEventListener('canplay', () => {
    video.play().catch(() => {});
  });

  video.load();

  document.addEventListener('click', () => {
    if (video.paused) video.play().catch(() => {});
  }, { once: true });

  setupMouseControl();
  animate();
}

function setupMouseControl() {
  document.addEventListener('mousemove', (e) => {
    if (STATE.isHandTracking) return;
    const normX = (e.clientX / window.innerWidth) * 2 - 1;
    const normY = (e.clientY / window.innerHeight) * 2 - 1;

    STATE.targetMoveX = normX * MOVE_RANGE;
    STATE.targetMoveY = normY * MOVE_RANGE;
    STATE.targetTiltX = normY * 15;
    STATE.targetTiltY = normX * 12;
  });
}

function animate() {
  requestAnimationFrame(animate);

  const lerp = 0.07;
  STATE.currentMoveX += (STATE.targetMoveX - STATE.currentMoveX) * lerp;
  STATE.currentMoveY += (STATE.targetMoveY - STATE.currentMoveY) * lerp;
  STATE.currentTiltX += (STATE.targetTiltX - STATE.currentTiltX) * lerp;
  STATE.currentTiltY += (STATE.targetTiltY - STATE.currentTiltY) * lerp;
  STATE.currentScale += (STATE.targetScale - STATE.currentScale) * lerp;

  video.style.transform =
    `perspective(1000px) translate(${STATE.currentMoveX}px, ${STATE.currentMoveY}px) rotateX(${STATE.currentTiltX}deg) rotateY(${STATE.currentTiltY}deg) scale(${STATE.currentScale})`;
}

export function setHandPosition(x, y) {
  STATE.targetMoveX = x * MOVE_RANGE;
  STATE.targetMoveY = y * MOVE_RANGE;
  STATE.targetTiltX = y * 20;
  STATE.targetTiltY = x * 18;
}

export function setHandScale(scale) {
  STATE.targetScale = Math.max(0.5, Math.min(2.0, scale));
}

export function setHandTracking(active) {
  STATE.isHandTracking = active;
  if (!active) {
    STATE.targetScale = 1;
  }
}

init();
