import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;









export function getSocketServer(server?: NetServer): SocketIOServer {
  if (io) return io;

  if (!server) {
    console.warn("[Socket.io] Warning: getSocketServer called without an HTTP server and no active instance exists. Creating mock instance.");
    io = new SocketIOServer();
    return io;
  }

  io = new SocketIOServer(server, {
    path: "/api/socket/io",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket.io] Client connected: ${socket.id}`);

    
    socket.on("campaign:join", (campaignId: string) => {
      const roomName = `campaign:${campaignId}`;
      socket.join(roomName);
      console.log(`[Socket.io] Client ${socket.id} joined campaign room: ${roomName}`);
    });

    socket.on("campaign:leave", (campaignId: string) => {
      const roomName = `campaign:${campaignId}`;
      socket.leave(roomName);
      console.log(`[Socket.io] Client ${socket.id} left campaign room: ${roomName}`);
    });

    
    socket.on("dashboard:join", () => {
      socket.join("dashboard");
      console.log(`[Socket.io] Client ${socket.id} joined dashboard room`);
    });

    socket.on("disconnect", () => {
      console.log(`[Socket.io] Client disconnected: ${socket.id}`);
    });
  });

  console.log("[Socket.io] Socket.io gateway initialized successfully.");
  return io;
}








export function broadcastCampaignUpdate(campaignId: string, event: "stats_updated" | "message_updated", data: any) {
  const ioServer = getSocketServer();
  const roomName = `campaign:${campaignId}`;
  const eventName = `campaign:${event}`;
  console.log(`[Socket.io] Broadcasting to room "${roomName}": ${eventName}`);
  ioServer.to(roomName).emit(eventName, data);
}




export function broadcastDashboardUpdate(data: any) {
  const ioServer = getSocketServer();
  console.log(`[Socket.io] Broadcasting to room "dashboard": dashboard:stats_updated`);
  ioServer.to("dashboard").emit("dashboard:stats_updated", data);
}
