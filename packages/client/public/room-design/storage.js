// Room Design — Local save data (localStorage, no login needed)

import { STARTING_COINS } from './data.js';

const KEY = 'doodledash_room_design_v1';

function defaultState() {
  return {
    coins: STARTING_COINS,
    history: [], // { themeId, stars, coinsEarned, date }
    bestStars: {}, // themeId -> best star rating achieved
    lastAllowanceDay: null, // 'YYYY-MM-DD' of the last daily allowance
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable (private mode etc) — progress just won't persist
  }
}

export function recordRound(state, themeId, stars, coinsEarned) {
  state.history.push({ themeId, stars, coinsEarned, date: Date.now() });
  if (state.history.length > 50) state.history.shift();
  state.bestStars[themeId] = Math.max(state.bestStars[themeId] || 0, stars);
  saveState(state);
  return state;
}
