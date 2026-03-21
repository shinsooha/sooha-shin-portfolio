import { setHandPosition, setHandScale, setHandTracking } from './laptop3d.js';

const btn = document.getElementById('hand-tracking-btn');
const webcamVideo = document.getElementById('webcam-feed');
let handLandmarker = null;
let isActive = false;
let animFrameId = null;
let indicator = null;
let stream = null;
let handCanvas = null;
let handCtx = null;
let instructionEl = null;

const HAND_CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],
  [13,17],[17,18],[18,19],[19,20],
  [0,17],
];

function createHandOverlay() {
  handCanvas = document.createElement('canvas');
  handCanvas.className = 'hand-overlay-canvas';
  handCanvas.width = window.innerWidth;
  handCanvas.height = window.innerHeight;
  document.getElementById('hero').appendChild(handCanvas);
  handCtx = handCanvas.getContext('2d');

  window.addEventListener('resize', onOverlayResize);
}

function onOverlayResize() {
  if (handCanvas) {
    handCanvas.width = window.innerWidth;
    handCanvas.height = window.innerHeight;
  }
}

function removeHandOverlay() {
  window.removeEventListener('resize', onOverlayResize);
  if (handCanvas?.parentNode) {
    handCanvas.parentNode.removeChild(handCanvas);
    handCanvas = null;
    handCtx = null;
  }
}

function drawHandSkeleton(landmarks) {
  if (!handCtx || !handCanvas) return;

  const w = handCanvas.width;
  const h = handCanvas.height;
  handCtx.clearRect(0, 0, w, h);

  handCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  handCtx.lineWidth = 2;
  handCtx.lineCap = 'round';
  handCtx.shadowColor = 'rgba(77, 201, 240, 0.7)';
  handCtx.shadowBlur = 8;

  for (const [si, ei] of HAND_CONNECTIONS) {
    const a = landmarks[si];
    const b = landmarks[ei];
    handCtx.beginPath();
    handCtx.moveTo((1 - a.x) * w, a.y * h);
    handCtx.lineTo((1 - b.x) * w, b.y * h);
    handCtx.stroke();
  }

  handCtx.shadowBlur = 12;
  handCtx.shadowColor = 'rgba(77, 201, 240, 1)';

  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    const x = (1 - lm.x) * w;
    const y = lm.y * h;
    const isPalm = i === 9;
    const isSpread = i === 4 || i === 20;

    handCtx.beginPath();
    handCtx.arc(x, y, isPalm ? 7 : isSpread ? 5 : 3, 0, Math.PI * 2);
    handCtx.fillStyle = isPalm
      ? 'rgba(77, 201, 240, 0.95)'
      : isSpread
        ? 'rgba(250, 204, 21, 0.9)'
        : 'rgba(255, 255, 255, 0.85)';
    handCtx.fill();
  }

  handCtx.shadowBlur = 0;
}

function clearHandCanvas() {
  if (handCtx && handCanvas) {
    handCtx.clearRect(0, 0, handCanvas.width, handCanvas.height);
  }
}

function showInstructions() {
  instructionEl = document.createElement('div');
  instructionEl.className = 'hand-instructions';
  instructionEl.innerHTML =
    '<div class="hand-instructions-inner">' +
      '<div class="hand-instr-row">' +
        '<span class="hand-instr-dot" style="background:rgba(77,201,240,0.95)"></span>' +
        '<span>Move palm to control the laptop</span>' +
      '</div>' +
      '<div class="hand-instr-row">' +
        '<span class="hand-instr-dot" style="background:rgba(250,204,21,0.9)"></span>' +
        '<span>Spread / close fingers to zoom</span>' +
      '</div>' +
    '</div>';
  document.getElementById('hero').appendChild(instructionEl);

  requestAnimationFrame(() => instructionEl.classList.add('visible'));

  setTimeout(() => {
    if (instructionEl) instructionEl.classList.remove('visible');
    setTimeout(() => {
      if (instructionEl?.parentNode) {
        instructionEl.parentNode.removeChild(instructionEl);
        instructionEl = null;
      }
    }, 600);
  }, 7000);
}

function removeInstructions() {
  if (instructionEl?.parentNode) {
    instructionEl.parentNode.removeChild(instructionEl);
    instructionEl = null;
  }
}

function createIndicator() {
  indicator = document.createElement('div');
  indicator.className = 'hand-indicator';
  indicator.innerHTML = '<span class="hand-indicator-dot"></span> Hand tracking active';
  document.body.appendChild(indicator);
}

function showIndicator() {
  if (!indicator) createIndicator();
  indicator.classList.add('visible');
}

function hideIndicator() {
  if (indicator) indicator.classList.remove('visible');
}

const HAND_SVG = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v0"/>
  <path d="M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2"/>
  <path d="M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8"/>
  <path d="M18 8a2 2 0 0 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 13"/>
