const fs = require('fs');

// 1. Generate 4-letter target words from ENG.json[0] and IDN.json[0]
const eng = JSON.parse(`[${fs.readFileSync('./wordlist/ENG.json', 'utf8').trim()}]`);
const idn = JSON.parse(`[${fs.readFileSync('./wordlist/IDN.json', 'utf8').trim()}]`);

const eng4 = eng[0].map(w => w.toLowerCase());
const idn4 = idn[0].map(w => w.toLowerCase());

fs.writeFileSync('./wordlist/target_words_4.txt', eng4.join('\n') + '\n');
fs.writeFileSync('./wordlist/target_words_id_4.txt', idn4.join('\n') + '\n');
console.log(`Saved target_words_4.txt (${eng4.length} words)`);
console.log(`Saved target_words_id_4.txt (${idn4.length} words)`);

// 2. Generate 3-letter target words
// Common English 3-letter words
const commonEng3 = [
  "ace","act","add","age","ago","aid","aim","air","all","and","any","ape","arm","art","ash","ask","ate","awe","axe",
  "bad","bag","ban","bar","bat","bay","bed","bee","beg","bet","big","bin","bit","boa","bob","bog","bow","box","boy","bud","bug","bun","bus","but","buy",
  "cab","can","cap","car","cat","caw","cop","cow","coy","cry","cub","cue","cup","cut",
  "dad","dam","day","den","dew","did","die","dig","dim","dip","dog","dot","dry","due","dug","dye",
  "ear","eat","egg","ego","elm","end","era","eve","eye",
  "fan","far","fat","fax","fed","fee","few","fib","fig","fin","fir","fit","fix","fly","fog","foe","for","fox","fun","fur",
  "gap","gas","gel","gem","get","gig","gin","god","got","gum","gun","gut","guy","gym",
  "had","ham","has","hat","hay","hen","her","hid","him","hip","his","hit","hog","hop","hot","how","hug","hut",
  "ice","icy","ill","ink","inn","ion","its","ivy",
  "jab","jam","jar","jaw","jay","jet","jew","job","jog","joy","jug",
  "keg","key","kid","kin","kit",
  "lab","lad","lag","lap","law","lay","led","leg","let","lid","lie","lip","lit","log","lot","low",
  "mad","man","map","mat","may","men","met","mix","mob","mom","mop","mud","mug",
  "nap","net","new","nod","not","now","nut",
  "oak","oar","odd","off","oil","old","one","opt","orb","ore","our","out","owe","owl","own",
  "pad","pan","pat","paw","pay","pea","peg","pen","pet","pew","pie","pig","pin","pit","pod","pop","pot","pro","pub","pun","pup","put",
  "rag","ram","ran","rat","raw","ray","red","rib","rid","rig","rim","rip","rob","rod","rot","row","rub","rug","run",
  "sad","sag","sap","sat","saw","sax","sea","see","set","sew","sex","she","shy","sin","sip","sir","sit","six","ski","sky","sly","sob","son","sow","soy","spa","spy","sub","sum","sun",
  "tab","tag","tan","tap","tar","tax","tea","ten","the","tie","tin","tip","toe","ton","top","toy","try","tub","two",
  "use",
  "van","vat","vet","via","vow",
  "wag","war","was","wax","way","web","wed","wet","who","why","wig","win","wit","woe","won","zep","zoo"
];

// Verify they exist in valid_words_3.txt
const validEng3 = new Set(fs.readFileSync('./wordlist/valid_words_3.txt', 'utf8').split('\n').map(w => w.trim().toLowerCase()));
const targetEng3 = commonEng3.filter(w => validEng3.has(w));
fs.writeFileSync('./wordlist/target_words_3.txt', targetEng3.join('\n') + '\n');
console.log(`Saved target_words_3.txt (${targetEng3.length} words)`);

