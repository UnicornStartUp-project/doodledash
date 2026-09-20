// Room Design — Isometric 2.5-D room renderer
// All coordinates are real centimetres. Room origin is the back corner;
// x runs along the right-hand back wall, y along the left-hand back wall.

export const CELL = 25;

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function shade(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  const mix = (c) => {
    const target = amount > 0 ? 255 : 0;
    return Math.round(c + (target - c) * Math.abs(amount));
  };
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

// Rotate a footprint rect into the rotated view frame (rot = 0..3 quarter turns)
export function rotRect(rect, rot, W, D) {
  const { x, y, w = 0, d = 0 } = rect;
  switch (rot & 3) {
    case 1: return { x: y, y: W - x - w, w: d, d: w };
    case 2: return { x: W - x - w, y: D - y - d, w, d };
    case 3: return { x: D - y - d, y: x, w: d, d: w };
    default: return { x, y, w, d };
  }
}

export function rectsCollide3D(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x &&
    a.y < b.y + b.d && a.y + a.d > b.y &&
    a.z < b.z + b.h && a.z + a.h > b.z;
}

function pointInPolygon(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

// ─── Item shape archetypes ────────────────────
// Every archetype returns a list of boxes {x,y,z,w,d,h} in LOCAL centimetres
// (0..w, 0..d, 0..h of the item's own footprint). Purely cosmetic — collision
// and placement always use the plain bounding box, never these parts.
function getParts(shape, w, d, h) {
  const legW = Math.max(3, Math.min(w, d) * 0.08);
  switch (shape) {
    case 'seat': {
      const seatH = h * 0.42, seatTop = h * 0.58;
      return [
        { x: 0, y: 0, z: 0, w: legW, d: legW, h: seatH },
        { x: w - legW, y: 0, z: 0, w: legW, d: legW, h: seatH },
        { x: 0, y: d - legW, z: 0, w: legW, d: legW, h: seatH },
        { x: w - legW, y: d - legW, z: 0, w: legW, d: legW, h: seatH },
        { x: 0, y: 0, z: seatH, w, d, h: seatTop - seatH },
        { x: 0, y: d * 0.78, z: seatH, w, d: d * 0.22, h: h - seatH },
      ];
    }
    case 'bed': {
      const frameH = h * 0.35, mattTop = h * 0.85;
      return [
        { x: 0, y: 0, z: 0, w, d, h: frameH },
        { x: w * 0.04, y: d * 0.05, z: frameH, w: w * 0.92, d: d * 0.88, h: mattTop - frameH },
        { x: 0, y: 0, z: 0, w, d: d * 0.06, h: h * 1.5 },
      ];
    }
    case 'table': {
      const topH = Math.max(2, h * 0.12), bodyTop = h - topH;
      return [
        { x: 0, y: 0, z: bodyTop, w, d, h: topH },
        { x: 0, y: 0, z: 0, w: legW, d: legW, h: bodyTop },
        { x: w - legW, y: 0, z: 0, w: legW, d: legW, h: bodyTop },
        { x: 0, y: d - legW, z: 0, w: legW, d: legW, h: bodyTop },
        { x: w - legW, y: d - legW, z: 0, w: legW, d: legW, h: bodyTop },
      ];
    }
    case 'cabinet': {
      const topH = Math.max(2, h * 0.08);
      return [
        { x: 0, y: 0, z: 0, w, d, h: h - topH },
        { x: -w * 0.02, y: -d * 0.02, z: h - topH, w: w * 1.04, d: d * 1.04, h: topH },
      ];
    }
    case 'lamp': {
      const baseH = Math.max(2, h * 0.08), poleTop = h * 0.78;
      return [
        { x: w * 0.15, y: d * 0.15, z: 0, w: w * 0.7, d: d * 0.7, h: baseH },
        { x: w * 0.38, y: d * 0.38, z: baseH, w: w * 0.24, d: d * 0.24, h: poleTop - baseH },
        { x: 0, y: 0, z: poleTop, w, d, h: h - poleTop },
      ];
    }
    case 'plant': {
      const potH = h * 0.32;
      return [
        { x: w * 0.15, y: d * 0.15, z: 0, w: w * 0.7, d: d * 0.7, h: potH },
        { x: w * 0.1, y: d * 0.1, z: potH, w: w * 0.8, d: d * 0.8, h: (h - potH) * 0.55 },
        { x: w * 0.22, y: d * 0.22, z: potH + (h - potH) * 0.45, w: w * 0.56, d: d * 0.56, h: (h - potH) * 0.55 },
      ];
    }
    case 'tv': {
      const standH = Math.max(2, h * 0.15);
      return [
        { x: w * 0.35, y: d * 0.35, z: 0, w: w * 0.3, d: d * 0.3, h: standH },
        { x: 0, y: d * 0.6, z: standH, w, d: d * 0.4, h: h - standH },
      ];
    }
    case 'train':
      return [
        { x: 0, y: 0, z: 0, w: w * 0.7, d, h: h * 0.6 },
        { x: w * 0.68, y: d * 0.15, z: 0, w: w * 0.32, d: d * 0.7, h },
      ];
    case 'flat':
    case 'box':
    default:
      return [{ x: 0, y: 0, z: 0, w, d, h }];
  }
}

export function createIsoView(canvas) {
  const ctx = canvas.getContext('2d');
  let room = { W: 400, D: 400, H: 250 };
  let wallColor = '#f4ece0';
  let floorColor = '#e8d5b7';
  let items = [];
  let selectedId = null;
  let viewRot = 0;
  let zoom = 1;
  let panX = 0, panY = 0;

  // Layout (recomputed each render, in CSS pixels)
  let k = 1, ox = 0, oy = 0, cssW = 0, cssH = 0;

  const viewDims = () => (viewRot & 1 ? { Wv: room.D, Dv: room.W } : { Wv: room.W, Dv: room.D });

  function layout() {
    const dpr = window.devicePixelRatio || 1;
    cssW = canvas.clientWidth;
    cssH = canvas.clientHeight;
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { Wv, Dv } = viewDims();
    const margin = 28;
    const kx = (cssW - margin * 2) / (Wv + Dv);
    const ky = (cssH - margin * 2) / ((Wv + Dv) / 2 + room.H);
    k = Math.min(kx, ky) * zoom;
    const totalH = ((Wv + Dv) / 2 + room.H) * k;
    ox = cssW / 2 - ((Wv - Dv) * k) / 2 + panX;
    oy = (cssH - totalH) / 2 + room.H * k + panY;
  }

  const P = (x, y, z = 0) => [ox + (x - y) * k, oy + ((x + y) * k) / 2 - z * k];

  function poly(points, fill, stroke) {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
  }

  function drawRoom() {
    const { Wv, Dv } = viewDims();
    const H = room.H;

    poly([P(0, 0, 0), P(0, Dv, 0), P(0, Dv, H), P(0, 0, H)], shade(wallColor, -0.14), 'rgba(0,0,0,0.12)');
    poly([P(0, 0, 0), P(Wv, 0, 0), P(Wv, 0, H), P(0, 0, H)], wallColor, 'rgba(0,0,0,0.12)');

    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.font = `700 ${Math.max(10, k * 12)}px Nunito, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (let z = 50; z <= H; z += 50) {
      const [x, y] = P(0, 0, z);
      const major = z % 100 === 0;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (major ? 10 : 6), y);
      ctx.stroke();
      if (major) ctx.fillText(`${z / 100} m`, x + 13, y);
    }

    poly([P(0, 0), P(Wv, 0), P(Wv, Dv), P(0, Dv)], floorColor, 'rgba(0,0,0,0.2)');

    for (let x = CELL; x < Wv; x += CELL) {
      const major = x % 100 === 0;
      ctx.strokeStyle = major ? 'rgba(0,0,0,0.16)' : 'rgba(0,0,0,0.06)';
      ctx.beginPath(); ctx.moveTo(...P(x, 0)); ctx.lineTo(...P(x, Dv)); ctx.stroke();
    }
    for (let y = CELL; y < Dv; y += CELL) {
      const major = y % 100 === 0;
      ctx.strokeStyle = major ? 'rgba(0,0,0,0.16)' : 'rgba(0,0,0,0.06)';
      ctx.beginPath(); ctx.moveTo(...P(0, y)); ctx.lineTo(...P(Wv, y)); ctx.stroke();
    }

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.font = `800 ${Math.max(11, k * 13)}px Nunito, sans-serif`;
    ctx.textAlign = 'center';
    const [fx, fy] = P(Wv / 2, Dv);
    ctx.fillText(`${(Wv / 100).toFixed(1)} m`, fx + 6, fy + 16);
    const [lx, ly] = P(Wv, Dv / 2);
    ctx.fillText(`${(Dv / 100).toFixed(1)} m`, lx + 6, ly + 16);
  }

  function silhouette(r, zb, zt) {
    const x0 = r.x, y0 = r.y, x1 = r.x + r.w, y1 = r.y + r.d;
    return [P(x0, y0, zt), P(x1, y0, zt), P(x1, y0, zb), P(x1, y1, zb), P(x0, y1, zb), P(x0, y1, zt)];
  }

  function drawBox(x0, y0, x1, y1, zb, zt, base) {
    poly([P(x0, y1, zb), P(x1, y1, zb), P(x1, y1, zt), P(x0, y1, zt)], base, 'rgba(0,0,0,0.25)');
    poly([P(x1, y0, zb), P(x1, y1, zb), P(x1, y1, zt), P(x1, y0, zt)], shade(base, -0.2), 'rgba(0,0,0,0.25)');
    poly([P(x0, y0, zt), P(x1, y0, zt), P(x1, y1, zt), P(x0, y1, zt)], shade(base, 0.28), 'rgba(0,0,0,0.25)');
  }

  function drawItem(it, r) {
    const zBase = it.elev || 0;
    const zTop = zBase + it.h;
    const base = it.color;

    if (it.dragging) ctx.globalAlpha = 0.75;

    if (zBase > 0) {
      poly([P(r.x, r.y), P(r.x + r.w, r.y), P(r.x + r.w, r.y + r.d), P(r.x, r.y + r.d)], 'rgba(0,0,0,0.12)');
    }

    const parts = getParts(it.shape, r.w, r.d, it.h)
      .map(p => ({ ...p, x: p.x + r.x, y: p.y + r.y, z: p.z + zBase }))
      .sort((a, b) => (a.x + a.y) - (b.x + b.y) || a.z - b.z);

    for (const p of parts) {
      drawBox(p.x, p.y, p.x + p.w, p.y + p.d, p.z, p.z + p.h, base);
    }

    if (it.colliding) poly(silhouette(r, zBase, zTop), 'rgba(239,68,68,0.4)');
    if (it.surfaceTarget) poly(silhouette(r, zTop, zTop + 1), null, 'rgba(52,211,153,0.9)');

    const badgeSize = Math.max(13, Math.min(30, Math.max(r.w, r.d) * k * 0.32));
    const [ex, ey] = P((r.x + r.x + r.w) / 2, (r.y + r.y + r.d) / 2, zTop + 14);
    ctx.font = `${badgeSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(it.emoji, ex, ey);

    ctx.globalAlpha = 1;

    if (it.instanceId === selectedId) {
      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#FF6B8A';
      ctx.beginPath();
      silhouette(r, zBase, zTop).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
  }

  function sortedItems() {
    return items
      .map(it => ({ it, r: rotRect(it, viewRot, room.W, room.D) }))
      .sort((a, b) => (a.r.x + a.r.y) - (b.r.x + b.r.y) || (a.it.elev || 0) - (b.it.elev || 0));
  }

  function render() {
    layout();
    ctx.clearRect(0, 0, cssW, cssH);
    drawRoom();
    for (const { it, r } of sortedItems()) drawItem(it, r);
  }

  function toCanvasPx(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return [clientX - rect.left, clientY - rect.top];
  }

  // Screen → floor point in ORIGINAL room coordinates (cm)
  function screenToFloor(clientX, clientY) {
    const [px, py] = toCanvasPx(clientX, clientY);
    const X = px - ox, Y = py - oy;
    const xv = (X + 2 * Y) / (2 * k);
    const yv = (2 * Y - X) / (2 * k);
    const { Wv, Dv } = viewDims();
    const back = rotRect({ x: xv, y: yv }, (4 - viewRot) & 3, Wv, Dv);
    return { x: back.x, y: back.y };
  }

  function hitTest(clientX, clientY) {
    const [px, py] = toCanvasPx(clientX, clientY);
    const list = sortedItems();
    for (let i = list.length - 1; i >= 0; i--) {
      const { it, r } = list[i];
      const zb = it.elev || 0;
      if (pointInPolygon(px, py, silhouette(r, zb, zb + it.h))) return it.instanceId;
    }
    return null;
  }

  // Screen position (CSS px, relative to canvas) above an item — for the HTML toolbar
  function anchorFor(instanceId) {
    const it = items.find(i => i.instanceId === instanceId);
    if (!it) return null;
    const r = rotRect(it, viewRot, room.W, room.D);
    const [x, y] = P(r.x + r.w / 2, r.y + r.d / 2, (it.elev || 0) + it.h);
    return { x, y };
  }

  return {
    setRoom(W, D, H) { room = { W, D, H }; },
    setColors(wall, floor) { wallColor = wall; floorColor = floor; },
    setItems(list) { items = list; },
    setSelected(id) { selectedId = id; },
    rotateView() { viewRot = (viewRot + 1) & 3; },
    getViewRot() { return viewRot; },
    setZoom(z) { zoom = Math.min(3, Math.max(0.5, z)); },
    getZoom() { return zoom; },
    zoomBy(factor) { zoom = Math.min(3, Math.max(0.5, zoom * factor)); },
    panBy(dx, dy) { panX += dx; panY += dy; },
    resetView() { zoom = 1; panX = 0; panY = 0; },
    render,
    screenToFloor,
    hitTest,
    anchorFor,
  };
}
