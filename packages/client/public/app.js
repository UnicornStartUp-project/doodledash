// DoodleDash Client — Main Bootstrap
// Connects WebSocket, manages screen routing

import Connection from './src/connection.js';
import { showLobby, updateLobby } from './src/screens/lobby.js';
import { showDashMaster, updateDashMaster } from './src/screens/dash-master.js';
import { showCreate, updateCreate, hideCreate } from './src/screens/create.js';
import { showReveal, updateReveal } from './src/screens/reveal.js';
import { showResults } from './src/screens/results.js';
import { initChat, showChat, hideChat, addChatMessage, addEmojiMessage } from './src/chat.js';
import { showToast, triggerConfetti } from './src/utils.js';

// ─── State ───────────────────────────────────
let currentScreen = 'connecting';
let playerId = null;
let roomState = null;

// ─── Screens ─────────────────────────────────
const screens = {
  connecting: document.getElementById('screen-connecting'),
  lobby: document.getElementById('screen-lobby'),
  'dash-master': document.getElementById('screen-dash-master'),
  create: document.getElementById('screen-create'),
  reveal: document.getElementById('screen-reveal'),
  results: document.getElementById('screen-results'),
};

function switchScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    if (key === name) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });
  currentScreen = name;

  // Show/hide chat bar
  if (['lobby', 'dash-master', 'create', 'reveal', 'results'].includes(name)) {
    showChat();
  } else {
    hideChat();
  }
}

// ─── Connection ──────────────────────────────
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const conn = new Connection(`${protocol}//${window.location.host}`);

conn.on('connected', (data) => {
  playerId = data.playerId;
  switchScreen('lobby');
  showLobby(data.games || [{ id: 'draw-it', name: 'Draw It', emoji: '🖌️', description: 'Draw the word!' }]);
});

conn.on('game_state', (data) => {
  roomState = data;
  routeToScreen(data.phase, data);
});

conn.on('start_round', (data) => {
  switchScreen(data.phase);
  showCreate(data);
});

conn.on('all_submitted', () => {
  switchScreen('reveal');
  showReveal(roomState);
});

conn.on('round_results', (data) => {
  switchScreen('results');
  showResults(data, roomState, conn);
  if (data.winner) {
    triggerConfetti();
  }
});

conn.on('chat', (data) => {
  addChatMessage(data);
});

conn.on('emoji_chat', (data) => {
  addEmojiMessage(data);
});

conn.on('error', (data) => {
  showToast(data.text || 'Something went wrong', true);
});

conn.on('player_update', (data) => {
  roomState = data;
  routeToScreen(data.phase, data);
});

conn.on('player_submitted', (data) => {
  if (currentScreen === 'create') {
    updateCreate({ submittedCount: data.totalSubmitted, totalPlayers: roomState?.players?.length || 0 });
  }
});

conn.on('vote_cast', () => {
  // Update reveal screen with vote progress
  if (currentScreen === 'reveal') {
    updateReveal(roomState);
  }
});

// ─── Router ───────────────────────────────────
function routeToScreen(phase, state) {
  switch (phase) {
    case 'lobby':
      switchScreen('lobby');
      updateLobby(state, conn, playerId);
      break;
    case 'dashMaster':
      switchScreen('dash-master');
      updateDashMaster(state, conn, playerId);
      break;
    case 'create':
      switchScreen('create');
      showCreate(state);
      break;
    case 'reveal':
      switchScreen('reveal');
      showReveal(state);
      break;
    case 'results':
      switchScreen('results');
      // results data comes via round_results message
      break;
  }
}

// ─── Chat Setup ───────────────────────────────
initChat(conn, playerId);

// ─── Expose connection for screens ────────────
window.__doodledash = { conn, getRoomState: () => roomState, getPlayerId: () => playerId };
