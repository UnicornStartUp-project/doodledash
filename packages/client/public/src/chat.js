// Chat Bar — Emoji reactions + text chat

import { escapeHtml, floatEmoji } from './utils.js';

let conn = null;
let playerId = null;

export function initChat(connection, pid) {
  conn = connection;
  playerId = pid;

  // Emoji buttons
  document.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const emoji = btn.dataset.emoji;
      if (conn) {
        conn.send('emoji_chat', { emoji });
      }
    });
  });

  // Send button
  const sendBtn = document.getElementById('chat-send');
  const input = document.getElementById('chat-input');

  sendBtn.addEventListener('click', () => sendText());
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendText();
  });
}

function sendText() {
  const input = document.getElementById('chat-input');
  const text = input.value.trim();
  if (!text || !conn) return;
  conn.send('chat', { text });
  input.value = '';
}

export function showChat() {
  document.getElementById('chat-bar').classList.remove('hidden');
}

export function hideChat() {
  document.getElementById('chat-bar').classList.add('hidden');
}

export function addChatMessage(msg) {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const div = document.createElement('div');
  div.className = 'chat-msg';
  const emoji = getCharacterEmoji(msg.character);
  div.innerHTML = `<span class="name">${emoji} ${escapeHtml(msg.playerName)}:</span> ${escapeHtml(msg.text)}`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;

  // Keep max visible messages
  while (container.children.length > 30) {
    container.firstChild.remove();
  }
}

export function addEmojiMessage(msg) {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const div = document.createElement('div');
  div.className = 'chat-msg';
  div.innerHTML = `<span class="emoji-only">${msg.emoji}</span> <span style="font-size:12px;color:#999">${escapeHtml(msg.playerName)}</span>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;

  while (container.children.length > 30) {
    container.firstChild.remove();
  }

  // Float the emoji too
  floatEmoji(msg.emoji, Math.random() * window.innerWidth * 0.8 + 40, window.innerHeight * 0.5);
}

function getCharacterEmoji(charId) {
  const map = { cat: '🐱', bunny: '🐰', puppy: '🐶', fox: '🦊' };
  return map[charId] || '🎨';
}
