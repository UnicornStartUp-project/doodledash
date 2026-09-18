// Room Design — Solo Decorating Game
// Standalone single-player page: pick a theme, shop with your coins,
// decorate a room, get scored against the theme's checklist, earn bonus coins.

import { ITEMS, THEMES, CATEGORIES, TIERS, WALLS, FLOORS, getItem, getTheme, STAR_BONUS } from './data.js';
import { loadState, saveState, recordRound } from './storage.js';

const screens = {
  themes: document.getElementById('screen-themes'),
  decorate: document.getElementById('screen-decorate'),
  score: document.getElementById('screen-score'),
};

let saveData = loadState();

// ─── Round state ─────────────────────────────
let round = null; // { theme, owned: [{instanceId,itemId}], placed: [{instanceId,itemId,x,y,flipped}] }
let selectedInstanceId = null;
let activeShopCategory = null;
let uidCounter = 0;
const nextId = () => `i${uidCounter++}`;

function switchScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.classList.toggle('hidden', key !== name);
  });
}

function showToast(text) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  container.appendChild(el);
  setTimeout(() => el.remove(), 2200);
}

// ─── Theme Picker Screen ─────────────────────
function showThemes() {
  const el = screens.themes;
  el.innerHTML = `
    <div class="rd-topbar">
      <div>
        <div class="logo" style="font-size:36px;margin-bottom:0">🛋️</div>
      </div>
      <div class="rd-coins">🪙 ${saveData.coins}</div>
    </div>
    <h1>Room Design</h1>
    <p style="color:var(--text-light);text-align:center;margin-bottom:20px">Pick a theme, shop smart, decorate your room!</p>
    <div class="theme-grid">
      ${THEMES.map(t => `
        <button class="theme-card" data-theme="${t.id}">
          <span class="theme-card-emoji">${t.emoji}</span>
          <span class="theme-card-name">${t.name}</span>
          <span class="theme-card-desc">${t.description}</span>
          ${saveData.bestStars[t.id] ? `<div class="theme-card-best">${'⭐'.repeat(saveData.bestStars[t.id])} best</div>` : ''}
        </button>
      `).join('')}
    </div>
  `;

  el.querySelectorAll('.theme-card').forEach(btn => {
    btn.addEventListener('click', () => startRound(btn.dataset.theme));
  });

  switchScreen('themes');
}

// ─── Decorate Screen ─────────────────────────
function startRound(themeId) {
  const theme = getTheme(themeId);
  if (!theme) return;
  round = { theme, owned: [], placed: [], wallId: WALLS[0].id, floorId: FLOORS[0].id };
  selectedInstanceId = null;
  activeShopCategory = Object.keys(CATEGORIES)[0];
  renderDecorate();
  switchScreen('decorate');
}

