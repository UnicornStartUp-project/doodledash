// Room Design — Solo Decorating Game
// Pick a theme, shop with your coins, place real-size furniture in an
// isometric room (items can't overlap), get scored against the theme's
// checklist, earn bonus coins.

import {
  ITEMS, THEMES, CATEGORIES, TIERS, WALLS, FLOORS,
  getItem, getTheme, STAR_BONUS, DAILY_ALLOWANCE, TOPUP_AMOUNT,
} from './data.js';
import { loadState, saveState, recordRound } from './storage.js';
import { CELL, createIsoView, rectsCollide3D } from './iso.js';

const screens = {
  themes: document.getElementById('screen-themes'),
  decorate: document.getElementById('screen-decorate'),
  score: document.getElementById('screen-score'),
};

let saveData = loadState();

// ─── Round state ─────────────────────────────
let round = null; // { theme, owned: [{instanceId,itemId}], placed: [{instanceId,itemId,x,y,rot}], wallId, floorId }
let view = null;
let selectedInstanceId = null;
let activeShopCategory = null;
let drag = null; // { instanceId, offX, offY, origX, origY, moved, colliding }
let uidCounter = 0;
const nextId = () => `i${uidCounter++}`;

function switchScreen(name) {
  Object.entries(screens).forEach(([key, el]) => el.classList.toggle('hidden', key !== name));
}

function showToast(text, isError = false) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast' + (isError ? ' toast-error' : '');
  el.textContent = text;
  container.appendChild(el);
  setTimeout(() => el.remove(), 2400);
}

// ─── Money ────────────────────────────────────
function localDay() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function checkDailyAllowance() {
  const today = localDay();
  if (saveData.lastAllowanceDay === today) return;
  saveData.lastAllowanceDay = today;
  saveData.coins += DAILY_ALLOWANCE;
  saveState(saveData);
  showToast(`🎁 Daily allowance: +${DAILY_ALLOWANCE} coins!`);
}

function topUp() {
  saveData.coins += TOPUP_AMOUNT;
  saveState(saveData);
  showToast(`💰 +${TOPUP_AMOUNT} coins added!`);
  updateCoinDisplays();
}

function updateCoinDisplays() {
  document.querySelectorAll('.rd-coin-value').forEach(el => (el.textContent = saveData.coins));
  if (round) renderShopGrid();
}

// ─── Theme Picker Screen ─────────────────────
function showThemes() {
  const el = screens.themes;
  el.innerHTML = `
    <div class="rd-topbar">
      <div class="logo" style="font-size:36px;margin-bottom:0">🛋️</div>
      <div style="display:flex;gap:8px;align-items:center">
        <div class="rd-coins">🪙 <span class="rd-coin-value">${saveData.coins}</span></div>
        <button class="btn btn-secondary btn-small btn-topup">➕ 1000</button>
      </div>
    </div>
    <h1>Room Design</h1>
    <p style="color:var(--text-light);text-align:center;margin-bottom:20px">Pick a theme, shop smart, decorate your room!</p>
    <div class="theme-grid">
      ${THEMES.map(t => `
        <button class="theme-card" data-theme="${t.id}">
          <span class="theme-card-emoji">${t.emoji}</span>
          <span class="theme-card-name">${t.name}</span>
          <span class="theme-card-desc">${t.description}</span>
          <span class="theme-card-desc">Room ${(t.room[0] / 100).toFixed(1)} × ${(t.room[1] / 100).toFixed(1)} m</span>
          ${saveData.bestStars[t.id] ? `<div class="theme-card-best">${'⭐'.repeat(saveData.bestStars[t.id])} best</div>` : ''}
        </button>
      `).join('')}
    </div>
  `;

  el.querySelectorAll('.theme-card').forEach(btn => btn.addEventListener('click', () => startRound(btn.dataset.theme)));
  el.querySelector('.btn-topup').addEventListener('click', topUp);
  switchScreen('themes');
}

// ─── Geometry helpers ─────────────────────────
function dimsOf(itemId, rot) {
  const [w, d, h] = getItem(itemId).size;
  return rot ? { w: d, d: w, h } : { w, d, h };
}

