const WORDS = [
  "MAKAN", "MINUM", "TIDUR", "JALAN", "KAMAR", "BULAN", "MANDI", "SAKIT", 
  "SEHAT", "KASIH", "CINTA", "RINDU", "BENAR", "SALAH", "HITAM", "PUTIH", 
  "MERAH", "HIJAU", "BUNGA", "POHON", "HUTAN", "BARAT", "TIMUR", "UTARA", 
  "CEPAT", "BESAR", "KECIL", "PANAS", "BOSAN", "LEKAS", "INDAH", "JELEK", 
  "GELAP", "SUSAH", "MUDAH", "HEBAT", "MINTA", "TANYA", "JAWAB", "SIANG", 
  "MALAM", "KABAR", "BENCI", "MARAH", "BUKAN", "SELAL", "SUDAH", "BELUM",
  "RUMAH", "KOTAK", "MOBIL", "MOTOR", "SEPEDA" // wait sepeda is 6.
];

// Ensure all are exactly 5 letters
const WORD_LIST = WORDS.filter(w => w.length === 5);

function getRandomWord() {
  return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
}

function isValidWord(word) {
  // We can either strictly check the list, or allow any 5 letter word 
  // Let's allow any 5-letter word for chat flexibility, but target word is from WORD_LIST
  return word.length === 5; 
}
