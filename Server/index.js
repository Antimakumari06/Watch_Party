const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

app.use(cors());
app.use(express.json());

// ================= HTTP SERVER =================

const server = http.createServer(app);

// ================= SOCKET.IO =================

const io = new Server(server, {
  cors: {
   origin: process.env.CLIENT_URL || "*",
    methods: ["GET", "POST"],
  },
});

// ================= ROOM STORAGE =================

const rooms = {};

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

    // Create room if not exists
    if (!rooms[roomId]) {
      rooms[roomId] = {
        participants: [],
        videoId: "dQw4w9WgXcQ",
        videoState: {
          currentTime: 0,
          isPlaying: false,
        },
      };
    }

    // Prevent duplicate join
    const exists = rooms[roomId].participants.find(
      (user) => user.id === socket.id
    );

    if (exists) return;

    // First user becomes Host
    const role =
      rooms[roomId].participants.length === 0
        ? "Host"
        : "Participant";

    const user = {
      id: socket.id,
      username,
      role,
    };

    rooms[roomId].participants.push(user);

    console.log("👥 Participants:");
    console.log(rooms[roomId].participants);

    // Send participant list
    io.to(roomId).emit("participants-update", {
      participants: rooms[roomId].participants,
    });

    // Send current video state to new user
    socket.emit("video-state", rooms[roomId].videoState);

    socket.emit("video-changed", {
      videoId: rooms[roomId].videoId,
    });
  });
     // ================= PLAY =================

  socket.on("play", ({ roomId, currentTime }) => {
    console.log("▶️ Play:", roomId);

    if (rooms[roomId]) {
      rooms[roomId].videoState.currentTime = currentTime;
      rooms[roomId].videoState.isPlaying = true;
    }

    socket.to(roomId).emit("play", {
      currentTime,
    });
  });

  // ================= PAUSE =================

  socket.on("pause", ({ roomId, currentTime }) => {
    console.log("⏸ Pause:", roomId);

    if (rooms[roomId]) {
      rooms[roomId].videoState.currentTime = currentTime;
      rooms[roomId].videoState.isPlaying = false;
    }

    socket.to(roomId).emit("pause", {
      currentTime,
    });
  });

  // ================= SEEK =================

  socket.on("seek", ({ roomId, currentTime }) => {
    console.log("⏩ Seek:", currentTime);

    if (rooms[roomId]) {
      rooms[roomId].videoState.currentTime = currentTime;
    }

    socket.to(roomId).emit("seek", {
      currentTime,
    });
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

  // ================= CHANGE VIDEO =================

  socket.on("change-video", ({ roomId, videoId }) => {
    console.log("🎬 Video Changed:", videoId);

    if (rooms[roomId]) {
      rooms[roomId].videoId = videoId;
    }

    io.to(roomId).emit("video-changed", {
      videoId,
    });
  });

  // ================= VOICE CHAT =================

  socket.on("voice-join", ({ roomId }) => {
    socket.to(roomId).emit("voice-user-joined", {
      socketId: socket.id,
    });
  });

  socket.on("voice-offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("voice-offer", {
      offer,
      sender: socket.id,
    });
  });

  socket.on("voice-answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("voice-answer", {
      answer,
      sender: socket.id,
    });
  });

  socket.on("voice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("voice-candidate", {
      candidate,
      sender: socket.id,
    });
  });
    // ================= DISCONNECT =================

  socket.on("disconnect", () => {
    console.log("❌ User Disconnected:", socket.id);

    for (const roomId in rooms) {
      if (!rooms[roomId]) continue;

      // Remove user
      rooms[roomId].participants =
        rooms[roomId].participants.filter(
          (user) => user.id !== socket.id
        );

      // Update participants
      io.to(roomId).emit("participants-update", {
        participants: rooms[roomId].participants,
      });

      // Notify voice users
      socket.to(roomId).emit("voice-user-left", {
        socketId: socket.id,
      });

      console.log(
        "👥 Remaining Users:",
        rooms[roomId].participants.length
      );

      // Delete room if empty
      if (rooms[roomId].participants.length === 0) {
        delete rooms[roomId];
        console.log("🗑 Room Deleted:", roomId);
      }
    }
  });

});

// ================= START SERVER =================

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
