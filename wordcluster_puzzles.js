// ═════════════════════════════════════════════════════════════════════════════
// WORD CLUSTER PUZZLE DATABASE (6 KATA TERKAIT DENGAN 1 TEMA KATA)
// ═════════════════════════════════════════════════════════════════════════════
// Konsep Desain:
// - 1 Tema Kata yang mudah dipahami & menarik bagi penonton TikTok Live.
// - 6 Kata Isian yang berhubungan erat, masuk akal, dan proporsional (tidak terlalu mudah).
// - Poin bertingkat dari terbesar ke terkecil: 60, 50, 40, 30, 20, 10.
// - Total Database: 500 Tema Lengkap & Valid KBBI (Semua kata >= 4 huruf).
// ═════════════════════════════════════════════════════════════════════════════

window.WORDCLUSTER_DEFAULT_PUZZLES = [
  {
    topic: "LAUT",
    words: ["BADAI","NELAYAN","OMBAK","KARANG","JANGKAR","IKAN"]
  },
  {
    topic: "SEKOLAH",
    words: ["SERAGAM","GURU","BELAJAR","KELAS","BUKU","TUGAS"]
  },
  {
    topic: "DAPUR",
    words: ["KOMPOR","WAJAN","PISAU","PANCI","PIRING","SENDOK"]
  },
  {
    topic: "HUTAN",
    words: ["RIMBA","POHON","HARIMAU","SEMAK","SUNGAI","DAUN"]
  },
  {
    topic: "BIOSKOP",
    words: ["POPCORN","KARCIS","LAYAR","KURSI","TIKET","FILM"]
  },
  {
    topic: "BANDARA",
    words: ["PESAWAT","PILOT","PASPOR","KOPER","BAGASI","TIKET"]
  },
  {
    topic: "RUMAH SAKIT",
    words: ["DOKTER","PERAWAT","RESEP","OBAT","JARUM","PASIEN"]
  },
  {
    topic: "KULINER",
    words: ["RENDANG","BUMBU","SAMBAL","KECAP","NASI","SATE"]
  },
  {
    topic: "LUAR ANGKASA",
    words: ["ASTRONOT","ROKET","PLANET","BINTANG","BULAN","BUMI"]
  },
  {
    topic: "GUNUNG",
    words: ["PENDAKI","TENDA","PUNCAK","KABUT","LERENG","JALUR"]
  },
  {
    topic: "PASAR",
    words: ["PEDAGANG","TAWAR","UANG","KIOS","SAYUR","BUAH"]
  },
  {
    topic: "SEPAKBOLA",
    words: ["LAPANGAN","WASIT","KIPER","TENDANG","GAWANG","BOLA"]
  },
  {
    topic: "KOMPUTER",
    words: ["KEYBOARD","SCREEN","MOUSE","KABEL","DATA","FILE"]
  },
  {
    topic: "KERETA API",
    words: ["MASINIS","GERBONG","SINYAL","STASIUN","TIKET","JALUR"]
  },
  {
    topic: "POLISI",
    words: ["BORGOL","PISTOL","PATROLI","SERAGAM","TILANG","KANTOR"]
  },
  {
    topic: "PERPUSTAKAAN",
    words: ["ENSIKLOPEDIA","KATALOG","NOVEL","PINJAM","BACA","BUKU"]
  },
  {
    topic: "KAMAR TIDUR",
    words: ["SELIMUT","GULING","BANTAL","KASUR","LAMPU","LEMARI"]
  },
  {
    topic: "PANTAI",
    words: ["KELAPA","RESORT","PASIR","KERANG","PERAHU","ANGIN"]
  },
  {
    topic: "TAMAN",
    words: ["BUNGA","AYUNAN","RUMPUT","BANGKU","KOLAM","POHON"]
  },
  {
    topic: "PENGADILAN",
    words: ["HAKIM","JAKSA","SIDANG","PALU","SAKSI","PASAL"]
  },
  {
    topic: "BENGKEL",
    words: ["MONTIR","SERVIS","OBENG","MESIN","KUNCI","BAUT"]
  },
  {
    topic: "HOTEL",
    words: ["RESEPSIONIS","KAMAR","KUNCI","LOBI","KOLAM","LIFT"]
  },
  {
    topic: "RESTORAN",
    words: ["PELAYAN","MENU","MEJA","KASIR","PESAN","MINUM"]
  },
  {
    topic: "KANTOR",
    words: ["ATASAN","RAPAT","LAPORAN","KOMPUTER","GAJI","MEJA"]
  },
  {
    topic: "BANK",
    words: ["TELLER","TABUNGAN","UANG","ANTREAN","KARTU","BRANKAS"]
  },
  {
    topic: "KEBUN BINATANG",
    words: ["JERAPAH","KANDANG","PAWANG","GAJAH","HEWAN","TIKET"]
  },
  {
    topic: "PEMADAM",
    words: ["SIRENE","SELANG","PETUGAS","TANGGA","BAHAYA","HELM"]
  },
  {
    topic: "PERNIKAHAN",
    words: ["PELAMINAN","PENGHULU","CINCIN","GAUN","UNDANGAN","KADO"]
  },
  {
    topic: "MUSIK",
    words: ["GITAR","MELODI","PENYANYI","PIANO","DRUM","KONSER"]
  },
  {
    topic: "PERTANIAN",
    words: ["TRAKTOR","CANGKUL","PETANI","PUPUK","SAWAH","PADI"]
  },
  {
    topic: "WARKOP",
    words: ["GORENGAN","NONGKRONG","OBROLAN","CANGKIR","KOPI","GULA"]
  },
  {
    topic: "KAMAR MANDI",
    words: ["HANDUK","GAYUNG","SABUN","SAMPO","SIKAT","KERAN"]
  },
  {
    topic: "SUPERMARKET",
    words: ["KERANJANG","DISKON","BELANJA","TROLI","STRUK","KASIR"]
  },
  {
    topic: "TINJU",
    words: ["KNOCKOUT","PUKULAN","TANDING","WASIT","SABUK","RING"]
  },
  {
    topic: "MEMANCING",
    words: ["JORAN","UMPAN","PERAHU","SUNGAI","KAIL","IKAN"]
  },
  {
    topic: "APOTEK",
    words: ["APOTEKER","VITAMIN","KAPSUL","RESEP","SALEP","OBAT"]
  },
  {
    topic: "BULUTANGKIS",
    words: ["LAPANGAN","TUNGGAL","RAKET","SMASH","WASIT","GANDA"]
  },
  {
    topic: "FOTOGRAFI",
    words: ["KAMERA","TRIPOD","BLITZ","LENSA","FOTO","POSE"]
  },
  {
    topic: "CUACA",
    words: ["PELANGI","MENDUNG","PETIR","ANGIN","HUJAN","AWAN"]
  },
  {
    topic: "TENTARA",
    words: ["PRAJURIT","SENJATA","LORENG","MARKAS","BARET","PERANG"]
  },
  {
    topic: "PENERBANGAN",
    words: ["PRAMUGARI","LANDASAN","KOKPIT","SAYAP","RADAR","AWAN"]
  },
  {
    topic: "FURNITUR",
    words: ["LEMARI","KASUR","SOFA","BANGKU","KURSI","MEJA"]
  },
  {
    topic: "KANTOR POS",
    words: ["PRANGKO","AMPLOP","ALAMAT","SURAT","PAKET","KURIR"]
  },
  {
    topic: "ULANG TAHUN",
    words: ["SELAMAT","PESTA","BALON","LILIN","KADO","TOPI"]
  },
  {
    topic: "OLAHRAGA",
    words: ["KERINGAT","STADION","SEPATU","MEDALI","JUARA","LARI"]
  },
  {
    topic: "BERKEMAH",
    words: ["UNGGUN","RANSEL","MATRAS","SENTER","TENDA","KAYU"]
  },
  {
    topic: "PELABUHAN",
    words: ["KONTAINER","DERMAGA","NAHKODA","JANGKAR","KAPAL","LAUT"]
  },
  {
    topic: "SIRKUS",
    words: ["AKROBAT","TRAPESIUM","PAWANG","BADUT","SINGA","TENDA"]
  },
  {
    topic: "SMARTPHONE",
    words: ["BATERAI","CHARGER","APLIKASI","LAYAR","SINYAL","PESAN"]
  },
  {
    topic: "KANTOR DESA",
    words: ["KEPALA","BALAI","WARGA","SURAT","STEMPEL","LURAH"]
  },
  {
    topic: "MELUKIS",
    words: ["SENIMAN","KANVAS","SKETSA","PALET","WARNA","KUAS"]
  },
  {
    topic: "KERAJAAN",
    words: ["MAHKOTA","ISTANA","PANGERAN","TAHTA","RATU","RAJA"]
  },
  {
    topic: "MENJAHIT",
    words: ["GUNTING","BENANG","JARUM","MESIN","POLA","KAIN"]
  },
  {
    topic: "DOKTER GIGI",
    words: ["TAMBAL","KLINIK","KUMUR","CABUT","BEHEL","GIGI"]
  },
  {
    topic: "BASKET",
    words: ["KERANJANG","LAPANGAN","TANDING","WASIT","RING","BOLA"]
  },
  {
    topic: "ANGKOT",
    words: ["PENUMPANG","ONGKOS","TRAYEK","PINTU","SUPIR","JALUR"]
  },
  {
    topic: "LABORATORIUM",
    words: ["MIKROSKOP","PENELITI","TABUNG","REAKSI","CAIRAN","KIMIA"]
  },
  {
    topic: "SALON",
    words: ["CREAMBATH","KERAMAS","CERMIN","GUNTING","SISIR","POTONG"]
  },
  {
    topic: "SULAP",
    words: ["KELINCI","TONGKAT","MANTRA","KARTU","TRIK","TOPI"]
  },
  {
    topic: "TAMAN HIBURAN",
    words: ["BIANGLALA","KORAKORA","WAHANA","ANTREAN","KARCIS","TIKET"]
  },
  {
    topic: "INTERNET",
    words: ["BROWSER","DOWNLOAD","WEBSITE","KUOTA","MODEM","WIFI"]
  },
  {
    topic: "DETEKTIF",
    words: ["MISTERI","KASUS","JEJAK","BUKTI","PELAKU","SIDIK"]
  },
  {
    topic: "MUSEUM",
    words: ["ARTEFAK","SEJARAH","KURATOR","PATUNG","FOSIL","KUNO"]
  },
  {
    topic: "GEMPA",
    words: ["TSUNAMI","GETARAN","RUNTUH","PANIK","RETAK","LINDU"]
  },
  {
    topic: "BATIK",
    words: ["CANTING","CORAK","KAIN","MOTIF","WARNA","CELUP"]
  },
  {
    topic: "BALAP MOTOR",
    words: ["SIRKUIT","TIKUNGAN","PADDOCK","PITSTOP","KNALPOT","HELM"]
  },
  {
    topic: "BAJAK LAUT",
    words: ["TENGKORAK","BENDERA","PEDANG","HARTA","KAPAL","PETA"]
  },
  {
    topic: "GUDANG",
    words: ["LOGISTIK","FORKLIFT","KARTON","SIMPAN","BARANG","PALET"]
  },
  {
    topic: "SPBU",
    words: ["PETUGAS","BENSIN","TANGKI","SOLAR","NOZEL","STRUK"]
  },
  {
    topic: "BERENANG",
    words: ["KACAMATA","PELAMPUNG","KAPORIT","HANDUK","KOLAM","GAYA"]
  },
  {
    topic: "FASHION",
    words: ["AKSESORIS","KEMEJA","CELANA","SEPATU","JAKET","TOPI"]
  },
  {
    topic: "SARAPAN",
    words: ["LONTONG","OMELET","BUBUR","TELUR","ROTI","SUSU"]
  },
  {
    topic: "ALAT MUSIK",
    words: ["GAMELAN","ANGKLUNG","KECAPI","KENDANG","SERULING","SASANDO"]
  },
  {
    topic: "KAMPUS",
    words: ["SKRIPSI","SEMESTER","WISUDA","DOSEN","KULIAH","JURUSAN"]
  },
  {
    topic: "PETERNAKAN",
    words: ["KAMBING","KANDANG","RUMPUT","SAPI","SUSU","AYAM"]
  },
  {
    topic: "PRAMUKA",
    words: ["TONGKAT","PELUIT","KOMPAS","TENDA","KACU","TALI"]
  },
  {
    topic: "WARTEG",
    words: ["GORENGAN","TEMPE","KIKIL","KERUPUK","SAMBAL","TELUR"]
  },
  {
    topic: "ALAT TULIS",
    words: ["PENGGARIS","PENGHAPUS","PENSIL","PULPEN","SPIDOL","BUKU"]
  },
  {
    topic: "KOSMETIK",
    words: ["LIPSTIK","PARFUM","MASKARA","BEDAK","SERUM","KUTEK"]
  },
  {
    topic: "LEBARAN",
    words: ["SILATURAHMI","KETUPAT","MUDIK","OPOR","MAAF","BAJU"]
  },
  {
    topic: "PODCAST",
    words: ["HEADPHONE","MIKROFON","REKAMAN","OBROLAN","STUDIO","EPISODE"]
  },
  {
    topic: "TAMBANG",
    words: ["BATUBARA","TEROWONGAN","EKSKAVATOR","MINERAL","GALIAN","EMAS"]
  },
  {
    topic: "ASTRONOMI",
    words: ["OBSERVATORIUM","TELESKOP","GALAKSI","GERHANA","KOMET","NEBULA"]
  },
  {
    topic: "KONSTRUKSI",
    words: ["ARSITEK","PROYEK","MANDOR","BETON","SEMEN","SKETSA"]
  },
  {
    topic: "ARUNG JERAM",
    words: ["PELAMPUNG","DAYUNG","JERAM","ARUS","HELM","PERAHU"]
  },
  {
    topic: "JURNALISTIK",
    words: ["WARTAWAN","REPORTER","BERITA","WAWANCARA","REDAKSI","LIPUTAN"]
  },
  {
    topic: "PENCAK SILAT",
    words: ["JURUS","SABUK","PENDEKAR","TANDING","PADEPOKAN","GELANGGANG"]
  },
  {
    topic: "TOKO ROTI",
    words: ["ADONAN","TERIGU","SELAI","OVEN","RAGI","ROTI"]
  },
  {
    topic: "PEMROGRAMAN",
    words: ["ALGORITMA","DATABASE","SINTAKS","SERVER","KODING","LOGIKA"]
  },
  {
    topic: "PASAR MODAL",
    words: ["INVESTASI","DIVIDEN","INVESTOR","SAHAM","BURSA","MODAL"]
  },
  {
    topic: "SENI TARI",
    words: ["KOREOGRAFI","SELENDANG","GEMULAI","PANGGUNG","KOSTUM","IRAMA"]
  },
  {
    topic: "PERIKLANAN",
    words: ["BILLBOARD","KAMPANYE","SLOGAN","PROMOSI","AUDIENS","IKLAN"]
  },
  {
    topic: "BENCANA ALAM",
    words: ["LONGSOR","EVAKUASI","BANJIR","ERUPSI","PENGUNGSI","RELAWAN"]
  },
  {
    topic: "PEMILU",
    words: ["KANDIDAT","KAMPANYE","COBLOS","PARTAI","BILIK","SUARA"]
  },
  {
    topic: "KAPAL SELAM",
    words: ["PERISKOP","TORPEDO","SONAR","KEDALAMAN","RUDAL","LAMBUNG"]
  },
  {
    topic: "LINGKUNGAN",
    words: ["REBOISASI","KOMPOS","ORGANIK","POLUSI","HABITAT","LIMBAH"]
  },
  {
    topic: "WAYANG",
    words: ["DALANG","KELIR","GAMELAN","LAKON","SINDEN","KULIT"]
  },
  {
    topic: "EKONOMI",
    words: ["INFLASI","EKSPOR","IMPOR","PRODUKSI","KONSUMEN","PASAR"]
  },
  {
    topic: "PERFILMAN",
    words: ["SUTRADARA","PRODUSER","SKENARIO","AKTOR","SYUTING","KAMERA"]
  },
  {
    topic: "ARKEOLOGI",
    words: ["EKSKAVASI","ARTEFAK","PRASASTI","FOSIL","CANDI","SITUS"]
  },
  {
    topic: "APEL",
    words: ["VITAMIN","MERAH","MANIS","HIJAU","POHON","KEBUN"]
  },
  {
    topic: "KUCING",
    words: ["RUMAHAN","MEONG","TIKUS","HEWAN","MAKAN","TIDUR"]
  },
  {
    topic: "MOBIL",
    words: ["BENSIN","KEMUDI","GARASI","MESIN","SOPIR","JALAN"]
  },
  {
    topic: "BURUNG",
    words: ["LOVEBIRD","TERBANG","MERPATI","SARANG","SAYAP","KICAU"]
  },
  {
    topic: "KOPI",
    words: ["CANGKIR","KAFEIN","HITAM","PAHIT","PANAS","AROMA"]
  },
  {
    topic: "BOLA",
    words: ["LAPANGAN","OLAHRAGA","TENDANG","BASKET","GAWANG","BUNDAR"]
  },
  {
    topic: "RUMAH",
    words: ["JENDELA","DINDING","HALAMAN","PINTU","KAMAR","DAPUR"]
  },
  {
    topic: "PULAU",
    words: ["INDONESIA","LIBURAN","TERUMBU","KELAPA","TROPIS","PANTAI"]
  },
  {
    topic: "KOTA",
    words: ["METROPOLITAN","GEDUNG","JALAN","LAMPU","RAMAI","PUSAT"]
  },
  {
    topic: "PESAWAT",
    words: ["TERBANG","BANDARA","BAGASI","PILOT","SAYAP","MESIN"]
  },
  {
    topic: "ANJING",
    words: ["GONGGONG","TULANG","MAINAN","JALAN","HEWAN","SETIA"]
  },
  {
    topic: "ALAM",
    words: ["GUNUNG","SUNGAI","LANGIT","HUTAN","UDARA","HIJAU"]
  },
  {
    topic: "SEPATU",
    words: ["OLAHRAGA","SANDAL","NYAMAN","KULIT","KARET","BOOTS"]
  },
  {
    topic: "BUKU",
    words: ["PERPUSTAKAAN","HALAMAN","SAMPUL","CERITA","KERTAS","TULIS"]
  },
  {
    topic: "LANGIT",
    words: ["MATAHARI","BINTANG","PESAWAT","PELANGI","BURUNG","BULAN"]
  },
  {
    topic: "AIR",
    words: ["SUNGAI","JERNIH","MINUM","HUJAN","BASAH","GELAS"]
  },
  {
    topic: "KELUARGA",
    words: ["SAUDARA","SAYANG","KAKAK","KAKEK","NENEK","RUMAH"]
  },
  {
    topic: "SEHAT",
    words: ["IMUNISASI","OLAHRAGA","MAKANAN","VITAMIN","DOKTER","BERSIH"]
  },
  {
    topic: "BELAJAR",
    words: ["PELAJARAN","SEKOLAH","PINTAR","TUGAS","UJIAN","RAJIN"]
  },
  {
    topic: "BERMAIN",
    words: ["KELERENG","GEMBIRA","MAINAN","AYUNAN","LOMPAT","TEMAN"]
  },
  {
    topic: "CINTA",
    words: ["ROMANTIS","SAYANG","KENCAN","KASIH","PACAR","PELUK"]
  },
  {
    topic: "POHON",
    words: ["RANTING","RINDANG","BATANG","HIJAU","HUTAN","TEDUH"]
  },
  {
    topic: "JALAN",
    words: ["TIKUNGAN","TROTOAR","SEPEDA","ASPAL","LAMPU","RAMBU"]
  },
  {
    topic: "ULAR",
    words: ["BERBISA","PANJANG","MELATA","TARING","BAHAYA","LIDAH"]
  },
  {
    topic: "BUAH",
    words: ["SEMANGKA","STROBERI","VITAMIN","PISANG","MANGGA","ANGGUR"]
  },
  {
    topic: "SAYUR",
    words: ["KANGKUNG","BROKOLI","LALAPAN","WORTEL","BAYAM","TOMAT"]
  },
  {
    topic: "SUNGAI",
    words: ["JEMBATAN","NELAYAN","PERAHU","BERSIH","BANJIR","IKAN"]
  },
  {
    topic: "KAMAR",
    words: ["RANJANG","JENDELA","DINDING","LEMARI","KARPET","TIDUR"]
  },
  {
    topic: "HUJAN",
    words: ["GERIMIS","PAYUNG","MANTEL","BANJIR","DINGIN","BASAH"]
  },
  {
    topic: "GADGET",
    words: ["APLIKASI","BATERAI","PONSEL","LAPTOP","TABLET","CASING"]
  },
  {
    topic: "LIBURAN",
    words: ["LEBARAN","WISATA","PANTAI","GUNUNG","HOTEL","TIKET"]
  },
  {
    topic: "KESEHATAN",
    words: ["ISTIRAHAT","OLAHRAGA","VITAMIN","DOKTER","KLINIK","OBAT"]
  },
  {
    topic: "TRANSPORTASI",
    words: ["PESAWAT","KERETA","SEPEDA","MOBIL","MOTOR","KAPAL"]
  },
  {
    topic: "PERALATAN",
    words: ["GERGAJI","METERAN","OBENG","PALU","TANG","PAKU"]
  },
  {
    topic: "PAKAIAN",
    words: ["CELANA","SEPATU","JAKET","BAJU","KAOS","TOPI"]
  },
  {
    topic: "PROFESI",
    words: ["NELAYAN","DOKTER","POLISI","PETANI","PILOT","SUPIR"]
  },
  {
    topic: "BANGUNAN",
    words: ["SEKOLAH","GEDUNG","MASJID","GEREJA","KANTOR","RUMAH"]
  },
  {
    topic: "TEKNOLOGI",
    words: ["SMARTPHONE","INTERNET","KOMPUTER","APLIKASI","SENSOR","ROBOT"]
  },
  {
    topic: "SAINS",
    words: ["LABORATORIUM","EKSPERIMEN","MIKROSKOP","PLANET","RUMUS","KIMIA"]
  },
  {
    topic: "SENI",
    words: ["FOTOGRAFI","LUKISAN","PATUNG","TEATER","MUSIK","PUISI"]
  },
  {
    topic: "BUDAYA",
    words: ["TRADISI","UPACARA","PAKAIAN","KULINER","ADAT","TARI"]
  },
  {
    topic: "TRADISI",
    words: ["PERNIKAHAN","SEMBAHYANG","GALUNGAN","LEBARAN","KEBAYA","NATAL"]
  },
  {
    topic: "PENDIDIKAN",
    words: ["PELAJARAN","SEKOLAH","MURID","KELAS","UJIAN","GURU"]
  },
  {
    topic: "ENERGI",
    words: ["LISTRIK","BATERAI","BENSIN","NUKLIR","MINYAK","SURYA"]
  },
  {
    topic: "KOMUNIKASI",
    words: ["TELEVISI","TELEPON","PONSEL","EMAIL","SURAT","RADIO"]
  },
  {
    topic: "INFORMASI",
    words: ["PENGETAHUAN","INTERNET","BERITA","SUMBER","FAKTA","KORAN"]
  },
  {
    topic: "HIBURAN",
    words: ["TONTONAN","TELEVISI","KONSER","KOMEDI","MUSIK","FILM"]
  },
  {
    topic: "REKREASI",
    words: ["BIOSKOP","PANTAI","GUNUNG","WISATA","TAMAN","KOLAM"]
  },
  {
    topic: "PERJALANAN",
    words: ["KENDARAAN","LIBURAN","WISATA","BAGASI","JALAN","TIKET"]
  },
  {
    topic: "BELANJA",
    words: ["KANTONG","BARANG","DISKON","PASAR","TOKO","UANG"]
  },
  {
    topic: "ISTIRAHAT",
    words: ["REBAHAN","NYENYAK","BARING","SANTAI","TIDUR","LELAH"]
  },
  {
    topic: "TIDUR",
    words: ["SELIMUT","NYENYAK","BANTAL","KANTUK","KASUR","MIMPI"]
  },
  {
    topic: "MIMPI",
    words: ["KHAYALAN","HARAPAN","FANTASI","NGIGAU","TIDUR","ANGAN"]
  },
  {
    topic: "TEMAN",
    words: ["SAHABAT","SEKOLAH","KAWAN","REKAN","AKRAB","RUMAH"]
  },
  {
    topic: "SAHABAT",
    words: ["PERCAYA","SAYANG","TEMAN","KARIB","SETIA","HATI"]
  },
  {
    topic: "HADIAH",
    words: ["KEJUTAN","BONEKA","PERMEN","UCAPAN","KADO","BUKU"]
  },
  {
    topic: "DESA",
    words: ["KAMPUNG","IRIGASI","LADANG","PETANI","SAWAH","KEBUN"]
  },
  {
    topic: "PAGI",
    words: ["MATAHARI","SARAPAN","BANGUN","BURUNG","SUBUH","FAJAR"]
  },
  {
    topic: "SIANG",
    words: ["ISTIRAHAT","MATAHARI","PANAS","TERIK","MAKAN","TIDUR"]
  },
  {
    topic: "SORE",
    words: ["MAGHRIB","PULANG","LANGIT","SANTAI","SENJA","MERAH"]
  },
  {
    topic: "MALAM",
    words: ["BINTANG","SELIMUT","NYAMUK","GELAP","TIDUR","BULAN"]
  },
  {
    topic: "API",
    words: ["KEBAKARAN","KOMPOR","PANAS","MERAH","KOREK","ASAP"]
  },
  {
    topic: "ANGIN",
    words: ["LAYANGAN","KENCANG","DINGIN","SEJUK","BADAI","KIPAS"]
  },
  {
    topic: "TANAH",
    words: ["COKLAT","LADANG","LUMPUR","KERING","SUBUR","BASAH"]
  },
  {
    topic: "BATU",
    words: ["KERIKIL","PERMATA","PINGGIR","GUNUNG","KERAS","BERAT"]
  },
  {
    topic: "KAYU",
    words: ["RANTING","SERBUK","KERAS","MEBEL","POHON","BAKAR"]
  },
  {
    topic: "BESI",
    words: ["MAGNET","LOGAM","PAGAR","KARAT","PANAS","KUAT"]
  },
  {
    topic: "EMAS",
    words: ["PERHIASAN","BERHARGA","TAMBANG","KUNING","CINCIN","LOGAM"]
  },
  {
    topic: "PERAK",
    words: ["PERHIASAN","SENDOK","ANTING","PUTIH","LOGAM","WARNA"]
  },
  {
    topic: "UANG",
    words: ["BELANJA","KERTAS","DOMPET","LOGAM","HARGA","GAJI"]
  },
  {
    topic: "MATAHARI",
    words: ["TENGGELAM","TERANG","TERBIT","KUNING","PANAS","SIANG"]
  },
  {
    topic: "BINTANG",
    words: ["BERSINAR","GALAKSI","LANGIT","KEJORA","MALAM","JATUH"]
  },
  {
    topic: "AWAN",
    words: ["MENDUNG","BERARAK","LANGIT","PUTIH","HUJAN","TIPIS"]
  },
  {
    topic: "PELANGI",
    words: ["LANGIT","WARNA","HUJAN","INDAH","MERAH","TUJUH"]
  },
  {
    topic: "ANAK",
    words: ["BERMAIN","SEKOLAH","REMAJA","MAINAN","KECIL","BAYI"]
  },
  {
    topic: "BAYI",
    words: ["MERANGKAK","MENANGIS","KECIL","POPOK","TIDUR","LAHIR"]
  },
  {
    topic: "KURSI",
    words: ["SANDARAN","KANTOR","DUDUK","LIPAT","MEJA","KAYU"]
  },
  {
    topic: "SAPI",
    words: ["PETERNAK","KANDANG","DAGING","TANDUK","RUMPUT","SUSU"]
  },
  {
    topic: "AYAM",
    words: ["JENGGER","DAGING","TELUR","PARUH","SAYAP","BULU"]
  },
  {
    topic: "IKAN",
    words: ["AKUARIUM","SUNGAI","DAGING","SIRIP","SISIK","EKOR"]
  },
  {
    topic: "JERUK",
    words: ["VITAMIN","MASAM","MANIS","KULIT","POHON","BUAH"]
  },
  {
    topic: "PISANG",
    words: ["KUNING","GORENG","TANDAN","MONYET","MANIS","KULIT"]
  },
  {
    topic: "MANGGA",
    words: ["KUNING","MANIS","MASAM","HIJAU","POHON","BUAH"]
  },
  {
    topic: "NASI",
    words: ["GORENG","PUTIH","SAYUR","BERAS","KUKUS","BUBUR"]
  },
  {
    topic: "ROTI",
    words: ["PANGGANG","MENTEGA","TEPUNG","PUTIH","SELAI","TAWAR"]
  },
  {
    topic: "SUSU",
    words: ["KALSIUM","PUTIH","MINUM","SEHAT","BUBUK","SAPI"]
  },
  {
    topic: "TEH",
    words: ["MINUMAN","HIJAU","PANAS","MANIS","GELAS","POCI"]
  },
  {
    topic: "GULA",
    words: ["DIABETES","KRISTAL","MANIS","PUTIH","PASIR","MERAH"]
  },
  {
    topic: "GARAM",
    words: ["MAKANAN","KRISTAL","YODIUM","PUTIH","HALUS","KASAR"]
  },
  {
    topic: "SAMBAL",
    words: ["BAWANG","TERASI","PEDAS","MERAH","CABAI","GARAM"]
  },
  {
    topic: "BAKSO",
    words: ["GEROBAK","DAGING","KUAH","BOLA","SAPI","TAHU"]
  },
  {
    topic: "SATE",
    words: ["KAMBING","LONTONG","DAGING","KACANG","TUSUK","BUMBU"]
  },
  {
    topic: "RENDANG",
    words: ["MASAKAN","DAGING","SANTAN","PADANG","BUMBU","SAPI"]
  },
  {
    topic: "SEPEDA",
    words: ["RANTAI","PEDAL","SADEL","STANG","KAYUH","RODA"]
  },
  {
    topic: "MOTOR",
    words: ["KENDARAAN","KNALPOT","BENSIN","MESIN","SPION","RODA"]
  },
  {
    topic: "KERETA",
    words: ["PERJALANAN","LOKOMOTIF","PENUMPANG","STASIUN","GERBONG","BARANG"]
  },
  {
    topic: "KAPAL",
    words: ["PELABUHAN","JANGKAR","NAHKODA","KEMUDI","PERAHU","LAYAR"]
  },
  {
    topic: "DANAU",
    words: ["PEMANDANGAN","PERAHU","TENANG","WISATA","SEJUK","IKAN"]
  },
  {
    topic: "LEMBAH",
    words: ["PEMANDANGAN","HAMPARAN","GUNUNG","SUNGAI","HIJAU","SAWAH"]
  },
  {
    topic: "JEMBATAN",
    words: ["KENDARAAN","SUNGAI","JALAN","BETON","TIANG","BESI"]
  },
  {
    topic: "GEDUNG",
    words: ["APARTEMEN","JENDELA","TINGGI","KANTOR","LANTAI","PINTU"]
  },
  {
    topic: "UNIVERSITAS",
    words: ["PERPUSTAKAAN","LABORATORIUM","MAHASISWA","FAKULTAS","KAMPUS","KULIAH"]
  },
  {
    topic: "KLINIK",
    words: ["PERAWAT","PERIKSA","DOKTER","PASIEN","APOTEK","SUNTIK"]
  },
  {
    topic: "GITAR",
    words: ["AKUSTIK","LISTRIK","SENAR","PETIK","BADAN","LEHER"]
  },
  {
    topic: "PIANO",
    words: ["KLASIK","HITAM","PUTIH","PEDAL","TUTS","NADA"]
  },
  {
    topic: "BIOLA",
    words: ["ORKESTRA","KONSER","MELODI","SENAR","BUSUR","NADA"]
  },
  {
    topic: "DRUM",
    words: ["GENDANG","REBANA","BEDUG","IRAMA","RITME","STIK"]
  },
  {
    topic: "RENANG",
    words: ["PELAMPUNG","PUNGGUNG","KACAMATA","KOLAM","BEBAS","GAYA"]
  },
  {
    topic: "TENIS",
    words: ["LAPANGAN","TURNAMEN","SERVIS","RAKET","GANDA","BOLA"]
  },
  {
    topic: "CATUR",
    words: ["LANGKAH","PAPAN","BIDAK","HITAM","PUTIH","RAJA"]
  },
  {
    topic: "FILM",
    words: ["SUTRADARA","BIOSKOP","POPCORN","CERITA","ADEGAN","KAMERA"]
  },
  {
    topic: "TELEVISI",
    words: ["KELUARGA","SALURAN","HIBURAN","REMOTE","BERITA","ACARA"]
  },
  {
    topic: "RADIO",
    words: ["FREKUENSI","STASIUN","PENYIAR","BERITA","ANTENA","VOLUME"]
  },
  {
    topic: "KORAN",
    words: ["HALAMAN","BERITA","TERBIT","EDISI","KOLOM","IKLAN"]
  },
  {
    topic: "PIRING",
    words: ["MANGKUK","SENDOK","GARPU","PISAU","GELAS","PECAH"]
  },
  {
    topic: "SENDOK",
    words: ["PLASTIK","PIRING","MAKAN","GARPU","PISAU","GELAS"]
  },
  {
    topic: "GARPU",
    words: ["SENDOK","PIRING","DAGING","PISAU","SAYUR","NASI"]
  },
  {
    topic: "PISAU",
    words: ["DAGING","PIRING","SENDOK","SAYUR","GARPU","TAJAM"]
  },
  {
    topic: "BOTOL",
    words: ["PLASTIK","MINYAK","MINUM","TUTUP","LEHER","SODA"]
  },
  {
    topic: "CANGKIR",
    words: ["PIRING","GAGANG","MINUM","PECAH","KECIL","KOPI"]
  },
  {
    topic: "PANCI",
    words: ["ALUMINIUM","DAGING","KOMPOR","SAYUR","TUTUP","PANAS"]
  },
  {
    topic: "WAJAN",
    words: ["MINYAK","DAGING","KOMPOR","TEFLON","SAYUR","SUTIL"]
  },
  {
    topic: "KULKAS",
    words: ["MAKANAN","MINUMAN","LISTRIK","DINGIN","SAYUR","PINTU"]
  },
  {
    topic: "MEJA",
    words: ["BELAJAR","PENSIL","KERTAS","KURSI","RUANG","KAKI"]
  },
  {
    topic: "LEMARI",
    words: ["GANTUNGAN","PAKAIAN","CELANA","PINTU","BAJU","KAYU"]
  },
  {
    topic: "RAK",
    words: ["PIRING","SEPATU","BARANG","GELAS","BUKU","KAYU"]
  },
  {
    topic: "KARPET",
    words: ["PERMADANI","LANTAI","BERSIH","RUANG","ALAS","BULU"]
  },
  {
    topic: "BANTAL",
    words: ["SELIMUT","GULING","SARUNG","KEPALA","TIDUR","KASUR"]
  },
  {
    topic: "GULING",
    words: ["PANJANG","BANTAL","SARUNG","KASUR","TIDUR","PELUK"]
  },
  {
    topic: "KASUR",
    words: ["SELIMUT","BANTAL","GULING","TIDUR","SPREI","EMPUK"]
  },
  {
    topic: "SELIMUT",
    words: ["DINGIN","BANTAL","HANGAT","TIDUR","KASUR","KAPAS"]
  },
  {
    topic: "SPREI",
    words: ["RANJANG","BERSIH","KASUR","TIDUR","PUTIH","KATUN"]
  },
  {
    topic: "BAJU",
    words: ["KANCING","CELANA","KEMEJA","LENGAN","JAKET","LEHER"]
  },
  {
    topic: "CELANA",
    words: ["PANJANG","PENDEK","JAKET","SABUK","BAJU","KAOS"]
  },
  {
    topic: "ROK",
    words: ["PINGGANG","PANJANG","CELANA","PENDEK","WANITA","LIPIT"]
  },
  {
    topic: "KAOS",
    words: ["CELANA","LENGAN","SABLON","KATUN","LEHER","BAJU"]
  },
  {
    topic: "JAKET",
    words: ["RESLETING","KANCING","DINGIN","HANGAT","HUJAN","KULIT"]
  },
  {
    topic: "TOPI",
    words: ["PELINDUNG","PINGGIRAN","MATAHARI","KEPALA","HUJAN","KAIN"]
  },
  {
    topic: "SANDAL",
    words: ["SEPATU","PANTAI","SANTAI","JEPIT","KARET","RUMAH"]
  },
  {
    topic: "TAS",
    words: ["SELEMPANG","BARANG","RANSEL","DOMPET","TANGAN","KOPER"]
  },
  {
    topic: "KOPER",
    words: ["PERJALANAN","LIBURAN","BARANG","RANSEL","GAGANG","BESAR"]
  },
  {
    topic: "PAYUNG",
    words: ["MATAHARI","TONGKAT","HUJAN","PANAS","BASAH","ANGIN"]
  },
  {
    topic: "SIKAT",
    words: ["RAMBUT","GOSOK","SABUN","SISIR","GIGI","BULU"]
  },
  {
    topic: "CERMIN",
    words: ["BAYANGAN","DINDING","RETAK","BESAR","KECIL","MUKA"]
  },
  {
    topic: "SABUN",
    words: ["TANGAN","BATANG","MANDI","WANGI","CUCI","MUKA"]
  },
  {
    topic: "SAMPO",
    words: ["RAMBUT","WANGI","BOTOL","BASAH","CUCI","BUSA"]
  },
  {
    topic: "HANDUK",
    words: ["GANTUNG","KERING","MANDI","BASAH","BADAN","KAIN"]
  },
  {
    topic: "GUNTING",
    words: ["PAKAIAN","POTONG","KERTAS","RAMBUT","TAJAM","BESI"]
  },
  {
    topic: "PENGGARIS",
    words: ["SENTIMETER","PANJANG","SEKOLAH","ANGKA","GARIS","LURUS"]
  },
  {
    topic: "PENSIL",
    words: ["PENGHAPUS","KERTAS","RAUTAN","GRAFIT","TULIS","KAYU"]
  },
  {
    topic: "LEM",
    words: ["PEREKAT","KERTAS","KENTAL","KAYU","KACA","CAIR"]
  },
  {
    topic: "KUDA",
    words: ["TUNGGANG","KANDANG","PACUAN","PELANA","RUMPUT","JOKI"]
  },
  {
    topic: "GAJAH",
    words: ["BINATANG","BELALAI","TELINGA","GADING","AFRIKA","SIRKUS"]
  },
  {
    topic: "HARIMAU",
    words: ["BINATANG","PREDATOR","BELANG","TARING","CAKAR","HUTAN"]
  },
  {
    topic: "KAMBING",
    words: ["PETERNAKAN","JENGGOT","KANDANG","JANTAN","BETINA","DAGING"]
  },
  {
    topic: "BEBEK",
    words: ["BERENANG","DAGING","PARUH","SAYAP","TELUR","DANAU"]
  },
  {
    topic: "KELINCI",
    words: ["TELINGA","KANDANG","LOMPAT","WORTEL","RUMPUT","EKOR"]
  },
  {
    topic: "SEMUT",
    words: ["SERANGGA","MAKANAN","ANTENA","KOLONI","KECIL","HITAM"]
  },
  {
    topic: "LEBAH",
    words: ["SERANGGA","SENGAT","KUNING","SARANG","HITAM","SAYAP"]
  },
  {
    topic: "NYAMUK",
    words: ["SERANGGA","MALARIA","TERBANG","DENGUNG","DEMAM","GIGIT"]
  },
  {
    topic: "SAWAH",
    words: ["PETANI","KERBAU","HIJAU","PANEN","BAJAK","LAHAN"]
  },
  {
    topic: "KEBUN",
    words: ["TANAMAN","GEMBUR","SAYUR","POHON","BUNGA","TAMAN"]
  },
  {
    topic: "BUKIT",
    words: ["PEMANDANGAN","TANJAKAN","TINGGI","GUNUNG","LERENG","PUNCAK"]
  },
  {
    topic: "SALJU",
    words: ["PEGUNUNGAN","KRISTAL","LONGSOR","DINGIN","PUNCAK","PUTIH"]
  },
  {
    topic: "BADAI",
    words: ["MENAKUTKAN","GELOMBANG","TAUFAN","BANJIR","ANGIN","HUJAN"]
  },
  {
    topic: "BANJIR",
    words: ["KERUSAKAN","GENANGAN","EVAKUASI","RENDAMAN","BENCANA","SUNGAI"]
  },
  {
    topic: "MUSIM",
    words: ["KEMARAU","PAKAIAN","DINGIN","PANAS","HUJAN","GUGUR"]
  },
  {
    topic: "LARI",
    words: ["KECEPATAN","OLAHRAGA","MARATHON","STAMINA","SEPATU","SPRINT"]
  },
  {
    topic: "VOLI",
    words: ["KOMPETISI","LAPANGAN","PELATIH","SERVIS","PEMAIN","SMASH"]
  },
  {
    topic: "GOLF",
    words: ["LAPANGAN","TURNAMEN","LUBANG","PEMAIN","CADDY","BOLA"]
  },
  {
    topic: "DOKTER",
    words: ["STETOSKOP","SPESIALIS","PERIKSA","PASIEN","KLINIK","RESEP"]
  },
  {
    topic: "GURU",
    words: ["PELAJARAN","SEKOLAH","SPIDOL","RAPORT","MURID","KELAS"]
  },
  {
    topic: "NELAYAN",
    words: ["PELABUHAN","TANGKAPAN","PANCING","PERAHU","JARING","OMBAK"]
  },
  {
    topic: "KOKI",
    words: ["RESTORAN","MASAKAN","MAKANAN","DAPUR","RESEP","PANCI"]
  },
  {
    topic: "PERAWAT",
    words: ["SERAGAM","PERIKSA","PASIEN","SUNTIK","KLINIK","JARUM"]
  },
  {
    topic: "KAFE",
    words: ["NONGKRONG","INTERNET","MINUMAN","LAPTOP","KURSI","MUSIK"]
  },
  {
    topic: "MASJID",
    words: ["SAJADAH","KHOTBAH","MUSLIM","SHOLAT","MENARA","MUSHAF"]
  },
  {
    topic: "GEREJA",
    words: ["KATEDRAL","KRISTEN","PENDETA","ALKITAB","LONCENG","SALIB"]
  },
  {
    topic: "MIE",
    words: ["MANGKUK","GORENG","PIRING","SAJIAN","BAKMI","REBUS"]
  },
  {
    topic: "TEMPE",
    words: ["INDONESIA","KEDELAI","PROTEIN","MAKANAN","GORENG","KACANG"]
  },
  {
    topic: "KEBUGARAN",
    words: ["OLAHRAGA","PROTEIN","KALORI","LEMAK","BERAT","DIET"]
  },
  {
    topic: "CAMILAN",
    words: ["KERIPIK","BISKUIT","COKELAT","POPCORN","PERMEN","ROTI"]
  },
  {
    topic: "JUS",
    words: ["MANGGA","WORTEL","JERUK","SEGAR","BUAH","APEL"]
  },
  {
    topic: "KACANG",
    words: ["PANGGANG","GORENG","MENTAH","KULIT","REBUS","SELAI"]
  },
  {
    topic: "KENDARAAN",
    words: ["SEPEDA","ANGKOT","KERETA","MOBIL","MOTOR","BECAK"]
  },
  {
    topic: "IKLIM",
    words: ["DINGIN","KERING","LEMBAB","TROPIS","CUACA","MUSIM"]
  },
  {
    topic: "LAGU",
    words: ["NYANYIAN","PENYANYI","DANGDUT","MELODI","MUSIK","IRAMA"]
  },
  {
    topic: "PEKERJAAN",
    words: ["WAWANCARA","PROFESI","KANTOR","KARIER","RESUME","TUGAS"]
  },
  {
    topic: "PERMAINAN",
    words: ["KELERENG","LAYANGAN","BONEKA","PUZZLE","MAINAN","KARTU"]
  },
  {
    topic: "HOBI",
    words: ["FOTOGRAFI","PERMAINAN","OLAHRAGA","LUKISAN","TULISAN","MASAKAN"]
  },
  {
    topic: "WISATA",
    words: ["PERJALANAN","LIBURAN","PANTAI","GUNUNG","MUSEUM","TAMAN"]
  },
  {
    topic: "NEGARA",
    words: ["PEMERINTAH","PRESIDEN","IBUKOTA","BENDERA","WILAYAH","BAHASA"]
  },
  {
    topic: "TOKO",
    words: ["KONSUMEN","BELANJA","PENJUAL","KANTONG","BARANG","DISKON"]
  },
  {
    topic: "SAUDARA",
    words: ["KELUARGA","SEPUPU","KAKAK","KAKEK","NENEK","PAMAN"]
  },
  {
    topic: "REKAN",
    words: ["KARYAWAN","SEJAWAT","PARTNER","KOLEGA","KANTOR","PROYEK"]
  },
  {
    topic: "PERSAHABATAN",
    words: ["NONGKRONG","KENANGAN","CURHAT","TEMAN","BANTU","MAKAN"]
  },
  {
    topic: "CORAK",
    words: ["BENTUK","MOTIF","GARIS","WARNA","BATIK","TENUN"]
  },
  {
    topic: "HITUNG",
    words: ["KALKULATOR","MATEMATIKA","JAWABAN","TAMBAH","KURANG","ANGKA"]
  },
  {
    topic: "KALENDER",
    words: ["TANGGAL","MINGGU","JADWAL","BULAN","TAHUN","LIBUR"]
  },
  {
    topic: "PERTANDINGAN",
    words: ["BULUTANGKIS","SEPAKBOLA","OLAHRAGA","SUPORTER","LAPANGAN","PEMAIN"]
  },
  {
    topic: "GADO-GADO",
    words: ["LONTONG","KERUPUK","KACANG","BETAWI","SAYUR","TELUR"]
  },
  {
    topic: "TUMPENG",
    words: ["SYUKURAN","KERUCUT","KUNING","KUNYIT","MERIAH","LAUK"]
  },
  {
    topic: "LONTONG",
    words: ["KENYAL","PADAT","SAYUR","GULAI","DAUN","SATE"]
  },
  {
    topic: "TIMBEL",
    words: ["SUNDA","LALAP","DAUN","LAUK","NASI","TAHU"]
  },
  {
    topic: "KLEPON",
    words: ["KELAPA","KENYAL","HIJAU","MANIS","BULAT","AREN"]
  },
  {
    topic: "ONDE-ONDE",
    words: ["KACANG","GORENG","RENYAH","WIJEN","BULAT","MANIS"]
  },
  {
    topic: "GETUK",
    words: ["TRADISIONAL","SINGKONG","LEMBUT","KELAPA","TUMBUK","MANIS"]
  },
  {
    topic: "SERABI",
    words: ["SANTAN","GURIH","MANIS","PANAS","SOLO","KUAH"]
  },
  {
    topic: "BIKA",
    words: ["BERSERAT","PANGGANG","KENYAL","KUNING","MEDAN","MANIS"]
  },
  {
    topic: "BINGKA",
    words: ["KALIMANTAN","PANGGANG","KENTANG","LEMBUT","KUNING","MANIS"]
  },
  {
    topic: "CENDOL",
    words: ["SANTAN","NANGKA","KENYAL","HIJAU","SEGAR","MANIS"]
  },
  {
    topic: "DOGER",
    words: ["BANDUNG","KELAPA","MANIS","KETAN","SEGAR","SUSU"]
  },
  {
    topic: "RUJAK",
    words: ["KACANG","PETIS","PEDAS","SEGAR","BUAH","ULEK"]
  },
  {
    topic: "ASINAN",
    words: ["RENYAH","BOGOR","PEDAS","SEGAR","CUKA","BUAH"]
  },
  {
    topic: "LEMPER",
    words: ["JAJANAN","KETAN","KUKUS","GURIH","AYAM","DAUN"]
  },
  {
    topic: "JAMU",
    words: ["TRADISIONAL","GENDONG","REMPAH","HERBAL","SEHAT","PAHIT"]
  },
  {
    topic: "BAJIGUR",
    words: ["HANGAT","SANTAN","SUNDA","MALAM","AREN","JAHE"]
  },
  {
    topic: "BANDREK",
    words: ["HANGAT","REMPAH","MALAM","SUNDA","MANIS","JAHE"]
  },
  {
    topic: "SEKOTENG",
    words: ["HANGAT","KACANG","MALAM","MANIS","JAHE","ROTI"]
  },
  {
    topic: "CINCAU",
    words: ["KENYAL","DINGIN","HITAM","MANIS","SEGAR","DAUN"]
  },
  {
    topic: "LUPIS",
    words: ["SEGITIGA","KELAPA","KENYAL","KETAN","MANIS","AREN"]
  },
  {
    topic: "CENIL",
    words: ["TAPIOKA","JAJANAN","KENYAL","KELAPA","MANIS","WARNA"]
  },
  {
    topic: "NAGASARI",
    words: ["PISANG","SANTAN","LEMBUT","KUKUS","MANIS","DAUN"]
  },
  {
    topic: "GORENGAN",
    words: ["CAMILAN","RENYAH","HANGAT","MINYAK","TEMPE","TAHU"]
  },
  {
    topic: "MENDOAN",
    words: ["BANYUMAS","GORENG","GURIH","HANGAT","TEMPE","TIPIS"]
  },
  {
    topic: "DUKU",
    words: ["MANIS","KECIL","BULAT","SEGAR","KULIT","BIJI"]
  },
  {
    topic: "BELIMBING",
    words: ["BINTANG","KUNING","SEGAR","POHON","RUSUK","ASAM"]
  },
  {
    topic: "MARKISA",
    words: ["WANGI","KUNING","SEGAR","ASAM","BIJI","UNGU"]
  },
  {
    topic: "KEDONDONG",
    words: ["RENYAH","RUJAK","HIJAU","SEGAR","KERAS","ASAM"]
  },
  {
    topic: "MENTENG",
    words: ["LANGKA","KECIL","SEGAR","BULAT","KULIT","ASAM"]
  },
  {
    topic: "MATOA",
    words: ["KENYAL","LANGKA","COKLAT","MANIS","PAPUA","BIJI"]
  },
  {
    topic: "BENGKOANG",
    words: ["RENYAH","MANIS","PUTIH","RUJAK","SEGAR","BULAT"]
  },
  {
    topic: "SUKUN",
    words: ["KERIPIK","GORENG","LEMBUT","MANIS","BESAR","BUAH"]
  },
  {
    topic: "TERONG",
    words: ["BALADO","LEMBUT","GORENG","LALAP","SAYUR","UNGU"]
  },
  {
    topic: "WORTEL",
    words: ["KELINCI","PANJANG","ORANYE","MANIS","SEHAT","MATA"]
  },
  {
    topic: "BUNCIS",
    words: ["PANJANG","RUNCING","RENYAH","HIJAU","TUMIS","SAYUR"]
  },
  {
    topic: "SAWI",
    words: ["LEMBUT","HIJAU","TUMIS","SEGAR","SAYUR","BAKSO"]
  },
  {
    topic: "BAYAM",
    words: ["LEMBUT","BENING","POPEYE","HIJAU","SEHAT","TUMIS"]
  },
  {
    topic: "KOL",
    words: ["BERLAPIS","RENYAH","SIOMAY","BULAT","SAYUR","PUTIH"]
  },
  {
    topic: "PARE",
    words: ["KERIPIK","LONJONG","PAHIT","HIJAU","SEHAT","TUMIS"]
  },
  {
    topic: "LABU",
    words: ["KUNING","LEMBUT","BESAR","SAYUR","MANIS","KOLAK"]
  },
  {
    topic: "TIMUN",
    words: ["RENYAH","DINGIN","SEGAR","HIJAU","LALAP","ACAR"]
  },
  {
    topic: "TOMAT",
    words: ["SAMBAL","MERAH","SEGAR","MASAK","BULAT","ASAM"]
  },
  {
    topic: "PETAI",
    words: ["SAMBAL","GORENG","GURIH","HIJAU","PAPAN","KHAS"]
  },
  {
    topic: "JENGKOL",
    words: ["RENDANG","BALADO","SEMUR","KERAS","BULAT","KHAS"]
  },
  {
    topic: "JERAPAH",
    words: ["TINGGI","AFRIKA","KUNING","LEHER","TOTOL","DAUN"]
  },
  {
    topic: "ZEBRA",
    words: ["LORENG","AFRIKA","RUMPUT","HITAM","KUDA","LIAR"]
  },
  {
    topic: "PANDA",
    words: ["BAMBU","GEMUK","HITAM","PUTIH","CINA","LUCU"]
  },
  {
    topic: "KOALA",
    words: ["EUKALIPTUS","AUSTRALIA","MAMALIA","MALAS","POHON","LUCU"]
  },
  {
    topic: "BERUANG",
    words: ["BESAR","HUTAN","CAKAR","MADU","BULU","LIAR"]
  },
  {
    topic: "SERIGALA",
    words: ["KAWANAN","LOLONG","MALAM","TAJAM","LIAR","BULU"]
  },
  {
    topic: "RUBAH",
    words: ["CERDAS","LICIK","HUTAN","MALAM","EKOR","BULU"]
  },
  {
    topic: "KOMODO",
    words: ["LANGKA","BESAR","KADAL","PULAU","PURBA","LIAR"]
  },
  {
    topic: "BUAYA",
    words: ["BERBAHAYA","SUNGAI","KULIT","MUARA","GIGI","RAWA"]
  },
  {
    topic: "KURA-KURA",
    words: ["CANGKANG","PANJANG","LAMBAT","REPTIL","HIJAU","KERAS"]
  },
  {
    topic: "KATAK",
    words: ["KECEBONG","LOMPAT","LEMBAB","SAWAH","HIJAU","SUARA"]
  },
  {
    topic: "CICAK",
    words: ["DINDING","CEKATAN","NYAMUK","KECIL","MALAM","EKOR"]
  },
  {
    topic: "TOKEK",
    words: ["DINDING","BESAR","SUARA","MALAM","TOTOL","GALAK"]
  },
  {
    topic: "LABA-LABA",
    words: ["DELAPAN","JARING","KECIL","SUDUT","SERAM","KAKI"]
  },
  {
    topic: "KUPU-KUPU",
    words: ["TERBANG","INDAH","SAYAP","BUNGA","WARNA","ULAT"]
  },
  {
    topic: "BELALANG",
    words: ["BERISIK","LOMPAT","HIJAU","SAWAH","KECIL","KAKI"]
  },
  {
    topic: "CAPUNG",
    words: ["TERBANG","RAMPING","HINGGAP","SAYAP","CEPAT","MATA"]
  },
  {
    topic: "KEPITING",
    words: ["CAPIT","MERAH","KERAS","JALAN","LAUT","SAUS"]
  },
  {
    topic: "CUMI",
    words: ["KENYAL","GORENG","LENTUR","TINTA","PUTIH","LAUT"]
  },
  {
    topic: "GURITA",
    words: ["TENTAKEL","DELAPAN","CERDAS","LENTUR","TINTA","LAUT"]
  },
  {
    topic: "PAUS",
    words: ["SEMBURAN","MAMALIA","RAKSASA","BESAR","LAUT","BIRU"]
  },
  {
    topic: "LUMBA-LUMBA",
    words: ["BERSAHABAT","MAMALIA","CERDAS","LOMPAT","SIRIP","LAUT"]
  },
  {
    topic: "HIU",
    words: ["BERBAHAYA","PEMANGSA","SIRIP","GANAS","GIGI","LAUT"]
  },
  {
    topic: "DOMBA",
    words: ["RUMPUT","TERNAK","DAGING","PUTIH","LUCU","BULU"]
  },
  {
    topic: "UNTA",
    words: ["TINGGI","GURUN","PUNUK","PASIR","ARAB","KUAT"]
  },
  {
    topic: "BOROBUDUR",
    words: ["MAGELANG","SEJARAH","WISATA","CANDI","STUPA","BUDDHA"]
  },
  {
    topic: "PRAMBANAN",
    words: ["SEJARAH","TINGGI","WISATA","CANDI","HINDU","YOGYA"]
  },
  {
    topic: "BROMO",
    words: ["SUNRISE","GUNUNG","KAWAH","PASIR","TIMUR","JEEP"]
  },
  {
    topic: "RINJANI",
    words: ["MENDAKI","LOMBOK","TINGGI","GUNUNG","INDAH","DANAU"]
  },
  {
    topic: "WAIGEO",
    words: ["KARANG","PAPUA","PULAU","INDAH","LAUT","SELAM"]
  },
  {
    topic: "ULUWATU",
    words: ["SUNSET","TEBING","BALI","PURA","LAUT","SUCI"]
  },
  {
    topic: "MONAS",
    words: ["LAPANGAN","JAKARTA","TINGGI","TUGU","EMAS","IKON"]
  },
  {
    topic: "MALIOBORO",
    words: ["BELANJA","YOGYA","JALAN","BAKPIA","RAMAI","BATIK"]
  },
  {
    topic: "IJEN",
    words: ["BANYUWANGI","PENAMBANG","BELERANG","DINGIN","DANAU","BIRU"]
  },
  {
    topic: "DIENG",
    words: ["WONOSOBO","KENTANG","DATARAN","TELAGA","DINGIN","CANDI"]
  },
  {
    topic: "BUNAKEN",
    words: ["SNORKELING","MANADO","KARANG","TAMAN","LAUT","IKAN"]
  },
  {
    topic: "GILI",
    words: ["SNORKELING","LOMBOK","PANTAI","TENANG","SEPEDA","SENJA"]
  },
  {
    topic: "JAM GADANG",
    words: ["BUKITTINGGI","MENARA","LONCENG","SUMBAR","TINGGI","IKON"]
  },
  {
    topic: "FATAHILLAH",
    words: ["KOLONIAL","JAKARTA","SEJARAH","BATAVIA","MUSEUM","KOTA"]
  },
  {
    topic: "TMII",
    words: ["ANJUNGAN","MINIATUR","KELUARGA","JAKARTA","BUDAYA","LUAS"]
  },
  {
    topic: "ARSITEK",
    words: ["BANGUNAN","RANCANG","KREATIF","DESAIN","GEDUNG","GAMBAR"]
  },
  {
    topic: "AKUNTAN",
    words: ["KALKULATOR","KEUANGAN","LAPORAN","TELITI","ANGKA","PAJAK"]
  },
  {
    topic: "PENGACARA",
    words: ["PENGADILAN","ARGUMEN","SIDANG","HUKUM","KLIEN","PASAL"]
  },
  {
    topic: "WARTAWAN",
    words: ["LIPUTAN","CATATAN","BERITA","KAMERA","KORAN","CEPAT"]
  },
  {
    topic: "FOTOGRAFER",
    words: ["KAMERA","JEPRET","STUDIO","LENSA","MOMEN","FLASH"]
  },
  {
    topic: "PROGRAMMER",
    words: ["APLIKASI","LAPTOP","LOGIKA","KODING","LEMBUR","KODE"]
  },
  {
    topic: "BARISTA",
    words: ["AROMA","SEDUH","LATTE","KOPI","KAFE","SUSU"]
  },
  {
    topic: "PRAMUGARI",
    words: ["PESAWAT","SERAGAM","TERBANG","SENYUM","RAMAH","KABIN"]
  },
  {
    topic: "MASINIS",
    words: ["LOKOMOTIF","SERAGAM","STASIUN","KONTROL","KERETA","JALUR"]
  },
  {
    topic: "BIDAN",
    words: ["LAHIRAN","RAMAH","SEHAT","BANTU","BAYI","DESA"]
  },
  {
    topic: "PSIKOLOG",
    words: ["KONSELING","PIKIRAN","CURHAT","TENANG","DENGAR","JIWA"]
  },
  {
    topic: "DOSEN",
    words: ["MAHASISWA","KULIAH","KAMPUS","MATERI","GELAR","KELAS"]
  },
  {
    topic: "PENULIS",
    words: ["IMAJINASI","NASKAH","CERITA","BUKU","KATA","PENA"]
  },
  {
    topic: "SUTRADARA",
    words: ["ADEGAN","NASKAH","ARAHAN","KAMERA","AKTOR","FILM"]
  },
  {
    topic: "PENYANYI",
    words: ["PANGGUNG","SUARA","VOKAL","MERDU","LAGU","FANS"]
  },
  {
    topic: "FUTSAL",
    words: ["LAPANGAN","KERINGAT","TENDANG","CEPAT","KIPER","BOLA"]
  },
  {
    topic: "SILAT",
    words: ["TRADISIONAL","INDONESIA","SERANG","JURUS","SABUK","KUAT"]
  },
  {
    topic: "KARATE",
    words: ["TENDANGAN","DISIPLIN","JEPANG","SABUK","PUTIH","KUAT"]
  },
  {
    topic: "BILIAR",
    words: ["LUBANG","FOKUS","HIJAU","BOLA","STIK","MEJA"]
  },
  {
    topic: "BOWLING",
    words: ["LEMPAR","SEPATU","STRIKE","JALUR","SKOR","BOLA"]
  },
  {
    topic: "SURFING",
    words: ["PANTAI","IMBANG","OMBAK","PAPAN","BALI","LAUT"]
  },
  {
    topic: "RAFTING",
    words: ["PELAMPUNG","SUNGAI","DAYUNG","DERAS","BASAH","SERU"]
  },
  {
    topic: "PARALAYANG",
    words: ["TERBANG","PARASUT","TINGGI","ANGIN","BUKIT","BEBAS"]
  },
  {
    topic: "TAKRAW",
    words: ["AKROBATIK","TENDANGAN","JARING","ROTAN","ASIA","BOLA"]
  },
  {
    topic: "TRIATLON",
    words: ["RENANG","SEPEDA","JARAK","LARI","KUAT","DAYA"]
  },
  {
    topic: "SKATEBOARD",
    words: ["JALANAN","LOMPAT","PAPAN","RODA","TRIK","GAYA"]
  },
  {
    topic: "PARKOUR",
    words: ["AKROBATIK","BANGUNAN","LOMPAT","BERANI","CEPAT","KOTA"]
  },
  {
    topic: "GAMELAN",
    words: ["TRADISIONAL","PERUNGGU","IRAMA","TABUH","JAWA","GONG"]
  },
  {
    topic: "ANGKLUNG",
    words: ["TRADISIONAL","GOYANG","BAMBU","SUNDA","MERDU","NADA"]
  },
  {
    topic: "SASANDO",
    words: ["PETIK","MERDU","ROTE","UNIK","DAUN","NUSA"]
  },
  {
    topic: "KOLINTANG",
    words: ["MINAHASA","SULAWESI","MELODI","PUKUL","KAYU","NADA"]
  },
  {
    topic: "SERULING",
    words: ["LUBANG","LEMBUT","BAMBU","MERDU","SUNDA","TIUP"]
  },
  {
    topic: "REBAB",
    words: ["TRADISIONAL","WAYANG","MELODI","GESEK","SENAR","JAWA"]
  },
  {
    topic: "TEROMPET",
    words: ["KUNINGAN","ORKESTRA","NYARING","KENCANG","PISTON","TIUP"]
  },
  {
    topic: "SAKSOFON",
    words: ["LENGKUNG","MELODI","TIUP","JAZZ","EMAS","NADA"]
  },
  {
    topic: "HARMONIKA",
    words: ["KECIL","BLUES","LOGAM","TIUP","SAKU","NADA"]
  },
  {
    topic: "UKULELE",
    words: ["HAWAII","KECIL","PETIK","CERIA","SENAR","GITAR"]
  },
  {
    topic: "KECAPI",
    words: ["TEMBANG","LEMBUT","PETIK","SUNDA","SENAR","KAYU"]
  },
  {
    topic: "TALEMPONG",
    words: ["MINANG","SUMBAR","PUKUL","KECIL","IRAMA","GONG"]
  },
  {
    topic: "DRONE",
    words: ["TERBANG","KAMERA","REMOTE","BALING","UDARA","VIDEO"]
  },
  {
    topic: "ROBOT",
    words: ["OTOMATIS","BATERAI","CERDAS","SENSOR","MESIN","LOGAM"]
  },
  {
    topic: "SMARTWATCH",
    words: ["NOTIFIKASI","DIGITAL","PINTAR","TANGAN","SEHAT","LAYAR"]
  },
  {
    topic: "TABLET",
    words: ["PORTABEL","BATERAI","GADGET","SENTUH","LAYAR","TIPIS"]
  },
  {
    topic: "PRINTER",
    words: ["DOKUMEN","KERTAS","KANTOR","CETAK","TINTA","MESIN"]
  },
  {
    topic: "PROYEKTOR",
    words: ["PRESENTASI","CAHAYA","GAMBAR","KELAS","BESAR","FILM"]
  },
  {
    topic: "HEADSET",
    words: ["TELINGA","MUSIK","AUDIO","KABEL","SUARA","GAME"]
  },
  {
    topic: "POWERBANK",
    words: ["SMARTPHONE","PORTABEL","BATERAI","PENGISI","DARURAT","KABEL"]
  },
  {
    topic: "WIFI",
    words: ["INTERNET","KONEKSI","ROUTER","SINYAL","GRATIS","CEPAT"]
  },
  {
    topic: "APLIKASI",
    words: ["PRAKTIS","DIGITAL","PONSEL","UNDUH","FITUR","IKON"]
  },
  {
    topic: "VIRUS",
    words: ["BERBAHAYA","ANTIVIRUS","KOMPUTER","SERANGAN","RUSAK","DATA"]
  },
  {
    topic: "PASSWORD",
    words: ["RAHASIA","LOGIN","INGAT","AMAN","AKUN","KODE"]
  },
  {
    topic: "JANTUNG",
    words: ["DARAH","DETAK","HIDUP","POMPA","DADA","KIRI"]
  },
  {
    topic: "OTAK",
    words: ["PIKIRAN","INGATAN","CERDAS","KEPALA","SARAF","KANAN"]
  },
  {
    topic: "TULANG",
    words: ["KALSIUM","RANGKA","SUMSUM","PUTIH","SENDI","KUAT"]
  },
  {
    topic: "OTOT",
    words: ["LATIHAN","LENGAN","GERAK","BESAR","KUAT","KRAM"]
  },
  {
    topic: "BAHU",
    words: ["LENGAN","KOKOH","PIJAT","LEBAR","SENDI","JAKET"]
  },
  {
    topic: "LUTUT",
    words: ["TEMPURUNG","TEKUK","SENDI","JATUH","SAKIT","KAKI"]
  },
  {
    topic: "DADA",
    words: ["JANTUNG","BIDANG","BUSUNG","NAPAS","DEBAR","OTOT"]
  },
  {
    topic: "PUNGGUNG",
    words: ["BELAKANG","SAKIT","PIJAT","BADAN","TEGAK","LEBAR"]
  },
  {
    topic: "KUKU",
    words: ["PANJANG","POTONG","CANTIK","KOTOR","KERAS","JARI"]
  },
  {
    topic: "ALIS",
    words: ["CANTIK","TEBAL","WAJAH","HITAM","MATA","RAPI"]
  },
  {
    topic: "KUMIS",
    words: ["WAJAH","TEBAL","CUKUR","HITAM","PRIA","LUCU"]
  },
  {
    topic: "DARAH",
    words: ["PEMBULUH","GOLONGAN","KENTAL","MERAH","DONOR","HIDUP"]
  },
  {
    topic: "PARU-PARU",
    words: ["OKSIGEN","BERSIH","NAPAS","UDARA","SEHAT","DADA"]
  },
  {
    topic: "LAMBUNG",
    words: ["MAKAN","PERUT","LAPAR","CERNA","MAAG","ASAM"]
  },
  {
    topic: "DEMAM",
    words: ["TERMOMETER","ISTIRAHAT","DINGIN","PANAS","OBAT","SUHU"]
  },
  {
    topic: "FLU",
    words: ["MENULAR","HIDUNG","PILEK","BATUK","VIRUS","TISU"]
  },
  {
    topic: "VAKSIN",
    words: ["SUNTIK","LENGAN","SEHAT","CEGAH","IMUN","ANAK"]
  },
  {
    topic: "OPERASI",
    words: ["STERIL","DOKTER","BEDAH","JAHIT","BIUS","MEJA"]
  },
  {
    topic: "INFUS",
    words: ["GANTUNG","CAIRAN","SELANG","TANGAN","LEMAS","TETES"]
  },
  {
    topic: "MASKER",
    words: ["HIDUNG","WAJAH","VIRUS","SEHAT","DEBU","KAIN"]
  },
  {
    topic: "VITAMIN",
    words: ["NUTRISI","ENERGI","SEHAT","TUBUH","CEGAH","BUAH"]
  },
  {
    topic: "STETOSKOP",
    words: ["JANTUNG","DOKTER","DENGAR","LEHER","DADA","ALAT"]
  },
  {
    topic: "PERBAN",
    words: ["ELASTIS","PUTIH","DARAH","BALUT","LUKA","KASA"]
  },
  {
    topic: "RONTGEN",
    words: ["TULANG","SINAR","GELAP","HASIL","FOTO","DADA"]
  },
  {
    topic: "WISUDA",
    words: ["BAHAGIA","KAMPUS","IJAZAH","TOGA","FOTO","TOPI"]
  },
  {
    topic: "BEASISWA",
    words: ["PRESTASI","BANTUAN","GRATIS","KULIAH","PINTAR","DAFTAR"]
  },
  {
    topic: "RAPOR",
    words: ["SEMESTER","NILAI","BAGUS","MERAH","GURU","BAGI"]
  },
  {
    topic: "KANTIN",
    words: ["ISTIRAHAT","GORENGAN","SEKOLAH","MAKAN","JAJAN","MURAH"]
  },
  {
    topic: "ASRAMA",
    words: ["TINGGAL","MANDIRI","ATURAN","KAMAR","TEMAN","MALAM"]
  },
  {
    topic: "SKRIPSI",
    words: ["PENELITIAN","MAHASISWA","SIDANG","REVISI","TEBAL","LULUS"]
  },
  {
    topic: "OSIS",
    words: ["ORGANISASI","PENGURUS","SEKOLAH","ACARA","SISWA","KETUA"]
  },
  {
    topic: "UPACARA",
    words: ["LAPANGAN","BENDERA","SERAGAM","PEMBINA","HORMAT","SENIN"]
  },
  {
    topic: "EKSKUL",
    words: ["SEKOLAH","LATIHAN","MINAT","BAKAT","SORE","KLUB"]
  },
  {
    topic: "KURBAN",
    words: ["SEMBELIH","DAGING","TAKBIR","SAPI","HAJI","BAGI"]
  },
  {
    topic: "NATAL",
    words: ["DESEMBER","KELUARGA","POHON","LILIN","DAMAI","KADO"]
  },
  {
    topic: "IMLEK",
    words: ["BARONGSAI","LAMPION","ANGPAO","MERAH","NAGA","CINA"]
  },
  {
    topic: "NYEPI",
    words: ["MEDITASI","HENING","HINDU","GELAP","TAHUN","BALI"]
  },
  {
    topic: "KEMERDEKAAN",
    words: ["AGUSTUS","MERDEKA","BENDERA","UPACARA","LOMBA","MERAH"]
  },
  {
    topic: "WAISAK",
    words: ["BOROBUDUR","PELITA","LILIN","CANDI","BUDDHA","SUCI"]
  },
  {
    topic: "MILAD",
    words: ["SELAMAT","SYUKUR","LILIN","KADO","USIA","TIUP"]
  },
  {
    topic: "PLANET",
    words: ["JUPITER","ORBIT","VENUS","BULAT","MARS","BUMI"]
  },
  {
    topic: "GALAKSI",
    words: ["BINTANG","RAKSASA","SPIRAL","CAHAYA","JAGAT","JAUH"]
  },
  {
    topic: "KOMET",
    words: ["LANGIT","JARANG","CAHAYA","EKOR","DEBU","BATU"]
  },
  {
    topic: "ASTRONOT",
    words: ["MELAYANG","ROKET","BULAN","TUGAS","BAJU","HELM"]
  },
  {
    topic: "ROKET",
    words: ["ANTARIKSA","TERBANG","LUNCUR","TINGGI","CEPAT","MESIN"]
  },
  {
    topic: "SATELIT",
    words: ["KOMUNIKASI","ANTARIKSA","SINYAL","SIARAN","ORBIT","BUMI"]
  },
  {
    topic: "TELESKOP",
    words: ["BINTANG","MELIHAT","LENSA","MALAM","BESAR","JAUH"]
  },
  {
    topic: "GERHANA",
    words: ["MATAHARI","BAYANGAN","LANGKA","BULAN","GELAP","SIANG"]
  },
  {
    topic: "METEOR",
    words: ["LANGIT","JATUH","KAWAH","MALAM","CEPAT","BATU"]
  },
  {
    topic: "SURYA",
    words: ["MATAHARI","PLANET","ORBIT","BESAR","PUSAT","BUMI"]
  },
  {
    topic: "COBEK",
    words: ["TRADISIONAL","SAMBAL","BUNDAR","DAPUR","ULEK","BATU"]
  },
  {
    topic: "TALENAN",
    words: ["PERSEGI","POTONG","DAPUR","PISAU","KAYU","ALAS"]
  },
  {
    topic: "BLENDER",
    words: ["LISTRIK","TABUNG","PUTAR","CEPAT","BUAH","KACA"]
  },
  {
    topic: "MAGICOM",
    words: ["OTOMATIS","LISTRIK","HANGAT","TOMBOL","DAPUR","NASI"]
  },
  {
    topic: "SUTIL",
    words: ["PANJANG","GORENG","WAJAN","DAPUR","KAYU","ADUK"]
  },
  {
    topic: "TERMOS",
    words: ["HANGAT","DINGIN","PANAS","TAHAN","TUTUP","BAJA"]
  },
  {
    topic: "EMBER",
    words: ["PLASTIK","TUMPAH","WADAH","SUMUR","TIMBA","CUCI"]
  },
  {
    topic: "SAPU",
    words: ["BERSIH","LANTAI","GAGANG","RUMAH","LIDI","DEBU"]
  },
  {
    topic: "SENTER",
    words: ["BATERAI","CAHAYA","TERANG","TANGAN","GELAP","MALAM"]
  },
  {
    topic: "LILIN",
    words: ["ROMANTIS","HANGAT","TERANG","MALAM","LELEH","SUMBU"]
  },
  {
    topic: "KOREK",
    words: ["PRAKTIS","KOTAK","KECIL","NYALA","PANAS","RODA"]
  },
  {
    topic: "GAYUNG",
    words: ["PLASTIK","GAGANG","MANDI","KAMAR","CIDUK","SIRAM"]
  },
  {
    topic: "MARTABAK",
    words: ["COKELAT","KACANG","GURIH","MANIS","TELUR","KEJU"]
  },
  {
    topic: "ES TELER",
    words: ["ALPUKAT","KELAPA","NANGKA","SANTAN","SEGAR","SIRUP"]
  }
];
