// Lobby Screen — Join/Create Room + Character Select

import { PLAYER_CHARACTERS } from '../shared.js';

let selectedCharacter = 'cat';

export function showLobby(games) {
  const el = document.getElementById('screen-lobby');
  el.innerHTML = `
    <div class="logo">🎨</div>
    <h1>DoodleDash</h1>
    <p style="color:var(--text-light);text-align:center;margin-bottom:20px">Draw, laugh, and play with friends!</p>

    <div id="lobby-card" class="card">
      <div class="card-title">🎮 Join or Create</div>

      <div class="input-row mb-8">
        <input id="lobby-name" class="input" type="text" placeholder="Your name" maxlength="20" autocomplete="off">
      </div>

      <p class="section-title">Pick Your Character</p>
      <div id="char-picker" class="char-picker">
        ${PLAYER_CHARACTERS.map(c => `
          <div>
            <button class="char-option ${c.id === selectedCharacter ? 'selected' : ''}" data-char="${c.id}">${c.emoji}</button>
            <div class="char-name">${c.name}</div>
          </div>
        `).join('')}
      </div>

      <div style="display:flex;gap:8px;margin-bottom:12px">
        <input id="lobby-code" class="input" type="text" placeholder="Room code" maxlength="4" autocomplete="off" style="text-transform:uppercase;text-align:center;font-size:24px;letter-spacing:6px;flex:1">
        <button id="btn-join" class="btn btn-secondary">Join</button>
      </div>

      <div style="text-align:center;color:var(--text-light);margin:4px 0">— or —</div>

      <button id="btn-create" class="btn btn-primary btn-block" style="margin-top:8px">✨ Create New Room</button>

      <div id="room-info" class="hidden" style="text-align:center;margin-top:12px">
        <div id="room-code-show" class="room-code-display"></div>
        <div id="room-share" class="room-share-url"></div>
        <p style="font-size:13px;color:var(--text-light)">Share the code or link with friends!</p>
      </div>
    </div>

    <div id="player-list-card" class="card hidden" style="margin-top:12px">
      <div class="card-title">👥 Players in Room</div>
      <ul id="player-list" class="player-list"></ul>
      <button id="btn-start" class="btn btn-primary btn-block hidden">🎮 Start Playing!</button>
    </div>
  `;

  // Event listeners
  document.querySelectorAll('#char-picker .char-option').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedCharacter = btn.dataset.char;
      document.querySelectorAll('#char-picker .char-option').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
    });
  });

  const conn = window.__doodledash?.conn;

  document.getElementById('btn-create').addEventListener('click', () => {
    const name = document.getElementById('lobby-name').value.trim() || 'Player';
    conn.send('join', { create: true, playerName: name, character: selectedCharacter });
  });

  document.getElementById('btn-join').addEventListener('click', () => {
    const code = document.getElementById('lobby-code').value.trim().toUpperCase();
    const name = document.getElementById('lobby-name').value.trim() || 'Player';
    if (!code) return;
    conn.send('join', { create: false, code, playerName: name, character: selectedCharacter });
  });

  document.getElementById('btn-start')?.addEventListener('click', () => {
    // Start game — move to dash master selection
    conn.send('dash_master_set', {});
  });
}

export function updateLobby(state, conn, myPlayerId) {
  if (!state) return;

  // Show room info if in a room
  const roomInfo = document.getElementById('room-info');
  const playerListCard = document.getElementById('player-list-card');
  const btnStart = document.getElementById('btn-start');

  if (state.code) {
    roomInfo?.classList.remove('hidden');
    const codeDisplay = document.getElementById('room-code-show');
    const shareDisplay = document.getElementById('room-share');
    if (codeDisplay) codeDisplay.textContent = state.code;
    if (shareDisplay) {
      shareDisplay.textContent = `${window.location.origin}?room=${state.code}`;
      shareDisplay.onclick = () => {
        navigator.clipboard?.writeText(`${window.location.origin}?room=${state.code}`);
      };
    }
    playerListCard?.classList.remove('hidden');
  }

  // Update player list
  const playerList = document.getElementById('player-list');
  if (playerList && state.players) {
    const emojiMap = { cat: '🐱', bunny: '🐰', puppy: '🐶', fox: '🦊' };
    playerList.innerHTML = state.players.map(p => `
      <li class="player-item">
        <span class="player-emoji">${emojiMap[p.character] || '🎨'}</span>
        <span class="player-name">${p.name}${p.id === myPlayerId ? ' (you)' : ''}</span>
      </li>
    `).join('');
  }

  // Show start button only if we have >= 2 players (for host)
  if (btnStart && state.players?.length >= 2) {
    btnStart.classList.remove('hidden');
    btnStart.addEventListener('click', () => {
      // Move to dash-master phase - first player is dash master
      conn.send('dash_master_set', {});
    }, { once: true });
  }
}
