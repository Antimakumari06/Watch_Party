const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
 
const app = express();
 
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://watch-party-1-88o7.onrender.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
 
// ================= HTTP SERVER =================
 
const server = http.createServer(app);
 
// ================= SOCKET.IO =================
 
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://watch-party-1-88o7.onrender.com",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});
 
// ================= ROOM STORAGE =================
 
const rooms = {};
 
// ================= TEST ROUTE =================
 
app.get("/", (req, res) => {
  res.send("🚀 Watch Party Backend Running...");
});
 
// helper: get a participant's role in a room
function getRole(roomId, socketId) {
  const room = rooms[roomId];
  if (!room) return null;
  const user = room.participants.find((p) => p.id === socketId);
  return user?.role || null;
}
 
// helper: Host OR Moderator can control playback
function canControlPlayback(roomId, socketId) {
  const role = getRole(roomId, socketId);
  return role === "Host" || role === "Moderator";
}
 
function isHost(roomId, socketId) {
  return getRole(roomId, socketId) === "Host";
}
 
// helper: reassign host when current host leaves
function reassignHostIfNeeded(roomId) {
  const room = rooms[roomId];
  if (!room || room.participants.length === 0) return;
 
  const stillHasHost = room.participants.some((p) => p.role === "Host");
  if (!stillHasHost) {
    room.participants[0].role = "Host";
    console.log("👑 New Host Assigned:", room.participants[0].username);
  }
}
 
// ================= SOCKET CONNECTION =================
 