function rect3(p) {
  const item = getItem(p.itemId);
  const { w, d, h } = dimsOf(p.itemId, p.rot);
  return { x: p.x, y: p.y, w, d, z: item.elev || 0, h };
}

function collidesAt(candidate, excludeId) {
  return round.placed.some(p => p.instanceId !== excludeId && rectsCollide3D(candidate, rect3(p)));
}

function inBounds(r) {
  const [W, D] = round.theme.room;
  return r.x >= 0 && r.y >= 0 && r.x + r.w <= W && r.y + r.d <= D;
}

const snap = v => Math.round(v / CELL) * CELL;

// Find a free snapped spot near (cx, cy) for an item; wall items stick to the nearest back wall
function findSpot(itemId, cx, cy) {
  const item = getItem(itemId);
  const [W, D] = round.theme.room;

  if (item.wall) {
    const onXWall = cy <= cx; // closer to the y=0 wall
    const rot = onXWall ? 0 : 1;
    const { w, d, h } = dimsOf(itemId, rot);
    const along = onXWall ? snap(cx - w / 2) : snap(cy - d / 2);
    const limit = onXWall ? W - w : D - d;
    for (let step = 0; step <= 40; step++) {
      for (const sign of step === 0 ? [1] : [1, -1]) {
        const a = Math.min(limit, Math.max(0, along + sign * step * CELL));
        const r = onXWall ? { x: a, y: 0, w, d, z: item.elev, h } : { x: 0, y: a, w, d, z: item.elev, h };
        if (inBounds(r) && !collidesAt(r)) return { x: r.x, y: r.y, rot };
      }
    }
    return null;
  }

  const { w, d, h } = dimsOf(itemId, 0);
  const bx = snap(cx - w / 2), by = snap(cy - d / 2);
  for (let radius = 0; radius <= 8; radius++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
        const r = { x: bx + dx * CELL, y: by + dy * CELL, w, d, z: 0, h };
        if (inBounds(r) && !collidesAt(r)) return { x: r.x, y: r.y, rot: 0 };
      }
    }
  }
  return null;
}

// ─── Decorate Screen ─────────────────────────
function startRound(themeId) {
  const theme = getTheme(themeId);
  if (!theme) return;
  round = { theme, owned: [], placed: [], wallId: WALLS[0].id, floorId: FLOORS[0].id };
  selectedInstanceId = null;
  drag = null;
  activeShopCategory = Object.keys(CATEGORIES)[0];
  renderDecorate();
  switchScreen('decorate');
}

