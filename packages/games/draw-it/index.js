// Draw It — Server-side game module
// Implements the standard game plugin interface

module.exports = {
  id: 'draw-it',
  name: 'Draw It',
  emoji: '🖌️',
  description: 'Draw the word! Can your friends guess who drew what?',
  maxPlayers: 10,
  roundDuration: 60,

  /**
   * Setup game state for a new round
   * @param {Object} room - Room object
   * @param {Object} options - { challenge: string }
   */
  setup(room, options = {}) {
    return {
      challenge: options.challenge || 'Draw something fun!',
      startedAt: Date.now(),
    };
  },

  /**
   * Handle incoming player messages during the game
   * @param {Object} room - Room object
   * @param {string} playerId - Player who sent the message
   * @param {Object} message - { type, payload }
   * @param {Function} broadcast - Function to broadcast to room
   */
  handleMessage(room, playerId, message, broadcast) {
    // The main protocol.js handles submit_entry and vote already
    // This is for any game-specific messages
    return false;
  },

  /**
   * Get current game state for the room
   */
  getState(room) {
    return room.gameState || {};
  },

  /**
   * Cleanup after round ends
   */
  cleanup(room) {
    room.gameState = {};
  },
};
