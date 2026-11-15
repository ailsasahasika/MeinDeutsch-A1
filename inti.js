/* Mein Deutsch A1 – inti.js
   Fitur inti: utilitas, kuis, kartu SM-2, latihan, dialog, bacaan, pola, tes cepat, mic, tutor AI. */
/* ---------- Util ---------- */
const $ = s => document.querySelector(s);
const fmt = s => s.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\{(.+?)\}/g, '<span class="de">$1</span>');
const SPK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3zm13.500 3a4.500 4.500 0 0 0-2.500-4v8a4.500 4.500 0 0 0 2.500-4zM14 3.200v2.100a7 7 0 0 1 0 13.400v2.100a9 9 0 0 0 0-17.600z"/></svg>';
const HAS_SPEECH = typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance !== "undefined";
function speak(text) { AU.say(text); }
let KEY = "mein-deutsch-a1";
function load() { try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
}
catch (e) {
    return {};
} }
function save(d, timer) { d.upd = Date.now(); try {
    localStorage.setItem(KEY, JSON.stringify(d));
}
catch (e) { } if (!timer && typeof Sync !== "undefined")
    Sync.schedule(); }
let store = load();
store.done = store.done || {};
store.best = store.best || {};
const esc = s => s.replace(/"/g, "&quot;");
function shuffle(a) { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
} return r; }
const doneCount = () => Object.keys(store.done).length;
/* ---------- Bab ---------- */
function table(t) { return `<div class="tbl"><table><thead><tr>${t.h.map(x => `<th>${x}</th>`).join("")}</tr></thead><tbody>${t.r.map(r => `<tr>${r.map(c => `<td>${fmt(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`; }
/* ---------- Kuis (jawaban benar = o[0], diacak) ---------- */
function runQuiz(box, qs, onFinish) {
    let i = 0, score = 0;
    function show() {
        const q = qs[i];
        const opts = shuffle(q.o.map((t, idx) => ({ t, ok: idx === 0 })));
        box.innerHTML = `<div class="qmeta"><span>Soal ${i + 1} dari ${qs.length}</span><span>Benar: ${score}</span></div><div class="qtext">${fmt(q.q)}${q.from ? `<div class="say" style="margin-top:4px">Bab ${q.from}</div>` : ""}</div><div class="opts">${opts.map((o, n) => `<button class="opt" data-n="${n}">${o.t}</button>`).join("")}</div><div id="fb" aria-live="polite"></div>`;
        box.querySelectorAll(".opt").forEach(b => b.addEventListener("click", () => {
            const o = opts[+b.dataset.n];
            box.querySelectorAll(".opt").forEach((x, n) => { x.disabled = true; if (opts[n].ok)
                x.classList.add("ok"); });
            if (o.ok)
                score++;
            else
                b.classList.add("no");
            box.querySelector("#fb").innerHTML = `<div class="fb ${o.ok ? "ok" : "no"}"><b>${o.ok ? "Benar!" : "Belum tepat."}</b>${q.y}</div><div class="row"><button class="btn" id="nx">${i < qs.length - 1 ? "Lanjut" : "Lihat hasil"}</button></div>`;
            const nx = box.querySelector("#nx");
            nx.addEventListener("click", () => { i++; i < qs.length ? show() : finish(); });
            nx.focus();
        }));
    }
    function finish() {
        const pct = Math.round(score / qs.length * 100);
        const r = onFinish(pct);
        box.innerHTML = `<div class="qmeta"><span>Hasil</span></div><div class="score">${score}/${qs.length}</div><p style="margin:10px 0 0">${r.msg}</p><div class="row"><button class="btn alt" id="again">Ulangi</button>${r.next || ""}</div>`;
        box.querySelector("#again").addEventListener("click", r.again);
    }
    show();
}
/* ---------- Latihan acak ---------- */
function mix() {
    const pool = [];
    L.forEach((l, i) => l.q.forEach(q => pool.push(Object.assign(Object.assign({}, q), { from: i + 1 }))));
    const qs = shuffle(pool).slice(0, 10);
    $("#app").innerHTML = `<a class="crumb" href="#">← Semua bab</a><div class="lhead"><h1>Latihan acak</h1><div class="goal">10 soal dari semua bab. Cocok untuk mengulang sebelum tes.</div></div><section class="blk"><div class="quiz" id="quiz"></div></section>`;
    $("#app").classList.remove("hide-id");
    runQuiz($("#quiz"), qs, pct => (logRes("latihan", 0, pct, "Latihan acak 10 soal"), { pass: true, again: mix, msg: pct >= 80 ? "Bagus sekali. Pertahankan." : "Catat bab yang soalnya salah (tertera di tiap soal) dan ulang bab itu.", next: `<a class="btn" href="#">Ke beranda</a>` }));
}
/* ---------- Router ---------- */
function updateProg() { $("#prog").textContent = doneCount() + " / " + L.length + " bab"; const r = document.getElementById("progRing"); if (r)
    r.style.setProperty("--p", Math.round(doneCount() / L.length * 100)); }
/* ===== Tambahan: penyimpanan dan waktu belajar ===== */
store.srs = store.srs || {};
store.days = store.days || {};
store.exams = store.exams || [];
const keyOf = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
let lastAct = Date.now();
["pointerdown", "keydown", "touchstart", "input", "wheel"].forEach(ev => addEventListener(ev, () => { lastAct = Date.now(); }, { passive: true, capture: true }));
addEventListener("scroll", () => { lastAct = Date.now(); }, { passive: true });
setInterval(() => { if (document.visibilityState === "visible" && (Date.now() - lastAct < 180000 || (typeof AU !== "undefined" && AU.playing))) {
    const k = keyOf(new Date());
    store.days[k] = (store.days[k] || 0) + 10;
    save(store, true);
} }, 10000);
function streak() { const d = new Date(); if ((store.days[keyOf(d)] || 0) < 60)
    d.setDate(d.getDate() - 1); let n = 0; while ((store.days[keyOf(d)] || 0) >= 60) {
    n++;
    d.setDate(d.getDate() - 1);
} return n; }
const fmtMin = s => { const m = Math.round(s / 60); return m < 60 ? m + " mnt" : Math.floor(m / 60) + " j " + (m % 60) + " mnt"; };
const pick1 = a => a[Math.floor(Math.random() * a.length)];
const pick = (a, n) => shuffle(a).slice(0, n);
const norm = s => s.toLowerCase().trim().replace(/ß/g, "ss").replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/[.!?,]/g, "");
function mkUtt(text) { const u = new SpeechSynthesisUtterance(text.replace(/\s*\/\s*/g, ", ").replace(/\.\.\./g, "").replace(/–/g, ",")); u.lang = "de-DE"; u.rate = .82; const v = speechSynthesis.getVoices().find(x => /^de/i.test(x.lang)); if (v)
    u.voice = v; return u; }
function speakSeq(list) { AU.seq(list); }
function wireSpk(root) { root.querySelectorAll(".spk").forEach(b => b.addEventListener("click", e => { e.stopPropagation(); if (AU.playing && AU.cur === b.dataset.say) {
    AU.stop();
    return;
} speak(b.dataset.say); })); }
let keyHandler = null, activeTimer = null;
/* ===== Kartu kosakata (SM-2, seperti Anki) ===== */
const CARDS = [];
L.forEach((l, i) => l.v.forEach(v => CARDS.push({ key: (i + 1) + "|" + v[0], bab: i + 1, de: v[0], ar: v[1], pr: v[2] })));
const inDeck = (c, b) => !b || (b === "hard" ? isHard(c) : b === "t" ? c.bab === 0 : (typeof b === "string" && b.slice(0, 2) === "c:") ? c.cat === b.slice(2) : c.bab === b);
const dueCards = b => { const now = Date.now(); return CARDS.filter(c => inDeck(c, b) && store.srs[c.key] && store.srs[c.key].due <= now); };
const newCards = b => CARDS.filter(c => inDeck(c, b) && !store.srs[c.key]);
function sched(s, g) {
    const q = [1, 3, 4, 5][g];
    const ef = Math.max(1.3, s.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    let reps, iv;
    if (q < 3) {
        reps = 0;
        iv = 0;
    }
    else {
        reps = s.reps + 1;
        iv = reps === 1 ? (g === 3 ? 3 : 1) : reps === 2 ? (g === 3 ? 6 : 3) : Math.max(1, Math.round((s.iv || 1) * ef));
    }
    return { lap: (s.lap || 0) + (g === 0 ? 1 : 0), ef, reps, iv, due: iv === 0 ? Date.now() + 60000 : Date.now() + iv * 864e5 };
}
const ivLabel = s => s.iv === 0 ? "1 mnt" : s.iv + " hari";
let deckBab = 0, fastMode = false;
function kartu() {
    const due = dueCards(deckBab), nw = newCards(deckBab);
    const all = CARDS.filter(c => inDeck(c, deckBab));
    const mast = all.filter(c => store.srs[c.key] && store.srs[c.key].reps >= 3).length;
    $("#app").innerHTML = `<div class="lhead"><h1>Kartu kosakata</h1><div class="goal">Pengulangan berjarak (spaced repetition, metode SM-2 seperti Anki): kata yang dinilai “Lagi” muncul lagi di sesi yang sama dan dijadwalkan lebih sering, kata yang sudah hafal muncul dengan jeda makin panjang. Kata yang dua kali atau lebih dinilai “Lagi” masuk dek “Sering salah”. Nilai seberapa ingat kamu dengan jujur.</div></div>
  <div class="stats"><div class="stat"><b>${due.length}</b><span>jatuh tempo</span></div><div class="stat"><b>${nw.length}</b><span>kartu baru</span></div><div class="stat"><b>${mast}/${all.length}</b><span>dikuasai</span></div><div class="stat"><b>${all.filter(isHard).length}</b><span>sering salah</span></div></div>
  <div class="tools"><label>Dek: <select id="deckSel" class="sel"><option value="0">Semua kata</option><option value="hard" ${deckBab === "hard" ? "selected" : ""}>Sering salah</option><optgroup label="Per bab">${L.map((l, i) => `<option value="${i + 1}" ${deckBab === i + 1 ? "selected" : ""}>${i + 1}. ${l.t}</option>`).join("")}<option value="t" ${deckBab === "t" ? "selected" : ""}>Kosakata tematik tambahan</option></optgroup><optgroup label="Per kategori">${Object.entries(VCAT).map(([k, v]) => `<option value="c:${k}" ${deckBab === "c:" + k ? "selected" : ""}>${v}</option>`).join("")}</optgroup></select></label><label><input type="checkbox" id="fast" ${fastMode ? "checked" : ""}> Mode cepat (arti langsung tampil)</label></div>
  <div id="deck"></div>
  <p class="note">Pintasan keyboard: spasi membalik kartu, tombol 1 sampai 4 menilai.</p>`;
    $("#deckSel").addEventListener("change", e => { const v = e.target.value; deckBab = /^\d+$/.test(v) ? +v : v; kartu(); });
    $("#fast").addEventListener("change", e => { fastMode = e.target.checked; kartu(); });
    startDeck(due, nw);
}
function startDeck(due, nw) {
    const box = $("#deck");
    const queue = due.slice(0, 30).concat(nw.slice(0, 10));
    const total = queue.length;
    let flipped = false, done = 0;
    function show() {
        if (!queue.length) {
            box.innerHTML = `<div class="quiz"><div class="score">${total ? "Selesai" : "Kosong"}</div><p style="margin:10px 0 0">${total ? done + " kartu sudah diulang. Kartu berikutnya muncul sesuai jadwal, kembali lagi besok." : "Tidak ada kartu yang perlu dipelajari sekarang."}</p><div class="row"><button class="btn alt" id="reload">Muat ulang</button><a class="btn" href="#latihan">Coba latihan</a></div></div>`;
            box.querySelector("#reload").addEventListener("click", kartu);
            return;
        }
        const c = queue[0];
        const s = store.srs[c.key] || { ef: 2.5, reps: 0, iv: 0 };
        const open = flipped || fastMode;
        box.innerHTML = `<div class="qmeta"><span>Sisa ${queue.length} kartu</span><span>${c.bab ? "Bab " + c.bab : "Tematik"}</span></div>
    <div class="flash" id="flash" tabindex="0" role="button" aria-label="Balik kartu"><button class="spk" data-say="${esc(c.de)}" aria-label="Dengar ${esc(c.de)}">${SPK}</button><div class="fw">${c.de}</div><div class="say">${c.pr}</div>${open ? `<div class="fa">${c.ar}</div>` : `<div class="note">Ketuk kartu untuk melihat arti</div>`}</div>
    ${open ? `<div class="grades">${["Lagi", "Sulit", "Bagus", "Mudah"].map((n, g) => `<button class="gbtn" data-g="${g}"><b>${g + 1}. ${n}</b><span>${ivLabel(sched(s, g))}</span></button>`).join("")}</div>` : ""}`;
        wireSpk(box);
        box.querySelector("#flash").addEventListener("click", () => { if (!flipped && !fastMode) {
            flipped = true;
            show();
        } });
        box.querySelectorAll(".gbtn").forEach(b => b.addEventListener("click", () => grade(+b.dataset.g)));
    }
    function grade(g) { const c = queue.shift(); const s = store.srs[c.key] || { ef: 2.5, reps: 0, iv: 0 }; store.srs[c.key] = sched(s, g); bumpRev(); save(store); if (g === 0)
        queue.push(c);
    else
        done++; flipped = false; show(); }
    keyHandler = e => {
        const tag = document.activeElement && document.activeElement.tagName;
        if (tag === "INPUT" || tag === "SELECT")
            return;
        if ((e.code === "Space" || e.key === "Enter") && tag !== "BUTTON") {
            if (queue.length && !flipped && !fastMode) {
                flipped = true;
                show();
                e.preventDefault();
            }
        }
        else if (["1", "2", "3", "4"].includes(e.key) && queue.length && (flipped || fastMode))
            grade(+e.key - 1);
    };
    document.addEventListener("keydown", keyHandler);
    show();
}
/* ===== Sesi latihan: beberapa jenis soal ===== */
const RENDER = {
    mc(st, it, done) {
        const opts = shuffle(it.o.map((t, i) => ({ t, ok: i === 0 })));
        st.innerHTML = `<div class="qtext">${fmt(it.q)}${it.from ? `<div class="say" style="margin-top:4px">Bab ${it.from}</div>` : ""}</div><div class="opts">${opts.map((o, n) => `<button class="opt" data-n="${n}">${o.t}</button>`).join("")}</div>`;
        st.querySelectorAll(".opt").forEach(b => b.addEventListener("click", () => { const o = opts[+b.dataset.n]; st.querySelectorAll(".opt").forEach((x, n) => { x.disabled = true; if (opts[n].ok)
            x.classList.add("ok"); }); if (!o.ok)
            b.classList.add("no"); done(o.ok, it.y); }));
    },
    fill(st, it, done) {
        st.innerHTML = `<div class="qtext">${fmt(it.q)}<div class="say" style="margin-top:4px">Ketik kata yang hilang · Bab ${it.from}</div></div><div class="row" style="margin:0 0 10px"><input class="inp" id="fin" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Jawaban"><button class="btn" id="fgo">Periksa</button></div><div class="row" style="margin-top:0">${["ä", "ö", "ü", "ß"].map(c => `<button class="chipk" data-c="${c}" type="button">${c}</button>`).join("")}</div><p class="note">Boleh ketik ae, oe, ue, ss sebagai pengganti ä, ö, ü, ß.</p>`;
        const inp = st.querySelector("#fin");
        let fin = false;
        st.querySelectorAll(".chipk").forEach(b => b.addEventListener("click", () => { inp.value += b.dataset.c; inp.focus(); }));
        const check = () => { if (fin || !inp.value.trim())
            return; fin = true; const ok = [it.ans].concat(it.alt || []).some(a => norm(inp.value) === norm(a)); inp.disabled = true; st.querySelector("#fgo").disabled = true; done(ok, ok ? it.y : "Jawaban: <b>" + it.ans + "</b>. " + it.y); };
        st.querySelector("#fgo").addEventListener("click", check);
        inp.addEventListener("keydown", e => { if (e.key === "Enter")
            check(); });
        inp.focus();
    },
    order(st, it, done) {
        const picked = [];
        const tokens = it.tokens.map((t, i) => ({ t, i, used: false }));
        let fin = false;
        function draw() {
            st.innerHTML = `<div class="qtext">${fmt(it.q)}<div class="say" style="margin-top:4px">Bab ${it.from}</div></div><div class="ans">${picked.length ? picked.map((p, n) => `<button class="tk" data-n="${n}" ${fin ? "disabled" : ""}>${p.t}</button>`).join("") : '<span class="note">Ketuk kata di bawah sesuai urutan</span>'}</div><div class="bank">${tokens.map((t, i) => `<button class="tk" data-i="${i}" ${t.used || fin ? "disabled" : ""}>${t.t}</button>`).join("")}</div><div class="row"><button class="btn" id="ochk" ${picked.length === tokens.length && !fin ? "" : "disabled"}>Periksa</button><button class="btn alt" id="oclr" ${fin || !picked.length ? "disabled" : ""}>Ulangi</button></div>`;
            st.querySelectorAll(".bank .tk").forEach(b => b.addEventListener("click", () => { const t = tokens[+b.dataset.i]; t.used = true; picked.push(t); draw(); }));
            st.querySelectorAll(".ans .tk").forEach(b => b.addEventListener("click", () => { const p = picked.splice(+b.dataset.n, 1)[0]; p.used = false; draw(); }));
            st.querySelector("#oclr").addEventListener("click", () => { picked.splice(0).forEach(p => p.used = false); draw(); });
            st.querySelector("#ochk").addEventListener("click", () => { fin = true; const ok = picked.map(p => p.t).join(" ") === it.ans; draw(); done(ok, ok ? it.y : "Kamu menyusun: " + picked.map(p => p.t).join(" ") + ".<br>" + it.y); });
        }
        draw();
    },
    match(st, it, done) {
        const map = {};
        it.pairs.forEach(p => map[p.de] = p.ar);
        const left = it.pairs.map(p => p.de), right = shuffle(it.pairs.map(p => p.ar));
        let selL = null, mis = 0, okL = new Set(), okR = new Set(), fin = false;
        function draw() {
            st.innerHTML = `<div class="qtext">${it.q}<div class="say" style="margin-top:4px">Ketuk kata Jerman, lalu artinya · Bab ${it.from}${mis ? " · salah: " + mis : ""}</div></div><div class="mt"><div>${left.map(l => `<button class="mb ${okL.has(l) ? "okk" : ""} ${selL === l ? "sel1" : ""}" data-l="${esc(l)}" ${okL.has(l) ? "disabled" : ""}>${l}</button>`).join("")}</div><div>${right.map(r => `<button class="mb ${okR.has(r) ? "okk" : ""}" data-r="${esc(r)}" ${okR.has(r) || !selL ? "disabled" : ""}>${r}</button>`).join("")}</div></div>`;
            st.querySelectorAll("[data-l]").forEach(b => b.addEventListener("click", () => { selL = b.dataset.l; draw(); }));
            st.querySelectorAll("[data-r]").forEach(b => b.addEventListener("click", () => {
                const r = b.dataset.r;
                if (map[selL] === r) {
                    okL.add(selL);
                    okR.add(r);
                }
                else
                    mis++;
                selL = null;
                draw();
                if (okL.size === left.length && !fin) {
                    fin = true;
                    done(mis <= 1, mis ? "Salah pasang " + mis + " kali.<br>" + it.y : "Semua pasangan benar.<br>" + it.y);
                }
            }));
        }
        draw();
    }
};
function runSession(box, items, opt) {
    let i = 0, score = 0, over = false;
    const wrong = [];
    function show() {
        const it = items[i];
        let answered = false;
        box.innerHTML = `<div class="qmeta"><span>Soal ${i + 1} dari ${items.length}</span><span>Benar: ${score}</span></div><div id="stage"></div><div id="fb" aria-live="polite"></div>`;
        RENDER[it.type](box.querySelector("#stage"), it, (ok, y) => {
            if (answered || over)
                return;
            answered = true;
            it.answered = true;
            if (ok)
                score++;
            else
                wrong.push(it);
            box.querySelector("#fb").innerHTML = `<div class="fb ${ok ? "ok" : "no"}"><b>${ok ? "Benar!" : "Belum tepat."}</b>${y || ""}</div><div class="row"><button class="btn" id="nx">${i < items.length - 1 ? "Lanjut" : "Lihat hasil"}</button></div>`;
            const nx = box.querySelector("#nx");
            nx.addEventListener("click", () => { i++; i < items.length ? show() : finish(); });
            nx.focus();
        });
    }
    function finish() {
        if (over)
            return;
        over = true;
        items.forEach(it => { if (!it.answered && !wrong.includes(it))
            wrong.push(it); });
        const total = items.length, pct = Math.round(score / total * 100);
        const r = (opt.onFinish && opt.onFinish(pct, score, total)) || {};
        const weak = {};
        wrong.forEach(w => { if (w.from)
            weak[w.from] = (weak[w.from] || 0) + 1; });
        const wk = Object.keys(weak).sort((a, b) => weak[b] - weak[a]);
        box.innerHTML = `<div class="qmeta"><span>Hasil</span></div><div class="score">${score}/${total}</div><p style="margin:10px 0 0">${pct >= 80 ? "Bagus sekali. Pertahankan." : pct >= 60 ? "Cukup baik. Pelajari lagi soal yang salah." : "Perlu diulang. Baca lagi bab yang tertera di bawah."}</p>${r.extra || ""}${wk.length ? `<p class="note">Bab yang perlu diulang: ${wk.map(b => `<a href="#b${b}">Bab ${b}</a>`).join(", ")}</p>` : ""}${wrong.length ? `<details class="rev"><summary>Lihat pembahasan (${wrong.length})</summary>${wrong.map(w => `<div class="rv"><b>${fmt(w.q)}</b><br>Jawaban: ${w.ans}<br><span class="note">${w.y || ""}</span></div>`).join("")}</details>` : ""}<div class="row"><button class="btn alt" id="again">Ulangi</button></div>`;
        box.querySelector("#again").addEventListener("click", r.again || (() => { }));
    }
    show();
    return { finish };
}
const GEN = {
    mc(P) { const x = pick1(P); const q = pick1(x.l.q); return { type: "mc", q: q.q, o: q.o, y: q.y, from: x.b, ans: q.o[0] }; },
    fill(P) { const c = []; P.forEach(({ l, b }) => l.q.forEach(q => { if (q.q.includes("___") && /^[A-Za-zÄÖÜäöüß]+$/.test(q.o[0]))
        c.push({ q, b }); })); if (!c.length)
        return null; const x = pick1(c); return { type: "fill", q: x.q.q, ans: x.q.o[0], y: x.q.y, from: x.b }; },
    order(P) { const c = []; P.forEach(({ l, b }) => l.e.forEach(e => { const w = e[0].split(" "); if (!/[–\/]/.test(e[0]) && w.length >= 3 && w.length <= 9)
        c.push({ e, b }); })); if (!c.length)
        return null; const x = pick1(c); const w = x.e[0].split(" "); let t = shuffle(w); for (let k = 0; k < 5 && t.join(" ") === x.e[0]; k++)
        t = shuffle(w); return { type: "order", q: "Susun kalimat: “" + x.e[1] + "”", tokens: t, ans: x.e[0], y: "Urutan benar: <b>" + x.e[0] + "</b>", from: x.b }; },
    trans(P) { const all = []; L.forEach(l => l.e.forEach(e => all.push(e))); const c = []; P.forEach(({ l, b }) => l.e.forEach(e => c.push({ e, b }))); const x = pick1(c); const d = pick(all.filter(e => e[1] !== x.e[1]), 3).map(e => e[1]); return { type: "mc", q: "Arti dari “" + x.e[0] + "” adalah...", o: [x.e[1]].concat(d), y: "“" + x.e[0] + "” = " + x.e[1], from: x.b, ans: x.e[1] }; },
    art(P) { const c = []; P.forEach(({ l, b }) => l.v.forEach(v => { const m = v[0].match(/^(der|die|das) ([^\/\(]+)$/); if (m)
        c.push({ a: m[1], n: m[2], ar: v[1], b }); })); if (!c.length)
        return null; const x = pick1(c); return { type: "mc", q: "Artikel apa? ___ " + x.n + " (" + x.ar + ")", o: [x.a].concat(["der", "die", "das"].filter(a => a !== x.a)), y: "Yang benar: <b>" + x.a + " " + x.n + "</b>. Hafalkan kata benda bersama artikelnya.", from: x.b, ans: x.a }; },
    match(P) { const c = []; P.forEach(({ l, b }) => l.v.forEach(v => { if (!/\//.test(v[0]) && !/\//.test(v[1]) && v[1].length < 28)
        c.push({ de: v[0], ar: v[1], b }); })); if (!c.length)
        return null; const x = pick1(c); const pairs = pick(c.filter(z => z.b === x.b), 5); const seen = new Set(); const uniq = pairs.every(p => { if (seen.has(p.ar) || seen.has(p.de))
        return false; seen.add(p.ar); seen.add(p.de); return true; }); if (pairs.length < 5 || !uniq)
        return null; return { type: "match", q: "Pasangkan kata Jerman dengan artinya", pairs, ans: pairs.map(p => p.de + " = " + p.ar).join("; "), y: pairs.map(p => "<b>" + p.de + "</b> = " + p.ar).join("<br>"), from: x.b }; }
};
function buildItems(scope, n) {
    const P = L.map((l, i) => ({ l, b: i + 1 })).filter(x => !scope || x.b === scope);
    const types = shuffle(["mc", "fill", "order", "trans", "match", "art"]);
    const out = [];
    let j = 0, guard = 0;
    while (out.length < n && guard++ < 80) {
        const it = GEN[types[j++ % types.length]](P);
        if (it)
            out.push(it);
    }
    while (out.length < n)
        out.push(GEN.mc(P));
    return out;
}
let exScope = 0;
function latihan() {
    $("#app").innerHTML = `<div class="lhead"><h1>Latihan</h1><div class="goal">Satu sesi berisi 10 soal campuran: pilihan ganda, isian, susun kata, pasangkan kata, terjemahan, dan tebak artikel. Setelah tiap soal ada penjelasan.</div></div>
  <div class="tools"><label>Cakupan: <select id="scope" class="sel"><option value="0">Semua bab</option>${L.map((l, i) => `<option value="${i + 1}" ${exScope === i + 1 ? "selected" : ""}>Bab ${i + 1}: ${l.t}</option>`).join("")}</select></label></div>
  <div class="row" style="margin:0 0 6px"><button class="btn" id="go">Mulai 10 soal</button></div>
  <section class="blk" style="margin-top:20px"><div class="quiz" id="quiz" hidden></div></section>`;
    $("#scope").addEventListener("change", e => { exScope = +e.target.value; });
    function start() { const box = $("#quiz"); box.hidden = false; runSession(box, buildItems(exScope, 10), { onFinish: pct => (logRes("latihan", exScope, pct, "Latihan campuran" + (exScope ? " bab " + exScope : "")), { again: start }) }); box.scrollIntoView({ block: "nearest" }); }
    $("#go").addEventListener("click", start);
}
/* ===== Dialog dan main peran ===== */
const DLG = [
    { t: "Perkenalan", sub: "Menyapa dan bertanya asal", bab: 1, l: [
            { s: "A", de: "Hallo! Ich heiße Anna. Wie heißt du?", id: "Halo! Nama saya Anna. Siapa namamu?" },
            { s: "B", de: "Hallo Anna! Ich heiße Budi. Woher kommst du?", id: "Halo Anna! Nama saya Budi. Kamu dari mana?" },
            { s: "A", de: "Ich komme aus Deutschland. Und du?", id: "Saya dari Jerman. Kamu?" },
            { s: "B", de: "Ich komme aus Indonesien. Ich wohne in Bandung.", id: "Saya dari Indonesia. Saya tinggal di Bandung." },
            { s: "A", de: "Freut mich!", id: "Senang berkenalan!" },
            { s: "B", de: "Freut mich auch!", id: "Saya juga senang!" }
        ] },
    { t: "Ajakan akhir pekan", sub: "Hobi, hari, menerima dan menolak", bab: 2, l: [
            { s: "A", de: "Hast du am Samstag Zeit?", id: "Apakah kamu ada waktu hari Sabtu?" },
            { s: "B", de: "Ja, gern! Was machst du?", id: "Ya, dengan senang hati! Kamu mau apa?" },
            { s: "A", de: "Ich spiele Fußball. Spielst du auch gern Fußball?", id: "Saya main sepak bola. Kamu juga suka main sepak bola?" },
            { s: "B", de: "Nein, leider nicht. Ich schwimme gern.", id: "Tidak, sayangnya tidak. Saya suka berenang." },
            { s: "A", de: "Dann schwimmen wir am Sonntag.", id: "Kalau begitu kita berenang hari Minggu." },
            { s: "B", de: "Super! Bis Sonntag!", id: "Bagus! Sampai Minggu!" }
        ] },
    { t: "Tanya jalan", sub: "Arah dan tempat di kota", bab: 3, l: [
            { s: "A", de: "Entschuldigung, wo ist der Bahnhof?", id: "Permisi, di mana stasiun?" },
            { s: "B", de: "Gehen Sie geradeaus und dann links.", id: "Jalan lurus lalu belok kiri." },
            { s: "A", de: "Ist das weit?", id: "Apakah jauh?" },
            { s: "B", de: "Nein, nur fünf Minuten.", id: "Tidak, hanya lima menit." },
            { s: "A", de: "Vielen Dank!", id: "Terima kasih banyak!" },
            { s: "B", de: "Bitte schön!", id: "Sama-sama!" }
        ] },
    { t: "Di kafe", sub: "Memesan dan membayar", bab: 4, l: [
            { s: "A", de: "Guten Tag! Was möchten Sie?", id: "Selamat siang! Anda mau pesan apa?" },
            { s: "B", de: "Ich möchte einen Kaffee und ein Brot, bitte.", id: "Saya mau kopi dan roti." },
            { s: "A", de: "Gern. Sonst noch etwas?", id: "Baik. Ada lagi?" },
            { s: "B", de: "Nein, danke. Was kostet das?", id: "Tidak, terima kasih. Berapa harganya?" },
            { s: "A", de: "Das macht vier Euro fünfzig.", id: "Totalnya empat euro lima puluh." },
            { s: "B", de: "Hier, bitte.", id: "Ini, silakan." }
        ] },
    { t: "Jam dan janji", sub: "Menyebut waktu dan kewajiban", bab: 5, l: [
            { s: "A", de: "Wie spät ist es?", id: "Jam berapa sekarang?" },
            { s: "B", de: "Es ist halb vier.", id: "Setengah empat (03.30)." },
            { s: "A", de: "Oh, ich muss um vier Uhr arbeiten.", id: "Oh, saya harus bekerja pukul empat." },
            { s: "B", de: "Dann musst du jetzt gehen.", id: "Kalau begitu kamu harus pergi sekarang." },
            { s: "A", de: "Ja, tschüss! Bis morgen!", id: "Ya, dah! Sampai besok!" },
            { s: "B", de: "Tschüss!", id: "Dah!" }
        ] },
    { t: "Mengundang ke pesta", sub: "Tanggal dan ajakan", bab: 6, l: [
            { s: "A", de: "Am Samstag habe ich Geburtstag. Ich lade dich ein!", id: "Hari Sabtu saya ulang tahun. Saya mengundangmu!" },
            { s: "B", de: "Danke! Wann ist die Party?", id: "Terima kasih! Kapan pestanya?" },
            { s: "A", de: "Um acht Uhr. Ich hole dich ab.", id: "Pukul delapan. Saya jemput kamu." },
            { s: "B", de: "Super, ich komme gern!", id: "Bagus, saya datang dengan senang hati!" },
            { s: "A", de: "Bis Samstag!", id: "Sampai Sabtu!" },
            { s: "B", de: "Bis Samstag!", id: "Sampai Sabtu!" }
        ] }
];
let dmode = "baca";
function bubble(l, veil) { return `<li class="bub ${l.s === "B" ? "b" : ""} ${veil ? "veil" : ""}"><span class="who">${l.s}</span><div class="say-t"><div class="in"><button class="spk" data-say="${esc(l.de)}" aria-label="Dengar">${SPK}</button><div class="w"><b>${l.de}</b><span class="mean">${l.id}</span></div></div></div></li>`; }
function dialogList() {
    $("#app").innerHTML = `<div class="lhead"><h1>Dialog</h1><div class="goal">Percakapan pendek sehari-hari. Baca dulu, dengarkan, lalu main peran: kamu jadi A atau B dan aplikasi memerankan lawan bicaramu.</div></div><ul class="list2">${DLG.map((d, i) => `<li><a class="card2" href="#d${i + 1}"><b>${d.t}</b><span class="note">${d.sub}</span><span class="pill">Bab ${d.bab}</span></a></li>`).join("")}</ul>`;
}
function dialogView(n) {
    const d = DLG[n - 1];
    $("#app").innerHTML = `<a class="crumb" href="#dialog">← Semua dialog</a><div class="lhead"><div class="st">Bab ${d.bab}</div><h1>${d.t}</h1></div><div class="seg" role="group" aria-label="Mode">${[["baca", "Baca"], ["dengar", "Dengar"], ["peran", "Main peran"]].map(([k, t]) => `<button data-m="${k}" aria-pressed="${dmode === k}">${t}</button>`).join("")}</div><div id="dbody"></div>`;
    $("#app").querySelectorAll(".seg button").forEach(b => b.addEventListener("click", () => { dmode = b.dataset.m; try {
        speechSynthesis.cancel();
    }
    catch (e) { } dialogView(n); }));
    const body = $("#dbody");
    if (dmode === "peran")
        rolePlay(body, d);
    else
        dlgLines(body, d, dmode === "dengar");
}
function dlgLines(body, d, veil) {
    body.innerHTML = `<div class="tools"><button class="btn alt" id="playall">Putar semua</button>${veil ? `<span>Teks dikaburkan. Ketuk balon untuk melihatnya.</span>` : `<label><input type="checkbox" id="hid"> Sembunyikan arti</label>`}</div><ul class="dl" id="dl">${d.l.map(l => bubble(l, veil)).join("")}</ul>`;
    wireSpk(body);
    $("#playall").addEventListener("click", () => AU.play(d.l.map(x => ({ t: x.de, s: x.s }))));
    if (veil)
        body.querySelectorAll(".bub").forEach(li => li.addEventListener("click", () => li.classList.remove("veil")));
    else
        $("#hid").addEventListener("change", e => $("#dl").classList.toggle("hidemean", e.target.checked));
}
function rolePlay(body, d) {
    let role = null, i = 0, shown = false, lastR = null;
    function pickRole() {
        body.innerHTML = `<div class="goal">Pilih peranmu. Lawan bicara diucapkan oleh aplikasi. Untuk bagianmu, ucapkan jawaban dengan suara keras sebelum menekan tombol jawaban.</div><div class="row"><button class="btn" data-r="A">Saya jadi A</button><button class="btn alt" data-r="B">Saya jadi B</button></div>`;
        body.querySelectorAll("[data-r]").forEach(b => b.addEventListener("click", () => { role = b.dataset.r; i = 0; shown = false; step(true); }));
    }
    function step(fresh) {
        const hist = d.l.slice(0, i).map(l => bubble(l, false)).join("");
        if (i >= d.l.length) {
            if (fresh)
                logRes("dialog", d.bab, null, "Main peran: " + d.t + " (peran " + role + ")");
            body.innerHTML = `<ul class="dl">${hist}</ul><div class="fb ok" style="margin-top:14px"><b>Selesai!</b>Ulangi dengan peran lain supaya dua-duanya terlatih.</div><div class="row"><button class="btn" id="re">Main lagi</button></div>`;
            wireSpk(body);
            body.querySelector("#re").addEventListener("click", pickRole);
            return;
        }
        const ln = d.l[i];
        let cur, speakNow = false;
        if (ln.s !== role) {
            cur = `<ul class="dl">${bubble(ln, false)}</ul><div class="row"><button class="btn" id="nx">Lanjut</button></div>`;
            speakNow = fresh;
        }
        else if (!shown)
            cur = `<div class="goal"><b>Giliranmu (${role})</b><br>Katakan dalam bahasa Jerman: ${ln.id}</div><div id="rpc"></div><div class="row"><button class="btn" id="rv">Tampilkan jawaban</button></div>`;
        else
            cur = `${lastR ? `<div class="spkres">${lastR.html}</div>` : ""}<ul class="dl">${bubble(ln, false)}</ul><div class="row"><button class="btn" id="nx">Lanjut</button></div>`;
        body.innerHTML = `<div class="qmeta"><span>Peran ${role}</span><span>${i + 1} dari ${d.l.length}</span></div>${hist ? `<ul class="dl" style="margin-bottom:14px">${hist}</ul>` : ""}${cur}`;
        wireSpk(body);
        const nx = body.querySelector("#nx"), rv = body.querySelector("#rv");
        if (nx)
            nx.addEventListener("click", () => { i++; shown = false; lastR = null; step(true); });
        if (rv)
            rv.addEventListener("click", () => { shown = true; step(false); speak(ln.de); });
        const rpc = body.querySelector("#rpc");
        if (rpc)
            speakCheck(rpc, ln.de, r => { lastR = r; shown = true; step(false); speak(ln.de); });
        if (speakNow)
            speak(ln.de);
    }
    pickRole();
}
/* ===== Bacaan ===== */
const RD = [
    { t: "Ich bin Siti", sub: "Perkenalan diri", bab: 1, s: [
            ["Hallo, ich heiße Siti.", "Halo, nama saya Siti."], ["Ich bin zwanzig Jahre alt.", "Umur saya dua puluh tahun."], ["Ich komme aus Indonesien und wohne in Bandung.", "Saya berasal dari Indonesia dan tinggal di Bandung."], ["Ich lerne Deutsch.", "Saya belajar bahasa Jerman."]
        ],
        q: [{ q: "Berapa umur Siti?", o: ["20 tahun", "12 tahun", "21 tahun", "30 tahun"], y: "zwanzig = 20." }, { q: "Siti tinggal di...", o: ["Bandung", "Jakarta", "Berlin", "Hamburg"], y: "Ich wohne in Bandung." }, { q: "Apa yang Siti pelajari?", o: ["Bahasa Jerman", "Bahasa Inggris", "Matematika", "Musik"], y: "Ich lerne Deutsch." }] },
    { t: "Mein Tag", sub: "Rutinitas Budi", bab: 5, s: [
            ["Ich stehe um sechs Uhr auf.", "Saya bangun pukul enam."], ["Um sieben Uhr trinke ich Kaffee und esse ein Brot.", "Pukul tujuh saya minum kopi dan makan roti."], ["Von acht bis fünf Uhr arbeite ich.", "Dari pukul delapan sampai lima saya bekerja."], ["Am Abend koche ich Reis und Gemüse.", "Pada malam hari saya memasak nasi dan sayur."], ["Am Wochenende spiele ich gern Fußball.", "Di akhir pekan saya suka bermain sepak bola."]
        ],
        q: [{ q: "Pukul berapa Budi bangun?", o: ["Pukul enam", "Pukul tujuh", "Pukul delapan", "Pukul lima"], y: "um sechs Uhr = pukul enam." }, { q: "Apa yang dimasak Budi malam hari?", o: ["Nasi dan sayur", "Mi dan ikan", "Roti dan keju", "Sup dan daging"], y: "Reis und Gemüse." }, { q: "Apa kegiatan Budi di akhir pekan?", o: ["Bermain sepak bola", "Berenang", "Membaca", "Memasak"], y: "Am Wochenende spiele ich gern Fußball." }] },
    { t: "Meine Familie", sub: "Keluarga dan kata milik", bab: 5, s: [
            ["Das ist meine Familie.", "Ini keluarga saya."], ["Mein Vater heißt Hasan und meine Mutter heißt Dewi.", "Ayah saya bernama Hasan dan ibu saya bernama Dewi."], ["Ich habe einen Bruder und zwei Schwestern.", "Saya punya satu saudara laki-laki dan dua saudara perempuan."], ["Mein Bruder ist fünfzehn Jahre alt.", "Saudara laki-laki saya berumur lima belas tahun."], ["Meine Oma wohnt in Surabaya.", "Nenek saya tinggal di Surabaya."], ["Wir besuchen sie im Sommer.", "Kami mengunjunginya di musim panas."]
        ],
        q: [{ q: "Berapa saudara perempuan yang dimiliki penulis?", o: ["Dua", "Satu", "Tiga", "Tidak ada"], y: "zwei Schwestern." }, { q: "Siapa nama ayah?", o: ["Hasan", "Dewi", "Budi", "Anton"], y: "Mein Vater heißt Hasan." }, { q: "Di mana nenek tinggal?", o: ["Surabaya", "Bandung", "Jakarta", "Bali"], y: "Meine Oma wohnt in Surabaya." }] },
    { t: "Eine Postkarte", sub: "Kartu pos dari liburan", bab: 12, s: [
            ["Liebe Anna,", "Anna tersayang,"], ["viele Grüße aus Bali!", "salam hangat dari Bali!"], ["Das Wetter ist sonnig und warm.", "Cuacanya cerah dan hangat."], ["Wir sind am Strand und schwimmen.", "Kami ada di pantai dan berenang."], ["Das Hotel ist schön.", "Hotelnya bagus."], ["Morgen machen wir eine Stadttour.", "Besok kami melakukan tur kota."], ["Bis bald, Siti", "Sampai jumpa, Siti"]
        ],
        q: [{ q: "Di mana Siti berlibur?", o: ["Bali", "Berlin", "Bandung", "Hamburg"], y: "aus Bali." }, { q: "Bagaimana cuacanya?", o: ["Cerah dan hangat", "Hujan", "Dingin", "Berangin"], y: "sonnig und warm." }, { q: "Apa rencana besok?", o: ["Tur kota", "Berenang", "Pulang", "Belanja"], y: "Morgen machen wir eine Stadttour." }] }
];
function bacaView(n) {
    const r = RD[n - 1];
    $("#app").innerHTML = `<a class="crumb" href="#baca">← Semua bacaan</a><div class="lhead"><div class="st">Bab ${r.bab} · ${r.jenis}</div><h1>${r.t}</h1><div class="goal">Baca teksnya, lalu jawab pertanyaan di bawah. Coba dulu tanpa membuka arti; ketuk kalimat hanya jika benar-benar perlu. Pembahasan muncul setelah setiap jawaban.</div></div>
  <div class="tools"><button class="btn alt" id="playall">Putar semua</button><button class="btn alt" id="showall">Tampilkan semua arti</button></div>
  <ul class="ex rd hid" id="rd">${r.s.map(s => `<li><button class="spk" data-say="${esc(s[0])}" aria-label="Dengar kalimat">${SPK}</button><div class="w"><b>${s[0]}</b><span class="mean">${s[1]}</span></div></li>`).join("")}</ul>
  <section class="blk"><h2>Cek pemahaman</h2><div class="quiz" id="quiz"></div></section>`;
    wireSpk($("#app"));
    $("#app").querySelectorAll("#rd li").forEach(li => li.addEventListener("click", () => li.classList.add("show")));
    $("#playall").addEventListener("click", () => speakSeq(r.s.map(s => s[0])));
    $("#showall").addEventListener("click", () => $("#app").querySelectorAll("#rd li").forEach(li => li.classList.add("show")));
    runQuiz($("#quiz"), shuffle(r.q), pct => (store.rbest[r.t] = Math.max(store.rbest[r.t] || 0, pct), logRes("lesen", r.bab, pct, "Lesen: " + r.t), markSkill(r.bab, "L", pct), { pass: true, again: () => bacaView(n), msg: pct >= 67 ? "Pemahamanmu bagus. Coba teks lain." : "Baca ulang teksnya, lalu coba lagi.", next: `<a class="btn" href="#baca">Teks lain</a>` }));
}
/* ===== Pola tata bahasa ===== */
const PAT = [
    { t: "Kata kerja selalu di posisi ke-2", bab: 1, tags: "urutan kalimat posisi kata kerja v2", rumus: "Posisi 1 + KATA KERJA + sisanya", ex: [["Ich wohne in Bandung.", "Saya tinggal di Bandung."], ["Heute wohne ich in Jakarta.", "Hari ini saya tinggal di Jakarta."]], jb: "Setelah keterangan waktu di depan, subjek pindah ke belakang kata kerja. Bukan Heute ich wohne." },
    { t: "Kata tanya W", bab: 1, tags: "wo woher wer was wie wann warum pertanyaan", rumus: "Kata tanya W + kata kerja + subjek ?", ex: [["Wo wohnst du?", "Kamu tinggal di mana?"], ["Woher kommst du?", "Kamu dari mana?"]], jb: "Jangan menaruh subjek sebelum kata kerja. Bukan Wo du wohnst." },
    { t: "Pertanyaan ya atau tidak", bab: 2, tags: "pertanyaan ya tidak kata kerja depan", rumus: "KATA KERJA + subjek + ... ?", ex: [["Hast du am Samstag Zeit?", "Apakah kamu ada waktu hari Sabtu?"], ["Spielst du gern Fußball?", "Apakah kamu suka bermain sepak bola?"]], jb: "Tanpa kata tanya. Kata kerja pindah ke posisi 1." },
    { t: "Jenis kata benda dan artikel", bab: 3, tags: "artikel der die das genus", rumus: "der (maskulin) · die (feminin) · das (netral) · die (jamak)", ex: [["der Bahnhof, die Bank, das Kino", "stasiun, bank, bioskop"]], jb: "Hafalkan kata benda bersama artikelnya. Akhiran -ung, -heit, -keit hampir selalu die. Akhiran -chen selalu das." },
    { t: "nicht atau kein", bab: 3, tags: "negasi tidak bukan nicht kein", rumus: "kein + kata benda · nicht + kata kerja atau sifat", ex: [["Das ist kein Kino.", "Ini bukan bioskop."], ["Ich bin nicht müde.", "Saya tidak lelah."]], jb: "Kata benda yang memakai ein atau tanpa artikel dinegasi dengan kein." },
    { t: "Bentuk jamak", bab: 3, tags: "jamak plural", rumus: "-n / -en · -e · -er (+ umlaut) · -s · umlaut saja", ex: [["die Frauen, die Hunde, die Kinder, die Autos", "para wanita, anjing-anjing, anak-anak, mobil-mobil"]], jb: "Artikel jamak selalu die. Pola jamak tidak bisa ditebak, jadi hafalkan bersama katanya." },
    { t: "Akusatif", bab: 4, tags: "akusatif den einen keinen objek", rumus: "der → den · ein → einen · kein → keinen (hanya maskulin)", ex: [["Ich möchte einen Kaffee.", "Saya mau kopi."], ["Ich habe keinen Hund.", "Saya tidak punya anjing."]], jb: "die, das, dan jamak tidak berubah di akusatif." },
    { t: "möchten dan mögen", bab: 4, tags: "möchten mögen ingin suka memesan", rumus: "Subjek + möchte(st / n / t) + objek", ex: [["Ich möchte einen Tee.", "Saya mau teh."], ["Ich mag keinen Fisch.", "Saya tidak suka ikan."]], jb: "möchte = ingin, mag = suka. Keduanya kata kerja modal." },
    { t: "Kata kerja modal", bab: 5, tags: "modal müssen können wollen", rumus: "Subjek + MODAL (posisi 2) + ... + KATA KERJA BENTUK DASAR (akhir)", ex: [["Ich muss heute arbeiten.", "Saya harus bekerja hari ini."], ["Kannst du morgen kommen?", "Bisakah kamu datang besok?"]], jb: "Kata kerja utama tidak diubah, tetap bentuk dasar di akhir kalimat." },
    { t: "Jam: halb", bab: 5, tags: "jam uhr halb viertel waktu", rumus: "halb + jam berikutnya = setengah menuju jam itu", ex: [["Es ist halb vier.", "Sekarang pukul 03.30."]], jb: "halb vier adalah 03.30, bukan 04.30." },
    { t: "Kata milik", bab: 5, tags: "kata milik mein meine dein possessiv", rumus: "mein, dein, sein, ihr, unser, euer · tambah -e untuk die dan jamak", ex: [["Mein Vater heißt Hasan.", "Ayah saya bernama Hasan."], ["Meine Mutter ist Lehrerin.", "Ibu saya seorang guru."]], jb: "Di akusatif, maskulin memakai -en: Ich besuche meinen Vater." },
    { t: "Kata kerja terpisah", bab: 6, tags: "terpisah trennbar aufstehen mitkommen awalan", rumus: "Subjek + kata kerja ... + AWALAN (akhir kalimat)", ex: [["Ich stehe um sieben Uhr auf.", "Saya bangun pukul tujuh."], ["Kommst du mit?", "Kamu ikut?"]], jb: "Awalan terlepas dan pindah ke akhir kalimat. Di bentuk dasar tetap menyatu." },
    { t: "und, oder, aber, denn", bab: 7, tags: "penghubung und oder aber denn", rumus: "Kalimat 1 + penghubung + kalimat 2 (urutan tidak berubah)", ex: [["Ich arbeite gern, aber ich bin heute müde.", "Saya suka bekerja, tetapi hari ini saya lelah."]], jb: "Penghubung ini tidak menghitung sebagai posisi 1, jadi kata kerja tetap di posisi 2." },
    { t: "Dativ setelah mit dan bei", bab: 7, tags: "dativ mit bei dem der den", rumus: "mit / bei / von / aus / zu + dem · der · dem · den (+ n)", ex: [["Ich fahre mit dem Bus.", "Saya naik bus."], ["Ich arbeite bei der Bank.", "Saya bekerja di bank."]], jb: "Gabungan yang sering muncul: im, am, beim, zum, zur." },
    { t: "Imperatif", bab: 8, tags: "imperatif perintah komm kommen sie", rumus: "du: batang kata · ihr: bentuk ihr · Sie: kata kerja + Sie", ex: [["Komm!", "Datanglah!"], ["Trinken Sie viel Wasser!", "Minumlah banyak air!"]], jb: "Kata kerja yang berubah vokal untuk du juga berubah di imperatif: essen menjadi Iss!" },
    { t: "Wo atau Wohin", bab: 9, tags: "wo wohin in an auf dativ akusatif posisi arah", rumus: "Wo? + dativ (diam) · Wohin? + akusatif (bergerak)", ex: [["Ich bin in der Küche.", "Saya ada di dapur."], ["Ich gehe in die Küche.", "Saya pergi ke dapur."]], jb: "Berlaku untuk an, auf, hinter, in, neben, über, unter, vor, zwischen." },
    { t: "Perfekt", bab: 10, tags: "perfekt lampau partizip haben sein", rumus: "haben atau sein (posisi 2) + ... + Partizip II (akhir)", ex: [["Ich habe gestern gearbeitet.", "Kemarin saya bekerja."], ["Wir sind nach Hause gegangen.", "Kami pulang."]], jb: "Kata kerja gerak dan perubahan keadaan memakai sein." },
    { t: "Kata ganti dativ", bab: 11, tags: "dativ mir dir ihm gefallen passen gehören", rumus: "mir · dir · ihm · ihr · ihm · uns · euch · ihnen", ex: [["Die Jacke gefällt mir.", "Saya suka jaket itu."]], jb: "gefallen, gehören, passen, schmecken, dan helfen selalu memakai dativ." }
];
function latihPola(i) {
    const p = PAT[i], box = $("#pq" + i);
    box.hidden = false;
    runQuiz(box, pick(L[p.bab - 1].q, Math.min(5, L[p.bab - 1].q.length)), pct => (logRes("pola", p.bab, pct, "Pola: " + p.t), { pass: pct >= 60, again: () => latihPola(i), msg: pct >= 60 ? "Pola ini sudah kamu pegang." : "Baca lagi rumus dan contohnya, lalu coba lagi.", next: "" }));
}
/* ===== Simulasi tes ===== */
function examItems() {
    const out = [];
    for (let b = 1; b <= 6; b++)
        pick(L[b - 1].q, 3).forEach(q => out.push({ type: "mc", q: q.q, o: q.o, y: q.y, from: b, ans: q.o[0] }));
    pick([7, 8, 9, 10, 11, 12], 2).forEach(b => { const q = pick1(L[b - 1].q); out.push({ type: "mc", q: q.q, o: q.o, y: q.y, from: b, ans: q.o[0] }); });
    return shuffle(out);
}
function tesCepat() {
    const last = store.exams[store.exams.length - 1];
    $("#app").innerHTML = `<a class="crumb" href="#tes">← Simulasi ujian</a><div class="lhead"><h1>Tes campuran cepat</h1><div class="goal">20 soal pilihan ganda kosakata dan tata bahasa dari bab 1 sampai 12 (bab 1 sampai 6 lebih banyak), waktu 20 menit. Untuk latihan per keterampilan, pakai simulasi Hören, Lesen, Schreiben, dan Sprechen.</div></div>
  ${last ? `<p class="note">Percobaan terakhir: ${last.score}/${last.total} (${last.pct}%).</p>` : ""}
  <div class="row" id="srow"><button class="btn" id="start">Mulai simulasi</button></div>
  <section class="blk" style="margin-top:20px"><div class="chip timer" id="timer" hidden></div><div class="quiz" id="quiz" hidden></div></section>`;
    $("#start").addEventListener("click", () => {
        $("#srow").hidden = true;
        $("#quiz").hidden = false;
        const tm = $("#timer");
        tm.hidden = false;
        let left = 1200;
        const tick = () => { tm.textContent = "Sisa waktu " + Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0"); };
        tick();
        const sess = runSession($("#quiz"), examItems(), { onFinish: (pct, score, total) => { if (activeTimer) {
                clearInterval(activeTimer);
                activeTimer = null;
            } tm.hidden = true; store.exams.push({ d: Date.now(), pct, score, total }); logRes("tes", 0, pct, "Tes campuran cepat"); return { again: tesCepat, extra: `<p class="note">Ambang lulus tes resmi ditentukan penyelenggara. Anggap 70% atau lebih di dua simulasi berturut-turut sebagai tanda siap.</p>` }; } });
        activeTimer = setInterval(() => { left--; tick(); if (left <= 0) {
            clearInterval(activeTimer);
            activeTimer = null;
            sess.finish();
        } }, 1000);
    });
}
/* ===== Progres dan tracker ===== */
function todayStrip() {
    const due = dueCards(0).length, t = store.days[keyOf(new Date())] || 0;
    return `<div class="stats"><div class="stat"><b>${streak()}</b><span>hari beruntun</span></div><div class="stat"><b>${due}</b><span>kartu jatuh tempo</span></div><div class="stat"><b>${fmtMin(t)}</b><span>belajar hari ini</span></div></div>`;
}
/* ===== Bicara: mic (capability dictation) dan percakapan dengan Claude (capability sample) ===== */
let SAMPLE = null, deLang = true, chat = null;
const escH = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const MICSVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11h-2z"/></svg>';
const Mic = { d: null, active: null, dead: false, timer: null,
    init(d) {
        this.d = d;
        d.onPartial(e => { const a = this.active; if (!a)
            return; if (e.text)
            this.clear(); if (a.onPartial)
            a.onPartial(e.text); });
        d.onFinal(e => { const a = this.active; if (!a)
            return; if (a.onFinal)
            a.onFinal(e.text); if (a.autoStop) {
            this.clear();
            this.timer = setTimeout(() => this.stop(), a.autoStop);
        } });
        d.onState(e => { const a = this.active; if (a && a.onState)
            a.onState(e.state); if (e.state === "idle") {
            this.clear();
            if (a) {
                this.active = null;
                if (a.onEnd)
                    a.onEnd(e.reason || "stopped");
            }
        } });
        refreshMics();
    },
    clear() { if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
    } },
    start(h) {
        if (!this.d)
            return;
        this.active = h;
        this.d.start(deLang ? { language: "de" } : {}).catch(err => { const code = (err && err.code) || "upstream_error"; if (this.active === h) {
            this.active = null;
            this.clear();
            if (h.onEnd)
                h.onEnd(code);
        } });
    },
    stop() { this.clear(); if (this.d)
        this.d.stop().catch(() => { }); }
};
function micMsg(r) {
    if (r === "unavailable") {
        if (deLang) {
            deLang = false;
            return "Pengenalan suara bahasa Jerman belum tersedia untukmu. Ketuk mic lagi untuk memakai bahasa perangkatmu (kurang akurat untuk bahasa Jerman).";
        }
        Mic.dead = true;
        refreshMics();
        return "Mic tidak tersedia di tampilan ini. Ketik jawabanmu.";
    }
    if (r === "not_granted")
        return "Izin mic belum diberikan. Izinkan mic di pengaturan browser atau menu izin halaman, atau ketik jawabanmu.";
    if (r === "rate_limited")
        return "Terlalu sering memakai mic. Tunggu sebentar lalu coba lagi.";
    if (r === "no_gesture" || r === "upstream_error" || r === "invalid_argument")
        return "Mic gagal dimulai. Ketuk sekali lagi, atau ketik jawabanmu.";
    return "";
}
function micBtn(b, on) { b.classList.toggle("on", on); const s = b.querySelector("span"); if (s)
    s.textContent = on ? "Selesai" : "Bicara"; b.setAttribute("aria-pressed", String(on)); }
function refreshMics() {
    document.querySelectorAll("[data-mic]").forEach(b => { b.hidden = !Mic.d || Mic.dead; });
    const s = document.getElementById("micstat");
    if (s)
        s.textContent = Mic.d && !Mic.dead ? "Mic siap. Saat pertama dipakai kamu akan diminta izin. Pengenalan suara dicoba dalam bahasa Jerman." : "Mic tidak tersedia di tampilan ini. Butuh Chrome atau Edge, atau jendela utama aplikasi desktop Claude. Kamu tetap bisa mengetik.";
    const c = document.getElementById("chatstat");
    if (c)
        c.textContent = SAMPLE ? "Percakapan dengan Claude siap. Setiap pesan memakai kuota Claude milikmu." : "Percakapan dengan Claude hanya tersedia saat halaman dibuka di claude.ai.";
}
(function () {
    const c = window.claude;
    if (!c || !c.use) {
        const go = function () { const w = typeof webSpeechAdapter === "function" && webSpeechAdapter(); if (w)
            Mic.init(w); };
        if (document.readyState === "loading")
            document.addEventListener("DOMContentLoaded", go);
        else
            setTimeout(go, 0);
        return;
    }
    c.use("dictation").then(d => { if (d)
        Mic.init(d); }).catch(() => { });
    c.use("sample").then(s => { SAMPLE = s; refreshMics(); if (location.hash === "#ngobrol" && !chat)
        route(); }).catch(() => { });
})();
const tokz = s => s.toLowerCase().replace(/ß/g, "ss").replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
let spScope = 0;
function ulangi() {
    const pool = [];
    L.forEach((l, i) => { if (!spScope || spScope === i + 1)
        l.e.forEach(e => { if (!/[–\/]/.test(e[0]) && e[0].split(" ").length <= 10)
            pool.push({ de: e[0], ar: e[1], b: i + 1 }); }); });
    const items = shuffle(pool).slice(0, 8), sc = [];
    let idx = 0;
    $("#app").innerHTML = `<a class="crumb" href="#bicara">← Bicara</a><div class="lhead"><h1>Ulangi kalimat</h1><div class="goal">Dengarkan contoh, ucapkan dengan suara keras, lalu lihat kata mana yang terdengar tepat. Satu sesi berisi 8 kalimat.</div></div>
  <div class="tools"><label>Cakupan: <select id="spsel" class="sel"><option value="0">Semua bab</option>${L.map((l, i) => `<option value="${i + 1}" ${spScope === i + 1 ? "selected" : ""}>Bab ${i + 1}: ${l.t}</option>`).join("")}</select></label></div>
  <div class="quiz" id="spq"></div><p class="note" id="micstat"></p>`;
    $("#spsel").addEventListener("change", e => { spScope = +e.target.value; ulangi(); });
    const box = $("#spq");
    function show() {
        if (idx >= items.length) {
            const vals = sc.filter(v => typeof v === "number"), avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
            store.spk = (store.spk || 0) + vals.length;
            save(store);
            if (vals.length) {
                logRes("sprechen", spScope, avg, "Ulangi kalimat" + (spScope ? " bab " + spScope : ""));
                if (spScope)
                    markSkill(spScope, "Sp", avg);
            }
            box.innerHTML = `<div class="qmeta"><span>Hasil</span></div><div class="score">${avg}%</div><p style="margin:10px 0 0">Rata-rata dari ${vals.length} kalimat yang kamu coba.</p><div class="row"><button class="btn" id="again">Sesi baru</button><a class="btn alt" href="#ngobrol">Coba ngobrol</a></div>`;
            box.querySelector("#again").addEventListener("click", ulangi);
            return;
        }
        const it = items[idx];
        box.innerHTML = `<div class="qmeta"><span>Kalimat ${idx + 1} dari ${items.length}</span><span>Bab ${it.b}</span></div><div class="fw" style="font-size:1.6rem;margin-bottom:10px;text-align:left">${escH(it.de)}</div><div class="row" style="margin:0 0 6px"><button class="btn alt" id="hear" type="button">Dengar contoh</button><button class="btn alt" id="mean" type="button">Lihat arti</button></div><p class="note" id="mn" hidden>${escH(it.ar)}</p><div id="chk"></div><div class="row"><button class="btn" id="nx2" type="button">${idx < items.length - 1 ? "Kalimat berikutnya" : "Lihat hasil"}</button></div>`;
        box.querySelector("#hear").addEventListener("click", () => speak(it.de));
        box.querySelector("#mean").addEventListener("click", () => { box.querySelector("#mn").hidden = false; });
        speakCheck(box.querySelector("#chk"), it.de, r => { sc[idx] = r.pct; });
        box.querySelector("#nx2").addEventListener("click", () => { if (Mic.active)
            Mic.stop(); idx++; show(); });
    }
    show();
    refreshMics();
}
const SCEN = [
    { t: "Perkenalan", bab: 1, desc: "Kamu bertemu teman baru di kelas bahasa Jerman.", role: "Anna, teman sekelas yang baru kenal dengan pelajar", goal: "menyapa, menyebut nama, asal, tempat tinggal, dan umur" },
    { t: "Di kafe", bab: 4, desc: "Kamu duduk di sebuah kafe di Hamburg dan mau memesan.", role: "pelayan kafe yang ramah", goal: "memesan makanan dan minuman, menanyakan harga, dan membayar" },
    { t: "Tanya jalan", bab: 3, desc: "Kamu tersesat di kota dan butuh arah.", role: "warga kota yang membantu menjelaskan arah", goal: "menanyakan dan menjelaskan arah ke stasiun, apotek, atau bank" },
    { t: "Kegiatan sehari-hari", bab: 5, desc: "Temanmu ingin tahu kegiatan harianmu.", role: "Tom, teman yang penasaran dengan kegiatan harian pelajar", goal: "jam, kegiatan harian, keluarga, dan hobi" },
    { t: "Topik bebas", bab: 12, desc: "Pilih topik apa saja yang sudah kamu pelajari.", role: "guru bahasa Jerman yang sabar", goal: "topik A1 apa saja yang dipilih pelajar" }
];
function chatErr(c) { return ({ not_granted: "Kamu belum mengizinkan halaman ini memakai Claude, jadi percakapan tidak bisa berjalan.", sampling_disabled: "Claude tidak tersedia untuk akunmu.", rate_limited: "Terlalu banyak permintaan atau kuota Claude-mu sedang habis. Tunggu sebentar lalu coba lagi.", session_expired: "Sesimu habis. Masuk lagi ke claude.ai lalu muat ulang halaman.", timeout: "Claude terlalu lama membalas. Periksa koneksi, lalu tekan Coba lagi.", cancelled: "", invalid_json: "Balasan Claude tidak terbaca. Coba lagi." })[c] || "Terjadi gangguan koneksi. Coba lagi."; }
function ngobrol() {
    chat = null;
    if (!SAMPLE) {
        $("#app").innerHTML = `<a class="crumb" href="#bicara">← Speaking Lab</a><div class="lhead"><h1>Tutor AI (Ngobrol dengan Claude)</h1><div class="goal"><b>Tutor AI tidak tersedia di tampilan ini.</b> Fitur ini memakai Claude dan hanya berjalan saat halaman dibuka sebagai artifact di claude.ai, dalam keadaan masuk, dan halaman diizinkan memakai Claude. Di website biasa tidak ada layanan AI yang tersambung. Semua latihan lain tetap berjalan tanpa AI.</div></div><section class="blk"><h2>Latihan percakapan tanpa AI</h2><ul class="list2"><li><a class="card2" href="#dialog"><b>Dialog main peran</b><span class="note">12 percakapan sehari-hari, kamu jadi A atau B.</span></a></li><li><a class="card2" href="#bicara-kenal"><b>Perkenalan diri</b><span class="note">Dengan umpan balik kata kunci dan tata bahasa.</span></a></li><li><a class="card2" href="#bicara-1"><b>Jawab pertanyaan per bab</b><span class="note">Pertanyaan lisan dengan contoh jawaban.</span></a></li><li><a class="card2" href="#ulangi"><b>Ulangi kalimat</b><span class="note">Dengar, ucapkan, cek ketepatan.</span></a></li></ul></section>`;
        return;
    }
    $("#app").innerHTML = `<a class="crumb" href="#bicara">← Bicara</a><div class="lhead"><h1>Ngobrol dengan Claude</h1><div class="goal">Pilih situasi. Claude memerankan lawan bicaramu dengan bahasa Jerman A1, mengoreksi kalimatmu dalam bahasa Indonesia, dan memberi contoh jawaban. Ketik atau bicara lewat mic.</div></div>
  <ul class="list2">${SCEN.map((s, i) => `<li><button class="card2" type="button" data-s="${i}"><b>${s.t}</b><span class="note">${s.desc}</span><span class="pill">Bab ${s.bab}</span></button></li>`).join("")}</ul><p class="note" id="micstat"></p><p class="note">Setiap pesan memakai kuota Claude milikmu, dan saat pertama kali kamu diminta izin.</p>`;
    $("#app").querySelectorAll("[data-s]").forEach(b => b.addEventListener("click", () => startChat(+b.dataset.s)));
    refreshMics();
}
function startChat(i) {
    const sc = SCEN[i];
    const instr = `Kamu berperan sebagai ${sc.role} dalam percakapan latihan bahasa Jerman level A1 untuk pelajar pemula asal Indonesia yang belajar dengan buku Netzwerk neu A1. Situasi: ${sc.desc} Fokus latihan: ${sc.goal}.
Aturan:
- Balas dengan bahasa Jerman sederhana level A1: 1 sampai 2 kalimat pendek, maksimal 10 kata per kalimat. Pakai kata kerja beraturan, sein, haben, möchten, dan kata kerja modal. ${sc.bab >= 10 ? "Perfekt sederhana boleh dipakai karena topiknya masa lalu." : "Jangan pakai Perfekt."} Jangan pakai Konjunktiv atau kosakata sulit.
- Akhiri dengan satu pertanyaan sederhana supaya percakapan berlanjut.
- Kalau pelajar menulis dalam bahasa Indonesia atau Inggris, balas ramah dalam bahasa Jerman dan beri tahu cara mengatakannya dalam bahasa Jerman di kolom "koreksi".
- Kalau kalimat pelajar punya kesalahan penting, isi "koreksi" dengan kalimat yang benar dan penjelasan singkat dalam bahasa Indonesia (maksimal 2 kalimat). Kalau tidak ada kesalahan penting, isi "koreksi" dengan string kosong. Teks dari pengenalan suara bisa tanpa tanda baca atau huruf besar: abaikan itu.
- Pakai kosakata dan tata bahasa A1 sampai bab ${sc.bab}. Jika pelajar memakai bahasa Jerman yang benar tetapi di atas A1, terima saja dan jangan dikoreksi.
- Tulis "koreksi" untuk pemula: kutip bagian yang salah, beri bentuk yang benar, lalu sebut aturannya dalam satu kalimat bahasa Indonesia yang sederhana (misalnya posisi kata kerja, akhiran kata kerja, artikel, atau du/Sie).
- Isi "saran" dengan 2 contoh jawaban pelajar dalam bahasa Jerman A1 untuk membalas pertanyaanmu.
- Balas hanya dengan satu objek JSON tanpa teks lain, dengan bentuk: {"de":"balasanmu dalam bahasa Jerman","id":"terjemahan bahasa Indonesia","koreksi":"","saran":["contoh jawaban 1","contoh jawaban 2"]}`;
    const ch = { sc, turns: [{ role: "user", content: instr + "\n\nMulai percakapan sekarang dengan sapaan singkat dan satu pertanyaan." }], msgs: [], busy: false, err: null, retry: false, ctl: null };
    chat = ch;
    $("#app").innerHTML = `<a class="crumb" href="#ngobrol">← Ganti situasi</a><div class="lhead"><div class="st">Bab ${sc.bab}</div><h1>${sc.t}</h1><div class="goal">${sc.desc}</div></div>
  <div class="tools"><label><input type="checkbox" id="tts" checked> Suara balasan</label><label><input type="checkbox" id="auto" checked> Kirim otomatis setelah bicara</label></div>
  <ul class="dl" id="msgs"></ul><div id="cerr"></div><div class="sugs" id="sugs"></div>
  <div class="comp"><button class="mic" type="button" id="cmic" data-mic hidden aria-pressed="false">${MICSVG}<span>Bicara</span></button><input class="inp" id="cin" placeholder="Ketik atau bicara dalam bahasa Jerman" aria-label="Pesanmu" autocomplete="off" spellcheck="false"><button class="btn" id="csend" type="button">Kirim</button></div>
  <div class="note" id="cnote" aria-live="polite"></div>
  <div class="row"><button class="btn alt" id="cend" type="button">Akhiri dan lihat rangkuman</button></div><div id="sum"></div>`;
    const cin = $("#cin"), cn = $("#cnote"), cmic = $("#cmic");
    function draw() {
        if (chat !== ch)
            return;
        const ul = $("#msgs");
        if (!ul)
            return;
        ul.innerHTML = ch.msgs.map(m => m.who === "ai"
            ? `<li class="bub mveil"><span class="who">C</span><div class="say-t"><div class="in"><button class="spk" data-say="${escH(m.de)}" aria-label="Dengar">${SPK}</button><div class="w"><b>${escH(m.de)}</b><span class="mean">${escH(m.id)}</span></div></div></div></li>`
            : `<li class="bub b"><span class="who">K</span><div class="say-t"><b>${escH(m.text)}</b>${m.koreksi ? `<div class="corr"><b>Koreksi:</b> ${escH(m.koreksi)}</div>` : ""}</div></li>`).join("")
            + (ch.busy ? `<li class="bub"><span class="who">C</span><div class="say-t"><span class="note">Claude sedang menulis...</span></div></li>` : "");
        wireSpk(ul);
        ul.querySelectorAll(".mveil .mean").forEach(el => el.addEventListener("click", () => el.closest(".bub").classList.remove("mveil")));
        const last = ch.msgs[ch.msgs.length - 1];
        $("#sugs").innerHTML = (!ch.busy && last && last.who === "ai" ? last.saran : []).map(t => `<button class="chipk sug" type="button" data-t="${escH(t)}">${escH(t)}</button>`).join("");
        $("#sugs").querySelectorAll(".sug").forEach(b => b.addEventListener("click", () => { cin.value = b.dataset.t; cin.focus(); }));
        $("#cerr").innerHTML = ch.err ? `<div class="fb no"><b>Belum berhasil.</b>${escH(ch.err)}${ch.retry ? `<div class="row"><button class="btn alt" id="retry" type="button">Coba lagi</button></div>` : ""}</div>` : "";
        const rt = $("#retry");
        if (rt)
            rt.addEventListener("click", () => { ch.err = null; aiTurn(); });
        $("#csend").disabled = ch.busy;
        if (ul.lastElementChild)
            ul.lastElementChild.scrollIntoView({ block: "nearest" });
    }
    function trim() { const t = ch.turns; return t.length > 13 ? [t[0]].concat(t.slice(-12)) : t.slice(); }
    async function aiTurn() {
        ch.busy = true;
        ch.err = null;
        ch.ctl = new AbortController();
        draw();
        try {
            const tmo = setTimeout(() => { ch.timedOut = true; try {
                ch.ctl.abort();
            }
            catch (_) { } }, 45000);
            let r;
            try {
                r = await SAMPLE.json(trim(), { modelTier: "quick", cache: false, signal: ch.ctl.signal });
            }
            finally {
                clearTimeout(tmo);
            }
            if (chat !== ch)
                return;
            if (!r || typeof r.de !== "string" || !r.de.trim())
                throw { code: "invalid_json" };
            const saran = Array.isArray(r.saran) ? r.saran.slice(0, 3).map(String) : [];
            ch.turns.push({ role: "assistant", content: JSON.stringify({ de: r.de, id: String(r.id || ""), koreksi: String(r.koreksi || ""), saran }) });
            const lastMe = ch.msgs.slice().reverse().find(m => m.who === "me");
            if (lastMe && r.koreksi)
                lastMe.koreksi = String(r.koreksi);
            ch.msgs.push({ who: "ai", de: r.de, id: String(r.id || ""), saran });
            if ($("#tts") && $("#tts").checked)
                speak(r.de);
        }
        catch (e) {
            if (chat !== ch)
                return;
            const c = ch.timedOut ? "timeout" : (e && e.code);
            ch.timedOut = false;
            if (c !== "cancelled") {
                ch.err = chatErr(c);
                ch.retry = c !== "not_granted" && c !== "sampling_disabled";
            }
        }
        ch.busy = false;
        draw();
    }
    function send() {
        const t = cin.value.trim();
        if (!t || ch.busy)
            return;
        if (Mic.active)
            Mic.stop();
        cin.value = "";
        cn.textContent = "";
        ch.msgs.push({ who: "me", text: t });
        ch.turns.push({ role: "user", content: "Balasan pelajar: " + t });
        store.talk = (store.talk || 0) + 1;
        save(store);
        if (!ch.logged) {
            ch.logged = true;
            logRes("chat", sc.bab, null, "Ngobrol dengan Claude: " + sc.t);
        }
        aiTurn();
    }
    $("#csend").addEventListener("click", send);
    cin.addEventListener("keydown", e => { if (e.key === "Enter")
        send(); });
    cmic.addEventListener("click", () => {
        if (Mic.active && Mic.active.owner === cmic) {
            Mic.stop();
            return;
        }
        if (ch.busy)
            return;
        const base = cin.value.trim();
        let heard = "";
        Mic.start({ owner: cmic, autoStop: 1800,
            onPartial: t => { cin.value = (base + " " + heard + (t ? " " + t : "")).replace(/\s+/g, " ").trim(); },
            onFinal: t => { heard = (heard + t).replace(/\s+/g, " ").trim(); cin.value = (base + " " + heard).trim(); },
            onState: s => micBtn(cmic, s === "listening" || s === "starting" || s === "finishing"),
            onEnd: r => { micBtn(cmic, false); const m = micMsg(r); cn.textContent = m; if (!m && $("#auto").checked && heard && (r === "stopped" || r === "viewer_stopped"))
                send(); } });
    });
    $("#cend").addEventListener("click", async () => {
        const log = ch.msgs.map(m => m.who === "ai" ? "Mitra: " + m.de : "Pelajar: " + m.text).join("\n"), box = $("#sum");
        if (!ch.msgs.some(m => m.who === "me")) {
            box.innerHTML = `<div class="sumbox"><p>Kirim minimal satu pesan dulu, baru ada yang bisa dirangkum.</p></div>`;
            return;
        }
        box.innerHTML = `<div class="sumbox"><p class="note">Claude sedang menyusun rangkuman...</p></div>`;
        $("#cend").disabled = true;
        try {
            const r = await SAMPLE.json(`Kamu guru bahasa Jerman level A1 untuk pelajar Indonesia. Di bawah ini percakapan latihan (situasi: ${sc.t}). Nilai HANYA kalimat milik "Pelajar". Teks dari pengenalan suara bisa tanpa tanda baca atau huruf besar: abaikan itu.\n\n${log}\n\nBalas hanya dengan satu objek JSON: {"pujian":"satu kalimat bahasa Indonesia tentang hal yang sudah bagus","perbaiki":[{"salah":"kalimat atau frasa pelajar","benar":"versi yang benar","alasan":"alasan singkat dalam bahasa Indonesia"}],"kosakata":[{"de":"kata atau frasa berguna","id":"arti"}]}. Maksimal 4 item perbaiki dan 5 kosakata. Kalau tidak ada kesalahan penting, perbaiki berupa array kosong.`, { modelTier: "default", cache: false });
            if (chat !== ch)
                return;
            const fx = Array.isArray(r.perbaiki) ? r.perbaiki : [], vc = Array.isArray(r.kosakata) ? r.kosakata : [];
            box.innerHTML = `<div class="sumbox"><h3>Rangkuman</h3><p>${escH(r.pujian || "Kerja bagus sudah berani berbicara.")}</p>${fx.length ? `<h3>Yang perlu diperbaiki</h3><ul>${fx.map(f => `<li><s>${escH(f.salah || "")}</s> → <b>${escH(f.benar || "")}</b><br><span class="note">${escH(f.alasan || "")}</span></li>`).join("")}</ul>` : `<p class="note">Tidak ada kesalahan penting.</p>`}${vc.length ? `<h3>Kosakata untuk diingat</h3><ul>${vc.map(v => `<li><b>${escH(v.de || "")}</b>: ${escH(v.id || "")}</li>`).join("")}</ul>` : ""}</div>`;
        }
        catch (e) {
            if (chat !== ch)
                return;
            box.innerHTML = `<div class="sumbox"><p>${escH(chatErr(e && e.code))}</p></div>`;
        }
        $("#cend").disabled = false;
    });
    refreshMics();
    aiTurn();
}
