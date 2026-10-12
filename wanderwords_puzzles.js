// ═════════════════════════════════════════════════════════════════════════════
// WANDER WORDS PUZZLE DATABASE (SOAL BAKU MINIMAL 8 HURUF & CLUE CERDAS)
// ═════════════════════════════════════════════════════════════════════════════
// Aturan Desain Soal:
// 1. Setiap jawaban merupakan kata / frasa otentik & baku dengan MINIMAL 8 HURUF (A-Z).
// 2. Tidak menggunakan imbuhan tempelan yang tidak lazim.
// 3. Clue ringkas (2-3 kata), pas di layar HP vertikal, dan tidak membocorkan kata kunci jawaban.

window.WANDERWORDS_DEFAULT_WORDS = [
  // ── 1. Film, Serial, & Sinema Populer ──
  { clue: "PROYEK FISIKAWAN ATOM", answer: "OPPENHEIMER" },
  { clue: "PENJELAJAHAN WAKTU & RUANG", answer: "INTERSTELLAR" },
  { clue: "ALTER EGO HEISENBERG", answer: "BREAKING BAD" },
  { clue: "DINASTI DON CORLEONE", answer: "THE GODFATHER" },
  { clue: "GANGSTER KOTA BIRMINGHAM", answer: "PEAKY BLINDERS" },
  { clue: "KOTA HAWKINS & ELEVEN", answer: "STRANGER THINGS" },
  { clue: "AUTOBOT DAN DECEPTICON", answer: "TRANSFORMERS" },
  { clue: "TAMAN DINOSAURUS ISLA NUBLAR", answer: "JURASSIC PARK" },
  { clue: "CINCIN SAURON DI MORDOR", answer: "LORD OF THE RINGS" },
  { clue: "ASRAMA SIHIR HOGWARTS", answer: "HARRY POTTER" },
  { clue: "PEMBERANTAS GOTHAM CITY", answer: "THE DARK KNIGHT" },
  { clue: "PETER PARKER & LABA-LABA", answer: "SPIDERMAN" },
  { clue: "PERMAINAN LAMPU MERAH HIJAU", answer: "SQUID GAME" },

  // ── 2. Anime & Pop Culture ──
  { clue: "HARTA KARUN GOL D ROGER", answer: "ONE PIECE" },
  { clue: "KIMETSU NO YAIBA", answer: "DEMON SLAYER" },
  { clue: "DOMAIN EXPANSION RYOMEN", answer: "JUJUTSU KAISEN" },
  { clue: "SURVEY CORPS & DINDING MARIA", answer: "ATTACK ON TITAN" },
  { clue: "BUKU MILIK SHINIGAMI RYUK", answer: "DEATH NOTE" },
  { clue: "SHINICHI KUDO & RACUN APTX", answer: "DETECTIVE CONAN" },
  { clue: "PAHLAWAN BOTAK ASOSIASI", answer: "ONE PUNCH MAN" },
  { clue: "DESA NINJA KONOHA", answer: "NARUTO SHIPPUUDEN" },
  { clue: "TRANSMUTASI ALKIMIA ELRIC", answer: "FULLMETAL ALCHEMIST" },

  // ── 3. Film & Serial Indonesia ──
  { clue: "KARYA ANDREA HIRATA", answer: "LASKAR PELANGI" },
  { clue: "TEROR IBU DAN LONCENG", answer: "PENGABDI SETAN" },
  { clue: "KUTUKAN BADARAWUHI", answer: "KKN DESA PENARI" },
  { clue: "PABRIK KRETEK TEMBAKAU", answer: "GADIS KRETEK" },
  { clue: "KARYA ROMAN BUYA HAMKA", answer: "KAPAL VAN DER WIJCK" },
  { clue: "OBSERVATORIUM BOSSCHA", answer: "PETUALANGAN SHERINA" },
  { clue: "HARTA YANG PALING BERHARGA", answer: "KELUARGA CEMARA" },

  // ── 4. Kuliner Nusantara & Tradisional ──
  { clue: "KULINER KHAS DEWATA", answer: "AYAM BETUTU" },
  { clue: "KULINER KHAS BETAWI", answer: "KERAK TELOR" },
  { clue: "KULINER KHAS LOMBOK", answer: "AYAM TALIWANG" },
  { clue: "SOP DAGING SULAWESI", answer: "COTO MAKASSAR" },
  { clue: "KUAH KLUWEK HITAM GURIH", answer: "RAWON SURABAYA" },
  { clue: "KULINER CUKO HITAM PEDAS", answer: "PEMPEK PALEMBANG" },
  { clue: "KULINER SAGU IKAN KUAH", answer: "PAPEDA PAPUA" },
  { clue: "KUE TART KELAPA MANADO", answer: "KLAPPERTAART" },
  { clue: "DESSERT PISANG MAKASSAR", answer: "ES PISANG IJO" },
  { clue: "KULINER IGA SAPI MAKASSAR", answer: "KONRO BAKAR" },
  { clue: "SAYUR SAUS KACANG IBUKOTA", answer: "GADO GADO BETAWI" },
  { clue: "KUDAPAN MANIS TERANG BULAN", answer: "MARTABAK MANIS" },
  { clue: "KUDAPAN TELUR ASIN GURIH", answer: "MARTABAK TELUR" },
  { clue: "SAJIAN DAGING GULAI MINANG", answer: "RENDANG PADANG" },
  { clue: "SAJIAN NASI GURIH SOLO", answer: "NASI LIWET" },
  { clue: "KULINER KHAS CIREBON", answer: "EMPAL GENTONG" },
  { clue: "OLAHAN NANGKA MUDA JOGJA", answer: "GUDEG JOGJA" },
  { clue: "SAJIAN NASI KUNING KERUCUT", answer: "NASI TUMPENG" },
  { clue: "KULINER REMPAH RENCONG", answer: "MIE ACEH KEPITING" },

  // ── 5. Sains, Alam, & Astronomi ──
  { clue: "PROSES HIJAU DAUN", answer: "FOTOSINTESIS" },
  { clue: "DAUR HIDUP KUPU-KUPU", answer: "METAMORFOSIS" },
  { clue: "CAHAYA LANGIT KUTUB UTARA", answer: "AURORA BOREALIS" },
  { clue: "GRAVITASI MAHA EKSTREM", answer: "LUBANG HITAM" },
  { clue: "TARIKAN PUSAT BUMI", answer: "GRAVITASI BUMI" },
  { clue: "BULAN TUTUPI MATAHARI", answer: "GERHANA MATAHARI" },
  { clue: "GALAKSI TATA SURYA KITA", answer: "BIMA SAKTI" },
  { clue: "PLANET TERBESAR TATA SURYA", answer: "PLANET JUPITER" },
  { clue: "PLANET CINCIN DEBU ES", answer: "PLANET SATURNUS" },
  { clue: "GELOMBANG GEMPA BAWAH LAUT", answer: "GELOMBANG TSUNAMI" },
  { clue: "LEDAKAN AWAL SEMESTA", answer: "THE BIG BANG" },
  { clue: "GAS UTAMA UDARA BUMI", answer: "GAS NITROGEN" },
  { clue: "LAPISAN UDARA PELINDUNG", answer: "ATMOSFER BUMI" },

  // ── 6. Fauna & Satwa Eksotis ──
  { clue: "BURUNG SURGA BULU MEGAH", answer: "CENDERAWASIH" },
  { clue: "MAMALIA BERSISIK PEMIKUL", answer: "TRENGGILING" },
  { clue: "PRIMATA ENDEMIK BORNEO", answer: "ORANGUTAN" },
  { clue: "KUCING BELANG ANDALAS", answer: "HARIMAU SUMATERA" },
  { clue: "BURUNG PUTIH ENDEMIK BALI", answer: "JALAK BALI" },
  { clue: "SATWA PURBA UJUNG KULON", answer: "BADAK BERCULA" },
  { clue: "KADAL PURBA NUSA TENGGARA", answer: "KOMODO DRAGON" },
  { clue: "PRIMATA HIDUNG BESAR BORNEO", answer: "KERA BEKANTAN" },
  { clue: "MAMALIA LAUT AKROBATIK", answer: "LUMBA LUMBA" },
  { clue: "IKAN FOSIL PURBA SULAWESI", answer: "IKAN COELACANTH" },
  { clue: "MOLUSKA LAUT BERKANTUNG TINTA", answer: "CUMI RAKSASA" },
  { clue: "BURUNG PEMBURU GELAP MALAM", answer: "BURUNG HANTU" },

  // ── 7. Landmark, Wisata, & Geografi ──
  { clue: "CANDI BUDDHA TERBESAR", answer: "BOROBUDUR" },
  { clue: "LEGENDA SERIBU CANDI", answer: "CANDI PRAMBANAN" },
  { clue: "API BIRU BANYUWANGI", answer: "KAWAH IJEN" },
  { clue: "PUNCAK ATAP PULAU LOMBOK", answer: "GUNUNG RINJANI" },
  { clue: "GUGUSAN KARANG PAPUA BARAT", answer: "RAJA AMPAT" },
  { clue: "GERBANG PULAU KOMODO", answer: "LABUAN BAJO" },
  { clue: "DANAU KALDERA SAMOSIR", answer: "DANAU TOBA" },
  { clue: "IKON BAJA KOTA PARIS", answer: "MENARA EIFFEL" },
  { clue: "AMFITEATER GLADIATOR ROMA", answer: "COLOSSEUM" },
  { clue: "BENTENG PANJANG DINASTI MING", answer: "TEMBOK CHINA" },
  { clue: "MAKAM FIRAUN KUNO GIZA", answer: "PIRAMIDA MESIR" },
  { clue: "MENARA LONCENG INGGRIS", answer: "BIG BEN LONDON" },
  { clue: "STADION UTAMA IBUKOTA", answer: "GELORA BUNG KARNO" },

  // ── 8. Sejarah, Budaya, & Pop Culture ──
  { clue: "IKRAR PENYATU NUSANTARA", answer: "SUMPAH PALAPA" },
  { clue: "IKRAR PEMUDA TAHUN 1928", answer: "SUMPAH PEMUDA" },
  { clue: "PERISTIWA 17 AGUSTUS 1945", answer: "PROKLAMASI" },
  { clue: "KERAJAAN MARITIM BUDDHA", answer: "KERAJAAN SRIWIJAYA" },
  { clue: "KERAJAAN HINDU MAJAPAHIT", answer: "KERAJAAN MAJAPAHIT" },
  { clue: "TARI TANGAN TEPIS DADA GAYO", answer: "TARI SAMAN" },
  { clue: "ALAT MUSIK BAMBU SUNDA", answer: "ANGKLUNG BAMBU" },
  { clue: "ALAT MUSIK LONTAR PULAU ROTE", answer: "SASANDO ROTE" },
  { clue: "MOTIF BATIK KHAS CIREBON", answer: "MEGA MENDUNG" },
  { clue: "ARSITEKTUR ATAP GONJONG", answer: "RUMAH GADANG" },
  { clue: "SENJATA BILAH PAMOR JAWA", answer: "KERIS PUSAKA" },
  { clue: "PERETASAN & KEAMANAN SIBER", answer: "CYBER SECURITY" },
  { clue: "DUNIA BALOK DAN KERAJINAN", answer: "MINECRAFT" },
  { clue: "GAME MOBA LAND OF DAWN", answer: "MOBILE LEGENDS" },
  { clue: "PETUALANGAN NEGERI TEYVAT", answer: "GENSHIN IMPACT" },
  { clue: "KECERDASAN BUATAN MODERN", answer: "KECERDASAN BUATAN" },
  { clue: "TAKTIKAL SHOOTER RIOT GAMES", answer: "VALORANT" }
];

// Kompatibilitas dengan script lama
window.WANDERWORDS_PUZZLES = window.WANDERWORDS_DEFAULT_WORDS;
