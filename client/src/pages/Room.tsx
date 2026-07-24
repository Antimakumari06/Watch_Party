import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import YouTube from "react-youtube";
import { socket } from "../services/socket";
 
interface Participant {
  id: string;
  username: string;
  role: string;
}
 
interface ChatMessage {
  username: string;
  message: string;
  time: string;
}
 
function Room() {
  const { roomId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
 
  const username = location.state?.username || "Guest";
 
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showParticipants, setShowParticipants] = useState(false);
 
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 
  const [videoId, setVideoId] = useState("dQw4w9WgXcQ");
  const [videoUrl, setVideoUrl] = useState("");
 
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [remoteStreams] = useState<MediaStream[]>([]);
 
  const [videoMuted, setVideoMuted] = useState(false);
  const [volume, setVolume] = useState(100);
 
  const hasJoinedRef = useRef(false);
  const playerRef = useRef<any>(null);
  const ignoreNextEvent = useRef(false);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
 
  const onReady = (event: any) => {
    playerRef.current = event.target;
  };
 
  const startVoiceChat = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setLocalStream(stream);
      setMicOn(true);
 
      peerConnection.current = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
 
      stream.getTracks().forEach((track) => {
        peerConnection.current?.addTrack(track, stream);
      });
 
      peerConnection.current.ontrack = (event) => {
        const remoteStream = event.streams[0];
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
        }
      };
 
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("voice-candidate", { roomId, candidate: event.candidate });
        }
      };
 
      socket.emit("voice-join", { roomId });
    } catch (err: any) {
      console.error(err);
      if (err.name === "NotAllowedError") {
        alert("❌ Mic access blocked. Address bar ke 🔒 icon se microphone allow karo, phir reload karo.");
      } else if (err.name === "NotFoundError") {
        alert("❌ Koi microphone nahi mila. Device check karo.");
      } else {
        alert("❌ Microphone error: " + err.message);
      }
    }
  };
 
  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
      setMicOn(true);
      setCameraOn(true);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error(err);
      alert("❌ Camera access denied: " + err.message);
    }
  };
 
  const toggleMic = () => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
    setMicOn((prev) => !prev);
  };
 
  const toggleCamera = () => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
    setCameraOn((prev) => !prev);
  };
 
  const leaveVoiceChat = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    setLocalStream(null);
    setMicOn(false);
    setCameraOn(false);
  };
 
  const leaveRoom = () => {
    leaveVoiceChat();
    socket.emit("leave-room", { roomId });
    navigate("/");
  };
 
  const toggleVideoMute = () => {
    const newMuted = !videoMuted;
    setVideoMuted(newMuted);
    if (playerRef.current) {
      newMuted ? playerRef.current.mute() : playerRef.current.unMute();
    }
    socket.emit("mute-toggle", { roomId, muted: newMuted });
  };
 
  const handleVolumeChange = (value: number) => {
    setVolume(value);
    if (playerRef.current) playerRef.current.setVolume(value);
    socket.emit("volume-change", { roomId, volume: value });
  };
 
  const handleTyping = (value: string) => {
    setMessage(value);
    socket.emit("typing", { roomId, username });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop-typing", { roomId, username });
    }, 1200);
  };
 
  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit("send-message", { roomId, username, message });
    socket.emit("stop-typing", { roomId, username });
    setMessage("");
  };
 
  // 🆕 ================= ROLE MANAGEMENT (Host only) =================
 
  const promoteToModerator = (userId: string) => {
    socket.emit("assign-role", { roomId, userId, role: "Moderator" });
  };
 
  const demoteToParticipant = (userId: string) => {
    socket.emit("assign-role", { roomId, userId, role: "Participant" });
  };
 
  const removeParticipant = (userId: string, targetUsername: string) => {
    if (!confirm(`${targetUsername} ko room se remove karna hai?`)) return;
    socket.emit("remove-participant", { roomId, userId });
  };
 
  useEffect(() => {
    if (!hasJoinedRef.current) {
      socket.emit("join-room", { roomId, username });
      hasJoinedRef.current = true;
    }
 
    const handleParticipantsUpdate = (data: { participants: Participant[] }) => {
      setParticipants(data.participants);
    };
 
    const handlePlay = (data: any) => {
      if (!playerRef.current) return;
      ignoreNextEvent.current = true;
      playerRef.current.seekTo(data.currentTime || 0, true);
      playerRef.current.playVideo();
    };
 
    const handlePause = (data: any) => {
      if (!playerRef.current) return;
      ignoreNextEvent.current = true;
      playerRef.current.seekTo(data.currentTime || 0, true);
      playerRef.current.pauseVideo();
    };
 
    const handleSeek = (data: any) => {
      if (!playerRef.current) return;
      ignoreNextEvent.current = true;
      playerRef.current.seekTo(data.currentTime || 0, true);
    };
 
    const handleVideoState = (state: any) => {
      if (!playerRef.current) return;
      playerRef.current.seekTo(state.currentTime || 0, true);
      state.isPlaying ? playerRef.current.playVideo() : playerRef.current.pauseVideo();
    };
 
    const handleReceiveMessage = (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);
    };
 
    const handleVideoChanged = (data: { videoId: string }) => {
      setVideoId(data.videoId);
    };
 
    const handleSyncMute = ({ muted }: { muted: boolean }) => {
      setVideoMuted(muted);
      if (playerRef.current) {
        muted ? playerRef.current.mute() : playerRef.current.unMute();
      }
    };
 
    const handleSyncVolume = ({ volume }: { volume: number }) => {
      setVolume(volume);
      if (playerRef.current) playerRef.current.setVolume(volume);
    };
 
    const handleUserTyping = ({ username: who }: { username: string }) => {
      setTypingUser(who);
    };
    const handleUserStopTyping = () => {
      setTypingUser(null);
    };
 
    // 🆕 role assigned -> refresh participants list
    const handleRoleAssigned = (data: { participants: Participant[] }) => {
      setParticipants(data.participants);
    };
 
    // 🆕 someone was removed -> refresh participants list
    const handleParticipantRemoved = (data: { participants: Participant[] }) => {
      setParticipants(data.participants);
    };
 
    // 🆕 I was removed by the host -> kick myself out
    const handleRemovedFromRoom = () => {
      alert("🚫 Host ne tumhe is room se remove kar diya hai.");
      leaveVoiceChat();
      navigate("/");
    };
 
    socket.on("voice-user-joined", async () => {
      if (!peerConnection.current) return;
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socket.emit("voice-offer", { roomId, offer });
    });
 
    socket.on("voice-offer", async ({ offer }) => {
      if (!peerConnection.current) return;
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit("voice-answer", { roomId, answer });
    });
 
    socket.on("voice-answer", async ({ answer }) => {
      if (!peerConnection.current) return;
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    });
 
    socket.on("voice-candidate", async ({ candidate }) => {
      if (!peerConnection.current) return;
      try {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.log(err);
      }
    });
 
    socket.on("voice-user-left", () => {
      console.log("🎤 User Left Voice Chat");
    });
 
    socket.on("participants-update", handleParticipantsUpdate);
    socket.on("play", handlePlay);
    socket.on("pause", handlePause);
    socket.on("seek", handleSeek);
    socket.on("video-state", handleVideoState);
    socket.on("receive-message", handleReceiveMessage);
    socket.on("video-changed", handleVideoChanged);
    socket.on("sync-mute", handleSyncMute);
    socket.on("sync-volume", handleSyncVolume);
    socket.on("user-typing", handleUserTyping);
    socket.on("user-stop-typing", handleUserStopTyping);
    socket.on("role-assigned", handleRoleAssigned);
    socket.on("participant-removed", handleParticipantRemoved);
    socket.on("removed-from-room", handleRemovedFromRoom);
 
    return () => {
      socket.off("participants-update", handleParticipantsUpdate);
      socket.off("play", handlePlay);
      socket.off("pause", handlePause);
      socket.off("seek", handleSeek);
      socket.off("video-state", handleVideoState);
      socket.off("receive-message", handleReceiveMessage);
      socket.off("video-changed", handleVideoChanged);
      socket.off("sync-mute", handleSyncMute);
      socket.off("sync-volume", handleSyncVolume);
      socket.off("user-typing", handleUserTyping);
      socket.off("user-stop-typing", handleUserStopTyping);
      socket.off("role-assigned", handleRoleAssigned);
      socket.off("participant-removed", handleParticipantRemoved);
      socket.off("removed-from-room", handleRemovedFromRoom);
 
      socket.off("voice-user-joined");
      socket.off("voice-offer");
      socket.off("voice-answer");
      socket.off("voice-candidate");
      socket.off("voice-user-left");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, username]);
 
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);
 
  const me = participants.find((user) => user.username === username);
  const isHost = me?.role === "Host";
  const isModerator = me?.role === "Moderator";
  const canControl = isHost || isModerator; // 🆕 Host aur Moderator dono control kar sakte hain
 
  const copyRoomLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("✅ Room Link Copied");
    } catch (err) {
      alert("❌ Failed to Copy Link");
    }
  };
 
  const handleChangeVideo = () => {
    if (!videoUrl.trim()) return;
 
    let id = "";
    if (videoUrl.includes("watch?v=")) {
      id = videoUrl.split("watch?v=")[1].split("&")[0];
    } else if (videoUrl.includes("youtu.be/")) {
      id = videoUrl.split("youtu.be/")[1].split("?")[0];
    } else {
      alert("❌ Invalid YouTube URL");
      return;
    }
 
    setVideoId(id);
    socket.emit("change-video", { roomId, videoId: id });
    setVideoUrl("");
  };
 
  return (
    <div className="h-screen w-screen flex flex-col bg-black text-gray-100 overflow-hidden">
      {/* ===== TOP NAVBAR ===== */}
      <header className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#1a1a24] to-[#151520] border-b-2 border-violet-900/40 shrink-0 shadow-lg z-10">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">🎬</span>
          <span className="font-bold text-lg tracking-tight">Watch Party</span>
          <span className="text-xs text-gray-400 ml-3 hidden sm:inline bg-white/10 px-2.5 py-1 rounded-md">
            Room #{roomId?.slice(0, 8)}
          </span>
        </div>
 
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-300 hidden md:inline">
            {isHost ? "👑" : isModerator ? "🛡️" : "👤"} <b>{username}</b>
          </span>
          <button
            onClick={copyRoomLink}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 transition px-3.5 py-2 rounded-lg text-sm font-medium shadow-md"
          >
            📋 <span className="hidden sm:inline">Copy Link</span>
          </button>
          <button
            onClick={leaveRoom}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 transition px-3.5 py-2 rounded-lg text-sm font-medium shadow-md"
          >
            🚪 <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </header>
 
      {/* ===== MAIN AREA ===== */}
      <div className="flex flex-1 min-h-0 flex-col lg:flex-row gap-6 p-6 overflow-hidden">
        {/* ===== LEFT CARD: Video + Controls ===== */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#1a1a24] rounded-3xl border-2 border-violet-900/30 shadow-2xl shadow-violet-950/50 p-5 overflow-y-auto">
          {/* 🆕 Change video ab Host + Moderator dono ke liye */}
          {canControl && (
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Paste YouTube URL..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleChangeVideo()}
                className="flex-1 bg-[#0f0f16] border border-white/15 rounded-lg px-4 py-2.5 text-sm placeholder:text-gray-500 focus:outline-none focus:border-violet-500"
              />
              <button
                onClick={handleChangeVideo}
                className="bg-orange-600 hover:bg-orange-500 transition px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap shadow-md"
              >
                🎬 Change Video
              </button>
            </div>
          )}
 
          <div className="w-full rounded-2xl overflow-hidden bg-black shadow-lg aspect-video border border-white/10">
            <YouTube
              videoId={videoId}
              onReady={onReady}
              onPlay={() => {
                if (ignoreNextEvent.current) {
                  ignoreNextEvent.current = false;
                  return;
                }
                // 🆕 Host ya Moderator dono broadcast kar sakte hain
                if (canControl && playerRef.current) {
                  socket.emit("play", { roomId, currentTime: playerRef.current.getCurrentTime() });
                }
              }}
              onPause={() => {
                if (ignoreNextEvent.current) {
                  ignoreNextEvent.current = false;
                  return;
                }
                if (canControl && playerRef.current) {
                  socket.emit("pause", { roomId, currentTime: playerRef.current.getCurrentTime() });
                }
              }}
              onStateChange={(event) => {
                if (!canControl) return;
                if (ignoreNextEvent.current) {
                  ignoreNextEvent.current = false;
                  return;
                }
                if (event.data === 1) {
                  socket.emit("seek", { roomId, currentTime: event.target.getCurrentTime() });
                }
              }}
              opts={{ width: "100%", height: "100%", playerVars: { autoplay: 0 } }}
              className="w-full h-full"
            />
          </div>
 
          {/* Volume row */}
          <div className="flex items-center gap-3 mt-4 bg-[#0f0f16] border border-white/15 rounded-xl px-4 py-3 w-fit">
            <button onClick={toggleVideoMute} className="text-lg">
              {videoMuted ? "🔇" : "🔊"}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-32 accent-violet-500"
            />
            <span className="text-xs text-gray-400 w-8">{volume}%</span>
          </div>
 
          {/* Bottom pill controls */}
          <div className="flex items-center flex-wrap justify-center gap-2 mt-4 bg-[#0f0f16] border border-white/15 rounded-full px-5 py-3 mx-auto shadow-md">
            <PillButton onClick={startVoiceChat} label="Voice Chat" icon="🎙️" color="blue" />
            <PillButton onClick={startVideoCall} label="Camera" icon="📷" color="orange" />
            <PillButton onClick={toggleMic} label={micOn ? "Mic ON" : "Mic OFF"} icon={micOn ? "🎤" : "🔇"} color={micOn ? "green" : "red"} />
            <PillButton onClick={toggleCamera} label={cameraOn ? "Camera ON" : "Camera OFF"} icon={cameraOn ? "📹" : "📷"} color={cameraOn ? "green" : "red"} />
            <PillButton onClick={leaveVoiceChat} label="Leave Call" icon="🔌" color="red" />
          </div>
 
          <audio ref={remoteAudioRef} autoPlay />
 
          {cameraOn && (
            <div className="mt-4 flex justify-center">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-64 rounded-xl border-2 border-violet-500 shadow-lg"
              />
            </div>
          )}
 
          {remoteStreams.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-2">📹 Connected Users</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {remoteStreams.map((stream, index) => (
                  <video
                    key={index}
                    autoPlay
                    playsInline
                    ref={(video) => {
                      if (video) video.srcObject = stream;
                    }}
                    className="w-56 rounded-xl border-2 border-emerald-500"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
 
        {/* ===== RIGHT CARD: Chat / Participants ===== */}
        <div className="w-full lg:w-[380px] flex flex-col bg-[#1a1a24] rounded-3xl border-2 border-violet-900/30 shadow-2xl shadow-violet-950/50 shrink-0 min-h-0 overflow-hidden">
          <div className="flex border-b border-white/15 shrink-0">
            <button
              onClick={() => setShowParticipants(false)}
              className={`flex-1 py-3 text-sm font-medium transition ${
                !showParticipants ? "text-white border-b-2 border-violet-500 bg-white/10" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              💬 Chat
            </button>
            <button
              onClick={() => setShowParticipants(true)}
              className={`flex-1 py-3 text-sm font-medium transition ${
                showParticipants ? "text-white border-b-2 border-violet-500 bg-white/10" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              👥 Participants ({participants.length})
            </button>
          </div>
 
          {showParticipants ? (
            // 🆕 Participants list with Host-only role management controls
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {participants.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-2 bg-[#0f0f16] border border-white/10 rounded-lg px-3 py-2.5 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span>{user.role === "Host" ? "👑" : user.role === "Moderator" ? "🛡️" : "👤"}</span>
                    <span className="font-medium">{user.username}</span>
                    <span className="text-xs text-gray-500 ml-auto">{user.role}</span>
                  </div>
 
                  {/* 🆕 Host ko har participant/moderator (khud ko chhodkar) ke neeche action buttons dikhte hain */}
                  {isHost && user.role !== "Host" && (
                    <div className="flex gap-2 pt-1 border-t border-white/5">
                      {user.role === "Participant" ? (
                        <button
                          onClick={() => promoteToModerator(user.id)}
                          className="flex-1 bg-blue-600 hover:bg-blue-500 transition text-xs px-2 py-1.5 rounded-md font-medium"
                        >
                          🛡️ Make Moderator
                        </button>
                      ) : (
                        <button
                          onClick={() => demoteToParticipant(user.id)}
                          className="flex-1 bg-gray-600 hover:bg-gray-500 transition text-xs px-2 py-1.5 rounded-md font-medium"
                        >
                          👤 Remove Moderator
                        </button>
                      )}
                      <button
                        onClick={() => removeParticipant(user.id, user.username)}
                        className="flex-1 bg-red-600 hover:bg-red-500 transition text-xs px-2 py-1.5 rounded-md font-medium"
                      >
                        🚫 Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                {messages.length === 0 ? (
                  <p className="text-center text-gray-600 text-sm mt-6">No messages yet.</p>
                ) : (
                  messages.map((msg, index) => {
                    const isMe = msg.username === username;
                    return (
                      <div key={index} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <span className="text-[11px] text-gray-500 mb-0.5 px-1">
                          {msg.username} · {msg.time}
                        </span>
                        <div
                          className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm break-words ${
                            isMe ? "bg-violet-600 text-white rounded-br-sm" : "bg-[#0f0f16] border border-white/10 text-gray-200 rounded-bl-sm"
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>
 
              <div className="px-3 h-5 text-xs text-gray-500 shrink-0">
                {typingUser && typingUser !== username ? `${typingUser} is typing...` : ""}
              </div>
 
              <div className="flex gap-2 p-3 border-t border-white/15 shrink-0">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  className="flex-1 bg-[#0f0f16] border border-white/15 rounded-full px-4 py-2.5 text-sm placeholder:text-gray-500 focus:outline-none focus:border-violet-500"
                />
                <button
                  onClick={sendMessage}
                  className="bg-violet-600 hover:bg-violet-500 transition w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-md"
                >
                  ➤
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
 
function PillButton({
  onClick,
  label,
  icon,
  color,
}: {
  onClick: () => void;
  label: string;
  icon: string;
  color: "blue" | "orange" | "green" | "red";
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-600 hover:bg-blue-500",
    orange: "bg-orange-600 hover:bg-orange-500",
    green: "bg-emerald-600 hover:bg-emerald-500",
    red: "bg-red-600 hover:bg-red-500",
  };
 
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 ${colors[color]} transition px-3.5 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap shadow-md`}
    >
      <span>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
 
export default Room;