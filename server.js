/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  TikTok Live WebSocket Server                               ║
 * ║  IndoFinity-compatible backend for interactive TikTok games  ║
 * ║                                                              ║
 * ║  Connects to TikTok Live → Decodes events → Relays via       ║
 * ║  Socket.IO on port 9100 (same as IndoFinity)                 ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

require("dotenv").config();
const fs = require("fs");
const express = require("express");
const http = require("http");
const https = require("https");
const { Server } = require("socket.io");
const path = require("path");
const { WebcastPushConnection } = require("tiktok-live-connector");
const ytSearch = require("yt-search");

// ═══════════════════════════════════════════════════════
//  CONFIG
// ═══════════════════════════════════════════════════════
// Unified Single Port Configuration (Compatible with Localhost, Termux & Cloud Hosting)
const PORT = process.env.PORT || process.env.DASHBOARD_PORT || 3500;
const LEGACY_SOCKET_PORT = process.env.SOCKET_PORT;

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

// OBS & Overlay Configuration State
let obsConfig = {
  shareLinkText: "",
  shareLinkVisible: false,
  shareLinkPosition: "top", // "top" | "bottom"
  activeGameMode: "wordle",
  transparentBg: false,
  compactMode: false,
  showHostControls: false, // Toggle bottom host controls in OBS
};

// Game Rules & Settings State (Word Length, Language, Rules)
let gameSettings = {
  allowedLengths: [5, 6, 7, 8],
  language: "id", // "id" | "en" | "mixed"
  hardMode: "off", // "off" | "hard" | "ultra"
  noRepeat: false, // isogram
  noYellow: false,
  showHints: true,
  displayRows: 6,
  boardScale: 100,
  autoStarterWinner: true,
  autoStarterPreviousTarget: false,
  winStreakCooldown: true,
  floatingLeaderboard: true,
  w500GiftPeek: true,
  followerOnlyMusic: false,
  musicRequestsEnabled: true,
  musicVolume: 50,
  musicCooldown: 60,
  musicMaxDuration: 6,
  musicMaxGlobal: 20,
  musicMaxUser: 2,
  musicBannedKeywords: [],
  musicRadioSFX: true,
  musicRadioAmbiance: false,
  musicRadioAmbianceVolume: 20,
  musicPlayerStyle: "vinyl",
  musicRandomGenre: "milenial",
  musicPlaylistVisibleRows: 4,
  musicPlaylistScale: 100,
  musicPlaylistAccent: "red",
  musicPlaylistAutoScroll: true,
  wanderWordsCustomList: [],
  wordClusterCustomList: [],
  wordMatchCustomList: [],
};

// Live Music Playback State Tracker (for live sync with Dashboard)
let currentMusicState = {
  isPlaying: false,
  isPaused: false,
  activeMusic: null,
  queue: [],
  volume: 50,
  currentTime: 0,
  totalDuration: 0,
  formattedTime: "0:00 / 0:00"
};

// Music Request Cooldown Tracker (key: username/uniqueId -> timestamp)
const musicCooldowns = new Map();

// Persistent storage paths for settings & charts
const SETTINGS_FILE = path.join(__dirname, "game_settings.json");
const OBS_CONFIG_FILE = path.join(__dirname, "obs_config.json");
const SPOTIFY_CHARTS_FILE = path.join(__dirname, "spotify_top_charts.json");

let spotifyChartsData = {
  updatedAt: null,
  idDaily: [],
  globalDaily: []
};

function loadPersistedSpotifyCharts() {
  try {
    if (fs.existsSync(SPOTIFY_CHARTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SPOTIFY_CHARTS_FILE, "utf8"));
      if (Array.isArray(data.idDaily) && Array.isArray(data.globalDaily)) {
        spotifyChartsData = data;
        console.log(`[Spotify Charts] Loaded saved charts: ${data.idDaily.length} ID, ${data.globalDaily.length} Global`);
      }
    }
  } catch(e) {
    console.error("[Spotify Charts] Error reading spotify_top_charts.json:", e.message);
  }
}

function fetchKworbHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseKworbTable(html, limit = 50) {
  const songs = [];
  const regex = /<td class="text mp"><div>([\s\S]*?)<\/div><\/td>/g;
  let match;
  while ((match = regex.exec(html)) !== null && songs.length < limit) {
    let clean = match[1]
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .trim();
    if (clean) songs.push(clean);
  }
  return songs;
}

async function updateSpotifyChartsCache() {
  try {
    console.log("[Spotify Charts] Updating charts from kworb.net...");
    const [idHtml, globalHtml] = await Promise.all([
      fetchKworbHtml('https://kworb.net/spotify/country/id_daily.html'),
      fetchKworbHtml('https://kworb.net/spotify/country/global_daily.html')
    ]);

    const idSongs = parseKworbTable(idHtml, 50);
    const globalSongs = parseKworbTable(globalHtml, 50);

    if (idSongs.length > 0 || globalSongs.length > 0) {
      spotifyChartsData = {
        updatedAt: new Date().toISOString(),
        idDaily: idSongs.length > 0 ? idSongs : spotifyChartsData.idDaily,
        globalDaily: globalSongs.length > 0 ? globalSongs : spotifyChartsData.globalDaily
      };
      fs.writeFileSync(SPOTIFY_CHARTS_FILE, JSON.stringify(spotifyChartsData, null, 2), "utf8");
      console.log(`[Spotify Charts] Updated successfully: ${spotifyChartsData.idDaily.length} ID, ${spotifyChartsData.globalDaily.length} Global`);
      io.emit("spotify-charts-update", spotifyChartsData);
    }
  } catch(e) {
    console.error("[Spotify Charts] Failed to update from kworb.net:", e.message);
  }
}

function loadPersistedSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
      gameSettings = { ...gameSettings, ...data };
      console.log("[Settings] Loaded saved game settings from file");
    }
  } catch(e) {
    console.error("[Settings] Could not load game_settings.json:", e.message);
  }

  try {
    if (fs.existsSync(OBS_CONFIG_FILE)) {
      const data = JSON.parse(fs.readFileSync(OBS_CONFIG_FILE, "utf8"));
      obsConfig = { ...obsConfig, ...data };
      console.log("[OBS] Loaded saved obs config from file");
    }
  } catch(e) {
    console.error("[OBS] Could not load obs_config.json:", e.message);
  }

  loadPersistedSpotifyCharts();
}

function saveGameSettings() {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(gameSettings, null, 2), "utf8");
  } catch(e) {
    console.error("[Settings] Could not save game_settings.json:", e.message);
  }
}

function saveObsConfig() {
  try {
    fs.writeFileSync(OBS_CONFIG_FILE, JSON.stringify(obsConfig, null, 2), "utf8");
  } catch(e) {
    console.error("[OBS] Could not save obs_config.json:", e.message);
  }
}

loadPersistedSettings();
// Auto update charts every 12 hours
setInterval(updateSpotifyChartsCache, 12 * 60 * 60 * 1000);

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

