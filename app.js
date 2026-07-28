// Auto-detect hostname so it works on other devices in the same WiFi
const SOCKET_URL = window.location.protocol + "//" + window.location.hostname + ":9200";
// Max visible rows on board — per mode, configurable via Settings
const DISPLAY_ROWS_DEFAULT = { wordle: 6, word500: 8, word600: 8 };
const DISPLAY_ROWS_MIN = 3;
const DISPLAY_ROWS_MAX = 12;
let displayRowsWordle  = parseInt(localStorage.getItem('displayRows_wordle'))  || DISPLAY_ROWS_DEFAULT.wordle;
let displayRowsWord500 = parseInt(localStorage.getItem('displayRows_word500')) || DISPLAY_ROWS_DEFAULT.word500;
let displayRowsWord600 = parseInt(localStorage.getItem('displayRows_word600')) || DISPLAY_ROWS_DEFAULT.word600;

function getDisplayRows() {
  if (currentGameMode === 'fillblanks') return 6;
  if (currentGameMode === 'wordtango') return 4;
  if (currentGameMode === 'word500') return displayRowsWord500;
  if (currentGameMode === 'word600') return displayRowsWord600;
  if (currentGameMode === 'wordloop') return 6;
  return displayRowsWordle;
}

function changeDisplayRows(delta, e) {
  if (e) e.stopPropagation();
  if (currentGameMode === 'word500') {
    displayRowsWord500 = Math.min(DISPLAY_ROWS_MAX, Math.max(DISPLAY_ROWS_MIN, displayRowsWord500 + delta));
    localStorage.setItem('displayRows_word500', displayRowsWord500);
  } else if (currentGameMode === 'word600') {
    displayRowsWord600 = Math.min(DISPLAY_ROWS_MAX, Math.max(DISPLAY_ROWS_MIN, displayRowsWord600 + delta));
    localStorage.setItem('displayRows_word600', displayRowsWord600);
  } else {
    displayRowsWordle = Math.min(DISPLAY_ROWS_MAX, Math.max(DISPLAY_ROWS_MIN, displayRowsWordle + delta));
    localStorage.setItem('displayRows_wordle', displayRowsWordle);
  }
  updateDisplayRowsUI();
  // Re-render board immediately
  if (currentGameMode === 'word500' || currentGameMode === 'word600') {
    renderWord500Board();
  } else {
    initBoard();
  }
}

function updateDisplayRowsUI() {
  const label = document.getElementById('displayRowsLabel');
  if (label) label.textContent = getDisplayRows();
}

let boardScale = parseInt(localStorage.getItem('board_scale')) || 100;

function changeBoardScale(delta, e) {
  if (e) e.stopPropagation();
  boardScale = Math.min(140, Math.max(60, boardScale + delta));
  localStorage.setItem('board_scale', boardScale);
  updateBoardScaleUI();
}

function updateBoardScaleUI() {
  const label = document.getElementById('boardScaleLabel');
  if (label) label.textContent = boardScale + '%';

  let baseWidth = 420;
  if (currentGameMode === 'word500' || currentGameMode === 'word600') {
    baseWidth = 540;
  } else {
    const baseWidths = { 3: 280, 4: 350, 5: 420, 6: 460, 7: 500, 8: 540 };
    baseWidth = baseWidths[WORD_LENGTH] || 420;
  }
  const finalWidth = Math.round(baseWidth * (boardScale / 100));
  document.documentElement.style.setProperty('--board-max-width', finalWidth + 'px');
  document.documentElement.style.setProperty('--board-scale', (boardScale / 100));
}

const urlParams = new URLSearchParams(window.location.search);
let WORD_LENGTH = 5;
document.documentElement.style.setProperty('--word-length', WORD_LENGTH);

// Game Mode State: 'wordle' or 'word500'
let currentGameMode = sessionStorage.getItem('wordle_gameMode') || '';

function getMaxGuesses() {
  return (currentGameMode === 'word500' || currentGameMode === 'word600') ? Infinity : 6;
}

class IndoFinitySocket {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.listeners = {};
    this.connected = false;
    this._isIndoFinity = true;

    this.ws.onopen = () => {
      this.connected = true;
      console.log('[IndoFinity] WebSocket connected to', url);
      
      // Fire 'connect' listeners but skip any connect-tiktok emit (handled via emit override)
      if (this.listeners['connect']) this.listeners['connect'].forEach(cb => cb());
      
      // Simulate the statusUpdate 'connected' that setupSocketListeners expects
      setTimeout(() => {
        if (this.listeners['statusUpdate']) {
          this.listeners['statusUpdate'].forEach(cb => cb({
            status: 'connected',
            uniqueId: 'IndoFinity'
          }));
        }
        if (this.listeners['tiktokConnected']) {
          this.listeners['tiktokConnected'].forEach(cb => cb({ uniqueId: 'IndoFinity' }));
        }
      }, 100);
    };

    this.ws.onmessage = (msg) => {
      try {
        const payload = JSON.parse(msg.data);
        const event = payload.event;
        const data = payload.data;
        if (this.listeners[event]) {
          this.listeners[event].forEach(cb => cb(data));
        }
      } catch (e) {
        console.error('[IndoFinity] Error parsing message', e);
      }
    };

    this.ws.onclose = () => {
      this.connected = false;
      console.log('[IndoFinity] WebSocket closed');
      // Don't fire 'disconnect' to avoid triggering Socket.IO reconnect logic
    };
    
    this.ws.onerror = (err) => {
      console.error('[IndoFinity] WebSocket error:', err);
    };
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    // IndoFinity doesn't need connect-tiktok or any server emits, silently ignore
  }
}

// State
let socket = null;
let localSocket = null; // Dedicated connection to local node server for music features

let currentWord = "";
let guesses = [];
let knownAbsentLetters = new Set();
// Word Grid state
let wgCluesRow = [];
let wgCluesCol = [];
let wgGrid = []; // 3x3 array of { word, username, profilePic }
let wgDictionaryCache = {}; // Cache of valid words per cell
let isGameOver = false;
let isProcessing = false;
let round = 1;
let currentBg = 'nature'; // 'nature' or 'city'
let isDynamicBg = localStorage.getItem('wordle_dynamicBg') !== 'false'; // default: true

let isBadWordsFilterOn = localStorage.getItem('wordle_badWordsFilter') !== 'false';
const STOPWORDS = [
  "ANJING", "BABI", "BANGSAT", "KONTOL", "MEMEK", "JEMBUT", "NGENTOT", "PELACUR", "LONTE", "ASU", "JANCUK", "GOBLOK", "TOLOL", "BAJINGAN", "TAIK", "BERAK", "PEJU", "NGACENG", "SANGE", "MEKI", "KNTL", "NGWE", "ANJGN",
  "SLOT", "JUDI", "GACOR", "ZEUS", "POKER", "TOGEL", "ROLET", "SCATTER", "MAXWIN", "RUNGKAD", "DEPO", "WD", "SLOTER", "PRAGMATIC"
];

window.toggleBadWords = function(checked) {
  isBadWordsFilterOn = checked;
  localStorage.setItem('wordle_badWordsFilter', isBadWordsFilterOn);
};

let isLikeRestartEnabled = localStorage.getItem('wordle_likeRestart') === 'true';
let likeRestartThreshold = parseInt(localStorage.getItem('wordle_likeThreshold')) || 1000;
let isAutoFullscreen = localStorage.getItem('wordle_autoFullscreen') !== 'false';
let currentLikes = 0;

window.toggleLikeRestart = function(checked) {
  isLikeRestartEnabled = checked;
  localStorage.setItem('wordle_likeRestart', checked);
  const container = document.getElementById('likeThresholdContainer');
  const progressContainer = document.getElementById('likeProgressContainer');
  if (container) container.style.display = checked ? 'block' : 'none';
  if (progressContainer) progressContainer.style.display = checked ? 'block' : 'none';
  updateLikeProgressBar();
};

let isHeartFlurryEnabled = localStorage.getItem('wordle_heartFlurryEnabled') !== 'false';
window.toggleHeartFlurry = function(checked) {
  isHeartFlurryEnabled = checked;
  localStorage.setItem('wordle_heartFlurryEnabled', checked);
};

let isMarqueeEnabled = localStorage.getItem('wordle_marqueeEnabled') !== 'false';
let playerLikes = {};
let playerShares = {};
let playerGifts = {};
let playerActivePresence = {}; // { username: { accumulatedTime: seconds, lastActiveTime: ms } }
let pendingMarqueeHTML = "";

window.toggleMarquee = function(checked) {
  isMarqueeEnabled = checked;
  localStorage.setItem('wordle_marqueeEnabled', checked);
  updateMarqueeUI(true);
};

function initTrackers() {
  playerLikes = {};
  playerShares = {};
  playerGifts = {};
  playerActivePresence = {};
  const prefix = 'pts_'; // Selalu gunakan prefix global agar Top Liker tidak terreset saat ganti game mode
  const likePrefix = prefix + 'like_';
  const sharePrefix = prefix + 'share_';
  const giftPrefix = prefix + 'gift_';
  const activePrefix = prefix + 'active_';
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      if (key.startsWith(likePrefix)) {
        const username = key.substring(likePrefix.length);
        const count = parseInt(localStorage.getItem(key)) || 0;
        playerLikes[username] = count;
      } else if (key.startsWith(sharePrefix)) {
        const username = key.substring(sharePrefix.length);
        const count = parseInt(localStorage.getItem(key)) || 0;
        playerShares[username] = count;
      } else if (key.startsWith(giftPrefix)) {
        const username = key.substring(giftPrefix.length);
        const count = parseInt(localStorage.getItem(key)) || 0;
        playerGifts[username] = count;
      } else if (key.startsWith(activePrefix)) {
        const username = key.substring(activePrefix.length);
        const count = parseInt(localStorage.getItem(key)) || 0;
        playerActivePresence[username] = {
          accumulatedTime: count,
          lastEventTime: null,
          lastUpdateTime: null
        };
      }
    }
  }
  updateMarqueeUI(true);
}

function getTop3(trackerObject) {
  return Object.entries(trackerObject)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([username, count]) => ({ username, count }));
}

function getTopActiveViewers() {
  const data = [];
  for (const username in playerActivePresence) {
    const time = playerActivePresence[username].accumulatedTime;
    if (time > 0) {
      data.push({ username, count: time });
    }
  }
  return data
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);
}

function formatActiveTime(seconds) {
  if (seconds < 60) return `${seconds}d`; // detik
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`; // menit
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours}j`; // jam
  return `${hours}j ${remainingMinutes}m`;
}

function recordActivity(username, profilePictureUrl = null) {
  if (!username) return;
  const now = Date.now();
  
  if (profilePictureUrl) {
    try { localStorage.setItem('pts_avatar_' + username, profilePictureUrl); } catch(e) {}
  }

  if (!playerActivePresence[username]) {
    const savedTime = parseInt(localStorage.getItem('pts_active_' + username) || '0');
    playerActivePresence[username] = {
      accumulatedTime: savedTime,
      lastEventTime: now,
      lastUpdateTime: now
    };
  } else {
    const presence = playerActivePresence[username];
    presence.lastEventTime = now;
    if (!presence.lastUpdateTime) {
      presence.lastUpdateTime = now;
    }
  }
}

// Background timer to periodically update active presence
setInterval(() => {
  const now = Date.now();
  let updated = false;
  for (const username in playerActivePresence) {
    const presence = playerActivePresence[username];
    if (presence.lastEventTime && presence.lastUpdateTime) {
      const timeSinceLastEvent = now - presence.lastEventTime;
      const timeSinceLastUpdate = now - presence.lastUpdateTime;
      
      if (timeSinceLastEvent <= 300000) { // 5 minutes active window
        const elapsedSec = Math.round(timeSinceLastUpdate / 1000);
        if (elapsedSec > 0) {
          presence.accumulatedTime += elapsedSec;
          presence.lastUpdateTime = now;
          localStorage.setItem('pts_active_' + username, presence.accumulatedTime);
          updated = true;
        }
      } else {
        presence.lastUpdateTime = now;
      }
    }
  }
  if (updated) {
    updateMarqueeUI();
  }
}, 10000);

function applyMarqueeAnimationProps(contentEl, marqueeContainer) {
  const speed = 65; // pixels/sec
  const containerWidth = marqueeContainer.clientWidth || 420;
  
  contentEl.style.setProperty('--marquee-start', `${containerWidth}px`);
  
  const textWidth = contentEl.scrollWidth || 500;
  const duration = (containerWidth + textWidth) / speed;
  
  contentEl.style.animation = 'none';
  contentEl.offsetHeight; // trigger reflow
  contentEl.style.animation = `marquee-scroll ${duration}s linear infinite`;
}

function formatShortNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '').replace('.', ',') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '').replace('.', ',') + 'K';
  return num;
}

function updateMarqueeUI(forceImmediate = false) {
  const marqueeContainer = document.getElementById('marqueeContainer');
  if (!marqueeContainer) return;
  
  if (!isMarqueeEnabled) {
    marqueeContainer.style.display = 'none';
    return;
  }
  
  const topLikers = getTop3(playerLikes);
  const topSharers = getTop3(playerShares);
  const topGifters = getTop3(playerGifts);
  const topActiveViewers = getTopActiveViewers();
  
  let likerText = "❤️ TOP LIKERS: ";
  if (topLikers.length > 0) {
    likerText += topLikers.map((u, i) => `${i + 1}. <span class="highlight">${u.username}</span> ${formatShortNumber(u.count)}💖`).join(" &nbsp;&nbsp;&nbsp;");
  } else {
    likerText += `<span class="highlight">-</span>`;
  }
  
  let sharerText = "🚀 TOP SHARERS: ";
  if (topSharers.length > 0) {
    sharerText += topSharers.map((u, i) => `${i + 1}. <span class="highlight">${u.username}</span> ${formatShortNumber(u.count)}🚀`).join(" &nbsp;&nbsp;&nbsp;");
  } else {
    sharerText += `<span class="highlight">-</span>`;
  }

  let gifterText = "🎁 TOP GIFTERS: ";
  if (topGifters.length > 0) {
    gifterText += topGifters.map((u, i) => `${i + 1}. <span class="highlight">${u.username}</span> ${formatShortNumber(u.count)}🪙`).join(" &nbsp;&nbsp;&nbsp;");
  } else {
    gifterText += `<span class="highlight">-</span>`;
  }

  let activeViewerText = "👑 TOP ACTIVE VIEWERS: ";
  if (topActiveViewers.length > 0) {
    activeViewerText += topActiveViewers.map((u, i) => `${i + 1}. <span class="highlight">${u.username}</span> ${formatActiveTime(u.count)}`).join(" &nbsp;&nbsp;&nbsp;");
  } else {
    activeViewerText += `<span class="highlight">-</span>`;
  }
  
  const newHTML = `${gifterText} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${likerText} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${sharerText} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${activeViewerText}`;
  
  const contentEl = document.getElementById('marqueeContent');
  if (!contentEl) return;
  
  const isCurrentlyEmpty = !contentEl.innerHTML || contentEl.innerHTML === "";
  const isContainerHidden = marqueeContainer.style.display === 'none';
  
  if (forceImmediate || isCurrentlyEmpty || isContainerHidden) {
    contentEl.innerHTML = newHTML;
    applyMarqueeAnimationProps(contentEl, marqueeContainer);
    pendingMarqueeHTML = "";
  } else {
    pendingMarqueeHTML = newHTML;
  }
  
  marqueeContainer.style.display = 'flex';
}

window.updateLikeThreshold = function(val) {
  let num = parseInt(val);
  if (isNaN(num) || num < 10) num = 1000;
  likeRestartThreshold = num;
  localStorage.setItem('wordle_likeThreshold', num);
  updateLikeProgressBar();
};

function updateLikeProgressBar() {
  const container = document.getElementById('likeProgressContainer');
  const fill = document.getElementById('likeProgressBarFill');
  const text = document.getElementById('likeProgressText');
  
  const mContainer = document.getElementById('multiLikeProgressContainer');
  const mFill = document.getElementById('multiLikeProgressBarFill');
  const mText = document.getElementById('multiLikeProgressText');

  if (!isLikeRestartEnabled) {
    if (container) container.style.display = 'none';
    if (mContainer) mContainer.style.display = 'none';
    return;
  }
  
  const percentage = Math.min(100, (currentLikes / likeRestartThreshold) * 100);
  const textVal = `${currentLikes} / ${likeRestartThreshold}`;

  if (container && fill && text) {
    container.style.display = 'block';
    fill.style.width = `${percentage}%`;
    text.textContent = textVal;
  }

  if (mContainer && mFill && mText) {
    mContainer.style.display = 'block';
    mFill.style.width = `${percentage}%`;
    mText.textContent = textVal;
  }
}

// ═══════════════════════════════════════
//         HEART FLURRY ANIMATION
// ═══════════════════════════════════════
const HEART_EMOJIS = ['❤️', '💖', '💗', '💕', '💓', '💘', '💝', '🩷', '🤍', '💜'];
const MAX_HEARTS_ON_SCREEN = 18;

function spawnHeartFlurry(count) {
  if (!isHeartFlurryEnabled) return;
  const container = document.getElementById('heartFlurryContainer');
  if (!container) return;

  for (let i = 0; i < count; i++) {
    // Performance cap: if already full, don't spawn new ones to save CPU
    if (container.children.length >= MAX_HEARTS_ON_SCREEN) {
      break;
    }

    const heart = document.createElement('span');
    heart.className = 'heart-particle';
    heart.textContent = HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)];

    // Randomize position and physics
    const xPos = Math.random() * 60;
    const duration = 2 + Math.random() * 1.5;
    const delay = i * 0.08;
    const size = 20 + Math.random() * 18;

    heart.style.left = `${xPos}px`;
    heart.style.fontSize = `${size}px`;
    heart.style.setProperty('--duration', `${duration}s`);
    heart.style.setProperty('--delay', `${delay}s`);
    heart.style.setProperty('--drift1', `${(Math.random() - 0.5) * 30}px`);
    heart.style.setProperty('--drift2', `${(Math.random() - 0.5) * 40}px`);
    heart.style.setProperty('--drift3', `${(Math.random() - 0.5) * 30}px`);
    heart.style.setProperty('--drift4', `${(Math.random() - 0.5) * 20}px`);
    heart.style.setProperty('--rot1', `${(Math.random() - 0.5) * 30}deg`);
    heart.style.setProperty('--rot2', `${(Math.random() - 0.5) * 40}deg`);
    heart.style.setProperty('--rot3', `${(Math.random() - 0.5) * 30}deg`);
    heart.style.setProperty('--rot4', `${(Math.random() - 0.5) * 50}deg`);

    container.appendChild(heart);

    // Remove after animation completes
    setTimeout(() => {
      if (heart.parentNode) heart.parentNode.removeChild(heart);
    }, (duration + delay) * 1000 + 200);
  }
}

// Like counter widget state
let totalSessionLikes = 0;
let _likeCounterHideTimer = null;

function updateLikeCounter(data, addedLikes) {
  totalSessionLikes += addedLikes;
  
  const widget = document.getElementById('likeCounterWidget');
  const avatarEl = document.getElementById('likeCounterAvatar');
  const totalEl = document.getElementById('likeCounterTotal');
  const nameEl = document.getElementById('likeCounterName');
  if (!widget) return;

  // Show widget
  widget.style.display = 'flex';

  // Format count
  const formatted = totalSessionLikes >= 1000 
    ? `${(totalSessionLikes / 1000).toFixed(1)}k` 
    : totalSessionLikes;
  totalEl.textContent = `❤️ ${formatted}`;

  // Update last liker info
  const nickname = data.nickname || data.uniqueId || '';
  const avatar = data.profilePictureUrl || '';
  if (nickname) nameEl.textContent = nickname;
  if (avatar && avatarEl) {
    avatarEl.src = avatar;
    avatarEl.style.display = 'block';
  } else {
    if (avatarEl) avatarEl.style.display = 'none';
  }

  // Pop animation
  widget.classList.remove('pop');
  void widget.offsetWidth; // Force reflow
  widget.classList.add('pop');

  // Auto-hide after 5s of no likes
  if (_likeCounterHideTimer) clearTimeout(_likeCounterHideTimer);
  _likeCounterHideTimer = setTimeout(() => {
    widget.style.display = 'none';
  }, 5000);
}

let isWaitingForLikes = false;

window.executeRestartTransition = function() {
  if (!isWaitingForLikes) return; // Prevent double trigger
  isWaitingForLikes = false;
  
  const winOverlay = document.getElementById('winOverlay');
  if (winOverlay) winOverlay.classList.remove('show');
  
  const multiWinOverlay = document.getElementById('multiWinOverlay');
  if (multiWinOverlay) multiWinOverlay.classList.remove('show');
  
  const board = document.getElementById('board');
  if (board) board.classList.add('board-transitioning');
  
  setTimeout(() => {
    round++;
    startNewRound();
    requestAnimationFrame(() => {
      if (board) board.classList.remove('board-transitioning');
    });
  }, 600);
};

function triggerWinTransition(winDuration, isMultiWinner = false) {
  const overlayId = isMultiWinner ? 'multiWinOverlay' : 'winOverlay';
  const footerId = isMultiWinner ? 'multiWinFooter' : 'winFooter';
  const progressId = isMultiWinner ? 'multiLikeProgressContainer' : 'likeProgressContainer';

  const activeOverlay = document.getElementById(overlayId);
  const activeFooter = document.getElementById(footerId);
  const activeProgress = document.getElementById(progressId);
  
  if (activeOverlay) activeOverlay.classList.add('show');
  if (window.playHostAudio) playHostAudio('win');
  
  if (isLikeRestartEnabled) {
    isWaitingForLikes = true;
    currentLikes = 0;
    if (activeFooter) activeFooter.style.display = 'none';
    if (activeProgress) activeProgress.style.display = 'block';
    updateLikeProgressBar();
  } else {
    isWaitingForLikes = false;
    if (activeFooter) activeFooter.style.display = 'block';
    if (activeProgress) activeProgress.style.display = 'none';
    
    // Automatically restart after the defined duration if no likes required
    setTimeout(() => {
      // Set to true temporarily so executeRestartTransition works
      isWaitingForLikes = true;
      executeRestartTransition();
    }, winDuration);
  }
}

let TARGET_WORDS = [];
let VALID_WORDS = [];
let availableWords = [];
let discoveredLetters = [];
let bestGuess = null;
let word500History = []; // { word, c, p, a, score, userData }
let word500PendingInvalidRow = null; // baris invalid yang sedang tampil di board (Word500/600)
let fillBlanksTargets = [];
let wordTangoTargets = []; // { word, length, missingIndices, solved, solver, points }
let wordTangoPool = []; // { id, char, used }
let ytPlayer = null;
let musicQueue = [];
let activeMusic = null;
let isMusicPlaying = false;
let musicSettings = { maxGlobal: 20, maxUser: 2, maxDuration: 6, bannedKeywords: [], volume: 50, requestsEnabled: true };
try {
  const saved = localStorage.getItem('music_settings');
  if (saved) {
    musicSettings = JSON.parse(saved);
    if (musicSettings.volume === undefined) musicSettings.volume = 50;
    if (musicSettings.requestsEnabled === undefined) musicSettings.requestsEnabled = true;
  }
} catch(e) {}
let lastUsername = "";
let lastLang = "";
let lastSessionId = "";
let reconnectTimer = null;
let isConnectedToTikTok = false;
let hasPlayedCloseAudio = false;

// Leaderboard State
let playerPoints = {};
let currentLbTab = 'session';

function getPtsPrefix() {
  if (currentGameMode === 'word500') return 'pts_w500_';
  if (currentGameMode === 'word600') return 'pts_w600_';
  if (currentGameMode === 'wordloop') return 'pts_wloop_';
  if (currentGameMode === 'fillblanks') return 'pts_fill_';
  if (currentGameMode === 'wordtango') return 'pts_tango_';
  if (currentGameMode === 'wordgrid') return 'pts_wgrid_';
  return 'pts_';
}

// Memuat data harian & mingguan ke memori saat halaman dimuat
function initWeeklyLeaderboard() {
  playerPoints = {};
  const prefix = getPtsPrefix();
  const dailyPrefix = prefix + 'daily_';
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      if (prefix === 'pts_' && (key.startsWith('pts_w500_') || key.startsWith('pts_w600_') || key.startsWith('pts_wloop_') || key.startsWith('pts_fill_') || key.startsWith('pts_tango_') || key.startsWith('pts_wgrid_'))) continue;
      
      if (key.startsWith(prefix + 'like_') || 
          key.startsWith(prefix + 'share_') || 
          key.startsWith(prefix + 'gift_') || 
          key.startsWith(prefix + 'active_') || 
          key.startsWith(prefix + 'avatar_')) continue;
      
      if (key.startsWith(dailyPrefix)) {
        const username = key.substring(dailyPrefix.length);
        const pts = parseInt(localStorage.getItem(key)) || 0;
        if (!playerPoints[username]) {
          playerPoints[username] = {
            avatar: 'assets/bg_nature.png',
            sessionPts: pts,
            weeklyPts: 0
          };
        } else {
          playerPoints[username].sessionPts = pts;
        }
      } else {
        const username = key.substring(prefix.length);
        const pts = parseInt(localStorage.getItem(key)) || 0;
        if (!playerPoints[username]) {
          playerPoints[username] = {
            avatar: 'assets/bg_nature.png',
            sessionPts: 0,
            weeklyPts: pts
          };
        } else {
          playerPoints[username].weeklyPts = pts;
        }
      }
    }
  }
  renderLeaderboard();
  initTrackers();
}
initWeeklyLeaderboard();