io.on("connection", (socket) => {
  console.log("✅ User Connected:", socket.id);
 
  // ================= JOIN ROOM =================
 
  socket.on("join-room", ({ roomId, username }) => {
    console.log("📥 JOIN ROOM:", roomId, username);
 
    socket.join(roomId);
 
    if (!rooms[roomId]) {
      rooms[roomId] = {
        participants: [],
        videoId: "dQw4w9WgXcQ",
        videoState: {
          currentTime: 0,
          isPlaying: false,
        },
        mediaState: {
          muted: false,
          volume: 100,
        },
      };
    }
 
    const existsBySocket = rooms[roomId].participants.find(
      (user) => user.id === socket.id
    );
    if (existsBySocket) return; // already joined with this exact socket, nothing to do
 
    // 🆕 RECONNECT-SAFE JOIN:
    // Agar isi username ka koi purana (stale, ex: Render spin-down ke baad
    // reconnect hua) entry pehle se list mein hai, to uska socket id
    // refresh kar do, role (Host/Moderator) bilkul waisa hi rehne do —
    // isse duplicate participant nahi banega aur role reset nahi hoga.
    const staleEntry = rooms[roomId].participants.find(
      (user) => user.username === username
    );
 
    if (staleEntry) {
      console.log(`♻️ Reconnected: ${username} (old id -> new id)`);
      staleEntry.id = socket.id;
    } else {
      // First-ever participant becomes Host, everyone else Participant
      const role =
        rooms[roomId].participants.length === 0 ? "Host" : "Participant";
 
      rooms[roomId].participants.push({
        id: socket.id,
        username,
        role,
      });
    }
 
    console.log("👥 Participants:", rooms[roomId].participants);
 
    io.to(roomId).emit("participants-update", {
      participants: rooms[roomId].participants,
    });
 
    socket.emit("video-state", rooms[roomId].videoState);
    socket.emit("video-changed", { videoId: rooms[roomId].videoId });
    socket.emit("sync-mute", { muted: rooms[roomId].mediaState.muted });
    socket.emit("sync-volume", { volume: rooms[roomId].mediaState.volume });
  });
 
  // ================= PLAY =================
 
  socket.on("play", ({ roomId, currentTime }) => {
    if (!canControlPlayback(roomId, socket.id)) return;
 
    console.log("▶️ Play:", roomId);
 
    if (rooms[roomId]) {
      rooms[roomId].videoState.currentTime = currentTime;
      rooms[roomId].videoState.isPlaying = true;
    }
 
    socket.to(roomId).emit("play", { currentTime });
  });
 
  // ================= PAUSE =================
 
  socket.on("pause", ({ roomId, currentTime }) => {
    if (!canControlPlayback(roomId, socket.id)) return;
 
    console.log("⏸ Pause:", roomId);
 
    if (rooms[roomId]) {
      rooms[roomId].videoState.currentTime = currentTime;
      rooms[roomId].videoState.isPlaying = false;
    }
 
    socket.to(roomId).emit("pause", { currentTime });
  });
 
  // ================= SEEK =================
 
  socket.on("seek", ({ roomId, currentTime }) => {
    if (!canControlPlayback(roomId, socket.id)) return;
 
    console.log("⏩ Seek:", currentTime);
 
    if (rooms[roomId]) {
      rooms[roomId].videoState.currentTime = currentTime;
    }
 
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
    if (!canControlPlayback(roomId, socket.id)) return;
 
    console.log("🎬 Video Changed:", videoId);
 
    if (rooms[roomId]) {
      rooms[roomId].videoId = videoId;
      rooms[roomId].videoState = { currentTime: 0, isPlaying: false };
    }
 
    io.to(roomId).emit("video-changed", { videoId });
  });
 
  // ================= MUTE / VOLUME SYNC =================
 
  socket.on("mute-toggle", ({ roomId, muted }) => {
    if (rooms[roomId]) rooms[roomId].mediaState.muted = muted;
    socket.to(roomId).emit("sync-mute", { muted });
  });
 
  socket.on("volume-change", ({ roomId, volume }) => {
    if (rooms[roomId]) rooms[roomId].mediaState.volume = volume;
    socket.to(roomId).emit("sync-volume", { volume });
  });
 
  // ================= ASSIGN ROLE (Host only) =================
 
  socket.on("assign-role", ({ roomId, userId, role }) => {
    if (!isHost(roomId, socket.id)) return;
 
    const room = rooms[roomId];
    if (!room) return;
 
    const allowedRoles = ["Participant", "Moderator"];
    if (!allowedRoles.includes(role)) return;
 
    const targetUser = room.participants.find((p) => p.id === userId);
    if (!targetUser) {
      console.log("⚠️ assign-role: target user not found (stale id?)", userId);
      return;
    }
 
    if (targetUser.role === "Host") return;
 
    targetUser.role = role;
    console.log(`🎭 Role updated: ${targetUser.username} -> ${role}`);
 
    io.to(roomId).emit("role-assigned", {
      userId,
      username: targetUser.username,
      role,
      participants: room.participants,
    });
  });
 
  // ================= REMOVE PARTICIPANT (Host only) =================
 
  socket.on("remove-participant", ({ roomId, userId }) => {
    if (!isHost(roomId, socket.id)) return;
 
    const room = rooms[roomId];
    if (!room) return;
 
    const targetUser = room.participants.find((p) => p.id === userId);
    if (!targetUser || targetUser.role === "Host") return;
 
    room.participants = room.participants.filter((p) => p.id !== userId);
 
    console.log(`🚫 Removed ${targetUser.username} from room ${roomId}`);
 
    // Pehle remaining room ko updated list bhejo
    io.to(roomId).emit("participant-removed", {
      userId,
      participants: room.participants,
    });
 
    // Phir removed user ko specifically notify karo aur unhe room se nikaalo
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
    const room = rooms[roomId];
    if (!room) return;
 
    room.participants = room.participants.filter(
      (user) => user.id !== socket.id
    );
 
    socket.leave(roomId);
    socket.to(roomId).emit("voice-user-left", { socketId: socket.id });
 
    if (room.participants.length === 0) {
      delete rooms[roomId];
      console.log("🗑 Room Deleted:", roomId);
      return;
    }
 
    reassignHostIfNeeded(roomId);
 
    io.to(roomId).emit("participants-update", {
      participants: room.participants,
    });
 
    console.log("👥 Remaining Users:", room.participants.length);
  }
 
  // ================= DISCONNECT =================
 
  socket.on("disconnect", () => {
    console.log("❌ User Disconnected:", socket.id);
 
    for (const roomId in rooms) {
      if (!rooms[roomId]) continue;
 
      const wasInRoom = rooms[roomId].participants.some(
        (user) => user.id === socket.id
      );
 
      if (wasInRoom) {
        handleUserLeave(socket, roomId);
      }
    }
  });
});
 
// ================= START SERVER =================
 
const PORT = process.env.PORT || 5001;
 
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});