/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  TikTok Live WebSocket Server                               ║
 * ║  IndoFinity-compatible backend for interactive TikTok games  ║
 * ║                                                              ║
 * ║  Connects to TikTok Live → Decodes events → Relays via       ║
 * ║  Socket.IO on port 9100 (same as IndoFinity)                 ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const { WebcastPushConnection } = require("tiktok-live-connector");
const ytSearch = require("yt-search");

// ═══════════════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════════════
const SOCKET_PORT = process.env.SOCKET_PORT || 9200;
const DASHBOARD_PORT = process.env.DASHBOARD_PORT || 3500;

// ═══════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════
let tiktokConnection = null;
let connectionState = {
  status: "disconnected", // disconnected | connecting | connected
  uniqueId: null,
  roomId: null,
  roomInfo: null,
  viewers: 0,
  likes: 0,
  connectedAt: null,
  error: null,
};

// Event counters for dashboard
let eventStats = {
  chat: 0,
  gift: 0,
  like: 0,
  member: 0,
  social: 0,
  follow: 0,
  share: 0,
  subscribe: 0,
  emote: 0,
  envelope: 0,
  questionNew: 0,
  linkMicBattle: 0,
  linkMicArmies: 0,
  liveIntro: 0,
  barrage: 0,
};

// Recent events log (last 100)
let recentEvents = [];
function logEvent(type, data) {
  const entry = {
    type,
    nickname: data?.nickname || data?.uniqueId || "—",
    profilePictureUrl: data?.profilePictureUrl || null,
    comment: data?.comment || null,
    giftName: data?.giftName || null,
    giftId: data?.giftId || null,
    diamondCount: data?.diamondCount || null,
    repeatCount: data?.repeatCount || null,
    likeCount: data?.likeCount || null,
    followRole: data?.followRole || null,
    displayType: data?.displayType || null,
    label: data?.label || null,
    timestamp: Date.now(),
  };
  recentEvents.unshift(entry);
  if (recentEvents.length > 100) recentEvents.length = 100;
  if (eventStats[type] !== undefined) eventStats[type]++;
}

