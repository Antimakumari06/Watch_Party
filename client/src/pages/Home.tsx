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
 
  // Marquee bulbs along the top edge of the ticket
  const bulbs = Array.from({ length: 16 });
 
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0c0a10] flex items-center justify-center px-4 py-12">
      {/* ===== Theater atmosphere ===== */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-[600px] h-[600px] bg-[#6e1423] rounded-full blur-[200px] opacity-30 -top-56 left-1/2 -translate-x-1/2" />
        <div className="absolute w-[500px] h-[500px] bg-[#e3b23c] rounded-full blur-[220px] opacity-[0.07] bottom-[-200px] right-[-120px]" />
        {/* faint film-grain vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]" />
      </div>
 
      {/* ===== The Ticket ===== */}
      <div className="relative z-10 w-full max-w-[460px]">
        {/* Marquee bulb strip */}
        <div className="flex justify-between px-6 mb-[-9px] relative z-20">
          {bulbs.map((_, i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-[#f4d488] shadow-[0_0_8px_2px_rgba(227,178,60,0.8)] animate-pulse"
              style={{ animationDelay: `${(i % 4) * 0.2}s`, animationDuration: "1.6s" }}
            />
          ))}
        </div>
 
        <div className="bg-[#f6ecd9] rounded-[28px] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] pt-9 pb-2 relative overflow-visible border border-black/5">
          {/* Eyebrow ticket header */}
          <div className="flex items-center justify-between px-8 text-[#8a6b3d]">
            <span className="text-[10px] font-bold tracking-[0.25em] uppercase">Feature Presentation</span>
            <span className="text-[10px] font-bold tracking-[0.25em] uppercase">No. 001</span>
          </div>
 
          {/* Header */}
          <div className="text-center px-8 mt-4">
            <div className="text-6xl mb-2">🎬</div>
            <h1 className="text-4xl sm:text-[2.75rem] font-black uppercase tracking-tight text-[#3a1c14] leading-none">
              Watch Party
            </h1>
            <div className="flex items-center justify-center gap-3 mt-3">
              <span className="h-px w-8 bg-[#c79a4b]" />
              <p className="text-[#8a6b3d] text-xs font-semibold uppercase tracking-[0.2em]">
                Now Streaming, Together
              </p>
              <span className="h-px w-8 bg-[#c79a4b]" />
            </div>
          </div>
 
          {/* Form section */}
          <div className="px-8 mt-8">
            <label className="text-[#8a6b3d] text-[11px] font-bold uppercase tracking-[0.15em]">
              Your Name
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
              className="mt-2 w-full px-5 py-3.5 rounded-xl bg-white/60 border-2 border-[#3a1c14]/10 text-[#3a1c14] placeholder-[#a8896a] outline-none transition focus:border-[#8a1f2e] focus:bg-white"
            />
 
            {error && (
              <p className="mt-3 text-sm text-[#8a1f2e] bg-[#8a1f2e]/10 border border-[#8a1f2e]/30 rounded-lg px-3 py-2">
                ⚠ {error}
              </p>
            )}
 
            <button
              onClick={createRoom}
              className="mt-5 w-full py-3.5 rounded-xl bg-[#8a1f2e] hover:bg-[#7a1a27] text-[#f6ecd9] font-bold uppercase tracking-widest text-sm shadow-lg shadow-[#8a1f2e]/30 transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              🎟 Create Room
            </button>
 
            <div className="flex items-center my-6">
              <div className="flex-1 h-px bg-[#3a1c14]/15" />
              <span className="mx-4 text-[#a8896a] text-[11px] font-bold tracking-[0.25em]">OR</span>
              <div className="flex-1 h-px bg-[#3a1c14]/15" />
            </div>
 
            <label className="text-[#8a6b3d] text-[11px] font-bold uppercase tracking-[0.15em]">
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
              className="mt-2 w-full px-5 py-3.5 rounded-xl bg-white/60 border-2 border-[#3a1c14]/10 text-[#3a1c14] placeholder-[#a8896a] outline-none transition focus:border-[#8a1f2e] focus:bg-white"
            />
 
            <button
              onClick={joinRoom}
              className="mt-5 w-full py-3.5 rounded-xl border-2 border-[#3a1c14] text-[#3a1c14] hover:bg-[#3a1c14] hover:text-[#f6ecd9] font-bold uppercase tracking-widest text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Join Room
            </button>
          </div>
 
          {/* ===== Perforation / tear line ===== */}
          <div className="relative mt-8">
            {/* punch notches */}
            <div className="absolute -left-[14px] top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#0c0a10]" />
            <div className="absolute -right-[14px] top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-[#0c0a10]" />
            <div className="border-t-2 border-dashed border-[#3a1c14]/25 mx-6" />
          </div>
 
          {/* ===== Stub section ===== */}
          <div className="px-8 pt-5 pb-6">
            <div className="grid grid-cols-4 gap-2">
              <FeatureStub icon="👥" label="Friends" />
              <FeatureStub icon="💬" label="Chat" />
              <FeatureStub icon="⚡" label="Sync" />
              <FeatureStub icon="🎥" label="HD" />
            </div>
            <p className="text-center text-[#a8896a] text-[10px] font-semibold uppercase tracking-[0.2em] mt-5">
              Admit Unlimited Friends · Valid Anywhere
            </p>
          </div>
        </div>
 
        {/* subtle drop shadow ticket edge */}
        <div className="h-3 mx-3 bg-black/20 blur-md rounded-full mt-[-4px]" />
      </div>
    </div>
  );
}
 
function FeatureStub({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-2 rounded-xl transition hover:bg-black/5">
      <div className="text-xl">{icon}</div>
      <p className="text-[10px] text-[#8a6b3d] font-bold uppercase tracking-wide">{label}</p>
    </div>
  );
}
 
export default Home;