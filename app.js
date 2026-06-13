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
  if (currentGameMode === 'word500') return displayRowsWord500;
  if (currentGameMode === 'word600') return displayRowsWord600;
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
const urlParams = new URLSearchParams(window.location.search);
let WORD_LENGTH = 5;
document.documentElement.style.setProperty('--word-length', WORD_LENGTH);

// Game Mode State: 'wordle' or 'word500'
let currentGameMode = localStorage.getItem('wordle_gameMode') || '';

function getMaxGuesses() {
  return (currentGameMode === 'word500' || currentGameMode === 'word600') ? Infinity : 6;
}

// State
let socket = null;
let currentWord = "";
let guesses = [];
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
let TARGET_WORDS = [];
let VALID_WORDS = [];
let availableWords = [];
let discoveredLetters = [];
let bestGuess = null;
let word500History = []; // { word, c, p, a, score, userData }
let ytPlayer = null;
let musicQueue = [];
let isMusicPlaying = false;
let lastUsername = "";
let lastLang = "";
let lastSessionId = "";
let reconnectTimer = null;
let isConnectedToTikTok = false;

// Leaderboard State
let playerPoints = {};
let currentLbTab = 'session';

function getPtsPrefix() {
  if (currentGameMode === 'word500') return 'pts_w500_';
  if (currentGameMode === 'word600') return 'pts_w600_';
  return 'pts_';
}

// Memuat data mingguan ke memori saat halaman dimuat
function initWeeklyLeaderboard() {
  playerPoints = {};
  const prefix = getPtsPrefix();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      if (prefix === 'pts_' && key.startsWith('pts_w500_')) continue;
      const username = key.substring(prefix.length);
      const pts = parseInt(localStorage.getItem(key)) || 0;
      if (!playerPoints[username]) {
        playerPoints[username] = {
          avatar: 'bg_nature.png',
          sessionPts: 0,
          weeklyPts: pts
        };
      }
    }
  }
  renderLeaderboard();
}
initWeeklyLeaderboard();

function getWeeklyPts(username) {
  return parseInt(localStorage.getItem(getPtsPrefix() + username) || '0');
}
function saveWeeklyPts(username, pts) {
  localStorage.setItem(getPtsPrefix() + username, pts);
}

function addPoints(userData, points) {
  if (!userData || !userData.nickname) return;
  const username = userData.nickname;
  if (!playerPoints[username]) {
    playerPoints[username] = {
      avatar: userData.profilePictureUrl || 'bg_nature.png',
      sessionPts: 0,
      weeklyPts: getWeeklyPts(username)
    };
  }
  playerPoints[username].sessionPts += points;
  playerPoints[username].weeklyPts += points;
  if (userData.profilePictureUrl) playerPoints[username].avatar = userData.profilePictureUrl;
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
        <img src="${data.avatar}" class="lb-avatar" onerror="this.src='bg_nature.png'">
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
}

function onPlayerStateChange(event) {
  // If the video ends (state 0), play the next one
  if (event.data == YT.PlayerState.ENDED) {
    playNextMusic();
  }
  // If video is cued but not playing (mobile autoplay blocked), force play
  if (event.data == YT.PlayerState.CUED || event.data == YT.PlayerState.PAUSED) {
    setTimeout(() => {
      try { ytPlayer.playVideo(); } catch(e) {}
    }, 300);
  }
}

function onPlayerError(event) {
  console.warn('[Music] YouTube player error:', event.data);
  // Skip to next song on error (e.g. restricted/unavailable video)
  setTimeout(() => playNextMusic(), 1000);
}

function playNextMusic() {
  const hostSkipBtn = document.getElementById('hostSkipBtn');
  
  if (musicQueue.length === 0) {
    isMusicPlaying = false;
    document.getElementById('musicWidget').classList.remove('show');
    if (hostSkipBtn) hostSkipBtn.style.display = 'none';
    return;
  }
  
  isMusicPlaying = true;
  if (hostSkipBtn) hostSkipBtn.style.display = 'flex';
  
  const currentMusic = musicQueue.shift();
  
  document.getElementById('musicThumb').src = currentMusic.thumbnail || 'bg_nature.png';
  document.getElementById('musicTitle').textContent = currentMusic.title;
  document.getElementById('musicRequester').textContent = `@${currentMusic.requesterName}`;
  const durSpan = document.getElementById('musicDuration');
  if(durSpan) {
    durSpan.textContent = currentMusic.duration || "";
    document.querySelector('.music-dot').style.display = currentMusic.duration ? 'inline' : 'none';
  }
  document.getElementById('musicWidget').classList.add('show');
  
  if (ytPlayer && ytPlayer.loadVideoById) {
    ytPlayer.loadVideoById(currentMusic.videoId);
  }
}