// Followers cache (populated from follow events, userIdentity, chat, etc.)
const knownFollowers = new Set();

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
//  UNIFIED WEB & SOCKET.IO SERVER
// ═══════════════════════════════════════════════════════
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
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

  // Send default Session ID from .env if available
  if (process.env.TIKTOK_SESSION_ID) {
    socket.emit("envSessionId", process.env.TIKTOK_SESSION_ID);
  }

  // IndoFinity-compatible: setUniqueId from client
  socket.on("setUniqueId", (uniqueId) => {
    console.log(`[Socket.IO] setUniqueId request: ${uniqueId}`);
    connectToTikTok(uniqueId);
  });

  // Connect command from dashboard
  socket.on("connect-tiktok", (data) => {
    let uniqueId, sessionId;
    if (typeof data === "string") {
      uniqueId = data;
    } else {
      uniqueId = data.uniqueId;
      sessionId = data.sessionId;
    }
    console.log(`[Socket.IO] connect-tiktok request: ${uniqueId}`);
    connectToTikTok(uniqueId, sessionId);
  });

  // Disconnect command
  socket.on("disconnect-tiktok", () => {
    disconnectFromTikTok();
  });

  // Host Music Request
  socket.on("host-music-request", async (query) => {
    console.log(`[Socket.IO] Host requested music: ${query}`);
    try {
      const ytSearch = require("yt-search");
      const r = await ytSearch(query);
      if (r.videos.length > 0) {
        const video = r.videos[0];
        const candidates = r.videos.slice(0, 5).map(v => ({
          videoId: v.videoId,
          title: v.title,
          author: v.author ? v.author.name : "",
          thumbnail: v.image,
          duration: v.timestamp || ""
        }));
        io.emit('music-request', {
          videoId: video.videoId,
          title: video.title,
          author: video.author ? video.author.name : "",
          thumbnail: video.image,
          duration: video.timestamp || "",
          candidates: candidates,
          requesterName: "Host",
          requesterImg: "assets/bg_nature.png",
          originalQuery: query
        });
      }
    } catch (err) {
      console.error("[Music] Error searching:", err);
    }
  });

  // Chat Music Request (for IndoFinity backend fallback)
  socket.on("chat-music-request", async (data) => {
    const { query, requesterName, requesterImg, isFollower } = data;
    const isHost = (requesterName === "Host" || requesterName === "host");

    if (gameSettings.followerOnlyMusic && isFollower === false && !isHost) {
      console.log(`[Music] Filtered chat-music-request: ${requesterName} is not a follower.`);
      io.emit('music-request-rejected', {
        reason: 'follower_only',
        requesterName: requesterName || "Viewer"
      });
      return;
    }

    // Check Cooldown
    const userKey = (requesterName || '').toLowerCase().trim();
    const cdSec = typeof gameSettings.musicCooldown === 'number' ? gameSettings.musicCooldown : 60;
    if (!isHost && cdSec > 0 && userKey) {
      const lastTime = musicCooldowns.get(userKey) || 0;
      const elapsedSec = (Date.now() - lastTime) / 1000;
      if (lastTime > 0 && elapsedSec < cdSec) {
        const remainingSec = Math.ceil(cdSec - elapsedSec);
        console.log(`[Music] Filtered chat-music-request: ${requesterName} is on cooldown (${remainingSec}s left)`);
        io.emit('music-request-rejected', {
          reason: 'cooldown',
          requesterName: requesterName || "Viewer",
          remainingSeconds: remainingSec
        });
        return;
      }
    }

    console.log(`[Socket.IO] Chat requested music: ${query} by ${requesterName}`);
    try {
      const ytSearch = require("yt-search");
      const r = await ytSearch(query);
      if (r.videos.length > 0) {
        const video = r.videos[0];
        if (!isHost && userKey) {
          musicCooldowns.set(userKey, Date.now());
        }
        const candidates = r.videos.slice(0, 5).map(v => ({
          videoId: v.videoId,
          title: v.title,
          author: v.author ? v.author.name : "",
          thumbnail: v.image,
          duration: v.timestamp || ""
        }));
        io.emit('music-request', {
          videoId: video.videoId,
          title: video.title,
          author: video.author ? video.author.name : "",
          thumbnail: video.image,
          duration: video.timestamp || "",
          candidates: candidates,
          requesterName: requesterName || "Viewer",
          requesterImg: requesterImg || "",
          originalQuery: query
        });
      }
    } catch (err) {
      console.error("[Music] Error searching:", err);
    }
  });

  // Get status
  socket.on("getStatus", () => {
    socket.emit("statusUpdate", getStatusPayload());
  });

  // OBS Overlay & Share Link state
  socket.emit("obs-config-update", obsConfig);

  socket.on("get-obs-config", () => {
    socket.emit("obs-config-update", obsConfig);
  });

  socket.on("set-obs-config", (data) => {
    obsConfig = { ...obsConfig, ...data };
    saveObsConfig();
    console.log("[OBS] Config updated:", obsConfig);
    io.emit("obs-config-update", obsConfig);
  });

  // Dashboard remote controls for game & rounds
  socket.on("dashboard-change-game", (mode) => {
    console.log("[OBS] Dashboard requested game change to:", mode);
    obsConfig.activeGameMode = mode;
    saveObsConfig();
    io.emit("change-game-mode", { mode });
    io.emit("obs-config-update", obsConfig);
  });

  socket.on("dashboard-new-round", () => {
    console.log("[OBS] Dashboard requested new round");
    io.emit("trigger-new-round");
  });

  // ═══ REMOTE MUSIC PLAYBACK & STATE SYNC (DASHBOARD <-> OVERLAY) ═══
  socket.emit("music-state-update", currentMusicState);

  socket.on("get-music-state", () => {
    socket.emit("music-state-update", currentMusicState);
  });

  socket.on("music-state-update", (state) => {
    if (state && typeof state === "object") {
      currentMusicState = { ...currentMusicState, ...state };
      socket.broadcast.emit("music-state-update", currentMusicState);
    }
  });

  socket.on("dashboard-music-play", async (query) => {
    console.log(`[Music] Dashboard requested play: ${query}`);
    try {
      const ytSearch = require("yt-search");
      const r = await ytSearch(query);
      if (r.videos.length > 0) {
        const video = r.videos[0];
        const candidates = r.videos.slice(0, 5).map(v => ({
          videoId: v.videoId,
          title: v.title,
          author: v.author ? v.author.name : "",
          thumbnail: v.image,
          duration: v.timestamp || ""
        }));
        io.emit('music-request', {
          videoId: video.videoId,
          title: video.title,
          author: video.author ? video.author.name : "",
          thumbnail: video.image,
          duration: video.timestamp || "",
          candidates: candidates,
          requesterName: "Host",
          requesterImg: "assets/bg_nature.png",
          originalQuery: query
        });
      }
    } catch (err) {
      console.error("[Music] Error searching:", err);
    }
  });

  socket.on("dashboard-music-skip", () => {
    console.log("[Music] Dashboard requested skip");
    io.emit("music-skip");
  });

  socket.on("dashboard-music-pause-resume", () => {
    console.log("[Music] Dashboard requested toggle pause/play");
    io.emit("music-toggle-pause");
  });

  socket.on("dashboard-music-stop", () => {
    console.log("[Music] Dashboard requested stop");
    io.emit("music-stop");
  });

  socket.on("dashboard-music-volume", (vol) => {
    const v = Math.max(0, Math.min(100, parseInt(vol) || 50));
    gameSettings.musicVolume = v;
    saveGameSettings();
    io.emit("music-volume-set", { volume: v });
  });

  socket.on("dashboard-music-random", (data) => {
    console.log("[Music] Dashboard requested random song:", data);
    io.emit("trigger-random-music", data || {});
  });

  socket.on("dashboard-music-remove-queue", (data) => {
    console.log("[Music] Dashboard requested remove queue item:", data);
    io.emit("music-remove-queue-item", data);
  });

  socket.on("dashboard-music-clear-queue", () => {
    console.log("[Music] Dashboard requested clear queue");
    io.emit("music-clear-queue");
  });

  // ═══ REMOTE HOST GUESS & GAME HELPERS ═══
  socket.on("dashboard-host-guess", (data) => {
    const guess = (typeof data === "string" ? data : data?.guess || "").trim().toUpperCase();
    if (guess) {
      console.log("[Host Control] Dashboard submitted guess:", guess);
      io.emit("host-guess-submit", { guess });
    }
  });

  socket.on("dashboard-give-hint", () => {
    console.log("[Host Control] Dashboard requested hint");
    io.emit("trigger-give-hint");
  });

  // Game Settings Sync (Word Length, Language, Rules)
  socket.on("get-game-settings", () => {
    socket.emit("game-settings-update", gameSettings);
  });

  // When overlay connects, it announces its real local preferences so server adopts them
  socket.on("sync-game-settings-from-overlay", (overlaySettings) => {
    if (overlaySettings && typeof overlaySettings === "object") {
      gameSettings = { ...gameSettings, ...overlaySettings };
      saveGameSettings();
      console.log("[Settings] Adopted real settings from overlay:", gameSettings);
      socket.broadcast.emit("game-settings-update", gameSettings);
    }
  });

  socket.on("update-game-settings", (newSettings) => {
    if (!newSettings || typeof newSettings !== "object") return;
    gameSettings = { ...gameSettings, ...newSettings };
    saveGameSettings();
    console.log("[Settings] Game settings updated:", gameSettings);
    // Broadcast ONLY to other sockets so sender is never overwritten by echo!
    socket.broadcast.emit("game-settings-update", newSettings);
  });

  // Spotify Top Charts Sync
  socket.on("get-spotify-charts", () => {
    socket.emit("spotify-charts-update", spotifyChartsData);
  });

  socket.on("refresh-spotify-charts", async () => {
    console.log("[Spotify Charts] Manual refresh requested via socket");
    await updateSpotifyChartsCache();
  });

  socket.on("disconnect", () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// ═══════════════════════════════════════════════════════
//  EXPRESS WEB & DASHBOARD ROUTES
// ═══════════════════════════════════════════════════════
app.use(express.json());
app.use(express.static(__dirname)); // Serve Game on root
app.use("/dashboard", express.static(path.join(__dirname, "dashboard"))); // Serve dashboard on /dashboard
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use("/dashboard/assets", express.static(path.join(__dirname, "assets")));

// API endpoints
app.get("/api/status", (req, res) => {
  res.json(getStatusPayload());
});

app.get("/api/spotify-charts", (req, res) => {
  res.json(spotifyChartsData);
});

app.post("/api/connect", (req, res) => {
  const { uniqueId } = req.body;
  if (!uniqueId) return res.status(400).json({ error: "uniqueId required" });
  connectToTikTok(uniqueId);
  res.json({ status: "connecting", uniqueId });
});

app.post("/api/disconnect", (req, res) => {
  disconnectFromTikTok();
  res.json({ status: "disconnected" });
});

app.get("/api/events", (req, res) => {
  res.json(recentEvents);
});

app.get("/api/stats", (req, res) => {
  res.json(eventStats);
});

app.get("/api/obs-config", (req, res) => {
  res.json(obsConfig);
});

app.post("/api/obs-config", (req, res) => {
  obsConfig = { ...obsConfig, ...req.body };
  saveObsConfig();
  io.emit("obs-config-update", obsConfig);
  res.json(obsConfig);
});

app.get("/api/game-settings", (req, res) => {
  res.json(gameSettings);
});

app.post("/api/game-settings", (req, res) => {
  gameSettings = { ...gameSettings, ...req.body };
  saveGameSettings();
  io.emit("game-settings-update", gameSettings);
  res.json(gameSettings);
});

app.get("/api/lyrics", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Missing query" });
  try {
    const resp = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`);
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.warn("[Lyrics Proxy] Error fetching from lrclib:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Proxy Avatar Gambar Profil untuk Ekspor Poster Bersih CORS (html2canvas)
app.get("/api/avatar-proxy", async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl || typeof targetUrl !== "string") {
    return res.status(400).send("Missing url parameter");
  }
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    return res.status(400).send("Invalid url scheme");
  }
  try {
    const resp = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    if (!resp.ok) {
      return res.redirect("/assets/bg_nature.png");
    }
    const contentType = resp.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await resp.arrayBuffer());
    res.setHeader("Content-Type", contentType);
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(buffer);
  } catch (err) {
    res.redirect("/assets/bg_nature.png");
  }
});

// ═══════════════════════════════════════════════════════
//  KBBI & WORDLIST MANAGEMENT SERVICE
// ═══════════════════════════════════════════════════════
const WORDLIST_DIR = path.join(__dirname, "wordlist");
const KBBI_FILE = path.join(WORDLIST_DIR, "kbbi.json");

let kbbiLemmaMap = new Map();
let isKbbiLoaded = false;
let isKbbiLoading = false;

const TARGET_FILES = {
  id: {
    3: { target: "target_words_id_3.txt", valid: "valid_words_id_3.txt" },
    4: { target: "target_words_id_4.txt", valid: "valid_words_id_4.txt" },
    5: { target: "target_words_id.txt", valid: "valid_words_id.txt" },
    6: { target: "target_words_id_6.txt", valid: "valid_words_id_6.txt" },
    7: { target: "target_words_id_7.txt", valid: "valid_words_id_7.txt" },
    8: { target: "target_words_id_8.txt", valid: "valid_words_id_8.txt" }
  },
  en: {
    3: { target: "target_words_3.txt", valid: "valid_words_3.txt" },
    4: { target: "target_words_4.txt", valid: "valid_words_4.txt" },
    5: { target: "target_words.txt", valid: "valid_words.txt" },
    6: { target: "target_words_6.txt", valid: "valid_words_6.txt" },
    7: { target: "target_words_7.txt", valid: "valid_words_7.txt" },
    8: { target: "target_words_8.txt", valid: "valid_words_8.txt" }
  }
};

let indonesianTargetWordsSet = new Set();
let indonesianTargetFileMap = new Map();

function readWordFile(filename) {
  const filePath = path.join(WORDLIST_DIR, filename);
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf8");
  return content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length > 0);
}

function writeWordFile(filename, words) {
  const filePath = path.join(WORDLIST_DIR, filename);
  const unique = Array.from(new Set(words.map(w => w.trim().toLowerCase()).filter(Boolean)));
  unique.sort((a, b) => a.localeCompare("id"));
  fs.writeFileSync(filePath, unique.join("\r\n") + "\r\n", "utf8");
  return unique.length;
}

function refreshTargetWordSets() {
  indonesianTargetWordsSet.clear();
  indonesianTargetFileMap.clear();
  for (const len of [3, 4, 5, 6, 7, 8]) {
    const fn = TARGET_FILES.id[len].target;
    const words = readWordFile(fn);
    for (const w of words) {
      indonesianTargetWordsSet.add(w);
      indonesianTargetFileMap.set(w, fn);
    }
  }
}

function initKbbiService() {
  if (isKbbiLoaded || isKbbiLoading) return;
  if (!fs.existsSync(KBBI_FILE)) {
    console.warn("[KBBI] File kbbi.json tidak ditemukan di:", KBBI_FILE);
    return;
  }
  isKbbiLoading = true;
  console.log("[KBBI] Memuat kamus KBBI di latar belakang...");
  setImmediate(() => {
    try {
      const raw = fs.readFileSync(KBBI_FILE, "utf8");
      let parsed = JSON.parse(raw);
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i];
        if (!item || !item.lemma) continue;
        const clean = item.lemma.toLowerCase().trim();
        if (!clean) continue;
        if (!kbbiLemmaMap.has(clean)) {
          kbbiLemmaMap.set(clean, item.plain || "");
        } else {
          kbbiLemmaMap.set(clean, kbbiLemmaMap.get(clean) + "\n\n" + (item.plain || ""));
        }
      }
      parsed = null;
      isKbbiLoaded = true;
      isKbbiLoading = false;
      console.log(`[KBBI] Berhasil memuat ${kbbiLemmaMap.size} entri kosakata resmi KBBI.`);
      refreshTargetWordSets();
    } catch (err) {
      isKbbiLoading = false;
      console.error("[KBBI] Gagal membaca kbbi.json:", err.message);
    }
  });
}

// Inisialisasi awal
refreshTargetWordSets();
initKbbiService();

// Web route: serve wordlist manager page
app.get(["/wordlist", "/kosakata", "/wordlist-manager", "/wordlist_manager.html"], (req, res) => {
  res.sendFile(path.join(__dirname, "wordlist_manager.html"));
});

// 1. Status KBBI
app.get("/api/kbbi/status", (req, res) => {
  res.json({
    loaded: isKbbiLoaded,
    loading: isKbbiLoading,
    totalEntries: kbbiLemmaMap.size,
    targetWordsCount: indonesianTargetWordsSet.size
  });
});

// Helper untuk mengekstrak definisi ringkas & kelas kata KBBI
function extractKbbiSnippet(plain) {
  if (!plain) return { snippet: "", wordClass: "" };
  const lines = plain.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return { snippet: "", wordClass: "" };

  let rawDef = "";
  for (let i = 0; i < lines.length; i++) {
    const clean = lines[i].replace(/<[^>]+>/g, "").trim();
    // Abaikan baris pemenggalan suku kata (misal: "a.pel (1)" atau "men.ta.ri mêntari")
    if (/^[a-zA-Z\.\-\s\(\)\d\u00C0-\u017F]+$/.test(clean) && clean.includes(".") && !clean.includes(";")) {
      continue;
    }
    if (clean.startsWith("bentuk tidak baku:") || clean.startsWith("[gabungan:")) {
      continue;
    }
    rawDef = clean;
    break;
  }
  if (!rawDef) rawDef = (lines[1] || lines[0] || "").replace(/<[^>]+>/g, "").trim();

  let wordClass = "";
  const classMatch = rawDef.match(/\b(n|v|a|adv|num|p|ki|cak|kl|ark)\b/);
  if (classMatch) wordClass = classMatch[1];

  let snippet = rawDef;
  if (snippet.length > 140) snippet = snippet.slice(0, 137) + "...";

  return { snippet, wordClass };
}

// 2. Pencarian Kosakata KBBI (Mendukung Tabel & Paginasi Cepat)
app.get("/api/kbbi/search", (req, res) => {
  if (!isKbbiLoaded && isKbbiLoading) {
    return res.json({ status: "loading", message: "Kamus KBBI sedang dimuat di server...", results: [] });
  }

  const query = (req.query.q || "").toLowerCase().trim();
  const len = parseInt(req.query.length) || 0;
  const statusFilter = (req.query.status || "all").toLowerCase(); // all | unadded | added
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(200, Math.max(10, parseInt(req.query.pageSize) || parseInt(req.query.limit) || 50));

  const allMatches = [];
  const addedLemmas = new Set();

  function evaluateItem(lemma, plain, isExact = false) {
    if (addedLemmas.has(lemma)) return false;
    // Word filtering: only clean letters a-z
    if (!/^[a-zA-Z]+$/.test(lemma)) return false;
    if (len > 0 && lemma.length !== len) return false;
    
    const isTarget = indonesianTargetWordsSet.has(lemma);
    if (statusFilter === "added" && !isTarget) return false;
    if (statusFilter === "unadded" && isTarget) return false;

    addedLemmas.add(lemma);
    
    const { snippet, wordClass } = extractKbbiSnippet(plain);

    allMatches.push({
      lemma,
      plain,
      snippet,
      wordClass,
      length: lemma.length,
      isTarget,
      targetFile: indonesianTargetFileMap.get(lemma) || (lemma.length >= 3 && lemma.length <= 8 ? TARGET_FILES.id[lemma.length].target : null),
      isExact
    });
    return allMatches.length >= 5000; // Cap search pool to keep response instant
  }

  if (query) {
    // 1. Exact match
    if (kbbiLemmaMap.has(query)) {
      evaluateItem(query, kbbiLemmaMap.get(query), true);
    }

    // 2. StartsWith
    if (allMatches.length < 5000) {
      for (const [lemma, plain] of kbbiLemmaMap.entries()) {
        if (lemma === query) continue;
        if (lemma.startsWith(query)) {
          if (evaluateItem(lemma, plain)) break;
        }
      }
    }

    // 3. Includes (if query has at least 3 chars)
    if (allMatches.length < 5000 && query.length >= 3) {
      for (const [lemma, plain] of kbbiLemmaMap.entries()) {
        if (lemma === query || lemma.startsWith(query)) continue;
        if (lemma.includes(query)) {
          if (evaluateItem(lemma, plain)) break;
        }
      }
    }
  } else {
    // Browse mode (e.g. by letter length)
    for (const [lemma, plain] of kbbiLemmaMap.entries()) {
      if (evaluateItem(lemma, plain)) break;
    }
  }

  const totalFound = allMatches.length;
  const totalPages = Math.ceil(totalFound / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const results = allMatches.slice(startIndex, startIndex + pageSize);

  res.json({
    success: true,
    query,
    length: len,
    statusFilter,
    page,
    pageSize,
    totalPages,
    totalFound,
    results
  });
});

// 2b. Auto-Harvest / Ambil Kosakata Otomatis dari KBBI sesuai Panjang Kata
app.post("/api/kbbi/harvest", (req, res) => {
  const length = parseInt(req.body.length);
  const count = Math.min(100, Math.max(1, parseInt(req.body.count) || 10));
  const addToValid = req.body.addToValid !== false;

  if (!length || length < 3 || length > 8) {
    return res.status(400).json({ error: "Panjang huruf harus antara 3 dan 8" });
  }

  const targetFilename = TARGET_FILES.id[length]?.target;
  const validFilename = TARGET_FILES.id[length]?.valid;

  if (!targetFilename) {
    return res.status(400).json({ error: `File target untuk ${length} huruf tidak ditemukan` });
  }

  // Find candidate words in KBBI that are pure a-z, correct length, and NOT yet in target list
  const candidates = [];
  for (const [lemma] of kbbiLemmaMap.entries()) {
    if (lemma.length === length && /^[a-z]+$/.test(lemma)) {
      if (!indonesianTargetWordsSet.has(lemma)) {
        candidates.push(lemma);
        if (candidates.length >= count * 3) break; // Collect pool to allow some variety
      }
    }
  }

  if (candidates.length === 0) {
    return res.json({ success: false, message: `Semua kosakata ${length} huruf di KBBI sudah ada dalam target permainan!` });
  }

  // Pick up to `count` words
  const wordsToHarvest = candidates.slice(0, count);

  const existingTargetWords = readWordFile(targetFilename);
  const targetSet = new Set(existingTargetWords);
  let addedTargetCount = 0;

  for (const w of wordsToHarvest) {
    if (!targetSet.has(w)) {
      targetSet.add(w);
      existingTargetWords.push(w);
      addedTargetCount++;
    }
  }

  const totalWords = writeWordFile(targetFilename, existingTargetWords);

  if (addToValid && validFilename) {
    const existingValidWords = readWordFile(validFilename);
    const validSet = new Set(existingValidWords);
    for (const w of wordsToHarvest) {
      if (!validSet.has(w)) {
        validSet.add(w);
        existingValidWords.push(w);
      }
    }
    writeWordFile(validFilename, existingValidWords);
  }

  refreshTargetWordSets();
  io.emit("wordlist-updated", { filename: targetFilename, count: addedTargetCount, action: "bulk-harvest" });

  res.json({
    success: true,
    message: `Berhasil mengambil ${addedTargetCount} kosakata ${length} huruf dari KBBI ke dalam ${targetFilename}!`,
    wordsAdded: wordsToHarvest,
    addedCount: addedTargetCount,
    length,
    targetFile: targetFilename,
    totalWords
  });
});

// 3. Detail Definisi Kata
app.get("/api/kbbi/detail", (req, res) => {
  const word = (req.query.word || "").toLowerCase().trim();
  if (!word) return res.status(400).json({ error: "Parameter word required" });

  const plain = kbbiLemmaMap.get(word) || null;
  const isTarget = indonesianTargetWordsSet.has(word);
  const targetFile = indonesianTargetFileMap.get(word) || (word.length >= 3 && word.length <= 8 ? TARGET_FILES.id[word.length]?.target : null);

  res.json({
    success: true,
    word,
    plain,
    foundInKbbi: !!plain,
    isTarget,
    targetFile,
    length: word.length
  });
});

// 4. Daftar File Wordlist & Status
app.get("/api/wordlist/files", (req, res) => {
  const fileStats = [];
  
  for (const [lang, lengths] of Object.entries(TARGET_FILES)) {
    for (const [len, pair] of Object.entries(lengths)) {
      const targetWords = readWordFile(pair.target);
      const validWords = readWordFile(pair.valid);
      fileStats.push({
        lang,
        length: parseInt(len),
        targetFile: pair.target,
        targetCount: targetWords.length,
        validFile: pair.valid,
        validCount: validWords.length
      });
    }
  }

  res.json({
    success: true,
    files: fileStats,
    totalTargetWordsId: indonesianTargetWordsSet.size
  });
});

// 5. Ambil Daftar Kata dari File (Mendukung Tampilan Tabel & Definisi KBBI)
app.get("/api/wordlist/words", (req, res) => {
  const filename = req.query.filename;
  if (!filename) return res.status(400).json({ error: "Parameter filename required" });
  
  const safeFilename = path.basename(filename);
  const words = readWordFile(safeFilename);
  const search = (req.query.search || "").toLowerCase().trim();
  
  let filtered = words;
  if (search) {
    filtered = words.filter(w => w.includes(search));
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const pageSize = Math.min(500, Math.max(10, parseInt(req.query.pageSize) || 100));
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const paginatedWords = filtered.slice(startIndex, startIndex + pageSize);

  const enrichedWords = paginatedWords.map(w => {
    const plain = kbbiLemmaMap.get(w);
    const { snippet, wordClass } = extractKbbiSnippet(plain);
    return {
      word: w,
      length: w.length,
      hasKbbi: !!plain,
      snippet,
      wordClass
    };
  });

  res.json({
    success: true,
    filename: safeFilename,
    totalWords: words.length,
    filteredCount: filtered.length,
    page,
    pageSize,
    totalPages,
    words: enrichedWords
  });
});

// 6. Tambah Kata ke File Target
app.post("/api/wordlist/add-word", (req, res) => {
  const { filename, word, addToValid = true } = req.body;
  if (!filename || !word) return res.status(400).json({ error: "Filename and word required" });

  const safeFilename = path.basename(filename);
  const cleanWord = String(word).trim().toLowerCase();

  if (!/^[a-z]+$/.test(cleanWord)) {
    return res.status(400).json({ error: "Kata hanya boleh mengandung huruf a-z tanpa spasi/simbol" });
  }

  const existingWords = readWordFile(safeFilename);
  if (existingWords.includes(cleanWord)) {
    return res.json({ success: true, message: `Kata "${cleanWord}" sudah ada dalam daftar.`, alreadyExists: true, totalWords: existingWords.length });
  }

  existingWords.push(cleanWord);
  const totalWords = writeWordFile(safeFilename, existingWords);

  // Jika addToValid aktif, cek apakah ada file valid_words pasangannya
  if (addToValid) {
    for (const lang of ["id", "en"]) {
      for (const len of [3, 4, 5, 6, 7, 8]) {
        if (TARGET_FILES[lang][len].target === safeFilename) {
          const validFn = TARGET_FILES[lang][len].valid;
          const validWords = readWordFile(validFn);
          if (!validWords.includes(cleanWord)) {
            validWords.push(cleanWord);
            writeWordFile(validFn, validWords);
          }
        }
      }
    }
  }

  refreshTargetWordSets();
  io.emit("wordlist-updated", { filename: safeFilename, word: cleanWord, action: "add" });

  res.json({
    success: true,
    message: `Berhasil menambahkan "${cleanWord}" ke ${safeFilename}`,
    word: cleanWord,
    filename: safeFilename,
    totalWords
  });
});

// 7. Hapus Kata dari File Target
app.post("/api/wordlist/delete-word", (req, res) => {
  const { filename, word } = req.body;
  if (!filename || !word) return res.status(400).json({ error: "Filename and word required" });

  const safeFilename = path.basename(filename);
  const cleanWord = String(word).trim().toLowerCase();

  const existingWords = readWordFile(safeFilename);
  const initialCount = existingWords.length;
  const filteredWords = existingWords.filter(w => w !== cleanWord);

  if (filteredWords.length === initialCount) {
    return res.status(404).json({ error: `Kata "${cleanWord}" tidak ditemukan dalam ${safeFilename}` });
  }

  const totalWords = writeWordFile(safeFilename, filteredWords);
  refreshTargetWordSets();
  io.emit("wordlist-updated", { filename: safeFilename, word: cleanWord, action: "delete" });

  res.json({
    success: true,
    message: `Berhasil menghapus "${cleanWord}" dari ${safeFilename}`,
    word: cleanWord,
    filename: safeFilename,
    totalWords
  });
});

// 8. Bulk Add Kata
app.post("/api/wordlist/bulk-add", (req, res) => {
  const { filename, wordsText, addToValid = true } = req.body;
  if (!filename || !wordsText) return res.status(400).json({ error: "Filename and wordsText required" });

  const safeFilename = path.basename(filename);
  const rawList = Array.isArray(wordsText) ? wordsText : String(wordsText).split(/[\r\n,;]+/);
  const cleanList = rawList
    .map(w => w.trim().toLowerCase())
    .filter(w => /^[a-z]+$/.test(w));

  const existingWords = readWordFile(safeFilename);
  const existingSet = new Set(existingWords);
  let addedCount = 0;

  for (const w of cleanList) {
    if (!existingSet.has(w)) {
      existingSet.add(w);
      existingWords.push(w);
      addedCount++;
    }
  }

  const totalWords = writeWordFile(safeFilename, existingWords);

  if (addToValid && addedCount > 0) {
    for (const lang of ["id", "en"]) {
      for (const len of [3, 4, 5, 6, 7, 8]) {
        if (TARGET_FILES[lang][len].target === safeFilename) {
          const validFn = TARGET_FILES[lang][len].valid;
          const validWords = readWordFile(validFn);
          const validSet = new Set(validWords);
          for (const w of cleanList) {
            if (!validSet.has(w)) {
              validSet.add(w);
              validWords.push(w);
            }
          }
          writeWordFile(validFn, validWords);
        }
      }
    }
  }

  refreshTargetWordSets();
  io.emit("wordlist-updated", { filename: safeFilename, action: "bulk-add", addedCount });

  res.json({
    success: true,
    message: `Berhasil menambahkan ${addedCount} kata baru ke ${safeFilename}`,
    addedCount,
    skippedCount: cleanList.length - addedCount,
    totalWords
  });
});

// 8b. Bulk Delete Kata dari File Target
app.post("/api/wordlist/bulk-delete", (req, res) => {
  const { filename, words } = req.body;
  if (!filename || !Array.isArray(words) || words.length === 0) {
    return res.status(400).json({ error: "Filename and words array required" });
  }

  const safeFilename = path.basename(filename);
  const deleteSet = new Set(words.map(w => String(w).trim().toLowerCase()));

  const existingWords = readWordFile(safeFilename);
  const remainingWords = existingWords.filter(w => !deleteSet.has(w));
  const deletedCount = existingWords.length - remainingWords.length;

  const totalWords = writeWordFile(safeFilename, remainingWords);
  refreshTargetWordSets();
  io.emit("wordlist-updated", { filename: safeFilename, count: deletedCount, action: "bulk-delete" });

  res.json({
    success: true,
    message: `Berhasil menghapus ${deletedCount} kata dari ${safeFilename}`,
    deletedCount,
    filename: safeFilename,
    totalWords
  });
});

// 9. Simpan Raw Konten
app.post("/api/wordlist/raw-save", (req, res) => {
  const { filename, content } = req.body;
  if (!filename || typeof content !== "string") return res.status(400).json({ error: "Filename and content required" });

  const safeFilename = path.basename(filename);
  const words = content
    .split(/\r?\n/)
    .map(w => w.trim().toLowerCase())
    .filter(w => /^[a-z]+$/.test(w));

  const totalWords = writeWordFile(safeFilename, words);
  refreshTargetWordSets();
  io.emit("wordlist-updated", { filename: safeFilename, action: "raw-save", totalWords });

  res.json({
    success: true,
    message: `File ${safeFilename} berhasil diperbarui (${totalWords} kata)`,
    filename: safeFilename,
    totalWords
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`\n╔═══════════════════════════════════════════════════╗`);
  console.log(`║  🎮  TikTok Live Interactive Game Server          ║`);
  console.log(`║  ─────────────────────────────────────────────    ║`);
  console.log(`║  🌐  URL / OBS : http://0.0.0.0:${PORT}            ║`);
  console.log(`║  🖥️  Dashboard : http://0.0.0.0:${PORT}/dashboard  ║`);
  console.log(`║  🔌  Socket.IO : ws://0.0.0.0:${PORT}              ║`);
  console.log(`╚═══════════════════════════════════════════════════╝\n`);
});

// Optional legacy secondary port fallback (if explicitly requested in .env)
if (LEGACY_SOCKET_PORT && String(LEGACY_SOCKET_PORT) !== String(PORT)) {
  const legacyServer = http.createServer();
  io.attach(legacyServer);
  legacyServer.listen(LEGACY_SOCKET_PORT, '0.0.0.0', () => {
    console.log(`[Socket.IO] Legacy fallback port active on ${LEGACY_SOCKET_PORT}`);
  });
}

// ═══════════════════════════════════════════════════════
//  HELPER
// ═══════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════
//  WATCHDOG & AUTO-RECONNECT STATE
// ═══════════════════════════════════════════════════════
let lastTikTokUniqueId = null;
let lastTikTokSessionId = null;
let lastTikTokEventTime = 0;
let isManualDisconnect = false;
let watchdogInterval = null;
let reconnectTimer = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 12;
const WATCHDOG_INTERVAL_MS = 10000;   // Cek status setiap 10 detik
const INACTIVITY_TIMEOUT_MS = 45000;  // 45 detik tanpa data/event sama sekali dari TikTok

// ═══════════════════════════════════════════════════════
//  HELPER
// ═══════════════════════════════════════════════════════
function getStatusPayload() {
  return {
    ...connectionState,
    eventStats,
    recentEventsCount: recentEvents.length,
    connectedClients: io.engine?.clientsCount || 0,
    lastEventSecAgo: lastTikTokEventTime ? Math.round((Date.now() - lastTikTokEventTime) / 1000) : null,
    reconnectAttempts,
    isWatchdogActive: !!watchdogInterval,
  };
}

// ═══════════════════════════════════════════════════════
//  WATCHDOG (SILENT FREEZE DETECTOR)
// ═══════════════════════════════════════════════════════
function startWatchdog() {
  stopWatchdog();
  watchdogInterval = setInterval(async () => {
    if (connectionState.status !== "connected" || isManualDisconnect) return;

    const timeSinceLastEvent = Date.now() - lastTikTokEventTime;
    const sec = Math.round(timeSinceLastEvent / 1000);

    // Kirim heartbeat pulse ke frontend setiap 10 detik
    io.emit("tiktokPulse", {
      status: connectionState.status,
      secondsSinceLastEvent: sec,
      reconnectAttempts,
    });

    // Jika hening melebihi ambang batas (silent connection freeze)
    if (timeSinceLastEvent >= INACTIVITY_TIMEOUT_MS) {
      console.warn(`[TikTok Watchdog] ⚠️ Inactivity alert: Tidak ada data dari TikTok selama ${sec}s!`);

      io.emit("tiktokStalled", {
        seconds: sec,
        reason: "Aliran data chat TikTok hening / freeze",
      });

      // Lakukan probe aktif: apakah streamer masih live di TikTok?
      let isLive = true;
      if (tiktokConnection && typeof tiktokConnection.fetchIsLive === "function") {
        try {
          isLive = await Promise.race([
            tiktokConnection.fetchIsLive(),
            new Promise((_, reject) => setTimeout(() => reject(new Error("Probe timeout")), 6000)),
          ]);
        } catch (e) {
          console.warn(`[TikTok Watchdog] Probe check error/timeout:`, e.message);
          isLive = false;
        }
      }

      if (!isLive) {
        console.log(`[TikTok Watchdog] Host tampak offline atau koneksi tidak dapat dihubungi.`);
        connectionState.status = "disconnected";
        connectionState.error = "Koneksi TikTok terputus / Host offline";
        io.emit("tiktokDisconnected", "tiktok.disconnected");
        io.emit("statusUpdate", getStatusPayload());
        scheduleAutoReconnect("live_offline_or_unreachable");
      } else {
        console.log(`[TikTok Watchdog] Host MASIH LIVE, namun WebSocket macet/silent freeze (Zombie Connection). Auto-reconnecting sekarang!`);
        scheduleAutoReconnect("zombie_websocket_reconnect");
      }
    }
  }, WATCHDOG_INTERVAL_MS);
}

function stopWatchdog() {
  if (watchdogInterval) {
    clearInterval(watchdogInterval);
    watchdogInterval = null;
  }
}

// ═══════════════════════════════════════════════════════
//  AUTO-RECONNECT SCHEDULER
// ═══════════════════════════════════════════════════════
function scheduleAutoReconnect(reason) {
  if (isManualDisconnect) return;
  if (!lastTikTokUniqueId) return;
  if (reconnectTimer) return; // sudah ada jadwal aktif

  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.warn(`[TikTok Auto-Reconnect] Batas percobaan maksimal (${MAX_RECONNECT_ATTEMPTS}) tercapai.`);
    io.emit("tiktokDisconnected", "Batas reconnect tercapai. Periksa koneksi.");
    return;
  }

  reconnectAttempts++;
  // Exponential backoff: ~3s, ~4s, ~5s, max 15s
  const delay = Math.min(3000 * Math.pow(1.25, reconnectAttempts - 1), 15000);
  const delaySec = Math.round(delay / 1000);

  console.log(`[TikTok Auto-Reconnect] Menjadwalkan reconnect #${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS} dalam ${delaySec}s (Alasan: ${reason})...`);

  io.emit("tiktokReconnecting", {
    attempt: reconnectAttempts,
    maxAttempts: MAX_RECONNECT_ATTEMPTS,
    delaySeconds: delaySec,
    reason,
  });

  connectionState.status = "connecting";
  io.emit("statusUpdate", getStatusPayload());

  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    if (isManualDisconnect) return;
    try {
      console.log(`[TikTok Auto-Reconnect] Mencoba reconnect #${reconnectAttempts} ke @${lastTikTokUniqueId}...`);
      await connectToTikTok(lastTikTokUniqueId, lastTikTokSessionId, true);
    } catch (err) {
      console.error(`[TikTok Auto-Reconnect] Percobaan #${reconnectAttempts} gagal:`, err.message);
      scheduleAutoReconnect("retry_after_failure");
    }
  }, delay);
}

