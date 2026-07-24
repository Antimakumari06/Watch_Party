import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";

function Home() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");

  const createRoom = () => {
    if (!username.trim()) {
      alert("Please enter username");
      return;
    }

    const newRoomId = uuid();

    navigate(`/room/${newRoomId}`, {
      state: { username },
    });
  };

  const joinRoom = () => {
    if (!username.trim() || !roomId.trim()) {
      alert("Please fill all fields");
      return;
    }

    navigate(`/room/${roomId}`, {
      state: { username },
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#0B1120] via-[#1A1B3A] to-black flex items-center justify-center">

      {/* Background Glow */}
      <div className="absolute w-[500px] h-[500px] bg-purple-600 rounded-full blur-[180px] opacity-20 -top-40 -left-32"></div>

      <div className="absolute w-[450px] h-[450px] bg-pink-500 rounded-full blur-[180px] opacity-20 bottom-0 right-0"></div>

      {/* Card */}
      <div className="relative z-10 w-[420px] bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8">

        <div className="text-center">

          <div className="text-6xl mb-4">
            🎬
          </div>

          <h1 className="text-4xl font-bold text-white">
            Watch Party
          </h1>

          <p className="text-gray-300 mt-3">
            Watch YouTube videos together
            <br />
            in real-time with your friends.
          </p>

        </div>

        {/* Username */}

        <div className="mt-8">

          <label className="text-gray-300 text-sm">
            Username
          </label>

          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-2 w-full px-5 py-4 rounded-xl bg-black/30 border border-purple-500 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-500"
          />

        </div>

        {/* Create Button */}

        <button
          onClick={createRoom}
          className="mt-6 w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold hover:scale-105 duration-300 shadow-xl"
        >
          🚀 Create Room
        </button>

        {/* Divider */}

        <div className="flex items-center my-7">

          <div className="flex-1 h-px bg-gray-600"></div>

          <span className="mx-4 text-gray-400">
            OR
          </span>

          <div className="flex-1 h-px bg-gray-600"></div>

        </div>

        {/* Room ID */}

        <label className="text-gray-300 text-sm">
          Room ID
        </label>

        <input
          type="text"
          placeholder="Paste Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="mt-2 w-full px-5 py-4 rounded-xl bg-black/30 border border-purple-500 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-purple-500"
        />

        <button
          onClick={joinRoom}
          className="mt-6 w-full py-4 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold duration-300 shadow-xl"
        >
          🟢 Join Room
        </button>

        {/* Features */}

        <div className="grid grid-cols-4 gap-4 mt-8 text-center">

          <div>
            <div className="text-2xl">👥</div>
            <p className="text-xs text-gray-300 mt-2">
              Friends
            </p>
          </div>

          <div>
            <div className="text-2xl">💬</div>
            <p className="text-xs text-gray-300 mt-2">
              Chat
            </p>
          </div>

          <div>
            <div className="text-2xl">⚡</div>
            <p className="text-xs text-gray-300 mt-2">
              Sync
            </p>
          </div>

          <div>
            <div className="text-2xl">🎥</div>
            <p className="text-xs text-gray-300 mt-2">
              HD
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}

export default Home;