// Chat System — Text + Emoji chat

const { MAX_CHAT_HISTORY } = require('../../shared');

function handleChat(room, playerId, message, broadcast) {
  if (!message || typeof message !== 'string' || message.trim().length === 0) return;
  if (message.length > 500) return; // max message length

  const player = room.players.get(playerId);
  if (!player) return;

  const chatMsg = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    playerId,
    playerName: player.name,
    character: player.character,
    text: message.trim().substring(0, 500),
    timestamp: Date.now(),
  };

  room.chatHistory.push(chatMsg);
  if (room.chatHistory.length > MAX_CHAT_HISTORY) {
    room.chatHistory = room.chatHistory.slice(-MAX_CHAT_HISTORY);
  }

  broadcast({ type: 'chat', payload: chatMsg });
}

function handleEmojiChat(room, playerId, emoji, broadcast) {
  const player = room.players.get(playerId);
  if (!player) return;

  // Only allow specific emojis (simple validation)
  const validEmojis = ['😂', '🔥', '👏', '💀', '❤️', '🎨', '⭐', '👑', '🎉', '🥳', '🤩', '😍', '💖', '✨', '🌈', '🦄', '💩', '😱', '🤣', '👍'];
  if (!validEmojis.includes(emoji) && !/^\p{Emoji}$/u.test(emoji)) return;

  const emojiMsg = {
    playerId,
    playerName: player.name,
    character: player.character,
    emoji,
    timestamp: Date.now(),
  };

  broadcast({ type: 'emoji_chat', payload: emojiMsg });
}

module.exports = { handleChat, handleEmojiChat };
