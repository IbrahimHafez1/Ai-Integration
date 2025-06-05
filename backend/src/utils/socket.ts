import { Server as IOServer } from "socket.io";
import http from "http";

let io: IOServer;

/**
 * Call this once from server.ts, passing your HTTP server object.
 */
export function initSocket(server: http.Server) {
  io = new IOServer(server, {
    cors: {
      origin: ["http://localhost:3000"], // adjust to your frontend origin(s)
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Optional: Log when a client connects/disconnects
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Expect the client to emit 'joinRoom' with their userId,
    // so we can .join(userId) and target broadcasts by room.
    socket.on("joinRoom", (userId: string) => {
      socket.join(userId);
      console.log(`Socket ${socket.id} joined room ${userId}`);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * After initSocket has run, getIO() returns the Server instance.
 * Throw if not yet initialized.
 */
export function getIO(): IOServer {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initSocket(server) first.");
  }
  return io;
}
