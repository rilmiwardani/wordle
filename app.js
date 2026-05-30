const SOCKET_URL = "http://localhost:9200";
const MAX_GUESSES = 6;
const urlParams = new URLSearchParams(window.location.search);
let WORD_LENGTH = 5;
document.documentElement.style.setProperty('--word-length', WORD_LENGTH);

// State
let socket = null;
let currentWord = "";
let guesses = [];
let isGameOver = false;
let isProcessing = false;
let round = 1;
let currentBg = 'nature'; // 'nature' or 'city'
let TARGET_WORDS = [];
let VALID_WORDS = [];
let availableWords = [];
let discoveredLetters = [];
let ytPlayer = null;
let musicQueue = [];
let isMusicPlaying = false;
let lastUsername = "";
let lastLang = "";
let lastSessionId = "";
let reconnectTimer = null;
let isConnectedToTikTok = false;

// YouTube Iframe API setup
function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player('ytPlayerContainer', {
    height: '0',
    width: '0',
    videoId: '',
    playerVars: { 'autoplay': 1, 'controls': 0 },
    events: {
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerStateChange(event) {
  // If the video ends (state 0), play the next one
  if (event.data == YT.PlayerState.ENDED) {
    playNextMusic();
  }
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
let allTargetWords = { 5: [], 6: [] };
let allValidWords = { 5: [], 6: [] };
let allAvailableWords = { 5: [], 6: [] };

function loadWordLists(lang) {
  return new Promise((resolve, reject) => {
    let fetches = [];
    if (lang === 'mixed') {
      fetches = [
        Promise.all([fetch(`target_words.txt`).then(r => r.text()), fetch(`target_words_id.txt`).then(r => r.text())]).then(r => r[0] + '\n' + r[1]),
        Promise.all([fetch(`valid_words.txt`).then(r => r.text()), fetch(`valid_words_id.txt`).then(r => r.text())]).then(r => r[0] + '\n' + r[1]),
        Promise.all([fetch(`target_words_6.txt`).then(r => r.text()).catch(()=>""), fetch(`target_words_id_6.txt`).then(r => r.text()).catch(()=>"")]).then(r => r[0] + '\n' + r[1]),
        Promise.all([fetch(`valid_words_6.txt`).then(r => r.text()).catch(()=>""), fetch(`valid_words_id_6.txt`).then(r => r.text()).catch(()=>"")]).then(r => r[0] + '\n' + r[1])
      ];
    } else {
      let suffix = lang === 'en' ? '' : '_id';
      fetches = [
        fetch(`target_words${suffix}.txt`).then(r => r.text()),
        fetch(`valid_words${suffix}.txt`).then(r => r.text()),
        fetch(`target_words${suffix}_6.txt`).then(r => r.text()).catch(() => ""),
        fetch(`valid_words${suffix}_6.txt`).then(r => r.text()).catch(() => "")
      ];
    }

    Promise.all(fetches).then(([t5, v5, t6, v6]) => {
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

      wordsLoaded = true;
      console.log(`Loaded length 5: ${allTargetWords[5].length} targets. Length 6: ${allTargetWords[6].length} targets.`);
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
const loginOverlay = document.getElementById('loginOverlay');
const gameContainer = document.getElementById('gameContainer');
const bgLayer = document.getElementById('bgLayer');
const connectBtn = document.getElementById('connectBtn');
const loginStatus = document.getElementById('loginStatus');
const roomHost = document.getElementById('roomHost');
const board = document.getElementById('board');
const toastContainer = document.getElementById('toastContainer');
const roundNumber = document.getElementById('roundNumber');

// Initialize Board
function initBoard() {
  board.innerHTML = '';
  for (let i = 0; i < MAX_GUESSES; i++) {
    const row = document.createElement('div');
    row.className = 'board-row';
    row.id = `row-${i}`;
    
    // Avatar for the row
    const avatar = document.createElement('img');
    avatar.className = 'guesser-avatar';
    avatar.id = `avatar-${i}`;
    row.appendChild(avatar);

    for (let j = 0; j < WORD_LENGTH; j++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.id = `tile-${i}-${j}`;
      row.appendChild(tile);
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

// Start Game
function startNewRound() {
  // Randomize word length between 5 and 6
  WORD_LENGTH = Math.random() < 0.5 ? 5 : 6;
  document.documentElement.style.setProperty('--word-length', WORD_LENGTH);
  
  if (wordsLoaded) {
    TARGET_WORDS = allTargetWords[WORD_LENGTH];
    VALID_WORDS = allValidWords[WORD_LENGTH];
    availableWords = allAvailableWords[WORD_LENGTH];
  } else {
    // Fallback if not loaded yet
    TARGET_WORDS = [];
    VALID_WORDS = [];
    availableWords = [];
  }

  currentWord = getRandomWord();
  guesses = [];
  guessQueue = [];
  discoveredLetters = Array(WORD_LENGTH).fill(null);
  isGameOver = false;
  isProcessing = false;
  roundNumber.textContent = round;
  
  // Toggle background for visual delight
  currentBg = currentBg === 'nature' ? 'city' : 'nature';
  bgLayer.className = `bg-layer ${currentBg}`;
  
  initBoard();
  initHintBoard();

  console.log(`[Cheat] Target word is: ${currentWord}`);
  if (lastLang === 'id') {
    document.querySelector('.instruction').textContent = `Ketik kata ${WORD_LENGTH} huruf di chat untuk menebak!`;
  } else if (lastLang === 'mixed') {
    document.querySelector('.instruction').textContent = `Ketik kata ${WORD_LENGTH} huruf di chat! / Type a ${WORD_LENGTH}-letter word!`;
  } else {
    document.querySelector('.instruction').textContent = `Type a ${WORD_LENGTH}-letter word in chat to guess!`;
  }
  showToast(`Round ${round} Started! (${WORD_LENGTH} Letters)`, 2000);
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

// Handle Guesses from Chat
function handleChatGuess(data) {
  if (isGameOver) return;

  // Hapus semua karakter selain huruf A-Z (spasi, titik, koma, dll) untuk bypass filter TikTok
  const msg = data.comment.toUpperCase().replace(/[^A-Z]/g, '');
  
  if (msg.length === WORD_LENGTH) {
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

// Process a valid guess — optimized: no blocking delays
function processGuess(guessWord, userData) {
  const currentRow = guesses.length;
  
  // If we exceed 6 guesses, add a new row and remove the oldest one
  if (currentRow >= 6) {
    const row = document.createElement('div');
    row.className = 'board-row';
    row.id = `row-${currentRow}`;
    
    const avatar = document.createElement('img');
    avatar.className = 'guesser-avatar';
    avatar.id = `avatar-${currentRow}`;
    row.appendChild(avatar);

    for (let j = 0; j < WORD_LENGTH; j++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.id = `tile-${currentRow}-${j}`;
      row.appendChild(tile);
    }
    
    board.appendChild(row);
    board.removeChild(board.firstChild);
  }

  // Determine statuses FIRST (no delay)
  const guessArray = guessWord.split('');
  const targetArray = currentWord.split('');
  const statuses = Array(WORD_LENGTH).fill('absent');
  const isValidWord = VALID_WORDS.includes(guessWord);
  
  if (isValidWord) {
    // First pass: correct
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guessArray[i] === targetArray[i]) {
        statuses[i] = 'correct';
        targetArray[i] = null;
        
        if (!discoveredLetters[i]) {
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
      }
    }
  }

  // Apply letters + colors ALL AT ONCE (no stagger, no flip await)
  for (let i = 0; i < WORD_LENGTH; i++) {
    const tile = document.getElementById(`tile-${currentRow}-${i}`);
    tile.textContent = guessWord[i];
    if (isValidWord) {
      tile.classList.add(statuses[i]);
    } else {
      tile.classList.add('invalid');
    }
  }

  // Show avatar
  if (userData && userData.profilePictureUrl) {
    const avatar = document.getElementById(`avatar-${currentRow}`);
    avatar.src = userData.profilePictureUrl;
    avatar.classList.add('show');
  }

  guesses.push(guessWord);
  
  // Check win
  if (guessWord === currentWord) {
    isGameOver = true;
    const winnerName = userData ? userData.nickname : 'Someone';
    const avatarUrl = userData && userData.profilePictureUrl ? userData.profilePictureUrl : 'bg_nature.jpg';
    // Show win overlay immediately (no delay)
    const winOverlay = document.getElementById('winOverlay');
    document.getElementById('winAvatar').src = avatarUrl;
    document.getElementById('winName').textContent = `@${winnerName}`;
    document.getElementById('winWord').textContent = currentWord;
    
    winOverlay.classList.add('show');
    
    setTimeout(() => {
      winOverlay.classList.remove('show');
      setTimeout(() => {
        round++;
        startNewRound();
      }, 200);
    }, 5000);
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

// Auto-restore saved session from localStorage
(function restoreSavedSession() {
  try {
    const savedUsername = localStorage.getItem('wordle_username');
    const savedLang = localStorage.getItem('wordle_lang');
    const savedSessionId = localStorage.getItem('wordle_sessionid');
    
    if (savedUsername) {
      document.getElementById('usernameInput').value = savedUsername;
    }
    if (savedLang) {
      document.getElementById('languageSelect').value = savedLang;
    }
    if (savedSessionId && document.getElementById('sessionInput')) {
      document.getElementById('sessionInput').value = savedSessionId;
    }
    // Auto-connect if we have a saved username
    if (savedUsername) {
      connectToLive();
    }
  } catch (e) {
    console.log('Could not restore session:', e);
  }
})();

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