</svg>`;

// Vendored copy: Netlify (and many hosts) do not deploy node_modules, so the
// bundle lives under /vendor and is committed with the site.
const VISION_BUNDLE_URL = new URL(
  '../vendor/@mediapipe/tasks-vision/vision_bundle.mjs',
  import.meta.url
).href;
const VISION_WASM_URL = new URL(
  '../vendor/@mediapipe/tasks-vision/wasm',
  import.meta.url
).href;
const HAND_MODEL_URL = new URL(
  '../assets/models/hand_landmarker.task',
  import.meta.url
).href;

function setButtonMessage(message, restoreAfterMs = 3000) {
  btn.textContent = message;
  btn.disabled = false;

  if (restoreAfterMs > 0) {
    setTimeout(() => {
      if (!isActive) {
        btn.innerHTML = HAND_SVG + ' Try Hand Tracking';
      }
    }, restoreAfterMs);
  }
}

function getReadableError(err) {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  return err.message || err.name || 'Unknown error';
}

async function loadHandLandmarker() {
  const mediapipeVision = await import(VISION_BUNDLE_URL);

  const vision = await mediapipeVision.FilesetResolver.forVisionTasks(
    VISION_WASM_URL
  );

  const createWithDelegate = (delegate) =>
    mediapipeVision.HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: HAND_MODEL_URL,
        delegate,
      },
      runningMode: 'VIDEO',
      numHands: 1,
      minHandDetectionConfidence: 0.5,
      minTrackingConfidence: 0.4,
    });

  try {
    handLandmarker = await createWithDelegate('GPU');
  } catch (gpuError) {
    console.warn('GPU hand landmarker failed, falling back to CPU.', gpuError);
    handLandmarker = await createWithDelegate('CPU');
  }
}

async function startHandTracking() {
  if (isActive) {
    stopHandTracking();
    return;
  }

  if (!window.isSecureContext) {
    setButtonMessage('Use localhost or HTTPS');
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    setButtonMessage('Camera not supported here');
    return;
  }

  btn.textContent = 'Starting camera...';
  btn.disabled = true;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
    });
    webcamVideo.srcObject = stream;

    await new Promise((resolve) => {
      webcamVideo.onloadeddata = resolve;
    });
    await webcamVideo.play();

    btn.textContent = 'Loading hand model...';

    if (!handLandmarker) {
      await loadHandLandmarker();
    }

    isActive = true;
    setHandTracking(true);
    btn.innerHTML = HAND_SVG + ' Disable Hand Tracking';
    btn.disabled = false;
    btn.classList.add('active');
    showIndicator();
    createHandOverlay();
    showInstructions();
    detectLoop();
  } catch (err) {
    console.error('Hand tracking init failed:', err);

    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    webcamVideo.srcObject = null;

    const msg =
      err.name === 'NotAllowedError'
        ? 'Camera access denied'
        : err.name === 'NotFoundError'
          ? 'No camera found'
          : err.name === 'NotReadableError'
            ? 'Camera busy in another app'
            : `Hand tracking failed: ${getReadableError(err)}`;

    setButtonMessage(msg);
  }
}

let smoothX = 0;
let smoothY = 0;
let smoothSpread = 1;
let lastTimestamp = -1;

function getHandSpread(landmarks) {
  const thumb = landmarks[4];
  const pinky = landmarks[20];
  const dx = thumb.x - pinky.x;
  const dy = thumb.y - pinky.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function detectLoop() {
  if (!isActive || !handLandmarker) return;

  const now = performance.now();
  if (webcamVideo.readyState >= 2 && webcamVideo.currentTime !== lastTimestamp) {
    lastTimestamp = webcamVideo.currentTime;

    try {
      const results = handLandmarker.detectForVideo(webcamVideo, now);

      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        const palm = landmarks[9];

        const rawX = -(palm.x * 2 - 1);
        const rawY = -(palm.y * 2 - 1);

        const spread = getHandSpread(landmarks);
        const normalizedSpread = Math.max(0.5, Math.min(2.0, spread * 5));

        const posFactor = 0.18;
        smoothX += (rawX - smoothX) * posFactor;
        smoothY += (rawY - smoothY) * posFactor;

        const spreadFactor = 0.1;
        smoothSpread += (normalizedSpread - smoothSpread) * spreadFactor;

        setHandPosition(smoothX, smoothY);
        setHandScale(smoothSpread);

        drawHandSkeleton(landmarks);
      } else {
        clearHandCanvas();
      }
    } catch (e) {
      // Skip frame errors
    }
  }

  animFrameId = requestAnimationFrame(detectLoop);
}

function stopHandTracking() {
  isActive = false;
  setHandTracking(false);

  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }

  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  webcamVideo.srcObject = null;

  btn.classList.remove('active');
  btn.innerHTML = HAND_SVG + ' Try Hand Tracking';
  hideIndicator();
  removeHandOverlay();
  removeInstructions();
}

if (btn) {
  btn.addEventListener('click', startHandTracking);
}
