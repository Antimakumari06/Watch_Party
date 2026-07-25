const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
 
// Redis is OPTIONAL — only used if REDIS_URL is set in env.
// This lets you run multiple instances of this server behind a load
// balancer and still have Socket.IO broadcast events across all of them.
let createAdapter, createClient;
try {
  ({ createAdapter } = require("@socket.io/redis-adapter"));
  ({ createClient } = require("redis"));
} catch (e) {
  // packages not installed — fine, Redis support just stays disabled
}
 
const app = express();
 
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://watch-party-1-88o7.onrender.com",
];
 
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
  })
);
app.use(express.json());
 
// ================= HTTP SERVER =================
 
const server = http.createServer(app);
 
// ================= SOCKET.IO =================
 
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
 
// ================= OOP DOMAIN MODEL =================
 
class Participant {
  constructor(id, username, role = "Participant") {
    this.id = id; // socket.id
    this.username = username;
    this.role = role; // "Host" | "Moderator" | "Participant"
  }
 
  isHost() {
    return this.role === "Host";
  }
 
  canControlPlayback() {
    return this.role === "Host" || this.role === "Moderator";
  }
 
  toJSON() {
    return { id: this.id, username: this.username, role: this.role };
  }
}
 
class Room {
  constructor(id) {
    this.id = id;
    this.participants = []; // Participant[]
    this.videoId = "dQw4w9WgXcQ";
    this.videoState = { currentTime: 0, isPlaying: false };
    this.mediaState = { muted: false, volume: 100 };
  }
 
  findBySocketId(socketId) {
    return this.participants.find((p) => p.id === socketId) || null;
  }
 
  findByUsername(username) {
    return this.participants.find((p) => p.username === username) || null;
  }
 
  getRole(socketId) {
    return this.findBySocketId(socketId)?.role || null;
  }
 
  canControlPlayback(socketId) {
    const p = this.findBySocketId(socketId);
    return !!p && p.canControlPlayback();
  }
 
  isHost(socketId) {
    const p = this.findBySocketId(socketId);
    return !!p && p.isHost();
  }
 
  // Reconnect-safe join: reuse existing role if this username already
  // has an entry (e.g. page refresh gives a new socket.id).
  addOrReconnectParticipant(socketId, username) {
    const stale = this.findByUsername(username);
    if (stale) {
      stale.id = socketId;
      return stale;
    }
    const role = this.participants.length === 0 ? "Host" : "Participant";
    const participant = new Participant(socketId, username, role);
    this.participants.push(participant);
    return participant;
  }
 
  removeBySocketId(socketId) {
    this.participants = this.participants.filter((p) => p.id !== socketId);
  }
 
  reassignHostIfNeeded() {
    if (this.participants.length === 0) return;
    const stillHasHost = this.participants.some((p) => p.isHost());
    if (!stillHasHost) {
      this.participants[0].role = "Host";
      console.log("👑 New Host Assigned:", this.participants[0].username);
    }
  }
 
  isEmpty() {
    return this.participants.length === 0;
  }
 
  toParticipantsJSON() {
    return this.participants.map((p) => p.toJSON());
  }
}
 
class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomId -> Room
  }
 
  getOrCreate(roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Room(roomId));
    }
    return this.rooms.get(roomId);
  }
 
  get(roomId) {
    return this.rooms.get(roomId) || null;
  }
 
  delete(roomId) {
    this.rooms.delete(roomId);
  }
 
  // Find every room a given socket currently belongs to (used on disconnect)
  roomsForSocket(socketId) {
    const result = [];
    for (const room of this.rooms.values()) {
      if (room.findBySocketId(socketId)) result.push(room);
    }
    return result;
  }
}
 
const roomManager = new RoomManager();
 
// ================= TEST ROUTE =================
 
app.get("/", (req, res) => {
  res.send("🚀 Watch Party Backend Running...");
});
 
// ================= SOCKET CONNECTION =================
 
