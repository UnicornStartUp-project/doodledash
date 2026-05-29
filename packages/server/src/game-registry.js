// Game Registry — Pluggable game module loader

const fs = require('fs');
const path = require('path');

const games = new Map();

function registerGame(gameModule) {
  if (!gameModule.id || !gameModule.name || !gameModule.emoji) {
    console.warn(`⚠️ Skipping invalid game module: missing id/name/emoji`);
    return false;
  }
  if (games.has(gameModule.id)) {
    console.warn(`⚠️ Game '${gameModule.id}' already registered — skipping`);
    return false;
  }
  games.set(gameModule.id, gameModule);
  console.log(`✅ Registered game: ${gameModule.emoji} ${gameModule.name}`);
  return true;
}

function loadGames() {
  const gamesDir = path.join(__dirname, '..', '..', 'games');

  if (!fs.existsSync(gamesDir)) {
    console.warn('⚠️ No games/ directory found');
    return;
  }

  const entries = fs.readdirSync(gamesDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const indexPath = path.join(gamesDir, entry.name, 'index.js');
    if (!fs.existsSync(indexPath)) continue;

    try {
      const gameModule = require(indexPath);
      registerGame(gameModule);
    } catch (err) {
      console.warn(`⚠️ Failed to load game '${entry.name}':`, err.message);
    }
  }
}

function getGame(id) {
  return games.get(id) || null;
}

function listGames() {
  return Array.from(games.values()).map(g => ({
    id: g.id,
    name: g.name,
    emoji: g.emoji,
    description: g.description || '',
  }));
}

module.exports = {
  registerGame,
  loadGames,
  getGame,
  listGames,
};
