// Dash Master Screen — Pick game mode, set challenge

let conn = null;
let myPlayerId = null;

export function showDashMaster(state, connection, pid) {
  conn = connection;
  myPlayerId = pid;
}

export function updateDashMaster(state, connection, pid) {
  conn = connection;
  myPlayerId = pid;

  const el = document.getElementById('screen-dash-master');
  if (!state) return;

  const isDashMaster = state.dashMaster?.id === pid;
  const games = [{ id: 'draw-it', name: 'Draw It', emoji: '🖌️', description: 'Draw the word!' }];

  el.innerHTML = `
    <div class="dash-master-crown">👑</div>
    <h1>${state.dashMaster?.name || 'Player'}</h1>
    <p style="color:var(--text-light);text-align:center;margin-bottom:16px">is the Dash Master!</p>

    ${isDashMaster ? `
      <div class="card">
        <div class="card-title">🎯 Pick a Game Mode</div>
        <div class="game-mode-grid">
          ${games.map(g => `
            <button class="game-mode-card selected" data-game="${g.id}">
              <span class="game-mode-emoji">${g.emoji}</span>
              <span class="game-mode-name">${g.name}</span>
              <span class="game-mode-desc">${g.description}</span>
            </button>
          `).join('')}
        </div>

        <label style="font-weight:600;font-size:14px;display:block;margin-bottom:4px">Challenge Word or Phrase:</label>
        <input id="challenge-input" class="input" type="text" placeholder="What should everyone draw?" maxlength="50" autocomplete="off">
        <button id="btn-send-challenge" class="btn btn-primary btn-block mt-16">🚀 Send Challenge!</button>
      </div>
    ` : `
      <div class="card" style="text-align:center">
        <p style="font-size:48px">⏳</p>
        <p style="font-size:18px;font-weight:600">Waiting for ${state.dashMaster?.name || 'Dash Master'} to pick a challenge...</p>
      </div>
    `}
  `;

  if (isDashMaster) {
    document.getElementById('btn-send-challenge')?.addEventListener('click', () => {
      const challenge = document.getElementById('challenge-input')?.value.trim();
      if (!challenge) return;
      conn.send('start_round', { gameId: 'draw-it', challenge });
    });

    // Allow pressing Enter in challenge input
    document.getElementById('challenge-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const challenge = document.getElementById('challenge-input')?.value.trim();
        if (!challenge) return;
        conn.send('start_round', { gameId: 'draw-it', challenge });
      }
    });
  }
}