function getWeeklyPts(username) {
  return parseInt(localStorage.getItem(getPtsPrefix() + username) || '0');
}
function saveWeeklyPts(username, pts) {
  localStorage.setItem(getPtsPrefix() + username, pts);
}

function getDailyPts(username) {
  return parseInt(localStorage.getItem(getPtsPrefix() + 'daily_' + username) || '0');
}
function saveDailyPts(username, pts) {
  localStorage.setItem(getPtsPrefix() + 'daily_' + username, pts);
}

function addPoints(userData, points) {
  if (!userData || !userData.nickname) return;
  const username = userData.nickname;
  if (userData.profilePictureUrl) {
    try { localStorage.setItem('pts_avatar_' + username, userData.profilePictureUrl); } catch(e) {}
  }
  if (!playerPoints[username]) {
    playerPoints[username] = {
      avatar: userData.profilePictureUrl || 'assets/bg_nature.png',
      sessionPts: getDailyPts(username),
      weeklyPts: getWeeklyPts(username)
    };
  }
  playerPoints[username].sessionPts += points;
  playerPoints[username].weeklyPts += points;
  if (userData.profilePictureUrl) playerPoints[username].avatar = userData.profilePictureUrl;
  saveDailyPts(username, playerPoints[username].sessionPts);
  saveWeeklyPts(username, playerPoints[username].weeklyPts);
  renderLeaderboard();
}

function switchLbTab(tab) {
  currentLbTab = tab;
  document.getElementById('tab-session').classList.toggle('active', tab === 'session');
  document.getElementById('tab-weekly').classList.toggle('active', tab === 'weekly');
  renderLeaderboard();
}

function renderLeaderboard() {
  const lbList = document.getElementById('lbList');
  if (!lbList) return;
  lbList.innerHTML = '';
  
  const sortedPlayers = Object.entries(playerPoints)
    .filter(([_, data]) => data[currentLbTab + 'Pts'] > 0)
    .sort((a, b) => b[1][currentLbTab + 'Pts'] - a[1][currentLbTab + 'Pts'])
    .slice(0, 3); // Top 3
    
  if (sortedPlayers.length === 0) {
    lbList.innerHTML = '<div style="text-align:center;font-size:12px;color:rgba(255,255,255,0.4);padding:10px;">Belum ada tebakan benar</div>';
    return;
  }
  
  sortedPlayers.forEach(([username, data], index) => {
    const item = document.createElement('div');
    item.className = 'lb-item';
    item.innerHTML = `
      <div class="lb-avatar-wrapper">
        <img src="${data.avatar}" class="lb-avatar" onerror="this.src='assets/bg_nature.png'">
        <div class="lb-rank rank-${index + 1}">${index + 1}</div>
      </div>
      <div class="lb-info">
        <span class="lb-name">${username}</span>
        <span class="lb-pts">${data[currentLbTab + 'Pts']} pts</span>
      </div>
    `;
    lbList.appendChild(item);
  });
}

// Auto-switch Leaderboard Tabs every 10 seconds for Live Stream automation
setInterval(() => {
  switchLbTab(currentLbTab === 'session' ? 'weekly' : 'session');
}, 10000);

// YouTube Iframe API setup
function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player('ytPlayerContainer', {
    height: '200',
    width: '200',
    videoId: '',
    playerVars: {
      'autoplay': 1,
      'controls': 0,
      'playsinline': 1,       // Required for iOS inline playback
      'enablejsapi': 1
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange,
      'onError': onPlayerError
    }
  });
}

let ytPlayerReady = false;

function onPlayerReady(event) {
  ytPlayerReady = true;
  event.target.unMute();
  event.target.setVolume(musicSettings.volume);
}

let ytPlayAttempts = 0;
let musicProgressInterval = null;

function formatMusicTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function updateMusicQueueUI() {
  const nextContainer = document.getElementById('musicNextSong');
  const nextName = document.getElementById('musicNextSongName');
  if (musicQueue.length > 0) {
    if (nextContainer && nextName) {
      nextName.textContent = musicQueue[0].title;
      nextContainer.style.display = 'block';
    }
  } else {
    if (nextContainer) nextContainer.style.display = 'none';
  }
}

function showMusicNotif(requesterName, title) {
  const container = document.getElementById('musicNotifContainer');
  if (!container) return;
  
  // Prevent flooding: limit to 1 active notification by clearing the container first
  container.innerHTML = '';
  
  const notif = document.createElement('div');
  notif.className = 'music-notif';
  
  notif.innerHTML = `
    <span class="music-notif-icon">🎵</span>
    <div class="music-notif-content">
      <span><span class="music-notif-user">@${requesterName}</span> requested:</span>
      <span class="music-notif-title">${title}</span>
    </div>
  `;
  
  container.appendChild(notif);
  
  setTimeout(() => {
    if (notif.parentNode === container) {
      container.removeChild(notif);
    }
  }, 3000); // 3 seconds matches CSS animation timing
}

function onPlayerStateChange(event) {
  const vinyl = document.getElementById('musicVinyl');
  const eq = document.getElementById('musicEqualizer');
  
  // If the video ends (state 0), play the next one
  if (event.data == YT.PlayerState.ENDED) {
    ytPlayAttempts = 0;
    if (vinyl) vinyl.classList.remove('playing');
    if (eq) eq.classList.remove('playing');
    clearInterval(musicProgressInterval);
    
    playNextMusic();
  }
  
  if (event.data == YT.PlayerState.PLAYING) {
    ytPlayAttempts = 0;
    if (vinyl) vinyl.classList.add('playing');
    if (eq) eq.classList.add('playing');
    
    clearInterval(musicProgressInterval);
    musicProgressInterval = setInterval(() => {
      if (ytPlayer && ytPlayer.getCurrentTime && ytPlayer.getDuration) {
        const curr = ytPlayer.getCurrentTime();
        const total = ytPlayer.getDuration();
        const timeStr = `${formatMusicTime(curr)} / ${formatMusicTime(total)}`;
        const progElem = document.getElementById('musicTimeProgress');
        if (progElem) progElem.textContent = timeStr;
        
        const fill = document.getElementById('musicProgressFill');
        if (fill && total > 0) {
          fill.style.width = `${(curr / total) * 100}%`;
        }
      }
    }, 1000);
  } else {
    if (vinyl) vinyl.classList.remove('playing');
    if (eq) eq.classList.remove('playing');
    clearInterval(musicProgressInterval);
  }

  // If video is cued but not playing (mobile autoplay blocked), force play (max 3 attempts)
  if (event.data == YT.PlayerState.CUED || event.data == YT.PlayerState.PAUSED) {
    if (ytPlayAttempts < 3) {
      ytPlayAttempts++;
      setTimeout(() => {
        try { ytPlayer.playVideo(); } catch(e) {}
      }, 500);
    } else {
      console.warn("[Music] Autoplay blocked by browser. User interaction required.");
      if (typeof showToast === 'function') {
        showToast("Tolong KLIK layar game 1x agar musik bisa berbunyi!", 5000);
      }
    }
  }
}

function onPlayerError(event) {
  console.warn('[Music] YouTube player error:', event.data);
  
  // Try fallback candidates if available (e.g. lyrics/covers instead of embed-restricted official videos)
  if (activeMusic && activeMusic.candidates && activeMusic.candidates.length > 1) {
    activeMusic.candidates.shift(); // Remove the failed one
    const nextCandidate = activeMusic.candidates[0];
    if (nextCandidate) {
      console.log(`[Music] Trying fallback candidate: ${nextCandidate.title} (${nextCandidate.videoId})`);
      document.getElementById('musicThumb').src = nextCandidate.thumbnail || 'assets/bg_nature.png';
      document.getElementById('musicTitle').textContent = nextCandidate.title;
      const progElem = document.getElementById('musicTimeProgress');
      if (progElem) progElem.textContent = `0:00 / ${nextCandidate.duration || '0:00'}`;
      const fill = document.getElementById('musicProgressFill');
      if (fill) fill.style.width = '0%';
      
      if (ytPlayer && ytPlayer.loadVideoById) {
        ytPlayer.loadVideoById(nextCandidate.videoId);
      }
      return;
    }
  }
  
  // Skip to next song on error (e.g. restricted/unavailable video)
  setTimeout(() => playNextMusic(), 1000);
}

function playNextMusic() {
  if (!ytPlayerReady || !ytPlayer || !ytPlayer.loadVideoById) {
    // If API isn't ready yet, retry in 500ms
    setTimeout(playNextMusic, 500);
    return;
  }

  const hostSkipBtn = document.getElementById('hostSkipBtn');
  
  if (musicQueue.length === 0) {
    isMusicPlaying = false;
    document.getElementById('musicWidget').classList.remove('show');
    if (hostSkipBtn) hostSkipBtn.style.display = 'none';
    if (ytPlayer && ytPlayer.stopVideo) {
      try { ytPlayer.stopVideo(); } catch(e) {}
    }
    return;
  }
  
  isMusicPlaying = true;
  if (hostSkipBtn) hostSkipBtn.style.display = 'flex';
  
  activeMusic = musicQueue.shift();
  updateMusicQueueUI();
  
  document.getElementById('musicThumb').src = activeMusic.thumbnail || 'assets/bg_nature.png';
  document.getElementById('musicTitle').textContent = activeMusic.title;
  document.getElementById('musicRequester').textContent = `@${activeMusic.requesterName}`;
  
  const progElem = document.getElementById('musicTimeProgress');
  if (progElem) progElem.textContent = `0:00 / ${activeMusic.duration || '0:00'}`;
  
  const fill = document.getElementById('musicProgressFill');
  if (fill) fill.style.width = '0%';
  
  document.getElementById('musicWidget').classList.add('show');
  
  if (ytPlayer && ytPlayer.loadVideoById) {
    ytPlayer.unMute();
    ytPlayer.setVolume(musicSettings.volume);
    ytPlayer.loadVideoById(activeMusic.videoId);
  }
}

// Fetch words on load
let wordsLoaded = false;
let allTargetWords = { 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] };
let allValidWords = { 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] };
let allAvailableWords = { 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] };
let fullValidDictionary = new Set();

function loadWordLists(lang) {
  return new Promise((resolve, reject) => {
    let fetches = [];
    if (lang === 'mixed') {
      fetches = [
        Promise.all([fetch(`wordlist/target_words_3.txt`).then(r => r.text()).catch(()=>""), fetch(`wordlist/target_words_id_3.txt`).then(r => r.text()).catch(()=>"")]).then(r => r[0] + '\n' + r[1]),
        Promise.all([fetch(`wordlist/valid_words_3.txt`).then(r => r.text()).catch(()=>""), fetch(`wordlist/valid_words_id_3.txt`).then(r => r.text()).catch(()=>"")]).then(r => r[0] + '\n' + r[1]),
        Promise.all([fetch(`wordlist/target_words_4.txt`).then(r => r.text()).catch(()=>""), fetch(`wordlist/target_words_id_4.txt`).then(r => r.text()).catch(()=>"")]).then(r => r[0] + '\n' + r[1]),
        Promise.all([fetch(`wordlist/valid_words_4.txt`).then(r => r.text()).catch(()=>""), fetch(`wordlist/valid_words_id_4.txt`).then(r => r.text()).catch(()=>"")]).then(r => r[0] + '\n' + r[1]),
        Promise.all([fetch(`wordlist/target_words.txt`).then(r => r.text()), fetch(`wordlist/target_words_id.txt`).then(r => r.text())]).then(r => r[0] + '\n' + r[1]),
        Promise.all([fetch(`wordlist/valid_words.txt`).then(r => r.text()), fetch(`wordlist/valid_words_id.txt`).then(r => r.text())]).then(r => r[0] + '\n' + r[1]),
        Promise.all([fetch(`wordlist/target_words_6.txt`).then(r => r.text()).catch(()=>""), fetch(`wordlist/target_words_id_6.txt`).then(r => r.text()).catch(()=>"")]).then(r => r[0] + '\n' + r[1]),
        Promise.all([fetch(`wordlist/valid_words_6.txt`).then(r => r.text()).catch(()=>""), fetch(`wordlist/valid_words_id_6.txt`).then(r => r.text()).catch(()=>"")]).then(r => r[0] + '\n' + r[1]),
        Promise.all([fetch(`wordlist/target_words_7.txt`).then(r => r.text()).catch(()=>""), fetch(`wordlist/target_words_id_7.txt`).then(r => r.text()).catch(()=>"")]).then(r => r[0] + '\n' + r[1]),
        Promise.all([fetch(`wordlist/valid_words_7.txt`).then(r => r.text()).catch(()=>""), fetch(`wordlist/valid_words_id_7.txt`).then(r => r.text()).catch(()=>"")]).then(r => r[0] + '\n' + r[1]),
        Promise.all([fetch(`wordlist/target_words_8.txt`).then(r => r.text()).catch(()=>""), fetch(`wordlist/target_words_id_8.txt`).then(r => r.text()).catch(()=>"")]).then(r => r[0] + '\n' + r[1]),
        Promise.all([fetch(`wordlist/valid_words_8.txt`).then(r => r.text()).catch(()=>""), fetch(`wordlist/valid_words_id_8.txt`).then(r => r.text()).catch(()=>"")]).then(r => r[0] + '\n' + r[1])
      ];
    } else {
      let suffix = lang === 'en' ? '' : '_id';
      fetches = [
        fetch(`wordlist/target_words${suffix}_3.txt`).then(r => r.text()).catch(() => ""),
        fetch(`wordlist/valid_words${suffix}_3.txt`).then(r => r.text()).catch(() => ""),
        fetch(`wordlist/target_words${suffix}_4.txt`).then(r => r.text()).catch(() => ""),
        fetch(`wordlist/valid_words${suffix}_4.txt`).then(r => r.text()).catch(() => ""),
        fetch(`wordlist/target_words${suffix}.txt`).then(r => r.text()),
        fetch(`wordlist/valid_words${suffix}.txt`).then(r => r.text()),
        fetch(`wordlist/target_words${suffix}_6.txt`).then(r => r.text()).catch(() => ""),
        fetch(`wordlist/valid_words${suffix}_6.txt`).then(r => r.text()).catch(() => ""),
        fetch(`wordlist/target_words${suffix}_7.txt`).then(r => r.text()).catch(() => ""),
        fetch(`wordlist/valid_words${suffix}_7.txt`).then(r => r.text()).catch(() => ""),
        fetch(`wordlist/target_words${suffix}_8.txt`).then(r => r.text()).catch(() => ""),
        fetch(`wordlist/valid_words${suffix}_8.txt`).then(r => r.text()).catch(() => "")
      ];
    }
    
    // FETCH FULL DICTIONARY FOR UNLIMITED LENGTH IN WORD GRID
    if (lang === 'mixed') {
      fetches.push(Promise.all([fetch('wordlist/dictionary.txt').then(r=>r.text()).catch(()=>""), fetch('wordlist/kamus.txt').then(r=>r.text()).catch(()=>"")]).then(r => r[0] + '\n' + r[1]));
    } else if (lang === 'id') {
      fetches.push(fetch('wordlist/kamus.txt').then(r=>r.text()).catch(()=>""));
    } else {
      fetches.push(fetch('wordlist/dictionary.txt').then(r=>r.text()).catch(()=>""));
    }

    Promise.all(fetches).then((results) => {
      const lengths = [3, 4, 5, 6, 7, 8];
      lengths.forEach((len, idx) => {
        const tStr = typeof results[idx * 2] === 'string' ? results[idx * 2] : "";
        const vStr = typeof results[idx * 2 + 1] === 'string' ? results[idx * 2 + 1] : "";
        allTargetWords[len] = tStr.split('\n').map(w => w.trim().toUpperCase()).filter(w => w.length === len);
        const validList = vStr.split('\n').map(w => w.trim().toUpperCase()).filter(w => w.length === len);
        allValidWords[len] = [...new Set([...validList, ...allTargetWords[len]])];
        allAvailableWords[len] = [...allTargetWords[len]];
        shuffleArray(allAvailableWords[len]);
      });

      wordsLoaded = true;
      console.log(`Loaded target words - Length 3: ${allTargetWords[3].length}, 4: ${allTargetWords[4].length}, 5: ${allTargetWords[5].length}, 6: ${allTargetWords[6].length}, 7: ${allTargetWords[7].length}, 8: ${allTargetWords[8].length}`);
      
      const fullDictText = results[results.length - 1] || "";
      fullValidDictionary.clear();
      fullDictText.split('\n').forEach(w => {
         const word = w.trim().toUpperCase();
         if (word.length >= 3) fullValidDictionary.add(word);
      });
      console.log(`Loaded FULL dictionary: ${fullValidDictionary.size} words`);
      
      resolve();
    }).catch(err => {
      console.error("Failed to load wordlists:", err);
      reject(err);
    });
  });
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function getRandomWord() {
  if (TARGET_WORDS.length === 0) return WORD_LENGTH === 5 ? "HELLO" : "RANDOM"; // fallback
  if (availableWords.length === 0) {
    availableWords = [...TARGET_WORDS];
    shuffleArray(availableWords);
    allAvailableWords[WORD_LENGTH] = availableWords;
  }
  return availableWords.pop();
}

// DOM Elements
const gameSelectOverlay = document.getElementById('gameSelectOverlay');
const loginOverlay = document.getElementById('loginOverlay');
const gameContainer = document.getElementById('gameContainer');
const bgLayer = document.getElementById('bgLayer');
const connectBtn = document.getElementById('connectBtn');
const loginStatus = document.getElementById('loginStatus');
const roomHost = document.getElementById('roomHost');
const board = document.getElementById('board');
const toastContainer = document.getElementById('toastContainer');
const roundNumber = document.getElementById('roundNumber');

// ─── Game Selection ───
function selectGame(mode) {
  currentGameMode = mode;
  try { sessionStorage.setItem('wordle_gameMode', mode); } catch(e) {}
  
  initWeeklyLeaderboard();

  // Update login title
  const loginTitle = document.getElementById('loginTitle');
  if (loginTitle) {
    if (mode === 'word500') loginTitle.textContent = window.w500UseMastermind ? 'TIKTOK WORD PEGS 5' : 'TIKTOK WORD500';
    else if (mode === 'word600') loginTitle.textContent = window.w500UseMastermind ? 'TIKTOK WORD PEGS 6' : 'TIKTOK WORD600';
    else if (mode === 'fillblanks') loginTitle.textContent = 'FILL THE BLANKS';
    else if (mode === 'wordtango') loginTitle.textContent = 'WORD TANGO';
    else loginTitle.textContent = 'TIKTOK WORDLE';
  }

  // Hide game select, show login
  gameSelectOverlay.style.display = 'none';
  loginOverlay.style.display = 'flex';
}

function switchGameMode(e) {
  if (e) e.stopPropagation();
  // Close settings
  const dropdown = document.getElementById('settingsDropdown');
  if (dropdown) dropdown.classList.remove('open');

  if (!isConnectedToTikTok && gameContainer.style.display === 'none') {
    currentGameMode = '';
    try { sessionStorage.removeItem('wordle_gameMode'); } catch(e) {}
    loginOverlay.style.display = 'none';
    gameContainer.style.display = 'none';
    gameSelectOverlay.style.display = 'flex';
    return;
  }

  // Seamless switch
  if (currentGameMode === 'wordle') currentGameMode = 'word500';
  else if (currentGameMode === 'word500') currentGameMode = 'word600';
  else if (currentGameMode === 'word600') currentGameMode = 'wordloop';
  else if (currentGameMode === 'wordloop') currentGameMode = 'fillblanks';
  else if (currentGameMode === 'fillblanks') currentGameMode = 'wordtango';
  else if (currentGameMode === 'wordtango') currentGameMode = 'wordgrid';
  else currentGameMode = 'wordle';
  try { sessionStorage.setItem('wordle_gameMode', currentGameMode); } catch(e) {}

  applyGameModeUI();
  initWeeklyLeaderboard();
  startNewRound();
}

function applyGameModeUI() {
  const headerTitle = document.getElementById('headerTitle');
  const hintContainer = document.getElementById('hintContainer');
  const bestGuessContainer = document.getElementById('bestGuessContainer');
  const switchBtn = document.getElementById('switchGameBtn');
  const wordLoopInfoContainer = document.getElementById('wordLoopInfoContainer');
  const wordTangoInfoContainer = document.getElementById('wordTangoInfoContainer');
  const tangoPoolContainer = document.getElementById('tangoPoolContainer');
  const tangoGuessFeed = document.getElementById('tangoGuessFeed');

  const wordGridInfoContainer = document.getElementById('wordGridInfoContainer');
  const wordGridContainer = document.getElementById('wordGridContainer');
  const boardObj = document.getElementById('board');

  if (wordLoopInfoContainer) wordLoopInfoContainer.style.display = 'none';
  if (wordTangoInfoContainer) wordTangoInfoContainer.style.display = 'none';
  if (tangoPoolContainer) tangoPoolContainer.style.display = 'none';
  if (tangoGuessFeed) tangoGuessFeed.style.display = 'none';
  if (wordGridInfoContainer) wordGridInfoContainer.style.display = 'none';
  if (wordGridContainer) wordGridContainer.style.display = 'none';
  if (boardObj) boardObj.style.display = '';

  if (currentGameMode === 'word500' || currentGameMode === 'word600') {
    if (headerTitle) {
      if (currentGameMode === 'word500') {
        headerTitle.textContent = window.w500UseMastermind ? 'WORD PEGS 5' : 'WORD500';
      } else {
        headerTitle.textContent = window.w500UseMastermind ? 'WORD PEGS 6' : 'WORD600';
      }
    }
    if (hintContainer) hintContainer.style.display = 'none';
    if (bestGuessContainer) bestGuessContainer.style.display = 'none'; // replaced by sorted board
    if (switchBtn) {
      const nextName = window.w500UseMastermind ? 'Word Pegs 6' : 'Word600';
      switchBtn.textContent = currentGameMode === 'word500' ? `🔄 Switch to ${nextName}` : '🔄 Switch to Word Loop';
    }
  } else if (currentGameMode === 'wordloop') {
    if (headerTitle) headerTitle.textContent = 'WORD LOOP';
    if (hintContainer) hintContainer.style.display = 'none';
    if (bestGuessContainer) bestGuessContainer.style.display = 'none';
    if (wordLoopInfoContainer) wordLoopInfoContainer.style.display = '';
    if (switchBtn) switchBtn.textContent = '🔄 Switch to Fill Blanks';
  } else if (currentGameMode === 'fillblanks') {
    if (headerTitle) headerTitle.textContent = 'FILL THE BLANKS';
    if (hintContainer) hintContainer.style.display = 'none';
    if (bestGuessContainer) bestGuessContainer.style.display = 'none';
    if (switchBtn) switchBtn.textContent = '🔄 Switch to Word Tango';
  } else if (currentGameMode === 'wordtango') {
    if (headerTitle) headerTitle.textContent = 'WORD TANGO';
    if (hintContainer) hintContainer.style.display = 'none';
    if (bestGuessContainer) bestGuessContainer.style.display = 'none';
    // wordTangoInfoContainer stays hidden — header already shows mode name
    if (tangoPoolContainer) tangoPoolContainer.style.display = 'flex';
    if (tangoGuessFeed) tangoGuessFeed.style.display = 'flex';
    if (switchBtn) switchBtn.textContent = '🔄 Switch to Word Grid';
  } else if (currentGameMode === 'wordgrid') {
    if (headerTitle) headerTitle.textContent = 'WORD GRID';
    if (hintContainer) hintContainer.style.display = 'none';
    if (bestGuessContainer) bestGuessContainer.style.display = 'none';
    if (wordGridInfoContainer) wordGridInfoContainer.style.display = '';
    if (wordGridContainer) wordGridContainer.style.display = 'grid';
    if (boardObj) boardObj.style.display = 'none';
    if (switchBtn) switchBtn.textContent = '🔄 Switch to Wordle';
  } else {
    if (headerTitle) headerTitle.textContent = 'WORDLE';
    if (hintContainer) hintContainer.style.display = '';
    if (bestGuessContainer) bestGuessContainer.style.display = 'none';
    const nextName = window.w500UseMastermind ? 'Word Pegs 5' : 'Word500';
    if (switchBtn) switchBtn.textContent = `🔄 Switch to ${nextName}`;
  }
  updateBoardScaleUI();
}

function updateBestGuessUI() {
  const container = document.getElementById('bestGuessBoard');
  if (!container) return;
  
  if (!bestGuess) {
    container.innerHTML = '<div style="color: rgba(255,255,255,0.4); font-size: 13px; padding: 5px;">Belum ada tebakan valid</div>';
    return;
  }
  
  let html = `<div style="display: grid; grid-template-columns: 1fr repeat(${bestGuess.word.length}, 1fr) repeat(3, 1fr); gap: 8px; width: 100%; align-items: center; justify-items: center; padding-top: 5px;">`;
  
  // Spacer for avatar column
  html += `<div style="min-width: 0; min-height: 0; width: 100%;"></div>`;

  const isAllRed = bestGuess.a === bestGuess.word.length;
  const extraStyle = isAllRed 
    ? 'background-color: rgba(220, 38, 38, 0.25); border: 2px solid rgba(220, 38, 38, 0.4); color: rgba(255, 255, 255, 0.4);' 
    : '';

  for (let i = 0; i < bestGuess.word.length; i++) {
    html += `<div class="tile blind" style="aspect-ratio: 1/1; height: auto; width: 100%; border-radius: 15%; font-size: 1.1rem; min-width: 0; min-height: 0; display:flex; align-items:center; justify-content:center; ${extraStyle}">${bestGuess.word[i]}</div>`;
  }
  if (window.w500UseMastermind) {
    html += `<div class="mastermind-container" style="grid-column: span 3; width: 100%; height: auto; aspect-ratio: 3/1; margin: 0;">`;
    for (let m=0; m<bestGuess.c; m++) { html += `<div class="mm-block green"></div>`; }
    for (let m=0; m<bestGuess.p; m++) { html += `<div class="mm-block yellow"></div>`; }
    for (let m=0; m<bestGuess.a; m++) { html += `<div class="mm-block red"></div>`; }
    html += `</div></div>`;
  } else {
    html += `
      <div class="w500-count green" style="aspect-ratio: 1/1; height: auto; width: 100%; border-radius: 15%; font-size: 1rem; min-width: 0; min-height: 0;">${bestGuess.c}</div>
      <div class="w500-count yellow" style="aspect-ratio: 1/1; height: auto; width: 100%; border-radius: 15%; font-size: 1rem; min-width: 0; min-height: 0;">${bestGuess.p}</div>
      <div class="w500-count red" style="aspect-ratio: 1/1; height: auto; width: 100%; border-radius: 15%; font-size: 1rem; min-width: 0; min-height: 0;">${bestGuess.a}</div>
    </div>`;
  }
  container.innerHTML = html;
}

// ─── Word500 Sorted Board ───
function createWord500RowEl(guessData, isLatest, revealAllColors = false) {
  const row = document.createElement('div');
  row.className = 'board-row w500-row' + (isLatest ? ' w500-latest-row' : '');
  const avatar = document.createElement('img');
  avatar.className = 'guesser-avatar';
  if (guessData.userData && guessData.userData.profilePictureUrl) {
    avatar.src = guessData.userData.profilePictureUrl;
    avatar.classList.add('show');
  }
  row.appendChild(avatar);
  const isAllRed = guessData.a === guessData.word.length;
  
  let statuses = null;
  if (revealAllColors) {
    statuses = getWordleFeedback(guessData.word, currentWord);
  }

  for (let j = 0; j < guessData.word.length; j++) {
    const tile = document.createElement('div');
    const letter = guessData.word[j];
    
    if (revealAllColors && statuses) {
      tile.className = `tile ${statuses[j]}`;
    } else {
      tile.className = 'tile blind';
      if (isAllRed || knownAbsentLetters.has(letter)) {
        tile.style.backgroundColor = 'rgba(220, 38, 38, 0.25)';
        tile.style.borderColor = 'rgba(220, 38, 38, 0.4)';
        tile.style.color = 'rgba(255, 255, 255, 0.4)';
      }
    }
    tile.textContent = letter;
    row.appendChild(tile);
  }
  if (window.w500UseMastermind) {
    const mmContainer = document.createElement('div');
    mmContainer.className = 'mastermind-container';
    for (let m=0; m<guessData.c; m++) { const b=document.createElement('div'); b.className='mm-block green'; mmContainer.appendChild(b); }
    for (let m=0; m<guessData.p; m++) { const b=document.createElement('div'); b.className='mm-block yellow'; mmContainer.appendChild(b); }
    for (let m=0; m<guessData.a; m++) { const b=document.createElement('div'); b.className='mm-block red'; mmContainer.appendChild(b); }
    row.appendChild(mmContainer);
  } else {
    const greenClue = document.createElement('div');
    greenClue.className = 'w500-count green';
    greenClue.textContent = guessData.c;
    const yellowClue = document.createElement('div');
    yellowClue.className = 'w500-count yellow';
    yellowClue.textContent = guessData.p;
    const redClue = document.createElement('div');
    redClue.className = 'w500-count red';
    redClue.textContent = guessData.a;
    row.appendChild(greenClue);
    row.appendChild(yellowClue);
    row.appendChild(redClue);
  }
  return row;
}

function createEmptyW500Row(idx) {
  const row = document.createElement('div');
  row.className = 'board-row w500-row';
  row.id = `row-empty-${idx}`;
  const avatar = document.createElement('img');
  avatar.className = 'guesser-avatar';
  row.appendChild(avatar);
  for (let j = 0; j < WORD_LENGTH; j++) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    row.appendChild(tile);
  }
  if (window.w500UseMastermind) {
    const mmContainer = document.createElement('div');
    mmContainer.className = 'mastermind-container';
    for (let m=0; m<WORD_LENGTH; m++) {
      const b=document.createElement('div'); b.className='mm-block empty'; mmContainer.appendChild(b);
    }
    row.appendChild(mmContainer);
  } else {
    const classes = ['green', 'yellow', 'red'];
    for (let k = 0; k < 3; k++) {
      const clue = document.createElement('div');
      clue.className = `w500-count ${classes[k]}`;
      row.appendChild(clue);
    }
  }
  return row;
}

