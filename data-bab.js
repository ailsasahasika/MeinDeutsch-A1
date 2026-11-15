/* Mein Deutsch A1 – data-bab.js
   Materi 12 bab: penjelasan, 20 kosakata per bab, contoh, kuis, pendalaman. */
/* cadangan untuk browser lama */
if(!Array.prototype.flat)Object.defineProperty(Array.prototype,"flat",{configurable:true,writable:true,value:function(d){d=d===undefined?1:d;return this.reduce(function(a,x){return a.concat(Array.isArray(x)&&d>0?x.flat(d-1):x)},[])}});
if(!Array.prototype.flatMap)Object.defineProperty(Array.prototype,"flatMap",{configurable:true,writable:true,value:function(f,t){return this.map(f,t).flat(1)}});
if(!Element.prototype.toggleAttribute)Element.prototype.toggleAttribute=function(n,f){var h=this.hasAttribute(n);if(f===undefined)f=!h;if(f)this.setAttribute(n,"");else this.removeAttribute(n);return f};
"use strict";
/* Konfigurasi akun online (Supabase). Isi di js/config.js pada versi web, atau langsung di sini. */
window.MD_CONFIG = window.MD_CONFIG || { supabaseUrl: "", supabaseAnonKey: "" };
/* ---------- Materi: 12 bab, urutan mengikuti Netzwerk neu A1 (isi dibuat sendiri) ---------- */
/* q: jawaban benar selalu elemen pertama di o, diacak saat tampil */
const L = [
    {
        t: "Guten Tag!", sub: "Sapaan, perkenalan, angka", pr: "Inti",
        goal: "Kamu bisa menyapa, memperkenalkan diri, menanyakan nama dan asal, serta menyebut angka sampai 100.",
        c: [
            { p: "Bahasa Jerman punya dua cara menyapa lawan bicara. {du} untuk teman, keluarga, dan anak-anak. {Sie} (selalu huruf besar) untuk orang yang baru dikenal, guru, atau atasan." },
            { tb: { h: ["Situasi", "Jerman", "Arti"], r: [
                        ["Nama", "{Ich heiße Anna.}", "Nama saya Anna."],
                        ["Tanya nama (akrab)", "{Wie heißt du?}", "Siapa namamu?"],
                        ["Tanya nama (formal)", "{Wie heißen Sie?}", "Siapa nama Anda?"],
                        ["Asal", "{Ich komme aus Indonesien.}", "Saya berasal dari Indonesia."],
                        ["Tanya asal", "{Woher kommst du?}", "Kamu dari mana?"],
                        ["Tempat tinggal", "{Ich wohne in Bandung.}", "Saya tinggal di Bandung."],
                        ["Tanya kabar", "{Wie geht's?}", "Apa kabar?"]
                    ] } },
            { p: "**Empat kata kerja pertama.** Bentuk kata kerja berubah mengikuti subjek. {sein} (adalah) tidak beraturan, jadi hafalkan." },
            { tb: { h: ["Subjek", "heißen", "wohnen", "kommen", "sein"], r: [
                        ["ich", "heiße", "wohne", "komme", "bin"], ["du", "heißt", "wohnst", "kommst", "bist"], ["er / sie / es", "heißt", "wohnt", "kommt", "ist"], ["wir", "heißen", "wohnen", "kommen", "sind"], ["ihr", "heißt", "wohnt", "kommt", "seid"], ["sie / Sie", "heißen", "wohnen", "kommen", "sind"]
                    ] } },
            { tip: "Kata kerja yang sudah berubah bentuk selalu ada di **posisi ke-2** kalimat. Kata tanya W berada di posisi 1: {Wo wohnst du?}, {Woher kommst du?}, {Wer ist das?}" },
            { p: "**Angka.** {null} (0), {eins} (1), {zwei}, {drei}, {vier}, {fünf}, {sechs}, {sieben}, {acht}, {neun}, {zehn} (10), {elf}, {zwölf}. Angka 13 sampai 19 = satuan + {zehn} ({dreizehn}), kecuali {sechzehn} (16) dan {siebzehn} (17). Puluhan memakai {-zig}: {zwanzig}, {dreißig}, {vierzig}, {fünfzig}, {sechzig}, {siebzig}, {achtzig}, {neunzig}, {hundert}." },
            { tip: "**Angka di atas 20 dibaca terbalik:** 21 = “satu-dan-dua puluh” = {einundzwanzig}. 34 = {vierunddreißig}." },
            { tb: { h: ["Tulisan", "Dibaca seperti", "Contoh"], r: [
                        ["sch", "“sy”", "{Schule}"], ["st / sp di awal", "“syt” / “syp”", "{Stunde}, {Sport}"], ["ch", "“h” lembut setelah i, e. “kh” kasar setelah a, o, u", "{ich}, {Buch}"], ["ei", "“ai”", "{nein}"], ["ie", "“i” panjang", "{Liebe}"], ["eu", "“oy”", "{neu}"], ["z", "“ts”", "{Zeit}"], ["w", "“v”", "{Wasser}"], ["v", "“f”", "{Vater}"], ["j", "“y”", "{ja}"], ["ä / ö / ü", "“e” terbuka / “e” bibir bulat / “i” bibir bulat", "{Mädchen}, {schön}, {über}"], ["ß", "“ss”", "{Straße}"]
                    ] } }
        ],
        v: [["Hallo", "halo", "HA-lo"], ["Guten Morgen", "selamat pagi", "GU-ten MOR-gen"], ["Guten Tag", "selamat siang / selamat hari", "GU-ten tak"], ["Guten Abend", "selamat malam", "GU-ten A-bent"], ["Tschüss", "dah, sampai jumpa (akrab)", "tsyüs"], ["Auf Wiedersehen", "sampai jumpa (formal)", "auf VI-der-ze-en"], ["Danke", "terima kasih", "DAN-ke"], ["Bitte", "silakan / sama-sama", "BIT-te"], ["Entschuldigung", "maaf / permisi", "ent-SYUL-di-gung"], ["Freut mich", "senang berkenalan", "froyt mih"], ["Indonesien", "Indonesia", "in-do-NE-zi-en"], ["Deutschland", "Jerman", "DOYTSY-lant"], ["zwanzig", "20", "TSVAN-tsikh"], ["hundert", "100", "HUN-dert"]],
        e: [["Hallo! Ich heiße Anna. Wie heißt du?", "Halo! Nama saya Anna. Siapa namamu?"], ["Ich komme aus Indonesien. Woher kommst du?", "Saya dari Indonesia. Kamu dari mana?"], ["Wo wohnen Sie? – Ich wohne in Surabaya.", "Anda tinggal di mana? – Saya tinggal di Surabaya."], ["Wie geht's? – Gut, danke.", "Apa kabar? – Baik, terima kasih."], ["Ich bin zwanzig Jahre alt.", "Umur saya dua puluh tahun."]],
        q: [
            { q: "“Selamat pagi” dalam bahasa Jerman adalah...", o: ["Guten Morgen", "Gute Nacht", "Guten Abend", "Auf Wiedersehen"], y: "Morgen = pagi." },
            { q: "“Woher kommst du?” artinya...", o: ["Kamu dari mana?", "Kamu tinggal di mana?", "Siapa namamu?", "Apa kabar?"], y: "Woher = dari mana." },
            { q: "Kamu berbicara dengan gurumu. Kata ganti yang sopan adalah...", o: ["Sie", "du", "ihr", "er"], y: "Sie (huruf besar) untuk bicara formal." },
            { q: "Ich ___ aus Indonesien.", o: ["komme", "kommst", "kommt", "kommen"], y: "ich + komme." },
            { q: "Du ___ Anna.", o: ["heißt", "heiße", "heißen", "komme"], y: "du + heißt." },
            { q: "21 dalam bahasa Jerman adalah...", o: ["einundzwanzig", "zwanzigeins", "zweiundeins", "einszwanzig"], y: "Satuan dulu: ein + und + zwanzig." },
            { q: "Huruf “w” pada Wasser dibaca...", o: ["v", "w", "u", "f"], y: "w dibaca “v”: VA-ser." }
        ]
    },
    {
        t: "Freunde, Kollegen und ich", sub: "Hobi, kata kerja, hari, ajakan", pr: "Inti",
        goal: "Kamu bisa menceritakan hobi, mengubah kata kerja sesuai subjek, menyebut hari, dan mengajak teman.",
        c: [
            { p: "Hampir semua kata kerja mengikuti pola yang sama: buang {-en}, tambah akhiran. Beberapa kata kerja mengubah vokal untuk {du} dan {er / sie / es}, misalnya {lesen} dan {sprechen}." },
            { tb: { h: ["Subjek", "spielen", "arbeiten", "lesen", "sprechen"], r: [
                        ["ich", "spiele", "arbeite", "lese", "spreche"], ["du", "spielst", "arbeitest", "liest", "sprichst"], ["er / sie / es", "spielt", "arbeitet", "liest", "spricht"], ["wir", "spielen", "arbeiten", "lesen", "sprechen"], ["ihr", "spielt", "arbeitet", "lest", "sprecht"], ["sie / Sie", "spielen", "arbeiten", "lesen", "sprechen"]
                    ] } },
            { tip: "{arbeiten} menambah “e” (arbeitest, arbeitet) supaya mudah diucapkan. {lesen} dan {sprechen} berubah vokal e menjadi ie atau i hanya untuk du dan er / sie / es." },
            { p: "**Suka atau tidak suka:** taruh {gern} atau {nicht gern} setelah kata kerja. {Ich spiele gern Fußball.} {Er liest nicht gern.}" },
            { tb: { h: ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"], r: [["{Montag}", "{Dienstag}", "{Mittwoch}", "{Donnerstag}", "{Freitag}", "{Samstag}", "{Sonntag}"]] } },
            { p: "“Pada hari ...” memakai {am}: {am Montag}, {am Wochenende} (akhir pekan). **Pertanyaan ya atau tidak:** kata kerja pindah ke posisi 1. {Du hast Zeit.} menjadi {Hast du Zeit?} Jawab dengan {Ja} atau {Nein}." },
            { tip: "Untuk mengajak: {Hast du am Samstag Zeit?} Menerima: {Ja, gern!} Menolak sopan: {Nein, leider nicht.}" }
        ],
        v: [["das Hobby", "hobi", "HO-bi"], ["Fußball spielen", "bermain sepak bola", "FUS-bal SYPI-len"], ["Musik hören", "mendengarkan musik", "mu-ZIK HÖ-ren"], ["lesen", "membaca", "LE-zen"], ["kochen", "memasak", "KO-khen"], ["schwimmen", "berenang", "SYVIM-men"], ["tanzen", "menari", "TAN-tsen"], ["der Freund / die Freundin", "teman (laki-laki / perempuan)", "froynt / FROYN-din"], ["der Kollege / die Kollegin", "rekan kerja", "ko-LE-ge / ko-LE-gin"], ["die Zeit", "waktu", "tsait"], ["leider", "sayangnya", "LAI-der"], ["gern", "dengan senang hati / suka", "gern"], ["das Wochenende", "akhir pekan", "VO-khen-en-de"]],
        e: [["Ich spiele gern Fußball.", "Saya suka bermain sepak bola."], ["Er liest nicht gern.", "Dia tidak suka membaca."], ["Was machst du am Wochenende?", "Kamu mau apa di akhir pekan?"], ["Hast du am Samstag Zeit?", "Apakah kamu ada waktu hari Sabtu?"], ["Ja, gern! / Nein, leider nicht.", "Ya, dengan senang hati! / Tidak, sayangnya tidak."]],
        q: [
            { q: "Du ___ gern. (lesen)", o: ["liest", "lest", "lese", "lesen"], y: "lesen berubah: du liest." },
            { q: "Er ___ Deutsch. (sprechen)", o: ["spricht", "sprecht", "sprechst", "spreche"], y: "er spricht." },
            { q: "Ihr ___ viel. (arbeiten)", o: ["arbeitet", "arbeitst", "arbeiten", "arbeite"], y: "ihr + -t, dengan “e” di antara." },
            { q: "“Dienstag” = ...", o: ["Selasa", "Senin", "Rabu", "Kamis"], y: "Dienstag = Selasa." },
            { q: "Bentuk pertanyaan ya atau tidak yang benar:", o: ["Spielst du Fußball?", "Du spielst Fußball?", "Du Fußball spielst?", "Fußball du spielst?"], y: "Kata kerja pindah ke posisi 1." },
            { q: "Untuk menolak ajakan dengan sopan kamu bilang...", o: ["Nein, leider nicht.", "Ja, gern!", "Hallo!", "Danke, gut."], y: "leider = sayangnya." }
        ]
    },
    {
        t: "In Hamburg", sub: "Tempat di kota, arah jalan, artikel", pr: "Inti",
        goal: "Kamu bisa menyebut tempat di kota, bertanya dan memberi arah, serta memakai artikel dan bentuk jamak.",
        c: [
            { p: "Setiap kata benda punya jenis: {der} (maskulin), {die} (feminin), {das} (netral). Hafalkan kata benda **bersama artikelnya**. Kata benda selalu ditulis dengan huruf besar." },
            { tb: { h: ["Jenis", "der / die / das", "a (ein)", "tidak ada (kein)"], r: [
                        ["maskulin", "{der Bahnhof}", "{ein Bahnhof}", "{kein Bahnhof}"], ["feminin", "{die Bank}", "{eine Bank}", "{keine Bank}"], ["netral", "{das Kino}", "{ein Kino}", "{kein Kino}"], ["jamak", "{die Kinos}", "(tanpa ein)", "{keine Kinos}"]
                    ] } },
            { tb: { h: ["Pola jamak", "Contoh"], r: [
                        ["+ n / + en", "{die Lampe → die Lampen}, {die Frau → die Frauen}"], ["+ e (kadang umlaut)", "{der Hund → die Hunde}, {der Bahnhof → die Bahnhöfe}"], ["+ er (+ umlaut)", "{das Kind → die Kinder}, {das Buch → die Bücher}"], ["+ s", "{das Auto → die Autos}, {das Café → die Cafés}"], ["tetap / umlaut", "{der Apfel → die Äpfel}"]
                    ] } },
            { tip: "Jamak selalu memakai {die}. Kata berakhiran {-ung}, {-heit}, {-keit} hampir selalu {die}. Akhiran {-chen} selalu {das}." },
            { p: "**Arah jalan.** Perhatikan pola kalimat perintah sopan: kata kerja di depan, lalu {Sie}." },
            { tb: { h: ["Frasa", "Arti"], r: [
                        ["{Entschuldigung, wo ist der Bahnhof?}", "Permisi, di mana stasiun?"], ["{Gehen Sie geradeaus.}", "Jalan lurus."], ["{Gehen Sie links / rechts.}", "Belok kiri / kanan."], ["{Nehmen Sie die U-Bahn.}", "Naiklah kereta bawah tanah."], ["{Ich fahre mit dem Bus.}", "Saya naik bus. (frasa tetap, tata bahasanya di bab 7)"]
                    ] } }
        ],
        v: [["der Bahnhof", "stasiun", "BAN-hof"], ["die Bank", "bank / bangku", "bank"], ["die Apotheke", "apotek", "a-po-TE-ke"], ["das Café", "kafe", "ka-FE"], ["das Kino", "bioskop", "KI-no"], ["der Supermarkt", "supermarket", "ZU-per-markt"], ["die Haltestelle", "halte / perhentian", "HAL-te-syte-le"], ["der Bus", "bus", "bus"], ["die U-Bahn", "kereta bawah tanah", "U-ban"], ["das Fahrrad", "sepeda", "FAR-rat"], ["links", "kiri", "links"], ["rechts", "kanan", "rekhts"], ["geradeaus", "lurus", "ge-RA-de-aus"], ["die Stadt", "kota", "syTAT"]],
        e: [["Wo ist die Apotheke?", "Di mana apoteknya?"], ["Gehen Sie geradeaus und dann rechts.", "Jalan lurus lalu belok kanan."], ["Das ist ein Kino. Das ist kein Café.", "Ini bioskop. Ini bukan kafe."], ["In der Stadt gibt es zwei Bahnhöfe.", "Di kota ada dua stasiun."], ["Ich habe keine Tasche.", "Saya tidak punya tas."]],
        q: [
            { q: "___ Bank (bank)", o: ["die", "der", "das", "ein"], y: "die Bank, feminin." },
            { q: "Jamak dari das Kind adalah...", o: ["die Kinder", "die Kinds", "die Kinden", "das Kinder"], y: "Pola +er: Kinder." },
            { q: "Das ist ___ Kino. (bukan bioskop)", o: ["kein", "keine", "keinen", "nicht"], y: "Kino adalah das, jadi kein." },
            { q: "“rechts” artinya...", o: ["kanan", "kiri", "lurus", "dekat"], y: "links = kiri, rechts = kanan." },
            { q: "Entschuldigung, ___ ist der Bahnhof?", o: ["wo", "wer", "wie", "woher"], y: "wo = di mana." },
            { q: "Kata benda berakhiran -ung hampir selalu memakai artikel...", o: ["die", "der", "das", "ein"], y: "die Zeitung, die Wohnung." }
        ]
    },
    {
        t: "Guten Appetit!", sub: "Makanan, memesan, möchten dan mögen", pr: "Inti",
        goal: "Kamu bisa memesan makanan, berbelanja, menyebut jumlah dan harga, serta memakai akusatif.",
        c: [
            { p: "{möchten} (ingin, sopan) dan {mögen} (suka) adalah kata kerja modal. Perbedaannya: {Ich möchte einen Tee.} (saya mau teh) dan {Ich mag Tee.} (saya suka teh)." },
            { tb: { h: ["Subjek", "möchten", "mögen"], r: [
                        ["ich", "möchte", "mag"], ["du", "möchtest", "magst"], ["er / sie / es", "möchte", "mag"], ["wir", "möchten", "mögen"], ["ihr", "möchtet", "mögt"], ["sie / Sie", "möchten", "mögen"]
                    ] } },
            { p: "**Akusatif.** Kata benda yang dipesan atau dimiliki berada di akusatif. Hanya kata benda {der} yang berubah." },
            { tb: { h: ["Jenis", "der / die / das", "ein", "kein"], r: [
                        ["maskulin", "der → {den}", "ein → {einen}", "kein → {keinen}"], ["feminin", "{die}", "{eine}", "{keine}"], ["netral", "{das}", "{ein}", "{kein}"], ["jamak", "{die}", "(tanpa ein)", "{keine}"]
                    ] } },
            { tip: "{Ich möchte einen Kaffee.} (der Kaffee) tetapi {Ich möchte eine Suppe.} (die Suppe) dan {ein Brot} (das Brot). Kata kerja modal di posisi 2, hal yang dipesan di akhir." },
            { p: "**Kemasan dan jumlah** tidak memakai {von}: {eine Flasche Wasser}, {ein Glas Milch}, {ein Kilo Äpfel}, {eine Packung Nudeln}. **Harga:** {Was kostet das?} – {Das kostet zwei Euro.}" }
        ],
        v: [["das Brot", "roti", "brot"], ["der Reis", "nasi", "rais"], ["die Nudeln", "mi", "NU-deln"], ["das Fleisch", "daging", "flaisy"], ["der Fisch", "ikan", "fisy"], ["das Gemüse", "sayur", "ge-MÜ-ze"], ["das Obst", "buah", "opst"], ["die Kartoffel", "kentang", "kar-TO-fel"], ["die Flasche", "botol", "FLA-sye"], ["das Glas", "gelas", "glas"], ["das Kilo", "kilo", "KI-lo"], ["die Packung", "bungkus", "PA-kung"], ["kosten", "berharga", "KOS-ten"], ["die Rechnung", "tagihan", "REH-nung"]],
        e: [["Ich möchte einen Kaffee und ein Brot, bitte.", "Saya mau kopi dan roti."], ["Ich mag keinen Fisch.", "Saya tidak suka ikan."], ["Wir möchten die Rechnung, bitte.", "Kami minta bonnya."], ["Was kostet das Brot? – Das kostet zwei Euro.", "Berapa harga rotinya? – Dua euro."], ["Ich kaufe ein Kilo Äpfel.", "Saya membeli satu kilo apel."]],
        q: [
            { q: "Ich ___ einen Tee, bitte. (ingin)", o: ["möchte", "möchtest", "möchten", "mag"], y: "ich möchte." },
            { q: "Er ___ keinen Fisch. (suka)", o: ["mag", "mögt", "magst", "mögen"], y: "er mag." },
            { q: "Ich möchte ___ Suppe.", o: ["eine", "einen", "ein", "keinen"], y: "die Suppe adalah feminin: eine." },
            { q: "Ich möchte ___ Kaffee. (der Kaffee)", o: ["einen", "eine", "ein", "einem"], y: "der menjadi einen di akusatif." },
            { q: "“Die Rechnung, bitte” kamu ucapkan untuk...", o: ["meminta bon", "memesan nasi", "menyapa pelayan", "berpamitan"], y: "die Rechnung = tagihan." },
            { q: "Ich habe ___ Hund. (tidak punya anjing, der Hund)", o: ["keinen", "kein", "keine", "nicht"], y: "der + akusatif → keinen." }
        ]
    },
    {
        t: "Alltag und Familie", sub: "Jam, keluarga, müssen, können, wollen", pr: "Inti",
        goal: "Kamu bisa menyebut jam, menceritakan rutinitas dan keluarga, serta memakai müssen, können, wollen.",
        c: [
            { p: "**Jam tidak resmi** dipakai sehari-hari, **jam resmi** dipakai di pengumuman, jadwal, dan stasiun." },
            { tb: { h: ["Pukul", "Tidak resmi (sehari-hari)", "Resmi (24 jam)"], r: [
                        ["15.00", "{drei Uhr}", "{fünfzehn Uhr}"], ["15.15", "{Viertel nach drei}", "{fünfzehn Uhr fünfzehn}"], ["15.30", "{halb vier}", "{fünfzehn Uhr dreißig}"], ["15.45", "{Viertel vor vier}", "{fünfzehn Uhr fünfundvierzig}"]
                    ] } },
            { tip: "{halb vier} = setengah empat = pukul 03.30 atau 15.30. Sama seperti bahasa Indonesia, jadi bukan 04.30. Jam tidak resmi hanya memakai angka 1 sampai 12." },
            { p: "**Waktu:** {um acht Uhr} (pukul delapan), {am Montag}, {von neun bis zwölf Uhr}. **Kata milik** berdiri sebelum kata benda, dan mendapat tambahan {-e} untuk {die} dan jamak." },
            { tb: { h: ["Pemilik", "der / das", "die / jamak"], r: [
                        ["ich", "{mein}", "{meine}"], ["du", "{dein}", "{deine}"], ["er / es", "{sein}", "{seine}"], ["sie", "{ihr}", "{ihre}"], ["wir", "{unser}", "{unsere}"], ["ihr", "{euer}", "{eure}"], ["sie / Sie", "{ihr} / {Ihr}", "{ihre} / {Ihre}"]
                    ] } },
            { tip: "Di akusatif, kata milik maskulin mendapat {-en}: {Ich besuche meinen Vater.}" },
            { tb: { h: ["Subjek", "müssen", "können", "wollen"], r: [
                        ["ich", "muss", "kann", "will"], ["du", "musst", "kannst", "willst"], ["er / sie / es", "muss", "kann", "will"], ["wir", "müssen", "können", "wollen"], ["ihr", "müsst", "könnt", "wollt"], ["sie / Sie", "müssen", "können", "wollen"]
                    ] } },
            { p: "Kata kerja modal di posisi 2, kata kerja utama bentuk dasar di akhir: {Ich muss heute arbeiten.} {Kannst du morgen kommen?}" }
        ],
        v: [["die Uhr", "jam / pukul", "ur"], ["der Termin", "janji / jadwal", "ter-MIN"], ["die Familie", "keluarga", "fa-MI-li-e"], ["die Mutter", "ibu", "MU-ter"], ["der Vater", "ayah", "FA-ter"], ["die Eltern", "orang tua", "EL-tern"], ["der Bruder", "saudara laki-laki", "BRU-der"], ["die Schwester", "saudara perempuan", "SYVES-ter"], ["der Sohn", "anak laki-laki", "zon"], ["die Tochter", "anak perempuan", "TOKH-ter"], ["die Oma / der Opa", "nenek / kakek", "O-ma / O-pa"], ["früh", "pagi / awal", "frü"], ["spät", "larut / terlambat", "SYPET"]],
        e: [["Wie spät ist es? – Es ist halb vier.", "Jam berapa sekarang? – Setengah empat."], ["Ich stehe um sieben Uhr auf.", "Saya bangun pukul tujuh."], ["Mein Vater arbeitet von acht bis fünf Uhr.", "Ayah saya bekerja dari jam delapan sampai lima."], ["Meine Schwester kann gut kochen.", "Saudara perempuan saya pandai memasak."], ["Ich muss heute lernen. Ich will nicht arbeiten.", "Saya harus belajar hari ini. Saya tidak mau bekerja."]],
        q: [
            { q: "halb vier = ...", o: ["03.30", "04.30", "03.45", "04.00"], y: "halb vier = setengah empat = 03.30." },
            { q: "___ Mutter heißt Siti. (ibuku)", o: ["Meine", "Mein", "Meinen", "Meiner"], y: "Mutter adalah die, maka meine." },
            { q: "Ich ___ heute arbeiten.", o: ["muss", "musst", "müssen", "müsst"], y: "ich muss." },
            { q: "Wir ___ Deutsch lernen. (ingin)", o: ["wollen", "will", "willst", "wollt"], y: "wir wollen." },
            { q: "Viertel nach zwei = ...", o: ["02.15", "02.45", "01.45", "02.30"], y: "nach = setelah." },
            { q: "Kata kerja utama pada kalimat dengan kata kerja modal berada di...", o: ["akhir kalimat dalam bentuk dasar", "posisi 1", "posisi 2 berubah bentuk", "tidak dipakai"], y: "Ich kann kochen: kata kerja utama di akhir." }
        ]
    },
    {
        t: "Zeit mit Freunden", sub: "Tanggal, kata kerja terpisah, ajakan", pr: "Inti",
        goal: "Kamu bisa menyebut bulan dan tanggal, mengundang teman, dan memakai kata kerja terpisah serta kata ganti akusatif.",
        c: [
            { p: "**Bulan:** {Januar, Februar, März, April, Mai, Juni, Juli, August, September, Oktober, November, Dezember}. **Musim:** {der Frühling}, {der Sommer}, {der Herbst}, {der Winter}. “Pada bulan ...” memakai {im}: {im Mai}." },
            { p: "**Tanggal memakai angka urutan.** Angka 1 sampai 19 mendapat akhiran {-te}, angka 20 ke atas {-ste}. Yang berbeda: {erste} (1.), {dritte} (3.), {siebte} (7.), dan {achte} (8., cukup satu t). Tanggal ditulis {6. November} dan dibaca {der sechste November}. “Pada tanggal ...” = {am sechsten November}." },
            { p: "**Kata kerja terpisah.** Awalan terpisah dan pindah ke akhir kalimat." },
            { tb: { h: ["Bentuk dasar", "Contoh kalimat", "Arti"], r: [
                        ["{aufstehen}", "{Ich stehe um sieben Uhr auf.}", "Saya bangun pukul tujuh."], ["{mitkommen}", "{Kommst du mit?}", "Kamu ikut?"], ["{abholen}", "{Ich hole dich ab.}", "Saya jemput kamu."], ["{einladen}", "{Ich lade euch ein.}", "Saya mengundang kalian."], ["{einkaufen}", "{Wir kaufen heute ein.}", "Kami belanja hari ini."]
                    ] } },
            { tb: { h: ["Subjek", "Akusatif"], r: [
                        ["ich", "{mich}"], ["du", "{dich}"], ["er", "{ihn}"], ["sie", "{sie}"], ["es", "{es}"], ["wir", "{uns}"], ["ihr", "{euch}"], ["sie / Sie", "{sie} / {Sie}"]
                    ] } },
            { p: "**Präteritum dari sein dan haben** (bentuk lampau yang sering dipakai):" },
            { tb: { h: ["Subjek", "sein", "haben"], r: [
                        ["ich", "war", "hatte"], ["du", "warst", "hattest"], ["er / sie / es", "war", "hatte"], ["wir", "waren", "hatten"], ["ihr", "wart", "hattet"], ["sie / Sie", "waren", "hatten"]
                    ] } }
        ],
        v: [["der Monat", "bulan", "MO-nat"], ["das Jahr", "tahun", "yar"], ["der Frühling", "musim semi", "FRÜ-ling"], ["der Sommer", "musim panas", "ZO-mer"], ["der Herbst", "musim gugur", "herpst"], ["der Winter", "musim dingin", "VIN-ter"], ["das Datum", "tanggal", "DA-tum"], ["der Geburtstag", "hari ulang tahun", "ge-BURTS-tak"], ["die Party", "pesta", "PAR-ti"], ["die Freizeit", "waktu luang", "FRAI-tsait"], ["aufstehen", "bangun", "AUF-syte-en"], ["einladen", "mengundang", "AIN-la-den"], ["abholen", "menjemput", "AP-ho-len"], ["mitkommen", "ikut", "MIT-ko-men"]],
        e: [["Der wievielte ist heute? – Heute ist der sechste November.", "Tanggal berapa hari ini? – Hari ini tanggal enam November."], ["Ich habe am dritten Mai Geburtstag.", "Ulang tahun saya tanggal tiga Mei."], ["Kommst du am Samstag mit? Ich hole dich ab.", "Kamu ikut hari Sabtu? Saya jemput."], ["Ich lade dich zur Party ein.", "Saya mengundangmu ke pesta."], ["Gestern war ich müde. Ich hatte keine Zeit.", "Kemarin saya lelah. Saya tidak punya waktu."]],
        q: [
            { q: "“Pada bulan Mei” dalam bahasa Jerman?", o: ["im Mai", "am Mai", "um Mai", "in Mai"], y: "Bulan memakai im." },
            { q: "Ich ___ um sieben Uhr ___. (aufstehen)", o: ["stehe ... auf", "aufstehe ...", "stehe auf ...", "auf ... stehe"], y: "Awalan auf pindah ke akhir kalimat." },
            { q: "Ich lade ___ ein. (kamu)", o: ["dich", "du", "dir", "dein"], y: "Akusatif untuk du adalah dich." },
            { q: "Tanggal 3 dibaca...", o: ["dritte", "dreite", "drei", "dreißigste"], y: "Angka urutan 3 tidak beraturan: dritte." },
            { q: "Gestern ___ ich müde. (sein, lampau)", o: ["war", "bin", "wart", "hatte"], y: "ich war." },
            { q: "Wir ___ keine Zeit. (haben, lampau)", o: ["hatten", "hattet", "hatte", "hast"], y: "wir hatten." }
        ]
    },
    {
        t: "Arbeitsalltag", sub: "Und, oder, aber, dativ, tempat", pr: "Pendukung",
        goal: "Kamu bisa menyambung kalimat, menyebut tempat dan alat dengan dativ, dan bercerita tentang hari kerjamu.",
        c: [
            { p: "**Menyambung kalimat.** {und} (dan), {oder} (atau), {aber} (tetapi) tidak mengubah urutan kalimat: kata kerja tetap di posisi 2." },
            { p: "{Ich arbeite im Büro, und mein Kollege arbeitet bei der Bank.}<br>{Möchtest du Kaffee oder Tee?}<br>{Ich arbeite gern, aber ich bin heute müde.}" },
            { p: "**Dativ.** Kasus ketiga dipakai setelah {mit}, {bei}, {von}, {aus}, {zu}, dan untuk menjawab {Wo?} setelah {in}, {an}, {auf}." },
            { tb: { h: ["Kasus", "der", "die", "das", "jamak"], r: [
                        ["Nominatif", "der", "die", "das", "die"], ["Akusatif", "den", "die", "das", "die"], ["Dativ", "{dem}", "{der}", "{dem}", "{den} (+ n)"]
                    ] } },
            { p: "Gabungan yang sering dipakai: {im} (in dem), {am} (an dem), {beim} (bei dem), {zum} (zu dem), {zur} (zu der). Contoh: {im Büro}, {am Computer}, {beim Arzt}, {zur Arbeit}." },
            { tip: "{Ich fahre mit dem Bus.} {Ich arbeite bei der Bank.} {Das Buch liegt auf dem Tisch.} Tiga kalimat ini semuanya dativ." }
        ],
        v: [["das Büro", "kantor", "bü-RO"], ["die Arbeit", "pekerjaan", "AR-bait"], ["der Chef / die Chefin", "atasan", "syef / SYE-fin"], ["der Computer", "komputer", "kom-PYU-ter"], ["der Drucker", "printer", "DRU-ker"], ["drucken", "mencetak", "DRU-ken"], ["die E-Mail", "surel", "I-mel"], ["das Telefon", "telepon", "te-le-FON"], ["der Brief", "surat", "brif"], ["die Pause", "istirahat", "PAU-ze"], ["die Medien", "media", "ME-di-en"], ["der Stress", "stres", "syTRES"], ["bei", "di (tempat orang)", "bai"]],
        e: [["Ich arbeite im Büro und fahre mit dem Bus.", "Saya bekerja di kantor dan naik bus."], ["Möchtest du Kaffee oder Tee?", "Kamu mau kopi atau teh?"], ["Mein Chef ist nett, aber die Arbeit ist viel.", "Atasan saya baik, tetapi pekerjaannya banyak."], ["Kannst du das bitte drucken?", "Bisakah kamu mencetak ini?"], ["Was für ein Stress!", "Stres sekali!"]],
        q: [
            { q: "Kata penghubung “tetapi” adalah...", o: ["aber", "oder", "und", "denn"], y: "aber = tetapi." },
            { q: "Ich fahre mit ___ Bus. (der Bus)", o: ["dem", "den", "der", "das"], y: "mit + dativ; der → dem." },
            { q: "Ich arbeite bei ___ Bank. (die Bank)", o: ["der", "die", "dem", "den"], y: "bei + dativ; die → der." },
            { q: "Möchtest du Kaffee ___ Tee?", o: ["oder", "und", "aber", "dem"], y: "oder = atau." },
            { q: "Das Buch liegt auf ___ Tisch. (der Tisch)", o: ["dem", "den", "das", "die"], y: "Wo? → dativ: dem." },
            { q: "“im Büro” adalah gabungan dari...", o: ["in dem Büro", "in den Büro", "in der Büro", "an dem Büro"], y: "im = in + dem." }
        ]
    },
    {
        t: "Fit und gesund", sub: "Tubuh, dokter, imperatif", pr: "Pendukung",
        goal: "Kamu bisa menyebut bagian tubuh, memberi dan memahami perintah, serta berbicara di dokter.",
        c: [
            { p: "**Imperatif** (kalimat perintah) punya tiga bentuk, sesuai lawan bicara. Bentuk {du}: batang kata tanpa {-st}. Bentuk {ihr}: sama dengan konjugasi untuk ihr, tetapi tanpa kata ihr. Bentuk {Sie}: kata kerja diikuti {Sie}." },
            { tb: { h: ["Lawan bicara", "kommen", "machen", "essen", "sein"], r: [
                        ["du", "Komm!", "Mach!", "Iss!", "Sei!"], ["ihr", "Kommt!", "Macht!", "Esst!", "Seid!"], ["Sie", "Kommen Sie!", "Machen Sie!", "Essen Sie!", "Seien Sie!"]
                    ] } },
            { tip: "Kata kerja yang berubah vokal e → i atau ie untuk du juga berubah di imperatif: {essen} → {Iss!}, {lesen} → {Lies!}, {sprechen} → {Sprich!}." },
            { tb: { h: ["Subjek", "sollen", "müssen", "dürfen"], r: [
                        ["ich", "soll", "muss", "darf"], ["du", "sollst", "musst", "darfst"], ["er / sie / es", "soll", "muss", "darf"], ["wir", "sollen", "müssen", "dürfen"], ["ihr", "sollt", "müsst", "dürft"], ["sie / Sie", "sollen", "müssen", "dürfen"]
                    ] } },
            { p: "{sollen} = dianjurkan atau disuruh (misalnya oleh dokter). {müssen} = harus karena keadaan. {dürfen} = boleh. {nicht dürfen} = dilarang. {Sie dürfen nicht rauchen.}" }
        ],
        v: [["der Kopf", "kepala", "kopf"], ["der Bauch", "perut", "baukh"], ["der Rücken", "punggung", "RÜ-ken"], ["der Arm", "lengan", "arm"], ["das Bein", "kaki (tungkai)", "bain"], ["die Hand", "tangan", "hant"], ["der Hals", "leher / tenggorokan", "hals"], ["der Zahn", "gigi", "tsan"], ["der Arzt / die Ärztin", "dokter", "artst / ERTS-tin"], ["krank", "sakit", "krank"], ["gesund", "sehat", "ge-ZUNT"], ["die Tablette", "tablet obat", "ta-BLE-te"], ["das Fieber", "demam", "FI-ber"], ["die Schmerzen", "rasa sakit", "SYMER-tsen"]],
        e: [["Ich habe Kopfschmerzen.", "Saya sakit kepala."], ["Trinken Sie viel Wasser!", "Minumlah banyak air!"], ["Du sollst zum Arzt gehen.", "Kamu disuruh ke dokter."], ["Hier dürfen Sie nicht rauchen.", "Di sini Anda dilarang merokok."], ["Gute Besserung!", "Semoga cepat sembuh!"]],
        q: [
            { q: "Imperatif “Datanglah!” untuk teman (du)", o: ["Komm!", "Kommt!", "Kommen Sie!", "Kommst!"], y: "du: batang kata saja." },
            { q: "Imperatif untuk Sie dari machen:", o: ["Machen Sie!", "Mach Sie!", "Macht Sie!", "Machst Sie!"], y: "Kata kerja + Sie." },
            { q: "Imperatif du dari essen adalah...", o: ["Iss!", "Ess!", "Esse!", "Isst!"], y: "essen berubah e → i." },
            { q: "“Sie dürfen nicht rauchen” artinya...", o: ["Anda dilarang merokok.", "Anda harus merokok.", "Anda tidak mau merokok.", "Anda bisa merokok."], y: "nicht dürfen = dilarang." },
            { q: "Der Arzt sagt: Du ___ viel Wasser trinken.", o: ["sollst", "soll", "sollen", "sollt"], y: "du sollst." },
            { q: "“Gute Besserung!” kamu ucapkan untuk...", o: ["orang yang sakit", "teman baru", "orang berulang tahun", "tamu yang pulang"], y: "Ucapan semoga lekas sembuh." }
        ]
    },
    {
        t: "Meine Wohnung", sub: "Kamar, perabot, Wo? dan Wohin?", pr: "Pendukung",
        goal: "Kamu bisa menjelaskan rumahmu, menyebut perabot dan warna, serta membedakan Wo? dan Wohin?",
        c: [
            { p: "**sein + sifat.** Sifat berdiri setelah {sein} dan tidak berubah: {Die Wohnung ist groß.} {Das Zimmer ist hell.}" },
            { p: "**Wo? dan Wohin?** Sembilan kata depan bisa memakai dativ atau akusatif: {an, auf, hinter, in, neben, über, unter, vor, zwischen}. Jika menyatakan posisi (Wo?) pakai dativ. Jika menyatakan arah gerak (Wohin?) pakai akusatif." },
            { tb: { h: ["Pertanyaan", "Kasus", "Contoh"], r: [
                        ["Wo? (di mana)", "dativ", "{Ich bin in der Küche.}"], ["Wohin? (ke mana)", "akusatif", "{Ich gehe in die Küche.}"], ["Wo?", "dativ", "{Das Bild hängt an der Wand.}"], ["Wohin?", "akusatif", "{Ich hänge das Bild an die Wand.}"]
                    ] } },
            { tb: { h: ["Kata depan", "Arti"], r: [
                        ["an", "di tepi, pada"], ["auf", "di atas (permukaan)"], ["hinter", "di belakang"], ["in", "di dalam"], ["neben", "di samping"], ["über", "di atas (tidak menyentuh)"], ["unter", "di bawah"], ["vor", "di depan"], ["zwischen", "di antara"]
                    ] } },
            { tip: "Cara mengingat: {Wo?} = diam di satu tempat = dativ ({dem, der, dem, den}). {Wohin?} = bergerak ke tempat = akusatif ({den, die, das, die})." }
        ],
        v: [["das Zimmer", "kamar", "TSIM-mer"], ["das Wohnzimmer", "ruang tamu", "VON-tsim-mer"], ["das Schlafzimmer", "kamar tidur", "SYLAF-tsim-mer"], ["die Küche", "dapur", "KÜ-khe"], ["das Bad", "kamar mandi", "bat"], ["der Balkon", "balkon", "bal-KON"], ["das Sofa", "sofa", "ZO-fa"], ["der Tisch", "meja", "tisy"], ["der Stuhl", "kursi", "syTUL"], ["der Schrank", "lemari", "syrank"], ["das Bett", "tempat tidur", "bet"], ["groß / klein", "besar / kecil", "gros / klain"], ["rot, blau, grün", "merah, biru, hijau", "rot, blau, grün"], ["gelb, weiß, schwarz", "kuning, putih, hitam", "gelp, vais, syvarts"]],
        e: [["Meine Wohnung ist klein, aber hell.", "Apartemen saya kecil, tetapi terang."], ["Das Sofa steht im Wohnzimmer.", "Sofa ada di ruang tamu."], ["Ich gehe in die Küche.", "Saya pergi ke dapur."], ["Die Lampe hängt über dem Tisch.", "Lampu tergantung di atas meja."], ["Der Schrank ist weiß.", "Lemarinya putih."]],
        q: [
            { q: "Ich bin ___ Küche. (Wo? di dapur)", o: ["in der", "in die", "in den", "in das"], y: "Wo? → dativ: der Küche." },
            { q: "Ich gehe ___ Küche. (Wohin? ke dapur)", o: ["in die", "in der", "in dem", "in den"], y: "Wohin? → akusatif: die Küche." },
            { q: "Das Zimmer ___ hell.", o: ["ist", "bin", "bist", "sind"], y: "sein + sifat." },
            { q: "“Schlafzimmer” artinya...", o: ["kamar tidur", "ruang tamu", "dapur", "kamar mandi"], y: "schlafen = tidur." },
            { q: "Das Bild hängt ___ Wand. (Wo?)", o: ["an der", "an die", "an den", "an das"], y: "Wo? → dativ; die Wand → der Wand." },
            { q: "Warna “biru” adalah...", o: ["blau", "rot", "grün", "gelb"], y: "blau = biru." }
        ]
    },
    {
        t: "Studium und Beruf", sub: "Pekerjaan dan Perfekt", pr: "Kenali saja",
        goal: "Kamu bisa mengenali dan memakai pola Perfekt dasar untuk bercerita tentang kemarin.",
        c: [
            { p: "{Perfekt} adalah bentuk lampau untuk bercerita. Polanya: {haben} atau {sein} di posisi 2, dan {Partizip II} di akhir kalimat (Satzklammer, kalimat berpenjepit)." },
            { p: "{Ich habe gestern gearbeitet.}<br>{Wir sind nach Hause gegangen.}" },
            { tb: { h: ["Bentuk dasar", "Perfekt", "Arti"], r: [
                        ["{machen}", "{hat gemacht}", "membuat"], ["{lernen}", "{hat gelernt}", "belajar"], ["{arbeiten}", "{hat gearbeitet}", "bekerja"], ["{essen}", "{hat gegessen}", "makan"], ["{trinken}", "{hat getrunken}", "minum"], ["{gehen}", "{ist gegangen}", "pergi"], ["{fahren}", "{ist gefahren}", "berkendara"], ["{kommen}", "{ist gekommen}", "datang"], ["{studieren}", "{hat studiert}", "kuliah"], ["{telefonieren}", "{hat telefoniert}", "menelepon"]
                    ] } },
            { tip: "**Aturan Partizip II.** Beraturan: {ge-} + batang + {-t} ({gemacht}). Tidak beraturan: {ge-} + ... + {-en}, kadang vokal berubah ({gegessen}, {getrunken}). Kata kerja berakhiran {-ieren} tidak memakai {ge-} ({studiert}). Pakai {sein} untuk kata kerja gerak dan perubahan keadaan ({gehen}, {fahren}, {kommen}, {bleiben}), selain itu {haben}." }
        ],
        v: [["der Beruf", "profesi", "be-RUF"], ["der Job", "pekerjaan", "dyop"], ["das Studium", "kuliah", "SYTU-di-um"], ["studieren", "kuliah", "syTU-DI-ren"], ["der Lehrer / die Lehrerin", "guru", "LE-rer / LE-re-rin"], ["der Verkäufer", "penjual", "fer-KOY-fer"], ["der Koch / die Köchin", "koki", "kokh / KÖ-hin"], ["der Ingenieur", "insinyur", "in-dye-NI-ör"], ["die Firma", "perusahaan", "FIR-ma"], ["die Bewerbung", "lamaran kerja", "be-VER-bung"], ["telefonieren", "menelepon", "te-le-fo-NI-ren"], ["gestern", "kemarin", "GES-tern"], ["letzte Woche", "minggu lalu", "LET-ste VO-khe"]],
        e: [["Ich habe gestern gearbeitet.", "Kemarin saya bekerja."], ["Wir haben Pizza gegessen.", "Kami makan pizza."], ["Anna ist nach Berlin gefahren.", "Anna pergi ke Berlin."], ["Er hat in Jakarta studiert.", "Dia kuliah di Jakarta."], ["Hast du schon telefoniert?", "Apakah kamu sudah menelepon?"]],
        q: [
            { q: "Ich ___ gestern gearbeitet.", o: ["habe", "bin", "hat", "ist"], y: "arbeiten memakai haben." },
            { q: "Wir ___ nach Hause gegangen.", o: ["sind", "haben", "hat", "ist"], y: "gehen (gerak) memakai sein." },
            { q: "Partizip II dari machen adalah...", o: ["gemacht", "gemachen", "macht", "gemachte"], y: "Beraturan: ge- + mach + -t." },
            { q: "Partizip II dari studieren adalah...", o: ["studiert", "gestudiert", "studieren", "studierte"], y: "Berakhiran -ieren tidak memakai ge-." },
            { q: "Er ___ Wasser getrunken.", o: ["hat", "ist", "bin", "sind"], y: "trinken memakai haben." },
            { q: "“gestern” artinya...", o: ["kemarin", "besok", "hari ini", "nanti"], y: "gestern = kemarin." }
        ]
    },
    {
        t: "Die Jacke gefällt mir!", sub: "Pakaian, dativ, welcher dan dieser", pr: "Kenali saja",
        goal: "Kamu bisa berbelanja pakaian dan mengungkapkan suka atau cocok memakai kata ganti dativ.",
        c: [
            { p: "**Kata ganti dativ** dipakai setelah kata kerja tertentu, misalnya {gefallen} (disukai), {gehören} (milik), {passen} (cocok), {schmecken} (terasa enak), {helfen} (membantu)." },
            { tb: { h: ["Subjek", "Dativ"], r: [
                        ["ich", "{mir}"], ["du", "{dir}"], ["er", "{ihm}"], ["sie", "{ihr}"], ["es", "{ihm}"], ["wir", "{uns}"], ["ihr", "{euch}"], ["sie", "{ihnen}"], ["Sie", "{Ihnen}"]
                    ] } },
            { p: "{Die Jacke gefällt mir.} (Saya suka jaket itu.) {Das Hemd passt dir.} {Der Pullover gehört ihm.} {Das Essen schmeckt uns.}" },
            { p: "**Welcher? Dieser?** Kedua kata ini mengikuti akhiran artikel." },
            { tb: { h: ["Jenis", "Welcher? (yang mana)", "dieser (yang ini)"], r: [
                        ["der", "{welcher Pullover}", "{dieser Pullover}"], ["die", "{welche Hose}", "{diese Hose}"], ["das", "{welches Hemd}", "{dieses Hemd}"], ["jamak", "{welche Schuhe}", "{diese Schuhe}"]
                    ] } },
            { tip: "**Partizip II kata kerja terpisah:** {ge-} diselipkan di tengah, misalnya {aufstehen} → {aufgestanden}, {einkaufen} → {eingekauft}, {anrufen} → {angerufen}. **Awalan tak terpisah** ({be-, ver-, er-, ent-}) tidak memakai {ge-}: {bekommen} → {bekommen}, {verstehen} → {verstanden}." }
        ],
        v: [["die Jacke", "jaket", "YA-ke"], ["die Hose", "celana", "HO-ze"], ["das Hemd", "kemeja", "hemt"], ["das T-Shirt", "kaos", "TI-syört"], ["der Pullover", "sweter", "pu-LO-ver"], ["das Kleid", "gaun", "klait"], ["der Rock", "rok", "rok"], ["die Schuhe", "sepatu", "SYU-e"], ["die Größe", "ukuran", "GRÖ-se"], ["das Kaufhaus", "pusat perbelanjaan", "KAUF-haus"], ["teuer / billig", "mahal / murah", "TOY-er / BIL-likh"], ["passen", "cocok", "PA-sen"], ["gefallen", "disukai", "ge-FA-len"], ["anprobieren", "mencoba pakaian", "AN-pro-bi-ren"]],
        e: [["Die Jacke gefällt mir.", "Saya suka jaket itu."], ["Welches Hemd gefällt dir? – Dieses.", "Kemeja yang mana kamu suka? – Yang ini."], ["Die Hose passt ihm nicht.", "Celana itu tidak cocok untuknya."], ["Haben Sie die Schuhe in Größe 38?", "Apakah ada sepatu ukuran 38?"], ["Das ist zu teuer für mich.", "Itu terlalu mahal untuk saya."]],
        q: [
            { q: "Die Jacke gefällt ___. (aku)", o: ["mir", "mich", "ich", "mein"], y: "gefallen + dativ: mir." },
            { q: "Das Hemd passt ___. (kamu)", o: ["dir", "dich", "du", "dein"], y: "passen + dativ: dir." },
            { q: "“Yang mana” untuk die Hose: ___ Hose?", o: ["Welche", "Welcher", "Welches", "Welchen"], y: "die → welche." },
            { q: "“Ini” untuk das Hemd: ___ Hemd.", o: ["Dieses", "Dieser", "Diese", "Diesen"], y: "das → dieses." },
            { q: "Partizip II dari einkaufen adalah...", o: ["eingekauft", "geeinkauft", "einkauft", "gekauft ein"], y: "ge- diselipkan: ein-ge-kauft." },
            { q: "Partizip II dari verstehen adalah...", o: ["verstanden", "geverstanden", "verstehen", "verstandt"], y: "Awalan ver- tidak memakai ge-." }
        ]
    },
    {
        t: "Ab in den Urlaub!", sub: "Liburan, cuaca, kartu pos", pr: "Kenali saja",
        goal: "Kamu bisa membicarakan liburan, cuaca, menulis kartu pos, dan memakai man, denn, serta kata tanya kasus.",
        c: [
            { p: "{man} berarti “orang pada umumnya”: {Man kann hier schwimmen.} (Orang bisa berenang di sini.)" },
            { p: "{denn} (sebab) menyambung dua kalimat tanpa mengubah urutan: {Ich bleibe zu Hause, denn ich bin krank.}" },
            { p: "**Kata tanya sesuai kasus:**" },
            { tb: { h: ["Kata tanya", "Kasus", "Contoh"], r: [
                        ["{Wer?}", "nominatif (siapa, pelaku)", "{Wer kommt?}"], ["{Wen?}", "akusatif (siapa, objek)", "{Wen besucht Anna?}"], ["{Wem?}", "dativ (kepada siapa)", "{Wem gehört das Buch?}"], ["{Was?}", "nominatif / akusatif (apa)", "{Was machst du?}"]
                    ] } },
            { p: "**Keterangan waktu:** {im Juli} / {im Sommer}, {am Wochenende}, {um acht Uhr}, {nach dem Frühstück}, {vor der Reise}." },
            { p: "**Cuaca:** {Es regnet.} (hujan) {Es schneit.} (bersalju) {Es ist sonnig / warm / kalt / windig.}" },
            { tb: { h: ["Bagian kartu pos", "Contoh"], r: [
                        ["Pembuka", "{Liebe Anna,}"], ["Isi", "{wir sind in Bali. Das Wetter ist schön und das Hotel ist toll.}"], ["Penutup", "{Viele Grüße, Siti}"]
                    ] } }
        ],
        v: [["der Urlaub", "liburan", "UR-laup"], ["die Reise", "perjalanan", "RAI-ze"], ["das Wetter", "cuaca", "VE-ter"], ["die Sonne", "matahari", "ZO-ne"], ["der Regen / regnen", "hujan", "RE-gen"], ["das Hotel", "hotel", "ho-TEL"], ["der Strand", "pantai", "syTRANT"], ["der Koffer", "koper", "KO-fer"], ["die Postkarte", "kartu pos", "POST-kar-te"], ["die Sehenswürdigkeit", "tempat wisata", "ZE-ens-vür-dikh-kait"], ["die Stadttour", "tur kota", "syTAT-tur"], ["sonnig", "cerah", "ZO-nikh"], ["kalt / warm", "dingin / hangat", "kalt / varm"], ["Viele Grüße", "salam hangat (penutup)", "FI-le GRÜ-se"]],
        e: [["Im Sommer fahren wir in den Urlaub.", "Di musim panas kami berlibur."], ["Heute regnet es, aber morgen ist es sonnig.", "Hari ini hujan, tetapi besok cerah."], ["Man kann hier gut essen.", "Orang bisa makan enak di sini."], ["Wem gehört der Koffer?", "Koper ini milik siapa?"], ["Liebe Anna, viele Grüße aus Bali! Siti", "Anna tersayang, salam hangat dari Bali! Siti"]],
        q: [
            { q: "“Es regnet” artinya...", o: ["Hujan.", "Bersalju.", "Cerah.", "Berangin."], y: "regnen = hujan." },
            { q: "Kata penghubung “sebab” adalah...", o: ["denn", "aber", "oder", "und"], y: "denn = sebab." },
            { q: "___ gehört das Buch? (milik siapa, dativ)", o: ["Wem", "Wer", "Wen", "Was"], y: "gehören + dativ → Wem." },
            { q: "“Pada musim panas” dalam bahasa Jerman?", o: ["im Sommer", "am Sommer", "um Sommer", "in Sommer"], y: "Musim dan bulan memakai im." },
            { q: "“Liebe Anna,” dipakai untuk...", o: ["membuka kartu pos", "menutup kartu pos", "menanyakan cuaca", "memesan hotel"], y: "Pembuka surat atau kartu pos akrab." },
            { q: "Man kann hier schwimmen. Man berarti...", o: ["orang pada umumnya", "laki-laki", "dia", "kamu"], y: "man = orang pada umumnya." }
        ]
    }
];
/* ===== Kosakata lengkap per bab =====
   ext: data tambahan untuk kata yang sudah ada -> [plural, contoh Jerman, arti contoh, kategori]
   add: kata baru -> [kata, arti, pelafalan, plural, contoh Jerman, arti contoh, kategori]
   "-" = tidak punya bentuk jamak (kata kerja, sifat, ungkapan). */
const VCAT = { sapa: "Sapaan & ungkapan", angka: "Angka, hari & waktu", orang: "Orang & keluarga", negara: "Negara & bahasa", kota: "Kota & transportasi", makan: "Makanan & minuman", rumah: "Rumah & perabot", tubuh: "Tubuh & kesehatan", kerja: "Pekerjaan & kantor", baju: "Pakaian & belanja", libur: "Liburan & cuaca", hobi: "Hobi & waktu luang", verb: "Kata kerja", sifat: "Kata sifat & keterangan", tugas: "Kata depan & kata tugas" };
const VX = {
    1: { ext: {
            "Hallo": ["-", "Hallo, ich bin Anna.", "Halo, saya Anna.", "sapa"],
            "Guten Morgen": ["-", "Guten Morgen, Frau Weber!", "Selamat pagi, Bu Weber!", "sapa"],
            "Guten Tag": ["-", "Guten Tag, Herr Schmidt!", "Selamat siang, Pak Schmidt!", "sapa"],
            "Guten Abend": ["-", "Guten Abend! Wie geht es Ihnen?", "Selamat malam! Apa kabar Anda?", "sapa"],
            "Tschüss": ["-", "Tschüss, bis morgen!", "Dah, sampai besok!", "sapa"],
            "Auf Wiedersehen": ["-", "Auf Wiedersehen, Herr Müller!", "Sampai jumpa, Pak Müller!", "sapa"],
            "Danke": ["-", "Danke, gut!", "Baik, terima kasih!", "sapa"],
            "Bitte": ["-", "Bitte schön!", "Sama-sama! / Silakan!", "sapa"],
            "Entschuldigung": ["-", "Entschuldigung, wie heißen Sie?", "Maaf, siapa nama Anda?", "sapa"],
            "Freut mich": ["-", "Ich heiße Budi. – Freut mich!", "Nama saya Budi. – Senang berkenalan!", "sapa"],
            "Indonesien": ["-", "Ich komme aus Indonesien.", "Saya berasal dari Indonesia.", "negara"],
            "Deutschland": ["-", "Berlin liegt in Deutschland.", "Berlin terletak di Jerman.", "negara"],
            "zwanzig": ["-", "Ich bin zwanzig Jahre alt.", "Umur saya dua puluh tahun.", "angka"],
            "hundert": ["-", "Das kostet hundert Euro.", "Harganya seratus euro.", "angka"]
        },
        add: [
            ["der Name", "nama", "NA-me", "die Namen", "Mein Name ist Siti.", "Nama saya Siti.", "orang"],
            ["heißen", "bernama", "HAI-sen", "-", "Wie heißt du?", "Siapa namamu?", "verb"],
            ["wohnen", "tinggal", "VO-nen", "-", "Wir wohnen in Medan.", "Kami tinggal di Medan.", "verb"],
            ["Herr / Frau", "Bapak / Ibu (sapaan)", "her / frau", "die Herren / die Frauen", "Das ist Herr Klein und das ist Frau Wagner.", "Ini Pak Klein dan ini Bu Wagner.", "orang"],
            ["die Telefonnummer", "nomor telepon", "te-le-FON-nu-mer", "die Telefonnummern", "Meine Telefonnummer ist 0176 234 589.", "Nomor telepon saya 0176 234 589.", "orang"],
            ["die Sprache", "bahasa", "SYPRA-khe", "die Sprachen", "Welche Sprachen sprichst du?", "Bahasa apa saja yang kamu kuasai?", "negara"]
        ] },
    2: { ext: {
            "das Hobby": ["die Hobbys", "Mein Hobby ist Musik.", "Hobi saya musik.", "hobi"],
            "Fußball spielen": ["-", "Am Samstag spielen wir Fußball.", "Hari Sabtu kami bermain sepak bola.", "hobi"],
            "Musik hören": ["-", "Ich höre gern Musik.", "Saya suka mendengarkan musik.", "hobi"],
            "lesen": ["-", "Sie liest gern Bücher.", "Dia (perempuan) suka membaca buku.", "verb"],
            "kochen": ["-", "Mein Vater kocht sehr gut.", "Ayah saya memasak dengan sangat baik.", "verb"],
            "schwimmen": ["-", "Wir schwimmen am Sonntag.", "Kami berenang hari Minggu.", "verb"],
            "tanzen": ["-", "Tanzt du gern?", "Apakah kamu suka menari?", "verb"],
            "der Freund / die Freundin": ["die Freunde / die Freundinnen", "Das ist meine Freundin Lisa.", "Ini teman saya, Lisa.", "orang"],
            "der Kollege / die Kollegin": ["die Kollegen / die Kolleginnen", "Mein Kollege kommt aus Spanien.", "Rekan kerja saya berasal dari Spanyol.", "orang"],
            "die Zeit": ["die Zeiten", "Ich habe heute keine Zeit.", "Hari ini saya tidak punya waktu.", "angka"],
            "leider": ["-", "Ich kann leider nicht kommen.", "Sayangnya saya tidak bisa datang.", "sifat"],
            "gern": ["-", "Ich trinke gern Tee.", "Saya suka minum teh.", "sifat"],
            "das Wochenende": ["die Wochenenden", "Was machst du am Wochenende?", "Apa yang kamu lakukan di akhir pekan?", "angka"]
        },
        add: [
            ["spielen", "bermain", "SYPI-len", "-", "Die Kinder spielen im Park.", "Anak-anak bermain di taman.", "verb"],
            ["arbeiten", "bekerja", "AR-bai-ten", "-", "Er arbeitet in einem Hotel.", "Dia (laki-laki) bekerja di sebuah hotel.", "verb"],
            ["fotografieren", "memotret", "fo-to-gra-FI-ren", "-", "Ich fotografiere gern.", "Saya suka memotret.", "hobi"],
            ["joggen", "jogging", "DYO-gen", "-", "Wir joggen jeden Morgen.", "Kami jogging setiap pagi.", "hobi"],
            ["der Film", "film", "film", "die Filme", "Wir sehen heute einen Film.", "Hari ini kami menonton film.", "hobi"],
            ["das Buch", "buku", "bukh", "die Bücher", "Das Buch ist interessant.", "Buku itu menarik.", "hobi"],
            ["die Woche", "minggu (tujuh hari)", "VO-khe", "die Wochen", "Die Woche hat sieben Tage.", "Satu minggu ada tujuh hari.", "angka"]
        ] },
    3: { ext: {
            "der Bahnhof": ["die Bahnhöfe", "Der Bahnhof ist im Zentrum.", "Stasiunnya ada di pusat kota.", "kota"],
            "die Bank": ["die Banken (bank) / die Bänke (bangku)", "Die Bank ist heute geschlossen.", "Bank itu tutup hari ini.", "kota"],
            "die Apotheke": ["die Apotheken", "Gibt es hier eine Apotheke?", "Apakah di sini ada apotek?", "kota"],
            "das Café": ["die Cafés", "Das Café ist klein und gemütlich.", "Kafe itu kecil dan nyaman.", "kota"],
            "das Kino": ["die Kinos", "Gehen wir heute ins Kino?", "Hari ini kita ke bioskop, yuk?", "kota"],
            "der Supermarkt": ["die Supermärkte", "Der Supermarkt ist bis 20 Uhr offen.", "Supermarketnya buka sampai pukul 20.", "kota"],
            "die Haltestelle": ["die Haltestellen", "Wo ist die Haltestelle?", "Di mana haltenya?", "kota"],
            "der Bus": ["die Busse", "Der Bus kommt um acht Uhr.", "Busnya datang pukul delapan.", "kota"],
            "die U-Bahn": ["die U-Bahnen", "Die U-Bahn ist schnell.", "Kereta bawah tanah itu cepat.", "kota"],
            "das Fahrrad": ["die Fahrräder", "Ich fahre mit dem Fahrrad.", "Saya naik sepeda.", "kota"],
            "links": ["-", "Die Apotheke ist links.", "Apoteknya di sebelah kiri.", "sifat"],
            "rechts": ["-", "Gehen Sie hier rechts.", "Di sini belok kanan.", "sifat"],
            "geradeaus": ["-", "Gehen Sie immer geradeaus.", "Jalan lurus terus.", "sifat"],
            "die Stadt": ["die Städte", "Hamburg ist eine große Stadt.", "Hamburg adalah kota besar.", "kota"]
        },
        add: [
            ["die Straße", "jalan", "SYTRA-se", "die Straßen", "Ich wohne in der Bahnhofstraße.", "Saya tinggal di Jalan Bahnhof.", "kota"],
            ["das Museum", "museum", "mu-ZE-um", "die Museen", "Das Museum ist am Montag geschlossen.", "Museumnya tutup hari Senin.", "kota"],
            ["der Zug", "kereta api", "tsuk", "die Züge", "Der Zug fährt nach Berlin.", "Kereta itu berangkat ke Berlin.", "kota"],
            ["das Auto", "mobil", "AU-to", "die Autos", "Mein Auto ist rot.", "Mobil saya merah.", "kota"],
            ["weit / nah", "jauh / dekat", "vait / na", "-", "Ist der Bahnhof weit? – Nein, er ist nah.", "Apakah stasiunnya jauh? – Tidak, dekat.", "sifat"],
            ["fahren", "naik kendaraan / berkendara", "FA-ren", "-", "Ich fahre mit dem Zug.", "Saya naik kereta.", "verb"]
        ] },
    4: { ext: {
            "das Brot": ["die Brote", "Ich esse morgens Brot mit Käse.", "Pagi hari saya makan roti dengan keju.", "makan"],
            "der Reis": ["tidak ada jamak", "In Indonesien isst man viel Reis.", "Di Indonesia orang makan banyak nasi.", "makan"],
            "die Nudeln": ["bentuk jamak (tunggal: die Nudel)", "Die Nudeln sind lecker.", "Mi-nya enak.", "makan"],
            "das Fleisch": ["tidak ada jamak", "Ich esse kein Fleisch.", "Saya tidak makan daging.", "makan"],
            "der Fisch": ["die Fische", "Der Fisch ist frisch.", "Ikannya segar.", "makan"],
            "das Gemüse": ["tidak ada jamak", "Gemüse ist gesund.", "Sayur itu sehat.", "makan"],
            "das Obst": ["tidak ada jamak", "Ich kaufe Obst auf dem Markt.", "Saya membeli buah di pasar.", "makan"],
            "die Kartoffel": ["die Kartoffeln", "Ich möchte Fisch mit Kartoffeln.", "Saya mau ikan dengan kentang.", "makan"],
            "die Flasche": ["die Flaschen", "Eine Flasche Wasser, bitte.", "Satu botol air, tolong.", "makan"],
            "das Glas": ["die Gläser", "Ich trinke ein Glas Milch.", "Saya minum segelas susu.", "makan"],
            "das Kilo": ["die Kilos", "Ein Kilo Äpfel kostet drei Euro.", "Satu kilo apel harganya tiga euro.", "makan"],
            "die Packung": ["die Packungen", "Ich brauche eine Packung Nudeln.", "Saya perlu satu bungkus mi.", "makan"],
            "kosten": ["-", "Was kostet der Tee?", "Berapa harga tehnya?", "verb"],
            "die Rechnung": ["die Rechnungen", "Die Rechnung, bitte!", "Minta bonnya!", "makan"]
        },
        add: [
            ["der Kaffee", "kopi", "KA-fe", "die Kaffees", "Ich trinke morgens Kaffee.", "Saya minum kopi di pagi hari.", "makan"],
            ["der Tee", "teh", "te", "die Tees", "Möchtest du einen Tee?", "Kamu mau teh?", "makan"],
            ["das Wasser", "air", "VA-ser", "tidak dipakai dalam bentuk jamak", "Ich trinke viel Wasser.", "Saya minum banyak air.", "makan"],
            ["der Apfel", "apel", "AP-fel", "die Äpfel", "Der Apfel ist rot.", "Apelnya merah.", "makan"],
            ["die Milch", "susu", "milh", "tidak ada jamak", "Ich trinke Kaffee mit Milch.", "Saya minum kopi dengan susu.", "makan"],
            ["das Ei", "telur", "ai", "die Eier", "Ich esse zwei Eier zum Frühstück.", "Saya makan dua telur untuk sarapan.", "makan"]
        ] },
    5: { ext: {
            "die Uhr": ["die Uhren", "Es ist acht Uhr.", "Sekarang pukul delapan.", "angka"],
            "der Termin": ["die Termine", "Ich habe um zehn Uhr einen Termin.", "Saya punya janji pukul sepuluh.", "angka"],
            "die Familie": ["die Familien", "Meine Familie ist groß.", "Keluarga saya besar.", "orang"],
            "die Mutter": ["die Mütter", "Meine Mutter ist Lehrerin.", "Ibu saya seorang guru.", "orang"],
            "der Vater": ["die Väter", "Mein Vater arbeitet viel.", "Ayah saya banyak bekerja.", "orang"],
            "die Eltern": ["hanya bentuk jamak", "Meine Eltern wohnen in Bogor.", "Orang tua saya tinggal di Bogor.", "orang"],
            "der Bruder": ["die Brüder", "Mein Bruder ist zwölf.", "Saudara laki-laki saya berumur dua belas tahun.", "orang"],
            "die Schwester": ["die Schwestern", "Hast du eine Schwester?", "Apakah kamu punya saudara perempuan?", "orang"],
            "der Sohn": ["die Söhne", "Ihr Sohn heißt Tim.", "Anak laki-lakinya bernama Tim.", "orang"],
            "die Tochter": ["die Töchter", "Unsere Tochter ist drei Jahre alt.", "Anak perempuan kami berumur tiga tahun.", "orang"],
            "die Oma / der Opa": ["die Omas / die Opas", "Meine Oma kocht sehr gut.", "Nenek saya memasak sangat enak.", "orang"],
            "früh": ["-", "Ich stehe früh auf.", "Saya bangun pagi-pagi.", "sifat"],
            "spät": ["-", "Es ist schon spät.", "Sudah larut.", "sifat"]
        },
        add: [
            ["das Kind", "anak", "kint", "die Kinder", "Wir haben zwei Kinder.", "Kami punya dua anak.", "orang"],
            ["die Geschwister", "saudara kandung", "ge-SYVIS-ter", "hanya bentuk jamak", "Hast du Geschwister?", "Apakah kamu punya saudara kandung?", "orang"],
            ["der Mann", "pria / suami", "man", "die Männer", "Ihr Mann heißt Peter.", "Suaminya bernama Peter.", "orang"],
            ["die Frau", "wanita / istri", "frau", "die Frauen", "Seine Frau ist Ärztin.", "Istrinya seorang dokter.", "orang"],
            ["frühstücken", "sarapan", "FRÜ-sytü-ken", "-", "Ich frühstücke um sieben Uhr.", "Saya sarapan pukul tujuh.", "verb"],
            ["heute", "hari ini", "HOY-te", "-", "Heute ist Montag.", "Hari ini hari Senin.", "angka"],
            ["morgen", "besok", "MOR-gen", "-", "Morgen habe ich frei.", "Besok saya libur.", "angka"]
        ] },
    6: { ext: {
            "der Monat": ["die Monate", "Ein Jahr hat zwölf Monate.", "Satu tahun ada dua belas bulan.", "angka"],
            "das Jahr": ["die Jahre", "Das Jahr hat 365 Tage.", "Satu tahun ada 365 hari.", "angka"],
            "der Frühling": ["die Frühlinge (jarang)", "Im Frühling ist das Wetter schön.", "Pada musim semi cuacanya bagus.", "libur"],
            "der Sommer": ["die Sommer", "Im Sommer ist es heiß.", "Pada musim panas cuacanya panas.", "libur"],
            "der Herbst": ["die Herbste (jarang)", "Im Herbst regnet es oft.", "Pada musim gugur sering hujan.", "libur"],
            "der Winter": ["die Winter", "Im Winter schneit es.", "Pada musim dingin turun salju.", "libur"],
            "das Datum": ["die Daten", "Welches Datum ist heute?", "Tanggal berapa hari ini?", "angka"],
            "der Geburtstag": ["die Geburtstage", "Wann hast du Geburtstag?", "Kapan ulang tahunmu?", "angka"],
            "die Party": ["die Partys", "Die Party beginnt um acht.", "Pestanya mulai pukul delapan.", "hobi"],
            "die Freizeit": ["tidak ada jamak", "In der Freizeit lese ich.", "Di waktu luang saya membaca.", "hobi"],
            "aufstehen": ["-", "Wann stehst du auf?", "Kapan kamu bangun?", "verb"],
            "einladen": ["-", "Ich lade meine Freunde ein.", "Saya mengundang teman-teman saya.", "verb"],
            "abholen": ["-", "Holst du mich am Bahnhof ab?", "Kamu menjemputku di stasiun?", "verb"],
            "mitkommen": ["-", "Kommst du ins Kino mit?", "Kamu ikut ke bioskop?", "verb"]
        },
        add: [
            ["anrufen", "menelepon", "AN-ru-fen", "-", "Ich rufe dich morgen an.", "Besok saya meneleponmu.", "verb"],
            ["einkaufen", "berbelanja", "AIN-kau-fen", "-", "Wir kaufen am Samstag ein.", "Kami berbelanja hari Sabtu.", "verb"],
            ["fernsehen", "menonton TV", "FERN-ze-en", "-", "Am Abend sehe ich fern.", "Malam hari saya menonton TV.", "verb"],
            ["das Geschenk", "hadiah", "ge-SYENK", "die Geschenke", "Das Geschenk ist für dich.", "Hadiah ini untukmu.", "hobi"],
            ["die Einladung", "undangan", "AIN-la-dung", "die Einladungen", "Danke für die Einladung!", "Terima kasih atas undangannya!", "hobi"],
            ["der Tag", "hari", "tak", "die Tage", "Ich lerne jeden Tag Deutsch.", "Saya belajar bahasa Jerman setiap hari.", "angka"]
        ] },
    7: { ext: {
            "das Büro": ["die Büros", "Ich bin heute im Büro.", "Hari ini saya di kantor.", "kerja"],
            "die Arbeit": ["die Arbeiten", "Ich fahre mit dem Bus zur Arbeit.", "Saya naik bus ke tempat kerja.", "kerja"],
            "der Chef / die Chefin": ["die Chefs / die Chefinnen", "Meine Chefin ist sehr nett.", "Atasan saya (perempuan) sangat baik.", "kerja"],
            "der Computer": ["die Computer", "Der Computer ist kaputt.", "Komputernya rusak.", "kerja"],
            "der Drucker": ["die Drucker", "Der Drucker funktioniert nicht.", "Printernya tidak berfungsi.", "kerja"],
            "drucken": ["-", "Ich drucke den Brief.", "Saya mencetak surat itu.", "verb"],
            "die E-Mail": ["die E-Mails", "Ich schreibe eine E-Mail.", "Saya menulis surel.", "kerja"],
            "das Telefon": ["die Telefone", "Das Telefon klingelt.", "Teleponnya berdering.", "kerja"],
            "der Brief": ["die Briefe", "Der Brief ist für Sie.", "Surat ini untuk Anda.", "kerja"],
            "die Pause": ["die Pausen", "Um zwölf Uhr machen wir Pause.", "Pukul dua belas kami istirahat.", "kerja"],
            "die Medien": ["bentuk jamak (tunggal: das Medium)", "Wir arbeiten viel mit Medien.", "Kami banyak bekerja dengan media.", "kerja"],
            "der Stress": ["tidak ada jamak", "Ich habe heute viel Stress.", "Hari ini saya sangat stres.", "kerja"],
            "bei": ["-", "Ich arbeite bei Siemens.", "Saya bekerja di Siemens.", "tugas"]
        },
        add: [
            ["der Kunde / die Kundin", "pelanggan", "KUN-de / KUN-din", "die Kunden / die Kundinnen", "Der Kunde wartet im Büro.", "Pelanggan menunggu di kantor.", "kerja"],
            ["das Meeting", "rapat", "MI-ting", "die Meetings", "Das Meeting beginnt um neun.", "Rapatnya mulai pukul sembilan.", "kerja"],
            ["schreiben", "menulis", "SYRAI-ben", "-", "Ich schreibe eine Nachricht.", "Saya menulis pesan.", "verb"],
            ["die Nachricht", "pesan / berita", "NAKH-riht", "die Nachrichten", "Ich habe eine Nachricht für dich.", "Saya punya pesan untukmu.", "kerja"],
            ["beginnen", "mulai", "be-GI-nen", "-", "Die Arbeit beginnt um acht.", "Pekerjaan mulai pukul delapan.", "verb"],
            ["müde", "lelah", "MÜ-de", "-", "Nach der Arbeit bin ich müde.", "Setelah bekerja saya lelah.", "sifat"],
            ["mit", "dengan / naik", "mit", "-", "Ich fahre mit dem Zug.", "Saya naik kereta.", "tugas"]
        ] },
    8: { ext: {
            "der Kopf": ["die Köpfe", "Mein Kopf tut weh.", "Kepala saya sakit.", "tubuh"],
            "der Bauch": ["die Bäuche", "Ich habe Bauchschmerzen.", "Saya sakit perut.", "tubuh"],
            "der Rücken": ["die Rücken", "Mein Rücken tut weh.", "Punggung saya sakit.", "tubuh"],
            "der Arm": ["die Arme", "Ich habe Schmerzen im Arm.", "Lengan saya terasa sakit.", "tubuh"],
            "das Bein": ["die Beine", "Mein Bein tut weh.", "Kaki saya sakit.", "tubuh"],
            "die Hand": ["die Hände", "Meine Hand ist kalt.", "Tangan saya dingin.", "tubuh"],
            "der Hals": ["die Hälse", "Ich habe Halsschmerzen.", "Saya sakit tenggorokan.", "tubuh"],
            "der Zahn": ["die Zähne", "Ich habe Zahnschmerzen.", "Saya sakit gigi.", "tubuh"],
            "der Arzt / die Ärztin": ["die Ärzte / die Ärztinnen", "Ich muss zum Arzt gehen.", "Saya harus pergi ke dokter.", "tubuh"],
            "krank": ["-", "Ich bin krank und bleibe zu Hause.", "Saya sakit dan tinggal di rumah.", "sifat"],
            "gesund": ["-", "Obst ist gesund.", "Buah itu sehat.", "sifat"],
            "die Tablette": ["die Tabletten", "Nehmen Sie dreimal täglich eine Tablette.", "Minumlah satu tablet tiga kali sehari.", "tubuh"],
            "das Fieber": ["tidak ada jamak", "Das Kind hat Fieber.", "Anak itu demam.", "tubuh"],
            "die Schmerzen": ["bentuk jamak (tunggal: der Schmerz)", "Wo haben Sie Schmerzen?", "Di mana Anda merasa sakit?", "tubuh"]
        },
        add: [
            ["das Auge", "mata", "AU-ge", "die Augen", "Meine Augen sind müde.", "Mata saya lelah.", "tubuh"],
            ["das Ohr", "telinga", "or", "die Ohren", "Mein Ohr tut weh.", "Telinga saya sakit.", "tubuh"],
            ["wehtun", "terasa sakit", "VE-tun", "-", "Was tut Ihnen weh?", "Apa yang terasa sakit?", "verb"],
            ["die Erkältung", "pilek / flu ringan", "er-KEL-tung", "die Erkältungen", "Ich habe eine Erkältung.", "Saya pilek.", "tubuh"],
            ["die Praxis", "tempat praktik dokter", "PRAK-sis", "die Praxen", "Die Praxis ist am Freitag geschlossen.", "Tempat praktiknya tutup hari Jumat.", "tubuh"],
            ["schlafen", "tidur", "SYLA-fen", "-", "Du musst viel schlafen.", "Kamu harus banyak tidur.", "verb"]
        ] },
    9: { ext: {
            "das Zimmer": ["die Zimmer", "Das Zimmer ist hell.", "Kamarnya terang.", "rumah"],
            "das Wohnzimmer": ["die Wohnzimmer", "Wir sehen im Wohnzimmer fern.", "Kami menonton TV di ruang tamu.", "rumah"],
            "das Schlafzimmer": ["die Schlafzimmer", "Das Schlafzimmer ist klein.", "Kamar tidurnya kecil.", "rumah"],
            "die Küche": ["die Küchen", "Die Küche ist modern.", "Dapurnya modern.", "rumah"],
            "das Bad": ["die Bäder", "Das Bad ist neben der Küche.", "Kamar mandi ada di sebelah dapur.", "rumah"],
            "der Balkon": ["die Balkone / die Balkons", "Die Wohnung hat einen Balkon.", "Apartemen itu punya balkon.", "rumah"],
            "das Sofa": ["die Sofas", "Das Sofa ist bequem.", "Sofanya nyaman.", "rumah"],
            "der Tisch": ["die Tische", "Der Tisch ist aus Holz.", "Mejanya terbuat dari kayu.", "rumah"],
            "der Stuhl": ["die Stühle", "Wir brauchen vier Stühle.", "Kami perlu empat kursi.", "rumah"],
            "der Schrank": ["die Schränke", "Die Kleidung ist im Schrank.", "Pakaiannya ada di dalam lemari.", "rumah"],
            "das Bett": ["die Betten", "Das Bett steht im Schlafzimmer.", "Tempat tidurnya ada di kamar tidur.", "rumah"],
            "groß / klein": ["-", "Das Haus ist groß, aber die Küche ist klein.", "Rumahnya besar, tetapi dapurnya kecil.", "sifat"],
            "rot, blau, grün": ["-", "Das Sofa ist blau.", "Sofanya biru.", "sifat"],
            "gelb, weiß, schwarz": ["-", "Die Wand ist weiß.", "Dindingnya putih.", "sifat"]
        },
        add: [
            ["die Wohnung", "apartemen / tempat tinggal", "VO-nung", "die Wohnungen", "Die Wohnung hat drei Zimmer.", "Apartemen itu punya tiga kamar.", "rumah"],
            ["das Haus", "rumah", "haus", "die Häuser", "Unser Haus hat einen Garten.", "Rumah kami punya kebun.", "rumah"],
            ["die Miete", "uang sewa", "MI-te", "die Mieten", "Die Miete kostet 600 Euro.", "Sewanya 600 euro.", "rumah"],
            ["die Lampe", "lampu", "LAM-pe", "die Lampen", "Die Lampe ist neu.", "Lampunya baru.", "rumah"],
            ["hell / dunkel", "terang / gelap", "hel / DUN-kel", "-", "Das Zimmer ist hell, der Flur ist dunkel.", "Kamarnya terang, lorongnya gelap.", "sifat"],
            ["stehen / liegen / hängen", "berdiri / terletak / tergantung", "SYTE-en / LI-gen / HEN-gen", "-", "Das Buch liegt auf dem Tisch.", "Buku itu terletak di atas meja.", "verb"]
        ] },
    10: { ext: {
            "der Beruf": ["die Berufe", "Was sind Sie von Beruf?", "Apa pekerjaan Anda?", "kerja"],
            "der Job": ["die Jobs", "Ich suche einen Job.", "Saya mencari pekerjaan.", "kerja"],
            "das Studium": ["die Studien", "Mein Studium dauert vier Jahre.", "Kuliah saya berlangsung empat tahun.", "kerja"],
            "studieren": ["-", "Sie studiert Medizin in Berlin.", "Dia (perempuan) kuliah kedokteran di Berlin.", "verb"],
            "der Lehrer / die Lehrerin": ["die Lehrer / die Lehrerinnen", "Meine Lehrerin heißt Frau Koch.", "Guru saya bernama Bu Koch.", "kerja"],
            "der Verkäufer": ["die Verkäufer (perempuan: die Verkäuferin)", "Der Verkäufer ist freundlich.", "Penjualnya ramah.", "kerja"],
            "der Koch / die Köchin": ["die Köche / die Köchinnen", "Der Koch arbeitet im Restaurant.", "Koki itu bekerja di restoran.", "kerja"],
            "der Ingenieur": ["die Ingenieure (perempuan: die Ingenieurin)", "Mein Bruder ist Ingenieur.", "Saudara laki-laki saya insinyur.", "kerja"],
            "die Firma": ["die Firmen", "Die Firma ist in München.", "Perusahaannya ada di München.", "kerja"],
            "die Bewerbung": ["die Bewerbungen", "Ich schreibe eine Bewerbung.", "Saya menulis lamaran kerja.", "kerja"],
            "telefonieren": ["-", "Ich telefoniere mit meiner Mutter.", "Saya menelepon ibu saya.", "verb"],
            "gestern": ["-", "Gestern habe ich viel gearbeitet.", "Kemarin saya banyak bekerja.", "angka"],
            "letzte Woche": ["-", "Letzte Woche war ich in Bali.", "Minggu lalu saya di Bali.", "angka"]
        },
        add: [
            ["der Student / die Studentin", "mahasiswa / mahasiswi", "sytu-DENT / sytu-DEN-tin", "die Studenten / die Studentinnen", "Ich bin Student.", "Saya mahasiswa.", "kerja"],
            ["die Universität", "universitas", "u-ni-ver-zi-TET", "die Universitäten", "Die Universität ist groß.", "Universitasnya besar.", "kerja"],
            ["der Arbeitsplatz", "tempat kerja", "AR-baits-plats", "die Arbeitsplätze", "Mein Arbeitsplatz ist im Zentrum.", "Tempat kerja saya di pusat kota.", "kerja"],
            ["verdienen", "berpenghasilan", "fer-DI-nen", "-", "Er verdient gut.", "Penghasilannya bagus.", "verb"],
            ["die Ausbildung", "pendidikan vokasi", "AUS-bil-dung", "die Ausbildungen", "Sie macht eine Ausbildung als Köchin.", "Dia sedang menempuh pendidikan vokasi sebagai koki.", "kerja"],
            ["der Krankenpfleger / die Krankenpflegerin", "perawat", "KRAN-ken-pfle-ger", "die Krankenpfleger / die Krankenpflegerinnen", "Meine Schwester ist Krankenpflegerin.", "Saudara perempuan saya perawat.", "kerja"],
            ["schon", "sudah", "syon", "-", "Hast du schon gegessen?", "Apakah kamu sudah makan?", "sifat"]
        ] },
    11: { ext: {
            "die Jacke": ["die Jacken", "Die Jacke ist warm.", "Jaketnya hangat.", "baju"],
            "die Hose": ["die Hosen", "Die Hose ist zu lang.", "Celananya terlalu panjang.", "baju"],
            "das Hemd": ["die Hemden", "Das Hemd ist blau.", "Kemejanya biru.", "baju"],
            "das T-Shirt": ["die T-Shirts", "Das T-Shirt kostet zehn Euro.", "Kaos itu harganya sepuluh euro.", "baju"],
            "der Pullover": ["die Pullover", "Der Pullover ist aus Wolle.", "Sweter itu terbuat dari wol.", "baju"],
            "das Kleid": ["die Kleider", "Das Kleid gefällt mir.", "Saya suka gaun itu.", "baju"],
            "der Rock": ["die Röcke", "Der Rock ist zu kurz.", "Roknya terlalu pendek.", "baju"],
            "die Schuhe": ["bentuk jamak (tunggal: der Schuh)", "Die Schuhe sind bequem.", "Sepatunya nyaman.", "baju"],
            "die Größe": ["die Größen", "Welche Größe haben Sie?", "Ukuran Anda berapa?", "baju"],
            "das Kaufhaus": ["die Kaufhäuser", "Das Kaufhaus öffnet um zehn Uhr.", "Pusat perbelanjaan buka pukul sepuluh.", "baju"],
            "teuer / billig": ["-", "Die Jacke ist teuer, das T-Shirt ist billig.", "Jaketnya mahal, kaosnya murah.", "sifat"],
            "passen": ["-", "Die Hose passt mir gut.", "Celana itu pas untuk saya.", "verb"],
            "gefallen": ["-", "Gefällt dir das Kleid?", "Kamu suka gaun itu?", "verb"],
            "anprobieren": ["-", "Kann ich die Jacke anprobieren?", "Boleh saya mencoba jaket ini?", "verb"]
        },
        add: [
            ["tragen", "memakai (pakaian)", "TRA-gen", "-", "Im Winter trage ich einen Mantel.", "Di musim dingin saya memakai mantel.", "verb"],
            ["der Mantel", "mantel", "MAN-tel", "die Mäntel", "Der Mantel ist schwarz.", "Mantelnya hitam.", "baju"],
            ["die Kasse", "kasir", "KA-se", "die Kassen", "Bitte zahlen Sie an der Kasse.", "Silakan bayar di kasir.", "baju"],
            ["kaufen", "membeli", "KAU-fen", "-", "Ich kaufe eine Jacke.", "Saya membeli jaket.", "verb"],
            ["die Farbe", "warna", "FAR-be", "die Farben", "Welche Farbe gefällt dir?", "Warna apa yang kamu suka?", "baju"],
            ["gehören", "milik (kepunyaan)", "ge-HÖ-ren", "-", "Die Tasche gehört mir.", "Tas ini milik saya.", "verb"]
        ] },
    12: { ext: {
            "der Urlaub": ["die Urlaube", "Wir machen Urlaub in Bali.", "Kami berlibur di Bali.", "libur"],
            "die Reise": ["die Reisen", "Gute Reise!", "Selamat jalan!", "libur"],
            "das Wetter": ["tidak ada jamak", "Wie ist das Wetter heute?", "Bagaimana cuaca hari ini?", "libur"],
            "die Sonne": ["tidak ada jamak", "Die Sonne scheint.", "Matahari bersinar.", "libur"],
            "der Regen / regnen": ["tidak ada jamak", "Es regnet heute.", "Hari ini hujan.", "libur"],
            "das Hotel": ["die Hotels", "Das Hotel ist am Strand.", "Hotelnya di pantai.", "libur"],
            "der Strand": ["die Strände", "Wir gehen an den Strand.", "Kami pergi ke pantai.", "libur"],
            "der Koffer": ["die Koffer", "Mein Koffer ist schwer.", "Koper saya berat.", "libur"],
            "die Postkarte": ["die Postkarten", "Ich schreibe eine Postkarte.", "Saya menulis kartu pos.", "libur"],
            "die Sehenswürdigkeit": ["die Sehenswürdigkeiten", "Berlin hat viele Sehenswürdigkeiten.", "Berlin punya banyak tempat wisata.", "libur"],
            "die Stadttour": ["die Stadttouren", "Die Stadttour dauert zwei Stunden.", "Tur kotanya berlangsung dua jam.", "libur"],
            "sonnig": ["-", "Morgen ist es sonnig.", "Besok cerah.", "sifat"],
            "kalt / warm": ["-", "Im Januar ist es kalt.", "Pada bulan Januari cuacanya dingin.", "sifat"],
            "Viele Grüße": ["-", "Viele Grüße aus Hamburg!", "Salam hangat dari Hamburg!", "sapa"]
        },
        add: [
            ["der Flughafen", "bandara", "FLUK-ha-fen", "die Flughäfen", "Wir fahren zum Flughafen.", "Kami pergi ke bandara.", "libur"],
            ["das Flugzeug", "pesawat", "FLUK-tsoyk", "die Flugzeuge", "Das Flugzeug landet um zehn.", "Pesawatnya mendarat pukul sepuluh.", "libur"],
            ["das Meer", "laut", "mer", "die Meere", "Das Meer ist blau.", "Lautnya biru.", "libur"],
            ["die Berge", "pegunungan", "BER-ge", "bentuk jamak (tunggal: der Berg)", "Im Urlaub fahren wir in die Berge.", "Saat liburan kami pergi ke pegunungan.", "libur"],
            ["das Ticket", "tiket", "TI-ket", "die Tickets", "Ich habe das Ticket schon.", "Saya sudah punya tiketnya.", "libur"],
            ["reisen", "bepergian", "RAI-zen", "-", "Ich reise gern.", "Saya suka bepergian.", "verb"]
        ] }
};
/* Perbaikan pelafalan agar konsisten dengan tabel ejaan bab 1 (ch lembut = h, ch kasar = kh, tsch = c) */
const PRFIX = { "1|Tschüss": "cüs", "1|Deutschland": "DOYC-lant", "1|zwanzig": "TSVAN-tsih", "3|rechts": "rehts", "3|die Stadt": "sytat", "4|die Rechnung": "REH-nung", "5|spät": "sypet", "7|der Stress": "sytres", "9|die Küche": "KÜ-he", "10|studieren": "sytu-DI-ren", "10|das Studium": "SYTU-di-um", "10|der Ingenieur": "in-zye-NYÖR", "11|teuer / billig": "TOY-er / BIL-lih", "12|sonnig": "ZO-nih", "12|die Sehenswürdigkeit": "ZE-ens-vür-dih-kait", "12|der Strand": "sytrant", "12|die Stadttour": "SYTAT-tur", "2|Fußball spielen": "FUS-bal SYPI-len", "3|die Haltestelle": "HAL-te-syte-le", "1|Entschuldigung": "ent-SYUL-di-gung" };
L.forEach((l, i) => {
    const b = i + 1, x = VX[b];
    if (!x)
        return;
    l.v = l.v.map(v => { const e = x.ext[v[0]]; const pr = PRFIX[b + "|" + v[0]] || v[2]; return e ? [v[0], v[1], pr, e[0], e[1], e[2], e[3]] : [v[0], v[1], pr, "-", "", "", "sifat"]; });
    x.add.forEach(a => l.v.push(a.slice()));
});
/* ===== Pendalaman materi per bab (ditambahkan setelah inti bab) =====
   Jenis blok: p (paragraf), tb (tabel), tip (kotak ingat), h (subjudul), pt (pola: judul, rumus, contoh) */
const CX = {
    1: [
        { h: "Pendalaman: kata ganti orang" },
        { tb: { h: ["Jerman", "Arti", "Catatan"], r: [
                    ["{ich}", "saya / aku", ""], ["{du}", "kamu", "akrab: teman, keluarga, anak"], ["{er}", "dia (laki-laki)", "juga untuk benda der"], ["{sie}", "dia (perempuan)", "juga untuk benda die"], ["{es}", "dia / itu", "untuk benda das, misalnya das Kind"], ["{wir}", "kami / kita", ""], ["{ihr}", "kalian", "akrab"], ["{sie}", "mereka", "huruf kecil"], ["{Sie}", "Anda", "formal, tunggal maupun jamak, selalu huruf besar"]
                ] } },
        { pt: { h: "Memperkenalkan diri", f: "Ich heiße + nama · Ich komme aus + negara · Ich wohne in + kota · Ich bin + angka + Jahre alt", ex: [["Ich heiße Rina.", "Nama saya Rina."], ["Ich komme aus Indonesien und wohne in Yogyakarta.", "Saya berasal dari Indonesia dan tinggal di Yogyakarta."], ["Ich bin 22 Jahre alt.", "Umur saya 22 tahun."], ["Ich spreche Indonesisch, Englisch und ein bisschen Deutsch.", "Saya berbicara bahasa Indonesia, Inggris, dan sedikit bahasa Jerman."]] } },
        { pt: { h: "Bertanya dengan kata tanya W", f: "Wie / Wo / Woher / Wer / Was + kata kerja + subjek ?", ex: [["Wie heißen Sie?", "Siapa nama Anda?"], ["Wer ist das? – Das ist Herr Klein.", "Siapa itu? – Itu Pak Klein."], ["Wie alt bist du? – Ich bin 19.", "Berapa umurmu? – Saya 19 tahun."], ["Welche Sprachen sprichst du?", "Bahasa apa saja yang kamu kuasai?"]] } },
        { tip: "Bentuk {Sie} (Anda) selalu sama dengan bentuk {wir} dan {sie} (mereka): {Wie heißen Sie?}, {Woher kommen Sie?}, {Wo wohnen Sie?}" },
        { p: "**Mengeja nama (buchstabieren).** Di kantor atau di telepon kamu sering ditanya {Wie schreibt man das?} lalu menjawab huruf demi huruf: {M-Ü-L-L-E-R}. Bunyi huruf: A (a), B (be), C (tse), D (de), E (e), F (ef), G (ge), H (ha), I (i), J (yot), K (ka), L (el), M (em), N (en), O (o), P (pe), Q (ku), R (er), S (es), T (te), U (u), V (fau), W (ve), X (iks), Y (ÜP-si-lon), Z (tset), Ä (e panjang), Ö (ö), Ü (ü), ß (es-TSET)." }
    ],
    2: [
        { h: "Pendalaman: konjugasi dan haben" },
        { tb: { h: ["Subjek", "Akhiran", "machen", "haben (tidak beraturan)"], r: [
                    ["ich", "-e", "mache", "habe"], ["du", "-st", "machst", "hast"], ["er / sie / es", "-t", "macht", "hat"], ["wir", "-en", "machen", "haben"], ["ihr", "-t", "macht", "habt"], ["sie / Sie", "-en", "machen", "haben"]
                ] } },
        { tip: "Batang kata berakhiran {s, ß, z}: untuk du cukup tambah {-t}: {du heißt}, {du tanzt}. Batang berakhiran {t} atau {d}: sisipkan {e}: {du arbeitest}, {er findet}." },
        { pt: { h: "Suka dan tidak suka", f: "Subjek + kata kerja + (nicht) gern + ...", ex: [["Ich koche gern.", "Saya suka memasak."], ["Wir tanzen nicht gern.", "Kami tidak suka menari."], ["Was machst du gern? – Ich lese gern.", "Apa yang suka kamu lakukan? – Saya suka membaca."]] } },
        { pt: { h: "Seberapa sering", f: "immer (selalu) · oft (sering) · manchmal (kadang-kadang) · selten (jarang) · nie (tidak pernah)", ex: [["Ich spiele oft Fußball.", "Saya sering bermain sepak bola."], ["Er kocht nie.", "Dia tidak pernah memasak."], ["Manchmal schwimme ich am Sonntag.", "Kadang-kadang saya berenang hari Minggu."]] } },
        { tip: "Kalau keterangan seperti {manchmal}, {heute}, atau {am Samstag} ada di posisi 1, kata kerja **tetap di posisi 2** dan subjek pindah ke belakangnya: {Am Samstag spiele ich Fußball.}" }
    ],
    3: [
        { h: "Pendalaman: kata ganti benda, nicht/kein, es gibt" },
        { pt: { h: "Mengganti kata benda dengan kata ganti", f: "der → er · die → sie · das → es · jamak → sie", ex: [["Wo ist der Bahnhof? – Er ist dort.", "Di mana stasiunnya? – Di sana."], ["Die Apotheke? Sie ist links.", "Apoteknya? Ada di sebelah kiri."], ["Das Kino ist neu. Es ist sehr schön.", "Bioskopnya baru. Bagus sekali."]] } },
        { pt: { h: "nicht atau kein", f: "kein + kata benda (pengganti ein atau tanpa artikel) · nicht + kata kerja, sifat, nama, der/die/das", ex: [["Das ist kein Bahnhof.", "Ini bukan stasiun."], ["Der Bahnhof ist nicht weit.", "Stasiunnya tidak jauh."], ["Das ist nicht der Bus nach Altona.", "Ini bukan bus ke Altona."]] } },
        { pt: { h: "Ada (es gibt)", f: "Es gibt + akusatif", ex: [["Hier gibt es einen Supermarkt.", "Di sini ada supermarket."], ["In Hamburg gibt es viele Brücken.", "Di Hamburg ada banyak jembatan."]] } },
        { tip: "Jawaban {doch} membantah pertanyaan yang negatif: {Ist das kein Kino? – Doch, das ist ein Kino.} Jawaban {ja} hanya untuk pertanyaan positif." }
    ],
    4: [
        { h: "Pendalaman: kata kerja dengan perubahan vokal" },
        { tb: { h: ["Subjek", "essen", "nehmen", "trinken"], r: [
                    ["ich", "esse", "nehme", "trinke"], ["du", "isst", "nimmst", "trinkst"], ["er / sie / es", "isst", "nimmt", "trinkt"], ["wir", "essen", "nehmen", "trinken"], ["ihr", "esst", "nehmt", "trinkt"], ["sie / Sie", "essen", "nehmen", "trinken"]
                ] } },
        { p: "**Kata kerja yang diikuti akusatif:** {haben}, {möchten}, {mögen}, {brauchen}, {kaufen}, {essen}, {trinken}, {nehmen}, {suchen}. Benda yang dipesan, dibeli, atau dimakan berada di akusatif." },
        { pt: { h: "Memesan dan berbelanja", f: "Ich möchte / Ich nehme + akusatif · Was kostet (tunggal) / kosten (jamak) ...?", ex: [["Ich nehme den Fisch.", "Saya pilih ikannya."], ["Was kosten die Äpfel? – Ein Kilo kostet 2,50 Euro.", "Berapa harga apelnya? – Satu kilo 2,50 euro."], ["Ich brauche noch Milch und Eier.", "Saya masih perlu susu dan telur."]] } },
        { tip: "Harga dibaca euro dulu, lalu sen: {2,50 €} = {zwei Euro fünfzig}, {0,99 €} = {neunundneunzig Cent}." }
    ],
    5: [
        { h: "Pendalaman: kata milik di akusatif, modal, kata depan waktu" },
        { tb: { h: ["Pemilik", "der (akusatif)", "die", "das", "jamak"], r: [
                    ["ich", "{meinen}", "{meine}", "{mein}", "{meine}"], ["du", "{deinen}", "{deine}", "{dein}", "{deine}"], ["er / es", "{seinen}", "{seine}", "{sein}", "{seine}"], ["sie", "{ihren}", "{ihre}", "{ihr}", "{ihre}"], ["wir", "{unseren}", "{unsere}", "{unser}", "{unsere}"], ["ihr", "{euren}", "{eure}", "{euer}", "{eure}"], ["sie / Sie", "{ihren} / {Ihren}", "{ihre} / {Ihre}", "{ihr} / {Ihr}", "{ihre} / {Ihre}"]
                ] } },
        { pt: { h: "Kalimat dengan kata kerja modal", f: "Subjek + MODAL (posisi 2) + ... + infinitif (akhir)", ex: [["Ich kann gut schwimmen.", "Saya bisa berenang dengan baik."], ["Musst du heute arbeiten?", "Apakah kamu harus bekerja hari ini?"], ["Wir wollen am Sonntag Oma besuchen.", "Kami ingin mengunjungi nenek hari Minggu."]] } },
        { pt: { h: "Kata depan waktu", f: "um + jam · am + hari / bagian hari · im + bulan / musim · von ... bis ...", ex: [["Um sieben Uhr frühstücke ich.", "Pukul tujuh saya sarapan."], ["Am Morgen trinke ich Tee.", "Pagi hari saya minum teh."], ["Ich arbeite von Montag bis Freitag.", "Saya bekerja dari Senin sampai Jumat."]] } },
        { tip: "Bagian hari memakai {am}: {am Morgen}, {am Vormittag}, {am Mittag}, {am Nachmittag}, {am Abend}. Pengecualian: {in der Nacht} (pada malam hari, saat tidur)." }
    ],
    6: [
        { h: "Pendalaman: angka urutan, für/ohne, war/hatte" },
        { tb: { h: ["Tanggal", "Der ... ist heute", "am ... (pada tanggal)"], r: [
                    ["1.", "{der erste}", "{am ersten}"], ["2.", "{der zweite}", "{am zweiten}"], ["3.", "{der dritte}", "{am dritten}"], ["4.", "{der vierte}", "{am vierten}"], ["7.", "{der siebte}", "{am siebten}"], ["8.", "{der achte}", "{am achten}"], ["19.", "{der neunzehnte}", "{am neunzehnten}"], ["20.", "{der zwanzigste}", "{am zwanzigsten}"], ["31.", "{der einunddreißigste}", "{am einunddreißigsten}"]
                ] } },
        { pt: { h: "Kata kerja terpisah bersama kata kerja modal", f: "Subjek + modal + ... + kata kerja utuh (akhir)", ex: [["Ich muss morgen früh aufstehen.", "Besok saya harus bangun pagi."], ["Kannst du mich abholen?", "Bisakah kamu menjemputku?"]] } },
        { pt: { h: "Kata depan dengan akusatif", f: "für · ohne · um + akusatif", ex: [["Das Geschenk ist für dich.", "Hadiahnya untukmu."], ["Ich gehe ohne ihn ins Kino.", "Saya pergi ke bioskop tanpa dia."], ["Die Party beginnt um acht.", "Pestanya mulai pukul delapan."]] } },
        { pt: { h: "Bercerita tentang kemarin dengan war dan hatte", f: "war (sein) · hatte (haben) di posisi 2", ex: [["Am Wochenende war ich in Bandung.", "Akhir pekan lalu saya di Bandung."], ["Die Party war toll!", "Pestanya keren!"], ["Wir hatten viel Spaß.", "Kami sangat bersenang-senang."]] } }
    ],
    7: [
        { h: "Pendalaman: dativ lengkap dan kata depan dativ" },
        { tb: { h: ["Jenis", "der / die / das", "ein / kein", "kata milik (mein)"], r: [
                    ["maskulin", "{dem}", "{einem} / {keinem}", "{meinem}"], ["feminin", "{der}", "{einer} / {keiner}", "{meiner}"], ["netral", "{dem}", "{einem} / {keinem}", "{meinem}"], ["jamak", "{den} (+ n)", "– / {keinen} (+ n)", "{meinen} (+ n)"]
                ] } },
        { pt: { h: "Kata depan yang selalu dativ", f: "aus · bei · mit · nach · seit · von · zu + dativ", ex: [["Ich komme aus der Türkei.", "Saya berasal dari Turki."], ["Nach der Arbeit gehe ich nach Hause.", "Setelah bekerja saya pulang."], ["Ich lerne seit einem Jahr Deutsch.", "Saya belajar bahasa Jerman sejak setahun lalu."], ["Ich gehe zum Chef.", "Saya pergi menemui atasan."]] } },
        { tip: "{nach Hause} = pulang (arah), {zu Hause} = di rumah (posisi). {nach} juga dipakai untuk kota dan negara tanpa artikel: {nach Berlin}, {nach Indonesien}." },
        { pt: { h: "Menyusun cerita hari kerja", f: "zuerst · dann · danach · am Ende + kata kerja (posisi 2) + subjek", ex: [["Zuerst lese ich meine E-Mails.", "Pertama saya membaca surel."], ["Dann habe ich ein Meeting.", "Lalu saya ada rapat."], ["Danach mache ich Pause.", "Setelah itu saya istirahat."]] } }
    ],
    8: [
        { h: "Pendalaman: imperatif lanjutan dan di dokter" },
        { pt: { h: "Imperatif kata kerja terpisah", f: "Kata kerja + (Sie) + ... + awalan", ex: [["Rufen Sie morgen an!", "Teleponlah besok!"], ["Steh bitte auf!", "Tolong bangun!"], ["Kommt doch mit!", "Ayo ikut!"]] } },
        { pt: { h: "Mengatakan bagian tubuh yang sakit", f: "Mein / Meine ... tut weh. · (jamak) ... tun weh. · Ich habe ...schmerzen.", ex: [["Mein Kopf tut weh.", "Kepala saya sakit."], ["Meine Füße tun weh.", "Kaki saya sakit."], ["Ich habe Rückenschmerzen.", "Saya sakit punggung."]] } },
        { tb: { h: ["Frasa di dokter", "Arti"], r: [
                    ["{Was fehlt Ihnen?}", "Anda sakit apa?"], ["{Seit wann haben Sie Fieber?}", "Sejak kapan Anda demam?"], ["{Seit gestern.}", "Sejak kemarin."], ["{Bleiben Sie im Bett.}", "Tetaplah di tempat tidur."], ["{Ich brauche einen Termin.}", "Saya perlu janji temu."]
                ] } },
        { pt: { h: "Saran dan larangan di dokter", f: "sollen = disarankan / disuruh · dürfen = boleh · nicht dürfen / kein ... dürfen = dilarang", ex: [["Sie sollen viel schlafen.", "Anda disarankan banyak tidur."], ["Soll ich die Tabletten vor dem Essen nehmen?", "Apakah saya harus minum tabletnya sebelum makan?"], ["Du darfst heute keinen Sport machen.", "Hari ini kamu tidak boleh berolahraga."]] } },
        { tip: "{bitte} membuat perintah lebih sopan: {Kommen Sie bitte herein.} Imperatif du dari {nehmen} adalah {Nimm!}, dari {geben} adalah {Gib!}" }
    ],
    9: [
        { h: "Pendalaman: perubahan artikel dan pasangan kata kerja" },
        { tb: { h: ["Jenis", "Wo? (dativ)", "Wohin? (akusatif)"], r: [
                    ["maskulin", "{im Schrank} (in dem)", "{in den Schrank}"], ["feminin", "{in der Küche}", "{in die Küche}"], ["netral", "{im Bad} (in dem)", "{ins Bad} (in das)"], ["jamak", "{in den Zimmern}", "{in die Zimmer}"]
                ] } },
        { x: 1, tb: { h: ["Wohin? (gerak, akusatif)", "Wo? (diam, dativ)"], r: [
                    ["{stellen}: Ich stelle die Lampe auf den Tisch.", "{stehen}: Die Lampe steht auf dem Tisch."], ["{legen}: Ich lege das Buch auf das Bett.", "{liegen}: Das Buch liegt auf dem Bett."], ["{hängen}: Ich hänge das Bild an die Wand.", "{hängen}: Das Bild hängt an der Wand."]
                ] } },
        { pt: { h: "Menjelaskan tempat tinggal", f: "Die Wohnung hat ... · Das ... ist + sifat · Im ... gibt es ...", ex: [["Die Wohnung hat zwei Zimmer, eine Küche und ein Bad.", "Apartemen itu punya dua kamar, satu dapur, dan satu kamar mandi."], ["Das Wohnzimmer ist groß und hell.", "Ruang tamunya besar dan terang."], ["Im Schlafzimmer gibt es einen Schrank.", "Di kamar tidur ada lemari."]] } },
        { pt: { h: "Memberi pendapat tentang tempat tinggal", f: "Wie findest du ...? – Ich finde ihn / sie / es + sifat", ex: [["Wie findest du das Sofa? – Ich finde es schön.", "Bagaimana menurutmu sofa itu? – Menurutku bagus."], ["Wie findest du die Küche? – Ich finde sie praktisch.", "Bagaimana menurutmu dapurnya? – Menurutku praktis."], ["Der Teppich ist rot und der Schrank ist weiß.", "Karpetnya merah dan lemarinya putih."]] } },
        { tip: "Gabungan yang sering: {ins} = in das, {im} = in dem, {am} = an dem, {ans} = an das." }
    ],
    10: [
        { h: "Pendalaman: Perfekt lengkap dan profesi" },
        { tb: { h: ["Subjek", "haben + Partizip II", "sein + Partizip II"], r: [
                    ["ich", "habe ... gemacht", "bin ... gefahren"], ["du", "hast ... gemacht", "bist ... gefahren"], ["er / sie / es", "hat ... gemacht", "ist ... gefahren"], ["wir", "haben ... gemacht", "sind ... gefahren"], ["ihr", "habt ... gemacht", "seid ... gefahren"], ["sie / Sie", "haben ... gemacht", "sind ... gefahren"]
                ] } },
        { tb: { h: ["Infinitif", "Perfekt", "Arti"], r: [
                    ["{schlafen}", "{hat geschlafen}", "tidur"], ["{sehen}", "{hat gesehen}", "melihat"], ["{lesen}", "{hat gelesen}", "membaca"], ["{schreiben}", "{hat geschrieben}", "menulis"], ["{sprechen}", "{hat gesprochen}", "berbicara"], ["{nehmen}", "{hat genommen}", "mengambil"], ["{bleiben}", "{ist geblieben}", "tinggal / tetap"], ["{aufstehen}", "{ist aufgestanden}", "bangun"], ["{einkaufen}", "{hat eingekauft}", "berbelanja"], ["{sein}", "{ist gewesen}", "ada / adalah"]
                ] } },
        { pt: { h: "Bercerita tentang kemarin", f: "Keterangan waktu + haben / sein + ... + Partizip II", ex: [["Gestern habe ich lange geschlafen.", "Kemarin saya tidur lama."], ["Am Samstag bin ich ins Kino gegangen.", "Hari Sabtu saya pergi ke bioskop."], ["Was hast du am Wochenende gemacht?", "Apa yang kamu lakukan di akhir pekan?"]] } },
        { pt: { h: "Menyebut pekerjaan", f: "Ich bin + profesi (tanpa artikel) · Ich arbeite als + profesi · Ich arbeite bei + perusahaan", ex: [["Ich bin Lehrerin.", "Saya guru."], ["Er arbeitet als Koch.", "Dia bekerja sebagai koki."], ["Was sind Sie von Beruf? – Ich bin Ingenieur.", "Apa pekerjaan Anda? – Saya insinyur."]] } },
        { pt: { h: "Riwayat singkat: seit, von ... bis", f: "seit + dativ (masih berlangsung, kata kerja present) · von ... bis ... (sudah selesai, Perfekt)", ex: [["Ich arbeite seit zwei Jahren als Lehrerin.", "Saya bekerja sebagai guru sejak dua tahun lalu."], ["Von 2018 bis 2022 habe ich in Bandung studiert.", "Dari 2018 sampai 2022 saya kuliah di Bandung."], ["Jetzt suche ich eine Arbeit in Deutschland.", "Sekarang saya mencari pekerjaan di Jerman."]] } },
        { tip: "Profesi ditulis tanpa artikel: {Ich bin Arzt.}, bukan {Ich bin ein Arzt.} Bentuk perempuan biasanya + {-in}: {Lehrer → Lehrerin}, {Arzt → Ärztin}." }
    ],
    11: [
        { h: "Pendalaman: perbandingan dan di toko" },
        { x: 1, tb: { h: ["Bentuk dasar", "Lebih", "Paling"], r: [
                    ["{gut}", "{besser}", "{am besten}"], ["{gern}", "{lieber}", "{am liebsten}"], ["{viel}", "{mehr}", "{am meisten}"], ["{billig}", "{billiger}", "{am billigsten}"], ["{teuer}", "{teurer}", "{am teuersten}"]
                ] } },
        { x: 1, tip: "Membandingkan memakai {als}: {Die Jacke ist teurer als der Pullover.} Sama dengan: {so ... wie}: {Das Hemd ist so teuer wie die Hose.}" },
        { pt: { h: "Wie gefällt dir ...?", f: "benda (nominatif) + gefällt / gefallen + orang (dativ)", ex: [["Wie gefällt dir der Rock? – Er gefällt mir gut.", "Bagaimana menurutmu rok itu? – Saya suka."], ["Die Schuhe gefallen mir nicht.", "Saya tidak suka sepatu itu."], ["Die Jacke passt Ihnen gut.", "Jaket itu pas untuk Anda."]] } },
        { pt: { h: "Percakapan di toko", f: "Kann ich Ihnen helfen? · Ich suche ... · Haben Sie ... in ...? · Ich nehme ...", ex: [["Kann ich Ihnen helfen?", "Ada yang bisa saya bantu?"], ["Ich suche eine Hose in Größe 40.", "Saya mencari celana ukuran 40."], ["Haben Sie das auch in Blau?", "Apakah ada juga yang warna biru?"], ["Ich nehme den Pullover.", "Saya ambil sweternya."]] } }
    ],
    12: [
        { h: "Pendalaman: cuaca, surat, man, denn" },
        { tb: { h: ["Cuaca", "Arti"], r: [["{Es ist sonnig.}", "Cerah."], ["{Es regnet.}", "Hujan."], ["{Es schneit.}", "Turun salju."], ["{Es ist windig.}", "Berangin."], ["{Es ist bewölkt.}", "Berawan."], ["{Es sind 30 Grad.}", "Suhunya 30 derajat."]] } },
        { tb: { h: ["Bagian", "Akrab", "Formal"], r: [
                    ["Sapaan", "{Liebe Anna,} / {Lieber Tom,}", "{Sehr geehrte Frau Weber,} / {Sehr geehrter Herr Klein,} / {Sehr geehrte Damen und Herren,}"], ["Penutup", "{Viele Grüße} / {Liebe Grüße} / {Bis bald}", "{Mit freundlichen Grüßen}"], ["Kata ganti", "{du, dich, dir, dein}", "{Sie, Sie, Ihnen, Ihr}"]
                ] } },
        { pt: { h: "man (orang pada umumnya)", f: "man + kata kerja bentuk er / sie / es", ex: [["Hier kann man gut essen.", "Di sini orang bisa makan enak."], ["Wie schreibt man das?", "Bagaimana cara menulisnya?"], ["In Deutschland trinkt man viel Kaffee.", "Di Jerman orang banyak minum kopi."]] } },
        { pt: { h: "Memberi alasan dengan denn", f: "Kalimat 1, denn + kalimat 2 (kata kerja tetap posisi 2)", ex: [["Ich fahre ans Meer, denn ich schwimme gern.", "Saya pergi ke laut, sebab saya suka berenang."], ["Wir bleiben zu Hause, denn es regnet.", "Kami tinggal di rumah, sebab hujan."]] } },
        { tip: "Dalam surat, setelah sapaan dengan koma, kalimat pertama mulai dengan huruf kecil: {Liebe Anna,} lalu baris baru {wie geht es dir?}" }
    ]
};
const QX = {
    1: [{ q: "Wie ___ Sie? (bernama)", o: ["heißen", "heißt", "heiße", "heiß"], y: "Sie + heißen." }, { q: "Wir ___ in Jakarta. (wohnen)", o: ["wohnen", "wohnt", "wohne", "wohnst"], y: "wir + -en." }, { q: "Ihr ___ aus Deutschland. (sein)", o: ["seid", "sind", "seit", "bist"], y: "ihr seid. Hati-hati: seit artinya sejak." }, { q: "34 dalam bahasa Jerman adalah...", o: ["vierunddreißig", "dreiundvierzig", "dreißigvier", "vierdreißig"], y: "Satuan dulu: vier + und + dreißig." }, { q: "Jawaban yang cocok untuk “Wie geht's?”", o: ["Gut, danke. Und dir?", "Ich heiße Tom.", "Aus Spanien.", "In Berlin."], y: "Wie geht's? menanyakan kabar." }],
    2: [{ q: "Ich ___ keine Zeit. (haben)", o: ["habe", "hast", "hat", "haben"], y: "ich habe." }, { q: "Du ___ gern. (tanzen)", o: ["tanzt", "tanzst", "tanzest", "tanze"], y: "Batang berakhiran z: du + -t." }, { q: "Manchmal ___ ich Fußball.", o: ["spiele", "spielst", "spielen", "spielt"], y: "Keterangan di posisi 1, kata kerja tetap di posisi 2: Manchmal spiele ich." }, { q: "“nie” artinya...", o: ["tidak pernah", "selalu", "sering", "kadang-kadang"], y: "nie = tidak pernah." }],
    3: [{ q: "Wo ist der Bahnhof? – ___ ist dort.", o: ["Er", "Sie", "Es", "Der"], y: "der Bahnhof diganti er." }, { q: "Der Bahnhof ist ___ weit.", o: ["nicht", "kein", "keine", "nein"], y: "Sifat dinegasi dengan nicht." }, { q: "Ist das kein Café? – ___, das ist ein Café.", o: ["Doch", "Ja", "Nein", "Nicht"], y: "Membantah pertanyaan negatif memakai doch." }, { q: "Jamak dari das Auto adalah...", o: ["die Autos", "die Autoen", "die Äuto", "die Autor"], y: "Kata serapan berakhiran vokal sering mendapat -s." }],
    4: [{ q: "Du ___ den Fisch. (nehmen)", o: ["nimmst", "nehmst", "nimmt", "nehmt"], y: "nehmen tidak beraturan: du nimmst." }, { q: "Er ___ gern Kuchen. (essen)", o: ["isst", "esst", "ist", "esse"], y: "essen: er isst (berbeda dengan ist = adalah)." }, { q: "2,50 € dibaca...", o: ["zwei Euro fünfzig", "zwei fünfzig Euro", "zweihundertfünfzig Euro", "fünfzig zwei Euro"], y: "Euro dulu, lalu sen." }, { q: "Was ___ die Äpfel?", o: ["kosten", "kostet", "koste", "kostest"], y: "die Äpfel jamak, jadi kosten." }],
    5: [{ q: "Ich besuche ___ Bruder. (saudaraku, akusatif)", o: ["meinen", "mein", "meine", "meinem"], y: "der Bruder di akusatif menjadi meinen." }, { q: "___ Abend sehe ich fern.", o: ["Am", "Um", "Im", "In"], y: "Bagian hari memakai am: am Abend." }, { q: "Er ___ gut kochen. (können)", o: ["kann", "kannst", "können", "könnt"], y: "er kann." }, { q: "Viertel vor acht = ...", o: ["07.45", "08.15", "07.15", "08.45"], y: "vor = sebelum: 15 menit sebelum pukul delapan." }],
    6: [{ q: "Ich muss morgen früh ___.", o: ["aufstehen", "stehe auf", "aufstehe", "auf stehen"], y: "Bersama kata kerja modal, kata kerja terpisah berada utuh di akhir." }, { q: "Das Geschenk ist für ___. (dia laki-laki)", o: ["ihn", "er", "ihm", "sein"], y: "für + akusatif: ihn." }, { q: "Tanggal 8 dibaca...", o: ["der achte", "der achtte", "der achtzehnte", "der acht"], y: "acht + e = achte." }, { q: "Gestern ___ wir im Kino. (sein, lampau)", o: ["waren", "war", "wart", "sind"], y: "wir waren." }],
    7: [{ q: "Ich fahre mit ___ Fahrrad. (das Fahrrad)", o: ["dem", "der", "den", "das"], y: "mit + dativ; das menjadi dem." }, { q: "Nach der Arbeit gehe ich ___ Hause.", o: ["nach", "zu", "bei", "in"], y: "Arah pulang: nach Hause." }, { q: "Ich bin heute ___ Hause.", o: ["zu", "nach", "im", "bei"], y: "Posisi di rumah: zu Hause." }, { q: "Zuerst lese ich E-Mails, dann ___ ich ein Meeting.", o: ["habe", "haben", "hat", "hast"], y: "dann di posisi 1, kata kerja di posisi 2, subjek sesudahnya." }],
    8: [{ q: "Imperatif Sie dari anrufen:", o: ["Rufen Sie an!", "Anrufen Sie!", "Rufen an Sie!", "Sie rufen an!"], y: "Kata kerja + Sie, awalan di akhir." }, { q: "Imperatif du dari nehmen:", o: ["Nimm!", "Nehm!", "Nimmst!", "Nehme!"], y: "nehmen: du nimmst, jadi Nimm!" }, { q: "Meine Beine ___ weh.", o: ["tun", "tut", "tue", "tust"], y: "Subjek jamak (die Beine): tun weh." }, { q: "Hier ___ man nicht parken. (dilarang)", o: ["darf", "muss", "will", "kann"], y: "nicht dürfen = dilarang." }],
    9: [{ q: "Ich stelle die Lampe auf ___ Tisch. (Wohin?)", o: ["den", "dem", "der", "das"], y: "stellen = gerak (Wohin?), akusatif: den." }, { q: "Die Lampe steht auf ___ Tisch. (Wo?)", o: ["dem", "den", "der", "das"], y: "stehen = diam (Wo?), dativ: dem." }, { q: "Ich gehe ___ Bad. (in das)", o: ["ins", "im", "in", "am"], y: "in + das = ins." }, { q: "Das Bild hängt ___ dem Sofa. (di atas, tidak menyentuh)", o: ["über", "auf", "unter", "vor"], y: "über = di atas tanpa menyentuh." }],
    10: [{ q: "Partizip II dari schreiben:", o: ["geschrieben", "geschreibt", "schrieben", "geschriebt"], y: "Tidak beraturan: geschrieben." }, { q: "Ich ___ um sieben Uhr aufgestanden.", o: ["bin", "habe", "hat", "ist"], y: "aufstehen (perubahan keadaan) memakai sein." }, { q: "Partizip II dari einkaufen:", o: ["eingekauft", "geeinkauft", "einkauft", "eingekaufen"], y: "ge- diselipkan setelah awalan." }, { q: "Er arbeitet ___ Koch.", o: ["als", "wie", "bei", "mit"], y: "arbeiten als + profesi." }],
    11: [{ q: "Ich trinke ___ Tee als Kaffee. (lebih suka)", o: ["lieber", "gerner", "mehr gern", "am liebsten"], y: "gern – lieber – am liebsten." }, { q: "Die Schuhe gefallen ___. (dia perempuan)", o: ["ihr", "sie", "ihn", "ihm"], y: "gefallen + dativ; sie menjadi ihr." }, { q: "Die Jacke ist teurer ___ der Pullover.", o: ["als", "wie", "so", "dann"], y: "Perbandingan memakai als." }, { q: "Kann ich Ihnen ___?", o: ["helfen", "hilfe", "hilft", "geholfen"], y: "Modal + infinitif: helfen." }],
    12: [{ q: "“Es schneit” artinya...", o: ["Turun salju.", "Hujan.", "Berangin.", "Cerah."], y: "schneien = turun salju." }, { q: "Penutup surat formal yang benar:", o: ["Mit freundlichen Grüßen", "Liebe Grüße", "Bis bald", "Tschüss"], y: "Surat formal ditutup dengan Mit freundlichen Grüßen." }, { q: "Sapaan formal untuk Pak Klein:", o: ["Sehr geehrter Herr Klein,", "Sehr geehrte Herr Klein,", "Lieber Herr Klein!", "Hallo Klein,"], y: "Herr maskulin, jadi geehrter." }, { q: "Wir bleiben zu Hause, denn es ___.", o: ["regnet", "regnen", "regne", "geregnet"], y: "Setelah denn urutan tidak berubah: es regnet." }]
};
L.forEach((l, i) => { const b = i + 1; if (CX[b])
    l.c = l.c.concat(CX[b]); if (QX[b])
    l.q = l.q.concat(QX[b]); });
