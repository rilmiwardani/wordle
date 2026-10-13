// ═════════════════════════════════════════════════════════════════════════════
// WORD CLUSTER PUZZLE DATABASE (6 KATA TERKAIT DENGAN 1 TEMA KATA)
// ═════════════════════════════════════════════════════════════════════════════
// Konsep Desain:
// - 1 Tema Kata yang mudah dipahami & menarik bagi penonton TikTok Live.
// - 6 Kata Isian yang berhubungan erat, masuk akal, dan proporsional (tidak terlalu mudah).
// - Poin bertingkat dari terbesar ke terkecil: 60, 50, 40, 30, 20, 10.
// - Total Database: 80 Tema Lengkap & Valid KBBI.
// ═════════════════════════════════════════════════════════════════════════════

window.WORDCLUSTER_DEFAULT_PUZZLES = [
  {
    topic: "LAUT",
    words: ["BADAI", "NELAYAN", "OMBAK", "KARANG", "JANGKAR", "IKAN"]
  },
  {
    topic: "SEKOLAH",
    words: ["SERAGAM", "GURU", "BELAJAR", "KELAS", "BUKU", "TUGAS"]
  },
  {
    topic: "DAPUR",
    words: ["KOMPOR", "WAJAN", "PISAU", "PANCI", "PIRING", "SENDOK"]
  },
  {
    topic: "HUTAN",
    words: ["RIMBA", "POHON", "HARIMAU", "SEMAK", "SUNGAI", "DAUN"]
  },
  {
    topic: "BIOSKOP",
    words: ["POPCORN", "KARCIS", "LAYAR", "KURSI", "TIKET", "FILM"]
  },
  {
    topic: "BANDARA",
    words: ["PESAWAT", "PILOT", "PASPOR", "KOPER", "BAGASI", "TIKET"]
  },
  {
    topic: "RUMAH SAKIT",
    words: ["DOKTER", "PERAWAT", "RESEP", "OBAT", "JARUM", "PASIEN"]
  },
  {
    topic: "KULINER",
    words: ["RENDANG", "BUMBU", "SAMBAL", "KECAP", "NASI", "SATE"]
  },
  {
    topic: "LUAR ANGKASA",
    words: ["ASTRONOT", "ROKET", "PLANET", "BINTANG", "BULAN", "BUMI"]
  },
  {
    topic: "GUNUNG",
    words: ["PENDAKI", "TENDA", "PUNCAK", "KABUT", "LERENG", "JALUR"]
  },
  {
    topic: "PASAR",
    words: ["PEDAGANG", "TAWAR", "UANG", "KIOS", "SAYUR", "BUAH"]
  },
  {
    topic: "SEPAKBOLA",
    words: ["LAPANGAN", "WASIT", "KIPER", "TENDANG", "GAWANG", "BOLA"]
  },
  {
    topic: "KOMPUTER",
    words: ["KEYBOARD", "SCREEN", "MOUSE", "KABEL", "DATA", "FILE"]
  },
  {
    topic: "KERETA API",
    words: ["MASINIS", "GERBONG", "REL", "STASIUN", "TIKET", "JALUR"]
  },
  {
    topic: "POLISI",
    words: ["BORGOL", "PISTOL", "PATROLI", "SERAGAM", "TILANG", "KANTOR"]
  },
  {
    topic: "PERPUSTAKAAN",
    words: ["ENSIKLOPEDIA", "RAK", "NOVEL", "PINJAM", "BACA", "BUKU"]
  },
  {
    topic: "KAMAR TIDUR",
    words: ["SELIMUT", "GULING", "BANTAL", "KASUR", "LAMPU", "LEMARI"]
  },
  {
    topic: "PANTAI",
    words: ["KELAPA", "RESORT", "PASIR", "KERANG", "PERAHU", "ANGIN"]
  },
  {
    topic: "TAMAN",
    words: ["BUNGA", "AYUNAN", "RUMPUT", "BANGKU", "KOLAM", "POHON"]
  },
  {
    topic: "PENGADILAN",
    words: ["HAKIM", "JAKSA", "SIDANG", "PALU", "SAKSI", "PASAL"]
  },
  {
    topic: "BENGKEL",
    words: ["MONTIR", "OBENG", "MESIN", "OLI", "KUNCI", "BAUT"]
  },
  {
    topic: "HOTEL",
    words: ["RESEPSIONIS", "KAMAR", "KUNCI", "LOBI", "KOLAM", "LIFT"]
  },
  {
    topic: "RESTORAN",
    words: ["PELAYAN", "MENU", "MEJA", "KASIR", "PESAN", "MINUM"]
  },
  {
    topic: "KANTOR",
    words: ["ATASAN", "RAPAT", "LAPORAN", "KOMPUTER", "GAJI", "MEJA"]
  },
  {
    topic: "BANK",
    words: ["TELLER", "TABUNGAN", "UANG", "ANTREAN", "KARTU", "BRANKAS"]
  },
  {
    topic: "KEBUN BINATANG",
    words: ["JERAPAH", "KANDANG", "PAWANG", "GAJAH", "HEWAN", "TIKET"]
  },
  {
    topic: "PEMADAM",
    words: ["SIRENE", "SELANG", "TANGGA", "HELM", "AIR", "API"]
  },
  {
    topic: "PERNIKAHAN",
    words: ["PELAMINAN", "PENGHULU", "CINCIN", "GAUN", "UNDANGAN", "KADO"]
  },
  {
    topic: "MUSIK",
    words: ["GITAR", "MELODI", "PENYANYI", "PIANO", "DRUM", "KONSER"]
  },
  {
    topic: "PERTANIAN",
    words: ["TRAKTOR", "CANGKUL", "PETANI", "PUPUK", "SAWAH", "PADI"]
  },
  {
    topic: "WARKOP",
    words: ["GORENGAN", "NONGKRONG", "CANGKIR", "KOPI", "GULA", "TEH"]
  },
  {
    topic: "KAMAR MANDI",
    words: ["HANDUK", "GAYUNG", "SABUN", "SAMPO", "SIKAT", "KERAN"]
  },
  {
    topic: "SUPERMARKET",
    words: ["DISKON", "BELANJA", "TROLI", "STRUK", "KASIR", "RAK"]
  },
  {
    topic: "TINJU",
    words: ["KNOCKOUT", "PUKULAN", "TANDING", "WASIT", "SABUK", "RING"]
  },
  {
    topic: "MEMANCING",
    words: ["JORAN", "UMPAN", "PERAHU", "SUNGAI", "KAIL", "IKAN"]
  },
  {
    topic: "APOTEK",
    words: ["APOTEKER", "VITAMIN", "KAPSUL", "RESEP", "SALEP", "OBAT"]
  },
  {
    topic: "BULUTANGKIS",
    words: ["LAPANGAN", "RAKET", "SMASH", "WASIT", "NET", "KOK"]
  },
  {
    topic: "FOTOGRAFI",
    words: ["KAMERA", "TRIPOD", "BLITZ", "LENSA", "FOTO", "POSE"]
  },
  {
    topic: "CUACA",
    words: ["PELANGI", "MENDUNG", "PETIR", "ANGIN", "HUJAN", "AWAN"]
  },
  {
    topic: "TENTARA",
    words: ["PRAJURIT", "SENJATA", "LORENG", "MARKAS", "BARET", "PERANG"]
  },
  {
    topic: "PENERBANGAN",
    words: ["PRAMUGARI", "LANDASAN", "KOKPIT", "SAYAP", "RADAR", "AWAN"]
  },
  {
    topic: "FURNITUR",
    words: ["LEMARI", "KASUR", "SOFA", "BANGKU", "KURSI", "MEJA"]
  },
  {
    topic: "KANTOR POS",
    words: ["PRANGKO", "AMPLOP", "ALAMAT", "SURAT", "PAKET", "KURIR"]
  },
  {
    topic: "ULANG TAHUN",
    words: ["SELAMAT", "BALON", "LILIN", "KADO", "TOPI", "KUE"]
  },
  {
    topic: "OLAHRAGA",
    words: ["KERINGAT", "STADION", "SEPATU", "MEDALI", "JUARA", "LARI"]
  },
  {
    topic: "BERKEMAH",
    words: ["UNGGUN", "RANSEL", "MATRAS", "SENTER", "TENDA", "KAYU"]
  },
  {
    topic: "PELABUHAN",
    words: ["KONTAINER", "DERMAGA", "NAHKODA", "JANGKAR", "KAPAL", "LAUT"]
  },
  {
    topic: "SIRKUS",
    words: ["AKROBAT", "TRAPESIUM", "PAWANG", "BADUT", "SINGA", "TENDA"]
  },
  {
    topic: "SMARTPHONE",
    words: ["BATERAI", "CHARGER", "APLIKASI", "LAYAR", "SINYAL", "PESAN"]
  },
  {
    topic: "KANTOR DESA",
    words: ["KEPALA", "BALAI", "WARGA", "SURAT", "STEMPEL", "LURAH"]
  },
  {
    topic: "MELUKIS",
    words: ["SENIMAN", "KANVAS", "SKETSA", "PALET", "KUAS", "CAT"]
  },
  {
    topic: "KERAJAAN",
    words: ["MAHKOTA", "ISTANA", "PANGERAN", "TAHTA", "RATU", "RAJA"]
  },
  {
    topic: "MENJAHIT",
    words: ["GUNTING", "BENANG", "JARUM", "MESIN", "POLA", "KAIN"]
  },
  {
    topic: "DOKTER GIGI",
    words: ["TAMBAL", "KUMUR", "CABUT", "BEHEL", "GIGI", "BOR"]
  },
  {
    topic: "BASKET",
    words: ["KERANJANG", "LAPANGAN", "TANDING", "WASIT", "RING", "BOLA"]
  },
  {
    topic: "ANGKOT",
    words: ["PENUMPANG", "ONGKOS", "TRAYEK", "PINTU", "SUPIR", "JALUR"]
  },
  {
    topic: "LABORATORIUM",
    words: ["MIKROSKOP", "PENELITI", "TABUNG", "REAKSI", "CAIRAN", "KIMIA"]
  },
  {
    topic: "SALON",
    words: ["KERAMAS", "CERMIN", "GUNTING", "SISIR", "POTONG", "CAT"]
  },
  {
    topic: "SULAP",
    words: ["KELINCI", "TONGKAT", "MANTRA", "KARTU", "TRIK", "TOPI"]
  },
  {
    topic: "TAMAN HIBURAN",
    words: ["BIANGLALA", "KORAKORA", "WAHANA", "ANTREAN", "KARCIS", "TIKET"]
  },
  {
    topic: "INTERNET",
    words: ["BROWSER", "DOWNLOAD", "WEBSITE", "KUOTA", "MODEM", "WIFI"]
  },
  {
    topic: "DETEKTIF",
    words: ["MISTERI", "KASUS", "JEJAK", "BUKTI", "PELAKU", "SIDIK"]
  },
  {
    topic: "MUSEUM",
    words: ["ARTEFAK", "SEJARAH", "KURATOR", "PATUNG", "FOSIL", "KUNO"]
  },
  {
    topic: "GEMPA",
    words: ["TSUNAMI", "GETARAN", "RUNTUH", "PANIK", "RETAK", "LINDU"]
  },
  {
    topic: "BATIK",
    words: ["CANTING", "CORAK", "KAIN", "MOTIF", "WARNA", "CELUP"]
  },
  {
    topic: "BALAP MOTOR",
    words: ["SIRKUIT", "TIKUNGAN", "PADDOCK", "PITSTOP", "HELM", "BAN"]
  },
  {
    topic: "BAJAK LAUT",
    words: ["TENGKORAK", "BENDERA", "PEDANG", "HARTA", "KAPAL", "PETA"]
  },
  {
    topic: "GUDANG",
    words: ["LOGISTIK", "FORKLIFT", "KARTON", "BARANG", "PALET", "RAK"]
  },
  {
    topic: "SPBU",
    words: ["PETUGAS", "BENSIN", "TANGKI", "SOLAR", "NOZEL", "STRUK"]
  },
  {
    topic: "BERENANG",
    words: ["KACAMATA", "PELAMPUNG", "HANDUK", "KOLAM", "GAYA", "AIR"]
  },
  {
    topic: "FASHION",
    words: ["AKSESORIS", "KEMEJA", "CELANA", "SEPATU", "JAKET", "TOPI"]
  },
  {
    topic: "SARAPAN",
    words: ["LONTONG", "OMELET", "BUBUR", "TELUR", "ROTI", "SUSU"]
  },
  {
    topic: "ALAT MUSIK",
    words: ["GAMELAN", "ANGKLUNG", "KECAPI", "KENDANG", "SERULING", "SASANDO"]
  },
  {
    topic: "KAMPUS",
    words: ["SKRIPSI", "SEMESTER", "WISUDA", "DOSEN", "KULIAH", "JURUSAN"]
  },
  {
    topic: "PETERNAKAN",
    words: ["KAMBING", "KANDANG", "RUMPUT", "SAPI", "SUSU", "AYAM"]
  },
  {
    topic: "PRAMUKA",
    words: ["TONGKAT", "PELUIT", "KOMPAS", "TENDA", "KACU", "TALI"]
  },
  {
    topic: "WARTEG",
    words: ["GORENGAN", "TEMPE", "KIKIL", "KERUPUK", "SAMBAL", "TELUR"]
  },
  {
    topic: "ALAT TULIS",
    words: ["PENGGARIS", "PENGHAPUS", "PENSIL", "PULPEN", "SPIDOL", "BUKU"]
  },
  {
    topic: "KOSMETIK",
    words: ["LIPSTIK", "PARFUM", "MASKARA", "BEDAK", "SERUM", "KUTEK"]
  },
  {
    topic: "LEBARAN",
    words: ["KETUPAT", "MUDIK", "OPOR", "THR", "MAAF", "BAJU"]
  },
  {
    topic: "PODCAST",
    words: ["HEADPHONE", "MIKROFON", "REKAMAN", "OBROLAN", "STUDIO", "EPISODE"]
  },
  {
    topic: "TAMBANG",
    words: ["BATUBARA", "TEROWONGAN", "EKSKAVATOR", "MINERAL", "EMAS", "BOR"]
  },
  {
    topic: "ASTRONOMI",
    words: ["OBSERVATORIUM", "TELESKOP", "GALAKSI", "GERHANA", "KOMET", "NEBULA"]
  },
  {
    topic: "KONSTRUKSI",
    words: ["ARSITEK", "PROYEK", "MANDOR", "BETON", "SEMEN", "SKETSA"]
  },
  {
    topic: "ARUNG JERAM",
    words: ["PELAMPUNG", "DAYUNG", "JERAM", "ARUS", "HELM", "PERAHU"]
  },
  {
    topic: "JURNALISTIK",
    words: ["WARTAWAN", "REPORTER", "BERITA", "WAWANCARA", "REDAKSI", "LIPUTAN"]
  },
  {
    topic: "PENCAK SILAT",
    words: ["JURUS", "SABUK", "PENDEKAR", "TANDING", "PADEPOKAN", "GELANGGANG"]
  },
  {
    topic: "TOKO ROTI",
    words: ["ADONAN", "TERIGU", "SELAI", "OVEN", "RAGI", "ROTI"]
  },
  {
    topic: "PEMROGRAMAN",
    words: ["ALGORITMA", "DATABASE", "SINTAKS", "SERVER", "KODING", "LOGIKA"]
  },
  {
    topic: "PASAR MODAL",
    words: ["INVESTASI", "DIVIDEN", "INVESTOR", "SAHAM", "BURSA", "MODAL"]
  },
  {
    topic: "SENI TARI",
    words: ["KOREOGRAFI", "SELENDANG", "GEMULAI", "PANGGUNG", "KOSTUM", "IRAMA"]
  },
  {
    topic: "PERIKLANAN",
    words: ["BILLBOARD", "KAMPANYE", "SLOGAN", "PROMOSI", "AUDIENS", "IKLAN"]
  },
  {
    topic: "BENCANA ALAM",
    words: ["LONGSOR", "EVAKUASI", "BANJIR", "ERUPSI", "PENGUNGSI", "RELAWAN"]
  },
  {
    topic: "PEMILU",
    words: ["KANDIDAT", "KAMPANYE", "COBLOS", "BILIK", "SUARA", "TPS"]
  },
  {
    topic: "KAPAL SELAM",
    words: ["PERISKOP", "TORPEDO", "SONAR", "KEDALAMAN", "RUDAL", "LAMBUNG"]
  },
  {
    topic: "LINGKUNGAN",
    words: ["REBOISASI", "KOMPOS", "ORGANIK", "POLUSI", "HABITAT", "LIMBAH"]
  },
  {
    topic: "WAYANG",
    words: ["DALANG", "KELIR", "GAMELAN", "LAKON", "SINDEN", "KULIT"]
  },
  {
    topic: "EKONOMI",
    words: ["INFLASI", "EKSPOR", "IMPOR", "PRODUKSI", "KONSUMEN", "PASAR"]
  },
  {
    topic: "PERFILMAN",
    words: ["SUTRADARA", "PRODUSER", "SKENARIO", "AKTOR", "SYUTING", "KAMERA"]
  },
  {
    topic: "ARKEOLOGI",
    words: ["EKSKAVASI", "ARTEFAK", "PRASASTI", "FOSIL", "CANDI", "SITUS"]
  }
];

window.WORDCLUSTER_PUZZLES = window.WORDCLUSTER_DEFAULT_PUZZLES;
