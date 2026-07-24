import { io } from "socket.io-client";

export const socket = io("https://watch-party-0pma.onrender.com", {
  transports: ["websocket"],
  autoConnect: true,
});