function renderDecorate() {
  const el = screens.decorate;
  const { theme } = round;
  const [W, D, H] = theme.room;

  el.innerHTML = `
    <div class="rd-decorate-wrap">
      <div class="rd-topbar" style="margin-bottom:0">
        <div style="font-weight:800;font-size:16px">${theme.emoji} ${theme.name}</div>
        <div style="display:flex;gap:6px;align-items:center">
          <div class="rd-coins">🪙 <span class="rd-coin-value">${saveData.coins}</span></div>
          <button class="btn btn-secondary btn-small btn-topup" title="Add 1000 coins">➕</button>
        </div>
      </div>

      <div class="rd-objectives" id="rd-objectives"></div>

      <div class="rd-surface-row">
        <span class="rd-surface-label">🧱 Walls</span>
        <div class="rd-swatches">
          ${WALLS.map(w => `<button class="rd-swatch" data-wall="${w.id}" title="${w.name}" style="background:${w.color}"></button>`).join('')}
        </div>
      </div>
      <div class="rd-surface-row">
        <span class="rd-surface-label">🪵 Floor</span>
        <div class="rd-swatches">
          ${FLOORS.map(f => `<button class="rd-swatch" data-floor="${f.id}" title="${f.name}" style="background:${f.color}"></button>`).join('')}
        </div>
      </div>

      <div class="rd-room" id="rd-room">
        <canvas id="rd-canvas"></canvas>
        <div class="rd-item-toolbar hidden" id="rd-item-toolbar">
          <button data-action="rotate" title="Rotate item">🔄</button>
          <button data-action="remove" title="Back to tray">🗑️</button>
        </div>
        <button class="rd-view-rotate" id="btn-view-rotate" title="Rotate view">🔃</button>
        <div class="rd-room-info">${(W / 100).toFixed(1)} × ${(D / 100).toFixed(1)} m · ceiling ${(H / 100).toFixed(1)} m · squares are 25 cm</div>
      </div>

      <div class="rd-tray" id="rd-tray"></div>

      <div class="rd-shop-tabs" id="rd-shop-tabs">
        ${Object.entries(CATEGORIES).map(([id, c]) => `
          <button class="rd-shop-tab ${id === activeShopCategory ? 'selected' : ''}" data-cat="${id}">${c.emoji} ${c.label}</button>
        `).join('')}
      </div>

      <div class="rd-shop-grid" id="rd-shop-grid"></div>

      <div class="rd-actions">
        <button id="btn-cancel-round" class="btn btn-secondary">↩️ Back</button>
        <button id="btn-reset-room" class="btn btn-secondary">🗑️ Clear Room</button>
        <button id="btn-finish" class="btn btn-primary">✅ Finish</button>
      </div>
      <p style="font-size:12px;color:var(--text-light);text-align:center">Tap an item in the room to rotate or remove it. Tap ✕ on a tray item to sell it back. ↩️ Back refunds everything.</p>
    </div>
  `;

  el.querySelectorAll('.rd-shop-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeShopCategory = btn.dataset.cat;
      el.querySelectorAll('.rd-shop-tab').forEach(b => b.classList.toggle('selected', b === btn));
      renderShopGrid();
    });
  });

  el.querySelector('.btn-topup').addEventListener('click', topUp);

  document.getElementById('btn-reset-room').addEventListener('click', () => {
    round.owned.push(...round.placed.map(p => ({ instanceId: p.instanceId, itemId: p.itemId })));
    round.placed = [];
    selectedInstanceId = null;
    renderRoom();
    renderTray();
    renderObjectives();
  });

  document.getElementById('btn-finish').addEventListener('click', finishRound);
  document.getElementById('btn-cancel-round').addEventListener('click', cancelRound);

  el.querySelectorAll('[data-wall]').forEach(btn => {
    btn.addEventListener('click', () => { round.wallId = btn.dataset.wall; renderSurfaces(); });
  });
  el.querySelectorAll('[data-floor]').forEach(btn => {
    btn.addEventListener('click', () => { round.floorId = btn.dataset.floor; renderSurfaces(); });
  });

  // Isometric view
  const canvas = document.getElementById('rd-canvas');
  view = createIsoView(canvas);
  view.setRoom(W, D, H);
  canvas.addEventListener('pointerdown', onCanvasDown);
  window.addEventListener('resize', renderRoom);

  document.getElementById('btn-view-rotate').addEventListener('click', () => {
    view.rotateView();
    renderRoom();
  });

  const toolbar = document.getElementById('rd-item-toolbar');
  toolbar.addEventListener('pointerdown', e => e.stopPropagation());
  toolbar.querySelector('[data-action="rotate"]').addEventListener('click', () => rotateSelected());
  toolbar.querySelector('[data-action="remove"]').addEventListener('click', () => {
    if (selectedInstanceId) removePlaced(selectedInstanceId);
  });

  renderSurfaces();
  renderObjectives();
  renderShopGrid();
  renderTray();
  renderRoom();
}

function renderSurfaces() {
  const wall = WALLS.find(w => w.id === round.wallId) || WALLS[0];
  const floor = FLOORS.find(f => f.id === round.floorId) || FLOORS[0];
  document.querySelectorAll('[data-wall]').forEach(b => b.classList.toggle('selected', b.dataset.wall === wall.id));
  document.querySelectorAll('[data-floor]').forEach(b => b.classList.toggle('selected', b.dataset.floor === floor.id));
  if (view) {
    view.setColors(wall.color, floor.color);
    renderRoom();
  }
}