function renderWord500Board(revealAllColors = false) {
  document.querySelectorAll('.is-invalid-tooltip').forEach(el => el.remove());
  board.innerHTML = '';
  word500PendingInvalidRow = null; // DOM-nya sudah dihapus oleh innerHTML=''
  board.classList.add('w500-board');

  const DISPLAY_ROWS = getDisplayRows();
  document.documentElement.style.setProperty('--display-rows', DISPLAY_ROWS);
  
  knownAbsentLetters.clear();
  for (const g of word500History) {
      if (g.a === g.word.length) {
          for (const char of g.word) knownAbsentLetters.add(char);
      }
  }

  if (word500History.length === 0) {
    for (let i = 0; i < DISPLAY_ROWS; i++) board.appendChild(createEmptyW500Row(i));
    return;
  }

  // Baris paling atas: tebakan terbaru
  const latest = word500History[word500History.length - 1];
  board.appendChild(createWord500RowEl(latest, true, revealAllColors));

  // Di bawahnya: semua tebakan sebelumnya, diurutkan dari skor tertinggi
  const previous = word500History.slice(0, -1)
    .slice() // copy
    .sort((a, b) => b.c - a.c || b.p - a.p || a.a - b.a);

  const slots = DISPLAY_ROWS - 1;
  const toShow = previous.slice(0, slots);
  for (const g of toShow) board.appendChild(createWord500RowEl(g, false, revealAllColors));

  // Isi sisa dengan baris kosong
  for (let i = toShow.length; i < DISPLAY_ROWS - 1; i++) board.appendChild(createEmptyW500Row(i));
}

// Render Word Tango Letter Pool in a 2-row pyramid, hiding used letters
function renderTangoPool() {
  const chipsDiv = document.getElementById('tangoPoolChips');
  if (!chipsDiv) return;
  chipsDiv.innerHTML = '';

  const available = wordTangoPool.filter(item => !item.used);
  if (available.length === 0) return;

  const N = available.length;
  let topCount = Math.floor(N / 2);
  if (topCount === 0 && N > 0) topCount = 1;
  
  const topRow = available.slice(0, topCount);
  const bottomRow = available.slice(topCount);

  const makeRowEl = (chips) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'tango-pool-row';
    rowEl.style.display = 'flex';
    rowEl.style.justifyContent = 'center';
    rowEl.style.gap = '8px';
    rowEl.style.marginBottom = '8px';
    chips.forEach(item => {
      const chip = document.createElement('div');
      chip.className = 'tango-chip';
      chip.id = `tango-chip-${item.id}`;
      chip.textContent = item.char;
      rowEl.appendChild(chip);
    });
    return rowEl;
  };

  if (topRow.length > 0) chipsDiv.appendChild(makeRowEl(topRow));
  if (bottomRow.length > 0) {
    const bEl = makeRowEl(bottomRow);
    bEl.style.marginBottom = '0';
    chipsDiv.appendChild(bEl);
  }
}

// Initialize Board
function initBoard() {
  document.querySelectorAll('.is-invalid-tooltip').forEach(el => el.remove());
  board.innerHTML = '';
  board.className = '';

  if (currentGameMode === 'word500' || currentGameMode === 'word600') {
    board.classList.add('w500-board');
  } else if (currentGameMode === 'wordtango') {
    board.classList.add('tango-board');
    for (let i = 0; i < 4; i++) {
      const target = wordTangoTargets[i];
      if (!target) continue;
      const row = document.createElement('div');
      row.className = 'tango-row';
      row.id = `tango-row-${i}`;

      // Left Solver Avatar (reserved slot, hidden via CSS until solved)
      const avatar = document.createElement('img');
      avatar.className = 'guesser-avatar tango-avatar';
      avatar.id = `avatar-tango-${i}`;
      row.appendChild(avatar);

      // Center Tiles
      const tilesDiv = document.createElement('div');
      tilesDiv.className = 'tango-tiles';
      for (let j = 0; j < target.length; j++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.id = `tango-tile-${i}-${j}`;
        if (target.missingIndices.includes(j)) {
          tile.classList.add('tango-slot');
          tile.textContent = '';
        } else {
          tile.classList.add('tango-revealed');
          tile.textContent = target.word[j];
        }
        tilesDiv.appendChild(tile);
      }
      row.appendChild(tilesDiv);

      board.appendChild(row);
    }

    // Render Letter Pool Chips in 2-row pyramid
    renderTangoPool();
    return;
  }

  const rows = getDisplayRows();
  document.documentElement.style.setProperty('--display-rows', rows);
  for (let i = 0; i < rows; i++) {
    const row = document.createElement('div');
    row.className = 'board-row';
    row.id = `row-empty-${i}`;
    
    // Avatar for the row
    const avatar = document.createElement('img');
    avatar.className = 'guesser-avatar';
    avatar.id = `avatar-empty-${i}`;
    row.appendChild(avatar);

    for (let j = 0; j < WORD_LENGTH; j++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.id = `tile-empty-${i}-${j}`;
      if (currentGameMode === 'fillblanks' && fillBlanksTargets[i]) {
        const clue = fillBlanksTargets[i].clues[j];
        if (clue) {
          tile.textContent = clue.char;
          tile.classList.add(clue.status);
        }
      }
      row.appendChild(tile);
    }

    // Word500/600: add feedback placeholders
    if (currentGameMode === 'word500' || currentGameMode === 'word600') {
      row.classList.add('w500-row');
      if (window.w500UseMastermind) {
        const mmContainer = document.createElement('div');
        mmContainer.className = 'mastermind-container';
        for (let m = 0; m < WORD_LENGTH; m++) {
          const b = document.createElement('div');
          b.className = 'mm-block empty';
          mmContainer.appendChild(b);
        }
        row.appendChild(mmContainer);
      } else {
        const classes = ['green', 'yellow', 'red'];
        for (let k = 0; k < 3; k++) {
          const clue = document.createElement('div');
          clue.className = `w500-count ${classes[k]}`;
          row.appendChild(clue);
        }
      }
    }

    board.appendChild(row);
  }
}

function initHintBoard() {
  const hintBoard = document.getElementById('hintBoard');
  hintBoard.innerHTML = '<div class="hint-spacer"></div>';
  for(let i=0; i<WORD_LENGTH; i++) {
    const tile = document.createElement('div');
    tile.className = 'hint-tile';
    tile.id = `hint-${i}`;
    hintBoard.appendChild(tile);
  }
}

// Rotating Instructions & !myrank system
let rankCooldowns = {};
let rankMessageQueue = [];
let isShowingRankMsg = false;
let instructionTimer = null;
let currentInstructionIndex = 0;

function getInstructionText() {
  const steps = [];
  
  // 1. Guessing / Tango / Fillblanks
  steps.push(() => {
    if (currentGameMode === 'wordtango') {
      if (lastLang === 'id') return `Ketik kata dari Letter Pool di komentar!`;
      if (lastLang === 'mixed') return `Ketik kata dari Letter Pool! / Type words from Letter Pool!`;
      return `Type complete words from the Letter Pool in chat!`;
    }
    if (currentGameMode === 'fillblanks') {
      if (lastLang === 'id') return `Tebak kata ${WORD_LENGTH} huruf untuk mengisi baris kosong!`;
      if (lastLang === 'mixed') return `Tebak kata untuk isi baris kosong! / Guess to fill the blanks!`;
      return `Guess a ${WORD_LENGTH}-letter word to fill the blanks!`;
    }
    if (currentGameMode === 'wordgrid') {
      if (lastLang === 'id') return `Ketik kata yang sesuai dengan kriteria baris & kolom!`;
      if (lastLang === 'mixed') return `Ketik kata sesuai kriteria! / Type words matching clues!`;
      return `Type a word that matches the row & column clues!`;
    }
    if (lastLang === 'id') return `Ketik kata ${WORD_LENGTH} huruf di komentar untuk menebak!`;
    if (lastLang === 'mixed') return `Ketik kata ${WORD_LENGTH} huruf di komentar! / Type a ${WORD_LENGTH}-letter word!`;
    return `Type a ${WORD_LENGTH}-letter word in chat to guess!`;
  });
  
  // 2. Rank Check
  steps.push(() => {
    if (lastLang === 'id') return `Ketik !myrank untuk cek rank & poin kamu!`;
    if (lastLang === 'mixed') return `Ketik !myrank untuk cek poin! / Type !myrank to check points!`;
    return `Type !myrank to check your rank and points!`;
  });
  
  // 3. Request Music (only if enabled)
  if (musicSettings.requestsEnabled !== false) {
    steps.push(() => {
      if (lastLang === 'id') return `Ketik !play&nbsp;<b>judul lagu</b>&nbsp;untuk request musik 🎵`;
      if (lastLang === 'mixed') return `Ketik !play&nbsp;<b>judul</b>&nbsp;untuk musik! / Type !play&nbsp;<b>title</b>&nbsp;for music!`;
      return `Type !play&nbsp;<b>song title</b>&nbsp;in chat to request music 🎵`;
    });
  }
  
  // 4. Social / Engagement
  steps.push(() => {
    if (lastLang === 'id') return `Jangan lupa tap-tap layar, follow & share live ini ya! ❤️`;
    if (lastLang === 'mixed') return `Jangan lupa tap layar & follow! / Tap the screen & follow! ❤️`;
    return `Don't forget to tap the screen, follow & share this live! ❤️`;
  });
  
  const stepIdx = currentInstructionIndex % steps.length;
  const isFollowStep = (stepIdx === steps.length - 1);
  return {
    text: steps[stepIdx](),
    isFollowStep: isFollowStep
  };
}

function startInstructionRotation() {
  if (instructionTimer) clearInterval(instructionTimer);
  
  const updateText = () => {
    if (isShowingRankMsg) return; // Don't override rank msg
    const res = getInstructionText();
    const instEl = document.querySelector('.instruction');
    if (instEl) {
      instEl.innerHTML = res.text;
      instEl.style.color = 'var(--text-muted)';
    }
    
    // Play interaction sound sparingly when the instruction rotates to "Follow & Share"
    if (res.isFollowStep && Math.random() < 0.4) {
       if (window.playHostAudio) playHostAudio('interaction');
    }
    
    currentInstructionIndex++;
  };
  
  updateText();
  instructionTimer = setInterval(updateText, 5000); // Switch every 5s
}

function processRankQueue() {
  if (isShowingRankMsg || rankMessageQueue.length === 0) return;
  isShowingRankMsg = true;
  
  const rankData = rankMessageQueue.shift();
  const instEl = document.querySelector('.instruction');
  if (instEl) {
    instEl.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
        <img src="${rankData.avatar}" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(255,255,255,0.3);" onerror="this.src='assets/bg_nature.png'">
        <span>${rankData.msg}</span>
      </div>
    `;
    instEl.style.color = 'var(--warning)';
  }
  
  setTimeout(() => {
    isShowingRankMsg = false;
    if (rankMessageQueue.length > 0) {
      processRankQueue();
    } else {
      // Revert to normal rotation
      const text = getInstructionText((currentInstructionIndex - 1 + 4) % 4);
      if (instEl) {
        instEl.innerHTML = text;
        instEl.style.color = 'var(--text-muted)';
      }
    }
  }, 5000); // Show for 5s
}

function handleMyRank(userData) {
  const userId = userData.uniqueId; // used for cooldown
  const username = userData.nickname; // used for points and storage
  const now = Date.now();
  if (rankCooldowns[userId] && now - rankCooldowns[userId] < 15000) {
    return; // 15s cooldown per user
  }
  rankCooldowns[userId] = now;

  const sessionObj = playerPoints[username];
  const sessionPts = sessionObj ? sessionObj.sessionPts : 0;
  let sessionRank = "-";
  
  const sorted = Object.entries(playerPoints).sort((a, b) => b[1].sessionPts - a[1].sessionPts);
  const index = sorted.findIndex(p => p[0] === username);
  if (index !== -1 && sessionPts > 0) {
    sessionRank = `#${index + 1}`;
  }

  const prefix = getPtsPrefix();
  const dailyPrefix = prefix + 'daily_';
  const weeklyPts = parseInt(localStorage.getItem(prefix + username)) || 0;
  
  // Hitung rank mingguan
  const weeklyData = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      if (key.startsWith(dailyPrefix)) continue;
      if (prefix === 'pts_' && (key.startsWith('pts_w500_') || key.startsWith('pts_w600_') || key.startsWith('pts_wloop_') || key.startsWith('pts_fill_') || key.startsWith('pts_tango_') || key.startsWith('pts_wgrid_'))) continue;
      if (key.startsWith(prefix + 'like_') || 
          key.startsWith(prefix + 'share_') || 
          key.startsWith(prefix + 'gift_') || 
          key.startsWith(prefix + 'active_') || 
          key.startsWith(prefix + 'avatar_')) continue;
      const uName = key.substring(prefix.length);
      const pts = parseInt(localStorage.getItem(key)) || 0;
      weeklyData.push({ uName, pts });
    }
  }
  weeklyData.sort((a, b) => b.pts - a.pts);
  const wIndex = weeklyData.findIndex(p => p.uName === username);
  let weeklyRank = "-";
  if (wIndex !== -1 && weeklyPts > 0) {
    weeklyRank = `#${wIndex + 1}`;
  }
  
  // Truncate panjang nickname agar tidak terlalu panjang
  let nick = userData.nickname;
  if (nick.length > 10) {
    nick = nick.substring(0, 9) + '..';
  }
  
  const msg = `${nick} - Daily: ${sessionPts} Pts (Rank ${sessionRank}) | Weekly: ${weeklyPts} Pts (Rank ${weeklyRank})`;
  const avatar = userData.profilePictureUrl || 'assets/bg_nature.png';
  
  rankMessageQueue.push({ msg, avatar });
  processRankQueue();
}

// --- WORD GRID LOGIC ---
const WG_CLUE_EASY = [
  { type: 'length', val: 4 },
  { type: 'length', val: 5 },
  { type: 'length', val: 6 },
  { type: 'contains', val: 'A' },
  { type: 'contains', val: 'E' },
  { type: 'contains', val: 'I' },
  { type: 'contains', val: 'O' },
  { type: 'contains', val: 'U' },
  { type: 'contains', val: 'R' },
  { type: 'contains', val: 'N' },
  { type: 'contains', val: 'T' },
  { type: 'contains', val: 'S' },
  { type: 'contains', val: 'M' },
  { type: 'contains', val: 'K' },
  { type: 'contains', val: 'AN' },
  { type: 'contains', val: 'AR' },
  { type: 'contains', val: 'RA' },
  { type: 'contains', val: 'AK' },
  { type: 'starts_with', val: 'B' },
  { type: 'starts_with', val: 'M' },
  { type: 'starts_with', val: 'P' },
  { type: 'starts_with', val: 'S' },
  { type: 'ends_with', val: 'A' },
  { type: 'ends_with', val: 'I' },
  { type: 'ends_with', val: 'N' },
  { type: 'ends_with', val: 'R' },
  { type: 'starts_vowel', val: true },
  { type: 'ends_consonant', val: true }
];

const WG_CLUE_MEDIUM = [
  { type: 'length', val: 7 },
  { type: 'not_contains', val: 'O' },
  { type: 'not_contains', val: 'U' },
  { type: 'not_contains_multiple', val: ['A', 'E'] },
  { type: 'not_contains_multiple', val: ['I', 'O'] },
  { type: 'not_contains_multiple', val: ['U', 'E'] },
  { type: 'not_contains_multiple', val: ['R', 'N'] },
  { type: 'not_contains', val: 'R' },
  { type: 'not_contains', val: 'N' },
  { type: 'not_contains', val: 'T' },
  { type: 'not_contains', val: 'S' },
  { type: 'contains', val: 'B' },
  { type: 'contains', val: 'P' },
  { type: 'contains', val: 'D' },
  { type: 'contains', val: 'G' },
  { type: 'contains', val: 'L' },
  { type: 'contains', val: 'EL' },
  { type: 'contains', val: 'UM' },
  { type: 'contains', val: 'IN' },
  { type: 'contains', val: 'US' },
  { type: 'contains', val: 'ER' },
  { type: 'contains', val: 'ANG' },
  { type: 'starts_with', val: 'K' },
  { type: 'starts_with', val: 'T' },
  { type: 'starts_with', val: 'D' },
  { type: 'starts_with', val: 'L' },
  { type: 'starts_with', val: 'R' },
  { type: 'ends_with', val: 'K' },
  { type: 'ends_with', val: 'T' },
  { type: 'ends_with', val: 'S' },
  { type: 'ends_with', val: 'M' },
  { type: 'ends_with', val: 'L' },
  { type: 'min_vowels', val: 3 }
];

const WG_CLUE_HARD = [
  { type: 'length', val: 8 },
  { type: 'not_contains', val: 'A' },
  { type: 'not_contains', val: 'E' },
  { type: 'not_contains', val: 'I' },
  { type: 'not_contains_multiple', val: ['A', 'E', 'I'] },
  { type: 'not_contains_multiple', val: ['U', 'O', 'A'] },
  { type: 'not_contains_multiple', val: ['R', 'N', 'T'] },
  { type: 'not_contains_multiple', val: ['M', 'K', 'S'] },
  { type: 'not_contains', val: 'K' },
  { type: 'not_contains', val: 'M' },
  { type: 'not_contains', val: 'L' },
  { type: 'not_contains', val: 'P' },
  { type: 'contains', val: 'J' },
  { type: 'contains', val: 'Y' },
  { type: 'contains', val: 'C' },
  { type: 'contains', val: 'V' },
  { type: 'contains', val: 'W' },
  { type: 'contains', val: 'F' },
  { type: 'contains', val: 'Z' },
  { type: 'contains', val: 'ALA' },
  { type: 'contains', val: 'ERA' },
  { type: 'contains', val: 'BEL' },
  { type: 'contains', val: 'PAN' },
  { type: 'starts_with', val: 'J' },
  { type: 'starts_with', val: 'Y' },
  { type: 'starts_with', val: 'G' },
  { type: 'starts_with', val: 'W' },
  { type: 'starts_with', val: 'C' },
  { type: 'ends_with', val: 'G' },
  { type: 'ends_with', val: 'P' },
  { type: 'ends_with', val: 'D' },
  { type: 'min_vowels', val: 4 },
  { type: 'double_letter', val: true }
];

const WG_CLUE_EASY_EN = [
  { type: 'length', val: 4 }, { type: 'length', val: 5 }, { type: 'length', val: 6 },
  { type: 'contains', val: 'A' }, { type: 'contains', val: 'E' }, { type: 'contains', val: 'I' },
  { type: 'contains', val: 'O' }, { type: 'contains', val: 'U' },
  { type: 'contains', val: 'ER' }, { type: 'contains', val: 'ST' }, { type: 'contains', val: 'EA' },
  { type: 'contains', val: 'OU' }, { type: 'contains', val: 'TH' }, { type: 'contains', val: 'CH' },
  { type: 'starts_with', val: 'S' }, { type: 'starts_with', val: 'C' }, { type: 'starts_with', val: 'B' }, { type: 'starts_with', val: 'T' },
  { type: 'ends_with', val: 'E' }, { type: 'ends_with', val: 'S' }, { type: 'ends_with', val: 'D' }, { type: 'ends_with', val: 'Y' },
  { type: 'starts_vowel', val: true }, { type: 'ends_consonant', val: true }
];

const WG_CLUE_MEDIUM_EN = [
  { type: 'length', val: 7 },
  { type: 'not_contains', val: 'O' }, { type: 'not_contains', val: 'U' },
  { type: 'not_contains_multiple', val: ['A', 'E'] }, { type: 'not_contains_multiple', val: ['I', 'O'] },
  { type: 'contains', val: 'IGH' }, { type: 'contains', val: 'GHT' }, { type: 'contains', val: 'STA' },
  { type: 'contains', val: 'REA' }, { type: 'contains', val: 'TER' }, { type: 'contains', val: 'AIN' },
  { type: 'starts_with', val: 'P' }, { type: 'starts_with', val: 'M' }, { type: 'starts_with', val: 'A' }, { type: 'starts_with', val: 'R' },
  { type: 'ends_with', val: 'N' }, { type: 'ends_with', val: 'R' }, { type: 'ends_with', val: 'T' }, { type: 'ends_with', val: 'L' },
  { type: 'min_vowels', val: 3 }
];

const WG_CLUE_HARD_EN = [
  { type: 'length', val: 8 },
  { type: 'not_contains', val: 'A' }, { type: 'not_contains', val: 'E' }, { type: 'not_contains', val: 'I' },
  { type: 'not_contains_multiple', val: ['A', 'E', 'I'] }, { type: 'not_contains_multiple', val: ['U', 'O', 'A'] },
  { type: 'not_contains_multiple', val: ['S', 'T', 'R'] }, { type: 'not_contains_multiple', val: ['L', 'N', 'E'] },
  { type: 'contains', val: 'J' }, { type: 'contains', val: 'Q' }, { type: 'contains', val: 'Z' }, { type: 'contains', val: 'X' },
  { type: 'contains', val: 'V' }, { type: 'contains', val: 'W' },
  { type: 'starts_with', val: 'J' }, { type: 'starts_with', val: 'K' }, { type: 'starts_with', val: 'V' }, { type: 'starts_with', val: 'Z' }, { type: 'starts_with', val: 'Q' },
  { type: 'ends_with', val: 'K' }, { type: 'ends_with', val: 'M' }, { type: 'ends_with', val: 'P' },
  { type: 'min_vowels', val: 4 }, { type: 'double_letter', val: true }
];

