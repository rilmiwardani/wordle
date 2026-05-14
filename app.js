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

Promise.all([
  fetch('target_words.txt').then(r => r.text()),
  fetch('valid_words.txt').then(r => r.text()),
  fetch('target_words_6.txt').then(r => r.text()).catch(() => ""),
  fetch('valid_words_6.txt').then(r => r.text()).catch(() => "")
]).then(([t5, v5, t6, v6]) => {
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
}).catch(err => console.error("Failed to load wordlists:", err));

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
  showToast(`Round ${round} Started! (${WORD_LENGTH} Letters)`, 2000);
}

// Connection Logic
function connectToLive() {
  const username = document.getElementById('usernameInput').value.trim();
  if (!username) {
    loginStatus.textContent = "Enter a username first!";
    return;
  }

  connectBtn.disabled = true;
  connectBtn.textContent = "Connecting...";
  loginStatus.textContent = "";

  // Initialize Socket
  if (!socket) {
    socket = io(SOCKET_URL);
    
    socket.on('connect', () => {
      console.log('Connected to local server');
      // Tell server to connect to tiktok
      socket.emit('connect-tiktok', username);
    });

    socket.on('statusUpdate', (data) => {
      if (data.status === 'connected') {
        loginOverlay.style.display = 'none';
        gameContainer.style.display = 'flex';
        document.getElementById('hostMusicControl').style.display = 'flex';
        roomHost.textContent = `@${data.uniqueId}`;
        
        if(currentWord === "") {
            startNewRound();
        }
      } else if (data.status === 'disconnected') {
        if(data.error) {
           loginStatus.textContent = "Error: " + data.error;
           connectBtn.disabled = false;
           connectBtn.textContent = "Try Again";
        }
      }
    });

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
  } else {
    socket.emit('connect-tiktok', username);
  }
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

async function processQueue() {
  if (isProcessing || guessQueue.length === 0 || isGameOver) return;
  isProcessing = true;
  
  const { guessWord, userData } = guessQueue.shift();
  // Speed up animations dynamically if chat is spamming
  const speed = guessQueue.length > 3 ? 0.25 : 1; 

  await processGuess(guessWord, userData, speed);
  
  isProcessing = false;
  setTimeout(processQueue, 50);
}

// Process a valid guess
async function processGuess(guessWord, userData, speed) {
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

  // Update board visually with letters first
  for (let i = 0; i < WORD_LENGTH; i++) {
    const tile = document.getElementById(`tile-${currentRow}-${i}`);
    tile.textContent = guessWord[i];
    tile.classList.add('filled');
  }

  // Show avatar
  if (userData && userData.profilePictureUrl) {
    const avatar = document.getElementById(`avatar-${currentRow}`);
    avatar.src = userData.profilePictureUrl;
    avatar.classList.add('show');
  }

  // Wait a tiny bit before animating
  await new Promise(r => setTimeout(r, 200 * speed));

  // Determine statuses
  const guessArray = guessWord.split('');
  const targetArray = currentWord.split('');
  const statuses = Array(WORD_LENGTH).fill('absent');
  const isValidWord = VALID_WORDS.includes(guessWord);
  
  if (isValidWord) {
    // First pass: correct
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guessArray[i] === targetArray[i]) {
        statuses[i] = 'correct';
        targetArray[i] = null; // consume
        
        // Update Hint Board if not already discovered and we haven't reached max hints (4)
        if (!discoveredLetters[i]) {
          const currentlyDiscovered = discoveredLetters.filter(l => l !== null).length;
          
          // Sisakan 1 yang kosong (max 4 hints allowed)
          if (currentlyDiscovered < WORD_LENGTH - 1) {
            const letter = guessArray[i];
            discoveredLetters[i] = letter;
            const hintTile = document.getElementById(`hint-${i}`);
            if (hintTile) {
              // Delay the hint appearance slightly to sync with the tile flip
              setTimeout(() => {
                hintTile.textContent = letter;
                hintTile.classList.add('discovered');
              }, 300 * speed);
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
        targetArray[targetArray.indexOf(guessArray[i])] = null; // consume
      }
    }
  }

  // Animate flipping
  for (let i = 0; i < WORD_LENGTH; i++) {
    const tile = document.getElementById(`tile-${currentRow}-${i}`);
    
    if (speed < 1) tile.style.animationDuration = `${0.5 * speed}s`;
    tile.classList.add('flip');
    
    // Change color at the halfway point of the flip
    setTimeout(() => {
      tile.classList.remove('filled');
      if (isValidWord) {
        tile.classList.add(statuses[i]);
      } else {
        tile.classList.add('invalid');
      }
    }, 250 * speed); // half of 0.5s animation
    
    await new Promise(r => setTimeout(r, 250 * speed)); // stagger the animation
  }

  guesses.push(guessWord);
  
  // Check win
  if (guessWord === currentWord) {
    isGameOver = true;
    const winnerName = userData ? userData.nickname : 'Someone';
    const avatarUrl = userData && userData.profilePictureUrl ? userData.profilePictureUrl : 'bg_nature.jpg'; // placeholder
    
    setTimeout(() => {
      // Setup and show overlay
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
        }, 600); // Wait for fade out
      }, 5000); // Show for 5 seconds
    }, 1000);
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