// Common Indonesian 3-letter words
const commonIdn3 = [
  "aba","abu","ada","adi","adu","esa","aga","air","aja","aji","aku","ala","ali","alu","ama","ana","ani","anu","apa","api","ara","asa","ati","ayu","ayo",
  "bab","bak","bam","ban","bao","bar","bas","bat","bau","baut","bea","bel","beo","bes","bet","bia","biar","bid","big","bil","bim","bin","bio","bir","bis","bit","blu","bob","boc","bodi","bodo","bog","boi","bok","bol","bom","bon","bop","bor","bos","bot","bua","bub","bud","bue","bug","bui","buk","bul","bum","bun","bup","bur","bus","but",
  "cab","cai","cak","cal","cam","can","cap","car","cas","cat","cau","cek","cel","cen","ces","cet","cia","cik","cim","cip","cir","cis","cit","ciu","col","cor","cua","cue","cui","cuk","cum","cun","cup","cur","cus","cut","cuy",
  "dab","dad","dai","dak","dal","dam","dan","dao","dap","dar","das","dat","dau","dea","deh","dei","dek","del","dem","den","dep","des","dia","did","dik","dil","dim","din","dip","diu","doa","dob","doi","dok","dol","dom","dop","dor","dos","dot","dou","dra","dua","dub","duh","dui","duk","dum","dun","duo","dup","dur","dus","duw",
  "eda","edo","ego","eka","ela","elu","ema","emu","ena","eng","era","eri","esa","esi","eta","eva",
  "fai","fan","fas","fau","fea","fel","fit","flu","foi","fol","fon","fot",
  "gae","gah","gai","gak","gam","gan","gao","gap","gar","gas","gat","gau","gay","gel","gen","geo","gig","gim","gin","gir","goa","gob","gol","gor","got","gua","gue","guk","gul","gum","gun","guo","gup","gur","gus","gut",
  "hak","hal","ham","hao","hap","har","has","hei","hem","her","hin","his","hit","hiu","hok","hol","hop","hot","hua","hub","hud","huh","hui","hun","hus","hut",
  "iba","ibu","ida","ide","iga","ika","ilm","ilu","imf","ina","inc","ing","ini","iol","ipa","ira","iri","isa","isi","isu","ita","itu","iur","iya",
  "jab","jad","jah","jai","jak","jam","jan","jao","jap","jar","jas","jat","jau","jaw","jay","jeh","jek","jel","jem","jen","jep","jer","jet","jia","jil","jim","jin","jip","jir","joa","job","jod","jog","joi","jok","jol","jor","jos","jou","jua","jud","jug","jui","jum","jun","jus","jut",
  "kaa","kab","kac","kad","kae","kah","kai","kak","kal","kam","kan","kao","kap","kar","kas","kat","kau","kaw","kay","keb","kec","ked","keh","kei","kek","kel","kem","ken","keo","kep","ker","kes","ket","khl","khi","khs","kia","kid","kif","kih","kik","kil","kim","kin","kio","kip","kir","kis","kit","kiu","koa","kob","koc","kod","koe","kog","koh","koi","kok","kol","kom","kon","koo","kop","kor","kos","kot","kou","koy","kua","kub","kue","kuh","kui","kuk","kul","kum","kun","kup","kur","kus","kut","kuy",
  "lab","lad","lag","lah","lai","lak","lal","lam","lan","lao","lap","lar","las","lat","lau","law","lay","led","lee","leg","leh","lei","lek","lem","len","leo","lep","les","let","leu","lia","lid","lih","lii","lik","lil","lim","lin","lio","lip","lir","lis","liu","loa","lob","lod","log","loh","loi","loj","lok","lol","lom","lon","loo","lop","lor","los","lot","lou","low","loy","lua","lub","lue","luh","lui","luk","lul","lum","lun","luo","lup","lur","lus","lut",
  "maa","mab","mac","mad","mae","mag","mah","mai","mak","mal","mam","man","mao","map","mar","mas","mat","mau","maf","maw","may","mea","med","meg","meh","mei","mek","mel","mem","men","meo","mep","mer","mes","met","meu","mia","mid","mih","mii","mik","mil","mim","min","mio","mip","mir","mis","mit","miu","moa","mob","moc","mod","moe","mog","moh","moi","mok","mol","mom","mon","moo","mop","mor","mos","mot","mou","mow","moy","mua","mub","mud","mue","mug","muh","mui","muk","mul","mum","mun","muo","mup","mur","mus","mut",
  "nab","nad","nae","nah","nai","naj","nak","nal","nam","nan","nao","nap","nar","nas","nat","nau","naw","nay","neb","ned","nee","neh","nei","nek","nel","nem","nen","neo","nep","ner","nes","net","neu","nia","nib","nid","nih","nii","nik","nil","nim","nin","nip","nir","nis","nit","niu","nob","nod","noe","nog","noh","noi","nok","nol","nom","non","noo","nop","nor","nos","not","nou","now","noy","nua","nub","nue","nug","nui","nuj","nuk","nul","num","nun","nur","nus","nut",
  "oak","oar","oba","obg","obi","ode","ogo","oho","oka","oki","oko","oma","omg","omp","oms","ond","ong","ons","opa","opi","opo","ops","ora","ore","ori","ork","oro","ota","ote","oto","otk","oya",
  "paa","pab","pad","pae","paf","pah","pai","paj","pak","pal","pam","pan","pao","pap","par","pas","pat","pau","paw","pay","paz","peb","ped","pee","peg","peh","pei","pek","pel","pem","pen","peo","pep","per","pes","pet","peu","pew","pia","pib","pid","pie","pih","pii","pij","pik","pil","pim","pin","pio","pip","pir","pis","pit","piu","pla","plo","plu","poa","poh","poi","poj","pok","pol","pom","pon","poo","pop","por","pos","pot","pou","poy","pra","pro","pru","pua","pub","pud","pui","puk","pul","pum","pun","puo","pup","pur","pus","put",
  "qur",
  "rab","rac","rad","rae","raf","rag","rah","rai","raj","rak","ral","ram","ran","rao","rap","rar","ras","rat","rau","raw","ray","reb","rec","red","ree","ref","reg","reh","rei","rek","rel","rem","ren","reo","rep","rer","res","ret","reu","rex","rey","ria","rib","ric","rid","rif","rig","rih","rii","rij","rik","ril","rim","rin","rio","rip","rir","ris","rit","riu","roa","rob","roc","rod","roe","rog","roh","roi","roj","rok","rol","rom","ron","roo","rop","ror","ros","rot","rou","row","roy","rua","rub","rue","rug","ruh","rui","ruj","ruk","rul","rum","run","ruo","rup","rur","rus","rut",
  "saa","sab","sac","sad","sae","saf","sag","sah","sai","saj","sak","sal","sam","san","sao","sap","sar","sas","sat","sau","saw","say","seb","sec","sed","see","sef","seg","seh","sei","sej","sek","sel","sem","sen","seo","sep","ser","ses","set","seu","sew","sha","she","shi","sif","sig","sih","sii","sik","sil","sim","sin","sio","sip","sir","sis","sit","siu","siy","ska","ski","sky","sla","sma","soa","sob","soc","sod","soe","sof","sog","soh","soi","soj","sok","sol","som","son","soo","sop","sor","sos","sot","sou","soy","sua","sub","suf","sug","suh","sui","suj","suk","sul","sum","sun","suo","sup","sur","sus","sut",
  "taa","tab","tac","tad","tae","tag","tah","tai","taj","tak","tal","tam","tan","tao","tap","tar","tas","tat","tau","taw","tay","teb","tec","ted","tee","teg","teh","tei","tej","tek","tel","tem","ten","teo","tep","ter","tes","tet","teu","tew","tib","tic","tid","tie","tif","tig","tih","tii","tik","til","tim","tin","tio","tip","tir","tis","tit","tiu","toa","tob","toc","tod","toe","tof","tog","toh","toi","toj","tok","tol","tom","ton","too","top","tor","tos","tot","tou","tow","toy","tua","tub","tui","tuk","tul","tum","tun","tup","tur","tus","tut",
  "uak","uan","uap","uba","ubi","uda","udu","ui","uil","uja","uji","ukm","ukm","ula","uli","ulu","uma","umi","ump","umu","una","und","ung","uni","unt","unp","upa","upk","upr","upu","ura","ure","uri","usa","usi","usm","uso","usu","uta","utd","ute","uti","uto","utu",
  "van","vas","via","vii","vil","vin","vip","vis","voc","vom","von",
  "waa","wah","wai","wak","wal","wan","wao","wap","war","was","wat","wau","way","web","wei","wel","wen","weo","wes","wib","wid","wig","win","wip","wir","wis","wit","wku","woh","wok","won","wor","wot","wow","wua","wud","wuh","wui","wuk","wul","wur","wut",
  "yad","yah","yak","yam","yan","yao","yap","yar","yas","yat","yaq","yek","yel","yen","yep","yes","yey","yih","yiu","ylb","yms","yoh","yoi","yok","yos","you","yuk","yun","yup",
  "zab","zad","zah","zai","zak","zam","zan","zap","zar","zat","zei","zen","ziA","zik","zil","zim","zin","zip","zir","zoe","zoh","zon","zoo","zul","zum","zun"
];

const validIdn3 = new Set(fs.readFileSync('./wordlist/valid_words_id_3.txt', 'utf8').split('\n').map(w => w.trim().toLowerCase()));
const targetIdn3 = commonIdn3.filter(w => validIdn3.has(w));
fs.writeFileSync('./wordlist/target_words_id_3.txt', targetIdn3.join('\n') + '\n');
console.log(`Saved target_words_id_3.txt (${targetIdn3.length} words)`);