function getWgClueDesc(clue) {
  const isEn = lastLang === 'en' || lastLang === 'mixed';
  switch (clue.type) {
    case 'length': return isEn ? `${clue.val} Letters` : `${clue.val} Huruf`;
    case 'contains': return isEn ? `Contains ${clue.val}` : `Ada ${clue.val}`;
    case 'not_contains': return isEn ? `No ${clue.val}` : `Tanpa ${clue.val}`;
    case 'not_contains_multiple': return isEn ? `No ${clue.val.join(', ')}` : `Tanpa ${clue.val.join(', ')}`;
    case 'starts_with': return isEn ? `Starts ${clue.val}` : `Awalan ${clue.val}`;
    case 'ends_with': return isEn ? `Ends ${clue.val}` : `Akhiran ${clue.val}`;
    case 'starts_vowel': return isEn ? `Starts w/ Vowel` : `Awalan Vokal`;
    case 'ends_consonant': return isEn ? `Ends w/ Consonant` : `Akhiran Konsonan`;
    case 'min_vowels': return isEn ? `Min ${clue.val} Vowels` : `Min ${clue.val} Vokal`;
    case 'double_letter': return isEn ? `Double Letter` : `Huruf Ganda`;
    default: return '';
  }
}

function getValidWordsForWgCell(rowClue, colClue) {
  let valid = [];
  const allWords = [];
  [3, 4, 5, 6, 7, 8].forEach(len => {
    if (allTargetWords[len]) allWords.push(...allTargetWords[len]);
  });
  
  for (const w of allWords) {
    if (checkWgClue(w, rowClue) && checkWgClue(w, colClue)) {
      valid.push(w);
    }
  }
  return valid;
}

function checkWgClue(word, clue) {
  if (clue.type === 'length') return word.length === clue.val;
  if (clue.type === 'contains') return word.includes(clue.val);
  if (clue.type === 'not_contains') return !word.includes(clue.val);
  if (clue.type === 'not_contains_multiple') return clue.val.every(letter => !word.includes(letter));
  if (clue.type === 'starts_with') return word.startsWith(clue.val);
  if (clue.type === 'ends_with') return word.endsWith(clue.val);
  if (clue.type === 'starts_vowel') return /^[AEIOU]/.test(word);
  if (clue.type === 'ends_consonant') return /[^AEIOU]$/.test(word);
  if (clue.type === 'min_vowels') return (word.match(/[AEIOU]/g) || []).length >= clue.val;
  if (clue.type === 'double_letter') return /(.)\1/.test(word);
  return false;
}

function generateWordGridBoard() {
  let attempts = 0;
  let validBoardFound = false;
  
  while (!validBoardFound && attempts < 200) {
    attempts++;
    wgCluesRow = [];
    wgCluesCol = [];
    
    const isEn = lastLang === 'en' || lastLang === 'mixed';
    let easyPool = isEn ? [...WG_CLUE_EASY_EN] : [...WG_CLUE_EASY];
    let mediumPool = isEn ? [...WG_CLUE_MEDIUM_EN] : [...WG_CLUE_MEDIUM];
    let hardPool = isEn ? [...WG_CLUE_HARD_EN] : [...WG_CLUE_HARD];
    shuffleArray(easyPool);
    shuffleArray(mediumPool);
    shuffleArray(hardPool);
    
    let selectedClues = [];
    if (hardModeState === 'ultra') {
      selectedClues.push(mediumPool.pop(), mediumPool.pop(), mediumPool.pop());
      selectedClues.push(hardPool.pop(), hardPool.pop(), hardPool.pop());
    } else if (hardModeState === 'hard') {
      selectedClues.push(easyPool.pop(), easyPool.pop(), easyPool.pop(), easyPool.pop());
      selectedClues.push(mediumPool.pop(), mediumPool.pop());
    } else {
      selectedClues.push(easyPool.pop(), easyPool.pop(), easyPool.pop(), easyPool.pop(), easyPool.pop(), easyPool.pop());
    }
    
    shuffleArray(selectedClues);
    for (let i=0; i<3; i++) wgCluesRow.push(selectedClues.pop());
    for (let i=0; i<3; i++) wgCluesCol.push(selectedClues.pop());
    
    let isValid = true;
    wgDictionaryCache = {};
    for (let r=0; r<3; r++) {
      for (let c=0; c<3; c++) {
        const words = getValidWordsForWgCell(wgCluesRow[r], wgCluesCol[c]);
        if (words.length === 0) {
          isValid = false;
          break;
        }
        wgDictionaryCache[`${r}-${c}`] = words;
      }
      if (!isValid) break;
    }
    
    if (isValid) validBoardFound = true;
  }
  
  wgGrid = [
    [null, null, null],
    [null, null, null],
    [null, null, null]
  ];
  
  renderWordGridBoard();
}

function renderWordGridBoard() {
  for (let i=0; i<3; i++) {
    document.getElementById(`wg-row-${i}`).textContent = wgCluesRow[i] ? getWgClueDesc(wgCluesRow[i]) : '';
    document.getElementById(`wg-col-${i}`).textContent = wgCluesCol[i] ? getWgClueDesc(wgCluesCol[i]) : '';
  }
  
  for (let r=0; r<3; r++) {
    for (let c=0; c<3; c++) {
      const cell = document.getElementById(`wg-cell-${r}-${c}`);
      const data = wgGrid[r][c];
      
      const rarityEl = cell.querySelector('.wg-rarity');
      const wordEl = cell.querySelector('.wg-word');
      const playerEl = cell.querySelector('.wg-player');
      
      cell.className = 'word-grid-cell word-grid-ans'; 
      
      if (data) {
        let dynSize = 18;
        if (data.word.length >= 9) dynSize = 11;
        else if (data.word.length >= 7) dynSize = 13;
        else if (data.word.length === 6) dynSize = 15;
        
        wordEl.style.fontSize = `calc(${dynSize}px * var(--board-scale, 1))`;
        wordEl.textContent = data.word;
        playerEl.innerHTML = `
          <img class="wg-player-avatar" src="${data.avatar || 'assets/bg_nature.png'}">
          <span class="wg-player-name">${data.username}</span>
        `;
        rarityEl.style.display = 'block';
        
        const cacheWords = wgDictionaryCache[`${r}-${c}`];
        if (cacheWords) {
          let rarityClass = 'wg-rarity-common';
          let rarityText = 'COMMON';
          let points = 2;
          if (cacheWords.length <= 10) { rarityClass = 'wg-rarity-legendary'; rarityText = 'LEGENDARY'; points = 25; }
          else if (cacheWords.length <= 50) { rarityClass = 'wg-rarity-epic'; rarityText = 'EPIC'; points = 10; }
          else if (cacheWords.length <= 200) { rarityClass = 'wg-rarity-rare'; rarityText = 'RARE'; points = 5; }
          
          cell.classList.add(rarityClass);
          rarityEl.textContent = `${rarityText} (+${points})`;
          rarityEl.style.background = 'rgba(0,0,0,0.6)';
        }
      } else {
        wordEl.textContent = '';
        playerEl.textContent = '';
        rarityEl.style.display = 'none';
      }
    }
  }
}

function checkWordGridGuess(word, username, profilePic) {
  if (isGameOver) return false;
  word = word.toUpperCase();
  
  // Validasi apakah kata ada di kamus lengkap
  if (!fullValidDictionary.has(word)) return false;
  
  for (let r=0; r<3; r++) {
    for (let c=0; c<3; c++) {
      if (wgGrid[r][c] && wgGrid[r][c].word === word) return false;
    }
  }
  
  for (let r=0; r<3; r++) {
    for (let c=0; c<3; c++) {
      if (!wgGrid[r][c]) {
        if (checkWgClue(word, wgCluesRow[r]) && checkWgClue(word, wgCluesCol[c])) {
          let points = 2;
          // Gunakan cache untuk poin rarity, namun jika tidak ada (kata > 8 huruf), anggap Legendary (25)
          let validCount = wgDictionaryCache[`${r}-${c}`]?.length || 0;
          if (validCount < 10) points = 25;
          else if (validCount < 50) points = 10;
          else if (validCount < 200) points = 5;
          
          wgGrid[r][c] = { word, username, profilePic, points };
          renderWordGridBoard();
          checkWordGridWin();
          return points; 
        }
      }
    }
  }
  return false;
}

function triggerConfetti() {
  const colors = ['#a855f7', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#fde047'];
  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Spread in a circle
    const angle = Math.random() * Math.PI * 2;
    const velocity = 150 + Math.random() * 400; 
    const tx = Math.cos(angle) * velocity;
    const ty = Math.sin(angle) * velocity + (Math.random() * 200);
    const duration = 1 + Math.random();
    
    confetti.style.setProperty('--tx', `${tx}px`);
    confetti.style.setProperty('--ty', `${ty}px`);
    confetti.style.animationDuration = `${duration}s`;
    
    if (Math.random() > 0.5) confetti.style.borderRadius = '50%';
    
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), duration * 1000);
  }
}

function checkWordGridWin() {
  let allFilled = true;
  for (let r=0; r<3; r++) {
    for (let c=0; c<3; c++) {
      if (!wgGrid[r][c]) allFilled = false;
    }
  }
  
  if (allFilled) {
    isGameOver = true;
    setTimeout(() => {
      triggerConfetti();
      showWordGridWinOverlay();
    }, 1000);
  }
}

function showWordGridWinOverlay() {
  const overlay = document.getElementById('multiWinOverlay');
  const list = document.getElementById('multiWinList');
  const title = document.getElementById('multiWinTitle');
  
  title.textContent = 'LEADERBOARD WORD GRID';
  list.innerHTML = '';
  
  const scores = {};
  for (let r=0; r<3; r++) {
    for (let c=0; c<3; c++) {
      const solver = wgGrid[r][c];
      if (solver) {
        if (!scores[solver.username]) {
          scores[solver.username] = {
            username: solver.username,
            profilePic: solver.profilePic,
            points: 0,
            words: []
          };
        }
        scores[solver.username].points += (solver.points || 10);
        scores[solver.username].words.push(`${solver.word}`);
      }
    }
  }
  
  const sortedPlayers = Object.values(scores).sort((a, b) => b.points - a.points);
  
  let delay = 0;
  sortedPlayers.forEach((player, index) => {
    setTimeout(() => {
      const item = document.createElement('div');
      item.className = 'multi-win-item';
      
      let avHTML = `<div class="multi-win-letter">${player.username.charAt(0).toUpperCase()}</div>`;
      if (player.profilePic) {
         avHTML = `<img src="${player.profilePic}" alt="Avatar" class="multi-win-avatar" crossorigin="anonymous" referrerpolicy="no-referrer" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div class="multi-win-letter" style="display:none;">${player.username.charAt(0).toUpperCase()}</div>`;
      }
      
      let rankText = index === 0 ? 'MVP' : `#${index + 1}`;
      let rankColor = index === 0 ? '#ffd700' : (index === 1 ? '#c0c0c0' : (index === 2 ? '#cd7f32' : '#ffffff'));
      
      // Truncate words list to keep it compact
      let wordsDisplay = player.words.slice(0, 3).join(', ');
      if (player.words.length > 3) {
        wordsDisplay += `, dan ${player.words.length - 3} lainnya`;
      }
      
      item.innerHTML = `
        <div style="font-weight:900; color:${rankColor}; width: 50px; text-align:center; flex-shrink: 0; font-size: 14px;">${rankText}</div>
        ${avHTML}
        <div class="multi-win-details" style="flex: 1; padding: 0 10px; min-width: 0;">
          <div class="multi-win-name" style="font-size: 15px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #fff;">${player.username}</div>
          <div class="multi-win-word" style="font-size: 11px; color: #bbb; margin-top: 2px; line-height: 1.3;">Menjawab: ${wordsDisplay}</div>
        </div>
        <div class="multi-win-pts" style="font-size: 18px; color: #ffd700; font-weight: 900; flex-shrink: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">+${player.points}</div>
      `;
      list.appendChild(item);
      item.style.animation = 'slideInRight 0.3s ease-out forwards';
    }, delay);
    delay += 300;
  });
  
  // Gunakan fungsi bawaan untuk transisi menang (mengurus Like, timer otomatis, dan audio)
  setTimeout(() => {
    triggerWinTransition(7000, true);
  }, delay + 1000);
}
// --- END WORD GRID LOGIC ---

// Start Game
function startNewRound() {
  applyGameModeUI();
  hasPlayedCloseAudio = false;
  // Word500 always uses 5 letters; Word600 always uses 6 letters; Wordle/WordLoop randomizes 5, 6, or 7
  if (currentGameMode === 'word500') {
    WORD_LENGTH = 5;
  } else if (currentGameMode === 'word600') {
    WORD_LENGTH = 6;
  } else {
    let allowedLengths = [5, 6, 7];
    try { allowedLengths = JSON.parse(localStorage.getItem('allowed_lengths') || '[5,6,7,8]'); } catch(e) {}
    if (!allowedLengths || allowedLengths.length === 0) allowedLengths = [5];
    const rIdx = Math.floor(Math.random() * allowedLengths.length);
    WORD_LENGTH = allowedLengths[rIdx];
  }
  document.documentElement.style.setProperty('--word-length', WORD_LENGTH);
  updateBoardScaleUI();
  
  if (wordsLoaded) {
    TARGET_WORDS = allTargetWords[WORD_LENGTH];
    VALID_WORDS = allValidWords[WORD_LENGTH];
    availableWords = allAvailableWords[WORD_LENGTH];
  } else {
    TARGET_WORDS = [];
    VALID_WORDS = [];
    availableWords = [];
  }

  currentWord = getRandomWord();
  guesses = [];
  guessQueue = [];
  discoveredLetters = Array(WORD_LENGTH).fill(null);
  bestGuess = null;
  word500History = [];
  word500PendingInvalidRow = null;
  userGuessDedup = new Set(); // reset per ronde
  isGameOver = false;
  isProcessing = false;
  isWaitingForLikes = false;
  roundNumber.textContent = round;
  
  // Reset like progress for new round
  currentLikes = 0;
  
  // Hide progress bar on new round
  const likeProgress = document.getElementById('likeProgressContainer');
  if (likeProgress) likeProgress.style.display = 'none';
  
  updateLikeProgressBar();
  
  // Toggle background for visual delight (only if dynamic mode is on)
  if (isDynamicBg) {
    currentBg = currentBg === 'nature' ? 'city' : 'nature';
    applyDynamicBg();
  }
  
  if (currentGameMode === 'fillblanks') {
    fillBlanksTargets = [];
    if (TARGET_WORDS.length >= 6) {
      const shuffled = [...TARGET_WORDS];
      shuffleArray(shuffled);
      const yellowRowIndex = Math.floor(Math.random() * 6);
      for (let i = 0; i < 6; i++) {
        const word = shuffled[i];
        const numClues = WORD_LENGTH === 5 ? 2 : Math.floor(WORD_LENGTH / 2);
        const clues = Array(WORD_LENGTH).fill(null);
        const allIndices = Array.from({length: WORD_LENGTH}, (_, k) => k);
        shuffleArray(allIndices);
        
        const greenSources = [];
        const yellowSources = [];
        
        let hasYellow = false;
        
        for (let c = 0; c < numClues; c++) {
          let isGreen = true;
          if (i === yellowRowIndex) {
             isGreen = Math.random() < 0.5; 
          }
          if (isGreen) greenSources.push(allIndices[c]);
          else yellowSources.push(allIndices[c]);
        }
        
        // Place green clues first
        for (const idx of greenSources) {
          clues[idx] = { char: word[idx], status: 'correct' };
        }
        
        // Place yellow clues
        for (const idx of yellowSources) {
          const letter = word[idx];
          let validSpots = [];
          for (let k = 0; k < WORD_LENGTH; k++) {
            if (clues[k] === null && word[k] !== letter) {
              validSpots.push(k);
            }
          }
          if (validSpots.length > 0) {
            const placeIdx = validSpots[Math.floor(Math.random() * validSpots.length)];
            clues[placeIdx] = { char: letter, status: 'present' };
            hasYellow = true;
          } else {
            // Fallback to any empty spot
            let emptySpots = [];
            for (let k = 0; k < WORD_LENGTH; k++) {
              if (clues[k] === null) emptySpots.push(k);
            }
            if (emptySpots.length > 0) {
              const placeIdx = emptySpots[Math.floor(Math.random() * emptySpots.length)];
              const status = (word[placeIdx] === letter) ? 'correct' : 'present';
              clues[placeIdx] = { char: letter, status: status };
              if (status === 'present') hasYellow = true;
            }
          }
        }
        fillBlanksTargets.push({ word, clues, solved: false, solver: null, isAnimating: false, isYellowRow: hasYellow });
      }
    }
  }

  if (currentGameMode === 'wordtango') {
    wordTangoTargets = [];
    wordTangoPool = [];
    tangoGuessedWords.clear();
    const tangoGuessFeed = document.getElementById('tangoGuessFeed');
    if (tangoGuessFeed) tangoGuessFeed.innerHTML = '';
    const tangoPatterns = [
      [4, 4, 5, 6],
      [4, 5, 5, 6],
      [4, 4, 5, 5],
      [4, 5, 6, 6],
      [4, 4, 6, 6],
      [4, 5, 5, 5],
      [3, 4, 5, 6],
      [3, 5, 5, 6]
    ];
    const tangoLengths = tangoPatterns[Math.floor(Math.random() * tangoPatterns.length)];
    let poolIdCounter = 0;

    for (let i = 0; i < 4; i++) {
      const len = tangoLengths[i];
      const list = allTargetWords[len] || [];
      const chosenWord = list.length > 0
        ? list[Math.floor(Math.random() * list.length)]
        : (len === 3 ? "APA" : (len === 4 ? "KATA" : (len === 5 ? "RUMAH" : "MENARA")));

      const missingIndices = [];
      const numMissing = len === 3 ? 2 : (len === 4 ? 3 : (len === 5 ? 3 : 4));
      const allIdx = Array.from({ length: len }, (_, k) => k);
      shuffleArray(allIdx);
      for (let m = 0; m < numMissing; m++) {
        const idx = allIdx[m];
        missingIndices.push(idx);
        wordTangoPool.push({ id: poolIdCounter++, char: chosenWord[idx], used: false });
      }
      missingIndices.sort((a, b) => a - b);
      wordTangoTargets.push({
        word: chosenWord,
        length: len,
        missingIndices,
        solved: false,
        solver: null,
        points: len * 3
      });
    }
    shuffleArray(wordTangoPool);
  }

  if (currentGameMode === 'wordgrid') {
    generateWordGridBoard();
  }

  // Apply mode-specific UI
  applyGameModeUI();
  initBoard();
  if (currentGameMode !== 'word500' && currentGameMode !== 'word600' && currentGameMode !== 'fillblanks' && currentGameMode !== 'wordtango') {
    initHintBoard();
  }
  updateBestGuessUI();

  console.log(`[Cheat] Target word is: ${currentWord}`);
  startInstructionRotation();
  const getW500Name = () => window.w500UseMastermind ? 'Word Pegs 5' : 'Word500';
  const getW600Name = () => window.w500UseMastermind ? 'Word Pegs 6' : 'Word600';
  const gameName = currentGameMode === 'wordtango' ? 'Word Tango' : (currentGameMode === 'fillblanks' ? 'Fill Blanks' : (currentGameMode === 'word500' ? getW500Name() : (currentGameMode === 'word600' ? getW600Name() : (currentGameMode === 'wordloop' ? 'Word Loop' : 'Wordle'))));
  showToast(`${gameName} Round ${round} Started!`, 2000);
  
  if (window.playHostAudio) playHostAudio('start');
  
  if (currentGameMode === 'wordloop') {
    updateWordLoopUI();
    
    // Automatically pick the first word to prevent looping cheats and provide an immediate constraint
    if (VALID_WORDS.length > 0) {
      let loopWord = null;
      let attempts = 0;
      while (!loopWord && attempts < 1000) {
          const candidate = VALID_WORDS[Math.floor(Math.random() * VALID_WORDS.length)];
          if (candidate.length === WORD_LENGTH && checkWordLoopPath(candidate.slice(-2), candidate.slice(0, 2), 5)) {
              loopWord = candidate;
          }
          attempts++;
      }
      
      if (loopWord) {
          // Add to queue to simulate system play
          guessQueue.push({ guessWord: loopWord, userData: { nickname: 'SISTEM', uniqueId: 'system' } });
          setTimeout(processQueue, 300);
      }
    }
  }
}

// Switch Account — disconnect and go back to login
function switchAccount() {
  // Stop auto-reconnect
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }

  // Tell server to disconnect TikTok
  if (socket && socket.connected) {
    socket.emit('disconnect-tiktok');
  }

  // Clear saved session
  try {
    localStorage.removeItem('wordle_username');
    localStorage.removeItem('wordle_lang');
    localStorage.removeItem('wordle_sessionid');
  } catch (e) {}

  // Reset state
  lastUsername = "";
  lastLang = "";
  lastSessionId = "";
  currentWord = "";
  isConnectedToTikTok = false;
  isGameOver = false;
  guesses = [];
  round = 1;
  
  // Reset Leaderboard Sesi
  playerPoints = {};
  initWeeklyLeaderboard();

  // Switch UI back to login
  gameContainer.style.display = 'none';
  document.getElementById('hostMusicControl').style.display = 'none';
  hideDisconnectBanner();
  loginOverlay.style.display = 'flex';
  connectBtn.disabled = false;
  connectBtn.textContent = "Connect to Live";
  loginStatus.textContent = "";
  document.getElementById('usernameInput').value = "";
  document.getElementById('usernameInput').focus();
}

// Settings — language picker
function toggleSettings(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('settingsDropdown');
  dropdown.classList.toggle('open');

  // Highlight active language
  document.querySelectorAll('.lang-option').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lastLang);
  });

  // Sync display-rows label with current mode
  updateDisplayRowsUI();
}

function changeLang(lang, e) {
  e.stopPropagation();
  if (lang === lastLang) {
    document.getElementById('settingsDropdown').classList.remove('open');
    return;
  }

  lastLang = lang;
  try { localStorage.setItem('wordle_lang', lang); } catch (e) {}

  // Close dropdown
  document.getElementById('settingsDropdown').classList.remove('open');

  // Reload word lists with new language and start fresh round
  loadWordLists(lang).then(() => {
    showToast(`Language changed!`, 2000);
    startNewRound();
  });
}

// Close settings dropdown when clicking elsewhere
document.addEventListener('click', () => {
  const dropdown = document.getElementById('settingsDropdown');
  if (dropdown) dropdown.classList.remove('open');
});

let hardModeState = localStorage.getItem('wordle_hardModeState') || 'off';
let isNoYellowMode = localStorage.getItem('wordle_noYellow') === 'true';

if (localStorage.getItem('wordle_hardMode') === 'true') {
  hardModeState = 'hard';
  localStorage.removeItem('wordle_hardMode');
  localStorage.setItem('wordle_hardModeState', 'hard');
} else if (localStorage.getItem('wordle_hardMode') === 'false') {
  localStorage.removeItem('wordle_hardMode');
}

function toggleNoYellow(checked) {
  isNoYellowMode = checked;
  try { localStorage.setItem('wordle_noYellow', checked); } catch(e) {}
  if (currentGameMode === 'word500' || currentGameMode === 'word600') {
    renderWord500Board();
  }
}

function toggleHardMode(e) {
  if (e) e.stopPropagation();
  if (hardModeState === 'off') {
    hardModeState = 'hard';
  } else if (hardModeState === 'hard') {
    hardModeState = 'ultra';
  } else {
    hardModeState = 'off';
  }
  try { localStorage.setItem('wordle_hardModeState', hardModeState); } catch(e) {}
  updateHardModeUI();
  
  let msg = 'Hard Mode Dinonaktifkan';
  if (hardModeState === 'hard') msg = '🔥 Hard Mode Diaktifkan';
  if (hardModeState === 'ultra') msg = '☠️ Ultra Hard Mode Diaktifkan';
  showToast(msg, 2000);
  
  if (currentGameMode === 'wordgrid') {
    generateWordGridBoard();
  }
}

