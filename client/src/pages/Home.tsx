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
    <div className="relative min-h-screen w-full bg-[#0a0a12] flex flex-col overflow-x-hidden">
      {/* ===== Background glow ===== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[600px] h-[600px] bg-violet-700 rounded-full blur-[200px] opacity-25 -top-52 -left-40" />
        <div className="absolute w-[500px] h-[500px] bg-pink-600 rounded-full blur-[200px] opacity-20 top-1/4 -right-40" />
        <div className="absolute w-[500px] h-[300px] bg-blue-600 rounded-full blur-[180px] opacity-10 bottom-0 left-1/3" />
      </div>
 
      {/* ===== Section 1: Navbar ===== */}
      <nav className="relative z-20 w-full flex justify-center px-6 sm:px-10 py-5 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="w-full max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center text-lg shadow-lg shadow-violet-900/40 shrink-0">
              🎬
            </div>
            <div>
              <p className="text-white font-bold leading-tight">Watch Party</p>
              <p className="text-gray-500 text-[11px] leading-tight">Watch Together, Chat Together</p>
            </div>
          </div>
 
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-300 font-medium">
            <a href="#" className="text-white relative pb-1 after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-gradient-to-r after:from-violet-500 after:to-pink-500">
              Home
            </a>
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#how" className="hover:text-white transition">How It Works</a>
            <a href="#" className="hover:text-white transition">FAQs</a>
            <a href="#" className="hover:text-white transition">Contact</a>
          </div>
 
          <button
            onClick={createRoom}
            className="hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-xl border border-violet-500/50 text-white text-sm font-semibold hover:bg-violet-600/20 transition shrink-0"
          >
            🚀 Get Started
          </button>
        </div>
      </nav>
 
      {/* ===== Section 2: Hero ===== */}
      <div className="relative z-10 flex-1 w-full flex justify-center px-6 sm:px-10 py-16">
        <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-14 items-center">
          {/* Left column */}
          <div className="w-full lg:flex-1 min-w-0">
            <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-violet-300 text-xs font-semibold mb-6">
              ✨ The Ultimate Watch Party Experience
            </span>
 
            <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-[1.05] tracking-tight">
              Watch YouTube
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                Together.
              </span>
            </h1>
 
            <p className="text-gray-400 mt-6 text-lg leading-relaxed max-w-md">
              Create your room, invite friends, and enjoy synchronized YouTube videos in real-time with live chat & voice.
            </p>
 
            {/* mini feature row */}
            <div className="flex flex-wrap gap-6 mt-8">
              <MiniFeature icon="👥" color="bg-violet-500/20 text-violet-300" title="Friends" subtitle="Invite Unlimited" />
              <MiniFeature icon="💬" color="bg-pink-500/20 text-pink-300" title="Live Chat" subtitle="Chat Together" />
              <MiniFeature icon="⚡" color="bg-emerald-500/20 text-emerald-300" title="Real-time Sync" subtitle="Perfect Sync" />
            </div>
 
            {/* stats */}
            <div id="features" className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-16 p-6 border border-white/10 rounded-2xl bg-white/[0.02]">
              <Stat value="10K+" label="Active Users" color="text-violet-400" />
              <Stat value="5K+" label="Rooms Created" color="text-pink-400" />
              <Stat value="99.9%" label="Sync Accuracy" color="text-emerald-400" />
              <Stat value="100%" label="Secure Rooms" color="text-blue-400" />
            </div>
          </div>
 
          {/* Right column - form card, visually separated from hero text via its own border/bg */}
          <div id="how" className="w-full lg:w-[440px] shrink-0 min-h-[700px] flex flex-col bg-[#13111c] border border-violet-500/40 rounded-3xl shadow-[0_0_60px_-10px_rgba(168,85,247,0.35)] p-10 sm:p-12">
            <div className="text-center">
              <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-500 flex items-center justify-center text-4xl shadow-lg shadow-violet-900/40 mb-5">
                🎬
              </div>
              <h2 className="text-2xl font-bold text-white">Start Your Watch Party</h2>
              <p className="text-gray-400 text-sm mt-2">Create a new room or join an existing one</p>
            </div>
 
            <div className="mt-10 flex-1 flex flex-col">
              <label className="text-gray-400 text-xs font-medium uppercase tracking-wide">Username</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && createRoom()}
                className="mt-2 w-full px-5 py-4 rounded-xl bg-[#0f0f16] border border-white/15 text-white placeholder-gray-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
              />
 
              {error && (
                <p className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  ⚠️ {error}
                </p>
              )}
 
              <button
                onClick={createRoom}
                className="mt-6 w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-bold tracking-wide shadow-lg shadow-violet-900/40 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                🚀 Create New Room
              </button>
 
              <div className="flex items-center my-8">
                <div className="flex-1 h-px bg-white/10" />
                <span className="mx-4 text-gray-500 text-xs font-medium tracking-widest">OR</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>
 
              <label className="text-gray-400 text-xs font-medium uppercase tracking-wide">Room ID</label>
              <input
                type="text"
                placeholder="Paste Room ID"
                value={roomId}
                onChange={(e) => {
                  setRoomId(e.target.value);
                  if (error) setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                className="mt-2 w-full px-5 py-4 rounded-xl bg-[#0f0f16] border border-white/15 text-white placeholder-gray-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/30"
              />
 
              <button
                onClick={joinRoom}
                className="mt-6 w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-wide shadow-lg shadow-emerald-900/40 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                🟢 Join Room
              </button>
 
              <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-auto pt-8 border-t border-white/10">
                <Tag icon="💬" label="Live Chat" />
                <Tag icon="🎥" label="HD Quality" />
                <Tag icon="🎙" label="Voice Chat" />
                <Tag icon="🔒" label="Secure" />
              </div>
            </div>
          </div>
        </div>
      </div>
 
      {/* ===== Section 3: Footer ===== */}
      <footer className="relative z-10 w-full flex justify-center border-t border-white/10 bg-black/20 backdrop-blur-sm px-6 sm:px-10 py-6">
        <div className="w-full max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-500 text-sm">
          <p>
            Made with <span className="text-pink-500">♥</span> by Watch Party Team
            <span className="mx-2">·</span>© 2026 Watch Party. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-gray-400">
            <a href="#" className="hover:text-white transition">Discord</a>
            <a href="#" className="hover:text-white transition">Twitter</a>
            <a href="#" className="hover:text-white transition">GitHub</a>
            <a href="#" className="hover:text-white transition">YouTube</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
 
function MiniFeature({ icon, color, title, subtitle }: { icon: string; color: string; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${color}`}>{icon}</div>
      <div>
        <p className="text-white text-sm font-semibold leading-tight">{title}</p>
        <p className="text-gray-500 text-xs leading-tight">{subtitle}</p>
      </div>
    </div>
  );
}
 
function Stat({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div>
      <p className={`text-2xl sm:text-3xl font-extrabold ${color}`}>{value}</p>
      <p className="text-gray-500 text-xs font-medium mt-1">{label}</p>
    </div>
  );
}
 
function Tag({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
      <span>{icon}</span>
      {label}
    </span>
  );
}
 
export default Home;