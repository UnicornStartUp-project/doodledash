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

export function createIsoView(canvas) {
  const ctx = canvas.getContext('2d');
  let room = { W: 400, D: 400, H: 250 };
  let wallColor = '#f4ece0';
  let floorColor = '#e8d5b7';
  let items = [];
  let selectedId = null;
  let viewRot = 0;

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
    k = Math.min(kx, ky);
    const totalH = ((Wv + Dv) / 2 + room.H) * k;
    ox = cssW / 2 - ((Wv - Dv) * k) / 2;
    oy = (cssH - totalH) / 2 + room.H * k;
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

    // Walls
    poly([P(0, 0, 0), P(0, Dv, 0), P(0, Dv, H), P(0, 0, H)], shade(wallColor, -0.14), 'rgba(0,0,0,0.12)');
    poly([P(0, 0, 0), P(Wv, 0, 0), P(Wv, 0, H), P(0, 0, H)], wallColor, 'rgba(0,0,0,0.12)');

    // Height ruler on the back corner edge
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

    // Floor
    poly([P(0, 0), P(Wv, 0), P(Wv, Dv), P(0, Dv)], floorColor, 'rgba(0,0,0,0.2)');

    // Floor grid (25 cm, bold every 1 m)
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

    // Room size labels along the front edges
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

  function drawItem(it, r) {
    const x0 = r.x, y0 = r.y, x1 = r.x + r.w, y1 = r.y + r.d;
    const zb = it.elev || 0;
    const zt = zb + it.h;
    const base = it.color;

    if (it.dragging) ctx.globalAlpha = 0.75;

    if (zb > 0) {
      poly([P(x0, y0), P(x1, y0), P(x1, y1), P(x0, y1)], 'rgba(0,0,0,0.12)');
    }

    poly([P(x0, y1, zb), P(x1, y1, zb), P(x1, y1, zt), P(x0, y1, zt)], base, 'rgba(0,0,0,0.25)');
    poly([P(x1, y0, zb), P(x1, y1, zb), P(x1, y1, zt), P(x1, y0, zt)], shade(base, -0.2), 'rgba(0,0,0,0.25)');
    poly([P(x0, y0, zt), P(x1, y0, zt), P(x1, y1, zt), P(x0, y1, zt)], shade(base, 0.28), 'rgba(0,0,0,0.25)');

    if (it.colliding) {
      poly(silhouette(r, zb, zt), 'rgba(239,68,68,0.45)');
    }

    const size = Math.max(16, Math.min(72, Math.max(r.w, r.d, it.h) * k * 0.55));
    const [cx, cy] = P((x0 + x1) / 2, (y0 + y1) / 2, (zb + zt) / 2);
    ctx.font = `${size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.fillText(it.emoji, cx, cy);

    ctx.globalAlpha = 1;

    if (it.instanceId === selectedId) {
      ctx.save();
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#FF6B8A';
      ctx.beginPath();
      silhouette(r, zb, zt).forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
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
    render,
    screenToFloor,
    hitTest,
    anchorFor,
  };
}