function updateHardModeUI() {
  const btn = document.getElementById('hardModeBtn');
  if (btn) {
    if (hardModeState === 'off') {
      btn.innerHTML = '🔥 Hard Mode: OFF';
      btn.style.color = '';
    } else if (hardModeState === 'hard') {
      btn.innerHTML = '🔥 Hard Mode: ON';
      btn.style.color = '#fe2c55';
    } else if (hardModeState === 'ultra') {
      btn.innerHTML = '☠️ Ultra Hard: ON';
      btn.style.color = '#8b0000';
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateHardModeUI();
  // Sync dynamic bg toggle state
  const toggle = document.getElementById('dynamicBgToggle');
  if (toggle) toggle.checked = isDynamicBg;
  // Apply static bg immediately if needed
  if (!isDynamicBg) applyStaticBg();
  
  // Load background customization
  const savedBgUrl = localStorage.getItem('custom_bg_url');
  if (savedBgUrl) {
    const inputEl = document.getElementById('bgUrlInput');
    if (inputEl) inputEl.value = savedBgUrl;
    if (!isDynamicBg) applyStaticBg(); // re-apply to load the image
  }
  
  const savedBlur = localStorage.getItem('custom_bg_blur') || 12;
  const savedDim = localStorage.getItem('custom_bg_dim') || 60;
  const blurSlider = document.getElementById('bgBlurSlider');
  const dimSlider = document.getElementById('bgDimSlider');
  if (blurSlider) blurSlider.value = savedBlur;
  if (dimSlider) dimSlider.value = savedDim;
  if (typeof applyBgEffects === 'function') applyBgEffects(savedBlur, savedDim);
  
  // Initialize like restart settings UI
  const likeToggle = document.getElementById('likeRestartToggle');
  if (likeToggle) likeToggle.checked = isLikeRestartEnabled;
  const likeThresholdInput = document.getElementById('likeThresholdInput');
  if (likeThresholdInput) likeThresholdInput.value = likeRestartThreshold;
  const likeContainer = document.getElementById('likeThresholdContainer');
  if (likeContainer) likeContainer.style.display = isLikeRestartEnabled ? 'block' : 'none';
  updateLikeProgressBar();
  
  // Load auto fullscreen pref
  const savedFs = localStorage.getItem('tiktok_auto_fullscreen');
  if (savedFs !== null) {
    isAutoFullscreen = savedFs === 'true';
  }
  const fsToggle = document.getElementById('autoFullscreenToggle');
  if (fsToggle) fsToggle.checked = isAutoFullscreen;
});

window.toggleAutoFullscreen = function(enabled) {
  isAutoFullscreen = enabled;
  localStorage.setItem('tiktok_auto_fullscreen', enabled);
  showToast(enabled ? '🔲 Auto Fullscreen Aktif' : '🔲 Auto Fullscreen Nonaktif', 1500);
};

// Dynamic / Static Background toggle
function applyStaticBg() {
  const customUrl = localStorage.getItem('custom_bg_url');
  bgLayer.className = 'bg-layer';
  if (customUrl) {
    bgLayer.style.backgroundImage = `url("${customUrl}")`;
    bgLayer.style.backgroundColor = '';
  } else {
    // Warna background tab header Google Chrome: #202124
    bgLayer.style.backgroundImage = 'none';
    bgLayer.style.backgroundColor = '#202124';
  }
}

function applyDynamicBg() {
  bgLayer.style.backgroundColor = '';
  bgLayer.style.backgroundImage = ''; // Menghapus inline style 'none' dari applyStaticBg
  bgLayer.className = `bg-layer ${currentBg}`;
}

function toggleDynamicBg(enabled) {
  isDynamicBg = enabled;
  try { localStorage.setItem('wordle_dynamicBg', enabled); } catch(e) {}
  if (enabled) {
    applyDynamicBg();
    showToast('🖼️ Background Dinamis Aktif', 1500);
  } else {
    applyStaticBg();
    showToast('⬛ Background Statis Aktif', 1500);
  }
}

function getScore(guess, target) {
  const g = guess.split('');
  const t = target.split('');
  let c = 0, p = 0;
  for(let i=0; i<g.length; i++) {
    if(g[i]===t[i]) { c++; t[i]=null; g[i]=null; }
  }
  for(let i=0; i<g.length; i++) {
    if(g[i]!==null && t.includes(g[i])) {
      p++;
      t[t.indexOf(g[i])] = null;
    }
  }
  return {c, p};
}

function getWordleFeedback(guess, target) {
  const g = guess.split('');
  const t = target.split('');
  const statuses = Array(g.length).fill('absent');
  for(let i=0; i<g.length; i++) {
    if(g[i]===t[i]) { statuses[i] = 'correct'; t[i]=null; g[i]=null; }
  }
  if (!isNoYellowMode) {
    for(let i=0; i<g.length; i++) {
      if(g[i]!==null && t.includes(g[i])) {
        statuses[i] = 'present';
        t[t.indexOf(g[i])] = null;
      }
    }
  }
  return statuses;
}

function validateHardMode(guessWord) {
  if (hardModeState === 'off' || guesses.length === 0) return { valid: true };

  const validPastGuesses = guesses.filter(g => VALID_WORDS.includes(g));

  for (const past of validPastGuesses) {
    if (currentGameMode === 'word500' || currentGameMode === 'word600') {
      const actual = getScore(past, currentWord);
      const simulated = getScore(past, guessWord);
      if (actual.c !== simulated.c || actual.p !== simulated.p) {
        // Pesan singkat agar mudah dibaca di live stream
        let reason = "";
        const actC = actual.c, actP = actual.p;
        const simC = simulated.c, simP = simulated.p;

        if (simC + simP < actC + actP) {
           reason = `Clue '${past}' ada ${actC}🟩${actP}🟨 — jumlah huruf cocok di tebakanmu kurang!`;
        } else if (simC + simP > actC + actP) {
           reason = `Clue '${past}' cuma ${actC}🟩${actP}🟨 — tebakanmu bawa terlalu banyak huruf dari kata ini!`;
        } else if (simC !== actC) {
           reason = `Clue '${past}' harusnya ${actC}🟩${actP}🟨 — letak/posisi huruf di tebakanmu salah!`;
        } else {
           reason = `Tidak cocok dengan clue '${past}' (${actC}🟩${actP}🟨)`;
        }
        return { 
          valid: false, 
          msg: `❌ ${reason}`,
          conflictWord: past
        };
      }
    } else {
      const statuses = getWordleFeedback(past, currentWord);
      const newG = guessWord.split('');
      
      // Ultra hard mode check: no using completely gray letters
      if (hardModeState === 'ultra') {
        const completelyGray = new Set();
        for(let i=0; i<past.length; i++) {
          if (statuses[i] === 'absent') {
            let hasOther = false;
            for(let j=0; j<past.length; j++) {
              if (past[j] === past[i] && (statuses[j] === 'correct' || statuses[j] === 'present')) {
                hasOther = true; break;
              }
            }
            if (!hasOther) completelyGray.add(past[i]);
          }
        }
        for(let i=0; i<guessWord.length; i++) {
          if (completelyGray.has(guessWord[i])) {
            return { valid: false, msg: `Huruf "${guessWord[i]}" (abu-abu) tidak boleh digunakan lagi`, conflictWord: past };
          }
        }
      }
      
      // Check Greens
      for(let i=0; i<past.length; i++) {
        if(statuses[i] === 'correct') {
          if(newG[i] !== past[i]) {
            return { valid: false, msg: `Huruf ke-${i+1} harus "${past[i]}"`, conflictWord: past };
          }
          newG[i] = null;
        }
      }
      
      // Check Yellows
      for(let i=0; i<past.length; i++) {
        if(statuses[i] === 'present') {
          if(!newG.includes(past[i])) {
             return { valid: false, msg: `Harus mengandung huruf "${past[i]}"`, conflictWord: past };
          }
          newG[newG.indexOf(past[i])] = null;
        }
      }
    }
  }
  return { valid: true };
}

// Connection Logic
function showDisconnectBanner(message) {
  const banner = document.getElementById('disconnectBanner');
  if (banner) {
    document.getElementById('disconnectMsg').textContent = message || 'Koneksi terputus';
    banner.classList.add('show');
  }
}

function hideDisconnectBanner() {
  const banner = document.getElementById('disconnectBanner');
  if (banner) {
    banner.classList.remove('show');
  }
}

function attemptReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (!lastUsername) return;

  reconnectTimer = setTimeout(() => {
    console.log('[Reconnect] Attempting to reconnect to TikTok...');
    showToast('🔄 Reconnecting...', 3000);
    if (socket && socket.connected) {
      socket.emit('connect-tiktok', { uniqueId: lastUsername, sessionId: lastSessionId });
    }
  }, 5000);
}

window.handleBackendChange = function(val) {
  const usernameGroup = document.getElementById('usernameInput').parentElement;
  const sessionGroup = document.getElementById('sessionInput').parentElement;
  const ipGroup = document.getElementById('indofinityIpGroup');
  const loginSubtitle = document.getElementById('loginTitle').nextElementSibling;
  if (val === 'indofinity') {
    usernameGroup.style.display = 'none';
    sessionGroup.style.display = 'none';
    if (ipGroup) ipGroup.style.display = 'flex';
    if (loginSubtitle) loginSubtitle.textContent = "Connect via IndoFinity to start";
  } else {
    usernameGroup.style.display = 'flex';
    sessionGroup.style.display = 'flex';
    if (ipGroup) ipGroup.style.display = 'none';
    if (loginSubtitle) loginSubtitle.textContent = "Enter TikTok username to start";
  }
};

function connectToLive() {
  const username = document.getElementById('usernameInput').value.trim();
  const lang = document.getElementById('languageSelect').value;
  const sessionInputElem = document.getElementById('sessionInput');
  const sessionId = sessionInputElem ? sessionInputElem.value.trim() : "";
  const backendSelect = document.getElementById('backendSelect');
  const backend = backendSelect ? backendSelect.value : 'socketio';

  if (backend !== 'indofinity' && !username) {
    loginStatus.textContent = "Enter a username first!";
    return;
  }

  // Destroy socket if it doesn't match current backend
  if (socket) {
    const isIndoFinity = socket instanceof IndoFinitySocket;
    if ((backend === 'indofinity' && !isIndoFinity) || (backend === 'socketio' && isIndoFinity)) {
      if (socket.ws) socket.ws.close();
      if (socket.disconnect) socket.disconnect();
      socket = null;
    }
  }

  // Fallback username for IndoFinity so it doesn't break header/localStorage
  lastUsername = backend === 'indofinity' ? 'IndoFinity_Host' : username;
  lastLang = lang;
  lastSessionId = sessionId;

  // Read IndoFinity IP
  const ipInput = document.getElementById('indofinityIpInput');
  const indofinityIp = ipInput ? ipInput.value.trim() || 'localhost' : 'localhost';

  // Persist to localStorage for auto-reconnect on refresh
  try {
    localStorage.setItem('wordle_username', username);
    localStorage.setItem('wordle_lang', lang);
    localStorage.setItem('wordle_sessionid', sessionId);
    localStorage.setItem('wordle_backend', backend);
    localStorage.setItem('wordle_indofinity_ip', indofinityIp);
  } catch (e) {}
  connectBtn.disabled = true;
  connectBtn.textContent = "Connecting...";
  loginStatus.textContent = "Loading dictionary...";

  loadWordLists(lang).then(() => {
    loginStatus.textContent = "Connecting to server...";

    if (!socket) {
      if (backend === 'indofinity') {
        socket = new IndoFinitySocket(`ws://${indofinityIp}:62024`);
      } else {
        socket = io(SOCKET_URL);
      }
      setupSocketListeners();
    } else if (socket.connected) {
      if (backend === 'indofinity') {
        if (socket.listeners['statusUpdate']) {
          socket.listeners['statusUpdate'].forEach(cb => cb({ status: 'connected', uniqueId: 'IndoFinity' }));
        }
      } else {
        socket.emit('connect-tiktok', { uniqueId: username, sessionId });
      }
    } else {
      loginStatus.textContent = "Waiting for server connection...";
    }
  }).catch(err => {
    loginStatus.textContent = "Error loading words!";
    connectBtn.disabled = false;
    connectBtn.textContent = "Connect to Live";
  });
}

function startOfflineMode() {
  const lang = document.getElementById('languageSelect').value;
  lastLang = lang;
  lastUsername = ""; // Clear username to prevent TikTok auto-connect
  connectBtn.disabled = true;
  connectBtn.textContent = "Loading...";
  loginStatus.textContent = "Loading dictionary...";

  loadWordLists(lang).then(() => {
    loginOverlay.style.display = 'none';
    gameContainer.style.display = 'flex';
    document.getElementById('hostMusicControl').style.display = 'flex';
    roomHost.textContent = `@HostOffline`;
    
    isConnectedToTikTok = false;
    
    // Initialize socket to local server for music requests
    if (!socket) {
      socket = io(SOCKET_URL);
      setupSocketListeners();
    }
    
    if (!currentWord) {
      startNewRound();
    }
  }).catch(err => {
    loginStatus.textContent = "Error loading words!";
    connectBtn.disabled = false;
    connectBtn.textContent = "Connect to Live";
  });
}

// Auto-reconnect on page refresh using saved credentials
function autoReconnect() {
  try {
    const savedUser = localStorage.getItem('wordle_username');
    const savedLang = localStorage.getItem('wordle_lang');
    const savedSession = localStorage.getItem('wordle_sessionid');
    const savedBackend = localStorage.getItem('wordle_backend');
    const savedIp = localStorage.getItem('wordle_indofinity_ip');
    const savedMode = sessionStorage.getItem('wordle_gameMode');
    
    if ((savedUser || savedBackend === 'indofinity') && savedMode) {
      // Restore game mode
      currentGameMode = savedMode;

      // Hide game select, show login for auto-connect
      gameSelectOverlay.style.display = 'none';
      loginOverlay.style.display = 'flex';

      // Pre-fill login fields
      document.getElementById('usernameInput').value = savedUser || '';
      const langSelect = document.getElementById('languageSelect');
      if (savedLang && langSelect) langSelect.value = savedLang;
      const ipInput = document.getElementById('indofinityIpInput');
      if (savedIp && ipInput) ipInput.value = savedIp;
      const sessionInput = document.getElementById('sessionInput');
      if (savedSession && sessionInput) sessionInput.value = savedSession;
      const backendSelect = document.getElementById('backendSelect');
      if (savedBackend && backendSelect) {
        backendSelect.value = savedBackend;
        if (typeof handleBackendChange === 'function') handleBackendChange(savedBackend);
      }

      
      // Auto-connect
      connectToLive();
    }
  } catch (e) {}
}

// Run auto-reconnect when page loads
window.addEventListener('DOMContentLoaded', () => {
  // Smart IP detection: use the hostname the page was loaded from
  const ipInput = document.getElementById('indofinityIpInput');
  if (ipInput) {
    const savedIp = localStorage.getItem('wordle_indofinity_ip');
    if (savedIp) {
      ipInput.value = savedIp;
    } else {
      // Auto-detect: if page is loaded via a LAN IP, use that same IP for IndoFinity
      const host = window.location.hostname;
      ipInput.value = (host && host !== '0.0.0.0') ? host : 'localhost';
    }
  }

  autoReconnect();
  const backendSelect = document.getElementById('backendSelect');
  if (backendSelect && typeof handleBackendChange === 'function') {
    handleBackendChange(backendSelect.value);
  }

  // Always establish local socket for music features
  localSocket = io(SOCKET_URL);
  
  localSocket.on('music-request', (data) => {
    console.log("Music Requested:", data);
    
    // Check banned keywords
    const titleLower = data.title.toLowerCase();
    const queryLower = (data.originalQuery || "").toLowerCase();
    
    if (musicSettings.bannedKeywords.length > 0) {
      if (musicSettings.bannedKeywords.some(kw => titleLower.includes(kw) || queryLower.includes(kw))) {
        console.log("Music rejected: Contains banned keyword");
        if (data.requesterName === "Host") showToast("🚫 Lagu ditolak: Mengandung kata terlarang!");
        return;
      }
    }
    
    // Check duration
    let durMins = 0;
    if (data.duration) {
      const parts = data.duration.split(':').map(Number);
      if (parts.length === 2) durMins = parts[0] + (parts[1]/60);
      else if (parts.length === 3) durMins = (parts[0]*60) + parts[1] + (parts[2]/60);
    }
    if (musicSettings.maxDuration > 0 && durMins > musicSettings.maxDuration) {
      console.log("Music rejected: Exceeds max duration");
      if (data.requesterName === "Host") showToast(`🚫 Lagu ditolak: Durasi melebihi batas (${musicSettings.maxDuration} menit)!`);
      return;
    }
    
    // Check global limit
    if (musicSettings.maxGlobal > 0 && musicQueue.length >= musicSettings.maxGlobal) {
      console.log("Music rejected: Global queue full");
      if (data.requesterName === "Host") showToast("🚫 Antrian penuh!");
      return;
    }
    
    // Check user limit
    if (musicSettings.maxUser > 0 && data.requesterName !== "Host") {
      const userReqs = musicQueue.filter(m => m.requesterName === data.requesterName).length;
      if (userReqs >= musicSettings.maxUser) {
        console.log(`Music rejected: User ${data.requesterName} hit queue limit`);
        return;
      }
    }
    
    musicQueue.push(data);
    updateMusicQueueUI();
    showMusicNotif(data.requesterName, data.title);
    
    if (!isMusicPlaying && musicQueue.length === 1) {
      playNextMusic();
    }
  });

  localSocket.on('music-skip', () => {
    console.log("Music skip requested via command");
    if (isMusicPlaying) {
      playNextMusic();
    }
  });
});

function setupSocketListeners() {
  // --- Socket.IO connection lifecycle (Bug 3 fix) ---
  socket.on('connect', () => {
    console.log('[Socket.IO] Connected to local server');
    hideDisconnectBanner();
    // Only send connect-tiktok if we're NOT already connected (prevent duplicates)
    if (lastUsername && !isConnectedToTikTok) {
      socket.emit('connect-tiktok', { uniqueId: lastUsername, sessionId: lastSessionId });
    }
  });

  socket.on('envSessionId', (sessionId) => {
    const sessionInputElem = document.getElementById('sessionInput');
    if (sessionInputElem && !sessionInputElem.value.trim()) {
      sessionInputElem.value = sessionId;
    }
  });

  socket.on('disconnect', () => {
    console.log('[Socket.IO] Disconnected from server');
    isConnectedToTikTok = false;
    if (gameContainer.style.display !== 'none') {
      showDisconnectBanner('Server connection lost. Reconnecting...');
    }
  });

  socket.on('reconnect', () => {
    console.log('[Socket.IO] Reconnected to server');
    showToast('✅ Server reconnected!', 2000);
    if (lastUsername) {
      socket.emit('connect-tiktok', { uniqueId: lastUsername, sessionId: lastSessionId });
    }
  });

  // --- TikTok status updates (Bug 1, 6, 7 fix) ---
  socket.on('statusUpdate', (data) => {
    if (data.status === 'connected') {
      isConnectedToTikTok = true;
      hideDisconnectBanner();
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }

      loginOverlay.style.display = 'none';
      gameContainer.style.display = 'flex';
      document.getElementById('hostMusicControl').style.display = 'flex';
      roomHost.textContent = `@${data.uniqueId}`;

      // Bug 7 fix: use boolean flag instead of empty string check
      if (!currentWord) {
        startNewRound();
      }
    } else if (data.status === 'connecting') {
      // Bug 6 fix: show connecting feedback
      loginStatus.textContent = "Connecting to TikTok Live...";
      if (gameContainer.style.display !== 'none') {
        showDisconnectBanner('Reconnecting to TikTok Live...');
      }
    } else if (data.status === 'disconnected') {
      // Bug 1 fix: always re-enable button, not just when error exists
      isConnectedToTikTok = false;
      const errorMsg = data.error || 'Connection lost';

      if (gameContainer.style.display === 'none') {
        // Still on login screen
        loginStatus.textContent = "Error: " + errorMsg;
        connectBtn.disabled = false;
        connectBtn.textContent = "Try Again";
      } else {
        // Bug 2 fix: already in game → show banner + auto-reconnect
        showDisconnectBanner(errorMsg);
        attemptReconnect();
      }
    }
  });

  // --- Bug 5 fix: handle tiktokConnected for late-joining clients ---
  socket.on('tiktokConnected', (data) => {
    console.log('[TikTok] Connected event received', data);
    isConnectedToTikTok = true;
    hideDisconnectBanner();

    if (gameContainer.style.display === 'none') {
      loginOverlay.style.display = 'none';
      gameContainer.style.display = 'flex';
      document.getElementById('hostMusicControl').style.display = 'flex';
    }

    if (!currentWord) {
      startNewRound();
    }
  });

  // --- Bug 4 fix: handle tiktokDisconnected ---
  socket.on('tiktokDisconnected', (reason) => {
    console.log('[TikTok] Disconnected:', reason);
    isConnectedToTikTok = false;

    let message = 'TikTok connection lost';
    if (reason === 'tiktok.live_ended') message = 'Live stream ended';
    else if (reason === 'tiktok.disconnected') message = 'TikTok disconnected';
    else if (reason === 'manual_disconnect') message = 'Disconnected manually';

    if (gameContainer.style.display !== 'none') {
      showDisconnectBanner(message);
      // Auto-reconnect unless manually disconnected
      if (reason !== 'manual_disconnect') {
        attemptReconnect();
      }
    }
  });

  // --- Game events ---
  socket.on('chat', (data) => {
    const username = data.nickname || data.uniqueId;
    if (username) recordActivity(username);

    // Check for music request when using IndoFinity (local server handles it otherwise)
    if (socket instanceof IndoFinitySocket && data.comment && data.comment.toLowerCase().startsWith('!play ')) {
      if (musicSettings.requestsEnabled !== false) {
        const query = data.comment.substring(6).trim();
        if (query && localSocket) {
          localSocket.emit('chat-music-request', {
            query: query,
            requesterName: data.nickname || data.uniqueId,
            requesterImg: data.profilePictureUrl
          });
        }
      }
      return;
    }

    readTTS(data.nickname, data.comment, data.followRole, data.isFollower);
    handleChatGuess(data);
  });

  socket.on('member', (data) => {
    const username = data.nickname || data.uniqueId;
    if (username) recordActivity(username);
    if (typeof handleAutoGuessOnJoin === 'function') handleAutoGuessOnJoin(data);
  });

  let socialAlertTimeout = null;
  function showSocialAlert(userData, actionType) {
    const container = document.getElementById('socialAlertContainer');
    const avatar = document.getElementById('socialAlertAvatar');
    const nameEl = document.getElementById('socialAlertName');
    const actionEl = document.getElementById('socialAlertAction');
    const giftImg = document.getElementById('socialAlertGiftImg');
    const giftCount = document.getElementById('socialAlertGiftCount');

    if (!container || !userData) return;

    avatar.src = userData.profilePictureUrl || 'assets/default-avatar.png';
    nameEl.textContent = userData.nickname || userData.uniqueId || 'Seseorang';
    
    if (giftImg) giftImg.style.display = 'none';
    if (giftCount) giftCount.style.display = 'none';
    
    if (actionType === 'share') {
      actionEl.textContent = 'TELAH SHARE LIVE! 🚀';
      actionEl.style.color = '#2EE06A';
      container.style.borderColor = '#2EE06A';
    } else if (actionType === 'follow') {
      actionEl.textContent = 'BARU SAJA FOLLOW! 💖';
      actionEl.style.color = 'var(--primary)';
      container.style.borderColor = 'var(--primary)';
      
      playSocialAlertAudio(socialAudioSettings.followSound);
    } else if (actionType === 'gift') {
      const giftName = userData.giftName ? userData.giftName.toUpperCase() : 'GIFT';
      actionEl.textContent = `MENGIRIM ${giftName}! 🎁`;
      actionEl.style.color = '#FFD700';
      container.style.borderColor = '#FFD700';
      
      if (giftImg && userData.giftPictureUrl) {
        giftImg.src = userData.giftPictureUrl;
        giftImg.style.display = 'block';
      }
      if (giftCount && userData.repeatCount) {
        giftCount.textContent = `x${userData.repeatCount}`;
        giftCount.style.display = 'block';
      }
      
      const rawGiftName = userData.giftName ? userData.giftName.trim().toLowerCase() : '';
      const customMatch = (socialAudioSettings.customGifts || []).find(item => item.giftName === rawGiftName);
      const giftSoundUrl = customMatch ? customMatch.soundUrl : socialAudioSettings.defaultGiftSound;
      playSocialAlertAudio(giftSoundUrl);
    }

    container.classList.add('show');

    if (socialAlertTimeout) clearTimeout(socialAlertTimeout);
    socialAlertTimeout = setTimeout(() => {
      container.classList.remove('show');
    }, 4000);
  }

  socket.on('share', (data) => {
    showSocialAlert(data, 'share');
    const username = data.nickname || data.uniqueId;
    if (username) {
      recordActivity(username);
      playerShares[username] = (playerShares[username] || 0) + 1;
      localStorage.setItem('pts_share_' + username, playerShares[username]);
      updateMarqueeUI();
    }
  });

  socket.on('follow', (data) => {
    showSocialAlert(data, 'follow');
    const username = data.nickname || data.uniqueId;
    if (username) recordActivity(username);
  });

  socket.on('gift', (data) => {
    // Only show alert when streak ends or it's a non-repeatable gift, to prevent spam
    if (data.giftType === 1 && !data.repeatEnd) return;
    showSocialAlert(data, 'gift');
    const username = data.nickname || data.uniqueId;
    if (username) {
      recordActivity(username);
      const coins = data.totalDiamonds || ((data.diamondCount || 0) * (data.repeatCount || 1));
      if (coins > 0) {
        playerGifts[username] = (playerGifts[username] || 0) + coins;
        localStorage.setItem('pts_gift_' + username, playerGifts[username]);
        updateMarqueeUI();
      }
    }
  });

  socket.on('like', (data) => {
    const addedLikes = (typeof data.likeCount === 'number') ? data.likeCount : 1;
    const username = data.nickname || data.uniqueId;
    if (username) {
      recordActivity(username);
      playerLikes[username] = (playerLikes[username] || 0) + addedLikes;
      localStorage.setItem('pts_like_' + username, playerLikes[username]);
      updateMarqueeUI();
    }
    
    // Always spawn heart animation + counter for visual feedback
    spawnHeartFlurry(Math.min(addedLikes, 5));
    updateLikeCounter(data, addedLikes);
    
    // Like-restart logic only when waiting
    if (isLikeRestartEnabled && isWaitingForLikes) {
      currentLikes += addedLikes;
      updateLikeProgressBar();
      
      if (currentLikes >= likeRestartThreshold) {
        if (window.playHostAudio) playHostAudio('interaction');
        executeRestartTransition();
      }
    }
  });

}

// Queue system for high-volume chat
let guessQueue = [];

