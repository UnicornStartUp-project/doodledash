// Message Protocol — Parse, route, broadcast

const roomManager = require('./room-manager');
const chat = require('./chat');
const gameRegistry = require('./game-registry');
const { GAME_PHASES, MESSAGE_TYPES } = require('../../shared');

function parseMessage(raw) {
  try {
    const msg = JSON.parse(raw.toString());
    if (!msg || typeof msg !== 'object') return null;
    return msg;
  } catch {
    return null;
  }
}

function handleMessage(ws, room, msg, wss) {
  const { type, payload = {} } = msg;

  switch (type) {
    // ─── Lobby ───────────────────────────────────
    case MESSAGE_TYPES.JOIN:
      handleJoin(ws, payload, wss);
      break;

    // ─── Dash Master ─────────────────────────────
    case 'dash_master_set':
      handleDashMasterSet(ws, room);
      break;

    case MESSAGE_TYPES.START_ROUND:
      handleStartRound(ws, room, payload);
      break;

    // ─── Create Phase ────────────────────────────
    case MESSAGE_TYPES.SUBMIT_ENTRY:
      handleSubmitEntry(ws, room, payload);
      break;

    // ─── Reveal ─────────────────────────────────
    case MESSAGE_TYPES.VOTE:
      handleVote(ws, room, payload);
      break;

    // ─── Social ──────────────────────────────────
    case MESSAGE_TYPES.CHAT:
      if (!room) return;
      chat.handleChat(room, ws.playerId, payload.text, (m) => broadcast(room, m));
      break;

    case MESSAGE_TYPES.EMOJI_CHAT:
      if (!room) return;
      chat.handleEmojiChat(room, ws.playerId, payload.emoji, (m) => broadcast(room, m));
      break;

    default:
      // Forward to game module if one is active
      if (room && room.gameModule && room.gameModule.handleMessage) {
        room.gameModule.handleMessage(room, ws.playerId, msg, (m) => broadcast(room, m, ws.playerId));
        broadcastState(room);
      }
      break;
  }
}

function handleJoin(ws, payload, wss) {
  const { code, playerName, character, create } = payload;

  if (create) {
    const room = roomManager.createRoom();
    const result = roomManager.joinRoom(room.code, ws.playerId, playerName, character);
    if (result.error) {
      sendTo(ws, errorMessage('JOIN_FAILED', result.error));
      return;
    }
    ws.roomCode = room.code;
    broadcastState(result.room);
    return;
  }

  if (!code) {
    sendTo(ws, errorMessage('MISSING_CODE', 'Please enter a room code or create a new room.'));
    return;
  }

  const room = roomManager.getRoomByCode(code);
  if (!room) {
    sendTo(ws, errorMessage('ROOM_NOT_FOUND', "Room not found. Maybe try 'Create New Room'?"));
    return;
  }

  const result = roomManager.joinRoom(code, ws.playerId, playerName, character);
  if (result.error) {
    sendTo(ws, errorMessage('JOIN_FAILED', result.error));
    return;
  }

  ws.roomCode = code;
  broadcastState(result.room);
}

function handleDashMasterSet(ws, room) {
  if (!room) return;
  room.phase = GAME_PHASES.DASH_MASTER;
  broadcastState(room);
}

function handleStartRound(ws, room, payload) {
  if (!room) return;

  const dashMaster = roomManager.getDashMaster(room);
  if (ws.playerId !== dashMaster?.id) {
    sendTo(ws, errorMessage('NOT_DASH_MASTER', 'Only the Dash Master can start a round!'));
    return;
  }

  const { gameId, challenge } = payload;
  const gameModule = gameRegistry.getGame(gameId || 'draw-it');
  if (!gameModule) {
    sendTo(ws, errorMessage('INVALID_GAME', `Game "${gameId}" not found. Pick a valid game mode.`));
    return;
  }

  room.gameModule = gameModule;
  room.currentRound++;
  room.phase = GAME_PHASES.CREATE;
  room.entries.set(room.currentRound, new Map());
  room.votes.set(room.currentRound, new Map());

  // Setup game with challenge
  room.gameState = gameModule.setup ? gameModule.setup(room, { challenge: challenge || '' }) : { challenge: challenge || '' };

  broadcast(room, {
    type: MESSAGE_TYPES.START_ROUND,
    payload: {
      round: room.currentRound,
      game: { id: gameModule.id, name: gameModule.name, emoji: gameModule.emoji },
      challenge: challenge || '',
      phase: GAME_PHASES.CREATE,
      countdown: gameModule.roundDuration || 60,
    },
  });

  broadcastState(room);
}

