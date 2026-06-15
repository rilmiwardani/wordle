const past = "MALAM";
const guessWord = "TENDA";
const currentWord = "BENGK"; // A word that has no M, A, L

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

const actual = getScore(past, currentWord);
const simulated = getScore(past, guessWord);

console.log("actual", actual);
console.log("simulated", simulated);
console.log("actual.c !== simulated.c || actual.p !== simulated.p", actual.c !== simulated.c || actual.p !== simulated.p);