function renderObjectives() {
  const el = document.getElementById('rd-objectives');
  if (!el) return;
  el.innerHTML = round.theme.objectives.map(obj => {
    const actual = countMatching(obj);
    const done = actual >= obj.count;
    return `<div class="rd-objective-chip ${done ? 'done' : ''}">${done ? '✅' : '⬜'} ${obj.label} (${Math.min(actual, obj.count)}/${obj.count})</div>`;
  }).join('');
}

function countMatching(obj) {
  return round.placed.filter(p => {
    const item = getItem(p.itemId);
    return obj.type === 'tag' ? item.tags.includes(obj.value) : item.category === obj.value;
  }).length;
}

function sizeLabel(item) {
  const [w, d, h] = item.size;
  return `${w}×${d}×${h} cm`;
}

function renderShopGrid() {
  const el = document.getElementById('rd-shop-grid');
  if (!el) return;
  const items = ITEMS.filter(i => i.category === activeShopCategory);
  el.innerHTML = items.map(item => `
    <div class="rd-shop-item ${saveData.coins < item.price ? 'unaffordable' : ''}" data-item="${item.id}" style="border-color:${TIERS[item.tier].color}66">
      <span class="rd-shop-item-emoji">${item.emoji}</span>
      <div class="rd-shop-item-name">${item.name}</div>
      <div class="rd-shop-item-size">${sizeLabel(item)}</div>
      <div class="rd-shop-item-price">🪙${item.price}</div>
    </div>
  `).join('');

  el.querySelectorAll('.rd-shop-item').forEach(card => card.addEventListener('click', () => buyItem(card.dataset.item)));
}

function buyItem(itemId) {
  const item = getItem(itemId);
  if (!item) return;
  if (saveData.coins < item.price) {
    showToast('Not enough coins — tap ➕ to add more!', true);
    return;
  }
  saveData.coins -= item.price;
  saveState(saveData);
  round.owned.push({ instanceId: nextId(), itemId });
  updateCoinDisplays();
  renderTray();
}

function renderTray() {
  const el = document.getElementById('rd-tray');
  if (!el) return;
  if (round.owned.length === 0) {
    el.innerHTML = '<div class="rd-tray-empty">Buy items from the shop below, then drag them into your room ⬆️</div>';
    return;
  }
  el.innerHTML = round.owned.map(o => {
    const item = getItem(o.itemId);
    return `
      <div class="rd-tray-item" data-instance="${o.instanceId}" title="${item.name} · ${sizeLabel(item)}">
        ${item.emoji}
        <button class="rd-tray-sell" data-instance="${o.instanceId}" title="Sell back for 🪙${item.price}">✕</button>
      </div>`;
  }).join('');

  el.querySelectorAll('.rd-tray-item').forEach(node => {
    node.addEventListener('pointerdown', (e) => {
      if (e.target.classList.contains('rd-tray-sell')) return;
      startTrayDrag(e, node.dataset.instance);
    });
  });

  el.querySelectorAll('.rd-tray-sell').forEach(btn => {
    btn.addEventListener('pointerdown', (e) => e.stopPropagation());
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      sellItem(btn.dataset.instance);
    });
  });
}

function sellItem(instanceId) {
  const idx = round.owned.findIndex(o => o.instanceId === instanceId);
  if (idx === -1) return;
  const [o] = round.owned.splice(idx, 1);
  const item = getItem(o.itemId);
  saveData.coins += item.price;
  saveState(saveData);
  showToast(`Sold ${item.name} back for 🪙${item.price}`);
  updateCoinDisplays();
  renderTray();
}

function cancelRound() {
  const refund = [...round.owned, ...round.placed].reduce((sum, o) => sum + getItem(o.itemId).price, 0);
  saveData.coins += refund;
  saveState(saveData);
  if (refund > 0) showToast(`Refunded 🪙${refund} — no coins lost!`);
  window.removeEventListener('resize', renderRoom);
  round = null;
  view = null;
  showThemes();
}