function handleSubmitEntry(ws, room, payload) {
  if (!room || room.phase !== GAME_PHASES.CREATE) return;

  const roundEntries = room.entries.get(room.currentRound);
  if (!roundEntries) return;

  roundEntries.set(ws.playerId, payload);

  // Notify room that this player submitted
  broadcast(room, {
    type: 'player_submitted',
    payload: { playerId: ws.playerId, totalSubmitted: roundEntries.size },
  }, ws.playerId);

  // Check if all players submitted
  const allSubmitted = Array.from(room.players.values())
    .every(p => roundEntries.has(p.id));

  if (allSubmitted) {
    // Move to reveal phase
    room.phase = GAME_PHASES.REVEAL;
    broadcast(room, {
      type: 'all_submitted',
      payload: { phase: GAME_PHASES.REVEAL },
    });
  }

  broadcastState(room);
}

function handleVote(ws, room, payload) {
  if (!room || room.phase !== GAME_PHASES.REVEAL) return;

  const roundVotes = room.votes.get(room.currentRound);
  if (!roundVotes) return;

  const { targetPlayerId } = payload;

  // Can't vote for yourself
  if (targetPlayerId === ws.playerId) {
    sendTo(ws, errorMessage('SELF_VOTE', "You can't vote for yourself, silly! 😄"));
    return;
  }

  // Check target exists
  if (!room.players.has(targetPlayerId)) return;

  roundVotes.set(ws.playerId, targetPlayerId);

  broadcast(room, {
    type: 'vote_cast',
    payload: { voterId: ws.playerId, totalVotes: roundVotes.size },
  });

  // Check if all votes are in
  const allVoted = Array.from(room.players.values())
    .every(p => roundVotes.has(p.id) || !room.entries.get(room.currentRound)?.has(p.id));

  if (allVoted) {
    room.phase = GAME_PHASES.RESULTS;
    const winner = tallyVotes(room);
    if (winner) {
      const player = room.players.get(winner);
      if (player) player.score = (player.score || 0) + 1;
    }
    broadcast(room, {
      type: 'round_results',
      payload: {
        phase: GAME_PHASES.RESULTS,
        winner: winner ? {
          playerId: winner,
          name: room.players.get(winner)?.name,
          character: room.players.get(winner)?.character,
        } : null,
        votes: Object.fromEntries(roundVotes),
      },
    });
  }

  broadcastState(room);
}

function tallyVotes(room) {
  const roundVotes = room.votes.get(room.currentRound);
  if (!roundVotes) return null;

  const counts = {};
  for (const targetId of roundVotes.values()) {
    counts[targetId] = (counts[targetId] || 0) + 1;
  }

  let winner = null;
  let maxVotes = 0;
  for (const [playerId, count] of Object.entries(counts)) {
    if (count > maxVotes) {
      maxVotes = count;
      winner = playerId;
    }
  }

  return maxVotes > 0 ? winner : null;
}

function broadcast(room, message, excludePlayerId) {
  if (!room) return;
  const data = JSON.stringify(message);
  for (const [playerId, player] of room.players) {
    if (playerId === excludePlayerId) continue;
    if (player.ws && player.ws.readyState === 1) {
      try { player.ws.send(data); } catch {}
    }
  }
}

function broadcastState(room) {
  if (!room) return;
  const state = roomManager.getRoomState(room);
  broadcast(room, { type: MESSAGE_TYPES.GAME_STATE, payload: state });
}

function sendTo(ws, message) {
  if (ws.readyState !== 1) return;
  try { ws.send(JSON.stringify(message)); } catch {}
}

function errorMessage(code, text) {
  return { type: MESSAGE_TYPES.ERROR, payload: { code, text } };
}

module.exports = {
  parseMessage,
  handleMessage,
  broadcast,
  sendTo,
  errorMessage,
};
