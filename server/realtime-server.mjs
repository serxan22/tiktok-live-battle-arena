import http from "node:http";
import { Server } from "socket.io";

const port = Number(process.env.PORT || process.env.REALTIME_PORT || 4000);
const configuredOrigin = process.env.CORS_ORIGIN || process.env.NEXT_PUBLIC_APP_URL || "*";
const corsOrigin = configuredOrigin.includes(",")
  ? configuredOrigin.split(",").map((origin) => origin.trim()).filter(Boolean)
  : configuredOrigin;

const httpServer = http.createServer((request, response) => {
  if (request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true, service: "tiktok-live-battle-arena-realtime" }));
    return;
  }

  response.writeHead(200, { "content-type": "text/plain" });
  response.end("TikTok LIVE Battle Arena realtime relay is running.\n");
});

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

function normalizeJoinPayload(payload, socketId) {
  if (typeof payload === "string") {
    return {
      roomId: payload,
      role: "observer",
      clientId: socketId,
    };
  }

  return {
    roomId: String(payload?.roomId || "main-live-room"),
    role: payload?.role === "display" || payload?.role === "controller" ? payload.role : "observer",
    clientId: String(payload?.clientId || socketId),
  };
}

function roomPresence(roomId) {
  const sockets = io.sockets.adapter.rooms.get(roomId) ?? new Set();
  let displays = 0;
  let controllers = 0;
  let observers = 0;

  for (const socketId of sockets) {
    const socket = io.sockets.sockets.get(socketId);
    const role = socket?.data.role;

    if (role === "display") {
      displays += 1;
    } else if (role === "controller") {
      controllers += 1;
    } else {
      observers += 1;
    }
  }

  return {
    roomId,
    total: sockets.size,
    displays,
    controllers,
    observers,
  };
}

function emitPresence(roomId) {
  io.to(roomId).emit("room:presence", roomPresence(roomId));
}

io.on("connection", (socket) => {
  socket.on("room:join", (payload) => {
    const previousRoom = socket.data.roomId;
    if (previousRoom) {
      socket.leave(previousRoom);
      emitPresence(previousRoom);
    }

    const join = normalizeJoinPayload(payload, socket.id);
    socket.data.roomId = join.roomId;
    socket.data.role = join.role;
    socket.data.clientId = join.clientId;
    socket.join(join.roomId);
    emitPresence(join.roomId);
  });

  // The relay stays stateless: the live display owns game simulation and sends
  // snapshots, while controllers send commands into the same room.
  socket.on("game:command", (message) => {
    if (!message?.roomId || !message?.command) {
      return;
    }

    socket.to(message.roomId).emit("game:command", {
      ...message,
      senderId: message.senderId || socket.data.clientId || socket.id,
      sentAt: message.sentAt || Date.now(),
    });
  });

  socket.on("game:snapshot", (message) => {
    if (!message?.roomId || !message?.snapshot) {
      return;
    }

    socket.to(message.roomId).emit("game:snapshot", {
      ...message,
      senderId: message.senderId || socket.data.clientId || socket.id,
      sentAt: message.sentAt || Date.now(),
    });
  });

  socket.on("disconnect", () => {
    if (socket.data.roomId) {
      emitPresence(socket.data.roomId);
    }
  });
});

httpServer.listen(port, () => {
  console.log(`Realtime relay listening on :${port}`);
});
