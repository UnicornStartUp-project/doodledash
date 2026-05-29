// Draw It — Client-side canvas drawing engine
// Touch-optimized freehand drawing with undo support

export function drawItInit(canvas) {
  const ctx = canvas.getContext('2d');
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let currentColor = '#FF6B8A';
  let brushSize = 3;
  let isDrawing = false;
  let strokes = [];
  let currentStroke = [];
  let isEraser = false;

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e) {
    e.preventDefault();
    isDrawing = true;
    const pos = getPos(e);
    currentStroke = [{ x: pos.x, y: pos.y, color: currentColor, size: brushSize, eraser: currentColor === 'eraser' }];
    strokes.push(currentStroke);
    drawDot(pos.x, pos.y);
  }

  function moveDraw(e) {
    e.preventDefault();
    if (!isDrawing || currentStroke.length === 0) return;
    const pos = getPos(e);
    const prev = currentStroke[currentStroke.length - 1];
    currentStroke.push({ x: pos.x, y: pos.y, color: currentColor, size: brushSize, eraser: currentColor === 'eraser' });
    drawLine(prev.x, prev.y, pos.x, pos.y);
  }

  function endDraw(e) {
    if (!isDrawing) return;
    isDrawing = false;
    if (currentStroke.length === 0) {
      strokes.pop();
    }
  }

  function drawDot(x, y) {
    if (currentColor === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = currentColor;
    }
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawLine(x1, y1, x2, y2) {
    if (currentColor === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = currentColor;
    }
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  }

  function redrawAll() {
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const stroke of strokes) {
      if (stroke.length === 0) continue;
      if (stroke[0].eraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = stroke[0].color;
      }
      ctx.lineWidth = stroke[0].size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // Touch events
  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', moveDraw, { passive: false });
  canvas.addEventListener('touchend', endDraw);
  canvas.addEventListener('touchcancel', endDraw);

  // Mouse events (for desktop testing)
  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', moveDraw);
  canvas.addEventListener('mouseup', endDraw);
  canvas.addEventListener('mouseleave', endDraw);

  const api = {
    setColor(color) {
      currentColor = color;
      isEraser = color === 'eraser';
    },
    setBrushSize(size) {
      brushSize = size;
    },
    undo() {
      if (strokes.length > 0) {
        strokes.pop();
        redrawAll();
      }
    },
    clear() {
      strokes = [];
      currentStroke = [];
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    },
    getData() {
      return canvas.toDataURL('image/png');
    },
    destroy() {
      canvas.removeEventListener('touchstart', startDraw);
      canvas.removeEventListener('touchmove', moveDraw);
      canvas.removeEventListener('touchend', endDraw);
      canvas.removeEventListener('touchcancel', endDraw);
      canvas.removeEventListener('mousedown', startDraw);
      canvas.removeEventListener('mousemove', moveDraw);
      canvas.removeEventListener('mouseup', endDraw);
      canvas.removeEventListener('mouseleave', endDraw);
    },
  };

  return api;
}
