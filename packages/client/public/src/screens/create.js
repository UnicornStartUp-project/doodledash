// Create Screen — Drawing canvas with tools

import { drawItInit, drawItSetColor, drawItSetBrushSize, drawItUndo, drawItClear, drawItGetData, drawItDestroy } from '../games/draw-it.js';

let conn = null;
let countdownInterval = null;
let canvasInit = null;

export function showCreate(data) {
  conn = window.__doodledash?.conn;
  const el = document.getElementById('screen-create');

  const challenge = data?.challenge || 'Draw something!';
  const countdown = data?.countdown || 60;
  const totalPlayers = window.__doodledash?.getRoomState()?.players?.length || 1;

  el.innerHTML = `
    <div style="text-align:center;margin-bottom:4px">
      <p style="font-size:18px;font-weight:700">🖌️ Draw: <span style="color:var(--pink-dark)">${challenge}</span></p>
      <p id="create-timer" class="create-timer">⏱️ ${countdown}s</p>
      <p id="create-progress" style="font-size:12px;color:var(--text-light)">0/${totalPlayers} submitted</p>
    </div>

    <div class="create-toolbar">
      <!-- Colors -->
      ${['#FF6B8A','#FF8FAB','#A78BFA','#818CF8','#60A5FA','#34D399','#FBBF24','#F472B6','#333333'].map((c, i) => `
        <button class="color-swatch ${i === 0 ? 'selected' : ''}" style="background:${c}" data-color="${c}"></button>
      `).join('')}
      <button class="color-swatch eraser-swatch" data-color="eraser" title="Eraser"></button>
      <div style="width:1px;background:#ddd;height:24px;margin:0 4px"></div>
      <!-- Brush sizes -->
      <button class="brush-size-btn selected" data-size="3"><span class="brush-dot" style="width:6px;height:6px"></span></button>
      <button class="brush-size-btn" data-size="8"><span class="brush-dot" style="width:12px;height:12px"></span></button>
      <button class="brush-size-btn" data-size="16"><span class="brush-dot" style="width:20px;height:20px"></span></button>
    </div>

    <div class="create-canvas-wrap" id="canvas-wrap">
      <canvas id="draw-canvas"></canvas>
    </div>

    <div class="create-actions">
      <button id="btn-undo" class="btn btn-secondary">↩️ Undo</button>
      <button id="btn-clear" class="btn btn-secondary">🗑️ Clear</button>
      <button id="btn-submit" class="btn btn-primary">✅ Done!</button>
    </div>
  `;

  // Setup canvas
  setTimeout(() => setupCanvas(), 100);

  // Timer
  let remaining = countdown;
  countdownInterval = setInterval(() => {
    remaining--;
    const timerEl = document.getElementById('create-timer');
    if (timerEl) timerEl.textContent = `⏱️ ${remaining}s`;
    if (remaining <= 0) {
      clearInterval(countdownInterval);
      submitDrawing();
    }
  }, 1000);

  // Submit button
  document.getElementById('btn-submit')?.addEventListener('click', () => {
    clearInterval(countdownInterval);
    submitDrawing();
  });

  document.getElementById('btn-clear')?.addEventListener('click', () => {
    if (canvasInit) canvasInit.clear();
  });

  document.getElementById('btn-undo')?.addEventListener('click', () => {
    if (canvasInit) canvasInit.undo();
  });
}

function setupCanvas() {
  const wrap = document.getElementById('canvas-wrap');
  const canvas = document.getElementById('draw-canvas');
  if (!wrap || !canvas) return;

  canvas.width = wrap.clientWidth * 2;
  canvas.height = wrap.clientHeight * 2;
  canvas.style.width = '100%';
  canvas.style.height = '100%';

  canvasInit = drawItInit(canvas);

  // Toolbar events
  document.querySelectorAll('.color-swatch').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      if (canvasInit) canvasInit.setColor(btn.dataset.color);
    });
  });

  document.querySelectorAll('.brush-size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.brush-size-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      if (canvasInit) canvasInit.setBrushSize(parseInt(btn.dataset.size));
    });
  });
}

function submitDrawing() {
  const canvas = document.getElementById('draw-canvas');
  if (!canvas || !conn) return;

  const drawing = canvas.toDataURL('image/png');
  conn.send('submit_entry', { drawing, type: 'drawing' });

  // Disable UI
  document.getElementById('btn-submit')?.setAttribute('disabled', 'true');
  document.getElementById('btn-undo')?.setAttribute('disabled', 'true');
  document.getElementById('btn-clear')?.setAttribute('disabled', 'true');

  // Replace canvas with "waiting" message
  const el = document.getElementById('screen-create');
  el.innerHTML = `
    <div style="text-align:center;padding:40px">
      <p style="font-size:48px">🎨</p>
      <h2>Submitted!</h2>
      <p style="color:var(--text-light)">Waiting for other players to finish...</p>
    </div>
  `;
}

export function updateCreate(data) {
  const progress = document.getElementById('create-progress');
  if (progress && data) {
    progress.textContent = `${data.submittedCount || 0}/${data.totalPlayers || 1} submitted`;
  }
}

export function hideCreate() {
  if (countdownInterval) clearInterval(countdownInterval);
  if (canvasInit) {
    canvasInit.destroy();
    canvasInit = null;
  }
}
