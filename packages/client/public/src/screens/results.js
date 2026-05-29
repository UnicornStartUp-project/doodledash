// Results Screen — Winner celebration, gallery, next round

export function showResults(data, state, conn) {
  const el = document.getElementById('screen-results');
  if (!data || !state) return;

  const { winner, votes } = data;
  const charMap = { cat: '🐱', bunny: '🐰', puppy: '🐶', fox: '🦊' };

  // Build entries gallery
  const entries = [];
  if (state.entries) {
    for (const [playerId, entry] of Object.entries(state.entries)) {
      const player = state.players?.find(p => p.id === playerId);
      const voteCount = votes ? Object.values(votes).filter(v => v === playerId).length : 0;
      entries.push({
        playerId,
        playerName: player?.name || 'Unknown',
        character: player?.character || 'cat',
        drawing: entry?.drawing || null,
        votes: voteCount,
      });
    }
  }

  el.innerHTML = `
    ${winner ? `
      <div class="results-winner">
        <div class="results-crown">👑</div>
        <div class="results-winner-name">${charMap[winner.character] || '🎨'} ${winner.name} wins!</div>
        <p style="font-size:14px;color:var(--text-light);margin-top:4px">${winner.name} got the most votes! 🎉</p>
      </div>
    ` : `
      <div class="results-winner">
        <p style="font-size:48px">🤝</p>
        <h2>It's a tie!</h2>
      </div>
    `}

    <div class="card">
      <div class="card-title">🖼️ All Entries</div>
      <div class="results-gallery">
        ${entries.map(e => `
          <div class="gallery-item">
            ${e.drawing ? `<img src="${e.drawing}" alt="Drawing by ${e.playerName}">` : '<div style="padding:30px;color:#ccc">No entry</div>'}
            <div class="artist">${charMap[e.character] || '🎨'} ${e.playerName}</div>
            <div class="votes">⭐ ${e.votes} vote${e.votes !== 1 ? 's' : ''}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="results-actions">
      <button id="btn-next-round" class="btn btn-primary">🔄 Next Round</button>
    </div>
  `;

  document.getElementById('btn-next-round')?.addEventListener('click', () => {
    // Rotate dash master and go back to dash-master screen
    conn.send('dash_master_set', {});
  });
}
