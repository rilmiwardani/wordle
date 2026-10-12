// ═════════════════════════════════════════════════════════════════════════════
// WANDER WORDS PUZZLE DATABASE (CLUE KATEGORI MURNI & MINIMAL 8 HURUF)
// ═════════════════════════════════════════════════════════════════════════════
// Konsep Desain:
// - Clue murni berupa KATEGORI UMUM (FILM, ANIME, KULINER, FAUNA, SAINS, dll)
// - Memberikan tantangan maksimal bagi penonton TikTok Live untuk memindai papan huruf
// - Setiap jawaban minimal 8 huruf (A-Z) dan baku/otentik.

window.WANDERWORDS_DEFAULT_WORDS = [
  // ── Film & Sinema Populer ──
  { clue: "FILM", answer: "OPPENHEIMER" },
  { clue: "FILM", answer: "INTERSTELLAR" },
  { clue: "FILM", answer: "THE GODFATHER" },
  { clue: "FILM", answer: "TRANSFORMERS" },
  { clue: "FILM", answer: "JURASSIC PARK" },
  { clue: "FILM", answer: "LORD OF THE RINGS" },
  { clue: "FILM", answer: "HARRY POTTER" },
  { clue: "FILM", answer: "THE DARK KNIGHT" },
  { clue: "FILM", answer: "SPIDERMAN" },
  { clue: "FILM", answer: "LASKAR PELANGI" },
  { clue: "FILM", answer: "PENGABDI SETAN" },
  { clue: "FILM", answer: "AGAK LAIN" },
  { clue: "FILM", answer: "ALAS ROBAN" },
  { clue: "FILM", answer: "PETUALANGAN SHERINA" },

  // ── Serial TV ──
  { clue: "SERIAL TV", answer: "BREAKING BAD" },
  { clue: "SERIAL TV", answer: "PEAKY BLINDERS" },
  { clue: "SERIAL TV", answer: "STRANGER THINGS" },
  { clue: "SERIAL TV", answer: "SQUID GAME" },
  { clue: "SERIAL TV", answer: "GADIS KRETEK" },
  { clue: "SERIAL TV", answer: "KELUARGA CEMARA" },

  // ── Anime ──
  { clue: "ANIME", answer: "ONE PIECE" },
  { clue: "ANIME", answer: "DEMON SLAYER" },
  { clue: "ANIME", answer: "JUJUTSU KAISEN" },
  { clue: "ANIME", answer: "ATTACK ON TITAN" },
  { clue: "ANIME", answer: "DEATH NOTE" },
  { clue: "ANIME", answer: "DETECTIVE CONAN" },
  { clue: "ANIME", answer: "ONE PUNCH MAN" },
  { clue: "ANIME", answer: "NARUTO SHIPPUUDEN" },
  { clue: "ANIME", answer: "FULLMETAL ALCHEMIST" },

  // ── Kuliner Nusantara ──
  { clue: "KULINER", answer: "AYAM BETUTU" },
  { clue: "KULINER", answer: "KERAK TELOR" },
  { clue: "KULINER", answer: "AYAM TALIWANG" },
  { clue: "KULINER", answer: "COTO MAKASSAR" },
  { clue: "KULINER", answer: "RAWON SURABAYA" },
  { clue: "KULINER", answer: "PEMPEK PALEMBANG" },
  { clue: "KULINER", answer: "PAPEDA PAPUA" },
  { clue: "KULINER", answer: "KLAPPERTAART" },
  { clue: "KULINER", answer: "ES PISANG IJO" },
  { clue: "KULINER", answer: "KONRO BAKAR" },
  { clue: "KULINER", answer: "GADO GADO BETAWI" },
  { clue: "KULINER", answer: "MARTABAK MANIS" },
  { clue: "KULINER", answer: "MARTABAK TELUR" },
  { clue: "KULINER", answer: "RENDANG PADANG" },
  { clue: "KULINER", answer: "NASI LIWET" },
  { clue: "KULINER", answer: "EMPAL GENTONG" },
  { clue: "KULINER", answer: "GUDEG JOGJA" },
  { clue: "KULINER", answer: "NASI TUMPENG" },
  { clue: "KULINER", answer: "MIE ACEH KEPITING" },

  // ── Sains & Alam ──
  { clue: "SAINS", answer: "FOTOSINTESIS" },
  { clue: "SAINS", answer: "METAMORFOSIS" },
  { clue: "SAINS", answer: "GRAVITASI BUMI" },
  { clue: "SAINS", answer: "ATMOSFER BUMI" },
  { clue: "SAINS", answer: "GAS NITROGEN" },
  { clue: "SAINS", answer: "GELOMBANG TSUNAMI" },

  // ── Astronomi & Antariksa ──
  { clue: "ASTRONOMI", answer: "AURORA BOREALIS" },
  { clue: "ASTRONOMI", answer: "LUBANG HITAM" },
  { clue: "ASTRONOMI", answer: "GERHANA MATAHARI" },
  { clue: "ASTRONOMI", answer: "BIMA SAKTI" },
  { clue: "ASTRONOMI", answer: "PLANET JUPITER" },
  { clue: "ASTRONOMI", answer: "PLANET SATURNUS" },
  { clue: "ASTRONOMI", answer: "THE BIG BANG" },

  // ── Fauna & Hewan ──
  { clue: "FAUNA", answer: "CENDERAWASIH" },
  { clue: "FAUNA", answer: "TRENGGILING" },
  { clue: "FAUNA", answer: "ORANGUTAN" },
  { clue: "FAUNA", answer: "HARIMAU SUMATERA" },
  { clue: "FAUNA", answer: "JALAK BALI" },
  { clue: "FAUNA", answer: "BADAK BERCULA" },
  { clue: "FAUNA", answer: "KOMODO DRAGON" },
  { clue: "FAUNA", answer: "KERA BEKANTAN" },
  { clue: "FAUNA", answer: "LUMBA LUMBA" },
  { clue: "FAUNA", answer: "IKAN COELACANTH" },
  { clue: "FAUNA", answer: "CUMI RAKSASA" },
  { clue: "FAUNA", answer: "BURUNG HANTU" },

  // ── Wisata & Landmark ──
  { clue: "WISATA", answer: "BOROBUDUR" },
  { clue: "WISATA", answer: "CANDI PRAMBANAN" },
  { clue: "WISATA", answer: "KAWAH IJEN" },
  { clue: "WISATA", answer: "GUNUNG RINJANI" },
  { clue: "WISATA", answer: "RAJA AMPAT" },
  { clue: "WISATA", answer: "LABUAN BAJO" },
  { clue: "WISATA", answer: "DANAU TOBA" },
  { clue: "LANDMARK", answer: "MENARA EIFFEL" },
  { clue: "LANDMARK", answer: "COLOSSEUM" },
  { clue: "LANDMARK", answer: "TEMBOK CHINA" },
  { clue: "LANDMARK", answer: "PIRAMIDA MESIR" },
  { clue: "LANDMARK", answer: "BIG BEN LONDON" },
  { clue: "LANDMARK", answer: "GELORA BUNG KARNO" },

  // ── Sejarah & Tokoh ──
  { clue: "SEJARAH", answer: "SUMPAH PALAPA" },
  { clue: "SEJARAH", answer: "SUMPAH PEMUDA" },
  { clue: "SEJARAH", answer: "PROKLAMASI" },
  { clue: "SEJARAH", answer: "KERAJAAN SRIWIJAYA" },
  { clue: "SEJARAH", answer: "KERAJAAN MAJAPAHIT" },

  // ── Budaya Nusantara ──
  { clue: "BUDAYA", answer: "TARI SAMAN" },
  { clue: "BUDAYA", answer: "ANGKLUNG BAMBU" },
  { clue: "BUDAYA", answer: "SASANDO ROTE" },
  { clue: "BUDAYA", answer: "MEGA MENDUNG" },
  { clue: "BUDAYA", answer: "RUMAH GADANG" },
  { clue: "BUDAYA", answer: "KERIS PUSAKA" },

  // ── Game & Teknologi ──
  { clue: "GAME", answer: "MINECRAFT" },
  { clue: "GAME", answer: "MOBILE LEGENDS" },
  { clue: "GAME", answer: "GENSHIN IMPACT" },
  { clue: "GAME", answer: "VALORANT" },
  { clue: "TEKNOLOGI", answer: "CYBER SECURITY" },
  { clue: "TEKNOLOGI", answer: "KECERDASAN BUATAN" }
];

// Kompatibilitas dengan script lama
window.WANDERWORDS_PUZZLES = window.WANDERWORDS_DEFAULT_WORDS;