io.on("connection", (socket) => {
  console.log("✅ User Connected:", socket.id);
 
  // ================= JOIN ROOM =================
 
  socket.on("join-room", ({ roomId, username }) => {
    console.log("📥 JOIN ROOM:", roomId, username);
 
    socket.join(roomId);
 
    const room = roomManager.getOrCreate(roomId);
 
    if (room.findBySocketId(socket.id)) return;
 
    const participant = room.addOrReconnectParticipant(socket.id, username);
    if (participant.role === "Host" && room.participants.length === 1) {
      // freshly created host, nothing else to log
    }
 
    console.log("👥 Participants:", room.toParticipantsJSON());
 
    io.to(roomId).emit("participants-update", {
      participants: room.toParticipantsJSON(),
    });
 
    socket.emit("video-state", room.videoState);
    socket.emit("video-changed", { videoId: room.videoId });
    socket.emit("sync-mute", { muted: room.mediaState.muted });
    socket.emit("sync-volume", { volume: room.mediaState.volume });
  });
 
  // ================= PLAY =================
 
  socket.on("play", ({ roomId, currentTime }) => {
    const room = roomManager.get(roomId);
    if (!room || !room.canControlPlayback(socket.id)) return;
 
    console.log("▶️ Play:", roomId);
 
    room.videoState.currentTime = currentTime;
    room.videoState.isPlaying = true;
 
    socket.to(roomId).emit("play", { currentTime });
  });
 
  // ================= PAUSE =================
 
  socket.on("pause", ({ roomId, currentTime }) => {
    const room = roomManager.get(roomId);
    if (!room || !room.canControlPlayback(socket.id)) return;
 
    console.log("⏸ Pause:", roomId);
 
    room.videoState.currentTime = currentTime;
    room.videoState.isPlaying = false;
 
    socket.to(roomId).emit("pause", { currentTime });
  });
 
  // ================= SEEK =================
 
  socket.on("seek", ({ roomId, currentTime }) => {
    const room = roomManager.get(roomId);
    if (!room || !room.canControlPlayback(socket.id)) return;
 
    console.log("⏩ Seek:", currentTime);
 
    room.videoState.currentTime = currentTime;
 
    socket.to(roomId).emit("seek", { currentTime });
  });
 
  // ================= CHAT =================
 
  socket.on("send-message", ({ roomId, username, message }) => {
    console.log(`💬 ${username}: ${message}`);
 
    io.to(roomId).emit("receive-message", {
      username,
      message,
      time: new Date().toLocaleTimeString(),
    });
  });
 
  // ================= TYPING INDICATOR =================
 
  socket.on("typing", ({ roomId, username }) => {
    socket.to(roomId).emit("user-typing", { username });
  });
 
  socket.on("stop-typing", ({ roomId, username }) => {
    socket.to(roomId).emit("user-stop-typing", { username });
  });
 
  // ================= CHANGE VIDEO =================
 
  socket.on("change-video", ({ roomId, videoId }) => {
    const room = roomManager.get(roomId);
    if (!room || !room.canControlPlayback(socket.id)) return;
 
    console.log("🎬 Video Changed:", videoId);
 
    room.videoId = videoId;
    room.videoState = { currentTime: 0, isPlaying: false };
 
    io.to(roomId).emit("video-changed", { videoId });
  });
 
  // ================= MUTE / VOLUME SYNC =================
 
  socket.on("mute-toggle", ({ roomId, muted }) => {
    const room = roomManager.get(roomId);
    if (room) room.mediaState.muted = muted;
    socket.to(roomId).emit("sync-mute", { muted });
  });
 
  socket.on("volume-change", ({ roomId, volume }) => {
    const room = roomManager.get(roomId);
    if (room) room.mediaState.volume = volume;
    socket.to(roomId).emit("sync-volume", { volume });
  });
 
  // ================= ASSIGN ROLE (Host only) =================
 
  socket.on("assign-role", ({ roomId, userId, role }) => {
    const room = roomManager.get(roomId);
    if (!room || !room.isHost(socket.id)) return;
 
    const allowedRoles = ["Participant", "Moderator"];
    if (!allowedRoles.includes(role)) return;
 
    const target = room.findBySocketId(userId);
    if (!target) {
      console.log("⚠️ assign-role: target user not found (stale id?)", userId);
      return;
    }
 
    if (target.isHost()) return;
 
    target.role = role;
    console.log(`🎭 Role updated: ${target.username} -> ${role}`);
 
    io.to(roomId).emit("role-assigned", {
      userId,
      username: target.username,
      role,
      participants: room.toParticipantsJSON(),
    });
  });
 
  // ================= TRANSFER HOST (Host only) =================
 
  socket.on("transfer-host", ({ roomId, userId }) => {
    const room = roomManager.get(roomId);
    if (!room || !room.isHost(socket.id)) return;
 
    const currentHost = room.findBySocketId(socket.id);
    const newHost = room.findBySocketId(userId);
 
    if (!currentHost || !newHost) return;
    if (newHost.isHost()) return;
 
    currentHost.role = "Participant";
    newHost.role = "Host";
 
    console.log(
      `👑 Host transferred: ${currentHost.username} -> ${newHost.username}`
    );
 
    io.to(roomId).emit("host-transferred", {
      newHostId: newHost.id,
      newHostUsername: newHost.username,
      participants: room.toParticipantsJSON(),
    });
  });
 
  // ================= REMOVE PARTICIPANT (Host only) =================
 
  socket.on("remove-participant", ({ roomId, userId }) => {
    const room = roomManager.get(roomId);
    if (!room || !room.isHost(socket.id)) return;
 
    const target = room.findBySocketId(userId);
    if (!target || target.isHost()) return;
 
    room.removeBySocketId(userId);
 
    console.log(`🚫 Removed ${target.username} from room ${roomId}`);
 
    io.to(roomId).emit("participant-removed", {
      userId,
      participants: room.toParticipantsJSON(),
    });
 
    const targetSocket = io.sockets.sockets.get(userId);
    if (targetSocket) {
      targetSocket.emit("removed-from-room", { roomId });
      targetSocket.leave(roomId);
    }
  });
 
  // ================= VOICE CHAT =================
 
  socket.on("voice-join", ({ roomId }) => {
    socket.to(roomId).emit("voice-user-joined", { socketId: socket.id });
  });
 
  socket.on("voice-offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("voice-offer", { offer, sender: socket.id });
  });
 
  socket.on("voice-answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("voice-answer", { answer, sender: socket.id });
  });
 
  socket.on("voice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("voice-candidate", { candidate, sender: socket.id });
  });
 
  // ================= LEAVE ROOM (explicit) =================
 
  socket.on("leave-room", ({ roomId }) => {
    console.log("🚪 User Leaving:", socket.id, roomId);
    handleUserLeave(socket, roomId);
  });
 
  function handleUserLeave(socket, roomId) {
    const room = roomManager.get(roomId);
    if (!room) return;
 
    room.removeBySocketId(socket.id);
 
    socket.leave(roomId);
    socket.to(roomId).emit("voice-user-left", { socketId: socket.id });
 
    if (room.isEmpty()) {
      roomManager.delete(roomId);
      console.log("🗑 Room Deleted:", roomId);
      return;
    }
 
    room.reassignHostIfNeeded();
 
    io.to(roomId).emit("participants-update", {
      participants: room.toParticipantsJSON(),
    });
 
    console.log("👥 Remaining Users:", room.participants.length);
  }
 
  // ================= DISCONNECT =================
 
  socket.on("disconnect", () => {
    console.log("❌ User Disconnected:", socket.id);
 
    // A socket could theoretically be in more than one room
    const rooms = roomManager.roomsForSocket(socket.id);
    for (const room of rooms) {
      handleUserLeave(socket, room.id);
    }
  });
});
 