// Deduplication: mencegah user kirim kata yang sama lebih dari sekali per ronde
let userGuessDedup = new Set(); // key: "userId:KATA"
let joinGuessUsersDedup = new Set(); // key: userId
let lastJoinGuessTime = 0;

function getFarWordFromTarget() {
  if (!VALID_WORDS || VALID_WORDS.length === 0 || !currentWord) return null;
  const targetChars = new Set(currentWord.split(''));
  
  // 1. Cari kata dengan 0 huruf overlap dengan target
  const zeroOverlap = VALID_WORDS.filter(w => w.length === WORD_LENGTH && w !== currentWord && ![...w].some(c => targetChars.has(c)));
  if (zeroOverlap.length > 0) {
    return zeroOverlap[Math.floor(Math.random() * zeroOverlap.length)];
  }
  
  // 2. Jika tidak ada 0 overlap, cari dengan overlap minimal
  let bestWords = [];
  let minOverlap = 99;
  for (let w of VALID_WORDS) {
    if (w.length !== WORD_LENGTH || w === currentWord) continue;
    let overlap = 0;
    for (let c of w) {
      if (targetChars.has(c)) overlap++;
    }
    if (overlap < minOverlap) {
      minOverlap = overlap;
      bestWords = [w];
    } else if (overlap === minOverlap) {
      bestWords.push(w);
    }
  }
  if (bestWords.length > 0) {
    return bestWords[Math.floor(Math.random() * bestWords.length)];
  }
  return null;
}

function handleAutoGuessOnJoin(memberData) {
  if (isGameOver || !window.autoGuessOnJoin) return;
  
  const userId = memberData.uniqueId || memberData.nickname || 'anon_joiner';
  if (joinGuessUsersDedup.has(userId)) return; // 1x auto-jawab saat join per ronde
  
  // Throttle agar tidak spam jika banyak joiner sekaligus (min interval 2.5 detik)
  const now = Date.now();
  if (now - lastJoinGuessTime < 2500) return;
  
  const farWord = getFarWordFromTarget();
  if (!farWord) return;
  
  lastJoinGuessTime = now;
  joinGuessUsersDedup.add(userId);
  
  const simulatedData = {
    nickname: memberData.nickname || memberData.uniqueId || 'Viewer',
    uniqueId: memberData.uniqueId || 'viewer',
    profilePictureUrl: memberData.profilePictureUrl || 'https://p16-sign-va.tiktokcdn.com/tos-maliva-avt-0068/7339798436154310662~c5_100x100.jpeg',
    comment: farWord,
    followRole: memberData.followRole || 0,
    isFollower: memberData.isFollower || false
  };

  handleChatGuess(simulatedData);
}

// Handle Guesses from Chat
function handleChatGuess(data) {
  if (isGameOver) return;

  const rawMsg = data.comment.trim().toLowerCase();
  
  // Rank Command
  if (rawMsg === '!myrank' || rawMsg === '!rank') {
    handleMyRank(data);
    return;
  }

  // Hapus semua karakter selain huruf A-Z untuk bypass filter TikTok
  const msg = data.comment.toUpperCase().replace(/[^A-Z]/g, '');
  
  let isAllowedLength = (msg.length === WORD_LENGTH);
  if (currentGameMode === 'wordtango') {
    isAllowedLength = (msg.length >= 3 && msg.length <= 6);
  } else if (currentGameMode === 'wordgrid') {
    isAllowedLength = (msg.length >= 3);
  }

  if (isAllowedLength) {
    // Tolak jika user sudah pernah kirim kata yang sama di ronde ini
    const userId = data.uniqueId || data.nickname || 'anon';
    const dedupKey = `${userId}:${msg}`;
    if (userGuessDedup.has(dedupKey)) return; // skip duplikat
    userGuessDedup.add(dedupKey);

    if (guessQueue.length < 50) {
      guessQueue.push({ guessWord: msg, userData: data });
      processQueue();
    }
  }
}

function processQueue() {
  if (isProcessing || guessQueue.length === 0 || isGameOver) return;
  isProcessing = true;
  
  const { guessWord, userData } = guessQueue.shift();

  processGuess(guessWord, userData);
  
  isProcessing = false;
  // Reduced from 50ms; near-instant queue drain
  if (guessQueue.length > 0) {
    setTimeout(processQueue, 10);
  }
}

function showFloatingPoints(points, targetElementId) {
  const target = document.getElementById(targetElementId);
  if (!target) return;
  
  const floater = document.createElement('div');
  floater.className = 'floating-points';
  floater.textContent = `+${points}`;
  document.body.appendChild(floater);
  
  const rect = target.getBoundingClientRect();
  floater.style.left = `${rect.left + (rect.width / 2)}px`;
  floater.style.top = `${rect.top}px`;
  
  setTimeout(() => floater.remove(), 2600);
}

let lastInvalidTime = 0;

function updateWordLoopUI() {
  if (currentGameMode !== 'wordloop') return;
  const wordLoopCountEl = document.getElementById('wordLoopCount');
  
  if (guesses.length === 0) {
    if (wordLoopCountEl) wordLoopCountEl.textContent = `Ketik kata ${WORD_LENGTH} huruf bebas untuk mulai!`;
    return;
  }
  
  if (guesses.length === 6) {
    if (wordLoopCountEl) wordLoopCountEl.textContent = `LOOP SELESAI! 🎉`;
    return;
  }
  
  const lastWord = guesses[guesses.length - 1];
  const requiredPrefix = lastWord.slice(-2);
  let available = 0;
  
  if (guesses.length === 5) {
     const requiredSuffix = guesses[0].slice(0, 2);
     for (let w of VALID_WORDS) {
        if (w.length === WORD_LENGTH && w.startsWith(requiredPrefix) && w.endsWith(requiredSuffix)) available++;
     }
     if (wordLoopCountEl) wordLoopCountEl.textContent = `Tersedia ${available} kata (Awal: ${requiredPrefix}, Akhir: ${requiredSuffix})`;
  } else {
     for (let w of VALID_WORDS) {
        if (w.length === WORD_LENGTH && w.startsWith(requiredPrefix)) available++;
     }
     if (wordLoopCountEl) wordLoopCountEl.textContent = `Tersedia ${available} kata (Awal: ${requiredPrefix})`;
  }
  
  // Pre-fill next row
  const nextEmptyRow = document.getElementById(`row-empty-${guesses.length}`);
  if (nextEmptyRow) {
    const tiles = nextEmptyRow.querySelectorAll('.tile');
    if (tiles.length >= WORD_LENGTH) {
      // Clear all first
      tiles.forEach(t => { t.textContent = ''; t.className = 'tile'; });
      
      // Fill prefix
      tiles[0].textContent = requiredPrefix[0];
      tiles[1].textContent = requiredPrefix[1];
      tiles[0].classList.add('prefilled');
      tiles[1].classList.add('prefilled');
      
      // If row 6, fill suffix too
      if (guesses.length === 5) {
        const requiredSuffix = guesses[0].slice(0, 2);
        tiles[WORD_LENGTH - 2].textContent = requiredSuffix[0];
        tiles[WORD_LENGTH - 1].textContent = requiredSuffix[1];
        tiles[WORD_LENGTH - 2].classList.add('prefilled');
        tiles[WORD_LENGTH - 1].classList.add('prefilled');
      }
    }
  }
  
  // Always pre-fill the suffix on the 6th row (if we haven't reached it yet)
  if (guesses.length > 0 && guesses.length < 5) {
    const sixthRow = document.getElementById('row-empty-5');
    if (sixthRow) {
      const sixthTiles = sixthRow.querySelectorAll('.tile');
      if (sixthTiles.length >= WORD_LENGTH) {
        const requiredSuffix = guesses[0].slice(0, 2);
        sixthTiles[WORD_LENGTH - 2].textContent = requiredSuffix[0];
        sixthTiles[WORD_LENGTH - 1].textContent = requiredSuffix[1];
        sixthTiles[WORD_LENGTH - 2].classList.add('prefilled');
        sixthTiles[WORD_LENGTH - 1].classList.add('prefilled');
      }
    }
  }
}

// Graph BFS to check if there is a path from startPrefix to targetSuffix of exact length stepsLeft
function checkWordLoopPath(startPrefix, targetSuffix, stepsLeft) {
    if (stepsLeft === 0) return startPrefix === targetSuffix;
    
    if (!window.wordLoopAdjCache || window.wordLoopAdjCache.wordLength !== WORD_LENGTH || window.wordLoopAdjCache.validWords !== VALID_WORDS) {
        const adj = {};
        for (let w of VALID_WORDS) {
            if (w.length !== WORD_LENGTH) continue;
            const p = w.slice(0, 2);
            const s = w.slice(-2);
            if (!adj[p]) adj[p] = new Set();
            adj[p].add(s);
        }
        window.wordLoopAdjCache = { wordLength: WORD_LENGTH, validWords: VALID_WORDS, adj: adj };
    }
    
    const adj = window.wordLoopAdjCache.adj;
    let currentLevel = new Set([startPrefix]);
    
    for (let step = 0; step < stepsLeft; step++) {
        let nextLevel = new Set();
        for (let prefix of currentLevel) {
            if (adj[prefix]) {
                for (let nextPrefix of adj[prefix]) {
                    nextLevel.add(nextPrefix);
                }
            }
        }
        currentLevel = nextLevel;
        if (currentLevel.size === 0) return false;
    }
    
    return currentLevel.has(targetSuffix);
}

// Keep track of guessed words for the feed in Word Tango
let tangoGuessedWords = new Set();

// Function to add a guess to the Word Tango live feed
function addTangoGuessToFeed(word, userData, isCorrect) {
  const feed = document.getElementById('tangoGuessFeed');
  if (!feed) return;
  
  const upperWord = word.toUpperCase();
  // If already guessed and it's wrong, we can skip adding it again to prevent spamming the history
  if (!isCorrect && tangoGuessedWords.has(upperWord)) return;
  tangoGuessedWords.add(upperWord);
  
  const item = document.createElement('div');
  item.className = `tango-guess-item ${isCorrect ? 'correct' : 'wrong'}`;
  
  const avatar = document.createElement('img');
  avatar.className = 'tango-guess-avatar';
  avatar.src = (userData && userData.profilePictureUrl) ? userData.profilePictureUrl : 'assets/default_avatar.png';
  // handle broken image link gracefully
  avatar.onerror = function() { this.src = 'assets/default_avatar.png'; };
  
  const wordSpan = document.createElement('span');
  wordSpan.className = 'tango-guess-word';
  wordSpan.textContent = upperWord;
  
  const icon = document.createElement('span');
  icon.className = 'tango-guess-icon';
  icon.textContent = isCorrect ? '✅' : '❌';
  
  item.appendChild(avatar);
  item.appendChild(wordSpan);
  item.appendChild(icon);
  
  feed.appendChild(item);
  
  // Maintain max 3 visible items, sliding out the oldest
  const activeItems = Array.from(feed.children).filter(child => !child.classList.contains('slide-out'));
  if (activeItems.length > 3) {
    const oldest = activeItems[0];
    oldest.classList.add('slide-out');
    setTimeout(() => {
      if (oldest.parentNode) oldest.remove();
    }, 300);
  }
}

// Process a valid guess — optimized: no blocking delays
function processGuess(guessWord, userData) {
  if (isBadWordsFilterOn) {
    for (const bad of STOPWORDS) {
      if (guessWord.includes(bad)) {
        console.log(`[Bad Word Filter] Rejected guess: ${guessWord}`);
        return; // Reject silently from the board
      }
    }
  }

  if (currentGameMode === 'wordgrid') {
    const pointsWon = checkWordGridGuess(guessWord, userData.uniqueId || userData.nickname, userData.profilePictureUrl);
    if (pointsWon) {
      addPoints(userData, pointsWon);
    }
    return;
  }

  if (currentGameMode === 'wordtango') {
    const validDict = allValidWords[guessWord.length];
    let isValidWord = validDict && validDict.includes(guessWord);
    if (!isValidWord) return;

    let matchedIndex = -1;
    let matchedPatternIndex = -1;

    for (let i = 0; i < 4; i++) {
      const t = wordTangoTargets[i];
      if (t && !t.solved) {
        if (t.word === guessWord) {
          matchedIndex = i;
          break;
        }
        
        // Check if guess matches the revealed pattern
        if (guessWord.length === t.length) {
          let fitsPattern = true;
          for (let j = 0; j < t.length; j++) {
             if (!t.missingIndices.includes(j)) {
                if (guessWord[j] !== t.word[j]) {
                   fitsPattern = false;
                   break;
                }
             }
          }
          if (fitsPattern) {
             matchedPatternIndex = i;
          }
        }
      }
    }

    if (matchedIndex === -1) {
      // If it doesn't match the exact target, but matches a pattern, add to feed as wrong
      if (matchedPatternIndex !== -1) {
        addTangoGuessToFeed(guessWord, userData, false);
      }
      return;
    }

    // Add correct guess to the feed
    addTangoGuessToFeed(guessWord, userData, true);

    const target = wordTangoTargets[matchedIndex];
    target.solved = true;
    target.solver = userData;
    const pts = target.points || 15;
    addPoints(userData, pts);

    const row = document.getElementById(`tango-row-${matchedIndex}`);
    if (row) {
      row.classList.add('solved');
      const avatar = row.querySelector('.guesser-avatar');
      if (avatar && userData && userData.profilePictureUrl) {
        avatar.src = userData.profilePictureUrl;
        avatar.style.display = '';
        avatar.classList.add('show');
        showFloatingPoints(pts, avatar.id);
      }

      const tiles = row.querySelectorAll('.tile');
      for (let j = 0; j < target.length; j++) {
        const tile = tiles[j];
        if (tile) {
          tile.textContent = target.word[j];
          tile.className = 'tile correct';
          tile.style.transform = 'scale(1.15)';
          setTimeout(() => tile.style.transform = '', 200);
        }
      }
    }

    for (const idx of target.missingIndices) {
      const letter = target.word[idx];
      const poolItem = wordTangoPool.find(item => !item.used && item.char === letter);
      if (poolItem) {
        poolItem.used = true;
      }
    }
    renderTangoPool();

    if (window.playHostAudio) playHostAudio('correct');

    if (wordTangoTargets.every(t => t.solved)) {
      isGameOver = true;

      const solverScores = {};
      wordTangoTargets.forEach(t => {
        if (t.solver && t.solver.uniqueId) {
          if (!solverScores[t.solver.uniqueId]) {
            solverScores[t.solver.uniqueId] = { score: 0, words: 0, data: t.solver };
          }
          solverScores[t.solver.uniqueId].score += (t.points || 15);
          solverScores[t.solver.uniqueId].words++;
        }
      });

      let maxScore = 0;
      Object.values(solverScores).forEach(s => {
        if (s.score > maxScore) maxScore = s.score;
      });

      let mvpData = userData;
      const mvp = Object.values(solverScores).find(s => s.score === maxScore);
      if (mvp) mvpData = mvp.data;

      setTimeout(() => {
        const multiWinList = document.getElementById('multiWinList');
        if (multiWinList) {
          multiWinList.innerHTML = '';
          wordTangoTargets.forEach((t) => {
            const solverData = t.solver || { nickname: 'Unknown', profilePictureUrl: 'assets/bg_nature.png' };
            const isMvp = (mvpData && solverData.uniqueId === mvpData.uniqueId);
            
            const item = document.createElement('div');
            item.className = `multi-win-item ${isMvp ? 'mvp' : ''}`;
            item.innerHTML = `
              <img class="multi-win-avatar" src="${solverData.profilePictureUrl || 'assets/bg_nature.png'}" alt="Avatar">
              <div class="multi-win-info">
                <div class="multi-win-name">${solverData.nickname || 'Unknown'}</div>
                <div class="multi-win-word">${t.word}</div>
              </div>
              <div class="multi-win-points">+${t.points || 15}</div>
            `;
            multiWinList.appendChild(item);
          });
        }
        triggerWinTransition(5000, true);
      }, 1000);
    }
    return;
  }

  let isValidWord = VALID_WORDS.includes(guessWord);

  if (currentGameMode === 'fillblanks') {
    if (!isValidWord) return;
    
    let matchedIndex = -1;
    let isCorrectTarget = false;
    
    // Exact match target
    for (let i = 0; i < 6; i++) {
      if (fillBlanksTargets[i] && !fillBlanksTargets[i].solved && fillBlanksTargets[i].word === guessWord) {
        matchedIndex = i;
        isCorrectTarget = true;
        break;
      }
    }
    
    // If not exact target, check pattern match for invalid display
    if (matchedIndex === -1) {
      for (let i = 0; i < 6; i++) {
        const target = fillBlanksTargets[i];
        if (target && !target.solved && !target.isAnimating) {
          let matchesPattern = true;
          for (let j = 0; j < WORD_LENGTH; j++) {
            const clue = target.clues[j];
            if (clue) {
              if (clue.status === 'correct' && guessWord[j] !== clue.char) {
                matchesPattern = false; break;
              }
              if (clue.status === 'present' && (guessWord[j] === clue.char || !guessWord.includes(clue.char))) {
                matchesPattern = false; break;
              }
            }
          }
          if (matchesPattern) {
            matchedIndex = i;
            isCorrectTarget = false;
            break;
          }
        }
      }
    }
    
    if (matchedIndex !== -1) {
      const row = document.getElementById(`row-empty-${matchedIndex}`);
      
      if (isCorrectTarget) {
        fillBlanksTargets[matchedIndex].solved = true;
        fillBlanksTargets[matchedIndex].solver = userData;
        const pts = fillBlanksTargets[matchedIndex].isYellowRow ? 15 : 10;
        fillBlanksTargets[matchedIndex].points = pts;
        addPoints(userData, pts);
        
        if (row) {
          const avatar = row.querySelector('.guesser-avatar');
          if (avatar && userData && userData.profilePictureUrl) {
            avatar.src = userData.profilePictureUrl;
            avatar.classList.add('show');
            showFloatingPoints(pts, avatar.id);
          }
          
          for (let j = 0; j < WORD_LENGTH; j++) {
            const tile = document.getElementById(`tile-empty-${matchedIndex}-${j}`);
            if (tile) {
              tile.textContent = guessWord[j];
              tile.className = 'tile correct';
              tile.style.transform = 'scale(1.1)';
              setTimeout(() => tile.style.transform = '', 200);
            }
          }
        }
        
        if (fillBlanksTargets.every(t => t.solved)) {
          isGameOver = true;
          
          let mvpData = userData;
          const solverScores = {};
          fillBlanksTargets.forEach(t => {
            if (t.solver && t.solver.uniqueId) {
              if (!solverScores[t.solver.uniqueId]) {
                solverScores[t.solver.uniqueId] = { score: 0, words: 0, data: t.solver };
              }
              solverScores[t.solver.uniqueId].score += (t.points || 15);
              solverScores[t.solver.uniqueId].words++;
            }
          });
          
          let maxScore = 0;
          Object.values(solverScores).forEach(s => {
            if (s.score > maxScore) maxScore = s.score;
          });
          
          if (userData && userData.uniqueId && solverScores[userData.uniqueId] && solverScores[userData.uniqueId].score === maxScore) {
            mvpData = userData; // Final guesser is tied for points, they win the tiebreaker
          } else {
            const mvp = Object.values(solverScores).find(s => s.score === maxScore);
            if (mvp) mvpData = mvp.data;
          }

          setTimeout(() => {
            const multiWinList = document.getElementById('multiWinList');
            if (multiWinList) {
              multiWinList.innerHTML = '';
              fillBlanksTargets.forEach((t) => {
                const solverData = t.solver || { nickname: 'Unknown', profilePictureUrl: 'assets/bg_nature.png' };
                const isMvp = (mvpData && solverData.uniqueId === mvpData.uniqueId);
                
                const item = document.createElement('div');
                item.className = `multi-win-item ${isMvp ? 'mvp' : ''}`;
                item.innerHTML = `
                  <img class="multi-win-avatar" src="${solverData.profilePictureUrl || 'assets/bg_nature.png'}" alt="Avatar">
                  <div class="multi-win-info">
                    <div class="multi-win-name">${solverData.nickname || 'Unknown'}</div>
                    <div class="multi-win-word">${t.word}</div>
                  </div>
                  <div class="multi-win-points">+${t.points || 15}</div>
                `;
                multiWinList.appendChild(item);
              });
            }
            triggerWinTransition(10000, true);
          }, 1000);
        }
      } else {
        // Pattern matched but wrong target word
        fillBlanksTargets[matchedIndex].isAnimating = true;
        if (row) {
          row.classList.remove('shake');
          void row.offsetWidth; // Trigger reflow
          row.classList.add('shake');
          
          const avatar = row.querySelector('.guesser-avatar');
          const originalAvatarSrc = avatar ? avatar.src : '';
          const originalAvatarShow = avatar ? avatar.classList.contains('show') : false;
          
          if (avatar && userData && userData.profilePictureUrl) {
            avatar.src = userData.profilePictureUrl;
            avatar.classList.add('show');
          }
          
          for (let j = 0; j < WORD_LENGTH; j++) {
            const tile = document.getElementById(`tile-empty-${matchedIndex}-${j}`);
            if (tile) {
              const clue = fillBlanksTargets[matchedIndex].clues[j];
              tile.textContent = guessWord[j];
              
              if (clue && clue.status === 'correct') {
                 tile.className = 'tile correct';
              } else {
                 tile.className = 'tile absent'; 
                 tile.style.transition = 'all 0.3s';
              }
              // optional: add small pulse effect for invalid guess
              tile.style.transform = 'scale(0.95)';
            }
          }
          
          setTimeout(() => {
            if (row) row.classList.remove('shake');
            
            if (!fillBlanksTargets[matchedIndex].solved) {
               fillBlanksTargets[matchedIndex].isAnimating = false;
               if (avatar) {
                 if (originalAvatarShow) {
                   avatar.src = originalAvatarSrc;
                 } else {
                   avatar.classList.remove('show');
                 }
               }
               for (let j = 0; j < WORD_LENGTH; j++) {
                 const tile = document.getElementById(`tile-empty-${matchedIndex}-${j}`);
                 if (tile) {
                   const clue = fillBlanksTargets[matchedIndex].clues[j];
                   tile.className = 'tile';
                   tile.style.transform = '';
                   if (clue) {
                     tile.textContent = clue.char;
                     tile.classList.add(clue.status);
                   } else {
                     tile.textContent = '';
                   }
                 }
               }
            }
          }, 3000); // revert after 3s
        }
      }
    }
    return;
  }

  let hardModeMsg = "";

  // Cek duplikat untuk semua mode (kecuali fillblanks)
  if (isValidWord && guesses.includes(guessWord)) {
    isValidWord = false;
    if (lastLang === 'en') hardModeMsg = `Already guessed this round`;
    else if (lastLang === 'mixed') hardModeMsg = `Sudah ditebak / Already guessed`;
    else hardModeMsg = `Kata sudah ditebak di ronde ini`;
  }
  
  // Word Loop logic
  if (currentGameMode === 'wordloop' && isValidWord) {
    if (isValidWord && guesses.length > 0) {
      const lastWord = guesses[guesses.length - 1];
      const requiredPrefix = lastWord.slice(-2);
      if (!guessWord.startsWith(requiredPrefix)) {
        isValidWord = false;
        hardModeMsg = `Harus diawali huruf "${requiredPrefix}"`;
      }
    }
    
    if (isValidWord && guesses.length === 5) {
      const firstWord = guesses[0];
      const requiredSuffix = firstWord.slice(0, 2);
      if (!guessWord.endsWith(requiredSuffix)) {
        isValidWord = false;
        hardModeMsg = `Akhir loop harus "${requiredSuffix}"`;
      }
    }
    
    if (isValidWord && guesses.length < 5) {
      const newPrefix = guessWord.slice(-2);
      const targetSuffix = guesses.length === 0 ? guessWord.slice(0, 2) : guesses[0].slice(0, 2);
      const stepsLeft = 5 - guesses.length;
      
      const hasContinuations = checkWordLoopPath(newPrefix, targetSuffix, stepsLeft);
      
      if (!hasContinuations) {
        isValidWord = false;
        hardModeMsg = `Jalan buntu! Tidak ada kata sambungan hingga akhir.`;
      }
    }
  }

  let hardModeConflictWord = null;

  if (isValidWord && currentGameMode !== 'wordloop') {
    const hmCheck = validateHardMode(guessWord);
    if (!hmCheck.valid) {
      hardModeMsg = hmCheck.msg;
      hardModeConflictWord = hmCheck.conflictWord || null;
      isValidWord = false; // Treat hard mode violation as invalid guess
    }
  }

  if (!isValidWord) {
    const now = Date.now();
    if (now - lastInvalidTime < 6000) {
      return false; // Skip to prevent flooding & flickering
    }
    lastInvalidTime = now;
  }

  const isWord500 = currentGameMode === 'word500' || currentGameMode === 'word600';

  // Hapus baris invalid sebelumnya dari layar (saat ada tebakan baru masuk)
  if (isWord500 && word500PendingInvalidRow) {
    renderWord500Board();
  } else {
    if (word500PendingInvalidRow) {
      if (word500PendingInvalidRow.parentNode) word500PendingInvalidRow.remove();
      word500PendingInvalidRow = null;
    }
    const invalidRows = document.querySelectorAll('.is-invalid-row');
    invalidRows.forEach(el => el.remove());
  }
  const invalidTooltips = document.querySelectorAll('.is-invalid-tooltip');
  invalidTooltips.forEach(el => el.remove());

  const currentRow = guesses.length;
  
  // 1. Create a new row and attach to top of grid
  const row = document.createElement('div');
  row.className = 'board-row' + (isWord500 ? ' w500-row' : '');
  row.id = `row-${currentRow}`;
  row.style.position = 'relative';
  if (!isValidWord) {
    row.style.zIndex = "999";
  }
  
  let invalidTooltipMsg = hardModeMsg;
  if (!isValidWord && !hardModeMsg) {
    if (lastLang === 'en') invalidTooltipMsg = "Word not in dictionary";
    else if (lastLang === 'mixed') invalidTooltipMsg = "Kata tidak ada di kamus / Not in dictionary";
    else invalidTooltipMsg = "Kata tidak ada di kamus";
  }

  if (invalidTooltipMsg) {
    const tooltip = document.createElement('div');
    tooltip.className = 'row-tooltip is-invalid-tooltip' + (hardModeConflictWord ? ' clue-conflict-tooltip' : '');
    tooltip.textContent = invalidTooltipMsg;
    document.body.appendChild(tooltip);
    
    // Position it dynamically after row is rendered
    requestAnimationFrame(() => {
      const rowRect = row.getBoundingClientRect();
      const tooltipHeight = tooltip.offsetHeight;
      tooltip.style.position = 'fixed';
      tooltip.style.bottom = 'auto';
      tooltip.style.left = (rowRect.left + rowRect.width / 2) + 'px';
      tooltip.style.top = (rowRect.top - tooltipHeight - 8) + 'px';
      tooltip.style.zIndex = '9999';
    });
  }
  
  const avatar = document.createElement('img');
  avatar.className = 'guesser-avatar';
  avatar.id = `avatar-${currentRow}`;
  if (userData && userData.profilePictureUrl) {
    avatar.src = userData.profilePictureUrl;
    avatar.classList.add('show');
  }
  row.appendChild(avatar);

  const tiles = [];
  for (let j = 0; j < WORD_LENGTH; j++) {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.id = `tile-${currentRow}-${j}`;
    tile.textContent = guessWord[j];
    row.appendChild(tile);
    tiles.push(tile);
  }
  
  // 2. Determine statuses
  const guessArray = guessWord.split('');
  const targetArray = currentWord ? currentWord.split('') : [];
  const statuses = Array(WORD_LENGTH).fill('absent');
  
  let correctCount = 0;
  let presentCount = 0;
  let absentCount = 0;

  if (isValidWord) {
    if (currentGameMode === 'wordloop') {
      for (let i = 0; i < WORD_LENGTH; i++) statuses[i] = 'correct';
      // Word Loop gives 5 points per valid word
      addPoints(userData, 5);
      showFloatingPoints(5, `avatar-${currentRow}`);
    } else {
      // First pass: correct
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guessArray[i] === targetArray[i]) {
        statuses[i] = 'correct';
        targetArray[i] = null;
        correctCount++;
        
        // Wordle mode: hint discovery + assist points
        if (!isWord500 && !discoveredLetters[i]) {
          if (guessWord !== currentWord) {
            addPoints(userData, 2);
            showFloatingPoints(2, `tile-${currentRow}-${i}`);
          }
          const currentlyDiscovered = discoveredLetters.filter(l => l !== null).length;
          if (currentlyDiscovered < WORD_LENGTH - 1) {
            const letter = guessArray[i];
            discoveredLetters[i] = letter;
            const hintTile = document.getElementById(`hint-${i}`);
            if (hintTile) {
              hintTile.textContent = letter;
              hintTile.classList.add('discovered');
            }
          }
        }
        guessArray[i] = null;
      }
    }

    // Second pass: present
    if (!isNoYellowMode) {
      for (let i = 0; i < WORD_LENGTH; i++) {
        if (guessArray[i] !== null && targetArray.includes(guessArray[i])) {
          statuses[i] = 'present';
          targetArray[targetArray.indexOf(guessArray[i])] = null;
          presentCount++;
        }
      }
    }
    
    absentCount = WORD_LENGTH - correctCount - presentCount;
    
    // Update Best Guess for Word500
    if (isWord500 && guessWord !== currentWord) {
      const score = (correctCount * 2) + presentCount;
      if (!bestGuess || score > bestGuess.score) {
        bestGuess = {
          word: guessWord,
          score: score,
          c: correctCount,
          p: presentCount,
          a: absentCount
        };
        updateBestGuessUI();
      }
    }
  }
  }
  
  // 3. Apply tile classes
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (!isValidWord) {
      // Beda warna: oranye untuk "tidak cocok clue", pink untuk "bukan kata"
      tiles[i].classList.add(hardModeConflictWord ? 'clue-conflict' : 'invalid');
    } else if (isWord500) {
      // Word500: all tiles are blind (no color feedback)
      tiles[i].classList.add('blind');
    } else {
      // Wordle: normal colored feedback
      tiles[i].classList.add(statuses[i]);
    }
  }

  // 4. Word500: append feedback counters
  if (isWord500) {
    if (window.w500UseMastermind) {
      const mmContainer = document.createElement('div');
      mmContainer.className = 'mastermind-container';
      if (!isValidWord) {
        for (let m = 0; m < WORD_LENGTH; m++) {
          const b = document.createElement('div');
          b.className = 'mm-block empty';
          mmContainer.appendChild(b);
        }
      } else {
        for (let m = 0; m < correctCount; m++) { const b = document.createElement('div'); b.className = 'mm-block green'; mmContainer.appendChild(b); }
        for (let m = 0; m < presentCount; m++) { const b = document.createElement('div'); b.className = 'mm-block yellow'; mmContainer.appendChild(b); }
        for (let m = 0; m < absentCount; m++) { const b = document.createElement('div'); b.className = 'mm-block red'; mmContainer.appendChild(b); }
      }
      row.appendChild(mmContainer);
    } else {
      const greenClue = document.createElement('div');
      greenClue.className = 'w500-count green';
      greenClue.textContent = isValidWord ? correctCount : '';

      const yellowClue = document.createElement('div');
      yellowClue.className = 'w500-count yellow';
      yellowClue.textContent = isValidWord ? presentCount : '';

      const redClue = document.createElement('div');
      redClue.className = 'w500-count red';
      redClue.textContent = isValidWord ? absentCount : '';

      if (!isValidWord) {
        greenClue.className = 'w500-count empty-clue';
        yellowClue.className = 'w500-count empty-clue';
        redClue.className = 'w500-count empty-clue';
      }

      row.appendChild(greenClue);
      row.appendChild(yellowClue);
      row.appendChild(redClue);
    }
  }

  if (isValidWord && guessWord !== currentWord && (correctCount + presentCount >= Math.floor(WORD_LENGTH / 2) + 1)) {
    if (!hasPlayedCloseAudio) {
      hasPlayedCloseAudio = true;
      if (window.playHostAudio) playHostAudio('close');
    }
  }

  if (isWord500 && isValidWord) {
    // Word500 valid: tambah ke history lalu render ulang terurut
    word500History.push({ word: guessWord, c: correctCount, p: presentCount, a: absentCount, score: (correctCount * 2) + presentCount, userData });
    guesses.push(guessWord);
    renderWord500Board();
  } else if (isWord500 && !isValidWord) {
    // Word500 invalid: masukkan ke dalam board di posisi terbaru (atas) menggantikan tebakan terbaru,
    // tetap terlihat sampai digantikan oleh tebakan berikutnya.
    row.classList.add('w500-latest-row', 'is-invalid-row');
    if (board.firstChild) {
      board.replaceChild(row, board.firstChild);
    } else {
      board.appendChild(row);
    }
    // Simpan referensi agar bisa dihapus tepat saat tebakan berikutnya masuk
    word500PendingInvalidRow = row;
  } else {
    // Wordle valid/invalid, ATAU Word Loop: insert ke board
    if (currentGameMode === 'wordloop') {
       if (isValidWord) {
          const emptyRow = document.getElementById(`row-empty-${currentRow}`);
          if (emptyRow) board.replaceChild(row, emptyRow);
          else board.appendChild(row);
       } else {
          // Temporarily show invalid guess at bottom
          board.appendChild(row);
       }
    } else {
       board.insertBefore(row, board.firstChild);
       const displayRows = getDisplayRows();
       if (board.children.length > displayRows) board.removeChild(board.lastChild);
    }
    
    if (isValidWord) {
      guesses.push(guessWord);
      if (currentGameMode === 'wordloop') updateWordLoopUI();
    } else {
      row.classList.add('is-invalid-row');
    }
  }

  // Flash baris clue yang berkonflik (Word500/Wordle hard mode)
  if (hardModeConflictWord && !isValidWord) {
    const allRows = board.querySelectorAll('.board-row');
    for (const boardRow of allRows) {
      if (boardRow === row) continue; // Skip row invalid itu sendiri
      const rowTiles = boardRow.querySelectorAll('.tile');
      let rowWord = '';
      rowTiles.forEach(t => rowWord += (t.textContent || ''));
      if (rowWord === hardModeConflictWord) {
        boardRow.classList.add('flash-conflict');
        setTimeout(() => boardRow.classList.remove('flash-conflict'), 1500);
        break;
      }
    }
  }
  
  // Check win
  let isWin = false;
  let winPts = 0;
  if (currentGameMode === 'wordloop') {
    if (guesses.length === 6) {
      isWin = true;
      winPts = 10; // Bonus points for completing loop
    }
  } else {
    if (guessWord === currentWord) {
      isWin = true;
      winPts = isWord500 ? 15 : 10;
    }
  }

  if (isWin) {
    isGameOver = true;
    guessQueue = []; // Bug#1+#5 fix: clear antrian agar tebakan lama tidak masuk ronde baru
    if (winPts > 0) {
      addPoints(userData, winPts);
      showFloatingPoints(winPts, `avatar-${currentRow}`);
    }
    const winnerName = userData ? userData.nickname : 'Someone';
    const avatarUrl = userData && userData.profilePictureUrl ? userData.profilePictureUrl : 'assets/bg_nature.png';
    const winOverlay = document.getElementById('winOverlay');
    document.getElementById('winAvatar').src = avatarUrl;
    document.getElementById('winName').textContent = winnerName;
    document.getElementById('winPts').innerHTML = `🪙 +${winPts} Bonus`;
    const winWordEl = document.getElementById('winWord');
    if (winWordEl) {
      winWordEl.textContent = currentGameMode === 'wordloop' ? "LOOP COMPLETED!" : currentWord;
      winWordEl.style.fontSize = '';
      winWordEl.style.letterSpacing = '';
    }
    
    // Jika di mode Word500/Word600, reveal seluruh grid sebelum overlay muncul
    if (currentGameMode === 'word500' || currentGameMode === 'word600') {
        renderWord500Board(true);
    }
    
    // Tunggu 2 detik dulu agar jawaban di grid (dan efek reveal) terlihat, baru tampilkan overlay
    const winningRow = (currentGameMode === 'word500' || currentGameMode === 'word600') ? board.firstChild : row;
    if (winningRow) {
      const winningTiles = winningRow.querySelectorAll('.tile');
      setTimeout(() => {
        winningTiles.forEach((t, idx) => {
          setTimeout(() => t.classList.add('win-wave'), idx * 100);
        });
      }, 1200); // Mulai wave saat huruf terakhir hampir selesai flip
    }

    setTimeout(() => {
      triggerWinTransition(4000);
    }, 2400); // Tunggu wave selesai sebelum memunculkan overlay
  }
}

