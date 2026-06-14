import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";









export function useCampaignSocket(
  campaignId: string,
  onStatsUpdate?: (stats: any) => void,
  onMessageUpdate?: (message: any) => void
) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!campaignId) return;

    setConnectionStatus("connecting");
    const socketUrl = typeof window !== "undefined" ? window.location.origin : "";

    
    const socket = io(socketUrl, {
      path: "/api/socket/io",
      addTrailingSlash: false,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(`[Socket] Connected to Socket.io server. Joining campaign: ${campaignId}`);
      setIsConnected(true);
      setConnectionStatus("connected");
      
      socket.emit("campaign:join", campaignId);
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket] Disconnected from Socket.io server: ${reason}`);
      setIsConnected(false);
      setConnectionStatus("disconnected");
    });

    socket.on("connect_error", (err) => {
      console.warn("[Socket] Connection error:", err.message);
      setIsConnected(false);
      setConnectionStatus("disconnected");
    });

    
    socket.on("campaign:stats_updated", (data) => {
      console.log("[Socket] Stats updated event received:", data);
      if (onStatsUpdate) {
        onStatsUpdate(data);
      }
    });

    socket.on("campaign:message_updated", (data) => {
      console.log("[Socket] Message updated event received:", data);
      if (onMessageUpdate) {
        onMessageUpdate(data);
      }
    });

    return () => {
      console.log(`[Socket] Cleaning up socket connection for campaign: ${campaignId}`);
      socket.emit("campaign:leave", campaignId);
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("campaign:stats_updated");
      socket.off("campaign:message_updated");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [campaignId, onStatsUpdate, onMessageUpdate]);

  return {
    isConnected,
    connectionStatus,
    socket: socketRef.current
  };
}
