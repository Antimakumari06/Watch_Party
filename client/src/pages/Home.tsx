import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";
 
type Tab = "create" | "join";
 
function Home() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("create");
 
  const createRoom = () => {
    if (!username.trim()) {
      setError("Please enter your name to create a room.");
      return;
    }
    setError("");
    navigate(`/room/${uuid()}`, { state: { username: username.trim() } });
  };
 
  const joinRoom = () => {
    if (!username.trim() || !roomId.trim()) {
      setError("Please enter your name and a Room ID to join.");
      return;
    }
    setError("");
    navigate(`/room/${roomId.trim()}`, { state: { username: username.trim() } });
  };
 
  const input =
    "w-full h-12 px-4 rounded-xl bg-[#12101c] border border-[#2f2a47] text-white placeholder-[#7d7896] outline-none transition focus:border-[#ff5a4e] focus:ring-2 focus:ring-[#ff5a4e]/30";
 
  return (
    <div className="min-h-screen flex flex-col bg-[#12101c] text-[#f2eff9]">
      {/* Header */}
      <header className="border-b border-[#2f2a47]">
        <div className="mx-auto max-w-6xl h-[72px] px-5 sm:px-7 flex items-center justify-between gap-6">
          <a href="#" className="flex items-center gap-3 font-bold text-xl">
            <span className="w-9 h-9 rounded-[10px] bg-[#ff5a4e] grid place-items-center">
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-white">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            Watch Party
          </a>
 
          <nav className="hidden md:flex gap-8 text-[15px] font-medium text-[#a49fbb]">
            <a href="#" className="text-white border-b-2 border-[#ff5a4e] py-1.5">Home</a>
            <a href="#features" className="py-1.5 hover:text-white transition">Features</a>
            <a href="#how" className="py-1.5 hover:text-white transition">How it works</a>
            <a href="#faq" className="py-1.5 hover:text-white transition">FAQs</a>
            <a href="#contact" className="py-1.5 hover:text-white transition">Contact</a>
          </nav>
 
          <a
            href="#start"
            className="h-10 px-4 inline-flex items-center rounded-xl border border-[#2f2a47] text-sm font-semibold hover:bg-[#242038] transition"
          >
            Get started
          </a>
        </div>
      </header>
 
      {/* Hero */}
      <main className="flex-1 mx-auto w-full max-w-6xl px-5 sm:px-7 py-12 lg:py-20 grid lg:grid-cols-[1.1fr_480px] gap-12 lg:gap-[72px] items-center">
        <section>
          <h1 className="text-5xl sm:text-6xl font-bold leading-[1.05] tracking-tight max-w-[15ch]">
            Watch YouTube with friends, in sync.
          </h1>
          <p className="mt-6 text-lg text-[#a49fbb] max-w-[46ch]">
            Create a room, share the ID, and everyone sees the same video at the same second. Chat and talk while you watch.
          </p>
 
          <ul id="features" className="mt-10 grid gap-5 max-w-[46ch]">
            <Feature title="Synced playback" text="Play, pause and seek stay in step for everyone in the room.">
              <path d="M5 3l14 9-14 9z" />
            </Feature>
            <Feature title="Live chat" text="React to the video without leaving the page.">
              <path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z" />
            </Feature>
            <Feature title="Voice chat" text="Talk to your friends while the video plays.">
              <>
                <rect x="9" y="3" width="6" height="12" rx="3" />
                <path d="M5 11a7 7 0 0014 0M12 18v3" />
              </>
            </Feature>
          </ul>
        </section>
 
        {/* Form card */}
        <section id="start" className="bg-[#1b1829] border border-[#2f2a47] rounded-[20px] p-6 sm:p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)]">
          <h2 className="text-[26px] font-bold leading-tight">Start your watch party</h2>
          <p className="mt-1.5 text-[15px] text-[#a49fbb]">Enter your name, then create a room or join one.</p>
 
          <div role="tablist" className="grid grid-cols-2 bg-[#242038] rounded-xl p-1 my-6">
            {(["create", "join"] as Tab[]).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => { setTab(t); setError(""); }}
                className={`h-10 rounded-[9px] text-sm font-semibold transition ${
                  tab === t ? "bg-[#1b1829] text-white shadow" : "text-[#a49fbb] hover:text-white"
                }`}
              >
                {t === "create" ? "Create room" : "Join room"}
              </button>
            ))}
          </div>
 
          <div className="grid gap-2 mb-5">
            <label htmlFor="name" className="text-sm font-medium">Your name</label>
            <input
              id="name"
              type="text"
              placeholder="e.g. Rahul"
              value={username}
              onChange={(e) => { setUsername(e.target.value); if (error) setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && (tab === "create" ? createRoom() : joinRoom())}
              className={input}
            />
          </div>
 
          {tab === "join" && (
            <div className="grid gap-2 mb-5">
              <label htmlFor="rid" className="text-sm font-medium">Room ID</label>
              <input
                id="rid"
                type="text"
                placeholder="Paste the Room ID"
                value={roomId}
                onChange={(e) => { setRoomId(e.target.value); if (error) setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                className={input}
              />
            </div>
          )}
 
          {error && (
            <p role="alert" className="mb-5 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
 
          <button
            onClick={tab === "create" ? createRoom : joinRoom}
            className="w-full h-12 rounded-xl bg-[#ff5a4e] text-white font-semibold transition hover:brightness-110 active:brightness-95"
          >
            {tab === "create" ? "Create room" : "Join room"}
          </button>
          {tab === "create" && (
            <p className="mt-3 text-[13px] text-[#a49fbb]">You'll get a Room ID to share with friends.</p>
          )}
 
          <div className="mt-6 pt-5 border-t border-[#2f2a47] flex flex-wrap justify-between gap-3 text-[13px] text-[#a49fbb]">
            {["Private rooms", "Free to use", "No sign-up"].map((x) => (
              <span key={x} className="inline-flex items-center gap-1.5">
                <i className="w-1.5 h-1.5 rounded-full bg-[#3ddc97]" />
                {x}
              </span>
            ))}
          </div>
        </section>
      </main>
 
      {/* Footer */}
      <footer id="contact" className="border-t border-[#2f2a47] py-6 text-sm text-[#a49fbb]">
        <div className="mx-auto max-w-6xl px-5 sm:px-7 flex flex-col sm:flex-row justify-between gap-4">
          <span>© 2026 Watch Party. All rights reserved.</span>
          <div className="flex gap-6">
            {["Discord", "Twitter", "GitHub", "YouTube"].map((l) => (
              <a key={l} href="#" className="hover:text-white transition">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
 
function Feature({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4 items-start">
      <span className="shrink-0 w-10 h-10 rounded-[10px] bg-[#242038] grid place-items-center">
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#ff5a4e] stroke-2" strokeLinecap="round" strokeLinejoin="round">
          {children}
        </svg>
      </span>
      <div>
        <b className="block font-semibold">{title}</b>
        <span className="text-[15px] text-[#a49fbb]">{text}</span>
      </div>
    </li>
  );
}
 
export default Home;