// ═══════════════════════════════════════════════════════
//  TIKTOK CONNECTION
// ═══════════════════════════════════════════════════════
async function connectToTikTok(uniqueId, sessionId = null, isAutoReconnect = false) {
  if (!uniqueId) return;

  if (!isAutoReconnect) {
    isManualDisconnect = false;
    reconnectAttempts = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  lastTikTokUniqueId = uniqueId;
  if (sessionId) {
    lastTikTokSessionId = sessionId;
  } else if (!lastTikTokSessionId && process.env.TIKTOK_SESSION_ID) {
    lastTikTokSessionId = process.env.TIKTOK_SESSION_ID;
  }

  // Disconnect existing — remove all listeners first to prevent duplicates
  if (tiktokConnection) {
    try {
      tiktokConnection.removeAllListeners();
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

  console.log(`\n[TikTok] Connecting to @${uniqueId}...${isAutoReconnect ? " (Auto-Reconnect)" : ""}`);

  try {
    let options = {
      processInitialData: true,
      fetchRoomInfoOnConnect: true,
      enableExtendedGiftInfo: true,
      enableWebsocketUpgrade: true,
      requestPollingIntervalMs: 2000,
      ttTargetIdc: "alisg",
      requestHeaders: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      }
    };

    if (lastTikTokSessionId) {
      options.sessionId = lastTikTokSessionId;
    }

    let currentConnection = new WebcastPushConnection(uniqueId, options);
    tiktokConnection = currentConnection;

    const state = await currentConnection.connect();

    // Guard: if user disconnected or reconnected while we were waiting, abort!
    if (tiktokConnection !== currentConnection) {
      console.log(`[TikTok] Connection to @${uniqueId} aborted because a newer request was made or disconnected.`);
      return;
    }

    connectionState.status = "connected";
    connectionState.roomId = state.roomId;
    connectionState.connectedAt = Date.now();
    lastTikTokEventTime = Date.now();
    reconnectAttempts = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    // Ekstrak URL foto profil host dari data roomInfo TikTok
    const rawOwner = state.roomInfo?.owner || state.roomInfo?.data?.owner || state.roomInfo?.data?.user || state.roomInfo?.data?.room?.owner;
    let hostAvatar = null;
    if (rawOwner) {
      hostAvatar = 
        rawOwner.avatar_large?.url_list?.[0] || 
        rawOwner.avatar_medium?.url_list?.[0] || 
        rawOwner.avatar_thumb?.url_list?.[0] || 
        rawOwner.avatarLarge ||
        rawOwner.avatarMedium ||
        rawOwner.avatarThumb ||
        rawOwner.profilePictureUrl ||
        null;
    }

    connectionState.roomInfo = {
      uniqueId,
      roomId: state.roomId,
      title: state.roomInfo?.title || "",
      description: state.roomInfo?.description || "",
      hostName: state.roomInfo?.host_name || rawOwner?.nickname || uniqueId,
      hostAvatar: hostAvatar,
      viewerCount: state.roomInfo?.viewer_count || 0,
      likeCount: state.roomInfo?.like_count || 0,
    };

    console.log(`[TikTok] ✅ Connected! Room ID: ${state.roomId}${hostAvatar ? ' (Host Avatar Detected)' : ''}`);

    // Emit to all Socket.IO clients
    io.emit("tiktokConnected", {
      roomId: connectionState.roomId,
      roomInfo: connectionState.roomInfo,
    });
    io.emit("statusUpdate", getStatusPayload());

    // ─── Register all event handlers ───
    registerTikTokEvents(currentConnection);

    // ─── Start Inactivity Watchdog ───
    startWatchdog();

    // Handle websocket upgrade (v2 library fires this after polling→ws)
    currentConnection.on('websocketConnected', (wsState) => {
      console.log(`[TikTok] WebSocket upgraded! (${wsState.upgradedToWebsocket ? 'WebSocket' : 'Polling'})`);
    });

  } catch (err) {
    console.error(`[TikTok] ❌ Connection failed:`, err.message);
    connectionState.status = "disconnected";
    connectionState.error = err.message;
    io.emit("tiktokDisconnected", err.message);
    io.emit("statusUpdate", getStatusPayload());

    if (!isManualDisconnect) {
      scheduleAutoReconnect("connection_failed");
    }
  }
}

function disconnectFromTikTok() {
  isManualDisconnect = true;
  stopWatchdog();
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  reconnectAttempts = 0;

  if (tiktokConnection) {
    try {
      tiktokConnection.removeAllListeners();
      tiktokConnection.disconnect();
    } catch (e) {}
    tiktokConnection = null;
  }
  connectionState.status = "disconnected";
  connectionState.error = null;
  console.log("[TikTok] Disconnected manually.");
  io.emit("tiktokDisconnected", "manual_disconnect");
  io.emit("statusUpdate", getStatusPayload());
}

// ═══════════════════════════════════════════════════════
//  TIKTOK EVENT HANDLERS
// ═══════════════════════════════════════════════════════
function registerTikTokEvents(connection) {
  const markActivity = () => {
    lastTikTokEventTime = Date.now();
  };

  // Monitor raw websocket data frames as heartbeat
  connection.on("websocketData", markActivity);
  connection.on("decodedData", markActivity);
  connection.on("rawData", markActivity);

  // ─── Chat Messages ───
  connection.on("chat", async (data) => {
    markActivity();
    const payload = formatUser(data);
    payload.comment = data.comment;
    payload.emotes = data.emotes || [];

    // Deteksi & sinkronisasi otomatis avatar akun Host/Streamer yang sedang live
    const isStreamerAccount = payload.uniqueId && connectionState.uniqueId && payload.uniqueId.toLowerCase() === connectionState.uniqueId.toLowerCase();
    if (isStreamerAccount && payload.profilePictureUrl) {
      if (!connectionState.roomInfo) connectionState.roomInfo = {};
      if (connectionState.roomInfo.hostAvatar !== payload.profilePictureUrl) {
        connectionState.roomInfo.hostAvatar = payload.profilePictureUrl;
        console.log(`[TikTok] 📸 Host avatar updated from streamer chat: @${payload.uniqueId}`);
        io.emit('hostAvatarUpdated', {
          uniqueId: payload.uniqueId,
          hostAvatar: payload.profilePictureUrl
        });
      }
    }
    
    // Check for Skip Request
    if (data.comment.toLowerCase().trim() === '!skip') {
      if (payload.isModerator || payload.uniqueId === connectionState.uniqueId) {
        io.emit('music-skip');
      }
      return; // Do not relay as a regular chat message
    }
    
    // Check for Music Request
    if (data.comment.toLowerCase().startsWith('!play ')) {
      const isHost = payload.uniqueId === connectionState.uniqueId || payload.uniqueId === 'host' || payload.uniqueId === 'host_offline';
      const isFollower = Boolean(payload.isFollower || payload.followRole === 1 || payload.followRole === 2 || payload.isModerator || isHost);
      if (gameSettings.followerOnlyMusic && !isFollower) {
        console.log(`[Music] Filtered !play: @${payload.uniqueId} is not a follower.`);
        io.emit('music-request-rejected', {
          reason: 'follower_only',
          requesterName: payload.nickname || payload.uniqueId
        });
        return; // Do not relay as a regular chat message and do not search
      }

      // Check Cooldown
      const userKey = (payload.uniqueId || payload.nickname || '').toLowerCase().trim();
      const cdSec = typeof gameSettings.musicCooldown === 'number' ? gameSettings.musicCooldown : 60;
      if (!isHost && cdSec > 0 && userKey) {
        const lastTime = musicCooldowns.get(userKey) || 0;
        const elapsedSec = (Date.now() - lastTime) / 1000;
        if (lastTime > 0 && elapsedSec < cdSec) {
          const remainingSec = Math.ceil(cdSec - elapsedSec);
          console.log(`[Music] Filtered !play: @${payload.uniqueId} is on cooldown (${remainingSec}s left)`);
          io.emit('music-request-rejected', {
            reason: 'cooldown',
            requesterName: payload.nickname || payload.uniqueId,
            remainingSeconds: remainingSec
          });
          return;
        }
      }

      const query = data.comment.substring(6).trim();
      if (query) {
        try {
          const r = await ytSearch(query);
          if (r.videos.length > 0) {
            const video = r.videos[0];
            if (!isHost && userKey) {
              musicCooldowns.set(userKey, Date.now());
            }
            io.emit('music-request', {
              videoId: video.videoId,
              title: video.title,
              author: video.author.name,
              thumbnail: video.image,
              duration: video.timestamp || "",
              requesterName: payload.nickname,
              requesterImg: payload.profilePictureUrl,
              originalQuery: query
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
    markActivity();
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
    markActivity();
    const payload = formatUser(data);
    payload.likeCount = data.likeCount || 1;
    payload.totalLikeCount = data.totalLikeCount || 0;
    connectionState.likes = data.totalLikeCount || connectionState.likes;
    logEvent("like", payload);
    io.emit("like", payload);
  });

  // ─── Member Join ───
  connection.on("member", (data) => {
    markActivity();
    const payload = formatUser(data);
    payload.actionId = data.actionId;
    payload.label = data.label || "joined";
    logEvent("member", payload);
    io.emit("member", payload);
  });

  // ─── Social Events (follow, share) ───
  connection.on("social", (data) => {
    markActivity();
    const payload = formatUser(data);
    payload.displayType = data.displayType || "";
    payload.label = data.label || "";
    logEvent("social", payload);
    io.emit("social", payload);

    // Also emit specific sub-events
    if (payload.displayType?.includes("follow")) {
      const uId = (payload.uniqueId || "").toLowerCase();
      if (uId) knownFollowers.add(uId);
      if (payload.userId) knownFollowers.add(payload.userId.toString());
      payload.isFollower = true;
      payload.followRole = payload.followRole || 1;
      logEvent("follow", payload);
      io.emit("follow", payload);
    }
    if (payload.displayType?.includes("share")) {
      logEvent("share", payload);
      io.emit("share", payload);
    }
  });

  // Direct follow event if emitted by connector
  connection.on("follow", (data) => {
    markActivity();
    const payload = formatUser(data);
    const uId = (payload.uniqueId || "").toLowerCase();
    if (uId) knownFollowers.add(uId);
    if (payload.userId) knownFollowers.add(payload.userId.toString());
    payload.isFollower = true;
    payload.followRole = payload.followRole || 1;
    logEvent("follow", payload);
    io.emit("follow", payload);
  });

  // ─── Room Stats ───
  connection.on("roomUser", (data) => {
    markActivity();
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
    markActivity();
    const payload = formatUser(data);
    payload.questionText = data.questionText || "";
    logEvent("questionNew", payload);
    io.emit("questionNew", payload);
  });

  // ─── Emote Chat ───
  connection.on("emote", (data) => {
    markActivity();
    const payload = formatUser(data);
    payload.emoteImageUrl = data.emoteImageUrl || "";
    payload.emoteId = data.emoteId || "";
    logEvent("emote", payload);
    io.emit("emote", payload);
  });

  // ─── Envelope / Treasure Box ───
  connection.on("envelope", (data) => {
    markActivity();
    const payload = formatUser(data);
    payload.coins = data.coins || 0;
    payload.canOpen = data.canOpen || 0;
    payload.timestamp = data.timestamp || Date.now();
    logEvent("envelope", payload);
    io.emit("envelope", payload);
  });

  // ─── Subscribe ───
  connection.on("subscribe", (data) => {
    markActivity();
    const payload = formatUser(data);
    payload.subMonth = data.subMonth || 0;
    logEvent("subscribe", payload);
    io.emit("subscribe", payload);
  });

  // ─── Link Mic Battle ───
  connection.on("linkMicBattle", (data) => {
    markActivity();
    logEvent("linkMicBattle", data);
    io.emit("linkMicBattle", data);
  });

  // ─── Link Mic Armies ───
  connection.on("linkMicArmies", (data) => {
    markActivity();
    logEvent("linkMicArmies", data);
    io.emit("linkMicArmies", data);
  });

  // ─── Live Intro ───
  connection.on("liveIntro", (data) => {
    markActivity();
    logEvent("liveIntro", data);
    io.emit("liveIntro", data);
  });

  // ─── Barrage ───
  connection.on("barrage", (data) => {
    markActivity();
    const payload = formatUser(data);
    payload.caption = data.caption || "";
    logEvent("barrage", payload);
    io.emit("barrage", payload);
  });

  // ─── Stream End ───
  connection.on("streamEnd", (actionId) => {
    console.log(`[TikTok] Stream ended (action: ${actionId})`);
    stopWatchdog();
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    connectionState.status = "disconnected";
    connectionState.error = "Stream ended";
    io.emit("streamEnd", { actionId });
    io.emit("tiktokDisconnected", "tiktok.live_ended");
    io.emit("statusUpdate", getStatusPayload());
  });

  // ─── WebSocket Connected ───
  connection.on("websocketConnected", (wsState) => {
    markActivity();
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

    if (!isManualDisconnect) {
      scheduleAutoReconnect("tiktok.disconnected_event");
    }
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
  const userObj = data.user || data;
  
  // Extract avatar URL from various possible structures in v1 and v2
  let avatar = data.profilePictureUrl || userObj.profilePictureUrl;
  if (!avatar && userObj.profilePicture?.url?.length) {
    avatar = userObj.profilePicture.url[0] || userObj.profilePicture.url[userObj.profilePicture.url.length - 1];
  }
  if (!avatar && userObj.avatarThumb?.urlList?.length) {
    avatar = userObj.avatarThumb.urlList[0];
  }
  if (!avatar && userObj.avatarUrl) {
    avatar = userObj.avatarUrl;
  }

  const uniqueId = userObj.uniqueId || data.uniqueId || null;
  const uniqueIdLower = (uniqueId || "").toLowerCase();
  const userId = userObj.userId?.toString() || data.userId?.toString() || null;

  // Extract userIdentity from WebcastChatMessage (TikTok protobuf field 18)
  const userIdentity = data.userIdentity || userObj.userIdentity || {};

  const isModerator = Boolean(
    userObj.isModerator ||
    data.isModerator ||
    userIdentity.isModeratorOfAnchor
  );

  const isSubscriber = Boolean(
    userObj.isSubscriber ||
    data.isSubscriber ||
    userIdentity.isSubscriberOfAnchor
  );

  const teamMemberLevel = userObj.teamMemberLevel || data.teamMemberLevel || 0;
  const isFan = teamMemberLevel > 0;

  const isMutual = Boolean(
    userIdentity.isMutualFollowingWithAnchor ||
    data.isMutualFollowingWithAnchor ||
    userObj.isMutualFollowingWithAnchor
  );

  const isFollowerOfAnchor = Boolean(
    userIdentity.isFollowerOfAnchor ||
    data.isFollowerOfAnchor ||
    userObj.isFollowerOfAnchor ||
    isMutual
  );

  const rawFollowRole = Number(
    userObj.followInfo?.followStatus ??
    userObj.followRole ??
    data.followRole ??
    data.followInfo?.followStatus ??
    0
  );
  const hasFollowRole = (rawFollowRole === 1 || rawFollowRole === 2);

  const isCachedFollower = Boolean(
    (uniqueIdLower && knownFollowers.has(uniqueIdLower)) ||
    (userId && knownFollowers.has(userId))
  );

  const isFollower = Boolean(
    userObj.isFollower ||
    data.isFollower ||
    isFollowerOfAnchor ||
    hasFollowRole ||
    isCachedFollower ||
    isSubscriber ||
    isFan ||
    isModerator
  );

  // Cache follower for this session
  if (isFollower) {
    if (uniqueIdLower) knownFollowers.add(uniqueIdLower);
    if (userId) knownFollowers.add(userId);
  }

  let followRole = rawFollowRole;
  if (!followRole || followRole === 0) {
    if (isMutual) {
      followRole = 2;
    } else if (isFollower) {
      followRole = 1;
    }
  }

  return {
    userId: userId,
    secUid: userObj.secUid || null,
    uniqueId: uniqueId,
    nickname: userObj.nickname || uniqueId || "Anonymous",
    profilePictureUrl: avatar || null,
    followRole: followRole,
    isFollower: isFollower,
    isFollowerOfAnchor: isFollowerOfAnchor,
    userIdentity: userIdentity,
    userBadges: userObj.userBadges || data.userBadges || [],
    isModerator: isModerator,
    isNewGifter: userObj.isNewGifter || data.isNewGifter || false,
    isSubscriber: isSubscriber,
    topGifterRank: userObj.topGifterRank || data.topGifterRank || null,
    gifterLevel: userObj.gifterLevel || data.gifterLevel || 0,
    teamMemberLevel: teamMemberLevel,
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
║   Web & Socket.IO : http://localhost:${PORT}             ║
║   Dashboard       : http://localhost:${PORT}/dashboard   ║
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