// ─── Room rendering ───────────────────────────
function renderRoom() {
  if (!view || !round) return;
  view.setItems(round.placed.map(p => {
    const item = getItem(p.itemId);
    const { w, d, h } = dimsOf(p.itemId, p.rot);
    const dragging = drag && drag.instanceId === p.instanceId;
    return {
      instanceId: p.instanceId,
      x: p.x, y: p.y, w, d, h,
      elev: item.elev || 0,
      color: CATEGORIES[item.category].color,
      emoji: item.emoji,
      dragging,
      colliding: dragging && drag.colliding,
    };
  }));
  view.setSelected(selectedInstanceId);
  view.render();
  positionToolbar();
}

function positionToolbar() {
  const toolbar = document.getElementById('rd-item-toolbar');
  if (!toolbar) return;
  const anchor = selectedInstanceId && !drag ? view.anchorFor(selectedInstanceId) : null;
  if (!anchor) {
    toolbar.classList.add('hidden');
    return;
  }
  const item = getItem(round.placed.find(p => p.instanceId === selectedInstanceId).itemId);
  toolbar.querySelector('[data-action="rotate"]').style.display = item.wall ? 'none' : '';
  toolbar.style.left = `${anchor.x}px`;
  toolbar.style.top = `${anchor.y}px`;
  toolbar.classList.remove('hidden');
}

function removePlaced(instanceId) {
  const idx = round.placed.findIndex(p => p.instanceId === instanceId);
  if (idx === -1) return;
  const [p] = round.placed.splice(idx, 1);
  round.owned.push({ instanceId: p.instanceId, itemId: p.itemId });
  if (selectedInstanceId === instanceId) selectedInstanceId = null;
  renderRoom();
  renderTray();
  renderObjectives();
}

function rotateSelected() {
  const p = round.placed.find(x => x.instanceId === selectedInstanceId);
  if (!p || getItem(p.itemId).wall) return;
  const candidate = { ...rect3({ ...p, rot: p.rot ? 0 : 1 }) };
  if (!inBounds(candidate)) { showToast("Can't rotate — it would poke through the wall!", true); return; }
  if (collidesAt(candidate, p.instanceId)) { showToast("Can't rotate — it would bump into something!", true); return; }
  p.rot = p.rot ? 0 : 1;
  renderRoom();
}

// ─── Drag: reposition inside the room ────────
function onCanvasDown(e) {
  e.preventDefault();
  const id = view.hitTest(e.clientX, e.clientY);
  if (!id) {
    selectedInstanceId = null;
    renderRoom();
    return;
  }
  selectedInstanceId = id;
  const p = round.placed.find(x => x.instanceId === id);
  const pt = view.screenToFloor(e.clientX, e.clientY);
  drag = { instanceId: id, offX: pt.x - p.x, offY: pt.y - p.y, origX: p.x, origY: p.y, moved: false, colliding: false };
  renderRoom();

  const move = (ev) => {
    const item = getItem(p.itemId);
    const r = rect3(p);
    const [W, D] = round.theme.room;
    const fp = view.screenToFloor(ev.clientX, ev.clientY);
    let nx = snap(fp.x - drag.offX);
    let ny = snap(fp.y - drag.offY);
    if (item.wall) {
      if (p.rot === 0) ny = 0; else nx = 0;
    }
    nx = Math.min(W - r.w, Math.max(0, nx));
    ny = Math.min(D - r.d, Math.max(0, ny));
    if (nx !== p.x || ny !== p.y) drag.moved = true;
    p.x = nx; p.y = ny;
    drag.colliding = collidesAt(rect3(p), p.instanceId);
    renderRoom();
  };

  const up = () => {
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
    document.removeEventListener('pointercancel', up);
    if (drag.colliding) {
      p.x = drag.origX; p.y = drag.origY;
      showToast("Doesn't fit there — something's in the way!", true);
    }
    drag = null;
    renderRoom();
    renderObjectives();
  };

  document.addEventListener('pointermove', move);
  document.addEventListener('pointerup', up);
  document.addEventListener('pointercancel', up);
}

