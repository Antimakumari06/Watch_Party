import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";
 
function Home() {
  const navigate = useNavigate();
 
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
 
  const createRoom = () => {
    if (!username.trim()) {
      setError("Please enter your name to create a room.");
      return;
    }
    setError("");
 
    const newRoomId = uuid();
    navigate(`/room/${newRoomId}`, { state: { username: username.trim() } });
  };
 
  const joinRoom = () => {
    if (!username.trim() || !roomId.trim()) {
      setError("Please enter your name and a Room ID to join.");
      return;
    }
    setError("");
 
    navigate(`/room/${roomId.trim()}`, { state: { username: username.trim() } });
  };
 
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black flex items-center justify-center px-4 py-10">
      {/* ===== Background glow blobs (matches Room.tsx violet theme) ===== */}
      <div className="absolute w-[500px] h-[500px] bg-violet-700 rounded-full blur-[180px] opacity-20 -top-40 -left-32 pointer-events-none" />
      <div className="absolute w-[450px] h-[450px] bg-pink-500 rounded-full blur-[160px] opacity-15 bottom-0 right-0 pointer-events-none" />
      <div className="absolute w-[300px] h-[300px] bg-blue-600 rounded-full blur-[160px] opacity-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
 
      {/* ===== Main Card ===== */}
      <div className="relative z-10 w-full max-w-[440px] bg-[#1a1a24] border-2 border-violet-900/30 rounded-3xl shadow-2xl shadow-violet-950/50 p-8 sm:p-9">
        {/* Header */}
        <div className="text-center">
          <div className="text-6xl mb-3">🎬</div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Watch Party
          </h1>
          <p className="text-gray-400 mt-3 text-sm leading-relaxed">
            Watch YouTube videos together
            <br />
            in real-time with your friends.
          </p>
        </div>
 
        {/* Username */}
        <div className="mt-8">
          <label className="text-gray-400 text-xs font-medium uppercase tracking-wide">
            Username
          </label>
          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (error) setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && createRoom()}
            className="mt-2 w-full px-5 py-3.5 rounded-xl bg-[#0f0f16] border border-white/15 text-white placeholder-gray-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
          />
        </div>
 
        {/* Inline error */}
        {error && (
          <p className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            ⚠️ {error}
          </p>
        )}
 
        {/* Create Room Button */}
        <button
          onClick={createRoom}
          className="mt-6 w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold tracking-wide shadow-lg shadow-violet-900/40 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          🚀 Create Room
        </button>
 
        {/* Divider */}
        <div className="flex items-center my-7">
          <div className="flex-1 h-px bg-white/10" />
          <span className="mx-4 text-gray-500 text-xs font-medium tracking-widest">OR</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
 
        {/* Room ID */}
        <label className="text-gray-400 text-xs font-medium uppercase tracking-wide">
          Room ID
        </label>
        <input
          type="text"
          placeholder="Paste Room ID"
          value={roomId}
          onChange={(e) => {
            setRoomId(e.target.value);
            if (error) setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && joinRoom()}
          className="mt-2 w-full px-5 py-3.5 rounded-xl bg-[#0f0f16] border border-white/15 text-white placeholder-gray-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
        />
 
        <button
          onClick={joinRoom}
          className="mt-6 w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-wide shadow-lg shadow-emerald-900/40 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          🟢 Join Room
        </button>
 
        {/* Feature strip */}
        <div className="grid grid-cols-4 gap-2 mt-8 pt-6 border-t border-white/10">
          <FeatureIcon icon="👥" label="Friends" />
          <FeatureIcon icon="💬" label="Chat" />
          <FeatureIcon icon="⚡" label="Sync" />
          <FeatureIcon icon="🎥" label="HD" />
        </div>
      </div>
    </div>
  );
}
 
function FeatureIcon({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-2 rounded-xl transition hover:bg-white/5">
      <div className="text-xl">{icon}</div>
      <p className="text-[11px] text-gray-400 font-medium">{label}</p>
    </div>
  );
}
 
export default Home;