// Utility helpers — DOM, animations, toast

export function showToast(text, isError = false) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${isError ? 'toast-error' : ''}`;
  toast.textContent = text;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

export function triggerConfetti() {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);

  const colors = ['#FF6B8A', '#FF8FAB', '#A78BFA', '#60A5FA', '#34D399', '#FBBF24', '#F472B6', '#818CF8'];

  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = `${1.5 + Math.random() * 2}s`;
    piece.style.animationDelay = `${Math.random() * 0.5}s`;
    piece.style.width = `${8 + Math.random() * 10}px`;
    piece.style.height = `${8 + Math.random() * 10}px`;
    container.appendChild(piece);
  }

  setTimeout(() => container.remove(), 3000);
}

export function floatEmoji(emoji, x, y) {
  const el = document.createElement('div');
  el.className = 'emoji-float';
  el.textContent = emoji;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1600);
}

export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
