// Reveal Screen — Show entries one by one

let revealIndex = 0;
let entries = [];
let votedFor = null;

export function showReveal(state) {
  revealIndex = 0;
  votedFor = null;

  const conn = window.__doodledash?.conn;
  if (!state) return;

  // Build entries array from state
  const roundEntries = state.entries;
  entries = [];

  if (roundEntries) {
    // entries is a Map serialized as object
    const entryMap = typeof roundEntries === 'object' ? roundEntries : {};
    for (const [playerId, entry] of Object.entries(entryMap)) {
      const player = state.players?.find(p => p.id === playerId);
      entries.push({
        playerId,
        playerName: player?.name || 'Unknown',
        character: player?.character || 'cat',
        drawing: entry?.drawing || null,
      });
    }
  }

  if (entries.length === 0) {
    // No entries yet, show waiting
    const el = document.getElementById('screen-reveal');
    el.innerHTML = `
      <div style="text-align:center">
        <p style="font-size:48px">🔍</p>
        <h2>Gathering entries...</h2>
      </div>
    `;
    return;
  }

  showCurrentEntry();
}

function showCurrentEntry() {
  const entry = entries[revealIndex];
  if (!entry) return;

  const el = document.getElementById('screen-reveal');
  const charEmoji = { cat: '🐱', bunny: '🐰', puppy: '🐶', fox: '🦊' }[entry.character] || '🎨';

  const isMyEntry = entry.playerId === window.__doodledash?.getPlayerId();

  el.innerHTML = `
    <div class="reveal-card">
      <p style="font-size:14px;color:var(--text-light)">Entry ${revealIndex + 1} of ${entries.length}</p>
      <div class="reveal-artist">${charEmoji} ${entry.playerName}${isMyEntry ? ' (you)' : ''}</div>
      ${entry.drawing ? `<img class="reveal-drawing" src="${entry.drawing}" alt="Drawing by ${entry.playerName}">` : '<p style="padding:40px;color:var(--text-light)">No drawing submitted</p>'}

      ${!isMyEntry ? `
        <div class="reveal-vote-prompt">
          <button id="btn-vote" class="btn btn-primary">⭐ Love This!</button>
        </div>
      ` : `<p style="font-size:13px;color:var(--text-light);margin-top:8px">This is your drawing!</p>`}

      <div style="display:flex;gap:8px;justify-content:center;margin-top:12px">
        ${revealIndex < entries.length - 1 ? `<button id="btn-skip" class="btn btn-secondary btn-small">Skip →</button>` : ''}
      </div>

      <div class="reveal-progress">Entry ${revealIndex + 1} / ${entries.length}</div>
    </div>
  `;

  // Vote button
  document.getElementById('btn-vote')?.addEventListener('click', () => {
    if (votedFor) return;
    votedFor = entry.playerId;
    window.__doodledash?.conn.send('vote', { targetPlayerId: entry.playerId });

    // Disable vote button
    const btn = document.getElementById('btn-vote');
    if (btn) {
      btn.textContent = '✅ Voted!';
      btn.disabled = true;
    }

    // Auto-advance
    if (revealIndex < entries.length - 1) {
      revealIndex++;
      setTimeout(() => showCurrentEntry(), 600);
    }
  });

  // Skip button
  document.getElementById('btn-skip')?.addEventListener('click', () => {
    if (revealIndex < entries.length - 1) {
      revealIndex++;
      showCurrentEntry();
    }
  });
}

export function updateReveal(state) {
  // Just update vote progress if needed
}