// Toast System
function showToast(message, duration = 3000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px) scale(0.9)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => {
      if(toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, duration);
}

// Enter key support for login
document.getElementById('usernameInput').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') connectToLive();
});

// Set initial background
bgLayer.className = `bg-layer ${currentBg}`;

// Session restore is handled by autoReconnect() via DOMContentLoaded

// Fullscreen / Immersive Mode Support
document.addEventListener('click', () => {
  if (!isAutoFullscreen) return;
  const docElm = document.documentElement;
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    if (docElm.requestFullscreen) {
      docElm.requestFullscreen().catch(err => console.log(err));
    } else if (docElm.webkitRequestFullscreen) { /* Safari */
      docElm.webkitRequestFullscreen().catch(err => console.log(err));
    }
  }
});

// Host Guess Logic
const hostGuessBtn = document.getElementById('hostGuessBtn');
const hostGuessInput = document.getElementById('hostGuessInput');
const hostGuessInputContainer = document.getElementById('hostGuessInputContainer');

if (hostGuessBtn && hostGuessInput && hostGuessInputContainer) {
  const submitHostGuess = () => {
    const guess = hostGuessInput.value.trim().toUpperCase();
    if (guess) {
      handleChatGuess({
        comment: guess,
        uniqueId: 'host_offline',
        nickname: 'Host',
        profilePictureUrl: 'assets/bg_nature.png'
      });
      hostGuessInput.value = '';
    }
  };

  hostGuessBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    hostGuessInputContainer.classList.toggle('open');
    if (hostGuessInputContainer.classList.contains('open')) {
      hostGuessInput.focus();
    } else {
      submitHostGuess();
    }
  });

  hostGuessInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitHostGuess();
      hostGuessInputContainer.classList.remove('open');
      hostGuessInput.blur();
    }
  });
  
  hostGuessInputContainer.addEventListener('click', (e) => e.stopPropagation());
  hostGuessInput.addEventListener('click', (e) => e.stopPropagation());
}

// Global keydown for PC host typing
document.addEventListener('keydown', (e) => {
  // Ignore if user is already typing in an input
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  
  // Only intercept letter keys (A-Z)
  if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
    if (hostGuessInputContainer && hostGuessInput) {
      if (!hostGuessInputContainer.classList.contains('open')) {
        hostGuessInputContainer.classList.add('open');
      }
      hostGuessInput.focus();
      hostGuessInput.value += e.key;
      e.preventDefault();
    }
  }
});

// Host Music Control Logic
const hostMusicBtn = document.getElementById('hostMusicBtn');
const hostSkipBtn = document.getElementById('hostSkipBtn');
const hostMusicInputContainer = document.getElementById('hostMusicInputContainer');
const hostMusicInput = document.getElementById('hostMusicInput');

if (hostMusicBtn) {
  hostMusicBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // prevent fullscreen trigger
    // Unlock audio context on music button tap (mobile user gesture)
    try {
      if (ytPlayer && ytPlayer.unMute) {
        ytPlayer.unMute();
        ytPlayer.setVolume(musicSettings.volume);
        ytPlayAttempts = 0;
      }
    } catch(eu) {}
    hostMusicInputContainer.classList.toggle('open');
    if (hostMusicInputContainer.classList.contains('open')) {
      hostMusicInput.focus();
    }
  });

  if (hostSkipBtn) {
    hostSkipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isMusicPlaying) {
        playNextMusic();
      }
    });
  }

  hostMusicInputContainer.addEventListener('click', (e) => e.stopPropagation());

  hostMusicInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = hostMusicInput.value.trim();
      if (query && localSocket) {
        // Pre-warm YouTube player within user gesture context (mobile requires this)
        if (ytPlayer && ytPlayer.unMute) {
          try {
            if (!isMusicPlaying) {
              ytPlayer.unMute();
              ytPlayer.setVolume(musicSettings.volume);
              ytPlayAttempts = 0;
              console.log('[Music] YouTube player pre-warmed via user gesture');
            }
          } catch(ew) {}
        }
        localSocket.emit('host-music-request', query.replace('!play ', ''));
        hostMusicInput.value = '';
        hostMusicInputContainer.classList.remove('open');
      }
    }
  });
}

// ─── Custom Confirm Modal ───
function showCustomConfirm(message, onConfirm) {
  const overlay = document.getElementById('confirmModal');
  const messageEl = document.getElementById('confirmModalMessage');
  const yesBtn = document.getElementById('confirmModalYes');
  const noBtn = document.getElementById('confirmModalNo');
  
  if (!overlay || !messageEl || !yesBtn || !noBtn) return;
  
  messageEl.textContent = message;
  overlay.style.display = 'flex';
  
  // Clone nodes to clean up any previous click listeners
  const newYes = yesBtn.cloneNode(true);
  const newNo = noBtn.cloneNode(true);
  yesBtn.parentNode.replaceChild(newYes, yesBtn);
  noBtn.parentNode.replaceChild(newNo, noBtn);
  
  newYes.addEventListener('click', () => {
    overlay.style.display = 'none';
    if (typeof onConfirm === 'function') onConfirm();
  });
  
  newNo.addEventListener('click', () => {
    overlay.style.display = 'none';
  });
}

// ─── Reset Leaderboard ───
window.resetDailyLeaderboard = function(e) {
  if (e) e.stopPropagation();
  showCustomConfirm("Reset HANYA poin Daily untuk mode ini? Tindakan ini tidak bisa dibatalkan.", () => {
    // Reset daily points, likes, shares, and gifts in memory
    for (const username in playerPoints) {
      playerPoints[username].sessionPts = 0;
    }
    playerLikes = {};
    playerShares = {};
    playerGifts = {};
    playerActivePresence = {};
    
    // Clear daily points, likes, shares, and gifts from localStorage
    const keysToRemove = [];
    const prefix = getPtsPrefix();
    const dailyPrefix = prefix + 'daily_';
    const likePrefix = 'pts_like_';
    const sharePrefix = 'pts_share_';
    const giftPrefix = 'pts_gift_';
    const activePrefix = 'pts_active_';
    const avatarPrefix = 'pts_avatar_';
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith(dailyPrefix) || key.startsWith(likePrefix) || key.startsWith(sharePrefix) || key.startsWith(giftPrefix) || key.startsWith(activePrefix) || key.startsWith(avatarPrefix))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    
    // Refresh UI
    renderLeaderboard();
    updateMarqueeUI(true);
    showToast("Leaderboard Daily dan statistik keaktifan telah di-reset!");
    
    // Close settings dropdown if open
    const dropdown = document.getElementById('settingsDropdown');
    if (dropdown) dropdown.classList.remove('show');
  });
};

window.resetLeaderboard = function(e) {
  if (e) e.stopPropagation();
  showCustomConfirm("Reset Poin Daily dan Weekly (Tebakan Game)? Tindakan ini tidak bisa dibatalkan.", () => {
    playerPoints = {};
    const keysToRemove = [];
    const prefix = getPtsPrefix();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        if (key.includes('_like_') || key.includes('_share_') || key.includes('_gift_') || key.includes('_active_') || key.includes('_avatar_')) continue;
        if (prefix === 'pts_' && (key.startsWith('pts_w500_') || key.startsWith('pts_w600_') || key.startsWith('pts_wloop_') || key.startsWith('pts_fill_') || key.startsWith('pts_tango_') || key.startsWith('pts_wgrid_'))) continue;
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    
    renderLeaderboard();
    showToast("Peringkat Game (Daily/Weekly) telah di-reset!");
    
    const dropdown = document.getElementById('settingsDropdown');
    if (dropdown) dropdown.classList.remove('show');
  });
};

window.resetTopSupporters = function(e) {
  if (e) e.stopPropagation();
  showCustomConfirm("Reset Statistik Top Supporters (Likes, Shares, Gifts, Active)? Tindakan ini tidak bisa dibatalkan.", () => {
    playerLikes = {};
    playerShares = {};
    playerGifts = {};
    playerActivePresence = {};
    
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('_like_') || key.includes('_share_') || key.includes('_gift_') || key.includes('_active_') || key.includes('_avatar_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    
    updateMarqueeUI(true);
    showToast("Statistik Top Supporters telah di-reset!");
    
    const dropdown = document.getElementById('settingsDropdown');
    if (dropdown) dropdown.classList.remove('show');
  });
};

window.changeBackground = function() {
  const fileInput = document.getElementById('bgFileInput');
  if (fileInput && fileInput.files && fileInput.files.length > 0) {
    const file = fileInput.files[0];
    console.log("Memulai proses upload file background:", file.name, "Ukuran:", file.size);
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 720;
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        try {
          localStorage.setItem('custom_bg_url', dataUrl);
          const toggle = document.getElementById('dynamicBgToggle');
          if (toggle) toggle.checked = false;
          toggleDynamicBg(false);
          applyStaticBg();
          showToast("Background berhasil diubah!");
          fileInput.value = '';
          console.log("Background file lokal berhasil disimpan dan diterapkan!");
        } catch(err) {
          console.error("Gagal menyimpan gambar ke localStorage:", err);
          showToast("Error: Memori penuh atau file terlalu besar!", 4000);
        }
      };
      img.onerror = function(err) {
        console.error("Gagal memuat elemen gambar:", err);
        showToast("Error: File gambar tidak valid!", 3000);
      };
      img.src = e.target.result;
    };
    reader.onerror = function(err) {
      console.error("FileReader error:", err);
      showToast("Error membaca file!", 3000);
    };
    reader.readAsDataURL(file);
    return;
  }

  const url = document.getElementById('bgUrlInput').value.trim();
  if (url) {
    console.log("Terapkan custom background URL:", url);
    try {
      localStorage.setItem('custom_bg_url', url);
      const toggle = document.getElementById('dynamicBgToggle');
      if (toggle) toggle.checked = false;
      toggleDynamicBg(false);
      
      applyStaticBg();
      showToast("Background berhasil diubah!");
    } catch(err) {
      console.error("Gagal menyimpan URL ke localStorage:", err);
      showToast("Error: Memori penyimpanan penuh!", 4000);
    }
  } else {
    localStorage.removeItem('custom_bg_url');
    applyStaticBg();
    showToast("Background custom dihapus!");
  }
};

window.updateBgEffects = function() {
  const blurVal = document.getElementById('bgBlurSlider').value;
  const dimVal = document.getElementById('bgDimSlider').value;
  
  localStorage.setItem('custom_bg_blur', blurVal);
  localStorage.setItem('custom_bg_dim', dimVal);
  
  if (typeof window.applyBgEffects === 'function') {
    window.applyBgEffects(blurVal, dimVal);
  }
};

window.applyBgEffects = function(blurVal, dimVal) {
  const overlay = document.querySelector('.glass-overlay');
  if (overlay) {
    overlay.style.backdropFilter = `blur(${blurVal}px)`;
    overlay.style.webkitBackdropFilter = `blur(${blurVal}px)`;
    const op = dimVal / 100;
    overlay.style.background = `rgba(0, 0, 0, ${op})`;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const badWordsToggle = document.getElementById('badWordsToggle');
  if (badWordsToggle) badWordsToggle.checked = isBadWordsFilterOn;

  const noYellowToggle = document.getElementById('noYellowToggle');
  if (noYellowToggle) noYellowToggle.checked = isNoYellowMode;

  const marqueeToggle = document.getElementById('marqueeToggle');
  if (marqueeToggle) marqueeToggle.checked = isMarqueeEnabled;

  const heartFlurryToggle = document.getElementById('heartFlurryToggle');
  if (heartFlurryToggle) heartFlurryToggle.checked = isHeartFlurryEnabled;

  // Initialize length checkboxes
  try {
    const savedLengths = JSON.parse(localStorage.getItem('allowed_lengths') || '[5,6,7,8]');
    if (document.getElementById('len3Toggle')) document.getElementById('len3Toggle').checked = savedLengths.includes(3);
    if (document.getElementById('len4Toggle')) document.getElementById('len4Toggle').checked = savedLengths.includes(4);
    if (document.getElementById('len5Toggle')) document.getElementById('len5Toggle').checked = savedLengths.includes(5);
    if (document.getElementById('len6Toggle')) document.getElementById('len6Toggle').checked = savedLengths.includes(6);
    if (document.getElementById('len7Toggle')) document.getElementById('len7Toggle').checked = savedLengths.includes(7);
    if (document.getElementById('len8Toggle')) document.getElementById('len8Toggle').checked = savedLengths.includes(8);
  } catch(e) {}
  if (typeof updateBoardScaleUI === 'function') updateBoardScaleUI();

  // Handle smooth marquee updates when animation completes a cycle (off-screen)
  const contentEl = document.getElementById('marqueeContent');
  const marqueeContainer = document.getElementById('marqueeContainer');
  if (contentEl && marqueeContainer) {
    contentEl.addEventListener('animationiteration', () => {
      if (pendingMarqueeHTML && pendingMarqueeHTML !== "") {
        contentEl.innerHTML = pendingMarqueeHTML;
        applyMarqueeAnimationProps(contentEl, marqueeContainer);
        pendingMarqueeHTML = "";
      }
    });
  }
});

window.updateAllowedLengths = function() {
  const is3 = document.getElementById('len3Toggle') ? document.getElementById('len3Toggle').checked : false;
  const is4 = document.getElementById('len4Toggle') ? document.getElementById('len4Toggle').checked : false;
  const is5 = document.getElementById('len5Toggle') ? document.getElementById('len5Toggle').checked : true;
  const is6 = document.getElementById('len6Toggle') ? document.getElementById('len6Toggle').checked : true;
  const is7 = document.getElementById('len7Toggle') ? document.getElementById('len7Toggle').checked : true;
  const is8 = document.getElementById('len8Toggle') ? document.getElementById('len8Toggle').checked : true;
  
  let lengths = [];
  if (is3) lengths.push(3);
  if (is4) lengths.push(4);
  if (is5) lengths.push(5);
  if (is6) lengths.push(6);
  if (is7) lengths.push(7);
  if (is8) lengths.push(8);
  
  // Prevent all unchecked (default to 5)
  if (lengths.length === 0) {
    lengths = [5];
    if (document.getElementById('len5Toggle')) document.getElementById('len5Toggle').checked = true;
  }
  
  localStorage.setItem('allowed_lengths', JSON.stringify(lengths));
};