// Fetch words on load
let wordsLoaded = false;
let allTargetWords = { 5: [], 6: [], 7: [] };
let allValidWords = { 5: [], 6: [], 7: [] };
let allAvailableWords = { 5: [], 6: [], 7: [] };

function loadWordLists(lang) {
  return new Promise((resolve, reject) => {
    let fetches = [];
    if (lang === 'mixed') {
      fetches = [
        Promise.all([fetch(`target_words.txt`).then(r => r.text()), fetch(`target_words_id.txt`).then(r => r.text())]).then(r => r[0] + '\n' + r[1]),
        Promise.all([fetch(`valid_words.txt`).then(r => r.text()), fetch(`valid_words_id.txt`).then(r => r.text())]).then(r => r[0] + '\n' + r[1]),
        Promise.all([fetch(`target_words_6.txt`).then(r => r.text()).catch(()=>""), fetch(`target_words_id_6.txt`).then(r => r.text()).catch(()=>"")]).then(r => r[0] + '\n' + r[1]),
        Promise.all([fetch(`valid_words_6.txt`).then(r => r.text()).catch(()=>""), fetch(`valid_words_id_6.txt`).then(r => r.text()).catch(()=>"")]).then(r => r[0] + '\n' + r[1]),
        Promise.all([fetch(`target_words_7.txt`).then(r => r.text()).catch(()=>""), fetch(`target_words_id_7.txt`).then(r => r.text()).catch(()=>"")]).then(r => r[0] + '\n' + r[1]),
        Promise.all([fetch(`valid_words_7.txt`).then(r => r.text()).catch(()=>""), fetch(`valid_words_id_7.txt`).then(r => r.text()).catch(()=>"")]).then(r => r[0] + '\n' + r[1])
      ];
    } else {
      let suffix = lang === 'en' ? '' : '_id';
      fetches = [
        fetch(`target_words${suffix}.txt`).then(r => r.text()),
        fetch(`valid_words${suffix}.txt`).then(r => r.text()),
        fetch(`target_words${suffix}_6.txt`).then(r => r.text()).catch(() => ""),
        fetch(`valid_words${suffix}_6.txt`).then(r => r.text()).catch(() => ""),
        fetch(`target_words${suffix}_7.txt`).then(r => r.text()).catch(() => ""),
        fetch(`valid_words${suffix}_7.txt`).then(r => r.text()).catch(() => "")
      ];
    }

    Promise.all(fetches).then(([t5, v5, t6, v6, t7, v7]) => {
      // Process length 5
      allTargetWords[5] = t5.split('\n').map(w => w.trim().toUpperCase()).filter(w => w.length === 5);
      const validList5 = v5.split('\n').map(w => w.trim().toUpperCase()).filter(w => w.length === 5);
      allValidWords[5] = [...new Set([...validList5, ...allTargetWords[5]])];
      allAvailableWords[5] = [...allTargetWords[5]];
      shuffleArray(allAvailableWords[5]);
      
      // Process length 6
      allTargetWords[6] = t6.split('\n').map(w => w.trim().toUpperCase()).filter(w => w.length === 6);
      const validList6 = v6.split('\n').map(w => w.trim().toUpperCase()).filter(w => w.length === 6);
      allValidWords[6] = [...new Set([...validList6, ...allTargetWords[6]])];
      allAvailableWords[6] = [...allTargetWords[6]];
      shuffleArray(allAvailableWords[6]);

      // Process length 7
      allTargetWords[7] = t7.split('\n').map(w => w.trim().toUpperCase()).filter(w => w.length === 7);
      const validList7 = v7.split('\n').map(w => w.trim().toUpperCase()).filter(w => w.length === 7);
      allValidWords[7] = [...new Set([...validList7, ...allTargetWords[7]])];
      allAvailableWords[7] = [...allTargetWords[7]];
      shuffleArray(allAvailableWords[7]);

      wordsLoaded = true;
      console.log(`Loaded length 5: ${allTargetWords[5].length} targets. Length 6: ${allTargetWords[6].length} targets. Length 7: ${allTargetWords[7].length} targets.`);
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
  try { localStorage.setItem('wordle_gameMode', mode); } catch(e) {}
  
  initWeeklyLeaderboard();

  // Update login title
  const loginTitle = document.getElementById('loginTitle');
  if (loginTitle) {
    if (mode === 'word500') loginTitle.textContent = 'TIKTOK WORD500';
    else if (mode === 'word600') loginTitle.textContent = 'TIKTOK WORD600';
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

  if (!isConnectedToTikTok) {
    currentGameMode = '';
    try { localStorage.removeItem('wordle_gameMode'); } catch(e) {}
    loginOverlay.style.display = 'none';
    gameContainer.style.display = 'none';
    gameSelectOverlay.style.display = 'flex';
    return;
  }

  // Seamless switch
  if (currentGameMode === 'wordle') currentGameMode = 'word500';
  else if (currentGameMode === 'word500') currentGameMode = 'word600';
  else currentGameMode = 'wordle';
  try { localStorage.setItem('wordle_gameMode', currentGameMode); } catch(e) {}

  initWeeklyLeaderboard();
  startNewRound();
}

function applyGameModeUI() {
  const headerTitle = document.getElementById('headerTitle');
  const hintContainer = document.getElementById('hintContainer');
  const bestGuessContainer = document.getElementById('bestGuessContainer');
  const switchBtn = document.getElementById('switchGameBtn');

  if (currentGameMode === 'word500' || currentGameMode === 'word600') {
    if (headerTitle) headerTitle.textContent = currentGameMode === 'word500' ? 'WORD500' : 'WORD600';
    if (hintContainer) hintContainer.style.display = 'none';
    if (bestGuessContainer) bestGuessContainer.style.display = 'none'; // replaced by sorted board
    if (switchBtn) {
      switchBtn.textContent = currentGameMode === 'word500' ? '🔄 Switch to Word600' : '🔄 Switch to Wordle';
    }
  } else {
    if (headerTitle) headerTitle.textContent = 'WORDLE';
    if (hintContainer) hintContainer.style.display = '';
    if (bestGuessContainer) bestGuessContainer.style.display = 'none';
    if (switchBtn) switchBtn.textContent = '🔄 Switch to Word500';
  }
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
  html += `
    <div class="w500-count green" style="aspect-ratio: 1/1; height: auto; width: 100%; border-radius: 15%; font-size: 1rem; min-width: 0; min-height: 0;">${bestGuess.c}</div>
    <div class="w500-count yellow" style="aspect-ratio: 1/1; height: auto; width: 100%; border-radius: 15%; font-size: 1rem; min-width: 0; min-height: 0;">${bestGuess.p}</div>
    <div class="w500-count red" style="aspect-ratio: 1/1; height: auto; width: 100%; border-radius: 15%; font-size: 1rem; min-width: 0; min-height: 0;">${bestGuess.a}</div>
  </div>`;
  container.innerHTML = html;
}

// ─── Word500 Sorted Board ───
function createWord500RowEl(guessData, isLatest) {
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
  for (let j = 0; j < guessData.word.length; j++) {
    const tile = document.createElement('div');
    tile.className = 'tile blind';
    if (isAllRed) {
      tile.style.backgroundColor = 'rgba(220, 38, 38, 0.25)';
      tile.style.borderColor = 'rgba(220, 38, 38, 0.4)';
      tile.style.color = 'rgba(255, 255, 255, 0.4)';
    }
    tile.textContent = guessData.word[j];
    row.appendChild(tile);
  }
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
  for (let k = 0; k < 3; k++) {
    const clue = document.createElement('div');
    clue.className = 'w500-count empty-clue';
    row.appendChild(clue);
  }
  return row;
}

function renderWord500Board() {
  board.innerHTML = '';
  board.classList.add('w500-board');

  const DISPLAY_ROWS = getDisplayRows();
  document.documentElement.style.setProperty('--display-rows', DISPLAY_ROWS);
  if (word500History.length === 0) {
    for (let i = 0; i < DISPLAY_ROWS; i++) board.appendChild(createEmptyW500Row(i));
    return;
  }

  // Baris paling atas: tebakan terbaru
  const latest = word500History[word500History.length - 1];
  board.appendChild(createWord500RowEl(latest, true));

  // Di bawahnya: semua tebakan sebelumnya, diurutkan dari skor tertinggi
  const previous = word500History.slice(0, -1)
    .slice() // copy
    .sort((a, b) => b.c - a.c || b.p - a.p || a.a - b.a);

  const slots = DISPLAY_ROWS - 1;
  const toShow = previous.slice(0, slots);
  for (const g of toShow) board.appendChild(createWord500RowEl(g, false));

  // Isi sisa dengan baris kosong
  for (let i = toShow.length; i < DISPLAY_ROWS - 1; i++) board.appendChild(createEmptyW500Row(i));
}

// Initialize Board
function initBoard() {
  board.innerHTML = '';

  if (currentGameMode === 'word500' || currentGameMode === 'word600') {
    board.classList.add('w500-board');
  } else {
    board.classList.remove('w500-board');
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
      row.appendChild(tile);
    }

    // Word500/600: add feedback placeholders
    if (currentGameMode === 'word500' || currentGameMode === 'word600') {
      row.classList.add('w500-row');
      for (let k = 0; k < 3; k++) {
        const clue = document.createElement('div');
        clue.className = 'w500-count empty-clue';
        row.appendChild(clue);
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

function getInstructionText(index) {
  if (index === 0) {
    if (lastLang === 'id') return `Ketik kata ${WORD_LENGTH} huruf di chat untuk menebak!`;
    if (lastLang === 'mixed') return `Ketik kata ${WORD_LENGTH} huruf di chat! / Type a ${WORD_LENGTH}-letter word!`;
    return `Type a ${WORD_LENGTH}-letter word in chat to guess!`;
  } else {
    if (lastLang === 'id') return `Ketik !myrank untuk cek rank & poin kamu!`;
    if (lastLang === 'mixed') return `Ketik !myrank untuk cek poin! / Type !myrank to check points!`;
    return `Type !myrank to check your rank and points!`;
  }
}

function startInstructionRotation() {
  if (instructionTimer) clearInterval(instructionTimer);
  
  const updateText = () => {
    if (isShowingRankMsg) return; // Don't override rank msg
    const text = getInstructionText(currentInstructionIndex % 2);
    const instEl = document.querySelector('.instruction');
    if (instEl) {
      instEl.textContent = text;
      instEl.style.color = 'var(--text-muted)';
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
        <img src="${rankData.avatar}" style="width: 20px; height: 20px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(255,255,255,0.3);" onerror="this.src='bg_nature.png'">
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
      const text = getInstructionText((currentInstructionIndex - 1) % 2);
      if (instEl) {
        instEl.textContent = text;
        instEl.style.color = 'var(--text-muted)';
      }
    }
  }, 5000); // Show for 5s
}

function handleMyRank(userData) {
  const userId = userData.uniqueId;
  const now = Date.now();
  if (rankCooldowns[userId] && now - rankCooldowns[userId] < 15000) {
    return; // 15s cooldown per user
  }
  rankCooldowns[userId] = now;

  const sessionPts = playerPoints[userId] || 0;
  let sessionRank = "-";
  
  const sorted = Object.entries(playerPoints).sort((a, b) => b[1] - a[1]);
  const index = sorted.findIndex(p => p[0] === userId);
  if (index !== -1 && sessionPts > 0) {
    sessionRank = `#${index + 1}`;
  }

  const prefix = getPtsPrefix();
  const weeklyPts = parseInt(localStorage.getItem(prefix + userId)) || 0;
  
  // Hitung rank mingguan
  const weeklyData = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      if (prefix === 'pts_' && key.startsWith('pts_w500_')) continue;
      const uId = key.substring(prefix.length);
      const pts = parseInt(localStorage.getItem(key)) || 0;
      weeklyData.push({ uId, pts });
    }
  }
  weeklyData.sort((a, b) => b.pts - a.pts);
  const wIndex = weeklyData.findIndex(p => p.uId === userId);
  let weeklyRank = "-";
  if (wIndex !== -1 && weeklyPts > 0) {
    weeklyRank = `#${wIndex + 1}`;
  }
  
  // Truncate panjang nickname agar tidak terlalu panjang
  let nick = userData.nickname;
  if (nick.length > 10) {
    nick = nick.substring(0, 9) + '..';
  }
  
  const msg = `${nick} - Sesi: ${sessionPts} Pts (Rank ${sessionRank}) | Mingguan: ${weeklyPts} Pts (Rank ${weeklyRank})`;
  const avatar = userData.profilePictureUrl || 'bg_nature.png';
  
  rankMessageQueue.push({ msg, avatar });
  processRankQueue();
}

// Start Game
function startNewRound() {
  // Word500 always uses 5 letters; Word600 always uses 6 letters; Wordle randomizes 5, 6, or 7
  if (currentGameMode === 'word500') {
    WORD_LENGTH = 5;
  } else if (currentGameMode === 'word600') {
    WORD_LENGTH = 6;
  } else {
    const r = Math.random();
    WORD_LENGTH = r < 0.33 ? 5 : (r < 0.66 ? 6 : 7);
  }
  document.documentElement.style.setProperty('--word-length', WORD_LENGTH);
  
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
  userGuessDedup = new Set(); // reset per ronde
  isGameOver = false;
  isProcessing = false;
  roundNumber.textContent = round;
  
  // Toggle background for visual delight (only if dynamic mode is on)
  if (isDynamicBg) {
    currentBg = currentBg === 'nature' ? 'city' : 'nature';
    applyDynamicBg();
  }
  
  // Apply mode-specific UI
  applyGameModeUI();
  initBoard();
  if (currentGameMode !== 'word500' && currentGameMode !== 'word600') {
    initHintBoard();
  }
  updateBestGuessUI();

  console.log(`[Cheat] Target word is: ${currentWord}`);
  startInstructionRotation();
  const gameName = currentGameMode === 'word500' ? 'Word500' : (currentGameMode === 'word600' ? 'Word600' : 'Wordle');
  showToast(`${gameName} Round ${round} Started! (${WORD_LENGTH} Letters)`, 2000);
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
if (localStorage.getItem('wordle_hardMode') === 'true') {
  hardModeState = 'hard';
  localStorage.removeItem('wordle_hardMode');
  localStorage.setItem('wordle_hardModeState', 'hard');
} else if (localStorage.getItem('wordle_hardMode') === 'false') {
  localStorage.removeItem('wordle_hardMode');
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
});

// Dynamic / Static Background toggle
function applyStaticBg() {
  // Warna background tab header Google Chrome: #202124
  bgLayer.className = 'bg-layer';
  bgLayer.style.backgroundImage = 'none';
  bgLayer.style.backgroundColor = '#202124';
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
  for(let i=0; i<g.length; i++) {
    if(g[i]!==null && t.includes(g[i])) {
      statuses[i] = 'present';
      t[t.indexOf(g[i])] = null;
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
        const simStatuses = getWordleFeedback(past, guessWord);
        const gLetters = [];
        const yLetters = [];
        for(let i=0; i<past.length; i++) {
          if (simStatuses[i] === 'correct') gLetters.push(past[i]);
          else if (simStatuses[i] === 'present') yLetters.push(past[i]);
        }
        
        let reason = "";
        const simTotal = simulated.c + simulated.p;
        const actTotal = actual.c + actual.p;
        const allL = [...gLetters, ...yLetters];
        const simLetterText = (simTotal > 0) ? `(tebakanmu cuma bawa huruf [${allL.join(',')}])` : `(tebakanmu malah buang semua hurufnya)`;

        if (simTotal < actTotal) {
           reason = `Woy! Di '${past}' kan ada ${actTotal} huruf bener, kok malah dibuang? ${simLetterText}`;
        } else if (simTotal > actTotal) {
           reason = `Kebanyakan! Di '${past}' cuma dapet ${actTotal} huruf, kok tebakanmu maksa bawa lebih? (bawa huruf [${allL.join(',')}])`;
        } else if (simulated.c > actual.c) {
           const gText = gLetters.length > 0 ? `huruf [${gLetters.join(',')}]` : 'hurufnya';
           reason = `Ngaco! Di '${past}' kan aslinya cuma dapet ${actual.c} Hijau, kok ${gText} malah ditaruh di tempat yg sama persis?`;
        } else if (simulated.c < actual.c) {
           reason = `Sayang banget! Di '${past}' udah ada ${actual.c} huruf Hijau yg letaknya pas, kok malah digeser/diganti? ${simLetterText}`;
        } else {
           reason = `Kurang teliti! Susunan posisi tebakanmu (yg pakai huruf [${allL.join(',')}]) nggak masuk akal sama clue '${past}'.`;
        }
        return { 
          valid: false, 
          msg: `❌ ${reason}` 
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
            return { valid: false, msg: `Huruf "${guessWord[i]}" (abu-abu) tidak boleh digunakan lagi` };
          }
        }
      }
      
      // Check Greens
      for(let i=0; i<past.length; i++) {
        if(statuses[i] === 'correct') {
          if(newG[i] !== past[i]) {
            return { valid: false, msg: `Huruf ke-${i+1} harus "${past[i]}"` };
          }
          newG[i] = null;
        }
      }
      
      // Check Yellows
      for(let i=0; i<past.length; i++) {
        if(statuses[i] === 'present') {
          if(!newG.includes(past[i])) {
             return { valid: false, msg: `Harus mengandung huruf "${past[i]}"` };
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

function connectToLive() {
  const username = document.getElementById('usernameInput').value.trim();
  const lang = document.getElementById('languageSelect').value;
  const sessionInputElem = document.getElementById('sessionInput');
  const sessionId = sessionInputElem ? sessionInputElem.value.trim() : "";

  if (!username) {
    loginStatus.textContent = "Enter a username first!";
    return;
  }

  lastUsername = username;
  lastLang = lang;
  lastSessionId = sessionId;

  // Persist to localStorage for auto-reconnect on refresh
  try {
    localStorage.setItem('wordle_username', username);
    localStorage.setItem('wordle_lang', lang);
    localStorage.setItem('wordle_sessionid', sessionId);
  } catch (e) {}
  connectBtn.disabled = true;
  connectBtn.textContent = "Connecting...";
  loginStatus.textContent = "Loading dictionary...";

  loadWordLists(lang).then(() => {
    loginStatus.textContent = "Connecting to server...";

    if (!socket) {
      socket = io(SOCKET_URL);
      setupSocketListeners();
    } else if (socket.connected) {
      socket.emit('connect-tiktok', { uniqueId: username, sessionId });
    } else {
      loginStatus.textContent = "Waiting for server connection...";
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
    const savedMode = localStorage.getItem('wordle_gameMode');
    
    if (savedUser && savedMode) {
      // Restore game mode
      currentGameMode = savedMode;

      // Hide game select, show login for auto-connect
      gameSelectOverlay.style.display = 'none';
      loginOverlay.style.display = 'flex';

      // Pre-fill login fields
      document.getElementById('usernameInput').value = savedUser;
      const langSelect = document.getElementById('languageSelect');
      if (savedLang && langSelect) langSelect.value = savedLang;
      const sessionInput = document.getElementById('sessionInput');
      if (savedSession && sessionInput) sessionInput.value = savedSession;
      
      // Auto-connect
      connectToLive();
    }
  } catch (e) {}
}

// Run auto-reconnect when page loads
window.addEventListener('DOMContentLoaded', autoReconnect);

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
    handleChatGuess(data);
  });

  socket.on('music-request', (data) => {
    console.log("Music Requested:", data);
    musicQueue.push(data);

    if (!isMusicPlaying) {
      playNextMusic();
    } else {
      showToast(`🎶 Added to queue: ${data.title}`, 3000);
    }
  });

  socket.on('music-skip', () => {
    if (isMusicPlaying) {
      showToast("⏭️ Song skipped", 2000);
      playNextMusic();
    }
  });
}

// Queue system for high-volume chat
let guessQueue = [];

// Deduplication: mencegah user kirim kata yang sama lebih dari sekali per ronde
let userGuessDedup = new Set(); // key: "userId:KATA"

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
  
  if (msg.length === WORD_LENGTH) {
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

  let isValidWord = VALID_WORDS.includes(guessWord);
  let hardModeMsg = "";
  
  if (isValidWord) {
    const hmCheck = validateHardMode(guessWord);
    if (!hmCheck.valid) {
      hardModeMsg = hmCheck.msg;
      isValidWord = false; // Treat hard mode violation as invalid guess
    }
  }

  if (!isValidWord) {
    const now = Date.now();
    if (now - lastInvalidTime < 2500) {
      return false; // Skip to prevent flooding & flickering
    }
    lastInvalidTime = now;
  }

  // Hapus semua tebakan tidak valid sebelumnya dari layar
  const invalidRows = document.querySelectorAll('.is-invalid-row');
  invalidRows.forEach(el => el.remove());

  const currentRow = guesses.length;
  const isWord500 = currentGameMode === 'word500' || currentGameMode === 'word600';
  
  // 1. Create a new row and attach to top of grid
  const row = document.createElement('div');
  row.className = 'board-row' + (isWord500 ? ' w500-row' : '');
  row.id = `row-${currentRow}`;
  row.style.position = 'relative';
  
  let invalidTooltipMsg = hardModeMsg;
  if (!isValidWord && !hardModeMsg) {
    invalidTooltipMsg = "Bukan kata valid";
  }

  if (invalidTooltipMsg) {
    const tooltip = document.createElement('div');
    tooltip.className = 'row-tooltip';
    tooltip.textContent = invalidTooltipMsg;
    row.appendChild(tooltip);
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
  const targetArray = currentWord.split('');
  const statuses = Array(WORD_LENGTH).fill('absent');
  
  let correctCount = 0;
  let presentCount = 0;
  let absentCount = 0;

  if (isValidWord) {
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
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guessArray[i] !== null && targetArray.includes(guessArray[i])) {
        statuses[i] = 'present';
        targetArray[targetArray.indexOf(guessArray[i])] = null;
        presentCount++;
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

  // 3. Apply tile classes
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (!isValidWord) {
      tiles[i].classList.add('invalid');
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

  if (isWord500 && isValidWord) {
    // Word500 valid: tambah ke history lalu render ulang terurut
    word500History.push({ word: guessWord, c: correctCount, p: presentCount, a: absentCount, score: (correctCount * 2) + presentCount, userData });
    guesses.push(guessWord);
    renderWord500Board();
  } else {
    // Wordle valid/invalid, ATAU Word500 invalid: insert ke board
    board.insertBefore(row, board.firstChild);
    const displayRows = getDisplayRows();
    if (board.children.length > displayRows) board.removeChild(board.lastChild);
    
    if (isValidWord) {
      guesses.push(guessWord);
    } else {
      row.classList.add('is-invalid-row');
    }
  }
  
  // Check win
  if (guessWord === currentWord) {
    isGameOver = true;
    guessQueue = []; // Bug#1+#5 fix: clear antrian agar tebakan lama tidak masuk ronde baru
    const winPts = isWord500 ? 15 : 10;
    addPoints(userData, winPts);
    showFloatingPoints(winPts, `avatar-${currentRow}`);
    const winnerName = userData ? userData.nickname : 'Someone';
    const avatarUrl = userData && userData.profilePictureUrl ? userData.profilePictureUrl : 'bg_nature.png';
    const winOverlay = document.getElementById('winOverlay');
    document.getElementById('winAvatar').src = avatarUrl;
    document.getElementById('winName').textContent = winnerName;
    document.getElementById('winPts').innerHTML = `🪙 +${winPts} Poin`;
    document.getElementById('winWord').textContent = currentWord;
    
    // Tunggu 2 detik dulu agar jawaban di grid terlihat, baru tampilkan overlay
    setTimeout(() => {
      winOverlay.classList.add('show');
      
      setTimeout(() => {
        winOverlay.classList.remove('show');
        setTimeout(() => {
          round++;
          startNewRound();
        }, 200);
      }, 5000);
    }, 2000);
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
  const docElm = document.documentElement;
  if (!document.fullscreenElement && !document.webkitFullscreenElement) {
    if (docElm.requestFullscreen) {
      docElm.requestFullscreen().catch(err => console.log(err));
    } else if (docElm.webkitRequestFullscreen) { /* Safari */
      docElm.webkitRequestFullscreen().catch(err => console.log(err));
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
      if (query && socket) {
        socket.emit('host-music-request', query.replace('!play ', ''));
        hostMusicInput.value = '';
        hostMusicInputContainer.classList.remove('open');
      }
    }
  });
}

// ─── Reset Leaderboard ───
window.resetLeaderboard = function(e) {
  if (e) e.stopPropagation();
  if (confirm("Reset SEMUA poin Sesi dan Mingguan? Tindakan ini tidak bisa dibatalkan.")) {
    // Clear session points
    playerPoints = {};
    
    // Clear weekly points from localStorage
    const keysToRemove = [];
    const prefix = getPtsPrefix();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        if (prefix === 'pts_' && key.startsWith('pts_w500_')) continue;
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
    
    // Refresh UI
    renderLeaderboard();
    showToast("Leaderboard telah di-reset!");
    
    // Close settings dropdown if open
    const dropdown = document.getElementById('settingsDropdown');
    if (dropdown) dropdown.classList.remove('show');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const badWordsToggle = document.getElementById('badWordsToggle');
  if (badWordsToggle) badWordsToggle.checked = isBadWordsFilterOn;
});
