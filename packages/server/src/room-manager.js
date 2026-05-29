// Room Manager — CRUD, player lifecycle, state

const { v4: uuidv4 } = require('uuid');
const {
  GAME_PHASES,
  ROOM_CODE_CHARS,
  ROOM_CODE_LENGTH,
  MAX_PLAYERS,
  ROOM_CLEANUP_MS,
} = require('../../shared');

const rooms = new Map();
const cleanupTimers = new Map();

function generateCode() {
  let code;
  do {
    code = '';
    for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
      code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
    }
  } while (rooms.has(code));
  return code;
}

function createRoom() {
  const code = generateCode();
  const room = {
    id: uuidv4(),
    code,
    players: new Map(),       // playerId → { id, name, character, connected }
    phase: GAME_PHASES.LOBBY,
    dashMasterIndex: 0,
    currentRound: 0,
    entries: new Map(),       // round → Map<playerId, entryData>
    votes: new Map(),         // round → Map<voterId, targetPlayerId>
    gameModule: null,
    gameState: {},
    chatHistory: [],
    createdAt: Date.now(),
  };
  rooms.set(code, room);
  console.log(`🏠 Room created: ${code}`);
  return room;
}

function joinRoom(code, playerId, playerName, character) {
  const room = rooms.get(code);
  if (!room) return { error: 'Room not found. Check the code and try again.' };
  if (room.phase !== GAME_PHASES.LOBBY && room.phase !== GAME_PHASES.RESULTS) {
    return { error: 'Game already in progress. Wait for the next round!' };
  }
  if (room.players.size >= MAX_PLAYERS) {
    return { error: 'Room is full (max 10 players)!' };
  }

  // If player already in room (reconnect), just update
  if (room.players.has(playerId)) {
    const p = room.players.get(playerId);
    p.connected = true;
    return { room, player: p };
  }

  const player = {
    id: playerId,
    name: playerName || 'Player',
    character: character || 'cat',
    connected: true,
    score: 0,
  };

  room.players.set(playerId, player);
  console.log(`👋 ${playerName} (${character}) joined room ${code}`);

  // Clear cleanup timer if one was set
  if (cleanupTimers.has(code)) {
    clearTimeout(cleanupTimers.get(code));
    cleanupTimers.delete(code);
  }

  return { room, player };
}

function leaveRoom(code, playerId, onEmpty) {
  const room = rooms.get(code);
  if (!room) return null;

  const player = room.players.get(playerId);
  if (!player) return null;

  // If the leaver was Dash Master, pass the crown
  const wasDashMaster = getDashMaster(room)?.id === playerId;

  room.players.delete(playerId);
  console.log(`👋 ${player.name} left room ${code}`);

  if (room.players.size === 0) {
    // Schedule cleanup
    const timer = setTimeout(() => {
      rooms.delete(code);
      cleanupTimers.delete(code);
      console.log(`🧹 Room ${code} cleaned up (empty)`);
      if (onEmpty) onEmpty(null);
    }, ROOM_CLEANUP_MS);
    cleanupTimers.set(code, timer);
    return room;
  }

  // If Dash Master left, rotate to next player
  if (wasDashMaster && room.players.size > 0) {
    room.dashMasterIndex = room.dashMasterIndex % room.players.size;
  }

  return room;
}

function getRoomByCode(code) {
  return rooms.get(code) || null;
}

function getPlayerCount(code) {
  const room = rooms.get(code);
  return room ? room.players.size : 0;
}

function getDashMaster(room) {
  const players = Array.from(room.players.values());
  return players[room.dashMasterIndex % players.length] || null;
}

function rotateDashMaster(room) {
  room.dashMasterIndex = (room.dashMasterIndex + 1) % room.players.size;
  return getDashMaster(room);
}

function getRoomState(room) {
  const players = Array.from(room.players.values()).map(p => ({
    id: p.id,
    name: p.name,
    character: p.character,
    connected: p.connected,
    score: p.score,
  }));

  return {
    code: room.code,
    phase: room.phase,
    players,
    dashMaster: getDashMaster(room),
    currentRound: room.currentRound,
    gameState: room.gameState,
    gameModule: room.gameModule ? {
      id: room.gameModule.id,
      name: room.gameModule.name,
      emoji: room.gameModule.emoji,
    } : null,
    chatHistory: room.chatHistory.slice(-20),
    playerCount: players.length,
  };
}

module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoomByCode,
  getPlayerCount,
  getDashMaster,
  rotateDashMaster,
  getRoomState,
};
