const past = "MALAM";
const guessWord = "TENDA";
const currentWord = "BENGK"; // A target with 0 greens and 0 yellows against MALAM

const currentGameMode = 'word500';
const hardModeState = 'hard';

let guesses = [past];
let VALID_WORDS = [past, guessWord, currentWord];

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
    }
  }
  return { valid: true };
}

console.log(validateHardMode(guessWord));