// ─── Drag: from tray into room ───────────────
function startTrayDrag(e, instanceId) {
  e.preventDefault();
  const owned = round.owned.find(o => o.instanceId === instanceId);
  if (!owned) return;
  const item = getItem(owned.itemId);

  const ghost = document.createElement('div');
  ghost.className = 'rd-ghost';
  ghost.textContent = item.emoji;
  document.body.appendChild(ghost);

  const move = (ev) => {
    ghost.style.left = `${ev.clientX}px`;
    ghost.style.top = `${ev.clientY}px`;
  };
  move(e);

  const up = (ev) => {
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
    document.removeEventListener('pointercancel', up);
    ghost.remove();

    const canvas = document.getElementById('rd-canvas');
    const rect = canvas.getBoundingClientRect();
    const over = ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom;
    if (!over) return;

    const pt = view.screenToFloor(ev.clientX, ev.clientY);
    const spot = findSpot(owned.itemId, pt.x, pt.y);
    if (!spot) {
      showToast(`No room for the ${item.name} there — it's ${sizeLabel(item)}`, true);
      return;
    }
    round.owned = round.owned.filter(o => o.instanceId !== instanceId);
    round.placed.push({ instanceId, itemId: owned.itemId, x: spot.x, y: spot.y, rot: spot.rot });
    selectedInstanceId = instanceId;
    renderRoom();
    renderTray();
    renderObjectives();
  };

  document.addEventListener('pointermove', move);
  document.addEventListener('pointerup', up);
  document.addEventListener('pointercancel', up);
}

// ─── Scoring ──────────────────────────────────
function finishRound() {
  const { theme } = round;
  if (round.placed.length === 0 && !confirm('Your room is empty! Finish anyway?')) return;
  if (round.placed.length > 0 && !confirm('Finish decorating and lock in your score?')) return;

  const breakdown = theme.objectives.map(obj => {
    const actual = countMatching(obj);
    const met = actual >= obj.count;
    const ratio = Math.min(actual, obj.count) / obj.count;
    return { label: obj.label, actual, target: obj.count, met, ratio };
  });

  const avgRatio = breakdown.reduce((sum, b) => sum + b.ratio, 0) / breakdown.length;
  const stars = Math.max(0, Math.min(5, Math.round(avgRatio * 5)));
  const bonus = STAR_BONUS[stars] || 0;
  const refund = round.owned.reduce((sum, o) => sum + getItem(o.itemId).price, 0);

  saveData.coins += bonus + refund;
  recordRound(saveData, theme.id, stars, bonus);
  window.removeEventListener('resize', renderRoom);

  showScore(theme, breakdown, stars, bonus, refund);
}

function showScore(theme, breakdown, stars, bonus, refund) {
  const el = screens.score;
  el.innerHTML = `
    <div class="card" style="max-width:500px">
      <div class="card-title">${theme.emoji} ${theme.name} — Results</div>
      <div class="rd-score-stars">${'⭐'.repeat(stars)}${'☆'.repeat(5 - stars)}</div>
      <div class="rd-score-bonus">+${bonus} 🪙 bonus coins earned!</div>
      ${refund > 0 ? `<p style="text-align:center;font-size:13px;color:var(--text-light);margin-bottom:8px">+${refund} 🪙 refunded for unused items</p>` : ''}
      <div class="rd-score-checklist">
        ${breakdown.map(b => `
          <div class="rd-score-row ${b.met ? 'met' : ''}">
            <span>${b.met ? '✅' : '⬜'}</span>
            <span style="flex:1">${b.label}</span>
            <span style="font-weight:700">${Math.min(b.actual, b.target)}/${b.target}</span>
          </div>
        `).join('')}
      </div>
      <p style="text-align:center;margin-top:16px;color:var(--text-light)">Total coins: 🪙 ${saveData.coins}</p>
      <button id="btn-next-theme" class="btn btn-primary btn-block mt-16">🔄 Pick Another Theme</button>
    </div>
  `;

  document.getElementById('btn-next-theme').addEventListener('click', () => {
    round = null;
    view = null;
    showThemes();
  });

  switchScreen('score');
}

// ─── Boot ─────────────────────────────────────
checkDailyAllowance();
showThemes();