function renderDecorate() {
  const el = screens.decorate;
  const { theme } = round;

  el.innerHTML = `
    <div class="rd-decorate-wrap">
      <div class="rd-topbar" style="margin-bottom:0">
        <div style="font-weight:800;font-size:16px">${theme.emoji} ${theme.name}</div>
        <div class="rd-coins">🪙 <span id="rd-coin-count">${saveData.coins}</span></div>
      </div>

      <div class="rd-objectives" id="rd-objectives"></div>

      <div class="rd-surface-row">
        <span class="rd-surface-label">🧱 Walls</span>
        <div class="rd-swatches" id="rd-walls">
          ${WALLS.map(w => `<button class="rd-swatch" data-wall="${w.id}" title="${w.name}" style="background:${w.css}"></button>`).join('')}
        </div>
      </div>
      <div class="rd-surface-row">
        <span class="rd-surface-label">🪵 Floor</span>
        <div class="rd-swatches" id="rd-floors">
          ${FLOORS.map(f => `<button class="rd-swatch" data-floor="${f.id}" title="${f.name}" style="background:${f.css}"></button>`).join('')}
        </div>
      </div>

      <div class="rd-room" id="rd-room">
        <div class="rd-wall" id="rd-wall"></div>
        <div class="rd-floor" id="rd-floor"></div>
        <div class="rd-items" id="rd-items"></div>
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
      <p style="font-size:12px;color:var(--text-light);text-align:center">Changed your mind? Tap ✕ on a tray item to sell it back for a full refund, or ↩️ Back to leave with all your coins returned.</p>
    </div>
  `;

  el.querySelectorAll('.rd-shop-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeShopCategory = btn.dataset.cat;
      el.querySelectorAll('.rd-shop-tab').forEach(b => b.classList.toggle('selected', b === btn));
      renderShopGrid();
    });
  });

  document.getElementById('btn-reset-room').addEventListener('click', () => {
    round.owned.push(...round.placed.map(p => ({ instanceId: p.instanceId, itemId: p.itemId })));
    round.placed = [];
    selectedInstanceId = null;
    renderRoom();
    renderTray();
  });

  document.getElementById('btn-finish').addEventListener('click', finishRound);

  document.getElementById('btn-cancel-round').addEventListener('click', cancelRound);

  document.getElementById('rd-room').addEventListener('pointerdown', (e) => {
    if (['rd-room', 'rd-wall', 'rd-floor', 'rd-items'].includes(e.target.id)) {
      selectedInstanceId = null;
      renderRoom();
    }
  });

  el.querySelectorAll('[data-wall]').forEach(btn => {
    btn.addEventListener('click', () => { round.wallId = btn.dataset.wall; renderSurfaces(); });
  });
  el.querySelectorAll('[data-floor]').forEach(btn => {
    btn.addEventListener('click', () => { round.floorId = btn.dataset.floor; renderSurfaces(); });
  });

  renderSurfaces();
  renderObjectives();
  renderShopGrid();
  renderTray();
  renderRoom();
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
    if (!item) return false;
    return obj.type === 'tag' ? item.tags.includes(obj.value) : item.category === obj.value;
  }).length;
}

function renderShopGrid() {
  const el = document.getElementById('rd-shop-grid');
  if (!el) return;
  const items = ITEMS.filter(i => i.category === activeShopCategory);
  el.innerHTML = items.map(item => `
    <div class="rd-shop-item ${saveData.coins < item.price ? 'unaffordable' : ''}" data-item="${item.id}" style="border-color:${TIERS[item.tier].color}66">
      <span class="rd-shop-item-emoji">${item.emoji}</span>
      <div class="rd-shop-item-name">${item.name}</div>
      <div class="rd-shop-item-price">🪙${item.price}</div>
    </div>
  `).join('');

  el.querySelectorAll('.rd-shop-item').forEach(card => {
    card.addEventListener('click', () => buyItem(card.dataset.item));
  });
}

function buyItem(itemId) {
  const item = getItem(itemId);
  if (!item) return;
  if (saveData.coins < item.price) {
    showToast("Not enough coins for that! 🪙");
    return;
  }
  saveData.coins -= item.price;
  saveState(saveData);
  round.owned.push({ instanceId: nextId(), itemId });

  document.getElementById('rd-coin-count').textContent = saveData.coins;
  renderShopGrid();
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
      <div class="rd-tray-item" data-instance="${o.instanceId}" title="${item.name}">
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

  document.getElementById('rd-coin-count').textContent = saveData.coins;
  renderShopGrid();
  renderTray();
}

function cancelRound() {
  const refund = [...round.owned, ...round.placed]
    .reduce((sum, o) => sum + (getItem(o.itemId)?.price || 0), 0);
  saveData.coins += refund;
  saveState(saveData);
  if (refund > 0) showToast(`Refunded 🪙${refund} — no coins lost!`);
  round = null;
  showThemes();
}

// ─── Room rendering ───────────────────────────
function renderSurfaces() {
  const wall = WALLS.find(w => w.id === round.wallId) || WALLS[0];
  const floor = FLOORS.find(f => f.id === round.floorId) || FLOORS[0];
  document.getElementById('rd-wall').style.background = wall.css;
  document.getElementById('rd-floor').style.background = floor.css;
  document.querySelectorAll('[data-wall]').forEach(b => b.classList.toggle('selected', b.dataset.wall === wall.id));
  document.querySelectorAll('[data-floor]').forEach(b => b.classList.toggle('selected', b.dataset.floor === floor.id));
}

