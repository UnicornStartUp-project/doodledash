// DoodleDash Shared Types & Protocol
// Shared between client and server — single source of truth

const GAME_PHASES = {
  LOBBY: 'lobby',
  DASH_MASTER: 'dashMaster',
  CREATE: 'create',
  REVEAL: 'reveal',
  RESULTS: 'results',
};

const MESSAGE_TYPES = {
  // Connection
  JOIN: 'join',
  LEAVE: 'leave',
  PLAYER_UPDATE: 'player_update',

  // Game flow
  GAME_STATE: 'game_state',
  DASH_MASTER_SET: 'dash_master_set',
  START_ROUND: 'start_round',
  SUBMIT_ENTRY: 'submit_entry',
  REVEAL_ENTRY: 'reveal_entry',
  VOTE: 'vote',

  // Social
  CHAT: 'chat',
  EMOJI_CHAT: 'emoji_chat',

  // System
  ERROR: 'error',
  ROOM_CLOSED: 'room_closed',
};

const PLAYER_CHARACTERS = [
  { id: 'cat', emoji: '🐱', name: 'Cat' },
  { id: 'bunny', emoji: '🐰', name: 'Bunny' },
  { id: 'puppy', emoji: '🐶', name: 'Puppy' },
  { id: 'fox', emoji: '🦊', name: 'Fox' },
];

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // no I/O to avoid confusion
const ROOM_CODE_LENGTH = 4;
const MAX_PLAYERS = 10;
const MAX_CHAT_HISTORY = 50;
const ROOM_CLEANUP_MS = 5 * 60 * 1000; // 5 min after last player leaves

const EMOJI_BAR = ['😂', '🔥', '👏', '💀', '❤️', '🎨', '⭐', '👑'];

const PASTEL_COLORS = [
  '#FF6B8A', // coral pink
  '#FF8FAB', // light pink
  '#FFB3C6', // baby pink
  '#FFC2D1', // blush
  '#A78BFA', // lavender
  '#818CF8', // periwinkle
  '#60A5FA', // sky blue
  '#34D399', // mint
  '#FBBF24', // sunny yellow
  '#F472B6', // hot pink
];

module.exports = {
  GAME_PHASES,
  MESSAGE_TYPES,
  PLAYER_CHARACTERS,
  ROOM_CODE_CHARS,
  ROOM_CODE_LENGTH,
  MAX_PLAYERS,
  MAX_CHAT_HISTORY,
  ROOM_CLEANUP_MS,
  EMOJI_BAR,
  PASTEL_COLORS,
};
