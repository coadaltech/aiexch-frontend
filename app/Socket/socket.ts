// lib/socket.ts
import { io } from "socket.io-client";

const socket = io("http://localhost:3001", {
  autoConnect: false, // We'll connect manually in component
  reconnection: true,
  reconnectionDelay: 1000,
});

export default socket;