// Word500/600 manual hint marking
document.addEventListener('click', (e) => {
  if (currentGameMode !== 'word500' && currentGameMode !== 'word600') return;
  const tile = e.target.closest('.tile');
  if (!tile || !tile.textContent.trim()) return;
  
  // Only allow clicking tiles inside board or bestGuessBoard
  if (!tile.closest('#board') && !tile.closest('#bestGuessBoard')) return;
  
  if (tile.classList.contains('correct')) {
    tile.classList.remove('correct');
    tile.classList.add('present');
  } else if (tile.classList.contains('present')) {
    tile.classList.remove('present');
    tile.classList.add('absent');
  } else if (tile.classList.contains('absent')) {
    tile.classList.remove('absent');
    tile.classList.add('blind');
  } else {
    tile.classList.remove('blind', 'present', 'absent');
    tile.classList.add('correct');
  }
});

// Mastermind Style Initialization
window.w500UseMastermind = true;

window.updateMastermindNames = function() {
  const isMM = window.w500UseMastermind;
  const nameW500 = document.getElementById('cardNameW500');
  const descW500 = document.getElementById('cardDescW500');
  const iconW500 = document.getElementById('cardIconW500');
  const nameW600 = document.getElementById('cardNameW600');
  const descW600 = document.getElementById('cardDescW600');
  const iconW600 = document.getElementById('cardIconW600');

  if (nameW500) nameW500.textContent = isMM ? 'WORD PEGS 5' : 'WORD500';
  if (descW500) descW500.textContent = isMM ? 'Clue balok warna: berapa huruf hijau & kuning tanpa posisi pasti. Unlimited!' : 'Hanya dapat angka: berapa huruf benar & hampir benar. Unlimited!';
  if (iconW500) iconW500.textContent = isMM ? '🧩' : '🔢';

  if (nameW600) nameW600.textContent = isMM ? 'WORD PEGS 6' : 'WORD600';
  if (descW600) descW600.textContent = isMM ? 'Sama seperti Word Pegs 5 tapi dengan tebakan 6 huruf.' : 'Sama seperti Word500 tapi dengan tebakan 6 huruf.';
  if (iconW600) iconW600.textContent = isMM ? '🧩' : '🔠';
};

document.addEventListener('DOMContentLoaded', () => {
  try {
    const savedStyle = localStorage.getItem('w500_mastermind');
    if (savedStyle !== null) {
      window.w500UseMastermind = savedStyle === 'true';
    }
    const toggle = document.getElementById('w500StyleToggle');
    if (toggle) toggle.checked = window.w500UseMastermind;
    if (window.updateMastermindNames) window.updateMastermindNames();

    const savedAutoJoin = localStorage.getItem('auto_guess_on_join');
    window.autoGuessOnJoin = savedAutoJoin === 'true';
    const joinToggle = document.getElementById('autoGuessJoinToggle');
    if (joinToggle) joinToggle.checked = window.autoGuessOnJoin;
  } catch(e) {}
});

window.toggleW500Style = function(checked) {
  window.w500UseMastermind = checked;
  localStorage.setItem('w500_mastermind', checked);
  if (window.updateMastermindNames) window.updateMastermindNames();
  if (typeof applyGameModeUI === 'function') applyGameModeUI();
  updateBestGuessUI();
  if (currentGameMode === 'word500' || currentGameMode === 'word600') {
    renderWord500Board();
  }
};

window.toggleAutoGuessJoin = function(checked) {
  window.autoGuessOnJoin = checked;
  localStorage.setItem('auto_guess_on_join', checked);
};

// ─── Music Settings Functions ───
window.openMusicSettings = function(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('settingsDropdown');
  if (dropdown) dropdown.classList.remove('open');
  
  const reqToggle = document.getElementById('musicRequestsEnabled');
  if (reqToggle) reqToggle.checked = musicSettings.requestsEnabled !== false;

  document.getElementById('musicMaxGlobal').value = musicSettings.maxGlobal;
  document.getElementById('musicMaxUser').value = musicSettings.maxUser;
  document.getElementById('musicMaxDuration').value = musicSettings.maxDuration;
  document.getElementById('musicBannedKeywords').value = musicSettings.bannedKeywords.join(', ');
  
  document.getElementById('musicVolumeSlider').value = musicSettings.volume;
  document.getElementById('musicVolumeLabel').textContent = `${musicSettings.volume}%`;
  
  document.getElementById('musicSettingsModal').style.display = 'flex';
};

window.updateMusicVolumeUI = function(val) {
  document.getElementById('musicVolumeLabel').textContent = `${val}%`;
  if (ytPlayer && ytPlayer.setVolume) {
    ytPlayer.setVolume(val);
  }
};

window.saveMusicSettings = function() {
  const reqToggle = document.getElementById('musicRequestsEnabled');
  musicSettings.requestsEnabled = reqToggle ? reqToggle.checked : true;

  musicSettings.maxGlobal = parseInt(document.getElementById('musicMaxGlobal').value) || 20;
  musicSettings.maxUser = parseInt(document.getElementById('musicMaxUser').value) || 2;
  musicSettings.maxDuration = parseInt(document.getElementById('musicMaxDuration').value) || 6;
  musicSettings.volume = parseInt(document.getElementById('musicVolumeSlider').value) || 50;
  
  const keywords = document.getElementById('musicBannedKeywords').value;
  musicSettings.bannedKeywords = keywords.split(',').map(k => k.trim().toLowerCase()).filter(k => k);
  
  localStorage.setItem('music_settings', JSON.stringify(musicSettings));
  document.getElementById('musicSettingsModal').style.display = 'none';
  
  if (ytPlayer && ytPlayer.setVolume) {
    ytPlayer.setVolume(musicSettings.volume);
  }
  
  // Re-start instruction rotation so the change in !play instruction is immediately reflected
  startInstructionRotation();
  
  showToast("✅ Pengaturan Musik disimpan!");
};

// ─── Social Audio Settings Functions ───
let socialAudioSettings = {
  enabled: true,
  volume: 80,
  followSound: "https://www.myinstants.com/media/sounds/anime-wow.mp3",
  defaultGiftSound: "https://www.myinstants.com/media/sounds/coin-sound-effect.mp3",
  customGifts: [
    { giftName: "mawar", soundUrl: "https://www.myinstants.com/media/sounds/uwu.mp3" },
    { giftName: "universe", soundUrl: "https://www.myinstants.com/media/sounds/tuturu.mp3" }
  ]
};
try {
  const savedSocialAudio = localStorage.getItem('social_audio_settings');
  if (savedSocialAudio) {
    socialAudioSettings = JSON.parse(savedSocialAudio);
  }
} catch(e) {}

window.openSocialAudioSettings = function(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('settingsDropdown');
  if (dropdown) dropdown.classList.remove('open');
  
  document.getElementById('socialAudioEnabled').checked = socialAudioSettings.enabled !== false;
  document.getElementById('socialAudioVolumeSlider').value = socialAudioSettings.volume;
  document.getElementById('socialAudioVolumeLabel').textContent = `${socialAudioSettings.volume}%`;
  document.getElementById('socialAudioFollowUrl').value = socialAudioSettings.followSound || '';
  document.getElementById('socialAudioDefaultGiftUrl').value = socialAudioSettings.defaultGiftSound || '';
  
  // Format custom gifts mapping text: "Rose = URL"
  const mappingLines = (socialAudioSettings.customGifts || []).map(item => {
    return `${item.giftName} = ${item.soundUrl}`;
  });
  document.getElementById('socialAudioCustomGifts').value = mappingLines.join('\n');
  
  document.getElementById('socialAudioSettingsModal').style.display = 'flex';
};

window.saveSocialAudioSettings = function() {
  socialAudioSettings.enabled = document.getElementById('socialAudioEnabled').checked;
  socialAudioSettings.volume = parseInt(document.getElementById('socialAudioVolumeSlider').value) || 80;
  socialAudioSettings.followSound = document.getElementById('socialAudioFollowUrl').value.trim();
  socialAudioSettings.defaultGiftSound = document.getElementById('socialAudioDefaultGiftUrl').value.trim();
  
  const customGiftsText = document.getElementById('socialAudioCustomGifts').value;
  const lines = customGiftsText.split('\n');
  const customGifts = [];
  lines.forEach(line => {
    const parts = line.split('=');
    if (parts.length === 2) {
      const name = parts[0].trim().toLowerCase();
      const url = parts[1].trim();
      if (name && url) {
        customGifts.push({ giftName: name, soundUrl: url });
      }
    }
  });
  socialAudioSettings.customGifts = customGifts;
  
  localStorage.setItem('social_audio_settings', JSON.stringify(socialAudioSettings));
  document.getElementById('socialAudioSettingsModal').style.display = 'none';
  
  showToast("✅ Pengaturan Sound Alert disimpan!");
};

function playSocialAlertAudio(soundUrl) {
  if (!socialAudioSettings.enabled || !soundUrl) return;
  try {
    const audio = new Audio(soundUrl);
    audio.volume = (socialAudioSettings.volume / 100);
    
    // Duck music
    duckMusicVolume();
    audio.play().catch(e => console.log('[SocialAudio] Play blocked', e));
    
    audio.onended = () => {
      restoreMusicVolume();
    };
    audio.onerror = () => {
      restoreMusicVolume();
    };
  } catch (err) {
    console.warn('[SocialAudio] Play error', err);
  }
}

window.previewAlertSound = function(url) {
  if (!url) {
    showToast("⚠️ Masukkan URL sound alert terlebih dahulu!");
    return;
  }
  
  try {
    const vol = parseInt(document.getElementById('socialAudioVolumeSlider').value) || 80;
    const audio = new Audio(url);
    audio.volume = vol / 100;
    
    duckMusicVolume();
    audio.play().catch(e => {
      showToast("🚫 Gagal memutar suara! Periksa kembali URL.");
      restoreMusicVolume();
    });
    
    audio.onended = () => {
      restoreMusicVolume();
    };
    audio.onerror = () => {
      showToast("🚫 Gagal memutar suara! Format URL salah atau diblokir.");
      restoreMusicVolume();
    };
  } catch (err) {
    showToast("🚫 Gagal memutar file audio!");
    restoreMusicVolume();
  }
};

window.testCustomGiftSound = function() {
  const giftNameInput = document.getElementById('socialAudioTestGiftName');
  if (!giftNameInput) return;
  
  const testName = giftNameInput.value.trim().toLowerCase();
  if (!testName) {
    showToast("⚠️ Ketik nama gift yang ingin ditest!");
    return;
  }
  
  const customGiftsText = document.getElementById('socialAudioCustomGifts').value;
  const lines = customGiftsText.split('\n');
  let matchedUrl = "";
  
  lines.forEach(line => {
    const parts = line.split('=');
    if (parts.length === 2) {
      const name = parts[0].trim().toLowerCase();
      const url = parts[1].trim();
      if (name === testName) {
        matchedUrl = url;
      }
    }
  });
  
  if (matchedUrl) {
    showToast(`🔊 Memutar suara kustom untuk gift "${testName}"...`);
    previewAlertSound(matchedUrl);
  } else {
    const defaultUrl = document.getElementById('socialAudioDefaultGiftUrl').value.trim();
    showToast(`🔊 Gift "${testName}" tidak terdaftar. Memutar suara umum...`);
    previewAlertSound(defaultUrl);
  }
};

// ─── TTS Settings Functions ───
let ttsSettings = {
  enabled: false,
  followerOnly: false,
  readNickname: true,
  mode: 'all',
  voiceURI: '',
  volume: 100
};
try {
  const savedTTS = localStorage.getItem('tts_settings');
  if (savedTTS) {
    ttsSettings = JSON.parse(savedTTS);
    if (ttsSettings.volume === undefined) ttsSettings.volume = 100;
    if (ttsSettings.readNickname === undefined) ttsSettings.readNickname = true;
  }
} catch(e) {}

let availableVoices = [];
function loadTTSVoices() {
  availableVoices = window.speechSynthesis.getVoices();
  const select = document.getElementById('ttsVoiceSelect');
  if (select) {
    select.innerHTML = '<option value="">Default Browser Voice</option>';
    availableVoices.forEach(voice => {
      const option = document.createElement('option');
      option.value = voice.voiceURI;
      option.textContent = `${voice.name} (${voice.lang})`;
      if (voice.voiceURI === ttsSettings.voiceURI) option.selected = true;
      select.appendChild(option);
    });
  }
}
if (window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = loadTTSVoices;
  setTimeout(loadTTSVoices, 500);
}

window.openTTSSettings = function(e) {
  if (e) e.stopPropagation();
  const dropdown = document.getElementById('settingsDropdown');
  if (dropdown) dropdown.classList.remove('open');
  
  loadTTSVoices(); // Reload voices just in case
  
  document.getElementById('ttsEnabledToggle').checked = ttsSettings.enabled;
  document.getElementById('ttsFollowerOnlyToggle').checked = ttsSettings.followerOnly;
  
  if (document.getElementById('ttsReadNicknameToggle')) {
    document.getElementById('ttsReadNicknameToggle').checked = ttsSettings.readNickname;
  }
  
  document.getElementById('ttsModeSelect').value = ttsSettings.mode;
  document.getElementById('ttsVoiceSelect').value = ttsSettings.voiceURI;
  
  document.getElementById('ttsVolumeSlider').value = ttsSettings.volume;
  document.getElementById('ttsVolumeLabel').textContent = `${ttsSettings.volume}%`;
  
  document.getElementById('hostAudioEnabledToggle').checked = hostAudioSettings.enabled;
  document.getElementById('hostAudioVolumeSlider').value = hostAudioSettings.volume;
  document.getElementById('hostAudioVolumeLabel').textContent = `${hostAudioSettings.volume}%`;
  
  document.getElementById('ttsSettingsModal').style.display = 'flex';
};

window.updateTTSVolumeUI = function(val) {
  document.getElementById('ttsVolumeLabel').textContent = `${val}%`;
  // We can temporarily store the active volume for testTTS
  window._tempTTSVolume = parseInt(val) || 100;
};

// Original save function handled directly, hook handles host audio
const originalSaveTTS2 = window.saveTTSSettings;
window.saveTTSSettings = function() {
  ttsSettings.enabled = document.getElementById('ttsEnabledToggle').checked;
  ttsSettings.followerOnly = document.getElementById('ttsFollowerOnlyToggle').checked;
  if (document.getElementById('ttsReadNicknameToggle')) {
    ttsSettings.readNickname = document.getElementById('ttsReadNicknameToggle').checked;
  }
  ttsSettings.mode = document.getElementById('ttsModeSelect').value;
  ttsSettings.voiceURI = document.getElementById('ttsVoiceSelect').value;
  ttsSettings.volume = parseInt(document.getElementById('ttsVolumeSlider').value) || 100;
  
  localStorage.setItem('tts_settings', JSON.stringify(ttsSettings));
  document.getElementById('ttsSettingsModal').style.display = 'none';
  window._tempTTSVolume = null;
  
  // Also save host audio (from hook)
  hostAudioSettings.enabled = document.getElementById('hostAudioEnabledToggle').checked;
  hostAudioSettings.volume = parseInt(document.getElementById('hostAudioVolumeSlider').value) || 100;
  localStorage.setItem('host_audio_settings', JSON.stringify(hostAudioSettings));
  window._tempHostAudioVolume = null;
  
  showToast("✅ Pengaturan Suara disimpan!");
};

window.testTTS = function() {
  if (!window.speechSynthesis) return;
  const voiceURI = document.getElementById('ttsVoiceSelect').value;
  const utterance = new SpeechSynthesisUtterance("Halo, ini adalah tes pembaca suara dari TikTok Wordle!");
  
  const vol = (window._tempTTSVolume !== undefined && window._tempTTSVolume !== null) ? window._tempTTSVolume : ttsSettings.volume;
  utterance.volume = vol / 100;
  
  if (voiceURI && availableVoices.length > 0) {
    const selectedVoice = availableVoices.find(v => v.voiceURI === voiceURI);
    if (selectedVoice) utterance.voice = selectedVoice;
  }
  
  // Duck musik saat test TTS
  utterance.onstart = function() { duckMusicVolume(); };
  utterance.onend = function() { restoreMusicVolume(); };
  utterance.onerror = function() { restoreMusicVolume(); };
  
  window.speechSynthesis.cancel(); // Stop any currently playing speech
  window.speechSynthesis.speak(utterance);
};

function readTTS(nickname, comment, followRole, isFollower) {
  if (!ttsSettings.enabled || !window.speechSynthesis) return;
  
  if (ttsSettings.followerOnly) {
    // Check if the user is a follower (followRole 1 or 2, or isFollower boolean)
    if (followRole !== 1 && followRole !== 2 && !isFollower) return;
  }
  
  const msg = comment.trim();
  if (msg.startsWith('!')) return; // Ignore commands
  
  let textToSpeak = "";
  if (ttsSettings.mode === 'guess_only') {
    if (/^[a-zA-Z]+$/.test(msg)) {
       textToSpeak = ttsSettings.readNickname ? `${nickname} menebak ${msg}` : msg;
    }
  } else {
    textToSpeak = ttsSettings.readNickname ? `${nickname} berkata ${msg}` : msg;
  }
  
  if (textToSpeak) {
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.volume = ttsSettings.volume / 100;
    
    if (ttsSettings.voiceURI && availableVoices.length > 0) {
      const selectedVoice = availableVoices.find(v => v.voiceURI === ttsSettings.voiceURI);
      if (selectedVoice) utterance.voice = selectedVoice;
    }
    
    // Duck musik saat TTS bicara
    utterance.onstart = function() { duckMusicVolume(); };
    utterance.onend = function() { restoreMusicVolume(); };
    utterance.onerror = function() { restoreMusicVolume(); };
    
    window.speechSynthesis.speak(utterance);
  }
}

// ─── Host MP3 Audio Auto Functions ───
let hostAudioSettings = {
  enabled: false,
  volume: 100
};
try {
  const savedHostAudio = localStorage.getItem('host_audio_settings');
  if (savedHostAudio) hostAudioSettings = JSON.parse(savedHostAudio);
} catch(e) {}

const hostAudioFiles = {
  start: ['assets/audio/start.mp3'],
  win: ['assets/audio/win1.mp3', 'assets/audio/win2.mp3'],
  close: ['assets/audio/dikit-lagi.mp3'],
  interaction: ['assets/audio/interaction.mp3', 'assets/audio/interaction2.mp3']
};

const sfxAudioFiles = {
  win: ['assets/audio/sfx-win.mp3']
};

let currentHostAudio = null;
let _musicDucked = false;
const DUCK_VOLUME_RATIO = 0.2; // Musik turun ke 20% saat host audio bermain

// ─── Audio Ducking: turunkan volume YouTube saat host bicara ───
function duckMusicVolume() {
  if (_musicDucked) return;
  _musicDucked = true;
  try {
    if (ytPlayer && ytPlayer.setVolume && isMusicPlaying) {
      const duckedVol = Math.round(musicSettings.volume * DUCK_VOLUME_RATIO);
      ytPlayer.setVolume(duckedVol);
      console.log('[Audio] Music ducked to', duckedVol + '%');
    }
  } catch(e) { console.warn('[Audio] Duck error', e); }
}

function restoreMusicVolume() {
  if (!_musicDucked) return;
  _musicDucked = false;
  try {
    if (ytPlayer && ytPlayer.setVolume) {
      ytPlayer.setVolume(musicSettings.volume);
      console.log('[Audio] Music restored to', musicSettings.volume + '%');
    }
  } catch(e) { console.warn('[Audio] Restore error', e); }
}

window.playHostAudio = function(type) {
  if (!hostAudioSettings.enabled) return;
  
  // Play SFX (Backsound) if exists for this type — SFX berjalan independen dari host audio
  // SFX diputar dengan delay 300ms agar suara host terdengar duluan dan tidak tenggelam
  if (typeof sfxAudioFiles !== 'undefined' && sfxAudioFiles[type]) {
    const sfxFiles = sfxAudioFiles[type];
    if (sfxFiles && sfxFiles.length > 0) {
      const sfxFile = sfxFiles[Math.floor(Math.random() * sfxFiles.length)];
      setTimeout(() => {
        const sfxAudio = new Audio(sfxFile);
        // Volume SFX 25% dari volume host — cukup terdengar tapi tidak mengalahkan suara host
        sfxAudio.volume = (hostAudioSettings.volume / 100) * 0.25;
        sfxAudio.play().catch(e => console.log('SFX play blocked', e));
      }, 300);
    }
  }

  const files = hostAudioFiles[type];
  if (!files || files.length === 0) return;
  
  // If a major event (win or start), cancel current audio and play new one
  if (type === 'win' || type === 'start') {
    if (currentHostAudio) {
      currentHostAudio.pause();
      currentHostAudio.currentTime = 0;
    }
  } else {
    // If minor event (close, interaction), and HOST audio is already playing, skip
    // Note: hanya cek currentHostAudio, bukan SFX — supaya SFX tidak menghalangi host
    if (currentHostAudio && !currentHostAudio.paused) {
      return;
    }
  }
  
  const file = files[Math.floor(Math.random() * files.length)];
  currentHostAudio = new Audio(file);
  currentHostAudio.volume = hostAudioSettings.volume / 100;
  
  // Duck musik YouTube selama host audio bermain
  duckMusicVolume();
  
  currentHostAudio.onended = function() {
    restoreMusicVolume();
  };
  currentHostAudio.onerror = function() {
    restoreMusicVolume();
  };
  
  currentHostAudio.play().catch(e => {
    console.log('Host audio play blocked', e);
    restoreMusicVolume(); // Restore jika play gagal
  });
};

window.testHostAudio = function() {
  const types = Object.keys(hostAudioFiles);
  const randomType = types[Math.floor(Math.random() * types.length)];
  
  const vol = (window._tempHostAudioVolume !== undefined && window._tempHostAudioVolume !== null) ? window._tempHostAudioVolume : hostAudioSettings.volume;

  // Test SFX if exists — same volume and delay as playHostAudio
  if (typeof sfxAudioFiles !== 'undefined' && sfxAudioFiles[randomType]) {
    const sfxFiles = sfxAudioFiles[randomType];
    if (sfxFiles && sfxFiles.length > 0) {
      const sfxFile = sfxFiles[Math.floor(Math.random() * sfxFiles.length)];
      setTimeout(() => {
        const sfxAudio = new Audio(sfxFile);
        sfxAudio.volume = (vol / 100) * 0.25;
        sfxAudio.play().catch(e => console.log('SFX play blocked', e));
      }, 300);
    }
  }

  const files = hostAudioFiles[randomType];
  const file = files[Math.floor(Math.random() * files.length)];
  
  if (currentHostAudio) {
    currentHostAudio.pause();
    currentHostAudio.currentTime = 0;
  }
  
  currentHostAudio = new Audio(file);
  currentHostAudio.volume = vol / 100;
  
  duckMusicVolume();
  currentHostAudio.onended = function() { restoreMusicVolume(); };
  currentHostAudio.onerror = function() { restoreMusicVolume(); };
  
  currentHostAudio.play().catch(e => {
    console.log('Test host audio play blocked', e);
    restoreMusicVolume();
  });
};

window.updateHostAudioVolumeUI = function(val) {
  document.getElementById('hostAudioVolumeLabel').textContent = `${val}%`;
  window._tempHostAudioVolume = parseInt(val) || 100;
};

// ─── Audio Context Unlock ───
// Browser memblokir autoplay audio sampai user interaksi pertama kali (klik/tap/keypress).
// Ini penting untuk OBS Browser Source & tab baru agar audio bisa keluar ke live.
let _audioUnlocked = false;
function unlockAudioContext() {
  // YouTube force-play runs on EVERY tap (mobile needs repeated gestures for iframe)
  try {
    if (ytPlayer && ytPlayer.unMute && isMusicPlaying) {
      ytPlayer.unMute();
      ytPlayer.setVolume(musicSettings.volume);
      ytPlayAttempts = 0;
      try { ytPlayer.playVideo(); } catch(e2) {}
    }
  } catch(e) {}

  if (_audioUnlocked) return;
  _audioUnlocked = true;
  
  // Resume AudioContext jika ada (untuk Web Audio API)
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      const ctx = new AudioCtx();
      ctx.resume().then(() => {
        console.log('[Audio] AudioContext unlocked');
        ctx.close();
      });
    }
  } catch(e) {}
  
  // Play silent audio untuk unlock HTML5 Audio
  try {
    const silentAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=');
    silentAudio.volume = 0.01;
    silentAudio.play().then(() => {
      silentAudio.pause();
      console.log('[Audio] HTML5 Audio unlocked');
    }).catch(() => {});
  } catch(e) {}
  
  // Force YouTube player unmute AND resume playback if stuck
  try {
    if (ytPlayer && ytPlayer.unMute) {
      ytPlayer.unMute();
      ytPlayer.setVolume(musicSettings.volume);
      ytPlayAttempts = 0; // Reset attempt counter so it can retry
      // If music is supposed to be playing but got blocked, force play
      if (isMusicPlaying) {
        try { ytPlayer.playVideo(); } catch(e2) {}
        console.log('[Audio] YouTube player unmuted + forced play');
      } else {
        console.log('[Audio] YouTube player unmuted');
      }
    }
  } catch(e) {}
  
  // Resume speechSynthesis
  try {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      console.log('[Audio] SpeechSynthesis ready');
    }
  } catch(e) {}
  
  console.log('[Audio] ✅ All audio channels unlocked');
}

// Intercept first user gesture to unlock all audio
['click', 'touchstart', 'keydown'].forEach(event => {
  document.addEventListener(event, unlockAudioContext, { once: false, capture: true });
});
// Also try to unlock after a short delay (for auto-started pages)
setTimeout(() => {
  if (!_audioUnlocked) {
    console.log('[Audio] ⚠️ Audio belum di-unlock — butuh interaksi user (klik/tap). Jika di OBS, aktifkan "Interact" dulu.');
  }
}, 3000);

// (Removed originalSaveTTS override as it was merged above)

// (Removed originalOpenTTS override as it was merged above)
