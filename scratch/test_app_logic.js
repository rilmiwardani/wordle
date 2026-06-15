const fs = require('fs');

let WORD_LENGTH = 5;
let currentGameMode = 'word500';
let hardModeState = 'hard';

let currentWord = "BENGK"; // Target word, has no M, A, L
let VALID_WORDS = ["MALAM", "TENDA", "BENGK"];
let guesses = [];
let word500History = [];

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
      
      console.log(`Checking against ${past}: actual=${actual.c},${actual.p} simulated=${simulated.c},${simulated.p}`);
      
      if (actual.c !== simulated.c || actual.p !== simulated.p) {
        return { valid: false, msg: "❌ error" };
      }
    }
  }
  return { valid: true };
}

function processGuess(guessWord) {
  let isValidWord = VALID_WORDS.includes(guessWord);
  let hardModeMsg = "";
  
  if (isValidWord) {
    const hmCheck = validateHardMode(guessWord);
    if (!hmCheck.valid) {
      hardModeMsg = hmCheck.msg;
      isValidWord = false; // Treat hard mode violation as invalid guess
    }
  }

  const isWord500 = true;
  
  // Fake the board loop
  const guessArray = guessWord.split('');
  const targetArray = currentWord.split('');
  let correctCount = 0;
  let presentCount = 0;

  if (isValidWord) {
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guessArray[i] === targetArray[i]) {
        targetArray[i] = null;
        correctCount++;
        guessArray[i] = null;
      }
    }
    for (let i = 0; i < WORD_LENGTH; i++) {
      if (guessArray[i] !== null && targetArray.includes(guessArray[i])) {
        targetArray[targetArray.indexOf(guessArray[i])] = null;
        presentCount++;
      }
    }
  }

  let absentCount = WORD_LENGTH - correctCount - presentCount;

  if (isWord500 && isValidWord) {
    word500History.push({ word: guessWord, c: correctCount, p: presentCount, a: absentCount });
    guesses.push(guessWord);
    console.log(`✅ ACCEPTED ${guessWord} with c=${correctCount}, p=${presentCount}, a=${absentCount}`);
  } else {
    console.log(`❌ REJECTED ${guessWord}. isValidWord is ${isValidWord}. hardModeMsg: ${hardModeMsg}`);
  }
}

console.log("ROUND START");
console.log("Current Word:", currentWord);
processGuess("MALAM");
console.log("History:", word500History);
processGuess("TENDA");
console.log("History:", word500History);
