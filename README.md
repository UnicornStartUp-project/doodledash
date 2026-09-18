# 🎨 DoodleDash

Turn-based multiplayer party game for kids. Draw, caption, vote, and chat with friends on iPad.

## Architecture

```
packages/
├── server/     # WebSocket game server + game registry
├── client/     # HTML5 Canvas client (touch-optimized)
├── shared/     # Shared types, protocols, constants
└── games/      # Pluggable game modules
    ├── draw-it/
    ├── caption-this/
    ├── would-you-rather/
    └── impersonate/
```

## Game Plugin System

Each game module exports a standard interface:

```js
{ id, name, emoji, description, setup, onMessage, onTick, cleanup }
```

## Room Design (solo)

A standalone single-player decorating game, served statically at `/room-design/`
(linked from the lobby screen). No WebSocket/room needed — pick a theme, shop for
furniture with your coins, drag-and-drop decorate a room, and get scored against
the theme's checklist. Progress (coins, best scores) is saved in `localStorage`.

```
packages/client/public/room-design/
├── index.html    # page shell
├── style.css     # page-specific styles (reuses /style.css tokens)
├── data.js       # item catalog + theme checklists
├── storage.js    # localStorage save/load
└── app.js        # screens: theme picker → decorate → score
```

## Quick Start

```bash
npm install
npm start        # Starts server on :3000
```

Open http://localhost:3000 on iPads to play, or http://localhost:3000/room-design/
for the solo decorating game.