// ================= OPTIONAL REDIS ADAPTER (SCALABILITY) =================
//
// Set REDIS_URL in your environment (e.g. redis://localhost:6379) to
// enable this. Without it, the server runs fine as a single instance —
// nothing changes. With it, you can run N instances of this server
// behind a load balancer / sticky-session-free proxy, and Socket.IO
// will broadcast "io.to(roomId).emit(...)" events across all of them
// via Redis Pub/Sub.
//
// npm install @socket.io/redis-adapter redis
 
async function setupRedisAdapter() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.log("ℹ️  REDIS_URL not set — running in single-instance mode.");
    return;
  }
  if (!createAdapter || !createClient) {
    console.warn(
      "⚠️  REDIS_URL is set but @socket.io/redis-adapter / redis are not installed. Run: npm install @socket.io/redis-adapter redis"
    );
    return;
  }
 
  try {
    const pubClient = createClient({ url: redisUrl });
    const subClient = pubClient.duplicate();
 
    pubClient.on("error", (err) => console.error("Redis pub error:", err));
    subClient.on("error", (err) => console.error("Redis sub error:", err));
 
    await Promise.all([pubClient.connect(), subClient.connect()]);
 
    io.adapter(createAdapter(pubClient, subClient));
    console.log("✅ Redis adapter connected — multi-instance scaling enabled.");
  } catch (err) {
    console.error("❌ Failed to connect Redis adapter, falling back to single-instance mode:", err);
  }
}
 
// ================= START SERVER =================
 
const PORT = process.env.PORT || 5001;
 
setupRedisAdapter().finally(() => {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});