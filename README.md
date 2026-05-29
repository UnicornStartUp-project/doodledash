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

## Quick Start

```bash
npm install
npm start        # Starts server on :3000
```

Open http://localhost:3000 on iPads to play.