// ═══════════════════════════════════════════════════════
//  SOCKET.IO SERVER (port 9100 - IndoFinity compatible)
// ═══════════════════════════════════════════════════════
const socketApp = express();
const socketHttpServer = http.createServer(socketApp);
const io = new Server(socketHttpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Send current state immediately
  if (connectionState.status === "connected") {
    socket.emit("tiktokConnected", {
      roomId: connectionState.roomId,
      roomInfo: connectionState.roomInfo,
    });
  }

  // IndoFinity-compatible: setUniqueId from client
  socket.on("setUniqueId", (uniqueId) => {
    console.log(`[Socket.IO] setUniqueId request: ${uniqueId}`);
    connectToTikTok(uniqueId);
  });

  // Connect command from dashboard
  socket.on("connect-tiktok", (uniqueId) => {
    console.log(`[Socket.IO] connect-tiktok request: ${uniqueId}`);
    connectToTikTok(uniqueId);
  });

  // Disconnect command
  socket.on("disconnect-tiktok", () => {
    disconnectFromTikTok();
  });

  // Get status
  socket.on("getStatus", () => {
    socket.emit("statusUpdate", getStatusPayload());
  });

  socket.on("disconnect", () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

socketHttpServer.listen(SOCKET_PORT, () => {
  console.log(`\n╔═══════════════════════════════════════════════════╗`);
  console.log(`║  🔌 Socket.IO Server listening on port ${SOCKET_PORT}      ║`);
  console.log(`╚═══════════════════════════════════════════════════╝\n`);
});

// ═══════════════════════════════════════════════════════
//  DASHBOARD SERVER (port 3500)
// ═══════════════════════════════════════════════════════
const dashApp = express();
dashApp.use(express.json());
dashApp.use(express.static(__dirname)); // Serve Wordle Game on root
dashApp.use("/dashboard", express.static(path.join(__dirname, "dashboard"))); // Serve dashboard on /dashboard

// API endpoints
dashApp.get("/api/status", (req, res) => {
  res.json(getStatusPayload());
});

dashApp.post("/api/connect", (req, res) => {
  const { uniqueId } = req.body;
  if (!uniqueId) return res.status(400).json({ error: "uniqueId required" });
  connectToTikTok(uniqueId);
  res.json({ status: "connecting", uniqueId });
});

dashApp.post("/api/disconnect", (req, res) => {
  disconnectFromTikTok();
  res.json({ status: "disconnected" });
});

dashApp.get("/api/events", (req, res) => {
  res.json(recentEvents);
});

dashApp.get("/api/stats", (req, res) => {
  res.json(eventStats);
});

dashApp.listen(DASHBOARD_PORT, () => {
  console.log(`╔═══════════════════════════════════════════════════╗`);
  console.log(`║  🖥️  Dashboard: http://localhost:${DASHBOARD_PORT}            ║`);
  console.log(`╚═══════════════════════════════════════════════════╝\n`);
});

// ═══════════════════════════════════════════════════════
//  HELPER
// ═══════════════════════════════════════════════════════
function getStatusPayload() {
  return {
    ...connectionState,
    eventStats,
    recentEventsCount: recentEvents.length,
    connectedClients: io.engine?.clientsCount || 0,
  };
}

// ═══════════════════════════════════════════════════════
//  TIKTOK CONNECTION
// ═══════════════════════════════════════════════════════
async function connectToTikTok(uniqueId) {
  if (!uniqueId) return;

  // Disconnect existing
  if (tiktokConnection) {
    try {
      tiktokConnection.disconnect();
    } catch (e) {}
    tiktokConnection = null;
  }

  // Reset state
  connectionState = {
    status: "connecting",
    uniqueId,
    roomId: null,
    roomInfo: null,
    viewers: 0,
    likes: 0,
    connectedAt: null,
    error: null,
  };
  io.emit("statusUpdate", getStatusPayload());

  console.log(`\n[TikTok] Connecting to @${uniqueId}...`);

  try {
    tiktokConnection = new WebcastPushConnection(uniqueId, {
      processInitialData: true,
      enableExtendedGiftInfo: true,
      enableWebsocketUpgrade: true,
      requestPollingIntervalMs: 2000,
      requestHeaders: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
    });

    const state = await tiktokConnection.connect();

    connectionState.status = "connected";
    connectionState.roomId = state.roomId;
    connectionState.connectedAt = Date.now();
    connectionState.roomInfo = {
      uniqueId,
      roomId: state.roomId,
      title: state.roomInfo?.title || "",
      description: state.roomInfo?.description || "",
      hostName: state.roomInfo?.host_name || uniqueId,
      viewerCount: state.roomInfo?.viewer_count || 0,
      likeCount: state.roomInfo?.like_count || 0,
    };

    console.log(`[TikTok] ✅ Connected! Room ID: ${state.roomId}`);

    // Emit to all Socket.IO clients
    io.emit("tiktokConnected", {
      roomId: connectionState.roomId,
      roomInfo: connectionState.roomInfo,
    });
    io.emit("statusUpdate", getStatusPayload());

    // ─── Register all event handlers ───
    registerTikTokEvents(tiktokConnection);
  } catch (err) {
    console.error(`[TikTok] ❌ Connection failed:`, err.message);
    connectionState.status = "disconnected";
    connectionState.error = err.message;
    io.emit("tiktokDisconnected", err.message);
    io.emit("statusUpdate", getStatusPayload());
  }
}

function disconnectFromTikTok() {
  if (tiktokConnection) {
    try {
      tiktokConnection.disconnect();
    } catch (e) {}
    tiktokConnection = null;
  }
  connectionState.status = "disconnected";
  connectionState.error = null;
  console.log("[TikTok] Disconnected.");
  io.emit("tiktokDisconnected", "manual_disconnect");
  io.emit("statusUpdate", getStatusPayload());
}

// ═══════════════════════════════════════════════════════
//  TIKTOK EVENT HANDLERS
// ═══════════════════════════════════════════════════════
function registerTikTokEvents(connection) {
  // ─── Chat Messages ───
  connection.on("chat", async (data) => {
    const payload = formatUser(data);
    payload.comment = data.comment;
    payload.emotes = data.emotes || [];
    
    // Check for Music Request
    if (data.comment.toLowerCase().startsWith('!play ')) {
      const query = data.comment.substring(6).trim();
      if (query) {
        try {
          const r = await ytSearch(query);
          if (r.videos.length > 0) {
            const video = r.videos[0];
            io.emit('music-request', {
              videoId: video.videoId,
              title: video.title,
              author: video.author.name,
              thumbnail: video.image,
              requesterName: payload.nickname,
              requesterImg: payload.profilePictureUrl
            });
          }
        } catch (err) {
          console.error("[Music] Error searching:", err);
        }
      }
      return; // Do not relay as a regular chat message
    }

    logEvent("chat", payload);
    io.emit("chat", payload);
  });

  // ─── Gift Messages ───
  connection.on("gift", (data) => {
    const payload = formatUser(data);
    payload.giftId = data.giftId;
    payload.giftName = data.giftName || `Gift #${data.giftId}`;
    payload.giftPictureUrl = data.giftPictureUrl || null;
    payload.giftType = data.giftType; // 1=repeatable, 2=non-repeatable
    payload.repeatCount = data.repeatCount || 1;
    payload.repeatEnd = data.repeatEnd;
    payload.diamondCount = data.diamondCount || 0;
    payload.totalDiamonds =
      (data.diamondCount || 0) * (data.repeatCount || 1);
    payload.describe = data.describe || "";

    // Only emit for non-repeatable gifts or when repeat streak ends
    if (data.giftType === 1 && !data.repeatEnd) {
      // Streak still going - emit streak update
      logEvent("gift", payload);
      io.emit("gift", payload);
    } else {
      // Non-repeatable gift or streak ended
      logEvent("gift", payload);
      io.emit("gift", payload);
    }
  });

  // ─── Like Messages ───
  connection.on("like", (data) => {
    const payload = formatUser(data);
    payload.likeCount = data.likeCount || 1;
    payload.totalLikeCount = data.totalLikeCount || 0;
    connectionState.likes = data.totalLikeCount || connectionState.likes;
    logEvent("like", payload);
    io.emit("like", payload);
  });

  // ─── Member Join ───
  connection.on("member", (data) => {
    const payload = formatUser(data);
    payload.actionId = data.actionId;
    payload.label = data.label || "joined";
    logEvent("member", payload);
    io.emit("member", payload);
  });

  // ─── Social Events (follow, share) ───
  connection.on("social", (data) => {
    const payload = formatUser(data);
    payload.displayType = data.displayType || "";
    payload.label = data.label || "";
    logEvent("social", payload);
    io.emit("social", payload);

    // Also emit specific sub-events
    if (payload.displayType?.includes("follow")) {
      logEvent("follow", payload);
      io.emit("follow", payload);
    }
    if (payload.displayType?.includes("share")) {
      logEvent("share", payload);
      io.emit("share", payload);
    }
  });

  // ─── Room Stats ───
  connection.on("roomUser", (data) => {
    connectionState.viewers = data.viewerCount || 0;
    const payload = {
      viewerCount: data.viewerCount || 0,
      topViewers: (data.topViewers || []).map((v) => ({
        ...formatUser(v),
        coinCount: v.coinCount || 0,
      })),
    };
    io.emit("roomUser", payload);
    io.emit("statusUpdate", getStatusPayload());
  });

  // ─── Question / Q&A ───
  connection.on("questionNew", (data) => {
    const payload = formatUser(data);
    payload.questionText = data.questionText || "";
    logEvent("questionNew", payload);
    io.emit("questionNew", payload);
  });

  // ─── Emote Chat ───
  connection.on("emote", (data) => {
    const payload = formatUser(data);
    payload.emoteImageUrl = data.emoteImageUrl || "";
    payload.emoteId = data.emoteId || "";
    logEvent("emote", payload);
    io.emit("emote", payload);
  });

  // ─── Envelope / Treasure Box ───
  connection.on("envelope", (data) => {
    const payload = formatUser(data);
    payload.coins = data.coins || 0;
    payload.canOpen = data.canOpen || 0;
    payload.timestamp = data.timestamp || Date.now();
    logEvent("envelope", payload);
    io.emit("envelope", payload);
  });

  // ─── Subscribe ───
  connection.on("subscribe", (data) => {
    const payload = formatUser(data);
    payload.subMonth = data.subMonth || 0;
    logEvent("subscribe", payload);
    io.emit("subscribe", payload);
  });

  // ─── Link Mic Battle ───
  connection.on("linkMicBattle", (data) => {
    logEvent("linkMicBattle", data);
    io.emit("linkMicBattle", data);
  });

  // ─── Link Mic Armies ───
  connection.on("linkMicArmies", (data) => {
    logEvent("linkMicArmies", data);
    io.emit("linkMicArmies", data);
  });

  // ─── Live Intro ───
  connection.on("liveIntro", (data) => {
    logEvent("liveIntro", data);
    io.emit("liveIntro", data);
  });

  // ─── Barrage ───
  connection.on("barrage", (data) => {
    const payload = formatUser(data);
    payload.caption = data.caption || "";
    logEvent("barrage", payload);
    io.emit("barrage", payload);
  });

  // ─── Stream End ───
  connection.on("streamEnd", (actionId) => {
    console.log(`[TikTok] Stream ended (action: ${actionId})`);
    connectionState.status = "disconnected";
    connectionState.error = "Stream ended";
    io.emit("streamEnd", { actionId });
    io.emit("tiktokDisconnected", "tiktok.live_ended");
    io.emit("statusUpdate", getStatusPayload());
  });

  // ─── WebSocket Connected ───
  connection.on("websocketConnected", (wsState) => {
    console.log(
      `[TikTok] WebSocket upgraded! (${wsState.isWebsocketUpgrade ? "WS" : "Polling"})`
    );
  });

  // ─── Disconnected ───
  connection.on("disconnected", () => {
    console.log("[TikTok] Connection lost.");
    connectionState.status = "disconnected";
    io.emit("tiktokDisconnected", "tiktok.disconnected");
    io.emit("statusUpdate", getStatusPayload());
  });

  // ─── Error ───
  connection.on("error", (err) => {
    console.error("[TikTok] Error:", err.message);
    connectionState.error = err.message;
    io.emit("statusUpdate", getStatusPayload());
  });
}

// ═══════════════════════════════════════════════════════
//  USER DATA FORMATTER
// ═══════════════════════════════════════════════════════
function formatUser(data) {
  return {
    userId: data.userId?.toString() || null,
    secUid: data.secUid || null,
    uniqueId: data.uniqueId || null,
    nickname: data.nickname || data.uniqueId || "Anonymous",
    profilePictureUrl: data.profilePictureUrl || null,
    followRole: data.followRole || 0, // 0=none, 1=follower, 2=friends
    userBadges: data.userBadges || [],
    isModerator: data.isModerator || false,
    isNewGifter: data.isNewGifter || false,
    isSubscriber: data.isSubscriber || false,
    topGifterRank: data.topGifterRank || null,
    gifterLevel: data.gifterLevel || 0,
    teamMemberLevel: data.teamMemberLevel || 0,
    msgId: data.msgId?.toString() || null,
    createTime: data.createTime?.toString() || null,
  };
}

// ═══════════════════════════════════════════════════════
//  STARTUP
// ═══════════════════════════════════════════════════════
console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎮  TikTok Live Server for Interactive Games            ║
║   ─────────────────────────────────────────────           ║
║   IndoFinity-compatible WebSocket Backend                 ║
║                                                           ║
║   Socket.IO : ws://localhost:${SOCKET_PORT}                       ║
║   Dashboard : http://localhost:${DASHBOARD_PORT}                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

// Auto-connect if env variable is set
if (process.env.TIKTOK_USERNAME) {
  console.log(
    `[Auto] Connecting to @${process.env.TIKTOK_USERNAME} from env...`
  );
  setTimeout(() => connectToTikTok(process.env.TIKTOK_USERNAME), 1000);
}
