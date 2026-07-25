# 🎬 Watch Party — Real-Time YouTube Watch Party

Watch YouTube videos in sync with friends. One person controls playback (or shares control with a Moderator), everyone else watches in real time — same video, same timestamp, same play/pause state.

**🔴 Live App:** https://watch-party-1-88o7.onrender.com

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup & Run Locally](#setup--run-locally)
- [Architecture — How WebSockets Fit In](#architecture--how-websockets-fit-in)
- [Role Permissions](#role-permissions)
- [Trade-offs & Things I'd Improve](#trade-offs--things-id-improve)
- [Deployment](#deployment)
- [Author](#author)

---

## Features

- 🔗 Create or join a room via a shareable link
- ▶️ Synchronized play / pause / seek across all participants
- 🎥 Change the YouTube video live — everyone's player updates instantly
- 👑 Role-based access control — **Host / Moderator / Participant**
- 🛡️ Host can promote/demote roles, remove participants, and transfer host
- 💬 Real-time text chat with typing indicators + emoji picker
- 🔊 Synced mute/volume across the room
- 🎙️ Optional voice chat and camera (WebRTC, peer-to-peer)
- ⚡ Reconnect-safe — refreshing the page keeps your role and rejoins the room

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite |
| Backend | Node.js + Express |
| Realtime | Socket.IO (WebSockets) |
| Video | YouTube IFrame API (`react-youtube`) |
| Voice/Video | WebRTC (peer-to-peer, STUN only) |
| Scalability (optional) | Redis Pub/Sub via `@socket.io/redis-adapter` |
| Deployment | Render |

No database is used — room state lives in server memory for the lifetime of the room (rooms are deleted automatically once everyone leaves). This keeps the MVP simple; see [Trade-offs](#trade-offs--things-i-would-improve) below.

---

## Project Structure

```
Watch_Party/
├── backend/
│   └── index.js          # Express + Socket.IO server, Room/Participant classes
├── frontend/
│   └── src/
│       ├── pages/
│       │   └── Room.tsx  # Main room UI: player, chat, participants panel
│       └── services/
│           └── socket.ts # Socket.IO client instance
└── README.md
```

---

## Setup & Run Locally

### 1. Backend

```bash
cd backend
npm install
# Optional — only needed if you want Redis-based scaling:
# npm install @socket.io/redis-adapter redis

npm start
# Server runs on http://localhost:5001
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

### 3. Environment variables

| Variable | Where | Required | Purpose |
|---|---|---|---|
| `PORT` | backend | No (defaults to 5001) | Server port |
| `REDIS_URL` | backend | No | Enables multi-instance scaling via Redis Pub/Sub. Without it, the server runs in single-instance mode. |

The frontend's allowed origins and the backend's CORS whitelist are currently hardcoded in `backend/index.js` (`localhost:5173` + the deployed Render URL) — update `ALLOWED_ORIGINS` there if you deploy to a different domain.

---

## Architecture — How WebSockets Fit In

```
 Browser A (Host)        Browser B (Participant)
       │                          │
       │   socket.io client       │
       └────────────┬─────────────┘
                     │  WebSocket (Socket.IO)
                     ▼
            ┌───────────────────┐
            │   Express Server   │
            │  + Socket.IO layer │
            │                    │
            │  RoomManager       │
            │   └── Room         │
            │        └── Participant[]
            └───────────────────┘
```

1. **Connection** — each browser tab opens a persistent WebSocket connection to the server via the Socket.IO client (`services/socket.ts`).
2. **Joining** — client emits `join-room` with `{ roomId, username }`. The server looks up (or creates) a `Room` via `RoomManager`, and adds a `Participant` — the first person to join becomes `Host`, everyone else defaults to `Participant`.
3. **State sync** — the server is the single source of truth for `videoId`, `currentTime`, and `isPlaying` for each room. When a Host/Moderator plays, pauses, or seeks, the client emits an event (e.g. `play`) with the current timestamp; the server updates its in-memory `Room` state and re-broadcasts that event to everyone else in the room (`socket.to(roomId).emit(...)`) — the sender doesn't re-apply its own event.
4. **New joiners get caught up** — on `join-room`, the server immediately emits `video-state`, `video-changed`, `sync-mute`, and `sync-volume` back to just that socket, so a late joiner's player starts in sync with everyone else instead of at 0:00.
5. **Role enforcement happens server-side, not client-side** — every playback-control event (`play`, `pause`, `seek`, `change-video`) checks `room.canControlPlayback(socket.id)` *before* touching state or broadcasting. A Participant emitting `change-video` is silently ignored by the server, even if someone tampers with the frontend — the UI hiding the controls is just a convenience, not the actual security boundary.
6. **Room/role updates broadcast to everyone** — `assign-role`, `remove-participant`, and `transfer-host` all end by emitting the updated `participants` array to the whole room (`io.to(roomId).emit(...)`), so every client's participant list and permission checks (`canControl`) update immediately.
7. **Disconnect handling** — on `disconnect`, the server finds every room the socket was in, removes the participant, and if that person was Host, reassigns Host to the next participant (`reassignHostIfNeeded`). If the room is now empty, it's deleted from memory.
8. **Chat** is a simpler broadcast — `send-message` is relayed to the whole room via `io.to(roomId).emit("receive-message", ...)`, with no permission check since anyone can chat. Typing indicators (`typing` / `stop-typing`) work the same way but are only sent to *other* users (`socket.to`, not `io.to`).
9. **Voice/video (WebRTC)** — Socket.IO is only used here to exchange WebRTC signaling messages (`voice-offer`, `voice-answer`, `voice-candidate`) between peers; once the connection is established, audio/video flows peer-to-peer, not through the server.

### OOP structure (backend)

- **`Participant`** — wraps one user's `id` (socket id), `username`, and `role`; knows how to answer `isHost()` / `canControlPlayback()` about itself.
- **`Room`** — owns a list of `Participant`s plus `videoState`/`mediaState`; all lookups and mutations (find by socket id, reassign host, add/remove participant) are methods on `Room`, not scattered object manipulation.
- **`RoomManager`** — a `Map<roomId, Room>` with `getOrCreate` / `get` / `delete`, plus `roomsForSocket()` used on disconnect to clean up every room a socket belonged to.

This keeps all the "what is a room allowed to do" logic in one place instead of duplicated across each socket event handler.

### Scalability (bonus)

By default the server runs as a single process holding all room state in memory — fine for one instance. `setupRedisAdapter()` optionally connects Socket.IO to Redis Pub/Sub (`@socket.io/redis-adapter`) when `REDIS_URL` is set, which lets `io.to(roomId).emit(...)` calls reach sockets connected to *other* server instances too — a prerequisite for running this behind a load balancer across multiple Node processes. Room *state* itself (`RoomManager`) is still per-instance in-memory, so a real multi-instance deployment would need sticky sessions (so a given room's traffic mostly hits one instance) or moving room state into Redis as well — see trade-offs below.

---

## Role Permissions

| Action | Host | Moderator | Participant |
|---|---|---|---|
| Play / Pause / Seek | ✅ | ✅ | ❌ |
| Change video | ✅ | ✅ | ❌ |
| Send chat messages | ✅ | ✅ | ✅ |
| Assign roles | ✅ | ❌ | ❌ |
| Remove participants | ✅ | ❌ | ❌ |
| Transfer host | ✅ | ❌ | ❌ |

---

## Trade-offs & Things I'd Improve

- **No database** — room state is in-memory only, so a server restart wipes all active rooms. Fine for a live watch-party use case (rooms are ephemeral by nature), but there's no persistence, room history, or reconnection after a server redeploy.
- **No authentication** — usernames are self-reported, not verified. Anyone with the room link can join as any name.
- **CORS/allowed origins are hardcoded**, not environment-driven — a minor deployment inconvenience if the frontend URL changes.
- **Redis adapter handles event fan-out across instances, but not shared room state** — a true horizontally-scaled version would need room state itself in Redis (or a DB) so any instance can serve any room, not just relay events for rooms it already knows about.
- **WebRTC voice/video is peer-to-peer with STUN only** — no TURN server, so it can fail behind restrictive NATs/firewalls; would need a TURN server for reliability at scale.

---

## Deployment

Deployed on **Render** — backend and frontend as separate services. Pushing to `main` triggers an automatic redeploy on Render for both services.

---

## Author

**Antima Kumari**