function renderRoom() {
  const room = document.getElementById('rd-items');
  if (!room) return;
  room.innerHTML = '';

  round.placed.forEach(p => {
    const item = getItem(p.itemId);
    const node = document.createElement('div');
    node.className = 'rd-placed-item' + (p.instanceId === selectedInstanceId ? ' selected' : '');
    node.style.left = `${p.x}%`;
    node.style.top = `${p.y}%`;
    node.style.transform = `translate(-50%, -50%) scaleX(${p.flipped ? -1 : 1})`;
    node.textContent = item.emoji;
    node.dataset.instance = p.instanceId;
    node.addEventListener('pointerdown', (e) => startPlacedDrag(e, p.instanceId));
    room.appendChild(node);

    if (p.instanceId === selectedInstanceId) {
      const toolbar = document.createElement('div');
      toolbar.className = 'rd-item-toolbar';
      toolbar.style.left = `${p.x}%`;
      toolbar.style.top = `${p.y}%`;
      toolbar.innerHTML = `<button data-action="flip" title="Flip">🔄</button><button data-action="remove" title="Remove">🗑️</button>`;
      toolbar.querySelector('[data-action="flip"]').addEventListener('click', (e) => {
        e.stopPropagation();
        p.flipped = !p.flipped;
        renderRoom();
      });
      toolbar.querySelector('[data-action="remove"]').addEventListener('click', (e) => {
        e.stopPropagation();
        removePlaced(p.instanceId);
      });
      room.appendChild(toolbar);
    }
  });
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

// ─── Drag: from tray into room ───────────────
function startTrayDrag(e, instanceId) {
  e.preventDefault();
  const owned = round.owned.find(o => o.instanceId === instanceId);
  if (!owned) return;
  const item = getItem(owned.itemId);

  const ghost = document.createElement('div');
  ghost.textContent = item.emoji;
  ghost.style.position = 'fixed';
  ghost.style.fontSize = '40px';
  ghost.style.pointerEvents = 'none';
  ghost.style.zIndex = '999';
  ghost.style.transform = 'translate(-50%, -50%)';
  document.body.appendChild(ghost);

  const move = (ev) => {
    ghost.style.left = `${ev.clientX}px`;
    ghost.style.top = `${ev.clientY}px`;
  };
  move(e);

  const up = (ev) => {
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
    ghost.remove();

    const room = document.getElementById('rd-room');
    const rect = room.getBoundingClientRect();
    if (ev.clientX >= rect.left && ev.clientX <= rect.right && ev.clientY >= rect.top && ev.clientY <= rect.bottom) {
      const x = ((ev.clientX - rect.left) / rect.width) * 100;
      const y = ((ev.clientY - rect.top) / rect.height) * 100;
      const oIdx = round.owned.findIndex(o => o.instanceId === instanceId);
      if (oIdx !== -1) round.owned.splice(oIdx, 1);
      round.placed.push({ instanceId, itemId: owned.itemId, x, y, flipped: false });
      renderRoom();
      renderTray();
      renderObjectives();
    }
  };

  document.addEventListener('pointermove', move);
  document.addEventListener('pointerup', up);
}

// ─── Drag: reposition placed item ────────────
function startPlacedDrag(e, instanceId) {
  e.preventDefault();
  e.stopPropagation();
  selectedInstanceId = instanceId;
  renderRoom();

  const room = document.getElementById('rd-room');
  const placed = round.placed.find(p => p.instanceId === instanceId);
  if (!placed) return;

  let dragged = false;

  const move = (ev) => {
    dragged = true;
    const rect = room.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((ev.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((ev.clientY - rect.top) / rect.height) * 100));
    placed.x = x;
    placed.y = y;
    renderRoom();
  };

  const up = () => {
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', up);
    if (dragged) renderObjectives();
  };

  document.addEventListener('pointermove', move);
  document.addEventListener('pointerup', up);
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
  const refund = round.owned.reduce((sum, o) => sum + (getItem(o.itemId)?.price || 0), 0);

  saveData.coins += bonus + refund;
  recordRound(saveData, theme.id, stars, bonus);

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
    showThemes();
  });

  switchScreen('score');
}

// ─── Boot ─────────────────────────────────────
showThemes();
