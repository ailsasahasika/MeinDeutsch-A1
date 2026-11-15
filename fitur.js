/* Mein Deutsch A1 – fitur.js
   Fitur baru: penyimpanan, audio, kamus, lab, ujian 4 bagian, dashboard, planner, router. */
/* =====================================================================
   PENGEMBANGAN MEIN DEUTSCH A1
   Penyimpanan andal + sinkronisasi akun, audio, Kamus, Listening Lab,
   Writing Lab, Speaking Lab, Grammar Center, Simulasi ujian 4 bagian,
   Dashboard, Study Planner.
   ===================================================================== */
/* ---------- Penyimpanan ---------- */
function ensureStore(s) {
    s = s && typeof s === "object" && !Array.isArray(s) ? s : {};
    ["done", "best", "srs", "days", "fav", "known", "seen", "skill", "revd", "chk", "gbest", "rbest", "pron", "placed"].forEach(k => { if (!s[k] || typeof s[k] !== "object" || Array.isArray(s[k]))
        s[k] = {}; });
    ["exams", "log", "ex4", "notes"].forEach(k => { if (!Array.isArray(s[k]))
        s[k] = []; });
    if (!s.plan || typeof s.plan !== "object")
        s.plan = {};
    const p = s.plan;
    if (!(p.daily > 0))
        p.daily = 20;
    if (!(p.weekDays > 0))
        p.weekDays = 5;
    if (!(p.weekCh >= 0))
        p.weekCh = 1;
    if (!p.sched || typeof p.sched !== "object")
        p.sched = {};
    if (!p.remind || typeof p.remind !== "object")
        p.remind = { on: false, time: "19:00" };
    if (!s.set || typeof s.set !== "object")
        s.set = {};
    if (!(s.set.rate > 0))
        s.set.rate = 0.9;
    if (!s.set.eng)
        s.set.eng = "auto";
    s.v = 2;
    return s;
}
store = ensureStore(store);
function slim(s) { const c = Object.assign({}, s); c.log = (s.log || []).slice(-300); c.exams = (s.exams || []).slice(-30); c.ex4 = (s.ex4 || []).slice(-60); return c; }
function mergeStore(a, b) {
    a = ensureStore(JSON.parse(JSON.stringify(a || {})));
    b = ensureStore(JSON.parse(JSON.stringify(b || {})));
    if ((b.rst || 0) > (a.upd || 0))
        return b;
    if ((a.rst || 0) > (b.upd || 0))
        return a;
    const r = a, newer = (b.upd || 0) > (a.upd || 0);
    Object.keys(b.done).forEach(k => { if (b.done[k])
        r.done[k] = true; });
    ["best", "days", "revd", "gbest", "rbest", "pron"].forEach(f => Object.keys(b[f]).forEach(k => r[f][k] = Math.max(r[f][k] || 0, b[f][k] || 0)));
    Object.keys(b.srs).forEach(k => { const x = r.srs[k], y = b.srs[k]; if (!x || ((y && y.due) || 0) > (x.due || 0))
        r.srs[k] = y; });
    ["fav", "known", "seen", "chk"].forEach(f => Object.keys(b[f]).forEach(k => { if (!(k in r[f]) || newer)
        r[f][k] = b[f][k]; }));
    Object.keys(b.skill).forEach(bb => { r.skill[bb] = r.skill[bb] || {}; Object.keys(b.skill[bb]).forEach(s => r.skill[bb][s] = Math.max(r.skill[bb][s] || 0, b.skill[bb][s] || 0)); });
    const uniq = (x, y, key) => { const m = new Map(); x.concat(y).forEach(e => { if (e)
        m.set(key(e), e); }); return [...m.values()].sort((p, q) => (p.d || p.t || 0) - (q.d || q.t || 0)); };
    r.exams = uniq(r.exams, b.exams, e => e.d);
    r.ex4 = uniq(r.ex4, b.ex4, e => e.d + "|" + e.sec);
    r.log = uniq(r.log, b.log, e => e.t + "|" + e.k).slice(-400);
    r.spk = Math.max(r.spk || 0, b.spk || 0);
    r.talk = Math.max(r.talk || 0, b.talk || 0);
    if (newer) {
        r.plan = b.plan;
        r.set = b.set;
        r.notes = b.notes;
        if (b.placement)
            r.placement = b.placement;
    }
    else if (!r.placement && b.placement)
        r.placement = b.placement;
    Object.keys(b.placed).forEach(k => { if (b.placed[k])
        r.placed[k] = true; });
    r.upd = Math.max(a.upd || 0, b.upd || 0);
    return ensureStore(r);
}
/* Sinkronisasi ke akun: backend Claude (artifact claude.ai) atau Supabase (website sendiri) */
const Sync = { be: null, state: "local", last: 0, busy: false, pending: false, timer: null, lastSent: "", err: "",
    async start(be) {
        this.be = be;
        this.fetched = false;
        this.state = "loading";
        this.lastSent = "";
        this.err = "";
        this.ui();
        const to = setTimeout(() => { if (this.state === "loading") {
            this.state = "slow";
            this.ui();
        } }, 10000);
        try {
            const rem = await be.get();
            clearTimeout(to);
            if (this.be !== be)
                return;
            if (rem && typeof rem === "object") {
                store = mergeStore(store, rem);
                try {
                    localStorage.setItem(KEY, JSON.stringify(store));
                }
                catch (e) { }
                route();
            }
            this.fetched = true;
            this.state = "ok";
            this.ui();
            await this.push();
        }
        catch (e) {
            clearTimeout(to);
            if (this.be === be)
                this.fail(e);
        }
    },
    async init(db, u) {
        if (!db || !u)
            return;
        try {
            const id = await u.id();
            if (!id)
                return;
            const ref = db.doc("data/users/" + id + "/progress");
            await this.start({ name: "claude", get: async () => { const snap = await ref.get(); if (!snap.exists)
                    return null; try {
                    return JSON.parse((snap.data() || {}).s || "null");
                }
                catch (e) {
                    return null;
                } }, set: async (obj) => { const s = JSON.stringify(obj); if (s.length > 240000)
                    throw { code: "too_big" }; await ref.set({ s, upd: obj.upd || Date.now(), v: 2 }); } });
        }
        catch (e) {
            this.fail(e);
        }
    },
    stop() { this.be = null; this.state = "local"; this.err = ""; clearTimeout(this.timer); this.pending = false; this.ui(); },
    schedule() { if (!this.be || this.state === "off")
        return; this.pending = true; clearTimeout(this.timer); this.timer = setTimeout(() => this.push(), 4000); },
    async push() {
        /* jangan mengirim sebelum progres akun berhasil diambil dan digabung, agar data di server tidak tertimpa */
        if (!this.be || this.state === "off" || this.state === "loading" || this.state === "slow")
            return;
        if (!this.fetched) {
            if (!this.busy)
                this.start(this.be);
            return;
        }
        if (this.busy) {
            this.pending = true;
            return;
        }
        const be = this.be;
        this.busy = true;
        this.pending = false;
        try {
            const obj = slim(store), s = JSON.stringify(obj);
            if (s !== this.lastSent) {
                await be.set(obj);
                this.lastSent = s;
            }
            if (this.be === be) {
                this.last = Date.now();
                this.state = "ok";
                this.err = "";
            }
        }
        catch (e) {
            if (this.be === be)
                this.fail(e);
        }
        this.busy = false;
        this.ui();
        if (this.pending)
            this.schedule();
    },
    fail(e) {
        const c = (e && (e.code || e.status)) || "error";
        this.err = String((e && e.msg) || c);
        this.state = e && (e.status === 401 || e.status === 403) ? "off" : ["invalid_argument", "not_granted", "revoked", "capability_disabled", "capability_removed", "transform_error", 401, 403].includes(c) ? "off" : "err";
        this.ui();
    },
    ui() { const el = document.getElementById("syncst"); if (el)
        el.innerHTML = syncText(); if (typeof updAcct === "function")
        updAcct(); } };
function syncText() {
    const t = Sync.last ? new Date(Sync.last).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "";
    const who = Sync.be && Sync.be.name === "supa" ? "akunmu (" + escH((Supa.sess && Supa.sess.email) || "") + ")" : "akun Claude-mu";
    if (!Sync.be)
        return Supa.on() ? "Kamu belum masuk. Progres hanya tersimpan di browser ini. <a href=\"#akun\">Masuk atau daftar</a> agar progres tersimpan di akun dan bisa dibuka dari perangkat lain." : window.claude ? "Progres tersimpan di browser ini. Saat halaman dibuka di claude.ai dalam keadaan masuk, progres juga disimpan ke akun Claude-mu." : "Progres hanya tersimpan di browser ini. Login online belum diaktifkan di website ini (lihat README).";
    if (Sync.state === "loading")
        return "Mengambil progres dari " + who + "...";
    if (Sync.state === "slow")
        return "Server akun belum bisa dijangkau. Progres tetap tersimpan di browser ini dan akan dikirim saat koneksi pulih.";
    if (Sync.state === "ok")
        return "Progres tersimpan di browser ini dan disinkronkan ke " + who + (t ? " (terakhir " + t + ")" : "") + ".";
    if (Sync.state === "off")
        return Sync.be.name === "supa" ? "Sesi akunmu berakhir atau ditolak server. <a href=\"#akun\">Masuk lagi</a> untuk melanjutkan sinkronisasi. Progres tetap tersimpan di browser ini." : "Akun ini tidak bisa menyimpan data di halaman ini (misalnya hanya punya akses lihat). Progres tetap tersimpan di browser ini.";
    return "Sinkronisasi ke " + who + " sedang gagal (" + escH(Sync.err) + "). Progres tetap tersimpan di browser ini; aplikasi mencoba lagi saat kamu belajar.";
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && Sync.be)
    Sync.push(); });
/* Tab lain di browser yang sama menyimpan progres: gabungkan agar tidak saling menimpa */
addEventListener("storage", e => { if (e.key !== KEY || !e.newValue)
    return; try {
    const other = JSON.parse(e.newValue);
    const keep = store.upd;
    store = mergeStore(store, other);
    store.upd = Math.max(keep || 0, other.upd || 0);
}
catch (_) { } });
function notice(msg) { let n = document.getElementById("notice"); if (!n) {
    n = document.createElement("div");
    n.id = "notice";
    n.className = "notice";
    n.setAttribute("role", "status");
    n.setAttribute("aria-live", "polite");
    document.body.appendChild(n);
} n.textContent = msg; n.classList.add("on"); clearTimeout(notice.t); notice.t = setTimeout(() => n.classList.remove("on"), 2400); }
/* ---------- Catatan aktivitas ---------- */
const SKILL = { H: "Hören", L: "Lesen", S: "Schreiben", Sp: "Sprechen", W: "Kosakata & tata bahasa" };
const KIND = { penempatan: ["Tes penempatan", "W"], kuis: ["Kuis bab", "W"], latihan: ["Latihan campuran", "W"], pola: ["Latihan pola", "W"], grammatik: ["Grammar Center", "W"], tes: ["Tes campuran cepat", "W"], lesen: ["Lesen (bacaan)", "L"], hoeren: ["Hören (Listening Lab)", "H"], schreiben: ["Schreiben (Writing Lab)", "S"], sprechen: ["Sprechen (pengucapan & jawaban)", "Sp"], dialog: ["Main peran dialog", "Sp"], chat: ["Ngobrol dengan Claude", "Sp"], "ujian-H": ["Ujian: Hören", "H"], "ujian-L": ["Ujian: Lesen", "L"], "ujian-S": ["Ujian: Schreiben", "S"], "ujian-Sp": ["Ujian: Sprechen", "Sp"] };
function logRes(k, b, p, x) { store.log.push({ t: Date.now(), k, b: b || 0, p: p == null ? null : Math.round(p), x: x || "" }); if (store.log.length > 400)
    store.log = store.log.slice(-400); save(store); }
function markSkill(b, s, p) { if (!b)
    return; store.skill[b] = store.skill[b] || {}; store.skill[b][s] = Math.max(store.skill[b][s] || 0, Math.round(p)); save(store); }
function bumpRev() { const k = keyOf(new Date()); store.revd[k] = (store.revd[k] || 0) + 1; }
const isKnown = key => !!(store.known[key] || (store.srs[key] && store.srs[key].reps >= 3));
/* ---------- Audio: suara perangkat atau suara Claude, dengan kecepatan ---------- */
const AU = { cl: null, clState: "idle", tok: 0, lineCb: null, playing: false, cur: null,
    deState() { if (!HAS_SPEECH)
        return "none"; let all = []; try {
        all = speechSynthesis.getVoices();
    }
    catch (e) { } if (!all.length)
        return "unknown"; return all.some(v => /^de/i.test(v.lang)) ? "yes" : "no"; },
    voices() { try {
        return speechSynthesis.getVoices().filter(v => /^de/i.test(v.lang));
    }
    catch (e) {
        return [];
    } },
    pair() {
        const vs = this.voices(), M = /(conrad|stefan|markus|yannick|hans|klaus|daniel|ralf|jonas|killian|florian|bernd|viktor|männlich|\bmale\b)/i, F = /(katja|hedda|anna|petra|helena|marlene|vicki|amala|seraphina|louisa|elke|female|weiblich|google deutsch)/i;
        const m = vs.find(v => M.test(v.name)) || null, f = vs.find(v => F.test(v.name)) || vs.find(v => v !== m) || null;
        return { m, f: f || m, real: !!(m && f && m !== f) };
    },
    engine() {
        const e = store.set.eng, ds = this.deState(), dev = HAS_SPEECH && ds !== "no";
        if (e === "claude" && this.cl)
            return "claude";
        if (e === "device" && dev)
            return "device";
        if (ds === "yes")
            return "device";
        if (this.cl)
            return "claude";
        return dev ? "device" : null;
    },
    avail() { return !!this.engine(); },
    rate() { return +store.set.rate || 0.9; },
    stop() { this.tok++; this.playing = false; this.cur = null; try {
        if (HAS_SPEECH)
            speechSynthesis.cancel();
    }
    catch (e) { } try {
        if (this.cl && this.clState !== "idle")
            this.cl.stop();
    }
    catch (e) { } },
    say(text, opt) { return this.play([{ t: text, s: "A" }], opt); },
    seq(list, opt) { return this.play(list.map(t => ({ t, s: "A" })), opt); },
    play(lines, opt) {
        opt = opt || {};
        const rate = opt.rate || this.rate(), eng = this.engine();
        this.stop();
        if (!eng) {
            if (opt.onEnd)
                opt.onEnd(false);
            return false;
        }
        const clean = t => String(t).replace(/\s*\/\s*/g, ", ").replace(/\.\.\./g, "").replace(/–/g, ",");
        const tok = ++this.tok;
        this.playing = true;
        this.cur = lines.length === 1 ? lines[0].t : null;
        this.lineCb = opt.onLine || null;
        const done = ok => { if (tok !== this.tok)
            return; this.playing = false; this.cur = null; this.lineCb = null; if (opt.onEnd)
            opt.onEnd(ok); };
        if (eng === "claude") {
            const G = opt.g || {}, vm = { f: "airy", m: "rounded" }, vs = { A: "buttery", B: "glassy", N: "buttery" };
            const arr = lines.map((l, i) => ({ text: clean(l.t), voice: G[l.s] ? vm[G[l.s]] : (vs[l.s] || "buttery"), language: "de", id: String(i) }));
            try {
                this.cl.speak(arr, { rate: Math.max(0.7, Math.min(1.5, rate)), language: "de" }).then(() => done(true)).catch(() => done(false));
            }
            catch (e) {
                done(false);
            }
            return true;
        }
        const pr = this.pair(), G = opt.g || {};
        let i = 0, errs = 0;
        const next = () => {
            if (tok !== this.tok)
                return;
            if (i >= lines.length) {
                done(errs < lines.length);
                return;
            }
            const l = lines[i], gd = G[l.s] || (l.s === "B" ? "m" : "f");
            try {
                const u = new SpeechSynthesisUtterance(clean(l.t));
                u.lang = "de-DE";
                u.rate = rate;
                const v = gd === "m" ? (pr.m || pr.f) : (pr.f || pr.m);
                if (v)
                    u.voice = v;
                if (!pr.real && lines.length > 1)
                    u.pitch = gd === "m" ? 0.75 : 1.15;
                u.onend = () => { i++; next(); };
                u.onerror = e => { if (!(e && e.error === "interrupted"))
                    errs++; i++; next(); };
                if (this.lineCb)
                    this.lineCb(i);
                speechSynthesis.speak(u);
            }
            catch (e) {
                done(false);
            }
        };
        next();
        return true;
    } };
function hasAudio() { return AU.avail(); }
function voiceNote() { const e = AU.engine(); if (!e)
    return ""; if (e === "claude")
    return "Penutur dibedakan dengan suara Claude yang berbeda."; return AU.pair().real ? "Penutur perempuan dan laki-laki memakai dua suara Jerman yang berbeda dari perangkatmu." : "Perangkat hanya punya satu suara Jerman, jadi penutur laki-laki dibedakan dengan nada lebih rendah."; }
if (HAS_SPEECH) {
    try {
        speechSynthesis.addEventListener("voiceschanged", () => { const a = document.getElementById("app"); if (a)
            a.classList.toggle("nospeech", !hasAudio()); });
    }
    catch (e) { }
}
function audioCtl() {
    const engs = [["auto", "Otomatis"]].concat(HAS_SPEECH ? [["device", "Suara perangkat"]] : []).concat(AU.cl ? [["claude", "Suara Claude"]] : []);
    return `<label>Kecepatan: <select class="sel" data-rate>${[[0.6, "0,6× (sangat pelan)"], [0.75, "0,75× (pelan)"], [0.9, "0,9× (normal belajar)"], [1, "1× (normal)"], [1.15, "1,15× (cepat)"]].map(([v, t]) => `<option value="${v}" ${Math.abs(AU.rate() - v) < 0.01 ? "selected" : ""}>${t}</option>`).join("")}</select></label>${engs.length > 1 ? `<label>Suara: <select class="sel" data-eng>${engs.map(([v, t]) => `<option value="${v}" ${store.set.eng === v ? "selected" : ""}>${t}</option>`).join("")}</select></label>` : ""}`;
}
function wireAudioCtl(root) {
    root.querySelectorAll("[data-rate]").forEach(s => s.addEventListener("change", e => { store.set.rate = +e.target.value; save(store); }));
    root.querySelectorAll("[data-eng]").forEach(s => s.addEventListener("change", e => { store.set.eng = e.target.value; save(store); }));
}
function audioNote() {
    const e = AU.engine();
    if (!e)
        return HAS_SPEECH && AU.deState() === "no" ? "Perangkat ini tidak punya suara bahasa Jerman. Audio sengaja tidak diputar supaya kamu tidak mendengar pelafalan yang salah (misalnya dengan logat Indonesia). Pasang suara “Deutsch (Deutschland)” di pengaturan text-to-speech perangkat, lalu muat ulang halaman. Sementara itu transkrip ditampilkan." : "Perangkat ini tidak menyediakan suara (text-to-speech), jadi transkrip ditampilkan sebagai pengganti audio.";
    return (e === "claude" ? "Audio dibacakan suara Claude dalam bahasa Jerman." : "Audio dibacakan suara bahasa Jerman di perangkatmu" + (AU.deState() === "unknown" ? " (jika terdengar berlogat Indonesia, pasang suara “Deutsch” di pengaturan perangkat)" : "") + ".") + " Ini suara sintetis, bukan rekaman penutur asli: intonasi bisa terdengar kaku dan tidak ada suara latar seperti di ujian sungguhan.";
}
/* ---------- Teks & koreksi ---------- */
const normA = s => String(s).toLowerCase().replace(/ß/g, "ss").replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/[“”„"]/g, "").replace(/\s+/g, " ").trim();
function lev(a, b) {
    if (a === b)
        return 0;
    const m = a.length, n = b.length;
    if (!m)
        return n;
    if (!n)
        return m;
    let p = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
        const c = [i];
        for (let j = 1; j <= n; j++)
            c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        p = c;
    }
    return p[n];
}
const wordsOf = s => String(s).replace(/[.,!?;:"“”„()]/g, " ").trim().split(/\s+/).filter(Boolean);
const sentencesOf = s => String(s).replace(/([.!?])\s+/g, "$1\n").split("\n").map(x => x.trim()).filter(Boolean);
const UMLAUT = `<div class="row" style="margin:6px 0 0">${["ä", "ö", "ü", "ß", "Ä", "Ö", "Ü"].map(c => `<button class="chipk" data-c="${c}" type="button">${c}</button>`).join("")}</div>`;
function wireUml(root, inp) { root.querySelectorAll("[data-c]").forEach(b => b.addEventListener("click", () => { var _a, _b; const s = (_a = inp.selectionStart) !== null && _a !== void 0 ? _a : inp.value.length, e = (_b = inp.selectionEnd) !== null && _b !== void 0 ? _b : s; inp.value = inp.value.slice(0, s) + b.dataset.c + inp.value.slice(e); inp.focus(); try {
    inp.setSelectionRange(s + 1, s + 1);
}
catch (_) { } inp.dispatchEvent(new Event("input")); })); }
const LEX = (() => {
    const set = new Set(), lower = new Set(), caps = new Set();
    const addW = s => String(s || "").split(/[\s\/,.!?;:()–"“”„]+/).forEach(w => { const c = w.replace(/[^A-Za-zÄÖÜäöüß-]/g, ""); if (c)
        set.add(c.toLowerCase()); });
    const addS = s => sentencesOf(s || "").forEach(sent => sent.split(/\s+/).forEach((w, i) => { const c = w.replace(/[^A-Za-zÄÖÜäöüß-]/g, ""); if (!c)
        return; set.add(c.toLowerCase()); if (i > 0) {
        if (c[0] === c[0].toLowerCase())
            lower.add(c.toLowerCase());
        else
            caps.add(c);
    } }));
    L.forEach(l => { l.v.forEach(v => { addW(v[0]); addW(v[3]); addS(v[4]); v[0].split("/").forEach(p => { const m = p.trim().match(/^(der|die|das) ([A-ZÄÖÜ][\wäöüß-]*)$/); if (m)
        caps.add(m[2]); }); }); l.e.forEach(e => addS(e[0])); l.q.forEach(q => q.o.forEach(addW)); l.c.forEach(c => { if (c.pt)
        c.pt.ex.forEach(e => addS(e[0])); }); });
    VTEM.forEach(v => { addW(v[0]); addW(v[3]); addS(v[4]); v[0].split("/").forEach(p => { const m = p.trim().match(/^(der|die|das) ([A-ZÄÖÜ][\wäöüß-]*)$/); if (m)
        caps.add(m[2]); }); });
    HRI.forEach(h => h.l.forEach(x => addS(x.de)));
    DLG.forEach(d => d.l.forEach(x => addS(x.de)));
    RD.forEach(r => r.s.forEach(x => addS(x[0])));
    HR.forEach(h => h.l.forEach(x => addS(x.de)));
    Object.values(WR).forEach(w => { addS(w.msg.model); w.tr.forEach(t => t[1].forEach(addS)); });
    GR.forEach(g => { g.q.forEach(q => { if (q.o)
        q.o.forEach(addS); if (q.ans)
        addW(q.ans); }); g.m.forEach(m => addS(m[1])); });
    EXS.forEach(e => addS(e.msg.model));
    SPQ && Object.values(SPQ).forEach(a => a.forEach(q => { addS(q.q); addS(q.m); }));
    "und oder aber denn ich du er sie es wir ihr mein dein bitte danke hallo liebe lieber viele grüße freundlichen geehrte geehrter sehr herr frau morgen heute gestern nicht kein keine ein eine einen der die das den dem des ja nein doch auch gut noch schon mit von zu bei nach aus seit für ohne um am im ins zum zur beim vom hausaufgaben kurs termin leider gern lieber super toll okay ok jetzt dann danach zuerst später immer oft manchmal nie sehr viel wenig".split(" ").forEach(w => set.add(w));
    const nouns = new Set();
    caps.forEach(c => { const lc = c.toLowerCase(); if (!lower.has(lc) && !/^(sie|ihnen|ihr|ihre|ihren|ihrem|ihrer)$/.test(lc))
        nouns.add(lc); });
    const norm = new Map();
    set.forEach(w => norm.set(normA(w), w));
    return { set, lower, nouns, norm, capOf: lc => { for (const c of caps)
            if (c.toLowerCase() === lc)
                return c; return lc[0].toUpperCase() + lc.slice(1); } };
})();
const GRULES = [
    [/\bich (bist|ist|sind|seid)\b/, "ich bin", "Konjugasi sein untuk ich adalah bin."],
    [/\bdu (bin|ist|sind|seid)\b/, "du bist", "Konjugasi sein untuk du adalah bist."],
    [/\ber (bin|bist|sind|seid)\b|\bes (bin|bist|seid)\b/, "er / es ist", "Konjugasi sein untuk er / es adalah ist."],
    [/\bwir (bin|bist|ist|seid)\b/, "wir sind", "Konjugasi sein untuk wir adalah sind."],
    [/\bihr (bin|bist|ist|sind)\b/, "ihr seid", "Konjugasi sein untuk ihr adalah seid."],
    [/\bich (hast|hat|haben|habt)\b/, "ich habe", "Konjugasi haben untuk ich adalah habe."],
    [/\bdu (habe|hat|haben|habt)\b/, "du hast", "Konjugasi haben untuk du adalah hast."],
    [/\b(er|es) (habe|hast|haben|habt)\b/, "er / es hat", "Konjugasi haben untuk er / es adalah hat."],
    [/\bich (habe|hab) (\d+|[a-zäöüß]+(zig|zehn)) jahre/, "ich bin ... Jahre alt", "Umur memakai sein: Ich bin 20 Jahre alt."],
    [/\b(bin|bist|ist|sind) (hunger|durst)\b/, "habe Hunger / Durst", "Lapar dan haus memakai haben."],
    [/\b(komme|kommst|kommt|kommen) von (indonesien|deutschland|japan|china|vietnam|italien|spanien|brasilien|jakarta|bandung|surabaya|medan|bali|berlin|hamburg)\b/, "komme aus ...", "Asal negara atau kota memakai aus."],
    [/\bich (möchtest|möchtet|möchten|moechtest|moechten)\b/, "ich möchte", "Bentuk möchten untuk ich adalah möchte."],
    [/\bich (kannst|können|könnt|koennen)\b/, "ich kann", "Bentuk können untuk ich adalah kann."],
    [/\bich (musst|müssen|müsst|muessen)\b/, "ich muss", "Bentuk müssen untuk ich adalah muss."],
    [/\bich (willst|wollen|wollt)\b/, "ich will", "Bentuk wollen untuk ich adalah will."],
    [/\b(er|es) (kannt|musst|willst|kannst)\b/, "er kann / muss / will", "Kata kerja modal untuk er / sie / es tidak memakai akhiran."],
    [/\b(gehe|geht|gehen|gehst|fahre|fährt|fahren|fährst|komme|kommt|kommen|kommst) zu hause\b/, "nach Hause", "Arah pulang memakai nach Hause; zu Hause berarti di rumah."],
    [/\b(bin|bist|ist|sind|seid|bleibe|bleibt|bleiben|bleibst) nach hause\b/, "zu Hause", "Posisi di rumah memakai zu Hause."],
    [/\b(in|im|um) (montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|wochenende)\b/, "am ...", "Hari dan akhir pekan memakai am."],
    [/\b(am|um|in) (januar|februar|märz|maerz|april|mai|juni|juli|august|september|oktober|november|dezember|sommer|winter|herbst|frühling)\b/, "im ...", "Bulan dan musim memakai im."],
    [/\b(am|im|in) (\d{1,2}|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun|zehn|elf|zwölf) uhr\b/, "um ... Uhr", "Jam memakai um."],
    [/\bmit (den|das|die) (bus|zug|fahrrad|auto|taxi|flugzeug)\b/, "mit dem ...", "mit diikuti dativ: mit dem Bus, mit dem Auto."],
    [/\bmit (den|das|die) (u-bahn|s-bahn|bahn|straßenbahn)\b/, "mit der ...", "mit diikuti dativ: mit der Bahn."],
    [/\bliebe (herr|herrn)\b/, "Lieber Herr ...", "Untuk laki-laki: Lieber."], [/\blieber frau\b/, "Liebe Frau ...", "Untuk perempuan: Liebe."],
    [/\bsehr geehrte herr\b/, "Sehr geehrter Herr ...", "Untuk laki-laki: geehrter."], [/\bsehr geehrter frau\b/, "Sehr geehrte Frau ...", "Untuk perempuan: geehrte."],
];
const INV = /(?:^|,\s*)(heute|morgen|gestern|dann|danach|jetzt|später|zuerst|manchmal|oft|leider|am (?:montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|wochenende|morgen|abend|nachmittag|vormittag)|im (?:sommer|winter|herbst|frühling|januar|februar|märz|april|mai|juni|juli|august|september|oktober|november|dezember)|um \d{1,2} uhr)\s*,?\s+(ich|du|er|wir|ihr)\s+[a-zäöüß]+/;
function grammarScan(text, formal) {
    const out = [], seen = new Set(), add = (type, snip, fix, why) => { const k = type + snip; if (seen.has(k))
        return; seen.add(k); out.push({ type, snip, fix, why }); };
    const low = text.toLowerCase().replace(/\s+/g, " ");
    GRULES.forEach(([re, fix, why]) => { const m = low.match(re); if (m)
        add("Tata bahasa", m[0], fix, why); });
    sentencesOf(text).forEach(s => { const sl = s.toLowerCase(); const m = sl.match(INV); if (m)
        add("Susunan kalimat", m[0].replace(/^,\s*/, ""), "Kata kerja di posisi 2", "Jika keterangan ada di posisi 1, kata kerja langsung menyusul, lalu subjek: Heute gehe ich ..., bukan Heute ich gehe ..."); });
    if (formal && /\b(du|dich|dir|dein|deine|deinen|deinem|deiner)\b/i.test(text))
        add("Gaya bahasa", "du / dich / dir / dein", "Sie / Ihnen / Ihr", "Surat formal memakai Sie, Ihnen, dan Ihr.");
    sentencesOf(text).forEach((s, si) => {
        const w = s.split(/\s+/);
        w.forEach((raw, i) => {
            const c = raw.replace(/[^A-Za-zÄÖÜäöüß-]/g, "");
            if (!c)
                return;
            if (i === 0) {
                if (si > 0 && /^[a-zäöü]/.test(c))
                    add("Huruf besar", c, c[0].toUpperCase() + c.slice(1), "Awal kalimat ditulis dengan huruf besar.");
                return;
            }
            if (/^[a-zäöüß-]+$/.test(c) && LEX.nouns.has(c))
                add("Huruf besar", c, LEX.capOf(c), "Kata benda dan nama selalu ditulis dengan huruf besar.");
        });
    });
    let uml = false, sp = 0;
    wordsOf(text).forEach(raw => {
        const w = raw.replace(/[^A-Za-zÄÖÜäöüß-]/g, "");
        const lc = w.toLowerCase();
        if (lc.length < 4 || /\d/.test(lc) || LEX.set.has(lc))
            return;
        const n = normA(lc);
        if (LEX.norm.has(n)) {
            if (!uml && /ae|oe|ue|ss/.test(lc)) {
                uml = true;
                add("Ejaan", w, LEX.norm.get(n), "Boleh menulis ae / oe / ue / ss jika tidak ada huruf ä / ö / ü / ß, tetapi tulisan standarnya memakai umlaut.");
            }
            return;
        }
        if (sp >= 6)
            return;
        let best = null, bd = 9;
        const lim = lc.length >= 8 ? 2 : 1;
        for (const x of LEX.set) {
            if (Math.abs(x.length - lc.length) > lim)
                continue;
            const d = lev(lc, x);
            if (d < bd) {
                bd = d;
                best = x;
                if (d === 1 && lim === 1)
                    break;
            }
        }
        if (best && bd <= lim) {
            sp++;
            const sug = /^[A-ZÄÖÜ]/.test(w) || LEX.nouns.has(best) ? LEX.capOf(best) : best;
            add("Ejaan", w, sug, "Kata ini tidak ada di kosakata A1 aplikasi. Mungkin maksudmu “" + sug + "”.");
        }
    });
    return out;
}
function issuesHTML(list) {
    if (!list.length)
        return `<p class="note">Tidak ditemukan kesalahan umum. Pemeriksaan otomatis hanya mengenali pola kesalahan yang sering dibuat pelajar A1, jadi tetap bandingkan dengan contoh jawaban.</p>`;
    return `<ul class="iss">${list.map(i => `<li><span class="pill">${i.type}</span> <s>${escH(i.snip)}</s> → <b>${escH(i.fix)}</b><br><span class="note">${escH(i.why)}</span></li>`).join("")}</ul>`;
}
function needGreeting(task) { return !task.noGreet; }
function rubric(text, task) {
    const n = normA(text), words = wordsOf(text), wc = words.length;
    const pts = task.pts.map(([lab, re]) => { let ok = false; try {
        ok = new RegExp(re).test(n);
    }
    catch (e) { } return { lab, ok }; });
    const gOK = /^(hallo|hi|liebe|lieber|sehr geehrte|sehr geehrter|guten tag|guten morgen|guten abend)\b/.test(n);
    const cOK = /(viele gruesse|liebe gruesse|mit freundlichen gruessen|beste gruesse|herzliche gruesse|bis bald|bis dann|bis morgen|bis samstag|bis sonntag|tschuess|gruss|deine?\s+\w+\s*$|dein\s+\w+\s*$)/.test(n);
    const iss = grammarScan(text, task.formal), cnt = t => iss.filter(i => i.type === t).length;
    const gram = cnt("Tata bahasa") + cnt("Gaya bahasa"), sp = iss.filter(i => i.type === "Ejaan" && !/umlaut/.test(i.why)).length, cap = cnt("Huruf besar"), ord = cnt("Susunan kalimat");
    const alpha = words.map(w => w.replace(/[^A-Za-zÄÖÜäöüß-]/g, "")).filter(w => w.length > 1);
    const known = alpha.filter(w => LEX.set.has(w.toLowerCase()) || LEX.norm.has(normA(w)) || /^[A-ZÄÖÜ]/.test(w)).length, distinct = new Set(alpha.map(w => w.toLowerCase())).size;
    const C = [], miss = pts.filter(p => !p.ok);
    C.push({ k: "Kelengkapan isi", w: 40, s: pts.length ? Math.round((pts.length - miss.length) / pts.length * 100) : 100, note: miss.length ? "Belum dibahas: " + miss.map(p => p.lab).join(", ") + "." : "Semua poin tugas sudah dibahas." });
    C.push({ k: "Tata bahasa", w: 15, s: Math.max(0, 100 - 25 * gram), note: gram ? gram + " kesalahan tata bahasa (lihat daftar di bawah)." : "Tidak ditemukan kesalahan umum." });
    let v = alpha.length ? Math.round(Math.min(100, known / alpha.length * 75 + Math.min(25, distinct))) : 0;
    if (wc < task.min * 0.5)
        v = Math.min(v, 50);
    C.push({ k: "Kosakata", w: 15, s: v, note: distinct + " kata berbeda; " + (alpha.length ? Math.round(known / alpha.length * 100) : 0) + "% dikenali sebagai kosakata A1 di aplikasi atau nama." });
    C.push({ k: "Ejaan dan huruf besar", w: 15, s: Math.max(0, 100 - 15 * sp - 10 * cap), note: sp + cap ? sp + " masalah ejaan, " + cap + " masalah huruf besar." : "Tidak ditemukan masalah." });
    let st = 100;
    const sn = [];
    if (ord) {
        st -= 25 * ord;
        sn.push(ord + " masalah urutan kata");
    }
    if (wc < task.min * 0.6) {
        st -= 40;
        sn.push("teks terlalu pendek (" + wc + " dari " + task.min + " kata)");
    }
    else if (wc < task.min) {
        st -= 20;
        sn.push("sedikit kurang panjang (" + wc + " dari " + task.min + " kata)");
    }
    if (needGreeting(task)) {
        if (!gOK) {
            st -= 15;
            sn.push("belum ada sapaan pembuka");
        }
        if (!cOK) {
            st -= 15;
            sn.push("belum ada salam penutup");
        }
    }
    C.push({ k: "Struktur kalimat dan bentuk", w: 15, s: Math.max(0, st), note: sn.length ? sn.join(", ") + "." : "Urutan kata, panjang teks, sapaan, dan penutup sudah baik." });
    return { score: Math.round(C.reduce((a, c) => a + c.s * c.w, 0) / 100), C, pts, iss, words: wc, gOK, cOK };
}
function checkFree(text, task) { return rubric(text, task); }
function freeReport(r, task) {
    return `<div class="sumbox"><h3>Penilaian otomatis: ${r.score}/100</h3>
  <div class="tbl"><table class="rub"><thead><tr><th>Kriteria</th><th>Bobot</th><th>Skor</th><th>Catatan</th></tr></thead><tbody>${r.C.map(c => `<tr><td>${c.k}</td><td>${c.w}%</td><td><b>${c.s}</b></td><td>${escH(c.note)}</td></tr>`).join("")}</tbody></table></div>
  <h3>Poin isi tugas</h3><ul class="chkl">${r.pts.map(p => `<li class="${p.ok ? "y" : "n"}">${p.ok ? "✓" : "✗"} ${escH(p.lab)}</li>`).join("")}</ul>
  <h3>Temuan tata bahasa, ejaan, dan susunan kalimat</h3>${issuesHTML(r.iss)}
  <p class="note">Penilaian otomatis mengenali pola kesalahan A1 yang umum dan kosakata di aplikasi. Ia tidak memahami makna seperti guru, jadi kalimat benar yang tidak biasa bisa dianggap kurang, dan sebaliknya. Bandingkan dengan contoh jawaban${SAMPLE ? " atau pakai Koreksi dengan Claude" : ""}.</p></div>`;
}
async function claudeWriting(box, task, text) {
    if (!SAMPLE) {
        box.innerHTML = `<p class="note">Koreksi Claude hanya tersedia saat halaman dibuka di claude.ai.</p>`;
        return;
    }
    box.innerHTML = `<div class="sumbox"><p class="note">Claude sedang memeriksa tulisanmu...</p></div>`;
    try {
        const r = await SAMPLE.json(`Kamu guru bahasa Jerman level A1 untuk pelajar Indonesia. Tugas menulis: "${task.task}". Teks pelajar:\n"""${text}"""\nNilai sesuai level A1, jangan menuntut struktur di atas A1. Balas hanya dengan satu objek JSON: {"skor":angka 0 sampai 100,"isi":"komentar singkat dalam bahasa Indonesia tentang apakah semua poin tugas terpenuhi","perbaikan":"teks pelajar versi benar dalam bahasa Jerman dengan perubahan seminimal mungkin","kesalahan":[{"salah":"kutipan dari teks pelajar","benar":"versi benar","jenis":"tata bahasa / ejaan / susunan kalimat / kosakata","alasan":"penjelasan singkat dalam bahasa Indonesia"}],"saran":"satu saran untuk tulisan berikutnya"}. Maksimal 6 kesalahan. Kalau tidak ada kesalahan, kesalahan berupa array kosong.`, { modelTier: "default", cache: false });
        const ks = Array.isArray(r.kesalahan) ? r.kesalahan : [];
        box.innerHTML = `<div class="sumbox"><h3>Koreksi Claude${typeof r.skor === "number" ? ": " + Math.round(r.skor) + "/100" : ""}</h3><p>${escH(r.isi || "")}</p>${ks.length ? `<ul class="iss">${ks.map(k => `<li><span class="pill">${escH(k.jenis || "")}</span> <s>${escH(k.salah || "")}</s> → <b>${escH(k.benar || "")}</b><br><span class="note">${escH(k.alasan || "")}</span></li>`).join("")}</ul>` : `<p class="note">Claude tidak menemukan kesalahan penting.</p>`}${r.perbaikan ? `<h3>Versi yang diperbaiki</h3><p class="de">${escH(r.perbaikan)}</p>` : ""}${r.saran ? `<p class="note">Saran: ${escH(r.saran)}</p>` : ""}</div>`;
    }
    catch (e) {
        box.innerHTML = `<div class="sumbox"><p>${escH(chatErr(e && e.code))}</p></div>`;
    }
}
/* Pemeriksa terjemahan: membandingkan dengan semua jawaban benar, lalu menggolongkan kesalahan */
const ARTS = new Set("der die das den dem des ein eine einen einem einer eines kein keine keinen keinem keiner mein meine meinen meinem meiner dein deine deinen deinem deiner sein seine seinen seinem seiner ihr ihre ihren ihrem ihrer unser unsere unseren unserem unserer euer eure euren eurem eurer".split(" "));
const PRONS = new Set("ich du er sie es wir ihr mich dich ihn uns euch mir dir ihm ihnen".split(" "));
function classify(u, a) {
    if (ARTS.has(u) && ARTS.has(a))
        return ["Artikel / kasus", "Artikel dan kata milik berubah sesuai jenis kata benda (der / die / das) dan kasus (nominatif, akusatif, dativ). Contoh: der Kaffee → Ich möchte einen Kaffee."];
    if (PRONS.has(u) && PRONS.has(a))
        return ["Kata ganti", "Kata ganti berubah sesuai fungsi: ich – mich – mir, du – dich – dir, er – ihn – ihm, Sie – Sie – Ihnen."];
    let p = 0;
    while (p < u.length && p < a.length && u[p] === a[p])
        p++;
    const E = /^(e|st|t|en|n|est|et|)$/;
    if (p >= 3 && E.test(u.slice(p)) && E.test(a.slice(p)) && u !== a)
        return ["Konjugasi", "Akhiran kata kerja harus sesuai subjek: ich -e, du -st, er / sie / es -t, wir / sie / Sie -en, ihr -t."];
    if (lev(u, a) <= Math.max(1, Math.floor(a.length / 4)))
        return ["Ejaan", "Ejaan kata ini belum tepat."];
    return null;
}
function checkSentence(u, accs, meaning) {
    const uw = wordsOf(u);
    let best = null;
    accs.forEach(a => {
        const aw = wordsOf(a), A = aw.map(normA), U = uw.map(normA), n = A.length, m = U.length;
        const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
        for (let i = 1; i <= n; i++)
            for (let j = 1; j <= m; j++)
                dp[i][j] = A[i - 1] === U[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
        const mt = new Array(n).fill(-1), mu = new Array(m).fill(-1);
        let i = n, j = m;
        while (i > 0 && j > 0) {
            if (A[i - 1] === U[j - 1]) {
                mt[i - 1] = j - 1;
                mu[j - 1] = i - 1;
                i--;
                j--;
            }
            else if (dp[i - 1][j] >= dp[i][j - 1])
                i--;
            else
                j--;
        }
        const bagU = U.slice().sort().join(" "), bagA = A.slice().sort().join(" ");
        const score = (bagU === bagA ? n : dp[n][m]) * 2 - (n - dp[n][m]) - (m - dp[n][m]) * 0.5;
        if (!best || score > best.score)
            best = { a, aw, A, U, mt, mu, score, lcs: dp[n][m], sameBag: bagU === bagA };
    });
    const { a, aw, A, U, mt, mu } = best, iss = [], mark = uw.map(w => ({ w, c: "m-ok", t: "" }));
    const missing = [], extra = [];
    A.forEach((x, i) => { if (mt[i] < 0)
        missing.push(i); });
    U.forEach((x, j) => { if (mu[j] < 0)
        extra.push(j); });
    const usedM = new Set(), usedE = new Set();
    if (best.sameBag && U.join(" ") !== A.join(" ")) {
        iss.push({ type: "Susunan kalimat", snip: uw.join(" "), fix: aw.join(" "), why: "Semua kata sudah benar, tetapi urutannya belum tepat. Kata kerja yang berubah bentuk ada di posisi 2 pada pernyataan, di posisi 1 pada pertanyaan ya / tidak; bagian kedua kata kerja (infinitif, Partizip II, awalan terpisah) di akhir." });
        extra.forEach(j => { usedE.add(j); mark[j].c = "m-gr"; });
        missing.forEach(i => usedM.add(i));
    }
    extra.forEach(j => {
        if (usedE.has(j))
            return;
        let bi = -1, bc = null, bd = 99;
        missing.forEach(i => { if (usedM.has(i))
            return; const c = classify(U[j], A[i]); if (c) {
            const d = lev(U[j], A[i]);
            if (d < bd) {
                bd = d;
                bi = i;
                bc = c;
            }
        } });
        if (bi >= 0) {
            usedM.add(bi);
            usedE.add(j);
            mark[j].c = bc[0] === "Ejaan" ? "m-sp" : "m-gr";
            mark[j].t = aw[bi];
            iss.push({ type: bc[0], snip: uw[j], fix: aw[bi], why: bc[1] });
        }
    });
    const remE = extra.filter(j => !usedE.has(j)), remM = missing.filter(i => !usedM.has(i));
    if (remE.length && remE.length === remM.length)
        remE.forEach((j, k) => { const i = remM[k]; usedE.add(j); usedM.add(i); mark[j].c = "m-gr"; mark[j].t = aw[i]; iss.push({ type: "Pilihan kata", snip: uw[j], fix: aw[i], why: "Kata ini kurang tepat untuk makna kalimat." }); });
    extra.forEach(j => { if (!usedE.has(j)) {
        mark[j].c = "m-ex";
        iss.push({ type: "Kata berlebih", snip: uw[j], fix: "(hapus)", why: "Kata ini tidak diperlukan dalam kalimat." });
    } });
    const miss = missing.filter(i => !usedM.has(i)).map(i => aw[i]);
    if (miss.length)
        iss.push({ type: "Kata hilang", snip: "…", fix: miss.join(", "), why: "Kata ini perlu ada dalam kalimat." });
    uw.forEach((w, j) => { const i = mu[j]; if (i >= 0 && w !== aw[i] && w.toLowerCase() === aw[i].toLowerCase()) {
        mark[j].c = "m-case";
        mark[j].t = aw[i];
        iss.push({ type: "Huruf besar", snip: w, fix: aw[i], why: /^[A-ZÄÖÜ]/.test(aw[i]) ? (i === 0 ? "Awal kalimat ditulis dengan huruf besar." : "Kata benda, nama, dan Sie (Anda) selalu ditulis dengan huruf besar.") : "Kata ini ditulis dengan huruf kecil (bukan kata benda)." });
    } });
    const okWords = normA(uw.join(" ")) === normA(aw.join(" ")), caseOK = !iss.some(x => x.type === "Huruf besar"), ok = okWords && caseOK;
    const pct = Math.max(0, Math.round(best.lcs / Math.max(A.length, U.length) * 100) - (caseOK ? 0 : 10));
    const others = accs.filter(x => x !== a);
    const html = `<div class="sent">${mark.map(x => `<span class="${x.c}" ${x.t ? `title="${esc(x.t)}"` : ""}>${escH(x.w)}</span>`).join(" ")}</div>${ok ? "" : issuesHTML(iss)}<p style="margin:8px 0 0">${ok ? "Jawabanmu benar." : "Jawaban yang disarankan:"} <b>${escH(a)}</b>${meaning ? `<br><span class="note">Artinya: ${escH(meaning)}</span>` : ""}</p>${others.length ? `<p class="note">Bentuk lain yang juga benar: ${others.map(escH).join(" · ")}</p>` : ""}`;
    return { ok, pct, html, near: okWords && !caseOK };
}
RENDER.tr = function (st, it, done) {
    st.innerHTML = `<div class="qtext">Terjemahkan ke bahasa Jerman:<div style="margin-top:6px">“${escH(it.q)}”</div>${it.from ? `<div class="say" style="margin-top:4px">Bab ${it.from}</div>` : ""}</div><textarea class="inp ta" id="trin" rows="2" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Terjemahan"></textarea>${UMLAUT}<div class="row"><button class="btn" id="trgo" type="button">Periksa</button></div><p class="note">Perhatikan huruf besar pada kata benda. Boleh mengetik ae, oe, ue, ss.</p>`;
    const inp = st.querySelector("#trin");
    wireUml(st, inp);
    let fin = false;
    const go = () => { if (fin || !inp.value.trim())
        return; fin = true; inp.disabled = true; st.querySelector("#trgo").disabled = true; const r = checkSentence(inp.value, it.acc, it.q); done(r.ok, (r.near ? "<b>Hampir benar.</b> " : "") + r.html); };
    st.querySelector("#trgo").addEventListener("click", go);
    inp.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        go();
    } });
    inp.focus();
};
/* ---------- Komponen jawaban lisan / ketik ---------- */
function answerBox(box, opt) {
    box.innerHTML = `<div class="microw"><button class="mic" type="button" data-mic hidden aria-pressed="false">${MICSVG}<span>Bicara</span></button><span class="heard" aria-live="polite"></span></div>${opt.multi ? `<textarea class="inp ta ti" rows="4" placeholder="${opt.ph || "Atau ketik jawabanmu"}" spellcheck="false" aria-label="Jawaban"></textarea><div class="row"><button class="btn tc" type="button">${opt.btn || "Kirim jawaban"}</button></div>` : `<div class="tyrow"><input class="inp ti" placeholder="${opt.ph || "Atau ketik jawabanmu"}" autocomplete="off" spellcheck="false" aria-label="Jawaban"><button class="btn alt tc" type="button">${opt.btn || "Kirim"}</button></div>`}<div class="note mnote" aria-live="polite"></div>`;
    const mic = box.querySelector(".mic"), hd = box.querySelector(".heard"), ti = box.querySelector(".ti"), mn = box.querySelector(".mnote");
    let sent = false;
    const submit = t => { t = (t || "").trim(); if (!t) {
        mn.textContent = "Jawaban masih kosong.";
        return;
    } if (sent && !opt.retry)
        return; sent = true; opt.onSubmit(t); };
    mic.addEventListener("click", () => {
        if (Mic.active && Mic.active.owner === mic) {
            Mic.stop();
            return;
        }
        const base = opt.multi ? ti.value.trim() : "";
        let heard = "";
        mn.textContent = "";
        hd.textContent = "";
        Mic.start({ owner: mic, autoStop: opt.multi ? 2600 : 1800,
            onPartial: t => { hd.textContent = (heard + " " + (t || "")).trim(); },
            onFinal: t => { heard = (heard + " " + t).replace(/\s+/g, " ").trim(); hd.textContent = heard; ti.value = (base + " " + heard).trim(); },
            onState: s => micBtn(mic, s === "listening" || s === "starting" || s === "finishing"),
            onEnd: r => { micBtn(mic, false); if (heard.trim()) {
                if (!opt.multi)
                    submit(heard);
            }
            else
                mn.textContent = micMsg(r) || "Tidak ada suara terdengar. Coba lagi dan bicara lebih dekat ke mic."; } });
    });
    box.querySelector(".tc").addEventListener("click", () => submit(ti.value));
    if (!opt.multi)
        ti.addEventListener("keydown", e => { if (e.key === "Enter")
            submit(ti.value); });
    refreshMics();
}
function evalAns(text, k) { const n = normA(text); const r = k.map(([re, lab]) => { let ok = false; try {
    ok = new RegExp(re).test(n);
}
catch (e) { } return { lab, ok }; }); const words = wordsOf(text).length; const pct = Math.round((r.filter(x => x.ok).length + (words >= 3 ? 1 : 0)) / (r.length + 1) * 100); return { r, pct, words }; }
function webSpeechAdapter() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR)
        return null;
    let rec = null;
    const cb = { p: [], f: [], s: [] };
    return { onPartial(f) { cb.p.push(f); }, onFinal(f) { cb.f.push(f); }, onState(f) { cb.s.push(f); },
        start(o) {
            return new Promise((res, rej) => {
                try {
                    rec = new SR();
                    rec.lang = o && o.language === "de" ? "de-DE" : (navigator.language || "de-DE");
                    rec.interimResults = true;
                    rec.continuous = false;
                    let reason = "stopped";
                    rec.onstart = () => { cb.s.forEach(f => f({ state: "listening" })); res(); };
                    rec.onresult = e => { let interim = ""; for (let i = e.resultIndex; i < e.results.length; i++) {
                        const r = e.results[i];
                        if (r.isFinal)
                            cb.f.forEach(f => f({ text: r[0].transcript }));
                        else
                            interim += r[0].transcript;
                    } cb.p.forEach(f => f({ text: interim })); };
                    rec.onerror = e => { reason = /not-allowed|service-not-allowed/.test(e.error) ? "not_granted" : e.error === "no-speech" || e.error === "aborted" ? "stopped" : "upstream_error"; };
                    rec.onend = () => { cb.s.forEach(f => f({ state: "idle", reason })); rec = null; };
                    rec.start();
                }
                catch (err) {
                    rej({ code: "unavailable" });
                }
            });
        },
        stop() { try {
            if (rec)
                rec.stop();
        }
        catch (e) { } return Promise.resolve(); } };
}
/* ---------- Bab (tampilan diperluas) ---------- */
const XTRA = `<span class="pill xtra" title="Di atas inti A1: cukup dikenali">Materi tambahan</span>`;
function blockHTML(b) { const h = b.p ? `<p>${fmt(b.p)}</p>` : b.tb ? table(b.tb) : b.h ? `<h3 class="subh">${fmt(b.h)}</h3>` : b.pt ? patHTML(b.pt) : `<div class="tip"><span class="lab">Ingat</span><br>${fmt(b.tip)}</div>`; return b.x ? `<div class="xwrap">${XTRA}${h}</div>` : h; }
function exLi(e) { return `<li><button class="spk" data-say="${esc(e[0])}" aria-label="Dengar kalimat">${SPK}</button><div class="w"><b>${e[0]}</b><span class="mean">${e[1]}</span></div></li>`; }
function patHTML(p) { return `<div class="pat"><h3>${fmt(p.h)}</h3><div class="formula">${p.f}</div><ul class="ex">${p.ex.map(exLi).join("")}</ul></div>`; }
function vocabLi(v) {
    const pl = v[3] && v[3] !== "-" ? `<span class="pl">Jamak: ${v[3]}</span>` : "";
    return `<li><button class="spk" data-say="${esc(v[0])}" aria-label="Dengar ${esc(v[0])}">${SPK}</button><div class="w"><b>${v[0]}</b><span class="say">${v[2]}</span>${pl}<span class="mean">${v[1]}</span>${v[4] ? `<span class="vex"><button class="spk sm" data-say="${esc(v[4])}" aria-label="Dengar contoh">${SPK}</button><span><i>${v[4]}</i><span class="mean">${v[5]}</span></span></span>` : ""}</div></li>`;
}
function skillCards(k) {
    const sk = store.skill[k] || {}, ri = rdOf(k), h = HR.find(x => x.bab === k), di = DLG.findIndex(d => d.bab === k);
    return [["D", "Dialog", di >= 0 ? "#d" + (di + 1) : "#dialog", di >= 0 ? DLG[di].t + ": baca, dengar, main peran" : "Dialog"], ["L", "Lesen", ri >= 0 ? "#r" + (ri + 1) : "#baca", ri >= 0 ? RD[ri].t : "Bacaan"], ["H", "Hören", "#dengar-" + k, h ? h.t : "Listening"], ["S", "Schreiben", "#tulis-" + k, WR[k] ? WR[k].msg.t : "Menulis"], ["Sp", "Sprechen", "#bicara-" + k, "Ucapkan kata dan jawab pertanyaan"]]
        .map(([s, n, href, t]) => `<li><a class="card2" href="${href}"><b>${n}</b><span class="note">${t}</span>${s === "D" ? `<span class="pill">Percakapan</span>` : sk[s] != null ? `<span class="pill ok">Terbaik ${sk[s]}%</span>` : `<span class="pill">Belum dicoba</span>`}</a></li>`).join("");
}
function lesson(k) {
    const l = L[k - 1];
    if (!store.seen[k]) {
        store.seen[k] = true;
        save(store);
    }
    const concept = l.c.map(blockHTML).join("");
    const vocab = l.v.map(vocabLi).join("");
    const ex = l.e.map(exLi).join("");
    const gr = GR.filter(g => g.bab.includes(k));
    $("#app").innerHTML = `
  <a class="crumb" href="#">← Semua bab</a>
  <div class="lhead"><div class="st">Bab ${k} dari ${L.length} · ${l.pr}</div><h1>${l.t}</h1><div class="goal"><b>Tujuan</b><br>${l.goal}</div></div>
  <section class="blk"><h2>Inti bab</h2>${concept}${gr.length ? `<p class="note">Penjelasan lengkap di Grammar Center: ${gr.map(g => `<a href="#tata-${g.id}">${g.t}</a>`).join(", ")}.</p>` : ""}</section>
  <section class="blk"><h2>Kosakata</h2>
    <div class="tools"><span>${l.v.length} kata. Ketuk tombol suara untuk mendengar.</span><label><input type="checkbox" id="hide"> Sembunyikan arti (tes ingatan)</label><a href="#kamus">Buka di Kamus</a></div>
    <ul class="vocab">${vocab}</ul></section>
  <section class="blk"><h2>Contoh kalimat</h2><ul class="ex">${ex}</ul></section>
  <section class="blk"><h2>Kuis</h2><div class="quiz" id="quiz"></div></section>
  <section class="blk"><h2>Dialog dan latihan keterampilan</h2><p class="note" style="margin-top:0">Dialog kontekstual dan empat keterampilan ujian A1 untuk bab ini.</p><ul class="list2">${skillCards(k)}</ul></section>
  <div class="nav">${k > 1 ? `<a class="btn alt" href="#b${k - 1}">← Bab ${k - 1}</a>` : "<span></span>"}${k < L.length ? `<a class="btn" href="#b${k + 1}">Bab ${k + 1} →</a>` : `<a class="btn" href="#">Selesai, ke beranda</a>`}</div>`;
    const app = $("#app");
    app.classList.remove("hide-id");
    app.classList.toggle("nospeech", !hasAudio());
    $("#hide").addEventListener("change", e => app.classList.toggle("hide-id", e.target.checked));
    wireSpk(app);
    app.querySelectorAll(".vocab li,.ex li").forEach(li => li.addEventListener("click", e => { if (!e.target.closest(".spk"))
        li.classList.add("show"); }));
    runQuiz($("#quiz"), shuffle(l.q), pct => {
        const pass = pct >= 60;
        if (pass)
            store.done[k] = true;
        store.best[k] = Math.max(store.best[k] || 0, pct);
        logRes("kuis", k, pct, "Kuis bab " + k + ": " + l.t);
        updateProg();
        return { pass, again: () => lesson(k),
            msg: pass ? "Bab ini selesai. Lanjutkan ke latihan keterampilan di bawah, atau ke bab berikutnya." : "Butuh minimal 60% untuk menyelesaikan bab. Baca lagi inti bab, lalu coba lagi.",
            next: pass ? (k < L.length ? `<a class="btn" href="#b${k + 1}">Ke bab ${k + 1}</a>` : `<a class="btn" href="#">Kembali ke beranda</a>`) : "" };
    });
    bookify(k);
}
/* ---------- Beranda ---------- */
const LABS = [["#kamus", "Kamus kosakata", "Cari kata Jerman atau Indonesia, simpan favorit, tandai kata yang dikuasai.", "Kosakata"], ["#tata", "Grammar Center", "13 topik tata bahasa A1, kesalahan umum, dan latihan.", "Tata bahasa"], ["#dengar", "Listening Lab", "Audio percakapan dan pengumuman, kecepatan bisa diatur, transkrip bisa disembunyikan.", "Hören"], ["#baca", "Bacaan", "Teks pendek per bab dengan pertanyaan pemahaman.", "Lesen"], ["#tulis", "Writing Lab", "Susun kalimat, terjemahan, formulir, pesan dan surel dengan koreksi.", "Schreiben"], ["#bicara", "Speaking Lab", "Pengucapan, tanya jawab, dialog, dan tutor AI.", "Sprechen"], ["#tes", "Simulasi ujian A1", "Hören, Lesen, Schreiben, Sprechen dengan timer dan pembahasan.", "Ujian"], ["#rencana", "Study Planner", "Target harian dan mingguan, jadwal, checklist, pengingat.", "Rencana"], ["#progres", "Dashboard", "Progres bab, nilai tiap latihan, dan rekomendasi.", "Progres"]];
function reminderBanner() {
    const k = keyOf(new Date()), t = store.days[k] || 0, goal = store.plan.daily * 60, wd = wdNow(), items = (store.plan.sched[wd] || []);
    if (!items.length && t >= goal)
        return "";
    const left = Math.max(0, Math.ceil((goal - t) / 60));
    return `<div class="goal remind"><b>Hari ini</b><br>${t >= goal ? "Target harian tercapai." : "Masih " + left + " menit lagi untuk mencapai target " + store.plan.daily + " menit."}${items.length ? ` Jadwal: ${items.map(it => { const ok = actDone(it, k); return `<a href="${ACT[it.a].h(it.b)}">${ok ? "✓ " : ""}${actName(it)}</a>`; }).join(" · ")}` : ` <a href="#rencana">Atur jadwal belajar</a>`}</div>`;
}
/* ---------- Kamus ---------- */
const DICT = [];
L.forEach((l, i) => l.v.forEach(v => DICT.push({ key: (i + 1) + "|" + v[0], bab: i + 1, de: v[0], ar: v[1], pr: v[2], pl: v[3], ex: v[4], exid: v[5], cat: v[6], n: normA(v[0] + " " + (v[3] || "")), na: normA(v[1]) })));
VTEM.forEach(v => DICT.push({ key: "0|" + v[0], bab: 0, de: v[0], ar: v[1], pr: v[2], pl: v[3], ex: v[4], exid: v[5], cat: v[6], n: normA(v[0] + " " + (v[3] || "")), na: normA(v[1]) }));
let dq = "", dcat = "", dbab = 0, dflt = "all", dlim = 60;
/* ---------- Listening Lab ---------- */
function dengar() {
    $("#app").innerHTML = `<div class="lhead"><h1>Listening Lab</h1><div class="goal">Latihan Hören: dengarkan dulu tanpa teks, jawab soal, lalu transkrip dan pembahasan terbuka setelah latihan selesai. Mulai dengan kecepatan pelan, naikkan ke 1× sebelum ujian.</div></div>
  <div class="tools">${audioCtl()}</div><p class="note">${audioNote()} ${voiceNote()}</p>
  <section class="blk" style="margin-top:18px"><h2>Menangkap informasi penting</h2><p class="note" style="margin-top:0">Nama, nomor telepon, jam, harga, jadwal, tempat, dan kegiatan di situasi sehari-hari: restoran, supermarket, stasiun, sekolah, dan lainnya.</p><ul class="list2">${HRI.map((h, i) => { const b = store.rbest["hi" + (i + 1)]; return `<li><a class="card2" href="#dengar-info-${i + 1}"><b>${h.t}</b><span class="note">${h.focus}</span><span class="pill">${h.sit}</span> ${b != null ? `<span class="pill ok">${b}%</span>` : ""}</a></li>`; }).join("")}</ul></section>
  <section class="blk"><h2>Percakapan per bab</h2><ul class="list2">${HR.map(h => { const s = (store.skill[h.bab] || {}).H; return `<li><a class="card2" href="#dengar-${h.bab}"><b>${h.t}</b><span class="note">${h.sub}</span><span class="pill">Bab ${h.bab} · ${h.sit}</span> ${s != null ? `<span class="pill ok">${s}%</span>` : ""}</a></li>`; }).join("")}</ul></section>
  <section class="blk"><h2>Dialog untuk didengar</h2><p class="note" style="margin-top:0">Semua dialog juga punya mode Dengar dengan teks yang dikaburkan.</p><ul class="list2">${DLG.map((d, i) => `<li><a class="card2" href="#d${i + 1}" data-dm><b>${d.t}</b><span class="note">${d.sub}</span><span class="pill">Bab ${d.bab}</span></a></li>`).join("")}</ul></section>
  <section class="blk"><h2>Siap ujian?</h2><p><a class="btn" href="#tes-hoeren">Simulasi ujian Hören</a></p></section>`;
    wireAudioCtl($("#app"));
    $("#app").querySelectorAll("[data-dm]").forEach(a => a.addEventListener("click", () => { dmode = "dengar"; }));
}
function dengarView(n, info) {
    const h = info ? HRI[n - 1] : HR.find(x => x.bab === n);
    if (!h) {
        dengar();
        return;
    }
    const b = h.bab, noAud = !hasAudio();
    let plays = 0, open = noAud, showM = false;
    $("#app").innerHTML = `<a class="crumb" href="#dengar">← Listening Lab</a><div class="lhead"><div class="st">${info ? "Informasi penting · " + h.focus : "Bab " + b + " · Hören"} · Situasi: ${h.sit || "-"}</div><h1>${h.t}</h1><div class="goal">${info ? "Fokus pada " + h.focus.toLowerCase() + ". Dengarkan tanpa teks, boleh putar dua atau tiga kali, lalu jawab." : h.sub + ". Dengarkan tanpa teks, boleh putar dua atau tiga kali, lalu jawab."} Transkrip dan pembahasan terbuka setelah semua soal dijawab.</div></div>
  <div class="quiz">${noAud ? `<p class="fb no" style="margin-top:0"><b>Mode baca (tanpa audio).</b>${audioNote()}</p>` : `<div class="row" style="margin-top:0;align-items:center"><button class="btn" id="hp" type="button">Putar audio</button><button class="btn alt" id="hp2" type="button">Putar pelan (0,7×)</button><button class="btn alt" id="hs" type="button">Berhenti</button><span class="chip" id="hc">Diputar 0×</span></div><div class="tools" style="margin-top:12px">${audioCtl()}</div><p class="note" id="hn">${audioNote()} ${voiceNote()}</p>`}
  <div class="row"><button class="btn alt" id="ht" type="button" ${open ? "" : "disabled"}>${open ? "Sembunyikan transkrip" : "Transkrip terbuka setelah latihan"}</button><button class="btn alt" id="hm" type="button" ${open ? "" : "hidden"}>Tampilkan arti</button></div>
  <ul class="dl hidemean" id="htr" style="margin-top:12px" ${open ? "" : "hidden"}>${h.l.map((l, i) => `<li class="bub ${l.s === "B" ? "b" : ""}" data-i="${i}"><span class="who">${l.s}</span><div class="say-t"><div class="in"><button class="spk" data-say="${esc(l.de)}" aria-label="Dengar baris ini">${SPK}</button><div class="w"><b>${l.de}</b><span class="mean">${l.id}</span></div></div></div></li>`).join("")}</ul></div>
  <section class="blk"><h2>Pertanyaan</h2><div class="quiz" id="quiz"></div></section>`;
    const app = $("#app");
    wireAudioCtl(app);
    wireSpk(app);
    const hl = i => app.querySelectorAll("#htr .bub").forEach((x, j) => x.classList.toggle("on", j === i));
    const tBtn = $("#ht"), unlock = () => { open = true; tBtn.disabled = false; tBtn.textContent = "Sembunyikan transkrip"; $("#htr").hidden = false; $("#hm").hidden = false; };
    const play = rate => { const ok = AU.play(h.l.map(l => ({ t: l.de, s: l.s })), { rate, g: h.g, onLine: hl, onEnd: fine => { hl(-1); if (fine === false) {
            unlock();
            $("#hn").innerHTML = "<b>Audio gagal diputar di perangkat ini.</b> Transkrip dibuka sebagai pengganti; baca dulu teksnya, lalu jawab soal.";
        } } }); if (ok) {
        plays++;
        $("#hc").textContent = "Diputar " + plays + "×";
    }
    else {
        $("#hn").textContent = audioNote();
    } };
    if (!noAud) {
        $("#hp").addEventListener("click", () => play());
        $("#hp2").addEventListener("click", () => play(0.7));
        $("#hs").addEventListener("click", () => { AU.stop(); hl(-1); });
    }
    tBtn.addEventListener("click", () => { if (tBtn.disabled)
        return; const vis = $("#htr").hidden; $("#htr").hidden = !vis; $("#hm").hidden = !vis; tBtn.textContent = vis ? "Sembunyikan transkrip" : "Tampilkan transkrip"; });
    $("#hm").addEventListener("click", e => { showM = !showM; $("#htr").classList.toggle("hidemean", !showM); e.currentTarget.textContent = showM ? "Sembunyikan arti" : "Tampilkan arti"; });
    const items = () => shuffle(h.q).map(q => ({ type: "mc", q: q.q, o: q.o, y: q.y, ans: q.o[0], from: b })).concat(h.f.map(f => ({ type: "fill", q: f.q, ans: f.ans, alt: f.alt, y: f.y, from: b })));
    const start = () => runSession($("#quiz"), items(), { onFinish: pct => {
            unlock();
            if (info) {
                store.rbest["hi" + n] = Math.max(store.rbest["hi" + n] || 0, pct);
                logRes("hoeren", b, pct, "Hören info: " + h.t + (noAud ? " (mode baca)" : ""));
            }
            else {
                logRes("hoeren", b, pct, "Hören: " + h.t + (noAud ? " (mode baca)" : ""));
                markSkill(b, "H", pct);
            }
            return { again: start, extra: `<p class="note">Transkrip di atas sekarang terbuka. Dengarkan lagi sambil membaca, terutama bagian soal yang salah.</p>` };
        } });
    start();
}
/* ---------- Bacaan: daftar dengan jenis teks ---------- */
let bjenis = "";
function bacaList() {
    const types = [...new Set(RD.map(r => r.jenis))];
    $("#app").innerHTML = `<div class="lhead"><h1>Bacaan</h1><div class="goal">Teks sehari-hari level A1: pesan, email, jadwal, pengumuman, menu, iklan, lowongan kerja, transportasi, dan tempat wisata. Jawab pertanyaannya dulu tanpa membuka arti. Sebagian soal meminta kamu menemukan informasi atau menyimpulkan, bukan menerjemahkan.</div></div>
  <div class="tools"><label>Jenis teks: <select class="sel" id="bj"><option value="">Semua (${RD.length})</option>${types.map(t => `<option ${bjenis === t ? "selected" : ""}>${t}</option>`).join("")}</select></label></div>
  <ul class="list2">${RD.map((r, i) => ({ r, i })).filter(x => !bjenis || x.r.jenis === bjenis).map(({ r, i }) => `<li><a class="card2" href="#r${i + 1}"><b>${r.t}</b><span class="note">${r.sub}</span><span class="pill">${r.jenis}</span> <span class="pill">Bab ${r.bab}</span> ${store.rbest[r.t] != null ? `<span class="pill ok">${store.rbest[r.t]}%</span>` : ""}</a></li>`).join("")}</ul>`;
    $("#bj").addEventListener("change", e => { bjenis = e.target.value; bacaList(); });
}
/* ---------- Writing Lab ---------- */
function tulis() {
    $("#app").innerHTML = `<div class="lhead"><h1>Writing Lab</h1><div class="goal">Latihan Schreiben dari kalimat sampai surel. Jawabanmu diperiksa otomatis untuk ejaan, huruf besar, kata yang hilang, susunan kalimat, dan kesalahan tata bahasa yang umum.</div></div>
  <ul class="list2"><li><a class="card2" href="#tulis-susun"><b>Susun kalimat</b><span class="note">Urutkan kata menjadi kalimat yang benar.</span><span class="pill">Satzbau</span></a></li><li><a class="card2" href="#tulis-terjemah"><b>Terjemahan Indonesia → Jerman</b><span class="note">36 kalimat dari 12 bab dengan koreksi per kata.</span><span class="pill">Übersetzung</span></a></li><li><a class="card2" href="#tulis-formulir"><b>Mengisi formulir</b><span class="note">Baca teks, lalu isi formulir seperti di ujian.</span><span class="pill">Formular</span></a></li><li><a class="card2" href="#tulis-situasi"><b>Menjawab sesuai situasi</b><span class="note">8 pertanyaan sehari-hari dijawab tertulis dengan koreksi.</span><span class="pill">Antworten</span></a></li><li><a class="card2" href="#tulis-pesan"><b>Pesan singkat dan surel</b><span class="note">12 tugas menulis dengan poin isi, koreksi, dan contoh jawaban.</span><span class="pill">Nachricht, E-Mail</span></a></li></ul>
  <section class="blk"><h2>Latihan per bab</h2><ol class="road">${L.map((l, i) => { const s = (store.skill[i + 1] || {}).S; return `<li><a class="rowl" href="#tulis-${i + 1}"><span class="num">${i + 1}</span><b>${WR[i + 1].msg.t}</b><span class="pill ${s != null ? "ok" : ""}">${s != null ? s + "%" : "Belum"}</span></a></li>`; }).join("")}</ol></section>
  <div class="tip"><span class="lab">Batas koreksi otomatis</span><br>Pemeriksaan otomatis membandingkan jawabanmu dengan jawaban yang benar dan mencari pola kesalahan A1 yang umum. Ia tidak memahami makna seperti guru, jadi kalimat yang benar tetapi berbeda bisa dianggap salah. Saat halaman dibuka di claude.ai, tombol <b>Koreksi dengan Claude</b> memberi koreksi yang lebih lengkap.</div>`;
}
let wsScope = 0;
function tulisSusun() {
    $("#app").innerHTML = `<a class="crumb" href="#tulis">← Writing Lab</a><div class="lhead"><h1>Susun kalimat</h1><div class="goal">Ketuk kata sesuai urutan yang benar. Ingat posisi kata kerja.</div></div>
  <div class="tools"><label>Cakupan: <select id="wss" class="sel"><option value="0">Semua bab</option>${L.map((l, i) => `<option value="${i + 1}" ${wsScope === i + 1 ? "selected" : ""}>Bab ${i + 1}: ${l.t}</option>`).join("")}</select></label></div><div class="quiz" id="quiz"></div>`;
    $("#wss").addEventListener("change", e => { wsScope = +e.target.value; tulisSusun(); });
    const P = L.map((l, i) => ({ l, b: i + 1 })).filter(x => !wsScope || x.b === wsScope);
    const out = [], seen = new Set();
    let g = 0;
    while (out.length < 8 && g++ < 120) {
        const it = GEN.order(P);
        if (it && !seen.has(it.ans)) {
            seen.add(it.ans);
            out.push(it);
        }
    }
    const start = () => runSession($("#quiz"), out.map(x => Object.assign({}, x, { tokens: shuffle(x.tokens) })), { onFinish: pct => { logRes("schreiben", wsScope, pct, "Susun kalimat" + (wsScope ? " bab " + wsScope : "")); if (wsScope)
            markSkill(wsScope, "S", pct); return { again: tulisSusun }; } });
    start();
}
function trItems(b) { const out = []; Object.keys(WR).forEach(k => { if (!b || +k === b)
    WR[k].tr.forEach(t => out.push({ type: "tr", q: t[0], acc: t[1], ans: t[1][0], y: "", from: +k })); }); return out; }
function tulisTerjemah() {
    $("#app").innerHTML = `<a class="crumb" href="#tulis">← Writing Lab</a><div class="lhead"><h1>Terjemahan Indonesia → Jerman</h1><div class="goal">Tulis kalimatnya dalam bahasa Jerman. Kata yang ejaannya keliru ditandai oranye, kata berlebih merah, huruf besar yang salah digarisbawahi.</div></div>
  <div class="tools"><label>Cakupan: <select id="wts" class="sel"><option value="0">Acak dari semua bab</option>${L.map((l, i) => `<option value="${i + 1}" ${wsScope === i + 1 ? "selected" : ""}>Bab ${i + 1}: ${l.t}</option>`).join("")}</select></label></div><div class="quiz" id="quiz"></div>`;
    $("#wts").addEventListener("change", e => { wsScope = +e.target.value; tulisTerjemah(); });
    const items = wsScope ? trItems(wsScope) : pick(trItems(0), 6);
    const start = () => runSession($("#quiz"), shuffle(items).map(x => Object.assign({}, x)), { onFinish: pct => { logRes("schreiben", wsScope, pct, "Terjemahan" + (wsScope ? " bab " + wsScope : "")); if (wsScope)
            markSkill(wsScope, "S", pct); return { again: tulisTerjemah }; } });
    start();
}
function formHTML(f, given) { return `<div class="form">${(given || []).map(([l, v]) => `<label class="fl"><span>${l}</span><input class="inp" value="${esc(v)}" disabled></label>`).join("")}${f.map((x, i) => `<label class="fl" data-fi="${i}"><span>${x.l}</span>${x.sel ? `<select class="sel" data-f="${i}"><option value="">– pilih –</option>${x.sel.map(o => `<option>${o}</option>`).join("")}</select>` : x.chk ? `<span class="chks">${x.chk.map(o => `<label><input type="checkbox" data-f="${i}" value="${o}"> ${o}</label>`).join("")}</span>` : `<input class="inp" data-f="${i}" autocomplete="off" spellcheck="false">`}<span class="fres"></span></label>`).join("")}</div>`; }
const MON = { januar: 1, jan: 1, februar: 2, feb: 2, maerz: 3, mrz: 3, april: 4, apr: 4, mai: 5, juni: 6, jun: 6, juli: 7, jul: 7, august: 8, aug: 8, september: 9, sep: 9, sept: 9, oktober: 10, okt: 10, november: 11, nov: 11, dezember: 12, dez: 12 };
function formCheck(root, f) {
    let ok = 0;
    f.forEach((x, i) => {
        const lab = root.querySelector(`[data-fi="${i}"]`), res = lab.querySelector(".fres");
        let good = false, val = "";
        if (x.chk) {
            const v = [...lab.querySelectorAll("input:checked")].map(c => c.value);
            val = v.join(", ");
            good = v.length === x.acc.length && x.acc.every(a => v.includes(a));
        }
        else {
            const el = lab.querySelector("[data-f]");
            val = el.value;
            const nv = s => { let r = normA(s); if (x.digits)
                return r.replace(/\D/g, ""); if (x.date)
                return r.split(/[^a-z0-9]+/).filter(Boolean).map(q => MON[q] != null ? String(MON[q]) : q.replace(/^0+(?=\d)/, "")).join("."); return r.replace(/\s+/g, " ").replace(/[.,]$/, ""); };
            good = !!val.trim() && x.acc.some(a => nv(a) === nv(val));
        }
        if (good)
            ok++;
        lab.classList.toggle("fok", good);
        lab.classList.toggle("fno", !good);
        res.innerHTML = good ? "✓" : "✗ Jawaban: <b>" + escH(x.acc[0] + (x.chk ? " + " + x.acc.slice(1).join(" + ") : "")) + "</b>";
    });
    return ok;
}
function tulisFormular(i) {
    const F = FORMS[i];
    if (!F) {
        $("#app").innerHTML = `<a class="crumb" href="#tulis">← Writing Lab</a><div class="lhead"><h1>Mengisi formulir</h1><div class="goal">Di ujian A1 kamu membaca teks pendek lalu mengisi formulir. Pilih satu latihan.</div></div><ul class="list2">${FORMS.map((f, j) => `<li><a class="card2" href="#tulis-formulir-${j + 1}"><b>${f.t}</b><span class="note">${f.title}</span><span class="pill">${f.f.length} isian</span></a></li>`).join("")}</ul>`;
        return;
    }
    $("#app").innerHTML = `<a class="crumb" href="#tulis-formulir">← Semua formulir</a><div class="lhead"><h1>${F.t}</h1><div class="goal">Baca teksnya, lalu isi formulir dalam bahasa Jerman. Tulisan tanggal boleh 3.8. atau 3. August.</div></div>
  <div class="paper">${escH(F.text)}</div><div class="quiz" style="margin-top:14px"><h3 style="margin-bottom:10px">${F.title}</h3>${formHTML(F.f)}<div class="row"><button class="btn" id="fc" type="button">Periksa</button><button class="btn alt" id="fr" type="button">Ulangi</button></div><div id="fs" aria-live="polite"></div></div>`;
    let logged = false;
    $("#fc").addEventListener("click", () => { const ok = formCheck($("#app"), F.f), pct = Math.round(ok / F.f.length * 100); $("#fs").innerHTML = `<div class="fb ${pct >= 60 ? "ok" : "no"}"><b>${ok} dari ${F.f.length} benar (${pct}%)</b>${pct === 100 ? "Semua isian tepat." : "Lihat jawaban yang benar di bawah setiap isian yang salah. Perhatikan huruf besar pada nama dan kata benda."}</div>`; if (!logged) {
        logged = true;
        logRes("schreiben", 0, pct, "Formulir: " + F.t);
    } });
    $("#fr").addEventListener("click", () => tulisFormular(i));
}
function writeTask(box, task, b, label) {
    box.innerHTML = `<div class="goal" style="margin-top:0"><b>Tugas</b><br>${escH(task.task)}</div><textarea class="inp ta" id="wt" rows="7" spellcheck="false" aria-label="Tulisanmu" placeholder="Tulis di sini dalam bahasa Jerman..."></textarea>${UMLAUT}<p class="note" id="wc">0 kata</p>
  <div class="row"><button class="btn" id="wchk" type="button">Periksa otomatis</button>${SAMPLE ? `<button class="btn alt" id="wcl" type="button">Koreksi dengan Claude</button>` : ""}<button class="btn alt" id="wmod" type="button">Lihat contoh jawaban</button></div><div id="wres"></div><div id="wcres"></div><div id="wmodel" hidden><div class="sumbox"><h3>Contoh jawaban</h3><p class="de">${escH(task.model)}</p>${task.modelId ? `<p class="note">Artinya: ${escH(task.modelId)}</p>` : ""}<button class="spk" data-say="${esc(task.model)}" aria-label="Dengar contoh">${SPK}</button></div></div>`;
    const ta = box.querySelector("#wt");
    wireUml(box, ta);
    wireSpk(box);
    const key = "draft-" + label;
    try {
        ta.value = sessionStorage.getItem(key) || "";
    }
    catch (e) { }
    const cnt = () => { box.querySelector("#wc").textContent = wordsOf(ta.value).length + " kata (target minimal " + task.min + ")"; try {
        sessionStorage.setItem(key, ta.value);
    }
    catch (e) { } };
    ta.addEventListener("input", cnt);
    cnt();
    let lastLog = "";
    box.querySelector("#wchk").addEventListener("click", () => { const v = ta.value.trim(); if (!v) {
        box.querySelector("#wres").innerHTML = `<p class="note">Tulis dulu jawabanmu.</p>`;
        return;
    } const r = checkFree(v, task); box.querySelector("#wres").innerHTML = freeReport(r, task); if (v !== lastLog) {
        lastLog = v;
        logRes("schreiben", b, r.score, label);
        if (b)
            markSkill(b, "S", r.score);
    } box.querySelector("#wres").scrollIntoView({ block: "nearest" }); });
    const cl = box.querySelector("#wcl");
    if (cl)
        cl.addEventListener("click", () => { if (!ta.value.trim())
            return; claudeWriting(box.querySelector("#wcres"), task, ta.value); });
    box.querySelector("#wmod").addEventListener("click", () => { box.querySelector("#wmodel").hidden = false; });
}
let wpSel = 1;
function tulisPesan() {
    $("#app").innerHTML = `<a class="crumb" href="#tulis">← Writing Lab</a><div class="lhead"><h1>Pesan singkat dan surel</h1><div class="goal">Pilih tugas, tulis jawabanmu, lalu periksa. Di ujian A1 kamu menulis sekitar 30 kata dan harus membahas semua poin tugas.</div></div>
  <div class="tools"><label>Tugas: <select class="sel" id="wps">${L.map((l, i) => `<option value="${i + 1}" ${wpSel === i + 1 ? "selected" : ""}>Bab ${i + 1}: ${WR[i + 1].msg.t}</option>`).join("")}${EXS.map((e, j) => `<option value="x${j}" ${wpSel === "x" + j ? "selected" : ""}>Latihan ujian ${j + 1}</option>`).join("")}</select></label></div><div class="quiz" id="wbox"></div>`;
    $("#wps").addEventListener("change", e => { const v = e.target.value; wpSel = v[0] === "x" ? v : +v; tulisPesan(); });
    if (typeof wpSel === "string") {
        const m = EXS[+wpSel.slice(1)].msg;
        writeTask($("#wbox"), Object.assign({ t: "Latihan ujian" }, m), 0, "Pesan: latihan ujian " + (+wpSel.slice(1) + 1));
    }
    else
        writeTask($("#wbox"), WR[wpSel].msg, wpSel, "Pesan bab " + wpSel + ": " + WR[wpSel].msg.t);
}
function tulisBab(b) {
    const w = WR[b];
    if (!w) {
        tulis();
        return;
    }
    $("#app").innerHTML = `<a class="crumb" href="#tulis">← Writing Lab</a><div class="lhead"><div class="st">Bab ${b} · Schreiben</div><h1>${L[b - 1].t}</h1><div class="goal">Dua langkah: terjemahkan tiga kalimat, lalu tulis teks pendek.</div></div>
  <section class="blk"><h2>1. Terjemahan</h2><div class="quiz" id="quiz"></div></section><section class="blk"><h2>2. ${w.msg.t}</h2><div class="quiz" id="wbox"></div></section>`;
    const start = () => runSession($("#quiz"), trItems(b), { onFinish: pct => { logRes("schreiben", b, pct, "Terjemahan bab " + b); markSkill(b, "S", pct); return { again: start }; } });
    start();
    writeTask($("#wbox"), w.msg, b, "Pesan bab " + b + ": " + w.msg.t);
}
/* ---------- Speaking Lab ---------- */
const SPKNOTE = `<div class="tip"><span class="lab">Cara membaca hasil latihan bicara</span><br><b>Dikenali mesin</b> = teks yang ditebak pengenalan suara dari ucapanmu. <b>Ketepatan kalimat</b> = berapa kata yang cocok dengan kalimat target atau jawaban yang diharapkan. <b>Pelafalan</b> tidak dinilai otomatis: pengenalan suara tidak mengukur aksen, intonasi, atau panjang-pendek vokal, dan bisa keliru jika ada bising atau mic jauh. Untuk pelafalan, dengarkan contoh, rekam suaramu di halaman Lafal, lalu nilai sendiri. Jika mic tidak tersedia, semua latihan tetap bisa dikerjakan dengan mengetik.</div>`;
/* Hasil latihan ucapan: pengenalan suara, ketepatan kalimat, dan pelafalan dipisahkan */
function scoreSpeech(target, heard, typed) {
    const raw = target.split(/\s+/), a = raw.map(w => tokz(w).join("")), b = tokz(heard), n = a.length, m = b.length;
    const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = 1; i <= n; i++)
        for (let j = 1; j <= m; j++)
            dp[i][j] = a[i - 1] && a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    const hit = new Array(n).fill(false);
    let i = n, j = m;
    while (i > 0 && j > 0) {
        if (a[i - 1] && a[i - 1] === b[j - 1]) {
            hit[i - 1] = true;
            i--;
            j--;
        }
        else if (dp[i - 1][j] >= dp[i][j - 1])
            i--;
        else
            j--;
    }
    const valid = a.filter(Boolean).length || 1, pct = Math.round(hit.filter(Boolean).length / valid * 100);
    const msg = pct >= 80 ? "Hampir semua kata cocok dengan kalimat target." : pct >= 50 ? "Sebagian kata cocok. Perhatikan kata yang merah." : "Banyak kata belum cocok. Dengarkan contoh lagi, lalu coba pelan-pelan.";
    const html = `<div class="sent">${raw.map((w, k) => `<span class="${a[k] ? (hit[k] ? "okw" : "badw") : ""}">${escH(w)}</span>`).join(" ")}</div>
  <ul class="sres"><li><span class="lab2">${typed ? "Teks yang diketik" : "Dikenali mesin"}</span>“${escH(heard)}”</li>
  <li><span class="lab2">Ketepatan kalimat</span><b>${pct}%</b> · ${msg}</li>
  <li><span class="lab2">Pelafalan</span>${typed ? "Tidak dinilai karena jawaban diketik. Ucapkan juga kalimatnya dengan suara keras." : `Tidak dinilai otomatis: pengenalan suara hanya menebak kata, tidak mengukur aksen atau intonasi, dan bisa keliru. Dengarkan contoh, ucapkan lagi, lalu nilai sendiri: <span class="selfr"><button class="ib" type="button" data-self="1">Sudah mirip</button> <button class="ib" type="button" data-self="0">Perlu latihan</button></span>`}</li></ul>`;
    return { pct, html };
}
function wireSelf(el) { el.querySelectorAll("[data-self]").forEach(b => b.addEventListener("click", () => { store.pron.ok = store.pron.ok || 0; store.pron.no = store.pron.no || 0; store.pron[b.dataset.self === "1" ? "ok" : "no"]++; save(store); b.parentNode.textContent = b.dataset.self === "1" ? "Tercatat: sudah mirip." : "Tercatat: perlu latihan. Dengarkan contoh dengan kecepatan pelan."; })); }
function speakCheck(box, target, onScore) {
    box.innerHTML = `<div class="spkbox"><div class="microw"><button class="mic" type="button" data-mic hidden aria-pressed="false">${MICSVG}<span>Bicara</span></button><span class="heard" aria-live="polite"></span></div><div class="tyrow"><input class="inp ti" placeholder="Tanpa mic? Ketik kalimatnya" aria-label="Ketik kalimat" autocomplete="off" spellcheck="false"><button class="btn alt tc" type="button">Periksa</button></div><div class="note mnote" aria-live="polite"></div><div class="res"></div></div>`;
    const mic = box.querySelector(".mic"), hd = box.querySelector(".heard"), ti = box.querySelector(".ti"), res = box.querySelector(".res"), mn = box.querySelector(".mnote");
    let heard = "";
    function finish(text, typed) { const r = scoreSpeech(target, text, typed); r.heard = text; res.innerHTML = r.html; wireSelf(res); if (onScore)
        onScore(r); }
    mic.addEventListener("click", () => {
        if (Mic.active && Mic.active.owner === mic) {
            Mic.stop();
            return;
        }
        AU.stop();
        heard = "";
        hd.textContent = "Mendengarkan...";
        res.innerHTML = "";
        mn.textContent = "";
        Mic.start({ owner: mic, autoStop: 1600,
            onPartial: t => { hd.textContent = (heard + (t ? (heard ? " " : "") + t : "")).trim() || "Mendengarkan..."; },
            onFinal: t => { heard = (heard + " " + t).trim(); hd.textContent = heard; },
            onState: s => micBtn(mic, s === "listening" || s === "starting" || s === "finishing"),
            onEnd: r => { micBtn(mic, false); if (heard.trim())
                finish(heard, false);
            else {
                hd.textContent = "";
                mn.textContent = micMsg(r) || "Tidak ada suara terdengar. Coba lagi dan bicara lebih dekat ke mic, atau ketik kalimatnya.";
            } } });
    });
    const typed = () => { if (ti.value.trim())
        finish(ti.value, true); };
    box.querySelector(".tc").addEventListener("click", typed);
    ti.addEventListener("keydown", e => { if (e.key === "Enter")
        typed(); });
    refreshMics();
}
const REC = { mr: null, stop() { try {
        if (this.mr && this.mr.state === "recording")
            this.mr.stop();
    }
    catch (e) { } } };
function recorderBox(el) {
    if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder)) {
        el.innerHTML = `<p class="note">Perekam suara tidak didukung browser ini. Ucapkan dengan suara keras dan bandingkan dengan contoh.</p>`;
        return;
    }
    el.innerHTML = `<div class="row" style="align-items:center"><button class="btn alt" data-rec type="button">● Rekam suaraku</button><audio controls hidden></audio></div><p class="note" data-rn>Rekam dirimu (maksimal 10 detik), lalu dengarkan dan bandingkan dengan contoh. Rekaman tidak dikirim ke mana pun.</p>`;
    const btn = el.querySelector("[data-rec]"), au = el.querySelector("audio"), nt = el.querySelector("[data-rn]");
    btn.addEventListener("click", () => {
        if (REC.mr && REC.mr.state === "recording") {
            REC.stop();
            return;
        }
        AU.stop();
        navigator.mediaDevices.getUserMedia({ audio: true }).then(st => {
            const ch = [];
            const mr = new MediaRecorder(st);
            REC.mr = mr;
            mr.ondataavailable = e => { if (e.data && e.data.size)
                ch.push(e.data); };
            mr.onstop = () => { st.getTracks().forEach(t => t.stop()); const blob = new Blob(ch, { type: mr.mimeType || "audio/webm" }); au.src = URL.createObjectURL(blob); au.hidden = false; btn.textContent = "● Rekam lagi"; nt.textContent = "Putar rekamanmu, lalu bandingkan dengan tombol suara contoh."; };
            mr.start();
            btn.textContent = "■ Berhenti merekam";
            nt.textContent = "Merekam... ucapkan sekarang.";
            setTimeout(() => REC.stop(), 10000);
        })
            .catch(err => { nt.textContent = err && err.name === "NotAllowedError" ? "Izin mikrofon ditolak. Izinkan mikrofon di pengaturan browser untuk merekam, atau latih dengan mengucapkan keras-keras." : "Mikrofon tidak bisa dipakai di tampilan ini (misalnya di dalam claude.ai atau tanpa HTTPS). Coba buka website ini langsung di Chrome atau Edge."; });
    });
}
function bicaraLafal() {
    $("#app").innerHTML = `<a class="crumb" href="#bicara">← Speaking Lab</a><div class="lhead"><h1>Lafal bunyi khas Jerman</h1><div class="goal">Latih ä, ö, ü, ch, dan r. Untuk setiap bunyi: baca cara membentuk mulut, dengarkan contoh, bedakan pasangan kata dengan telinga, lalu ucapkan dan rekam suaramu untuk dibandingkan.</div></div>
  <div class="seg" id="lsel" role="group" aria-label="Pilih bunyi">${LAUT.map((x, i) => `<button data-i="${i}" aria-pressed="${i === 0}" type="button">${x.t}</button>`).join("")}</div><div id="lbox"></div>${SPKNOTE}<p class="note" id="micstat"></p>`;
    const show = i => {
        const x = LAUT[i];
        AU.stop();
        if (Mic.active)
            Mic.stop();
        REC.stop();
        $("#lsel").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.i === i)));
        $("#lbox").innerHTML = `<div class="tip"><span class="lab">Cara mengucapkan ${x.t}</span><br>${x.how}</div>
    <section class="blk" style="margin-top:18px"><h2>1. Dengarkan contoh</h2><div class="row" style="margin-top:0"><button class="btn alt" id="lall" type="button">Putar semua kata</button><button class="btn alt" id="lslow" type="button">Putar pelan</button></div><ul class="vocab" style="margin-top:12px">${x.w.map(w => `<li><button class="spk" data-say="${esc(w)}" aria-label="Dengar ${esc(w)}">${SPK}</button><div class="w"><b>${w}</b></div></li>`).join("")}<li><button class="spk" data-say="${esc(x.s)}" aria-label="Dengar kalimat">${SPK}</button><div class="w"><b>${x.s}</b><span class="note">kalimat latihan</span></div></li></ul></section>
    ${x.pairs.length ? `<section class="blk"><h2>2. Bedakan bunyinya</h2><div class="quiz" id="ldq"></div></section>` : ""}
    <section class="blk"><h2>${x.pairs.length ? 3 : 2}. Ucapkan</h2><div class="sugs" id="ltg">${x.w.concat([x.s]).map((w, k) => `<button class="chipk" type="button" data-tg="${k}" aria-pressed="${k === x.w.length}">${escH(w)}</button>`).join("")}</div><div class="quiz" style="margin-top:12px"><div class="fw" id="ltgt" style="font-size:1.5rem;text-align:left">${escH(x.s)}</div><div id="lsc" style="margin-top:10px"></div></div></section>
    <section class="blk"><h2>${x.pairs.length ? 4 : 3}. Rekam dan bandingkan</h2><div class="quiz" id="lrec"></div></section>`;
        const box = $("#lbox");
        wireSpk(box);
        $("#lall").addEventListener("click", () => AU.seq(x.w));
        $("#lslow").addEventListener("click", () => AU.seq(x.w, { rate: 0.65 }));
        const setT = k => { const t = x.w.concat([x.s])[k]; $("#ltgt").textContent = t; box.querySelectorAll("[data-tg]").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.tg === k))); speakCheck($("#lsc"), t); };
        box.querySelectorAll("[data-tg]").forEach(b => b.addEventListener("click", () => setT(+b.dataset.tg)));
        setT(x.w.length);
        recorderBox($("#lrec"));
        if (x.pairs.length) {
            const q = $("#ldq");
            if (!hasAudio()) {
                q.innerHTML = `<p class="note">${audioNote()} Latihan membedakan bunyi butuh audio. Baca pasangan kata ini keras-keras: ${x.pairs.map(p => p.join(" – ")).join(" · ")}.</p>`;
            }
            else {
                let r = 0, sc = 0;
                const N = 6;
                const round = () => {
                    if (r >= N) {
                        const pct = Math.round(sc / N * 100);
                        q.innerHTML = `<div class="score">${sc}/${N}</div><p style="margin:10px 0 0">${pct >= 80 ? "Telingamu sudah bisa membedakan bunyi ini." : "Dengarkan pasangan katanya beberapa kali lagi dengan kecepatan pelan."}</p><div class="row"><button class="btn alt" id="ldr" type="button">Ulangi</button></div>`;
                        logRes("sprechen", 0, pct, "Lafal " + x.t + ": membedakan bunyi");
                        q.querySelector("#ldr").addEventListener("click", () => { r = 0; sc = 0; round(); });
                        return;
                    }
                    const pr = pick1(x.pairs), w = pick1(pr);
                    q.innerHTML = `<div class="qmeta"><span>Soal ${r + 1} dari ${N}</span><span>Benar: ${sc}</span></div><p class="qtext">Dengarkan, lalu pilih kata yang kamu dengar.</p><div class="row" style="margin-top:0"><button class="btn" id="ldp" type="button">Dengar</button><button class="btn alt" id="ldps" type="button">Dengar pelan</button></div><div class="opts rf" style="margin-top:12px">${pr.map(o => `<button class="opt" type="button" data-o="${esc(o)}">${escH(o)}</button>`).join("")}</div><div id="ldf" aria-live="polite"></div>`;
                    q.querySelector("#ldp").addEventListener("click", () => AU.say(w));
                    q.querySelector("#ldps").addEventListener("click", () => AU.say(w, { rate: 0.6 }));
                    q.querySelectorAll("[data-o]").forEach(o => o.addEventListener("click", () => {
                        const ok = o.dataset.o === w;
                        if (ok)
                            sc++;
                        q.querySelectorAll("[data-o]").forEach(x2 => { x2.disabled = true; if (x2.dataset.o === w)
                            x2.classList.add("ok"); });
                        if (!ok)
                            o.classList.add("no");
                        q.querySelector("#ldf").innerHTML = `<div class="fb ${ok ? "ok" : "no"}"><b>${ok ? "Benar!" : "Belum tepat."}</b>Yang diputar: ${escH(w)}. Bandingkan: ${pr.map(p => `<button class="ib" type="button" data-say2="${esc(p)}">▶ ${escH(p)}</button>`).join(" ")}</div><div class="row"><button class="btn" id="ldn" type="button">${r < N - 1 ? "Lanjut" : "Lihat hasil"}</button></div>`;
                        q.querySelectorAll("[data-say2]").forEach(z => z.addEventListener("click", () => AU.say(z.dataset.say2)));
                        q.querySelector("#ldn").addEventListener("click", () => { r++; round(); });
                    }));
                };
                round();
            }
        }
    };
    $("#lsel").querySelectorAll("button").forEach(b => b.addEventListener("click", () => show(+b.dataset.i)));
    show(0);
    refreshMics();
}
const KENALPOLA = [["Ich heiße ... / Mein Name ist ...", "Name"], ["Ich bin ... Jahre alt.", "Alter"], ["Ich komme aus ...", "Land"], ["Ich wohne in ...", "Wohnort"], ["Ich spreche ... und ein bisschen Deutsch.", "Sprachen"], ["Ich bin Student / Studentin. / Ich arbeite als ...", "Beruf"], ["Mein Hobby ist ... / Ich ... gern.", "Hobby"]];
const KENALMODEL = "Ich heiße Rina. Ich bin 22 Jahre alt. Ich komme aus Indonesien und wohne in Bandung. Ich spreche Indonesisch, Englisch und ein bisschen Deutsch. Ich bin Studentin. Mein Hobby ist Lesen.";
function bicaraKenal() {
    $("#app").innerHTML = `<a class="crumb" href="#bicara">← Speaking Lab</a><div class="lhead"><h1>Perkenalan diri</h1><div class="goal">Seperti Sprechen Teil 1 di ujian A1: perkenalkan dirimu dalam 5 sampai 7 kalimat dengan kata kunci di bawah. Ucapkan lewat mic atau ketik.</div></div>
  <div class="sugs">${EXSP.intro.keys.map(k => `<span class="chipk">${k[0]}?</span>`).join("")}</div>
  <details class="rev"><summary>Lihat pola kalimat</summary><div class="tbl"><table><thead><tr><th>Kata kunci</th><th>Pola</th></tr></thead><tbody>${KENALPOLA.map(p => `<tr><td>${p[1]}</td><td><span class="de">${p[0]}</span></td></tr>`).join("")}</tbody></table></div></details>
  <div class="quiz" style="margin-top:14px"><div id="kbox"></div><div id="kres" aria-live="polite"></div></div><p class="note" id="micstat"></p>`;
    let last = "";
    answerBox($("#kbox"), { multi: true, retry: true, btn: "Periksa perkenalan", ph: "Atau ketik perkenalanmu di sini", onSubmit: t => {
            const n = normA(t), r = EXSP.intro.keys.map(([lab, re]) => ({ lab, ok: new RegExp(re).test(n) })), hit = r.filter(x => x.ok).length, pct = Math.round(hit / r.length * 100);
            const iss = grammarScan(t, false).filter(i => i.type !== "Huruf besar");
            $("#kres").innerHTML = `<div class="spkres"><p style="margin:0"><b>Isi: ${hit} dari ${r.length} kata kunci (${pct}%)</b></p><ul class="chkl">${r.map(x => `<li class="${x.ok ? "y" : "n"}">${x.ok ? "✓" : "✗"} ${x.lab}${x.ok ? "" : `: <span class="de">${KENALPOLA.find(p => p[1] === x.lab)[0]}</span>`}</li>`).join("")}</ul><h3 style="margin-top:10px">Tata bahasa dan susunan kalimat</h3>${issuesHTML(iss)}<p class="note">Huruf besar dan tanda baca tidak dinilai di sini karena hasil pengenalan suara tidak menuliskannya.</p><p>Contoh: <span class="de">${KENALMODEL}</span> <button class="spk sm" data-say="${esc(KENALMODEL)}" aria-label="Dengar contoh">${SPK}</button></p>${SAMPLE ? `<div class="row"><button class="btn alt" id="kcl" type="button">Koreksi dengan Claude</button></div><div id="kclr"></div>` : ""}</div>`;
            wireSpk($("#kres"));
            const kc = $("#kcl");
            if (kc)
                kc.addEventListener("click", () => claudeWriting($("#kclr"), { task: "Perkenalan diri lisan level A1: nama, umur, asal, tempat tinggal, bahasa, pekerjaan, hobi." }, t));
            if (t !== last) {
                last = t;
                logRes("sprechen", 1, pct, "Perkenalan diri");
            }
        } });
    refreshMics();
}
function bicara() {
    $("#app").innerHTML = `<div class="lhead"><h1>Speaking Lab</h1><div class="goal">Latihan berbicara dua arah. Mic mengubah suaramu jadi teks, lalu aplikasi memeriksa ucapanmu atau Claude membalas percakapanmu.</div></div>
  <ul class="list2"><li><a class="card2" href="#ulangi"><b>Ulangi kalimat</b><span class="note">Dengar contoh, ucapkan, lalu lihat kata mana yang sudah tepat.</span><span class="pill">Pengucapan</span></a></li><li><a class="card2" href="#ngobrol"><b>Ngobrol dengan Claude</b><span class="note">Tutor AI untuk percakapan A1 dalam situasi sehari-hari, lengkap dengan koreksi dan saran jawaban.</span><span class="pill">Tutor AI</span></a></li><li><a class="card2" href="#dialog"><b>Dialog main peran</b><span class="note">Pilih peran A atau B, ucapkan bagianmu, dan ucapanmu diperiksa.</span><span class="pill">Bab 1 sampai 12</span></a></li><li><a class="card2" href="#bicara-lafal"><b>Lafal ä, ö, ü, ch, r</b><span class="note">Cara membentuk mulut, contoh audio, membedakan bunyi, dan rekam suaramu.</span><span class="pill">Pelafalan</span></a></li><li><a class="card2" href="#bicara-minta"><b>Meminta informasi dan permintaan</b><span class="note">Bertanya jam buka, harga, arah; meminta tolong dengan sopan.</span><span class="pill">Sprechen Teil 2–3</span></a></li><li><a class="card2" href="#bicara-kenal"><b>Perkenalan diri</b><span class="note">Nama, umur, asal, tempat tinggal, bahasa, pekerjaan, hobi, dengan umpan balik.</span><span class="pill">Sprechen Teil 1</span></a></li><li><a class="card2" href="#tes-sprechen"><b>Simulasi Sprechen</b><span class="note">Perkenalan diri, tanya jawab dengan kartu, dan permintaan.</span><span class="pill">Ujian</span></a></li></ul>
  <section class="blk"><h2>Latihan per bab</h2><p class="note" style="margin-top:0">Ucapkan kata dan kalimat bab, lalu jawab pertanyaan lisan.</p><ol class="road">${L.map((l, i) => { const s = (store.skill[i + 1] || {}).Sp; return `<li><a class="rowl" href="#bicara-${i + 1}"><span class="num">${i + 1}</span><b>${l.t}</b><span class="pill ${s != null ? "ok" : ""}">${s != null ? s + "%" : "Belum"}</span></a></li>`; }).join("")}</ol></section>
  ${SPKNOTE}<p class="note" id="micstat"></p><p class="note" id="chatstat"></p>`;
    refreshMics();
}
function pronRun(box, items, onDone) {
    let idx = 0;
    const sc = [];
    function show() {
        if (idx >= items.length) {
            const vals = sc.filter(v => typeof v === "number"), avg = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
            store.spk = (store.spk || 0) + vals.length;
            save(store);
            onDone(avg, vals.length);
            return;
        }
        const it = items[idx];
        box.innerHTML = `<div class="qmeta"><span>${it.kind} ${idx + 1} dari ${items.length}</span></div><div class="fw" style="font-size:1.6rem;margin-bottom:4px;text-align:left">${escH(it.de)}</div>${it.pr ? `<div class="say" style="margin-bottom:8px">${escH(it.pr)}</div>` : ""}<div class="row" style="margin:0 0 6px"><button class="btn alt" id="hear" type="button">Dengar contoh</button><button class="btn alt" id="mean" type="button">Lihat arti</button></div><p class="note" id="mn" hidden>${escH(it.ar)}</p><div id="chk"></div><div class="row"><button class="btn" id="nx2" type="button">${idx < items.length - 1 ? "Berikutnya" : "Lanjut"}</button></div>`;
        box.querySelector("#hear").addEventListener("click", () => speak(it.de));
        box.querySelector("#mean").addEventListener("click", () => { box.querySelector("#mn").hidden = false; });
        speakCheck(box.querySelector("#chk"), it.de, r => { sc[idx] = r.pct; });
        box.querySelector("#nx2").addEventListener("click", () => { if (Mic.active)
            Mic.stop(); idx++; show(); });
    }
    show();
}
function qaRun(box, qs, onDone) {
    let idx = 0;
    const sc = [];
    function show() {
        if (idx >= qs.length) {
            const vals = sc.filter(v => typeof v === "number");
            onDone(vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null);
            return;
        }
        const q = qs[idx];
        box.innerHTML = `<div class="qmeta"><span>Pertanyaan ${idx + 1} dari ${qs.length}</span></div><div class="qtext">${escH(q.q)}</div><div class="row" style="margin:0 0 10px"><button class="btn alt" id="qh" type="button">Dengar pertanyaan</button><button class="btn alt" id="qi" type="button">Arti</button></div><p class="note" id="qid" hidden>${escH(q.id)}</p><div id="qa"></div><div id="qr" aria-live="polite"></div><div class="row"><button class="btn" id="qn" type="button">${idx < qs.length - 1 ? "Pertanyaan berikutnya" : "Lihat hasil"}</button></div>`;
        box.querySelector("#qh").addEventListener("click", () => speak(q.q));
        box.querySelector("#qi").addEventListener("click", () => { box.querySelector("#qid").hidden = false; });
        answerBox(box.querySelector("#qa"), { retry: true, ph: "Ketik jawaban dalam bahasa Jerman", onSubmit: t => {
                const r = evalAns(t, q.k);
                sc[idx] = r.pct;
                box.querySelector("#qr").innerHTML = `<div class="spkres"><p style="margin:0"><b>Jawabanmu:</b> “${escH(t)}”</p><ul class="chkl">${r.r.map(x => `<li class="${x.ok ? "y" : "n"}">${x.ok ? "✓" : "✗"} ${escH(x.lab)}</li>`).join("")}<li class="${r.words >= 3 ? "y" : "n"}">${r.words >= 3 ? "✓" : "✗"} kalimat lengkap (minimal 3 kata)</li></ul><p style="margin:6px 0 0"><b>${r.pct}%</b> · Contoh jawaban: <span class="de">${escH(q.m)}</span> <button class="spk sm" data-say="${esc(q.m.split(" / ")[0])}" aria-label="Dengar contoh">${SPK}</button></p>${SAMPLE ? `<div class="row"><button class="btn alt" id="qc" type="button">Koreksi dengan Claude</button></div><div id="qcr"></div>` : ""}</div>`;
                wireSpk(box.querySelector("#qr"));
                const qc = box.querySelector("#qc");
                if (qc)
                    qc.addEventListener("click", () => claudeAnswer(box.querySelector("#qcr"), q, t));
            } });
        box.querySelector("#qn").addEventListener("click", () => { if (Mic.active)
            Mic.stop(); idx++; show(); });
    }
    show();
}
async function claudeAnswer(el, q, t) {
    el.innerHTML = `<p class="note">Claude sedang memeriksa...</p>`;
    try {
        const r = await SAMPLE.json(`Kamu guru bahasa Jerman A1 untuk pelajar Indonesia. Pertanyaan: "${q.q}". Jawaban lisan pelajar (hasil pengenalan suara, bisa tanpa tanda baca dan huruf besar, abaikan itu): "${t}". Balas hanya JSON: {"benar":true atau false,"perbaikan":"jawaban pelajar versi benar dalam bahasa Jerman A1, ubah seminimal mungkin","alasan":"penjelasan singkat dalam bahasa Indonesia, maksimal 2 kalimat","contoh":"satu contoh jawaban lain yang wajar"}`, { modelTier: "quick", cache: false });
        el.innerHTML = `<div class="corr"><b>${r.benar ? "Jawabanmu sudah tepat." : "Perbaikan:"}</b> ${r.benar ? "" : escH(r.perbaikan || "")}<br>${escH(r.alasan || "")}${r.contoh ? `<br>Contoh lain: <span class="de">${escH(r.contoh)}</span>` : ""}</div>`;
    }
    catch (e) {
        el.innerHTML = `<p class="note">${escH(chatErr(e && e.code))}</p>`;
    }
}
function bicaraBab(b) {
    const l = L[b - 1];
    if (!l) {
        bicara();
        return;
    }
    const words = pick(l.v.filter(v => !/,/.test(v[0])), 5).map(v => ({ kind: "Kata", de: v[0].replace(/\s*\/\s*/g, " / "), pr: v[2], ar: v[1] }));
    const sents = pick(l.e.filter(e => !/[–\/]/.test(e[0])), 3).map(e => ({ kind: "Kalimat", de: e[0], ar: e[1] }));
    $("#app").innerHTML = `<a class="crumb" href="#bicara">← Speaking Lab</a><div class="lhead"><div class="st">Bab ${b} · Sprechen</div><h1>${l.t}</h1><div class="goal">Langkah 1: ucapkan 5 kata dan 3 kalimat. Langkah 2: jawab pertanyaan lisan seperti di ujian.</div></div>
  <section class="blk"><h2>1. Pengucapan</h2><div class="quiz" id="pbox"></div></section><section class="blk"><h2>2. Jawab pertanyaan</h2><div class="quiz" id="qbox"></div></section><div id="bres"></div>${SPKNOTE}<p class="note" id="micstat"></p>`;
    let pAvg = null, qAvg = null;
    const fin = () => { const parts = [pAvg, qAvg].filter(v => typeof v === "number"); if (!parts.length)
        return; const avg = Math.round(parts.reduce((a, c) => a + c, 0) / parts.length); logRes("sprechen", b, avg, "Sprechen bab " + b); markSkill(b, "Sp", avg); $("#bres").innerHTML = `<div class="sumbox"><h3>Hasil bab ${b}: ${avg}%</h3><p class="note">Pengucapan: ${pAvg !== null && pAvg !== void 0 ? pAvg : "–"}% · Jawaban: ${qAvg !== null && qAvg !== void 0 ? qAvg : "–"}%</p><div class="row"><button class="btn alt" id="brag" type="button">Ulangi latihan</button><a class="btn" href="#dialog">Lanjut ke dialog</a></div></div>`; $("#brag").addEventListener("click", () => bicaraBab(b)); };
    pronRun($("#pbox"), words.concat(sents), (avg, n) => { pAvg = avg; $("#pbox").innerHTML = `<div class="score">${avg !== null && avg !== void 0 ? avg : "–"}${avg != null ? "%" : ""}</div><p style="margin:10px 0 0">${n ? "Rata-rata pengucapan dari " + n + " item yang kamu coba." : "Kamu belum mencoba mengucapkan atau mengetik item mana pun."}</p>`; fin(); });
    qaRun($("#qbox"), SPQ[b] || [], avg => { qAvg = avg; $("#qbox").innerHTML = `<div class="score">${avg !== null && avg !== void 0 ? avg : "–"}${avg != null ? "%" : ""}</div><p style="margin:10px 0 0">${avg != null ? "Rata-rata ketepatan jawaban." : "Belum ada jawaban."}</p>`; fin(); });
    refreshMics();
}
/* ---------- Grammar Center ---------- */
function tata() {
    $("#app").innerHTML = `<div class="lhead"><h1>Grammar Center</h1><div class="goal">Semua tata bahasa A1 dalam 13 topik: penjelasan, tabel, pola kalimat, kesalahan umum, dan latihan. Pola singkat untuk diulang cepat ada di menu <a href="#pola">Pola</a>.</div></div>
  <ul class="list2">${GR.map(g => `<li><a class="card2" href="#tata-${g.id}"><b>${g.t}</b><span class="note">${g.sub}</span><span class="pill">Bab ${g.bab.join(", ")}</span> ${store.gbest[g.id] != null ? `<span class="pill ok">${store.gbest[g.id]}%</span>` : ""}</a></li>`).join("")}</ul>`;
}
function tataView(id) {
    const g = GR.find(x => x.id === id);
    if (!g) {
        tata();
        return;
    }
    const i = GR.indexOf(g);
    $("#app").innerHTML = `<a class="crumb" href="#tata">← Grammar Center</a><div class="lhead"><div class="st">Topik ${i + 1} dari ${GR.length} · dipakai di bab ${g.bab.map(b => `<a href="#b${b}">${b}</a>`).join(", ")}</div><h1>${g.t}</h1><div class="goal">${g.sub}</div></div>
  <section class="blk"><h2>Penjelasan</h2>${g.b.map(blockHTML).join("")}</section>
  <section class="blk"><h2>Kesalahan umum</h2><div class="tbl"><table><thead><tr><th>Salah</th><th>Benar</th><th>Alasan</th></tr></thead><tbody>${g.m.map(m => `<tr><td><s>${escH(m[0])}</s></td><td><span class="de">${escH(m[1])}</span></td><td>${escH(m[2])}</td></tr>`).join("")}</tbody></table></div></section>
  <section class="blk"><h2>Latihan</h2><div class="quiz" id="quiz"></div></section>
  <div class="nav">${i > 0 ? `<a class="btn alt" href="#tata-${GR[i - 1].id}">← ${GR[i - 1].t}</a>` : "<span></span>"}${i < GR.length - 1 ? `<a class="btn" href="#tata-${GR[i + 1].id}">${GR[i + 1].t} →</a>` : `<a class="btn" href="#tata">Semua topik</a>`}</div>`;
    wireSpk($("#app"));
    $("#app").querySelectorAll(".ex li").forEach(li => li.addEventListener("click", e => { if (!e.target.closest(".spk"))
        li.classList.add("show"); }));
    const items = () => shuffle(g.q).map(q => q.t === "fill" ? { type: "fill", q: q.q, ans: q.ans, alt: q.alt, y: q.y, from: g.bab[0] } : { type: "mc", q: q.q, o: q.o, y: q.y, ans: q.o[0], from: g.bab[0] });
    const start = () => runSession($("#quiz"), items(), { onFinish: pct => { store.gbest[g.id] = Math.max(store.gbest[g.id] || 0, pct); logRes("grammatik", 0, pct, "Grammar: " + g.t); return { again: start }; } });
    start();
}
/* ---------- Simulasi ujian ---------- */
let exSet = 0, exT0 = 0;
const EXSETN = ["Set 1", "Set 2", "Campuran acak"];
const OFFLBL = `<div class="tip offl"><span class="lab">Simulasi latihan mandiri</span><br>Ini bukan ujian resmi dan bukan hasil Goethe-Zertifikat atau sertifikasi lain. Soal dibuat sendiri mengikuti pembagian umum ujian A1. Nilai di sini hanya perkiraan untuk latihan.</div>`;
function exHSet() { if (exSet < 2)
    return EXH[exSet]; return EXH[0].map((p, t) => Object.assign({}, p, { items: pick(p.items.concat(EXH[1][t].items), p.items.length) })); }
function exLSet() { if (exSet < 2)
    return EXL[exSet]; const base = pick1(EXL); return EXL[0].map((p, t) => t === 0 ? base[0] : Object.assign({}, p, { items: pick(p.items.concat(EXL[1][t].items), p.items.length) })); }
function exSSet() { return exSet < 2 ? EXS[exSet] : pick1(EXS); }
const rdHref = t => { const i = RD.findIndex(r => r.t === t); return i >= 0 ? "#r" + (i + 1) : "#baca"; };
const EXREC = { H: [["Teil 1 (percakapan pendek): latih menangkap jam, harga, dan tempat.", [["#dengar-info-1", "Listening: jam"], ["#dengar-info-3", "Listening: harga"], ["#b5", "Bab 5: jam"]]], ["Teil 2 (pengumuman): dengarkan sekali dan fokus pada kata kunci seperti nicht, sondern, nur, schon.", [["#dengar-info-5", "Pengumuman stasiun"], ["#dengar-12", "Pengumuman bandara"]]], ["Teil 3 (pesan telepon): catat siapa, apa, dan kapan.", [["#dengar-5", "Pesan suara Julia"], ["#dengar-info-1", "Pesan dokter gigi"]]]],
    L: [["Teil 1 (surel dan catatan): baca pertanyaan dulu, lalu cari informasinya di teks.", [[rdHref("Ich bin krank"), "Bacaan: email"], [rdHref("Eine Nachricht von Tim"), "Bacaan: pesan"]]], ["Teil 2 (iklan): cocokkan kebutuhan dengan jam buka, harga, umur, dan hari.", [[rdHref("Speisekarte"), "Bacaan: menu"], [rdHref("Bus 12"), "Bacaan: transportasi"], [rdHref("Verkäufer gesucht"), "Bacaan: lowongan"]]], ["Teil 3 (papan informasi): perhatikan geschlossen, nur, kein, nicht, frei.", [["#tata-negation", "Negation: nicht dan kein"], [rdHref("Fahrradtour am Sonntag"), "Bacaan: pengumuman"]]]],
    S: [["Teil 1 (formulir): latih nama, tanggal, angka, dan pilihan.", [["#tulis-formulir", "Writing Lab: formulir"]]], ["Teil 2 (pesan): bahas ketiga poin, pakai sapaan dan penutup, cek posisi kata kerja.", [["#tulis-pesan", "Writing Lab: pesan dan surel"], ["#tata-satzbau", "Satzbau"]]]],
    Sp: [["Teil 1 (perkenalan): sebut semua kata kunci.", [["#bicara-kenal", "Perkenalan diri"]]], ["Teil 2 (tanya jawab): latih pertanyaan W dan ya / tidak.", [["#tata-fragen", "W-Fragen dan Ja/Nein-Fragen"], ["#bicara-1", "Jawab pertanyaan per bab"]]], ["Teil 3 (permintaan): Können Sie bitte ...? / Kannst du bitte ...?", [["#tata-modal", "Modalverben"]]]] };
function exRecsHTML(sec, per) {
    const lst = per.map((p, i) => p < 80 ? EXREC[sec][i] : null).filter(Boolean);
    return `<section class="blk"><h2>Materi yang perlu diulang</h2>${lst.length ? `<ul class="recs">${lst.map(([t, ls]) => `<li>${t} ${ls.map(([h, n]) => `<a href="${h}">${n}</a>`).join(" · ")}</li>`).join("")}</ul>` : `<p class="note">Semua bagian mencapai 80% atau lebih. Pertahankan dengan latihan rutin.</p>`}</section>`;
}
function exUsed() { const s = Math.round((Date.now() - exT0) / 1000); return Math.floor(s / 60) + " menit " + (s % 60) + " detik"; }
const EXSEC = [["H", "Hören", "#tes-hoeren", 20, "3 bagian: percakapan pendek, pengumuman, pesan telepon. 15 soal."], ["L", "Lesen", "#tes-lesen", 25, "3 bagian: surel/catatan, iklan, papan informasi. 15 soal."], ["S", "Schreiben", "#tes-schreiben", 20, "2 bagian: mengisi formulir dan menulis pesan sekitar 30 kata."], ["Sp", "Sprechen", "#tes-sprechen", 15, "3 bagian: perkenalan diri, tanya jawab dengan kartu, permintaan."]];
const lastEx = s => store.ex4.filter(e => e.sec === s).slice(-1)[0];
function evalLevel(p) { return p >= 80 ? ["Siap ujian", "ok"] : p >= 60 ? ["Hampir siap", "ok"] : ["Perlu latihan", ""]; }
function tes() {
    const lt = EXSEC.map(([s]) => lastEx(s)), done = lt.filter(Boolean);
    const avg = done.length ? Math.round(done.reduce((a, e) => a + e.pct, 0) / done.length) : null;
    const weak = done.length ? EXSEC.filter((x, i) => lt[i]).sort((a, b) => lastEx(a[0]).pct - lastEx(b[0]).pct)[0] : null;
    $("#app").innerHTML = `<div class="lhead"><h1>Simulasi ujian A1</h1><div class="goal">Empat bagian terpisah yang mengikuti pembagian umum ujian A1 seperti Goethe-Zertifikat A1 dan telc Deutsch A1, dengan waktu seperti ujian tertulis dan lisan: Hören sekitar 20 menit, Lesen 25 menit, Schreiben 20 menit, dan Sprechen sekitar 15 menit. Soal dibuat sendiri untuk latihan, bukan soal resmi. Cek format, biaya, dan nilai lulus terbaru langsung ke penyelenggara ujianmu (misalnya Goethe-Institut).</div></div>
  ${OFFLBL}<div class="tools"><label>Set soal: <select class="sel" id="exs">${[0, 1, 2].map(i => `<option value="${i}" ${exSet === i ? "selected" : ""}>${EXSETN[i]}</option>`).join("")}</select></label><span>“Campuran acak” mengambil soal dari kedua set. Bagian Sprechen selalu memakai kartu acak.</span></div>
  <ul class="list2">${EXSEC.map(([s, n, h, m, d], i) => { const e = lt[i]; return `<li><a class="card2" href="${h}"><b>${n}</b><span class="note">${d}</span><span class="pill">${m} menit</span> ${e ? `<span class="pill ${e.pct >= 60 ? "ok" : ""}">Terakhir ${e.pct}%</span>` : ""}</a></li>`; }).join("")}</ul>
  <section class="blk"><h2>Evaluasi kemampuan per keterampilan</h2>${done.length ? `<div class="stats">${EXSEC.map(([s, n], i) => { const e = lt[i]; return `<div class="stat"><b>${e ? e.pct + "%" : "–"}</b><span>${n}${e ? " · " + evalLevel(e.pct)[0] : ""}</span></div>`; }).join("")}</div><p>${done.length < 4 ? "Selesaikan keempat bagian untuk evaluasi lengkap. " : ""}Rata-rata: <b>${avg}%</b> (${evalLevel(avg)[0]}). ${weak && lastEx(weak[0]).pct < 80 ? `Bagian terlemah: <b>${weak[1]}</b>. Latih di <a href="${{ H: "#dengar", L: "#baca", S: "#tulis", Sp: "#bicara" }[weak[0]]}">${{ H: "Listening Lab", L: "Bacaan", S: "Writing Lab", Sp: "Speaking Lab" }[weak[0]]}</a>.` : "Semua bagian sudah kuat. Pertahankan dengan latihan rutin."}</p><p class="note">Patokan latihan: 60% per bagian = cukup, 80% = siap. Patokan resmi bisa berbeda.</p>` : `<p class="note">Belum ada hasil. Mulai dari bagian mana saja.</p>`}</section>
  <section class="blk"><h2>Tes penempatan</h2><p class="note" style="margin-top:0">Untuk mengetahui bab mana yang sebaiknya kamu pelajari dulu.${store.placement ? " Hasil terakhir: " + store.placement.pct + "%, mulai bab " + Math.min(store.placement.start, 12) + "." : ""}</p><a class="btn alt" href="#penempatan">${store.placement ? "Ulangi" : "Mulai"} tes penempatan</a></section>
  <section class="blk"><h2>Tes campuran cepat</h2><p class="note" style="margin-top:0">20 soal pilihan ganda kosakata dan tata bahasa dari bab 1 sampai 12, 20 menit.</p><a class="btn alt" href="#tes-cepat">Mulai tes cepat</a></section>
  ${store.ex4.length ? `<section class="blk"><h2>Riwayat simulasi</h2><ul class="hist">${store.ex4.slice(-10).reverse().map(e => `<li>${new Date(e.d).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} · ${SKILL[e.sec]} (${(EXSETN[e.set] || "set").toLowerCase()}): ${e.pts}/${e.max} (${e.pct}%)</li>`).join("")}</ul></section>` : ""}`;
    $("#exs").addEventListener("change", e => { exSet = +e.target.value; });
}
function exTimer(el, sec, onEnd) {
    if (activeTimer) {
        clearInterval(activeTimer);
        activeTimer = null;
    }
    exT0 = Date.now();
    let left = sec;
    const tick = () => { el.textContent = "Sisa waktu " + Math.floor(left / 60) + ":" + String(left % 60).padStart(2, "0"); el.classList.toggle("warn", left <= 60); };
    tick();
    activeTimer = setInterval(() => { left--; tick(); if (left <= 0) {
        clearInterval(activeTimer);
        activeTimer = null;
        onEnd(true);
    } }, 1000);
}
function exStop() { if (activeTimer) {
    clearInterval(activeTimer);
    activeTimer = null;
} AU.stop(); if (Mic.active)
    Mic.stop(); }
function exSave(sec, pts, max, detail) { const pct = Math.round(pts / max * 100); store.ex4.push({ d: Date.now(), sec, set: exSet, pts: Math.round(pts * 10) / 10, max, pct, detail }); if (store.ex4.length > 60)
    store.ex4 = store.ex4.slice(-60); logRes("ujian-" + sec, 0, pct, "Simulasi " + SKILL[sec] + " set " + (exSet + 1)); return pct; }
function exIntro(title, min, parts, extra, onStart) {
    $("#app").innerHTML = `<a class="crumb" href="#tes">← Simulasi ujian</a><div class="lhead"><div class="st">Simulasi latihan A1 · ${EXSETN[exSet]}</div><h1>${title}</h1><div class="goal">Waktu: ${min} menit. Timer mulai saat kamu menekan tombol Mulai dan tidak bisa dijeda. Jawaban dinilai saat kamu menekan “Selesai dan nilai” atau saat waktu habis; pembahasan muncul setelahnya. Selama simulasi jangan pindah ke menu lain, karena jawabanmu akan hilang.</div></div>${OFFLBL}
  <div class="tbl"><table><thead><tr><th>Bagian</th><th>Instruksi</th><th>Poin</th></tr></thead><tbody>${parts.map(p => `<tr><td>${p[0]}</td><td>${p[1]}${p[3] ? `<br><span class="note"><i>${p[3]}</i></span>` : ""}</td><td>${p[2]}</td></tr>`).join("")}</tbody></table></div>${extra || ""}
  <div class="row"><button class="btn" id="exgo" type="button">Mulai ${title}</button></div>`;
    $("#exgo").addEventListener("click", onStart);
}
function rfBtns(sel, name) { return `<div class="opts rf">${["Benar", "Salah"].map(v => `<button class="opt ${sel === v ? "pick" : ""}" data-${name}="${v}" type="button" aria-pressed="${sel === v}">${v}</button>`).join("")}</div>`; }
/* Hören */
function tesHoeren() {
    const set = exHSet();
    const flat = [];
    set.forEach((p, pi) => p.items.forEach((it, ii) => flat.push({ p, it, ii, ans: null, plays: 0, ord: it.o ? shuffle(it.o) : null })));
    exIntro("Hören", 20, set.map(p => [p.h, p.ins, p.items.length, p.de]), `<p class="note">${audioNote()} Atur kecepatan ke 1× agar mirip ujian.</p><div class="tools">${audioCtl()}</div>`, () => { run(); });
    wireAudioCtl($("#app"));
    let i = 0, finished = false;
    function run() { $("#app").innerHTML = `<a class="crumb" href="#tes">← Simulasi ujian</a><div class="lhead"><h1>Hören</h1></div><div class="chip timer" id="extm"></div><div class="quiz" id="exb"></div>`; exTimer($("#extm"), 1200, () => finish(true)); draw(); }
    function draw() {
        const x = flat[i], left = x.p.plays - x.plays, na = !hasAudio();
        const answered = flat.filter(f => f.ans != null).length;
        $("#exb").innerHTML = `<div class="qmeta"><span>${x.p.h} · soal ${x.ii + 1} dari ${x.p.items.length}</span><span>Terjawab ${answered}/${flat.length}</span></div><p class="note" style="margin-top:0">${x.p.ins}<br><i>${x.p.de || ""}</i></p>
    ${na ? `<div class="paper">${x.it.l.map(([s, t]) => `${s === "N" ? "" : s + ": "}${escH(t)}`).join("<br>")}</div><p class="note">Audio tidak tersedia di perangkat ini, jadi transkrip ditampilkan.</p>` : `<div class="row" style="margin-top:0"><button class="btn" id="xp" type="button" ${left <= 0 ? "disabled" : ""}>${left > 0 ? "Putar audio (sisa " + left + "×)" : "Audio sudah diputar"}</button><button class="btn alt" id="xs" type="button">Berhenti</button></div>`}
    <div class="qtext" style="margin-top:12px">${escH(x.it.q)}</div>${x.it.rf != null ? rfBtns(x.ans, "a") : `<div class="opts">${x.ord.map(o => `<button class="opt ${x.ans === o ? "pick" : ""}" data-a="${esc(o)}" type="button" aria-pressed="${x.ans === o}">${escH(o)}</button>`).join("")}</div>`}
    <div class="row" id="xnav"><button class="btn alt" id="xprev" type="button" ${i === 0 ? "disabled" : ""}>← Sebelumnya</button>${i < flat.length - 1 ? `<button class="btn" id="xnext" type="button">Berikutnya →</button>` : ""}<button class="btn ${i === flat.length - 1 ? "" : "alt"}" id="xfin" type="button">Selesai dan nilai</button></div><div class="dots">${flat.map((f, j) => `<button class="dot ${f.ans != null ? "a" : ""} ${j === i ? "c" : ""}" data-j="${j}" type="button" aria-label="Soal ${j + 1}"></button>`).join("")}</div>`;
        const b = $("#exb");
        if (!na) {
            b.querySelector("#xp").addEventListener("click", () => { if (x.plays >= x.p.plays)
                return; x.plays++; AU.play(x.it.l.map(([s, t]) => ({ s, t })), { onEnd: () => { } }); draw(); });
            b.querySelector("#xs").addEventListener("click", () => AU.stop());
        }
        b.querySelectorAll("[data-a]").forEach(o => o.addEventListener("click", () => { x.ans = o.dataset.a; draw(); }));
        b.querySelector("#xprev").addEventListener("click", () => { AU.stop(); i--; draw(); });
        const nx = b.querySelector("#xnext");
        if (nx)
            nx.addEventListener("click", () => { AU.stop(); i++; draw(); });
        b.querySelectorAll("[data-j]").forEach(d => d.addEventListener("click", () => { AU.stop(); i = +d.dataset.j; draw(); }));
        b.querySelector("#xfin").addEventListener("click", () => { const un = flat.filter(f => f.ans == null).length; if (un && !b.querySelector("#xconf")) {
            b.querySelector("#xnav").insertAdjacentHTML("afterend", `<div class="fb no" id="xconf"><b>${un} soal belum dijawab.</b>Tekan “Selesai dan nilai” sekali lagi untuk tetap menilai.</div>`);
            return;
        } finish(false); });
    }
    function finish(timeUp) {
        if (finished)
            return;
        finished = true;
        exStop();
        const ok = f => f.it.rf != null ? f.ans === (f.it.rf ? "Benar" : "Salah") : f.ans === f.it.o[0];
        const pts = flat.filter(ok).length, per = set.map(p => Math.round(flat.filter(f => f.p === p && ok(f)).length / p.items.length * 100)), pct = exSave("H", pts, flat.length, set.map(p => flat.filter(f => f.p === p && ok(f)).length + "/" + p.items.length).join(" · "));
        const lv = evalLevel(pct);
        $("#app").innerHTML = `<a class="crumb" href="#tes">← Simulasi ujian</a><div class="lhead"><h1>Hasil Hören</h1>${timeUp ? `<div class="goal">Waktu habis. Soal yang belum dijawab dihitung salah.</div>` : ""}</div>
    <div class="quiz"><div class="score">${pts}/${flat.length}</div><p style="margin:10px 0 0"><b>${pct}%</b> · <span class="pill ${lv[1]}">${lv[0]}</span></p><div class="stats">${set.map(p => `<div class="stat"><b>${flat.filter(f => f.p === p && ok(f)).length}/${p.items.length}</b><span>${p.h}</span></div>`).join("")}</div>
    <p class="note">${pct >= 80 ? "Pendengaranmu sudah kuat. Pertahankan dengan kecepatan 1×." : pct >= 60 ? "Cukup. Ulangi soal yang salah dan dengarkan lagi transkripnya." : "Perlu latihan. Mulai di Listening Lab dengan kecepatan pelan, lalu naikkan bertahap."}</p>
    <p class="note">Waktu terpakai: ${exUsed()}.</p><div class="row"><a class="btn" href="#dengar">Ke Listening Lab</a><button class="btn alt" id="xre" type="button">Ulangi simulasi</button></div></div>${OFFLBL}${exRecsHTML("H", per)}
    <section class="blk"><h2>Pembahasan</h2>${flat.map((f, j) => { var _a; return `<div class="rv"><b>${j + 1}. ${escH(f.it.q)}</b> ${ok(f) ? `<span class="pill ok">Benar</span>` : `<span class="pill">Salah</span>`}<br>Jawabanmu: ${escH((_a = f.ans) !== null && _a !== void 0 ? _a : "(kosong)")} · Jawaban benar: <b>${escH(f.it.rf != null ? (f.it.rf ? "Benar" : "Salah") : f.it.o[0])}</b><br><span class="note">${escH(f.it.y)}</span><details class="rev"><summary>Transkrip</summary>${f.it.l.map(([s, t]) => `<div><button class="spk sm" data-say="${esc(t)}" aria-label="Dengar">${SPK}</button> ${s === "N" ? "" : "<b>" + s + ":</b> "}${escH(t)}</div>`).join("")}</details></div>`; }).join("")}</section>`;
        wireSpk($("#app"));
        $("#xre").addEventListener("click", tesHoeren);
    }
}
/* Lesen */
function tesLesen() {
    const set = exLSet();
    let t = 0, finished = false;
    const ans = set.map(p => p.items.map(() => null));
    exIntro("Lesen", 25, set.map(p => [p.h, p.ins, p.items.length, p.de]), "", () => {
        $("#app").innerHTML = `<a class="crumb" href="#tes">← Simulasi ujian</a><div class="lhead"><h1>Lesen</h1></div><div class="chip timer" id="extm"></div><div class="seg" id="exteil">${set.map((p, i) => `<button data-t="${i}" aria-pressed="${i === 0}" type="button">Teil ${i + 1}</button>`).join("")}</div><div class="quiz" id="exb"></div>`;
        exTimer($("#extm"), 1500, () => finish(true));
        $("#exteil").querySelectorAll("button").forEach(b => b.addEventListener("click", () => { t = +b.dataset.t; draw(); }));
        draw();
    });
    function draw() {
        const p = set[t];
        $("#exteil").querySelectorAll("button").forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.t === t)));
        $("#exb").innerHTML = `<div class="qmeta"><span>${p.h}</span><span>Terjawab ${ans.flat().filter(a => a != null).length}/${ans.flat().length}</span></div><p class="note" style="margin-top:0">${p.ins}<br><i>${p.de || ""}</i></p>${p.texts ? p.texts.map(x => `<div class="paper"><span class="pill">${x.h}</span><br>${escH(x.x).replace(/\n/g, "<br>")}</div>`).join("") : ""}
    ${p.items.map((it, j) => `<div class="exq">${it.sign ? `<div class="sign">${escH(it.sign).replace(/\n/g, "<br>")}</div>` : ""}<div class="qtext">${t * 5 + j + 1}. ${escH(it.q)}</div>${it.c ? `<div class="opts ad">${["a", "b"].map(k => `<button class="opt ${ans[t][j] === k ? "pick" : ""}" data-j="${j}" data-v="${k}" type="button" aria-pressed="${ans[t][j] === k}"><b>${k}</b> ${escH(it[k])}</button>`).join("")}</div>` : `<div class="opts rf">${["Benar", "Salah"].map(v => `<button class="opt ${ans[t][j] === v ? "pick" : ""}" data-j="${j}" data-v="${v}" type="button" aria-pressed="${ans[t][j] === v}">${v}</button>`).join("")}</div>`}</div>`).join("")}
    <div class="row">${t > 0 ? `<button class="btn alt" id="lp" type="button">← Teil ${t}</button>` : ""}${t < set.length - 1 ? `<button class="btn" id="ln" type="button">Teil ${t + 2} →</button>` : ""}<button class="btn ${t === set.length - 1 ? "" : "alt"}" id="lf" type="button">Selesai dan nilai</button></div>`;
        const b = $("#exb");
        b.querySelectorAll("[data-v]").forEach(o => o.addEventListener("click", () => { ans[t][+o.dataset.j] = o.dataset.v; const y = window.scrollY; draw(); window.scrollTo(0, y); }));
        const lp = b.querySelector("#lp");
        if (lp)
            lp.addEventListener("click", () => { t--; draw(); window.scrollTo(0, 0); });
        const ln = b.querySelector("#ln");
        if (ln)
            ln.addEventListener("click", () => { t++; draw(); window.scrollTo(0, 0); });
        b.querySelector("#lf").addEventListener("click", () => { const un = ans.flat().filter(a => a == null).length; if (un && !b.querySelector("#xconf")) {
            b.querySelector("#lf").parentNode.insertAdjacentHTML("afterend", `<div class="fb no" id="xconf"><b>${un} soal belum dijawab.</b>Tekan sekali lagi untuk tetap menilai.</div>`);
            return;
        } finish(false); });
    }
    function finish(timeUp) {
        if (finished)
            return;
        finished = true;
        exStop();
        const corr = (it) => it.c ? it.c : (it.rf ? "Benar" : "Salah");
        let pts = 0;
        const per = set.map((p, i) => { const n = p.items.filter((it, j) => ans[i][j] === corr(it)).length; pts += n; return n; });
        const max = ans.flat().length, pct = exSave("L", pts, max, per.map((n, i) => n + "/" + set[i].items.length).join(" · ")), lv = evalLevel(pct);
        $("#app").innerHTML = `<a class="crumb" href="#tes">← Simulasi ujian</a><div class="lhead"><h1>Hasil Lesen</h1>${timeUp ? `<div class="goal">Waktu habis. Soal yang belum dijawab dihitung salah.</div>` : ""}</div>
    <div class="quiz"><div class="score">${pts}/${max}</div><p style="margin:10px 0 0"><b>${pct}%</b> · <span class="pill ${lv[1]}">${lv[0]}</span></p><div class="stats">${set.map((p, i) => `<div class="stat"><b>${per[i]}/${p.items.length}</b><span>${p.h}</span></div>`).join("")}</div><p class="note">${pct >= 80 ? "Pemahaman bacaanmu sudah kuat." : pct >= 60 ? "Cukup. Perhatikan kata kunci seperti nicht, kein, nur, erst, geschlossen." : "Perlu latihan. Baca teks di menu Baca dan perhatikan kata kunci waktu, tempat, dan negasi."}</p><p class="note">Waktu terpakai: ${exUsed()}.</p><div class="row"><a class="btn" href="#baca">Ke Bacaan</a><button class="btn alt" id="xre" type="button">Ulangi simulasi</button></div></div>${OFFLBL}${exRecsHTML("L", per.map((n, i) => Math.round(n / set[i].items.length * 100)))}
    <section class="blk"><h2>Pembahasan</h2>${set.map((p, i) => `<h3 class="subh">${p.h}</h3>${p.items.map((it, j) => { var _a; const ok = ans[i][j] === corr(it); return `<div class="rv"><b>${escH(it.q)}</b> ${ok ? `<span class="pill ok">Benar</span>` : `<span class="pill">Salah</span>`}<br>${it.sign ? `<span class="note">Papan: ${escH(it.sign.replace(/\n/g, " · "))}</span><br>` : ""}Jawabanmu: ${escH((_a = ans[i][j]) !== null && _a !== void 0 ? _a : "(kosong)")} · Jawaban benar: <b>${escH(corr(it))}</b>${it.c ? ` (${escH(it[it.c])})` : ""}<br><span class="note">${escH(it.y)}</span></div>`; }).join("")}`).join("")}</section>`;
        $("#xre").addEventListener("click", tesLesen);
    }
}
/* Schreiben */
function scoreMsg10(text, task) { const r = rubric(text, task), lang = (r.C[1].s + r.C[2].s + r.C[3].s + r.C[4].s) / 4, content = r.C[0].s / 100 * 6, langp = lang / 100 * 4; return { r, pts: Math.round((content + langp) * 2) / 2, content: Math.round(content * 10) / 10, lang: Math.round(langp * 10) / 10 }; }
function tesSchreiben() {
    const S = exSSet();
    let finished = false;
    exIntro("Schreiben", 20, [["Teil 1: Formulir", S.form.ins, 5, S.form.de], ["Teil 2: Pesan", S.msg.task, 10, S.msg.de]], "", () => {
        $("#app").innerHTML = `<a class="crumb" href="#tes">← Simulasi ujian</a><div class="lhead"><h1>Schreiben</h1></div><div class="chip timer" id="extm"></div>
    <div class="quiz"><div class="qmeta"><span>Teil 1: Formulir</span><span>5 poin</span></div><p class="note" style="margin-top:0">${S.form.ins}<br><i>${S.form.de || ""}</i></p><div class="paper">${escH(S.form.text)}</div><h3 style="margin:12px 0 8px">${S.form.title}</h3>${formHTML(S.form.f, S.form.given)}</div>
    <div class="quiz" style="margin-top:16px"><div class="qmeta"><span>Teil 2: Pesan</span><span>10 poin</span></div><div class="goal" style="margin-top:0">${escH(S.msg.task)}<br><span class="note"><i>${S.msg.de || ""}</i></span></div><textarea class="inp ta" id="exw" rows="8" spellcheck="false" aria-label="Pesanmu"></textarea>${UMLAUT}<p class="note" id="exwc">0 kata</p></div>
    <div class="row"><button class="btn" id="exf" type="button">Selesai dan nilai</button></div>`;
        const ta = $("#exw");
        wireUml($("#app"), ta);
        ta.addEventListener("input", () => { $("#exwc").textContent = wordsOf(ta.value).length + " kata"; });
        exTimer($("#extm"), 1200, () => finish(true));
        $("#exf").addEventListener("click", () => finish(false));
    });
    function finish(timeUp) {
        if (finished)
            return;
        finished = true;
        exStop();
        const app = $("#app"), fOK = formCheck(app, S.form.f);
        app.querySelectorAll(".form input[data-f]").forEach(x => { if (x.type === "checkbox")
            x.toggleAttribute("checked", x.checked);
        else
            x.setAttribute("value", x.value); });
        app.querySelectorAll(".form select[data-f]").forEach(sl => sl.querySelectorAll("option").forEach(o => o.toggleAttribute("selected", o.value === sl.value)));
        const fRes = app.querySelector(".form").outerHTML, text = $("#exw").value, m = text.trim() ? scoreMsg10(text, S.msg) : null;
        const pts = fOK + (m ? m.pts : 0), pct = exSave("S", pts, 15, "Formulir " + fOK + "/5 · Pesan " + (m ? m.pts : 0) + "/10"), lv = evalLevel(pct);
        app.innerHTML = `<a class="crumb" href="#tes">← Simulasi ujian</a><div class="lhead"><h1>Hasil Schreiben</h1>${timeUp ? `<div class="goal">Waktu habis. Jawaban dinilai apa adanya.</div>` : ""}</div>
    <div class="quiz"><div class="score">${pts}/15</div><p style="margin:10px 0 0"><b>${pct}%</b> · <span class="pill ${lv[1]}">${lv[0]}</span></p><div class="stats"><div class="stat"><b>${fOK}/5</b><span>Teil 1: Formulir</span></div><div class="stat"><b>${m ? m.pts : 0}/10</b><span>Teil 2: Pesan</span></div></div><p class="note">Waktu terpakai: ${exUsed()}.</p><div class="row"><a class="btn" href="#tulis">Ke Writing Lab</a><button class="btn alt" id="xre" type="button">Ulangi simulasi</button></div></div>${OFFLBL}${exRecsHTML("S", [fOK / 5 * 100, (m ? m.pts : 0) / 10 * 100])}
    <section class="blk"><h2>Pembahasan Teil 1</h2><div class="quiz">${fRes}</div></section>
    <section class="blk"><h2>Pembahasan Teil 2</h2>${m ? `<div class="paper">${escH(text).replace(/\n/g, "<br>")}</div><p class="note">Rincian poin: isi ${m.content}/6 · bahasa, kosakata, ejaan, dan struktur ${m.lang}/4 (dihitung dari rubrik di bawah).</p>${freeReport(m.r, S.msg)}${SAMPLE ? `<div class="row"><button class="btn alt" id="xcl" type="button">Koreksi dengan Claude</button></div><div id="xclr"></div>` : ""}` : `<p class="note">Teil 2 tidak diisi.</p>`}<div class="sumbox"><h3>Contoh jawaban</h3><p class="de">${escH(S.msg.model)}</p>${S.msg.modelId ? `<p class="note">Artinya: ${escH(S.msg.modelId)}</p>` : ""}</div></section>`;
        app.querySelectorAll(".form [data-f]").forEach(x => x.disabled = true);
        $("#xre").addEventListener("click", tesSchreiben);
        const xc = $("#xcl");
        if (xc)
            xc.addEventListener("click", () => claudeWriting($("#xclr"), S.msg, text));
    }
}
/* Sprechen */
function isQuestion(t) {
    if (/\?\s*$/.test(t.trim()))
        return true;
    const f = (normA(t).replace(/[^a-z0-9\s-]/g, " ").trim().split(/\s+/)[0]) || "";
    return /^(wer|wen|wem|was|wo|woher|wohin|wann|wie|warum|welche|welcher|welches|welchen)$/.test(f) || /^(hast|bist|kannst|magst|moechtest|isst|trinkst|gehst|kochst|spielst|machst|faehrst|wohnst|kaufst|liest|siehst|arbeitest|hoerst|kommst|stehst|lernst|treibst|hat|ist|gibt|kann|haben|sind|essen|trinken|gehen|kochen|spielen|machen|fahren|wohnen|kaufen|lesen|sehen|arbeiten|hoeren|kommen|moegen|moechten|koennen|stehen|treiben|lernen)$/.test(f);
}
function tesSprechen() {
    const th = pick(EXSP.themes, 2), cards = th.flatMap(x => pick(x.cards, 2).map(c => Object.assign({ theme: x.t }, c))), reqs = pick(EXSP.requests, 4);
    const steps = [{ k: "intro" }, { k: "num" }].concat(cards.flatMap(c => [{ k: "cq", c }, { k: "ca", c }])).concat(reqs.map(r => ({ k: "rq", r })));
    let i = 0, finished = false;
    const res = [];
    exIntro("Sprechen", 15, [["Teil 1: Perkenalan diri", "Perkenalkan dirimu dengan kata kunci: Name, Alter, Land, Wohnort, Sprachen, Beruf, Hobby. Lalu sebutkan nomor telepon.", 8, "Stellen Sie sich vor."], ["Teil 2: Tanya jawab", "Kamu mendapat kartu kata. Buat pertanyaan dengan kata itu, lalu jawab pertanyaan penguji.", 8, "Fragen und antworten Sie."], ["Teil 3: Permintaan", "Kamu mendapat situasi. Ucapkan permintaan yang sopan.", 8, "Bitten Sie und reagieren Sie."]], SPKNOTE + `<p class="note" id="micstat"></p>`, () => {
        $("#app").innerHTML = `<a class="crumb" href="#tes">← Simulasi ujian</a><div class="lhead"><h1>Sprechen</h1></div><div class="chip timer" id="extm"></div><div class="quiz" id="exb"></div><p class="note" id="micstat"></p>`;
        exTimer($("#extm"), 900, () => finish(true));
        draw();
    });
    refreshMics();
    function draw() {
        const s = steps[i], b = $("#exb");
        const teil = s.k === "intro" || s.k === "num" ? "Teil 1" : s.k === "rq" ? "Teil 3" : "Teil 2";
        let body = "";
        if (s.k === "intro")
            body = `<div class="qtext">Stellen Sie sich vor.</div><p class="note">Perkenalkan dirimu dalam 5 sampai 7 kalimat.</p><div class="sugs">${EXSP.intro.keys.map(k => `<span class="chipk">${k[0]}?</span>`).join("")}</div>`;
        if (s.k === "num")
            body = `<div class="qtext">Wie ist Ihre Telefonnummer?</div><p class="note">${EXSP.intro.num}</p>`;
        if (s.k === "cq")
            body = `<div class="qtext">Thema: ${escH(s.c.theme)}</div><div class="sign big">${escH(s.c.w)}</div><p class="note">Buat <b>pertanyaan</b> untuk pasanganmu dengan kata ini.</p>`;
        if (s.k === "ca")
            body = `<div class="qtext">Penguji bertanya: “${escH(s.c.a)}”</div><div class="row" style="margin:0 0 8px"><button class="btn alt" id="sh" type="button">Dengar pertanyaan</button></div><p class="note">Jawab dengan kalimat lengkap.</p>`;
        if (s.k === "rq")
            body = `<div class="sign big">${escH(s.r.w)}</div><p>${escH(s.r.d)}</p><p class="note">Ucapkan permintaan yang sopan, misalnya dengan Können Sie bitte ... / Kannst du bitte ...</p>`;
        b.innerHTML = `<div class="qmeta"><span>${teil}</span><span>Langkah ${i + 1} dari ${steps.length}</span></div>${body}<div id="sa"></div><div id="sr" aria-live="polite"></div><div class="row"><button class="btn alt" id="sskip" type="button">${i < steps.length - 1 ? "Lewati" : "Selesai dan nilai"}</button></div>`;
        const sh = b.querySelector("#sh");
        if (sh)
            sh.addEventListener("click", () => speak(s.c.a));
        answerBox(b.querySelector("#sa"), { multi: s.k === "intro", btn: "Simpan jawaban", ph: s.k === "intro" ? "Atau ketik perkenalanmu di sini" : "Atau ketik jawabanmu", onSubmit: t => { const my = i; res[i] = t; b.querySelector("#sr").innerHTML = `<p class="note">Jawaban tersimpan: “${escH(t)}”</p>`; setTimeout(() => { if (finished || i !== my)
                return; if (i < steps.length - 1) {
                i++;
                draw();
            }
            else
                finish(false); }, 700); } });
        b.querySelector("#sskip").addEventListener("click", () => { if (Mic.active)
            Mic.stop(); if (i < steps.length - 1) {
            i++;
            draw();
        }
        else
            finish(false); });
    }
    function finish(timeUp) {
        if (finished)
            return;
        finished = true;
        exStop();
        const out = steps.map((s, j) => {
            const t = res[j] || "", n = normA(t);
            let p = 0, max = 0, notes = [], model = "";
            if (s.k === "intro") {
                max = 7;
                EXSP.intro.keys.forEach(([lab, re]) => { const ok = new RegExp(re).test(n); if (ok)
                    p++; notes.push((ok ? "✓ " : "✗ ") + lab); });
                model = "Ich heiße Rina. Ich bin 22 Jahre alt. Ich komme aus Indonesien und wohne in Bandung. Ich spreche Indonesisch, Englisch und ein bisschen Deutsch. Ich bin Studentin. Mein Hobby ist Lesen.";
            }
            if (s.k === "num") {
                max = 1;
                const digits = (t.match(/\d/g) || []).length, words = (n.match(/\b(null|eins|zwei|drei|vier|fuenf|sechs|sieben|acht|neun)\b/g) || []).length;
                p = digits + words >= 5 ? 1 : 0;
                notes.push(p ? "✓ nomor disebutkan" : "✗ sebutkan minimal 5 angka");
                model = "Meine Telefonnummer ist null eins sieben sechs, zwei drei vier, fünf sechs sieben.";
            }
            if (s.k === "cq") {
                max = 1;
                const stem = normA(s.c.w).slice(0, 5), hasW = n.includes(stem), q = isQuestion(t);
                p = (hasW ? 0.5 : 0) + (q ? 0.5 : 0);
                notes.push((hasW ? "✓" : "✗") + " memakai kata “" + s.c.w + "”");
                notes.push((q ? "✓" : "✗") + " berbentuk pertanyaan");
                model = s.c.a;
            }
            if (s.k === "ca") {
                max = 1;
                const w = wordsOf(t).length;
                p = w >= 3 && /\b(ich|mein|meine|ja|nein|wir)\b/.test(n) ? 1 : w >= 2 ? 0.5 : 0;
                notes.push((w >= 3 ? "✓" : "✗") + " kalimat lengkap (minimal 3 kata)");
                model = "Jawaban bebas, misalnya kalimat dengan ich + kata kerja.";
            }
            if (s.k === "rq") {
                max = 2;
                const form = /(koennen sie|kannst du|koenntest du|koennten sie|kann ich|darf ich|bitte|ich moechte|haben sie|hast du)/.test(n), kw = new RegExp(s.r.k).test(n);
                p = (form ? 1 : 0) + (kw ? 1 : 0);
                notes.push((form ? "✓" : "✗") + " bentuk permintaan sopan");
                notes.push((kw ? "✓" : "✗") + " menyebut “" + s.r.w + "”");
                model = s.r.m;
            }
            return { s, t, p, max, notes, model };
        });
        const t1 = out.filter(o => o.s.k === "intro" || o.s.k === "num"), t2 = out.filter(o => o.s.k === "cq" || o.s.k === "ca"), t3 = out.filter(o => o.s.k === "rq");
        const sum = a => a.reduce((x, o) => x + o.p, 0), pts = sum(out), max = out.reduce((x, o) => x + o.max, 0);
        const pct = exSave("Sp", pts, max, "Teil 1 " + sum(t1) + "/8 · Teil 2 " + sum(t2) + "/8 · Teil 3 " + sum(t3) + "/8"), lv = evalLevel(pct);
        $("#app").innerHTML = `<a class="crumb" href="#tes">← Simulasi ujian</a><div class="lhead"><h1>Hasil Sprechen</h1>${timeUp ? `<div class="goal">Waktu habis. Langkah yang belum dijawab dihitung 0.</div>` : ""}</div>
    <div class="quiz"><div class="score">${Math.round(pts * 10) / 10}/${max}</div><p style="margin:10px 0 0"><b>${pct}%</b> · <span class="pill ${lv[1]}">${lv[0]}</span></p><div class="stats"><div class="stat"><b>${sum(t1)}/8</b><span>Teil 1: Perkenalan</span></div><div class="stat"><b>${sum(t2)}/8</b><span>Teil 2: Tanya jawab</span></div><div class="stat"><b>${sum(t3)}/8</b><span>Teil 3: Permintaan</span></div></div><p class="note">Nilai dihitung dari isi jawaban yang dikenali (kata kunci, bentuk pertanyaan, bentuk permintaan), bukan dari aksen atau kelancaran. Penguji sungguhan juga menilai pengucapan dan kelancaran.</p><p class="note">Waktu terpakai: ${exUsed()}.</p><div class="row"><a class="btn" href="#bicara">Ke Speaking Lab</a><button class="btn alt" id="xre" type="button">Ulangi dengan kartu baru</button></div></div>${OFFLBL}${exRecsHTML("Sp", [sum(t1) / 8 * 100, sum(t2) / 8 * 100, sum(t3) / 8 * 100])}
    <section class="blk"><h2>Pembahasan</h2>${out.map((o, j) => `<div class="rv"><b>${j + 1}. ${o.s.k === "intro" ? "Perkenalan diri" : o.s.k === "num" ? "Nomor telepon" : o.s.k === "cq" ? "Pertanyaan dengan kata “" + escH(o.s.c.w) + "”" : o.s.k === "ca" ? "Jawaban: " + escH(o.s.c.a) : "Permintaan: " + escH(o.s.r.d)}</b> <span class="pill ${o.p >= o.max ? "ok" : ""}">${o.p}/${o.max}</span><br>Jawabanmu: ${o.t ? "“" + escH(o.t) + "”" : "(kosong)"}<br><span class="note">${o.notes.map(escH).join(" · ")}</span><br>Contoh: <span class="de">${escH(o.model)}</span></div>`).join("")}</section>`;
        $("#xre").addEventListener("click", tesSprechen);
    }
}
/* ---------- Dashboard ---------- */
function spark(vals) { if (vals.length < 2)
    return ""; const w = 120, h = 34, xs = vals.map((v, i) => (i / (vals.length - 1) * w).toFixed(1) + "," + (h - 2 - v / 100 * (h - 4)).toFixed(1)).join(" "); return `<svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline points="${xs}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`; }
function skillStats() { const o = {}; Object.keys(SKILL).forEach(s => { const vals = store.log.filter(e => e.p != null && KIND[e.k] && KIND[e.k][1] === s).map(e => e.p); const last = vals.slice(-5); o[s] = { n: vals.length, avg: last.length ? Math.round(last.reduce((a, b) => a + b, 0) / last.length) : null, vals: vals.slice(-10) }; }); return o; }
function chapterProg(k) { const l = L[k - 1], keys = l.v.map(v => k + "|" + v[0]), kn = keys.filter(isKnown).length, sk = store.skill[k] || {}; const parts = [store.done[k] || store.placed[k] ? 1 : 0, kn / keys.length, ["L", "H", "S", "Sp"].filter(s => sk[s] != null).length / 4]; return { kn, tot: keys.length, pct: Math.round(parts.reduce((a, b) => a + b, 0) / 3 * 100), sk }; }
function recItems() {
    const r = [], add = (h, pri, act) => r.push({ h, pri, act });
    L.forEach((l, i) => { const k = i + 1; if (store.best[k] != null && store.best[k] < 60)
        add(`Ulangi <a href="#b${k}">bab ${k}: ${l.t}</a>, skor kuis terbaik baru ${store.best[k]}%.`, 1, { a: "bab", b: k }); });
    const due = dueCards(0).length;
    if (due)
        add(`Ada ${due} kartu kosakata yang jatuh tempo. <a href="#kartu">Ulangi sekarang</a>.`, 2, { a: "kartu" });
    const hard = CARDS.filter(isHard).length;
    if (hard >= 3)
        add(`${hard} kata sering salah. Latih dengan dek “Sering salah” di <a href="#kartu">Kartu</a>.`, 2, { a: "kartu" });
    const ss = skillStats();
    Object.entries(ss).forEach(([s, v]) => { if (v.avg != null && v.avg < 70) {
        const link = { H: "#dengar", L: "#baca", S: "#tulis", Sp: "#bicara", W: "#tata" }[s], act = { H: "hoeren", L: "lesen", S: "schreiben", Sp: "sprechen", W: "grammatik" }[s];
        add(`Kemampuan <b>${SKILL[s]}</b> rata-rata ${v.avg}%. Latih lagi di <a href="${link}">sini</a>.`, 1, { a: act });
    } });
    L.forEach((l, i) => { const k = i + 1; if (store.done[k]) {
        const sk = store.skill[k] || {};
        const miss = ["L", "H", "S", "Sp"].filter(s => sk[s] == null);
        if (miss.length)
            add(`Bab ${k} sudah lulus kuis, tetapi latihan ${miss.map(s => SKILL[s]).join(", ")} belum dicoba. <a href="#b${k}">Buka bab ${k}</a>.`, 3, { a: { L: "lesen", H: "hoeren", S: "schreiben", Sp: "sprechen" }[miss[0]], b: k });
    } });
    GR.forEach(g => { if (store.gbest[g.id] != null && store.gbest[g.id] < 60)
        add(`Pelajari lagi <a href="#tata-${g.id}">${g.t}</a> (terbaik ${store.gbest[g.id]}%).`, 2, { a: "grammatik" }); });
    if (!store.placement && !doneCount())
        add(`Belum tahu harus mulai dari mana? Ikuti <a href="#penempatan">tes penempatan</a>.`, 0, null);
    if (doneCount() >= 6 && !store.ex4.length)
        add(`Kamu sudah menyelesaikan ${doneCount()} bab. Coba <a href="#tes">simulasi ujian</a> untuk melihat posisimu.`, 3, { a: "ujian" });
    EXSEC.forEach(([s, n, h]) => { const e = lastEx(s); if (e && e.pct < 60)
        add(`Simulasi ${n} terakhir ${e.pct}%. Ulangi setelah latihan di lab terkait. <a href="${h}">Coba lagi</a>.`, 2, { a: "ujian" }); });
    if (!r.length) {
        const st = startChapter();
        add(st ? `Lanjutkan ke <a href="#b${st}">bab ${st}: ${L[st - 1].t}</a>.` : `Semua bab selesai. Ulangi <a href="#tes">simulasi ujian</a> secara berkala.`, 9, st ? { a: "bab", b: st } : { a: "ujian" });
    }
    return r.sort((a, b) => a.pri - b.pri).slice(0, 8);
}
function recommendations() { return recItems().map(x => x.h); }
function progres() {
    const now = new Date(), days = [];
    for (let k = 6; k >= 0; k--) {
        const d = new Date(now);
        d.setDate(d.getDate() - k);
        days.push({ l: ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"][d.getDay()], s: store.days[keyOf(d)] || 0 });
    }
    const week = days.reduce((a, b) => a + b.s, 0), mx = Math.max(1800, store.plan.daily * 60, ...days.map(d => d.s));
    const mast = CARDS.filter(c => isKnown(c.key)).length, ss = skillStats();
    const kinds = {};
    store.log.forEach(e => { if (e.p == null || !KIND[e.k])
        return; const o = kinds[e.k] = kinds[e.k] || { n: 0, sum: 0, best: 0, last: 0 }; o.n++; o.sum += e.p; o.best = Math.max(o.best, e.p); o.last = e.p; });
    const ex = store.exams.slice(-5).reverse();
    $("#app").innerHTML = `<div class="lhead"><h1>Dashboard</h1><div class="goal">Ringkasan perkembanganmu. Waktu belajar dihitung saat halaman ini terbuka <b>dan</b> kamu aktif; penghitungan berhenti setelah 3 menit tanpa aktivitas atau saat halaman ditinggalkan. Satu hari dihitung belajar jika lebih dari 1 menit.</div></div>${Sync.state === "ok" ? "" : `<div class="goal warnbox"><b>Data hanya tersimpan di browser ini.</b> Jika data browser dihapus, memakai mode penyamaran, atau berganti perangkat, progres tidak ikut. Buat cadangan secara berkala di bagian bawah halaman ini. Cadangan terakhir: ${store.bkAt ? new Date(store.bkAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "belum pernah"}.</div>`}
  <div class="stats"><div class="stat"><b>${streak()}</b><span>hari beruntun</span></div><div class="stat"><b>${fmtMin(week)}</b><span>7 hari terakhir</span></div><div class="stat"><b>${doneCount()}/${L.length}</b><span>bab selesai</span></div><div class="stat"><b>${mast}/${CARDS.length}</b><span>kosakata dikuasai</span></div><div class="stat"><b>${store.log.filter(e => e.p != null).length}</b><span>latihan dinilai</span></div><div class="stat"><b>${store.spk || 0}</b><span>kalimat diucapkan</span></div><div class="stat"><b>${store.talk || 0}</b><span>pesan percakapan</span></div><div class="stat"><b>${(store.pron.ok || 0)}/${(store.pron.ok || 0) + (store.pron.no || 0)}</b><span>lafal dinilai sendiri “sudah mirip”</span></div></div>
  <section class="blk"><h2>Cap paspor bab</h2><p class="note">Setiap bab yang selesai memberi satu cap di kartu belajarmu (${doneCount()} dari ${L.length}).</p><ul class="stamps">${L.map((l, i) => `<li class="${store.done[i + 1] ? "got" : ""}"><span>${store.done[i + 1] ? "Bab " + (i + 1) + " selesai: " + escH(l.t) : "Bab " + (i + 1)}</span></li>`).join("")}</ul></section>
  <section class="blk"><h2>Rekomendasi untuk diulang</h2><ul class="recs">${recommendations().map(x => `<li>${x}</li>`).join("")}</ul></section>
  <section class="blk"><h2>Hasil tes penempatan dan rencana</h2><div class="stats"><div class="stat"><b>${store.placement ? store.placement.pct + "%" : "–"}</b><span>${store.placement ? escH(store.placement.level) + " · mulai bab " + Math.min(store.placement.start, 12) : "belum ikut tes penempatan"}</span></div><div class="stat"><b>${weekEval(0).studied}/${store.plan.weekDays}</b><span>hari belajar minggu ini (target Rencana)</span></div><div class="stat"><b>${(() => { const e = weekEval(0); return e.planned ? e.doneN + "/" + e.planned : "–"; })()}</b><span>jadwal Rencana dikerjakan</span></div></div><p><a href="#penempatan">${store.placement ? "Ulangi" : "Ikuti"} tes penempatan</a> · <a href="#rencana">Buka Study Planner</a></p></section>
  ${(() => {
        const m = masteryLists();
        return `<section class="blk"><h2>Materi yang sudah dipelajari</h2>${m.done.length ? `<ul class="recs">${m.done.map(x => `<li>${x}</li>`).join("")}</ul>` : `<p class="note">Belum ada. Sebuah bab masuk daftar ini setelah kuisnya lulus dan progresnya minimal 60%, atau setelah ditandai lewat tes penempatan.</p>`}</section>
  <section class="blk"><h2>Materi yang belum dikuasai</h2>${m.todo.length ? `<ul class="recs">${m.todo.map(x => `<li>${x}</li>`).join("")}</ul>` : `<p class="note">Tidak ada materi yang sudah dibuka tetapi belum dikuasai.</p>`}${m.hard.length ? `<p><b>Kata yang sering salah:</b> ${m.hard.map(c => `<span class="chipk">${escH(c.de)}</span>`).join(" ")} <a href="#kartu">Latih</a></p>` : ""}</section>`;
    })()}
  <section class="blk"><h2>Catatan perkembangan</h2><p>${progressNote()}</p><div class="tyrow"><input class="inp" id="ntin" placeholder="Tulis catatan belajarmu (misalnya: masih bingung Dativ)" aria-label="Catatan baru" maxlength="300"><button class="btn alt" id="ntadd" type="button">Simpan catatan</button></div>${store.notes.length ? `<ul class="hist hist2">${store.notes.slice().reverse().map((n, i) => `<li><span class="say">${new Date(n.d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</span> ${escH(n.t)} <button class="ib x" type="button" data-ndel="${store.notes.length - 1 - i}" aria-label="Hapus catatan">×</button></li>`).join("")}</ul>` : ""}</section>
  <section class="blk"><h2>Empat kemampuan</h2><div class="skills">${Object.entries(SKILL).map(([s, n]) => { const v = ss[s]; return `<div class="skrow"><b>${n}</b><div class="meter" style="margin:0;max-width:none"><i style="width:${v.avg || 0}%"></i></div><span class="skv">${v.avg != null ? v.avg + "%" : "–"}</span>${spark(v.vals)}<span class="note">${v.n} latihan</span></div>`; }).join("")}</div><p class="note">Persentase = rata-rata 5 nilai terakhir. Garis kecil menunjukkan 10 nilai terakhir.</p></section>
  <section class="blk"><h2>Nilai per jenis latihan</h2>${Object.keys(kinds).length ? `<div class="tbl"><table><thead><tr><th>Jenis</th><th>Percobaan</th><th>Rata-rata</th><th>Terakhir</th><th>Terbaik</th></tr></thead><tbody>${Object.entries(kinds).map(([k, o]) => `<tr><td>${KIND[k][0]}</td><td>${o.n}</td><td>${Math.round(o.sum / o.n)}%</td><td>${o.last}%</td><td>${o.best}%</td></tr>`).join("")}</tbody></table></div>` : `<p class="note">Belum ada latihan yang dinilai.</p>`}</section>
  <section class="blk"><h2>Progres setiap bab</h2><div class="tbl"><table><thead><tr><th>Bab</th><th>Progres</th><th>Kuis</th><th>Kosakata</th><th>Lesen</th><th>Hören</th><th>Schreiben</th><th>Sprechen</th></tr></thead><tbody>${L.map((l, i) => { const k = i + 1, c = chapterProg(k); const f = v => v != null ? v + "%" : "–"; return `<tr><td><a href="#b${k}">${k}. ${l.t}</a></td><td><div class="meter mini"><i style="width:${c.pct}%"></i></div>${c.pct}%</td><td>${store.done[k] ? "✓ " : ""}${f(store.best[k])}</td><td>${c.kn}/${c.tot}</td><td>${f(c.sk.L)}</td><td>${f(c.sk.H)}</td><td>${f(c.sk.S)}</td><td>${f(c.sk.Sp)}</td></tr>`; }).join("")}</tbody></table></div><p class="note">Progres bab = rata-rata dari kuis lulus, kosakata dikuasai, dan empat latihan keterampilan yang sudah dicoba.</p></section>
  <section class="blk"><h2>Menit belajar per hari</h2><div class="bars">${days.map(d => `<div class="bar2"><span>${Math.round(d.s / 60)}</span><i style="height:${Math.round(d.s / mx * 80)}%"></i></div>`).join("")}</div><div class="days">${days.map(d => `<span>${d.l}</span>`).join("")}</div><p class="note">Target harian: ${store.plan.daily} menit. <a href="#rencana">Ubah di Study Planner</a>.</p></section>
  <section class="blk"><h2>Kosakata yang dikuasai</h2><p>${mast} dari ${CARDS.length} kata. <a href="#kamus" id="tok">Lihat daftarnya di Kamus</a> · <a href="#kartu">Latih di Kartu</a></p></section>
  <section class="blk"><h2>Riwayat belajar</h2>${store.log.length ? `<ul class="hist hist2">${store.log.slice(-30).reverse().map(e => `<li><span class="say">${new Date(e.t).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span> ${escH(e.x || (KIND[e.k] ? KIND[e.k][0] : e.k))}${e.p != null ? ` <b>${e.p}%</b>` : ""}</li>`).join("")}</ul>` : `<p class="note">Belum ada riwayat.</p>`}${Object.keys(store.revd).length ? `<p class="note">Kartu diulang: ${Object.entries(store.revd).sort().slice(-7).reverse().map(([d, n]) => d.slice(5) + ": " + n).join(" · ")}</p>` : ""}</section>
  <section class="blk"><h2>Hasil tes cepat</h2>${ex.length ? `<ul class="hist">${ex.map(e => `<li>${new Date(e.d).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}: ${e.score}/${e.total} (${e.pct}%)</li>`).join("")}</ul>` : `<p class="note">Belum ada. Coba <a href="#tes-cepat">tes cepat</a> atau <a href="#tes">simulasi ujian</a>.</p>`}</section>
  <section class="blk"><h2>Penyimpanan dan cadangan</h2><p class="note" id="syncst">${syncText()}</p>
    <div class="row"><button class="btn alt" id="bkx" type="button">Salin kode cadangan</button>${window.claude ? "" : `<button class="btn alt" id="bkd" type="button">Unduh file cadangan</button>`}<button class="btn alt" id="bki" type="button">Pulihkan cadangan</button></div><div id="bk"></div></section>
  <section class="blk"><h2>Pengaturan audio</h2><div class="tools">${audioCtl()}</div><p class="note">${audioNote()}</p></section>
  <section class="blk"><h2>Atur ulang</h2><div id="rst"><button class="btn alt" id="rs1" type="button">Hapus semua kemajuan</button></div></section>`;
    wireAudioCtl($("#app"));
    $("#tok").addEventListener("click", () => { dflt = "known"; });
    const addNote = () => { const v = $("#ntin").value.trim(); if (!v)
        return; store.notes.push({ d: Date.now(), t: v }); if (store.notes.length > 100)
        store.notes = store.notes.slice(-100); save(store); notice("Catatan tersimpan"); progres(); };
    $("#ntadd").addEventListener("click", addNote);
    $("#ntin").addEventListener("keydown", e => { if (e.key === "Enter")
        addNote(); });
    $("#app").querySelectorAll("[data-ndel]").forEach(b => b.addEventListener("click", () => { store.notes.splice(+b.dataset.ndel, 1); save(store); progres(); }));
    const bkCode = () => JSON.stringify(slim(store));
    $("#bkx").addEventListener("click", () => {
        const code = bkCode();
        $("#bk").innerHTML = `<p class="note">Salin kode ini dan simpan di tempat aman (catatan, surel ke diri sendiri). Tempelkan di perangkat lain lewat “Pulihkan cadangan”.</p><textarea class="inp ta" rows="5" readonly id="bkt">${escH(code)}</textarea><div class="row"><button class="btn" id="bkc" type="button">Salin</button><span class="note" id="bkm"></span></div>`;
        $("#bkc").addEventListener("click", () => { const t = $("#bkt"); t.select(); const ok = () => { store.bkAt = Date.now(); save(store, true); $("#bkm").textContent = "Tersalin."; notice("Kode cadangan tersalin"); }; (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(code) : Promise.reject()).then(ok).catch(() => { try {
            if (document.execCommand("copy"))
                ok();
            else
                throw 0;
        }
        catch (e) {
            $("#bkm").textContent = "Pilih teks lalu salin manual (Ctrl/Cmd + C).";
        } }); });
    });
    const bd = $("#bkd");
    if (bd)
        bd.addEventListener("click", () => { try {
            const blob = new Blob([bkCode()], { type: "application/json" }), a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "mein-deutsch-a1-cadangan-" + keyOf(new Date()) + ".json";
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(a.href), 4000);
            store.bkAt = Date.now();
            save(store, true);
            notice("File cadangan diunduh");
        }
        catch (e) {
            notice("Browser menolak unduhan. Pakai Salin kode cadangan.");
        } });
    const summ = o => { o = ensureStore(JSON.parse(JSON.stringify(o))); return `${Object.keys(o.done).filter(k => o.done[k]).length} bab selesai, ${o.log.filter(e => e.p != null).length} latihan dinilai, ${CARDS.filter(c => o.srs[c.key] && o.srs[c.key].reps >= 3).length} kartu dikuasai${o.upd ? ", disimpan " + new Date(o.upd).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}`; };
    const restore = txt => {
        let obj = null;
        try {
            obj = JSON.parse(txt);
        }
        catch (e) { }
        if (!obj || typeof obj !== "object" || Array.isArray(obj) || !obj.done || !obj.srs) {
            $("#bkr").innerHTML = `<div class="fb no"><b>Cadangan tidak valid.</b>Pastikan seluruh kode tersalin atau file berasal dari Mein Deutsch A1.</div>`;
            return;
        }
        $("#bkr").innerHTML = `<div class="sumbox"><p><b>Progres sekarang:</b> ${summ(store)}.<br><b>Isi cadangan:</b> ${summ(obj)}.</p><p class="note">“Gabungkan” menyimpan yang terbaik dari keduanya dan tidak menghapus apa pun. “Ganti” menghapus progres sekarang dan memakai isi cadangan.</p><div class="row"><button class="btn" id="bkm1" type="button">Gabungkan</button><button class="btn alt" id="bkm2" type="button">Ganti progres sekarang</button></div><div id="bkc2"></div></div>`;
        $("#bkm1").addEventListener("click", () => { store = mergeStore(store, obj); save(store); updateProg(); progres(); notice("Cadangan digabungkan"); });
        $("#bkm2").addEventListener("click", () => {
            $("#bkc2").innerHTML = `<div class="fb no"><b>Yakin mengganti?</b>Progres sekarang (${summ(store)}) akan hilang dan tidak bisa dikembalikan, kecuali kamu sudah membuat cadangannya.<div class="row"><button class="btn" id="bkok" type="button">Ya, ganti</button><button class="btn alt" id="bkno" type="button">Batal</button></div></div>`;
            $("#bkno").addEventListener("click", () => { $("#bkc2").innerHTML = ""; });
            $("#bkok").addEventListener("click", () => { store = ensureStore(obj); store.rst = Date.now(); save(store); updateProg(); progres(); notice("Progres diganti dengan cadangan"); });
        });
    };
    $("#bki").addEventListener("click", () => {
        $("#bk").innerHTML = `<p class="note">Tempel kode cadangan, atau pilih file cadangan (.json).</p><textarea class="inp ta" rows="4" id="bkin" spellcheck="false" placeholder="Tempel kode cadangan di sini"></textarea><div class="row"><button class="btn" id="bkgo" type="button">Periksa cadangan</button><label class="btn alt" style="cursor:pointer">Pilih file<input type="file" id="bkf" accept=".json,application/json" hidden></label></div><div id="bkr" aria-live="polite"></div>`;
        $("#bkgo").addEventListener("click", () => restore($("#bkin").value));
        $("#bkf").addEventListener("change", e => { const f = e.target.files && e.target.files[0]; if (!f)
            return; const rd = new FileReader(); rd.onload = () => { $("#bkin").value = String(rd.result); restore(String(rd.result)); }; rd.onerror = () => { $("#bkr").innerHTML = `<div class="fb no"><b>File tidak bisa dibaca.</b></div>`; }; rd.readAsText(f); });
    });
    $("#rs1").addEventListener("click", () => {
        $("#rst").innerHTML = `<p class="note">Semua bab selesai, kartu, jam belajar, nilai latihan, hasil tes, rencana belajar, dan kata favorit akan terhapus${Sync.be ? " dari browser ini dan dari akunmu" : " dari browser ini"}.</p><div class="row"><button class="btn" id="rs2" type="button">Ya, hapus semua</button><button class="btn alt" id="rs3" type="button">Batal</button></div>`;
        $("#rs3").addEventListener("click", progres);
        $("#rs2").addEventListener("click", () => { store = ensureStore({}); store.rst = Date.now(); save(store); updateProg(); progres(); notice("Semua kemajuan dihapus"); });
    });
}
/* ---------- Study Planner ---------- */
const ACT = { bab: { n: "Pelajari bab", k: ["kuis"], h: b => b ? "#b" + b : "#" }, kartu: { n: "Kartu kosakata", k: [], h: () => "#kartu" }, hoeren: { n: "Hören", k: ["hoeren", "ujian-H"], h: b => b ? "#dengar-" + b : "#dengar" }, lesen: { n: "Lesen", k: ["lesen", "ujian-L"], h: b => { const i = b ? rdOf(b) : -1; return i >= 0 ? "#r" + (i + 1) : "#baca"; } }, schreiben: { n: "Schreiben", k: ["schreiben", "ujian-S"], h: b => b ? "#tulis-" + b : "#tulis" }, sprechen: { n: "Sprechen", k: ["sprechen", "dialog", "chat", "ujian-Sp"], h: b => b ? "#bicara-" + b : "#bicara" }, grammatik: { n: "Grammar", k: ["grammatik", "pola"], h: () => "#tata" }, latihan: { n: "Latihan campuran", k: ["latihan"], h: () => "#latihan" }, ujian: { n: "Simulasi ujian", k: ["ujian-H", "ujian-L", "ujian-S", "ujian-Sp", "tes"], h: () => "#tes" } };
const WD = [[1, "Senin"], [2, "Selasa"], [3, "Rabu"], [4, "Kamis"], [5, "Jumat"], [6, "Sabtu"], [7, "Minggu"]];
const wdOf = d => d.getDay() === 0 ? 7 : d.getDay(), wdNow = () => wdOf(new Date());
const actName = it => ACT[it.a].n + (it.b ? " bab " + it.b : "");
function dayRange(d) { const s = new Date(d); s.setHours(0, 0, 0, 0); const e = new Date(s); e.setDate(e.getDate() + 1); return [s.getTime(), e.getTime()]; }
function actDone(it, dayKey) {
    const [y, m, dd] = dayKey.split("-").map(Number), [s, e] = dayRange(new Date(y, m - 1, dd));
    if (it.a === "kartu")
        return (store.revd[dayKey] || 0) > 0;
    return store.log.some(x => x.t >= s && x.t < e && ACT[it.a].k.includes(x.k) && (!it.b || x.b === it.b || x.k.startsWith("ujian")));
}
function weekStart(off) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (wdOf(d) - 1) + 7 * (off || 0)); return d; }
function weekEval(off) {
    const s = weekStart(off), days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(s);
        d.setDate(d.getDate() + i);
        days.push(d);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const mins = days.map(d => store.days[keyOf(d)] || 0), met = mins.filter(v => v >= store.plan.daily * 60).length, studied = mins.filter(v => v >= 60).length;
    const [ws] = dayRange(s), we = ws + 7 * 864e5, ch = new Set(store.log.filter(x => x.k === "kuis" && x.p >= 60 && x.t >= ws && x.t < we).map(x => x.b)).size;
    let planned = 0, doneN = 0;
    days.forEach(d => { if (d > today)
        return; (store.plan.sched[wdOf(d)] || []).forEach(it => { planned++; if (actDone(it, keyOf(d)))
        doneN++; }); });
    return { days, mins, met, studied, ch, planned, doneN };
}
let remindTimer = null, lastToast = 0;
function notifStatus() {
    if (!("Notification" in window))
        return "Browser ini tidak mendukung notifikasi. Pengingat hanya muncul sebagai pesan di dalam halaman ini.";
    let p = "default";
    try {
        p = Notification.permission;
    }
    catch (e) { }
    return p === "granted" ? "Notifikasi browser: diizinkan. Pengingat tetap hanya berjalan selama halaman terbuka." : p === "denied" ? "Notifikasi browser: ditolak atau diblokir oleh tampilan ini. Ubah izin di pengaturan situs browser jika ingin memakainya. Pengingat tetap muncul sebagai pesan di dalam halaman." : "Notifikasi browser: belum diizinkan. Tekan tombol di atas jika ingin memakainya.";
}
function tcard(l, v, g, u) { const pct = g ? Math.min(100, Math.round(v / g * 100)) : 100; return `<div class="stat tcard"><span>${l}</span><b>${v}<small> / ${g} ${u}</small></b><div class="meter"><i style="width:${pct}%"></i></div><span>${pct >= 100 ? "✓ target tercapai" : pct + "% dari target"}</span></div>`; }
function showToast(html) { let t = document.getElementById("toast"); if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.className = "toast";
    t.setAttribute("role", "status");
    document.body.appendChild(t);
} t.innerHTML = html + `<button class="ib" type="button" id="toastx" aria-label="Tutup">Tutup</button>`; t.hidden = false; document.getElementById("toastx").addEventListener("click", () => { t.hidden = true; }); }
function remindCheck() {
    const r = store.plan.remind;
    if (!r || !r.on)
        return;
    const now = new Date(), [hh, mm] = String(r.time || "19:00").split(":").map(Number);
    if (now.getHours() * 60 + now.getMinutes() < hh * 60 + mm)
        return;
    const k = keyOf(now);
    if (store.lastRemind === k)
        return;
    const left = store.plan.daily * 60 - (store.days[k] || 0);
    const items = (store.plan.sched[wdOf(now)] || []).filter(it => !actDone(it, k));
    if (left <= 0 && !items.length)
        return;
    store.lastRemind = k;
    save(store, true);
    const msg = (left > 0 ? "Masih " + Math.ceil(left / 60) + " menit lagi untuk target hari ini." : "Target menit tercapai.") + (items.length ? " Belum dikerjakan: " + items.map(actName).join(", ") + "." : "");
    showToast(`<b>Pengingat belajar</b><br>${escH(msg)} <a href="#rencana">Lihat rencana</a>`);
    try {
        if (window.Notification && Notification.permission === "granted")
            new Notification("Mein Deutsch A1", { body: msg });
    }
    catch (e) { }
}
setInterval(remindCheck, 60000);
setTimeout(remindCheck, 4000);
function rencana() {
    const p = store.plan, wd = wdNow(), k = keyOf(new Date()), t = store.days[k] || 0, ev = weekEval(0), pev = weekEval(-1);
    const evalTxt = e => { const sc = Math.round(((Math.min(e.studied, p.weekDays) / p.weekDays) + (p.weekCh ? Math.min(e.ch, p.weekCh) / p.weekCh : 1) + (e.planned ? e.doneN / e.planned : 1)) / 3 * 100); return { sc, msg: sc >= 90 ? "Luar biasa, target minggu ini tercapai." : sc >= 60 ? "Bagus, sebagian besar target tercapai. Kejar sisanya." : "Masih jauh dari target. Coba kurangi target atau jadwalkan sesi pendek setiap hari." }; };
    const e0 = evalTxt(ev), e1 = evalTxt(pev), hasN = typeof window.Notification !== "undefined";
    const opt = (arr, v) => arr.map(([a, b]) => `<option value="${a}" ${String(v) === String(a) ? "selected" : ""}>${b}</option>`).join("");
    $("#app").innerHTML = `<div class="lhead"><h1>Study Planner</h1><div class="goal">Tentukan target, susun jadwal mingguan, centang materi, dan lihat evaluasi pencapaianmu. Aktivitas yang sudah kamu kerjakan di aplikasi otomatis tercentang.</div></div>
  <section class="blk"><h2>Target belajar</h2><div class="tools"><label>Harian: <select class="sel" id="pd">${opt([[10, "10 menit"], [15, "15 menit"], [20, "20 menit"], [30, "30 menit"], [45, "45 menit"], [60, "60 menit"], [90, "90 menit"]], p.daily)}</select></label><label>Hari belajar per minggu: <select class="sel" id="pw">${opt([[3, "3 hari"], [4, "4 hari"], [5, "5 hari"], [6, "6 hari"], [7, "7 hari"]], p.weekDays)}</select></label><label>Bab baru per minggu: <select class="sel" id="pc">${opt([[0, "tidak ada"], [1, "1 bab"], [2, "2 bab"], [3, "3 bab"]], p.weekCh)}</select></label></div>
    <p class="note">Dengan ${p.weekCh || "0"} bab per minggu, 12 bab selesai dalam ${p.weekCh ? Math.ceil((L.length - doneCount()) / p.weekCh) + " minggu lagi" : "waktu yang belum ditentukan"}.</p></section>
  <section class="blk"><h2>Pencapaian target</h2><div class="stats tcards">${tcard("Hari ini (" + WD[wd - 1][1] + ")", Math.round(t / 60), p.daily, "menit")}${tcard("Minggu ini", Math.round(ev.mins.reduce((a, c) => a + c, 0) / 60), p.daily * p.weekDays, "menit")}${tcard("Hari belajar minggu ini", ev.studied, p.weekDays, "hari")}${tcard("Bab baru minggu ini", ev.ch, p.weekCh, "bab")}</div><p class="note">Menit dihitung hanya saat halaman terbuka dan kamu aktif (berhenti setelah 3 menit tanpa aktivitas). Target mingguan = target harian × hari belajar per minggu.</p>
  <h3 class="subh">Jadwal hari ini (${WD[wd - 1][1]})</h3>
    ${(p.sched[wd] || []).length ? `<ul class="chkl big">${p.sched[wd].map(it => { const ok = actDone(it, k); return `<li class="${ok ? "y" : "n"}">${ok ? "✓" : "○"} <a href="${ACT[it.a].h(it.b)}">${actName(it)}</a></li>`; }).join("")}</ul>` : `<p class="note">Belum ada jadwal untuk hari ini. Tambahkan di jadwal mingguan.</p>`}</section>
  <section class="blk"><h2>Rekomendasi dari Dashboard</h2>${(() => { const it = recItems().filter(x => x.act); return it.length ? `<ul class="recs">${it.map((x, i) => `<li>${x.h} <button class="ib" type="button" data-radd="${i}">+ Jadwalkan hari ini</button></li>`).join("")}</ul>` : `<p class="note">Belum ada rekomendasi.</p>`; })()}</section>
  <section class="blk"><h2>Jadwal mingguan</h2><div class="sched">${WD.map(([n, name]) => `<div class="srow ${n === wd ? "today" : ""}"><b>${name}</b><span class="sitems">${(p.sched[n] || []).map((it, j) => `<span class="chipk">${actName(it)} <button class="ib x" data-del="${n}-${j}" type="button" aria-label="Hapus">×</button></span>`).join("") || `<span class="note">kosong</span>`}</span></div>`).join("")}</div>
    <div class="tools" style="margin-top:12px"><label>Hari: <select class="sel" id="sd">${WD.map(([n, name]) => `<option value="${n}" ${n === wd ? "selected" : ""}>${name}</option>`).join("")}</select></label><label>Aktivitas: <select class="sel" id="sa">${Object.entries(ACT).map(([a, o]) => `<option value="${a}">${o.n}</option>`).join("")}</select></label><label>Bab: <select class="sel" id="sb"><option value="0">–</option>${L.map((l, i) => `<option value="${i + 1}">${i + 1}</option>`).join("")}</select></label><button class="btn" id="sadd" type="button">Tambah</button></div>
    <div class="row"><button class="btn alt" id="sauto" type="button">Isi jadwal otomatis sesuai target</button></div></section>
  <section class="blk"><h2>Evaluasi pencapaian</h2><div class="stats"><div class="stat"><b>${ev.met}/7</b><span>hari target menit tercapai</span></div><div class="stat"><b>${ev.planned ? ev.doneN + "/" + ev.planned : "–"}</b><span>jadwal sampai hari ini dikerjakan</span></div></div>
    <div class="bars wk">${ev.days.map((d, i) => `<div class="bar2"><span>${Math.round(ev.mins[i] / 60)}</span><i style="height:${Math.min(100, Math.round(ev.mins[i] / Math.max(p.daily * 60 * 1.5, 1) * 100))}%" class="${ev.mins[i] >= p.daily * 60 ? "hit" : ""}"></i></div>`).join("")}<div class="tline" style="bottom:${Math.round(100 / 1.5)}%"></div></div><div class="days">${WD.map(w => `<span>${w[1].slice(0, 3)}</span>`).join("")}</div>
    <p style="margin-top:10px"><b>Skor minggu ini: ${e0.sc}%.</b> ${e0.msg} <span class="note">Minggu lalu: ${e1.sc}%.</span></p></section>
  <section class="blk"><h2>Checklist materi</h2><p class="note" style="margin-top:0">Item tercentang otomatis saat kamu menyelesaikannya. Kamu juga bisa mencentang sendiri.</p>${L.map((l, i) => { const b = i + 1, items = chkItems(b), done = items.filter(x => x.ok).length; return `<details class="chkd"><summary><b>Bab ${b}: ${l.t}</b> <span class="pill ${done === items.length ? "ok" : ""}">${done}/${items.length}</span></summary><ul class="chkl">${items.map(x => `<li><label><input type="checkbox" data-chk="${b}-${x.id}" ${x.ok ? "checked" : ""} ${x.auto ? "disabled" : ""}> ${x.n}${x.auto ? ` <span class="note">(otomatis)</span>` : ""}</label> <a href="${x.h}">buka</a></li>`).join("")}</ul></details>`; }).join("")}</section>
  <section class="blk"><h2>Pengingat</h2><div class="tools"><label><input type="checkbox" id="ron" ${p.remind.on ? "checked" : ""}> Ingatkan saya</label><label>Pukul <input class="inp" type="time" id="rtm" value="${esc(p.remind.time || "19:00")}" style="flex:none;min-width:0"></label>${hasN ? `<button class="btn alt" id="rnot" type="button">Izinkan notifikasi browser</button>` : ""}</div>
    <p class="note">Pengingat muncul sebagai pesan di halaman ini jika setelah jam tersebut target menit atau jadwal hari ini belum tercapai. Pengingat hanya berjalan selama halaman terbuka; website tidak bisa mengingatkan saat halaman atau browser ditutup. Untuk pengingat yang pasti, pasang juga alarm di HP.</p><p class="note" id="rst2"><b>Status:</b> ${notifStatus()}</p></section>`;
    const sv = () => { save(store); notice("Rencana tersimpan"); };
    $("#pd").addEventListener("change", e => { p.daily = +e.target.value; sv(); rencana(); });
    $("#pw").addEventListener("change", e => { p.weekDays = +e.target.value; sv(); rencana(); });
    $("#pc").addEventListener("change", e => { p.weekCh = +e.target.value; sv(); rencana(); });
    $("#sadd").addEventListener("click", () => { const d = +$("#sd").value, a = $("#sa").value, b = +$("#sb").value; p.sched[d] = p.sched[d] || []; if (p.sched[d].length >= 6) {
        notice("Maksimal 6 aktivitas per hari");
        return;
    } p.sched[d].push(b && a !== "kartu" && a !== "grammatik" && a !== "latihan" && a !== "ujian" ? { a, b } : { a }); sv(); rencana(); });
    $("#app").querySelectorAll("[data-del]").forEach(x => x.addEventListener("click", () => { const [d, j] = x.dataset.del.split("-").map(Number); p.sched[d].splice(j, 1); sv(); rencana(); }));
    const rit = recItems().filter(x => x.act);
    $("#app").querySelectorAll("[data-radd]").forEach(b => b.addEventListener("click", () => { const a = rit[+b.dataset.radd].act; p.sched[wd] = p.sched[wd] || []; if (p.sched[wd].length >= 6) {
        notice("Maksimal 6 aktivitas per hari");
        return;
    } if (!p.sched[wd].some(x => x.a === a.a && x.b === a.b))
        p.sched[wd].push(a.b ? { a: a.a, b: a.b } : { a: a.a }); save(store); notice("Ditambahkan ke jadwal hari ini"); rencana(); }));
    $("#sauto").addEventListener("click", () => {
        const nb = startChapter() || 1;
        const days = [1, 2, 3, 4, 5, 6, 7].slice(0, p.weekDays);
        p.sched = {};
        let b = nb, c = 0;
        days.forEach((d, i) => { const arr = []; if (i % 2 === 0 && c < Math.max(1, p.weekCh) && b <= L.length) {
            arr.push({ a: "bab", b });
            c++;
        }
        else {
            const pool = ["hoeren", "lesen", "schreiben", "sprechen"];
            arr.push({ a: pool[i % 4], b: Math.max(1, b - 1) });
        } arr.push({ a: "kartu" }); if (i === days.length - 1)
            arr.push({ a: "grammatik" }); if (i % 2 === 1 && b < L.length && c < p.weekCh)
            b++; p.sched[d] = arr; });
        sv();
        rencana();
    });
    $("#app").querySelectorAll("[data-chk]").forEach(c => c.addEventListener("change", () => { store.chk[c.dataset.chk] = c.checked; sv(); }));
    $("#ron").addEventListener("change", e => { p.remind.on = e.target.checked; store.lastRemind = ""; save(store); notice(p.remind.on ? "Pengingat aktif pukul " + (p.remind.time || "19:00") : "Pengingat dimatikan"); });
    $("#rtm").addEventListener("change", e => { p.remind.time = e.target.value || "19:00"; store.lastRemind = ""; sv(); });
    const rn = $("#rnot");
    if (rn)
        rn.addEventListener("click", () => { const upd = () => { $("#rst2").innerHTML = "<b>Status:</b> " + notifStatus(); }; try {
            const r = Notification.requestPermission(r2 => upd());
            if (r && r.then)
                r.then(upd).catch(upd);
            else
                upd();
        }
        catch (e) {
            $("#rst2").innerHTML = "<b>Status:</b> Notifikasi browser tidak tersedia di tampilan ini. Pengingat tetap muncul sebagai pesan di dalam halaman.";
        } });
}
function chkItems(b) {
    const sk = store.skill[b] || {}, keys = L[b - 1].v.map(v => b + "|" + v[0]), learned = keys.filter(x => store.srs[x]).length, ri = rdOf(b);
    const it = [["seen", "Baca inti bab dan contoh", !!store.seen[b], "#b" + b], ["quiz", "Lulus kuis bab (≥ 60%)", !!store.done[b], "#b" + b], ["vocab", "Pelajari 10 kata di Kartu kosakata", learned >= 10, "#kartu"], ["L", "Latihan Lesen", sk.L != null, ri >= 0 ? "#r" + (ri + 1) : "#baca"], ["H", "Latihan Hören", sk.H != null, "#dengar-" + b], ["S", "Latihan Schreiben", sk.S != null, "#tulis-" + b], ["Sp", "Latihan Sprechen", sk.Sp != null, "#bicara-" + b]];
    return it.map(([id, n, auto, h]) => ({ id, n, auto, h, ok: auto || !!store.chk[b + "-" + id] }));
}
/* ---------- Tes penempatan ---------- */
function startChapter() { const i = L.findIndex((_, j) => !store.done[j + 1] && !store.placed[j + 1]); return i < 0 ? 0 : i + 1; }
function penempatan() {
    const pl = store.placement;
    $("#app").innerHTML = `<div class="lhead"><h1>Tes penempatan</h1><div class="goal">${PLC.length} soal singkat (kosakata, tata bahasa, dan membaca) dari bab 1 sampai 12, sekitar 10 menit. Jawaban tidak langsung dinilai; hasil dan rekomendasi bab muncul di akhir. Jika belum tahu jawabannya, pilih “Saya belum tahu” agar hasilnya akurat.</div></div>
  ${pl ? `<div class="sumbox" style="margin-top:0"><b>Hasil terakhir (${new Date(pl.d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}):</b> ${pl.pct}% · ${escH(pl.level)} · rekomendasi mulai dari <a href="#b${pl.start || 1}">bab ${pl.start || 1}</a>.</div>` : ""}
  <div class="row"><button class="btn" id="plgo" type="button">${pl ? "Ulangi tes penempatan" : "Mulai tes penempatan"}</button><a class="btn alt" href="#b1">Langsung mulai bab 1</a></div><div class="quiz" id="plq" hidden style="margin-top:16px"></div>`;
    $("#plgo").addEventListener("click", run);
    function run() {
        const qs = PLC.map(q => Object.assign({}, q, { ord: shuffle(q.o) })), ans = [];
        let i = 0;
        const box = $("#plq");
        box.hidden = false;
        $("#plgo").disabled = true;
        const show = () => {
            const q = qs[i];
            box.innerHTML = `<div class="qmeta"><span>Soal ${i + 1} dari ${qs.length}</span><span>${{ G: "Tata bahasa", W: "Kosakata", L: "Membaca" }[q.k]}</span></div>${q.t ? `<div class="paper">${escH(q.t)}</div>` : ""}<div class="qtext">${escH(q.q)}</div><div class="opts">${q.ord.map(o => `<button class="opt" type="button" data-o="${esc(o)}">${escH(o)}</button>`).join("")}<button class="opt idk" type="button" data-o="">Saya belum tahu</button></div><div class="meter" style="max-width:none;margin-top:16px"><i style="width:${Math.round(i / qs.length * 100)}%"></i></div>`;
            box.querySelectorAll("[data-o]").forEach(b => b.addEventListener("click", () => { ans[i] = b.dataset.o; i++; i < qs.length ? show() : finish(); }));
            box.scrollIntoView({ block: "nearest" });
        };
        const finish = () => {
            const ok = qs.map((q, j) => ans[j] === q.o[0]), per = {};
            qs.forEach((q, j) => { per[q.b] = (per[q.b] || 0) + (ok[j] ? 1 : 0); });
            const score = ok.filter(Boolean).length, pct = Math.round(score / qs.length * 100);
            let start = 1;
            while (start <= 12 && per[start] === 2)
                start++;
            const level = pct < 25 || start === 1 ? "Pemula: mulai dari dasar" : start <= 4 ? "Sudah mengenal dasar" : start <= 8 ? "Dasar cukup kuat" : start <= 12 ? "Hampir menyelesaikan A1" : "Materi A1 sudah dikuasai";
            store.placement = { d: Date.now(), pct, start: start > 12 ? 13 : start, level, per };
            logRes("penempatan", 0, pct, "Tes penempatan: " + level);
            const rec = start > 12 ? `Semua bab terjawab benar. Langsung coba <a href="#tes">simulasi ujian A1</a>, lalu ulangi bab yang lemah.` : start === 1 ? `Mulai dari <a href="#b1">bab 1: ${L[0].t}</a>. Ikuti bab secara berurutan.` : `Mulai dari <a href="#b${start}">bab ${start}: ${L[start - 1].t}</a>. Bab 1 sampai ${start - 1} sudah kamu kuasai di tes ini.`;
            box.innerHTML = `<div class="qmeta"><span>Hasil tes penempatan</span></div><div class="score">${score}/${qs.length}</div><p style="margin:10px 0 0"><b>${pct}% · ${level}</b></p><p>${rec}</p>
      <div class="tbl"><table class="compact"><thead><tr><th>Bab</th><th>Benar</th><th>Status</th></tr></thead><tbody>${L.map((l, j) => { const b = j + 1, n = per[b] || 0; return `<tr><td>${b}. ${l.t}</td><td>${n}/2</td><td>${n === 2 ? "✓ dikuasai" : n === 1 ? "sebagian" : "perlu dipelajari"}</td></tr>`; }).join("")}</tbody></table></div>
      ${start > 1 ? `<div class="row"><button class="btn" id="plmark" type="button">Tandai bab 1–${Math.min(start, 13) - 1} sebagai sudah dikuasai</button></div><p class="note">Pilihan ini hanya memberi tanda “lewat tes penempatan” dan menempatkan rencana belajarmu di bab ${Math.min(start, 12)}. Kuis bab tetap bisa dikerjakan kapan saja.</p>` : ""}
      <details class="rev"><summary>Lihat pembahasan semua soal</summary>${qs.map((q, j) => `<div class="rv"><b>${j + 1}. ${escH(q.q)}</b> ${ok[j] ? `<span class="pill ok">Benar</span>` : `<span class="pill">${ans[j] ? "Salah" : "Belum tahu"}</span>`}<br>Jawaban benar: <b>${escH(q.o[0])}</b> · Bab ${q.b}<br><span class="note">${escH(q.y)}</span></div>`).join("")}</details>
      <div class="row"><a class="btn alt" href="#progres">Lihat di Dashboard</a><a class="btn alt" href="#rencana">Atur rencana belajar</a></div>`;
            const mk = $("#plmark");
            if (mk)
                mk.addEventListener("click", () => { for (let b = 1; b < Math.min(start, 13); b++)
                    store.placed[b] = true; save(store); updateProg(); mk.disabled = true; mk.textContent = "Sudah ditandai"; notice("Bab 1–" + (Math.min(start, 13) - 1) + " ditandai lewat tes penempatan"); });
            save(store);
            $("#plgo").disabled = false;
        };
        show();
    }
}
/* ---------- Speaking: meminta informasi dan membuat permintaan ---------- */
function bicaraMinta() {
    const items = shuffle(INFOQ).slice(0, 4).map(x => Object.assign({ type: "info" }, x)).concat(pick(EXSP.requests, 4).map(x => Object.assign({ type: "req" }, x)));
    $("#app").innerHTML = `<a class="crumb" href="#bicara">← Speaking Lab</a><div class="lhead"><h1>Meminta informasi dan membuat permintaan</h1><div class="goal">Delapan situasi: empat kali bertanya untuk mendapatkan informasi, empat kali membuat permintaan sopan. Ucapkan lewat mic atau ketik, lalu bandingkan dengan contoh audio.</div></div>
  <div class="tip"><span class="lab">Pola</span><br>Bertanya: <span class="de">W-Wort + kata kerja + ...?</span> (Wann ist ...? Was kostet ...? Wo ist ...?) atau <span class="de">kata kerja + subjek + ...?</span> (Haben Sie ...?).<br>Meminta: <span class="de">Können Sie bitte ...?</span> · <span class="de">Kannst du bitte ...?</span> · <span class="de">... , bitte.</span></div>
  <div class="quiz" id="mbox"></div><p class="note" id="micstat"></p>`;
    let i = 0;
    const sc = [];
    const show = () => {
        const box = $("#mbox");
        if (i >= items.length) {
            const pct = Math.round(sc.reduce((a, b) => a + b, 0) / items.length);
            box.innerHTML = `<div class="score">${pct}%</div><p style="margin:10px 0 0">Rata-rata ketepatan bentuk kalimat dan kata kunci.</p><div class="row"><button class="btn" id="mre" type="button">Situasi baru</button><a class="btn alt" href="#tata-fragen">Pelajari W-Fragen</a><a class="btn alt" href="#tata-imperativ">Pelajari permintaan sopan</a></div>`;
            logRes("sprechen", 0, pct, "Meminta informasi dan permintaan");
            $("#mre").addEventListener("click", bicaraMinta);
            return;
        }
        const it = items[i];
        box.innerHTML = `<div class="qmeta"><span>Situasi ${i + 1} dari ${items.length}</span><span>${it.type === "info" ? "Meminta informasi" : "Permintaan"}</span></div>${it.type === "req" ? `<div class="sign big">${escH(it.w)}</div>` : ""}<div class="qtext">${escH(it.d)}</div><div id="ma"></div><div id="mr" aria-live="polite"></div><div class="row"><button class="btn" id="mn" type="button">${i < items.length - 1 ? "Situasi berikutnya" : "Lihat hasil"}</button></div>`;
        answerBox(box.querySelector("#ma"), { retry: true, ph: "Atau ketik kalimatmu", onSubmit: t => {
                const n = normA(t);
                const form = it.type === "info" ? isQuestion(t) : /(koennen sie|kannst du|koenntest du|koennten sie|kann ich|darf ich|bitte|ich moechte|haben sie|hast du)/.test(n), kw = new RegExp(it.k).test(n);
                sc[i] = (form ? 50 : 0) + (kw ? 50 : 0);
                box.querySelector("#mr").innerHTML = `<div class="spkres"><p style="margin:0"><b>Kalimatmu:</b> “${escH(t)}”</p><ul class="chkl"><li class="${form ? "y" : "n"}">${form ? "✓" : "✗"} ${it.type === "info" ? "berbentuk pertanyaan (W-Wort di depan atau kata kerja di depan)" : "berbentuk permintaan sopan (Können Sie / Kannst du / bitte)"}</li><li class="${kw ? "y" : "n"}">${kw ? "✓" : "✗"} menyebut informasi penting${it.w ? " (“" + escH(it.w) + "”)" : ""}</li></ul><p style="margin:6px 0 0">Contoh: <span class="de">${escH(it.m)}</span> <button class="spk sm" data-say="${esc(it.m)}" aria-label="Dengar contoh">${SPK}</button></p><p class="note">Yang dinilai hanya bentuk kalimat dan kata kunci, bukan pelafalan.</p></div>`;
                wireSpk(box.querySelector("#mr"));
            } });
        box.querySelector("#mn").addEventListener("click", () => { if (Mic.active)
            Mic.stop(); if (sc[i] == null)
            sc[i] = 0; i++; show(); });
    };
    show();
    refreshMics();
}
/* ---------- Writing: menjawab pertanyaan berdasarkan situasi ---------- */
function tulisSituasi() {
    $("#app").innerHTML = `<a class="crumb" href="#tulis">← Writing Lab</a><div class="lhead"><h1>Menjawab pertanyaan sesuai situasi</h1><div class="goal">Baca situasinya, lalu tulis jawaban 1 sampai 2 kalimat dalam bahasa Jerman. Jawabanmu dicek isinya, tata bahasa, ejaan, huruf besar, dan susunan katanya.</div></div><div class="quiz" id="sbox"></div>`;
    const items = shuffle(WQ);
    let i = 0;
    const sc = [];
    const show = () => {
        const box = $("#sbox");
        if (i >= items.length) {
            const pct = Math.round(sc.reduce((a, b) => a + (b || 0), 0) / items.length);
            box.innerHTML = `<div class="score">${pct}%</div><p style="margin:10px 0 0">Rata-rata skor jawaban.</p><div class="row"><button class="btn" id="sre" type="button">Ulangi</button><a class="btn alt" href="#tulis-pesan">Lanjut: pesan dan surel</a></div>`;
            logRes("schreiben", 0, pct, "Menjawab pertanyaan situasi");
            $("#sre").addEventListener("click", tulisSituasi);
            return;
        }
        const it = items[i];
        box.innerHTML = `<div class="qmeta"><span>Situasi ${i + 1} dari ${items.length}</span><span>Bab ${it.b}</span></div><p style="margin:0">${escH(it.sit)}</p><div class="qtext">“${escH(it.q)}” <button class="spk sm" data-say="${esc(it.q)}" aria-label="Dengar pertanyaan">${SPK}</button></div><textarea class="inp ta" id="sin" rows="2" spellcheck="false" aria-label="Jawabanmu"></textarea>${UMLAUT}<div class="row"><button class="btn" id="sgo" type="button">Periksa</button><button class="btn alt" id="snx" type="button">${i < items.length - 1 ? "Berikutnya" : "Lihat hasil"}</button></div><div id="sres" aria-live="polite"></div>`;
        wireSpk(box);
        const ta = box.querySelector("#sin");
        wireUml(box, ta);
        box.querySelector("#sgo").addEventListener("click", () => {
            const t = ta.value.trim();
            if (!t)
                return;
            const r = evalAns(t, it.k), iss = grammarScan(t, false);
            const lang = Math.max(0, 100 - 20 * iss.filter(x => !/umlaut/.test(x.why)).length);
            sc[i] = Math.round(r.pct * 0.6 + lang * 0.4);
            box.querySelector("#sres").innerHTML = `<div class="spkres"><p style="margin:0"><b>Skor: ${sc[i]}%</b> (isi 60%, bahasa 40%)</p><ul class="chkl">${r.r.map(x => `<li class="${x.ok ? "y" : "n"}">${x.ok ? "✓" : "✗"} ${escH(x.lab)}</li>`).join("")}<li class="${r.words >= 3 ? "y" : "n"}">${r.words >= 3 ? "✓" : "✗"} kalimat lengkap (minimal 3 kata)</li></ul>${issuesHTML(iss)}<p style="margin:6px 0 0">Contoh jawaban: <span class="de">${escH(it.m)}</span><br><span class="note">Artinya: ${escH(it.mid)}</span></p></div>`;
        });
        box.querySelector("#snx").addEventListener("click", () => { i++; show(); });
    };
    show();
}
/* ---------- Progres: materi dikuasai / belum, catatan perkembangan ---------- */
function masteryLists() {
    const done = [], todo = [];
    L.forEach((l, i) => {
        const b = i + 1, c = chapterProg(b);
        const lab = `<a href="#b${b}">Bab ${b}: ${l.t}</a>`;
        if (store.done[b] && c.pct >= 60)
            done.push(`${lab} <span class="note">(${c.pct}%)</span>`);
        else if (store.placed[b] && !store.done[b])
            done.push(`${lab} <span class="note">(lewat tes penempatan)</span>`);
        else if (store.seen[b] || store.best[b] != null)
            todo.push(`${lab} <span class="note">(${store.best[b] != null ? "kuis terbaik " + store.best[b] + "%" : "belum ikut kuis"}, progres ${c.pct}%)</span>`);
    });
    GR.forEach(g => { const v = store.gbest[g.id]; if (v == null)
        return; (v >= 70 ? done : todo).push(`<a href="#tata-${g.id}">${g.t}</a> <span class="note">(latihan terbaik ${v}%)</span>`); });
    const hard = CARDS.filter(isHard).slice(0, 12);
    return { done, todo, hard };
}
function progressNote() {
    const now = Date.now(), wk = 7 * 864e5, cur = store.log.filter(e => e.p != null && e.t > now - wk), prev = store.log.filter(e => e.p != null && e.t <= now - wk && e.t > now - 2 * wk);
    const avg = a => a.length ? Math.round(a.reduce((x, e) => x + e.p, 0) / a.length) : null, a1 = avg(cur), a0 = avg(prev);
    if (!cur.length)
        return "Belum ada latihan bernilai dalam 7 hari terakhir.";
    return `Dalam 7 hari terakhir kamu mengerjakan ${cur.length} latihan bernilai dengan rata-rata ${a1}%` + (a0 != null ? ` (7 hari sebelumnya: ${prev.length} latihan, rata-rata ${a0}%; ${a1 > a0 ? "naik " + (a1 - a0) + " poin" : a1 < a0 ? "turun " + (a0 - a1) + " poin" : "stabil"})` : "") + `. Bab selesai: ${doneCount()} dari 12.`;
}
/* ---------- Akun: Supabase (email + kata sandi) ---------- */
const BASEKEY = "mein-deutsch-a1", AUTHKEY = "mein-deutsch-a1-auth", FLAGKEY = "mein-deutsch-a1-start";
const CFG = window.MD_CONFIG || {};
const Supa = { url: String(CFG.supabaseUrl || "").trim().replace(/\/+$/, ""), key: String(CFG.supabaseAnonKey || "").trim(), sess: null,
    on() { return !!(this.url && this.key && /^https?:\/\//.test(this.url)) && !window.claude && typeof fetch === "function"; },
    loadSess() { try {
        this.sess = JSON.parse(localStorage.getItem(AUTHKEY) || "null");
    }
    catch (e) {
        this.sess = null;
    } if (this.sess && !this.sess.uid)
        this.sess = null; },
    saveSess(x) { this.sess = x; try {
        if (x)
            localStorage.setItem(AUTHKEY, JSON.stringify(x));
        else
            localStorage.removeItem(AUTHKEY);
    }
    catch (e) { } },
    async req(path, opt) {
        opt = opt || {};
        let r;
        try {
            r = await fetch(this.url + path, { method: opt.method || "GET", body: opt.body, headers: Object.assign({ apikey: this.key, "Content-Type": "application/json" }, opt.headers || {}) });
        }
        catch (e) {
            throw { status: 0, code: "network", msg: "Tidak bisa terhubung ke server akun. Periksa koneksi internet." };
        }
        const txt = await r.text();
        let j = null;
        try {
            j = txt ? JSON.parse(txt) : null;
        }
        catch (e) { }
        if (!r.ok)
            throw { status: r.status, code: (j && (j.error_code || j.code || j.error)) || r.status, msg: String((j && (j.msg || j.error_description || j.message || j.error)) || ("HTTP " + r.status)) };
        return j;
    },
    sessFrom(j) { if (!j || !j.access_token)
        return null; const u = j.user || {}; return { at: j.access_token, rt: j.refresh_token, exp: Date.now() + ((j.expires_in || 3600) - 60) * 1000, uid: u.id, email: u.email || "", name: (u.user_metadata && u.user_metadata.name) || "" }; },
    async signUp(email, pw, name) { const j = await this.req("/auth/v1/signup", { method: "POST", body: JSON.stringify({ email, password: pw, data: { name } }) }); const x = this.sessFrom(j); if (x)
        this.saveSess(x); return x; },
    async signIn(email, pw) { const x = this.sessFrom(await this.req("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email, password: pw }) })); if (!x)
        throw { msg: "Server tidak mengirim sesi." }; this.saveSess(x); return x; },
    async refresh() { if (!this.sess || !this.sess.rt)
        throw { status: 401, msg: "Sesi berakhir." }; const x = this.sessFrom(await this.req("/auth/v1/token?grant_type=refresh_token", { method: "POST", body: JSON.stringify({ refresh_token: this.sess.rt }) })); if (!x)
        throw { status: 401, msg: "Sesi berakhir." }; this.saveSess(Object.assign({}, this.sess, x, { name: x.name || this.sess.name })); return this.sess; },
    async authed(path, opt) {
        if (!this.sess)
            throw { status: 401, msg: "Belum masuk." };
        if (Date.now() > this.sess.exp)
            await this.refresh();
        const go = () => this.req(path, Object.assign({}, opt, { headers: Object.assign({ Authorization: "Bearer " + this.sess.at }, (opt && opt.headers) || {}) }));
        try {
            return await go();
        }
        catch (e) {
            if (e.status === 401) {
                await this.refresh();
                return await go();
            }
            throw e;
        }
    },
    async recover(email) { await this.req("/auth/v1/recover", { method: "POST", body: JSON.stringify({ email }) }); },
    async signOut() { const at = this.sess && this.sess.at; this.saveSess(null); if (at) {
        try {
            await this.req("/auth/v1/logout", { method: "POST", headers: { Authorization: "Bearer " + at } });
        }
        catch (e) { }
    } },
    backend() {
        const uid = this.sess.uid;
        return { name: "supa",
            get: async () => { const j = await this.authed("/rest/v1/progress?user_id=eq." + encodeURIComponent(uid) + "&select=data,updated_at"); return j && j[0] ? j[0].data : null; },
            set: async (obj) => { await this.authed("/rest/v1/progress?on_conflict=user_id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify([{ user_id: uid, data: obj, updated_at: new Date().toISOString() }]) }); } };
    } };
function authMsg(e) {
    const m = String((e && e.msg) || "");
    if (e && e.code === "network")
        return e.msg;
    if (/invalid login credentials|invalid_credentials/i.test(m))
        return "Email atau kata sandi salah.";
    if (/already registered|user_already_exists|already been registered/i.test(m))
        return "Email ini sudah terdaftar. Silakan masuk.";
    if (/not confirmed|email_not_confirmed/i.test(m))
        return "Email belum dikonfirmasi. Buka email dari Supabase dan klik tautan konfirmasinya, lalu masuk.";
    if (/password.*(6|short|weak)|weak_password/i.test(m))
        return "Kata sandi minimal 6 karakter.";
    if (/invalid.*email|email_address_invalid|validate email/i.test(m))
        return "Format email tidak valid.";
    if (e && e.status === 429 || /rate limit/i.test(m))
        return "Terlalu banyak percobaan. Tunggu beberapa menit lalu coba lagi.";
    if (e && e.status === 404 || /relation .*progress|does not exist/i.test(m))
        return "Tabel progres belum dibuat di Supabase. Jalankan kode SQL di README.";
    return "Gagal: " + (m || "terjadi kesalahan") + ".";
}
const flagGet = () => { try {
    return localStorage.getItem(FLAGKEY) || "";
}
catch (e) {
    return "";
} }, flagSet = v => { try {
    localStorage.setItem(FLAGKEY, v);
}
catch (e) { } };
function storeKeyFor(x) { return x ? BASEKEY + ":u:" + x.uid : BASEKEY; }
function switchStore() { KEY = storeKeyFor(Supa.sess); store = ensureStore(load()); updateProg(); }
function needGate() { return Supa.on() ? !Supa.sess && !flagGet() : !flagGet(); }
const guestSummary = () => { let g = null; try {
    g = JSON.parse(localStorage.getItem(BASEKEY) || "null");
}
catch (e) { } if (!g)
    return null; g = ensureStore(g); const n = Object.keys(g.done).filter(k => g.done[k]).length, m = g.log.length; return n || m ? { g, n, m } : null; };
let pendingImport = false;
async function afterLogin() {
    switchStore();
    Sync.stop();
    await Sync.start(Supa.backend());
    const gs = guestSummary();
    pendingImport = !!(gs && gs.m && store.log.length < gs.m);
    flagSet("1");
    location.hash = "akun";
    route();
}
async function logout() { try {
    if (Sync.be) {
        clearTimeout(Sync.timer);
        await Sync.push();
    }
}
catch (e) { } Sync.stop(); await Supa.signOut(); switchStore(); try {
    localStorage.removeItem(FLAGKEY);
}
catch (e) { } notice("Kamu sudah keluar"); location.hash = ""; route(); }
function authForm(box, mode) {
    box.innerHTML = `<div class="seg" role="group" aria-label="Masuk atau daftar"><button type="button" data-m="in" aria-pressed="${mode === "in"}">Masuk</button><button type="button" data-m="up" aria-pressed="${mode === "up"}">Daftar</button></div>
  <form id="af" class="aform" novalidate>${mode === "up" ? `<label class="fl"><span>Nama</span><input class="inp" id="an" autocomplete="name" maxlength="60" placeholder="Nama panggilan"></label>` : ""}
  <label class="fl"><span>Email</span><input class="inp" id="ae" type="email" autocomplete="email" required placeholder="nama@email.com"></label>
  <label class="fl"><span>Kata sandi</span><input class="inp" id="ap" type="password" autocomplete="${mode === "up" ? "new-password" : "current-password"}" required minlength="6" placeholder="minimal 6 karakter"></label>
  ${mode === "up" ? `<label class="fl"><span>Ulangi kata sandi</span><input class="inp" id="ap2" type="password" autocomplete="new-password" required minlength="6"></label>` : ""}
  <label class="showpw"><input type="checkbox" id="asp"> Tampilkan kata sandi</label>
  <div class="row"><button class="btn" id="ago" type="submit">${mode === "up" ? "Daftar" : "Masuk"}</button>${mode === "in" ? `<button class="btn alt" id="arec" type="button">Lupa kata sandi?</button>` : ""}</div>
  <div id="amsg" aria-live="polite"></div></form>`;
    box.querySelectorAll("[data-m]").forEach(b => b.addEventListener("click", () => authForm(box, b.dataset.m)));
    const msg = (t, ok) => { box.querySelector("#amsg").innerHTML = t ? `<div class="fb ${ok ? "ok" : "no"}">${t}</div>` : ""; };
    box.querySelector("#asp").addEventListener("change", e => box.querySelectorAll("input[type=password],input[data-pw]").forEach(i => { i.type = e.target.checked ? "text" : "password"; i.setAttribute("data-pw", "1"); }));
    box.querySelector("#af").addEventListener("submit", async (ev) => {
        ev.preventDefault();
        const em = box.querySelector("#ae").value.trim(), pw = box.querySelector("#ap").value;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
            msg("Format email tidak valid.");
            return;
        }
        if (pw.length < 6) {
            msg("Kata sandi minimal 6 karakter.");
            return;
        }
        if (mode === "up" && pw !== box.querySelector("#ap2").value) {
            msg("Kedua kata sandi tidak sama.");
            return;
        }
        const btn = box.querySelector("#ago");
        btn.disabled = true;
        btn.textContent = mode === "up" ? "Mendaftar..." : "Masuk...";
        msg("");
        try {
            if (mode === "up") {
                const x = await Supa.signUp(em, pw, (box.querySelector("#an").value || "").trim());
                if (!x) {
                    msg("Pendaftaran berhasil. Cek emailmu dan klik tautan konfirmasi, lalu masuk dengan email dan kata sandi ini.", true);
                    btn.disabled = false;
                    btn.textContent = "Daftar";
                    return;
                }
            }
            else
                await Supa.signIn(em, pw);
            notice("Berhasil masuk");
            await afterLogin();
        }
        catch (e) {
            msg(authMsg(e));
            btn.disabled = false;
            btn.textContent = mode === "up" ? "Daftar" : "Masuk";
        }
    });
    const rc = box.querySelector("#arec");
    if (rc)
        rc.addEventListener("click", async () => {
            const em = box.querySelector("#ae").value.trim();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
                msg("Isi email dulu, lalu tekan Lupa kata sandi.");
                return;
            }
            rc.disabled = true;
            try {
                await Supa.recover(em);
                msg("Jika email terdaftar, tautan untuk mengatur ulang kata sandi sudah dikirim. Cek kotak masuk dan folder spam.", true);
            }
            catch (e) {
                msg(authMsg(e));
            }
            rc.disabled = false;
        });
}
function masuk() {
    const app = $("#app");
    app.innerHTML = `<section class="login"><div class="lcard"><span class="tag">Selamat datang</span><h1>Mein Deutsch <span>A1</span></h1>
  <p class="lead">Belajar bahasa Jerman dari nol sampai siap ujian A1. ${Supa.on() ? "Masuk atau daftar agar progresmu tersimpan di akun dan bisa dilanjutkan dari perangkat lain." : ""}</p>
  ${window.claude ? `<div class="goal">Kamu membuka website ini lewat claude.ai. Saat kamu masuk ke claude.ai, progres otomatis disimpan ke akun Claude-mu, jadi tidak perlu login lagi di sini.</div><div class="row"><button class="btn" id="gstart" type="button">Mulai belajar</button></div>`
        : Supa.on() ? `<div id="abox"></div><div class="divider"><span>atau</span></div><div class="row"><button class="btn alt" id="gguest" type="button">Lanjut tanpa akun</button></div><p class="note">Tanpa akun, progres hanya tersimpan di browser ini. Kamu bisa masuk kapan saja lewat tombol <b>Akun</b> di kanan atas; progres tanpa akun bisa dipindahkan ke akunmu.</p>`
            : `<div class="goal warnbox"><b>Login online belum diaktifkan di website ini.</b><br>Pemilik website perlu mengisi alamat dan kunci Supabase di <code>js/config.js</code> (panduan di README). Sampai saat itu, progres disimpan di browser ini dan bisa dicadangkan dari Dashboard.</div><div class="row"><button class="btn" id="gguest" type="button">Mulai belajar tanpa akun</button></div>`}
  </div></section>`;
    const ab = $("#abox");
    if (ab)
        authForm(ab, "in");
    const gg = $("#gguest");
    if (gg)
        gg.addEventListener("click", () => { flagSet("guest"); route(); });
    const gs = $("#gstart");
    if (gs)
        gs.addEventListener("click", () => { flagSet("1"); route(); });
}
function akun() {
    const app = $("#app");
    if (window.claude) {
        app.innerHTML = `<div class="lhead"><h1>Akun</h1><div class="goal">Kamu membuka website lewat claude.ai. Progres disimpan ke akun Claude-mu saat kamu masuk ke claude.ai.</div></div><p class="note" id="syncst">${syncText()}</p>`;
        return;
    }
    if (!Supa.on()) {
        app.innerHTML = `<div class="lhead"><h1>Akun</h1></div><div class="goal warnbox"><b>Login online belum diaktifkan.</b><br>Isi <code>supabaseUrl</code> dan <code>supabaseAnonKey</code> di <code>js/config.js</code> (lihat README). Sementara itu progres tersimpan di browser ini; gunakan cadangan di <a href="#progres">Dashboard</a> untuk memindahkannya.</div>`;
        return;
    }
    if (!Supa.sess) {
        app.innerHTML = `<div class="lhead"><h1>Akun</h1><div class="goal">Masuk atau daftar agar progres tersimpan di akun dan bisa dibuka dari perangkat lain. Progres yang sudah kamu kerjakan tanpa akun bisa dipindahkan setelah masuk.</div></div><div class="quiz" id="abox"></div>`;
        authForm($("#abox"), "in");
        return;
    }
    if (Sync.state === "off" && Sync.be && Sync.be.name === "supa") {
        app.innerHTML = `<div class="lhead"><h1>Akun</h1><div class="goal warnbox">Sesi untuk <b>${escH(Supa.sess.email)}</b> sudah berakhir. Masuk lagi untuk melanjutkan sinkronisasi; progres di browser ini tetap aman dan akan digabung.</div></div><div class="quiz" id="abox"></div><div class="row"><button class="btn alt" id="aout" type="button">Keluar</button></div>`;
        authForm($("#abox"), "in");
        const e = $("#ae");
        if (e)
            e.value = Supa.sess.email;
        $("#aout").addEventListener("click", logout);
        return;
    }
    const x = Supa.sess, gs = guestSummary();
    app.innerHTML = `<div class="lhead"><h1>Akun</h1></div>
  <div class="stats"><div class="stat"><b>${escH(x.name || x.email.split("@")[0])}</b><span>${escH(x.email)}</span></div><div class="stat"><b>${doneCount()}/12</b><span>bab selesai di akun ini</span></div><div class="stat"><b>${store.log.filter(e => e.p != null).length}</b><span>latihan dinilai</span></div></div>
  <section class="blk"><h2>Sinkronisasi</h2><p id="syncst">${syncText()}</p><div class="row"><button class="btn alt" id="asy" type="button">Sinkronkan sekarang</button><button class="btn alt" id="aout" type="button">Keluar</button></div></section>
  ${gs && (pendingImport || gs.m) ? `<section class="blk"><h2>Progres tanpa akun di perangkat ini</h2><p>Ditemukan progres yang dikerjakan sebelum masuk: ${gs.n} bab selesai, ${gs.m} aktivitas tercatat.</p><div class="row"><button class="btn" id="aimp" type="button">Gabungkan ke akun ini</button></div><p class="note">Penggabungan menyimpan nilai terbaik dari keduanya dan tidak menghapus apa pun di akunmu.</p></section>` : ""}
  <section class="blk"><h2>Keamanan</h2><p class="note">Kata sandi dikelola oleh Supabase, bukan disimpan di website ini. Untuk mengganti kata sandi, keluar lalu pilih “Lupa kata sandi?” di halaman masuk. Jika memakai perangkat bersama, tekan Keluar setelah selesai belajar.</p></section>`;
    $("#asy").addEventListener("click", async () => { if (Sync.state === "off") {
        Sync.stop();
        await Sync.start(Supa.backend());
    }
    else {
        clearTimeout(Sync.timer);
        await Sync.push();
    } notice(Sync.state === "ok" ? "Progres tersinkron" : "Sinkronisasi belum berhasil"); akun(); });
    $("#aout").addEventListener("click", logout);
    const im = $("#aimp");
    if (im)
        im.addEventListener("click", () => { const g = guestSummary(); if (!g)
            return; store = mergeStore(store, g.g); save(store); pendingImport = false; try {
            localStorage.removeItem(BASEKEY);
        }
        catch (e) { } notice("Progres tanpa akun digabungkan ke akunmu"); updateProg(); akun(); });
}
function updAcct() {
    const a = document.getElementById("acct");
    if (!a)
        return;
    if (window.claude) {
        a.hidden = true;
        return;
    }
    a.hidden = false;
    if (Supa.sess) {
        a.textContent = (Supa.sess.name || Supa.sess.email.split("@")[0]).slice(0, 14) + (Sync.state === "ok" ? " ✓" : "");
        a.title = "Akun: " + Supa.sess.email;
    }
    else {
        a.textContent = "Masuk";
        a.title = Supa.on() ? "Masuk atau daftar" : "Akun";
    }
}
Supa.loadSess();
if (Supa.on() && Supa.sess) {
    switchStore();
    Sync.start(Supa.backend());
}
/* ---------- Kapabilitas Claude: audio, akun ---------- */
(function () {
    const c = window.claude;
    if (!c || !c.use)
        return;
    Promise.all([c.use("db"), c.use("user")]).then(([db, u]) => Sync.init(db, u)).catch(() => { });
    c.use("tts").then(t => { if (!t)
        return; AU.cl = t; try {
        t.onState(e => { AU.clState = e.state; });
    }
    catch (_) { } try {
        t.onLine(e => { if (AU.lineCb)
            AU.lineCb(+e.id); });
    }
    catch (_) { } const app = $("#app"); if (app)
        app.classList.toggle("nospeech", !hasAudio()); }).catch(() => { });
})();
/* =====================================================================
   BUKU BELAJAR INTERAKTIF: header, laci navigasi, pencarian, breadcrumb,
   buku (flipbook) berisi materi bab yang asli, daftar 12 bab, beranda ringkas,
   dan tab bagian untuk halaman yang panjang.
   ===================================================================== */
const IC = n => `<svg class="ic" aria-hidden="true"><use href="#i-${n}" xlink:href="#i-${n}"/></svg>`;
const NAVG = { home: null, main: "Main & belajar", jalur: "Main & belajar", buku: "Belajarku", babs: "Belajarku", bab: "Belajarku", kamus: "Alat belajar", kartu: "Alat belajar", tata: "Alat belajar", pola: "Alat belajar",
    dengar: "Latihan", baca: "Latihan", tulis: "Latihan", bicara: "Latihan", dialog: "Latihan", tes: "Latihan", latihan: "Latihan", rencana: "Ruang saya", progres: "Ruang saya", akun: "Ruang saya" };
const NAVR = { main: ["#main", "Main & belajar"], jalur: ["#jalur", "Perjalanan 12 bab"], babs: ["#babs", "12 bab"], bab: ["#babs", "12 bab"], buku: ["#babs", "12 bab"], kamus: ["#kamus", "Kamus kosakata"], kartu: ["#kartu", "Kartu kosakata"], tata: ["#tata", "Tata bahasa"], pola: ["#pola", "Pola kalimat"],
    dengar: ["#dengar", "Mendengar"], baca: ["#baca", "Membaca"], tulis: ["#tulis", "Menulis"], bicara: ["#bicara", "Berbicara"], dialog: ["#dialog", "Dialog"], tes: ["#tes", "Ujian & tes"], latihan: ["#latihan", "Latihan campuran"],
    rencana: ["#rencana", "Rencana belajar"], progres: ["#progres", "Progres saya"], akun: ["#akun", "Akun"] };
const curView = () => document.body.getAttribute("data-view") || "home";
const isWide = () => !!(window.matchMedia && matchMedia("(min-width: 900px)").matches);
const isPinLayout = () => !!(window.matchMedia && matchMedia("(min-width: 1200px)").matches);
/* ---------- Laci navigasi ---------- */
const Drawer = { open: false, last: null,
    set(on, focus) {
        this.open = on;
        const b = document.body, btn = $("#menuBtn"), dr = $("#drawer");
        if (!dr)
            return;
        b.classList.toggle("dr-open", on);
        btn.setAttribute("aria-expanded", String(on));
        btn.setAttribute("aria-label", on ? "Tutup menu navigasi" : "Buka menu navigasi");
        if (on) {
            dr.removeAttribute("inert");
            dr.setAttribute("aria-hidden", "false");
            if (focus !== false) {
                this.last = document.activeElement;
                const a = dr.querySelector("a[aria-current]") || dr.querySelector("a");
                setTimeout(() => a && a.focus(), 30);
            }
        }
        else {
            dr.setAttribute("inert", "");
            dr.setAttribute("aria-hidden", "true");
            if (focus !== false && this.last && this.last.focus)
                this.last.focus();
        }
        try {
            localStorage.setItem("md-drawer", on && isPinLayout() ? "1" : "");
        }
        catch (e) { }
    },
    init() {
        var _a, _b;
        const dr = $("#drawer");
        if (!dr)
            return;
        $("#menuBtn").addEventListener("click", () => this.set(!this.open));
        $("#drawerClose").addEventListener("click", () => this.set(false));
        $("#scrim").addEventListener("click", () => this.set(false));
        dr.querySelectorAll("a").forEach(a => a.addEventListener("click", () => { if (!isPinLayout())
            this.set(false, false); }));
        dr.addEventListener("keydown", e => {
            if (e.key === "Escape") {
                e.preventDefault();
                this.set(false);
                return;
            }
            if (e.key === "Tab" && !isPinLayout()) {
                const f = [...dr.querySelectorAll("a,button")];
                const i = f.indexOf(document.activeElement);
                if (e.shiftKey && i <= 0) {
                    e.preventDefault();
                    f[f.length - 1].focus();
                }
                else if (!e.shiftKey && i === f.length - 1) {
                    e.preventDefault();
                    f[0].focus();
                }
            }
            if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                const f = [...dr.querySelectorAll("nav a")];
                const i = f.indexOf(document.activeElement);
                if (i < 0)
                    return;
                e.preventDefault();
                f[(i + (e.key === "ArrowDown" ? 1 : -1) + f.length) % f.length].focus();
            }
        });
        let pinned = "";
        try {
            pinned = localStorage.getItem("md-drawer") || "";
        }
        catch (e) { }
        this.set(!!pinned && isPinLayout(), false);
        if (window.matchMedia)
            (_b = (_a = matchMedia("(min-width: 1200px)")).addEventListener) === null || _b === void 0 ? void 0 : _b.call(_a, "change", () => { if (!isPinLayout() && this.open)
                this.set(false, false); });
    } };
/* ---------- Pencarian ---------- */
const Search = { idx: null, sel: 0, items: [],
    build() {
        const I = [];
        const pages = [["#", "Beranda", "Halaman utama"], ["#buku", "Buku belajarku", "Buka buku di halaman terakhir"], ["#babs", "12 bab", "Daftar isi buku"], ["#main", "Main & belajar", "XP, misi harian, lencana"], ["#main-cocok", "Cocokkan kata", "Permainan kosakata"], ["#main-kuis", "Kuis 5 soal", "Kuis cepat"], ["#jalur", "Perjalanan 12 bab", "Bintang per bab"], ["#kamus", "Kamus kosakata", "Cari kata"], ["#kartu", "Kartu kosakata", "Pengulangan berjarak"], ["#tata", "Tata bahasa", "Grammar Center"], ["#pola", "Pola kalimat", "Rumus dan contoh"], ["#dengar", "Mendengar", "Listening Lab"], ["#baca", "Membaca", "Bacaan"], ["#tulis", "Menulis", "Writing Lab"], ["#bicara", "Berbicara", "Speaking Lab"], ["#dialog", "Dialog", "Percakapan per bab"], ["#tes", "Ujian & tes", "Simulasi ujian A1"], ["#penempatan", "Tes penempatan", "24 soal"], ["#latihan", "Latihan campuran", "10 soal acak"], ["#rencana", "Rencana belajar", "Study planner"], ["#progres", "Progres saya", "Dashboard"], ["#akun", "Akun", "Masuk, sinkronisasi"]];
        pages.forEach(([h, t, s]) => I.push({ h, t, s, k: "Menu" }));
        L.forEach((l, i) => I.push({ h: "#b" + (i + 1), t: "Bab " + (i + 1) + ": " + l.t, s: l.sub, k: "Bab" }));
        if (typeof GR !== "undefined")
            GR.forEach(g => I.push({ h: "#tata-" + g.id, t: g.t, s: g.sub || "", k: "Tata bahasa" }));
        if (typeof RD !== "undefined")
            RD.forEach((r, i) => I.push({ h: "#r" + (i + 1), t: r.t, s: r.sub || "", k: "Bacaan" }));
        if (typeof HR !== "undefined")
            HR.forEach((r, i) => I.push({ h: "#dengar-" + (i + 1), t: r.t, s: r.sub || "", k: "Mendengar" }));
        if (typeof HRI !== "undefined")
            HRI.forEach((r, i) => I.push({ h: "#dengar-info-" + (i + 1), t: r.t, s: r.focus || "", k: "Mendengar" }));
        if (typeof DLG !== "undefined")
            DLG.forEach((r, i) => I.push({ h: "#d" + (i + 1), t: r.t, s: r.sub || "", k: "Dialog" }));
        if (typeof DICT !== "undefined")
            DICT.forEach(d => I.push({ h: "#kamus", t: d.de, s: d.ar, k: "Kata", q: d.de }));
        I.forEach(x => x.n = normA(x.t + " " + x.s));
        this.idx = I;
    },
    open() { if (!this.idx)
        this.build(); const s = $("#srch"); s.hidden = false; document.body.classList.add("srch-on"); const q = $("#srchQ"); q.value = ""; this.draw(""); setTimeout(() => q.focus(), 20); },
    close() { $("#srch").hidden = true; document.body.classList.remove("srch-on"); const b = $("#searchBtn"); if (b)
        b.focus(); },
    draw(v) {
        const q = normA(v.trim());
        const r = $("#srchR");
        if (!q) {
            this.items = this.idx.filter(x => x.k === "Menu").slice(0, 8);
        }
        else {
            const words = q.split(/\s+/);
            const sc = x => { const t = normA(x.t), bare = t.replace(/^(der|die|das|bab \d+:)\s+/, ""); return (bare === q || t === q ? 4 : 0) + (bare.startsWith(q) ? 2 : 0) + (t.includes(q) ? 1 : 0) + (x.k === "Menu" ? .5 : 0); };
            this.items = this.idx.filter(x => words.every(w => x.n.includes(w))).map(x => [sc(x), x]).sort((a, b) => b[0] - a[0]).map(y => y[1]).slice(0, 24);
        }
        this.sel = 0;
        r.innerHTML = this.items.length ? this.items.map((x, i) => `<li role="option" id="sr${i}" aria-selected="${i === 0}"><a href="${x.h}" data-i="${i}"${x.q ? ` data-q="${esc(x.q)}"` : ""}><span class="sk">${x.k}</span><b>${escH(x.t)}</b><span class="note">${escH(x.s)}</span></a></li>`).join("") : `<li class="empty note">Tidak ditemukan. Coba kata lain, misalnya "Bahnhof", "akusatif", atau "bab 5".</li>`;
        $("#srchQ").setAttribute("aria-activedescendant", this.items.length ? "sr0" : "");
    },
    move(d) {
        if (!this.items.length)
            return;
        this.sel = (this.sel + d + this.items.length) % this.items.length;
        $("#srchR").querySelectorAll("li[role=option]").forEach((li, i) => li.setAttribute("aria-selected", String(i === this.sel)));
        $("#srchQ").setAttribute("aria-activedescendant", "sr" + this.sel);
        const el = $("#sr" + this.sel);
        if (el && el.scrollIntoView)
            el.scrollIntoView({ block: "nearest" });
    },
    go(x) { if (!x)
        return; if (x.q && typeof dq !== "undefined") {
        dq = x.q;
        dcat = "";
        dbab = 0;
        dflt = "all";
    } this.close(); if (location.hash === x.h || (x.h === "#" && !location.hash))
        route();
    else
        location.hash = x.h; },
    init() {
        const s = $("#srch");
        if (!s)
            return;
        $("#searchBtn").addEventListener("click", () => this.open());
        $("#srchX").addEventListener("click", () => this.close());
        s.addEventListener("click", e => { if (e.target === s)
            this.close(); });
        $("#srchQ").addEventListener("input", e => this.draw(e.target.value));
        $("#srchQ").addEventListener("keydown", e => { if (e.key === "ArrowDown") {
            e.preventDefault();
            this.move(1);
        }
        else if (e.key === "ArrowUp") {
            e.preventDefault();
            this.move(-1);
        }
        else if (e.key === "Enter") {
            e.preventDefault();
            this.go(this.items[this.sel]);
        }
        else if (e.key === "Escape") {
            e.preventDefault();
            this.close();
        } });
        $("#srchR").addEventListener("click", e => { const a = e.target.closest("a[data-i]"); if (!a)
            return; e.preventDefault(); this.go(this.items[+a.dataset.i]); });
        s.addEventListener("keydown", e => { if (e.key === "Escape") {
            e.preventDefault();
            this.close();
        } if (e.key === "Tab") {
            const f = [...s.querySelectorAll("input,button,a")];
            const i = f.indexOf(document.activeElement);
            if (e.shiftKey && i <= 0) {
                e.preventDefault();
                f[f.length - 1].focus();
            }
            else if (!e.shiftKey && i === f.length - 1) {
                e.preventDefault();
                f[0].focus();
            }
        } });
        document.addEventListener("keydown", e => { if (e.key === "/" && !e.target.closest("input,textarea,select,[contenteditable]") && $("#srch").hidden) {
            e.preventDefault();
            this.open();
        } });
    } };
/* ---------- Breadcrumb & tab bagian (dipasang otomatis setelah setiap tampilan dirender) ---------- */
const SECGROUP = {
    progres: [["Ringkasan", /^(Cap paspor|Rekomendasi|Hasil tes penempatan|Catatan perkembangan)/], ["Materi", /^(Materi|Progres setiap bab|Kosakata yang dikuasai)/], ["Keterampilan", /^(Empat kemampuan|Nilai per jenis|Evaluasi kemampuan|Menit belajar)/], ["Riwayat", /^(Riwayat|Hasil tes cepat)/], ["Data & cadangan", /./]],
    rencana: [["Target", /^(Target belajar|Pencapaian target|Evaluasi pencapaian)/], ["Jadwal", /^(Jadwal mingguan|Rekomendasi)/], ["Checklist", /^Checklist/], ["Pengingat", /./]]
};
const secMem = {};
function addCrumb(app, v) {
    const g = NAVG[v];
    if (!g)
        return;
    const r = NAVR[v], h = location.hash || "#";
    const h1 = app.querySelector("h1");
    const title = h1 ? h1.textContent.trim() : "";
    let html = `<a href="#">Beranda</a><span aria-hidden="true">›</span><span>${g}</span>`;
    if (r) {
        const atRoot = h === r[0] || (v === "buku") || title === r[1];
        if (atRoot && v !== "bab")
            html += `<span aria-hidden="true">›</span><span aria-current="page">${r[1]}</span>`;
        else {
            html += `<span aria-hidden="true">›</span><a href="${r[0]}">${r[1]}</a>`;
            if (title)
                html += `<span aria-hidden="true">›</span><span aria-current="page">${escH(title)}</span>`;
        }
    }
    const nav = document.createElement("nav");
    nav.className = "bc";
    nav.setAttribute("aria-label", "Lokasi halaman");
    nav.innerHTML = html;
    app.insertBefore(nav, app.firstChild);
}
function addSecTabs(app, v) {
    const secs = [...app.children].filter(x => x.matches("section.blk"));
    if (secs.length < 3)
        return;
    if (!SECGROUP[v] && app.scrollHeight < innerHeight * 1.5)
        return;
    const groups = [];
    const pre = [];
    let started = false;
    [...app.children].forEach(el => {
        if (el.classList.contains("bc") || el.classList.contains("lhead"))
            return;
        if (!el.matches("section.blk")) {
            if (!started) {
                pre.push(el);
                return;
            }
            groups[groups.length - 1].els.push(el);
            return;
        }
        started = true;
        const t = (el.querySelector("h2") || {}).textContent || "Bagian";
        let name = t;
        if (SECGROUP[v]) {
            const m = SECGROUP[v].find(([n, re]) => re.test(t.trim()));
            name = m ? m[0] : t;
        }
        let g = groups.find(x => x.name === name);
        if (!g) {
            g = { name, els: [] };
            groups.push(g);
        }
        g.els.push(el);
    });
    if (v === "progres" && pre.length) {
        const g0 = groups.find(x => x.name === "Ringkasan");
        if (g0)
            g0.els = pre.concat(g0.els);
    }
    else if (pre.length) {
        groups.unshift({ name: "Ringkasan", els: pre });
    }
    if (groups.length < 2)
        return;
    const key = location.hash || v;
    const want = secMem[key] || 0;
    const bar = document.createElement("div");
    bar.className = "sectabs";
    bar.setAttribute("role", "tablist");
    bar.setAttribute("aria-label", "Bagian halaman");
    const anchor = app.querySelector(":scope > .lhead") || app.querySelector(":scope > .bc");
    if (anchor && anchor.nextSibling)
        app.insertBefore(bar, anchor.nextSibling);
    else
        app.appendChild(bar);
    let after = bar;
    groups.forEach((g, i) => {
        const id = "sp" + i;
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("role", "tab");
        b.id = "st" + i;
        b.setAttribute("aria-controls", id);
        b.textContent = g.name;
        bar.appendChild(b);
        const p = document.createElement("div");
        p.className = "secpanel";
        p.id = id;
        p.setAttribute("role", "tabpanel");
        p.setAttribute("aria-labelledby", "st" + i);
        p.tabIndex = -1;
        g.els.forEach(el => p.appendChild(el));
        after.parentNode.insertBefore(p, after.nextSibling);
        after = p;
    });
    const sel = i => { secMem[key] = i; bar.querySelectorAll("[role=tab]").forEach((b, j) => { b.setAttribute("aria-selected", String(i === j)); b.tabIndex = i === j ? 0 : -1; }); app.querySelectorAll(":scope > .secpanel").forEach((p, j) => p.hidden = i !== j); };
    bar.addEventListener("click", e => { const b = e.target.closest("[role=tab]"); if (!b)
        return; sel(+b.id.slice(2)); const top = bar.getBoundingClientRect().top; if (top < 60)
        window.scrollTo({ top: scrollY + top - 70, behavior: "smooth" }); });
    bar.addEventListener("keydown", e => { const n = groups.length, i = +(document.activeElement.id || "st0").slice(2); if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const j = (i + (e.key === "ArrowRight" ? 1 : -1) + n) % n;
        sel(j);
        $("#st" + j).focus();
    } });
    sel(Math.min(want, groups.length - 1));
}
/* Tampilkan elemen yang sedang tersembunyi di tab bagian atau halaman buku lain */
function revealEl(el) {
    if (typeof el === "string")
        el = document.querySelector(el);
    if (!el)
        return false;
    const p = el.closest(".secpanel");
    if (p && p.hidden) {
        const b = document.getElementById("st" + p.id.slice(2));
        if (b)
            b.click();
    }
    const bp = el.closest(".bpage");
    if (bp && bp.hidden && typeof Book !== "undefined")
        Book.show(+bp.dataset.i);
    return true;
}
function enhance() {
    const app = $("#app");
    if (!app)
        return;
    const v = curView();
    if (v === "home" || v === "masuk") {
        document.body.classList.remove("has-bc");
        return;
    }
    if (app.firstElementChild && app.firstElementChild.classList.contains("bc"))
        return;
    addCrumb(app, v);
    document.body.classList.toggle("has-bc", !!app.querySelector(":scope > .bc"));
    if (v !== "bab" && v !== "buku")
        addSecTabs(app, v);
}
let enhQ = false;
function enhanceSoon() { if (enhQ)
    return; enhQ = true; Promise.resolve().then(() => { enhQ = false; enhance(); }); }
/* ---------- Buku belajar (flipbook) ---------- */
const SECKEY = [["inti", /^Inti/], ["kosakata", /^Kosakata/], ["contoh", /^Contoh/], ["kuis", /^Kuis/], ["latihan", /^Dialog dan latihan/]];
const Book = { k: 0, p: 0, pages: [], secs: [], want: null, wantSec: null, keyFn: null, touch: null, mq: null,
    pageH() { const vh = window.innerHeight || 800; return isWide() ? Math.max(440, Math.min(740, vh - 300)) : Math.max(400, Math.min(700, vh - 250)); },
    build(k) {
        const app = $("#app"), l = L[k - 1];
        const kids = [...app.children];
        const keep = this.k === k ? this.p : 0;
        this.k = k;
        let start = this.want != null ? this.want : (store.bookPos && store.bookPos.k === k ? store.bookPos.p : keep);
        this.want = null;
        app.innerHTML = "";
        app.classList.add("bookview");
        const wrap = document.createElement("div");
        wrap.className = "book";
        wrap.id = "book";
        wrap.innerHTML = `<div class="bk-bar"><a class="bk-back" href="#babs">${IC("list")}<span>Daftar bab</span></a>
      <label class="bk-sel"><span class="sr">Pilih bab</span><select class="sel" id="bkSel">${L.map((x, i) => `<option value="${i + 1}" ${i + 1 === k ? "selected" : ""}>Bab ${i + 1} · ${escH(x.t)}</option>`).join("")}</select></label>
      <span class="bk-pg" id="bkPg" aria-live="polite"></span></div>
      <div class="bk-cover"><div class="bk-ribbon" aria-hidden="true"></div><div class="bk-tabs" id="bkTabs" role="group" aria-label="Bagian bab"></div><div class="bk-spread" id="bkSpread"></div></div>
      <div class="bk-nav"><button class="btn alt" id="bkPrev" type="button">${IC("left")}<span>Sebelumnya</span></button><div class="bk-dots" id="bkDots" aria-hidden="true"></div><button class="btn" id="bkNext" type="button"><span>Berikutnya</span>${IC("right")}</button></div>`;
        app.appendChild(wrap);
        const spread = $("#bkSpread"), H = this.pageH();
        spread.style.setProperty("--bkH", H + "px");
        const pages = [];
        let cur = null;
        const newPage = sec => { const s = document.createElement("section"); s.className = "bpage"; s.dataset.sec = sec; s.innerHTML = `<div class="bp-in"></div>`; spread.appendChild(s); cur = s; pages.push(s); return s.firstChild; };
        const inner = () => cur.firstChild;
        const over = () => inner().offsetHeight > H;
        const put = (node, sec) => {
            if (!cur)
                newPage(sec);
            let t = inner();
            t.appendChild(node);
            if (over() && t.children.length > 1) {
                t.removeChild(node);
                const prevLast = t.lastElementChild;
                newPage(sec);
                if (prevLast && /^H[23]$/.test(prevLast.tagName)) {
                    inner().appendChild(prevLast);
                }
                inner().appendChild(node);
            }
        };
        const putLi = (li, cls, sec) => {
            let t = inner();
            let ul = t.lastElementChild;
            if (!ul || ul.tagName !== "UL" || ul.className !== cls || ul.dataset.sec !== sec) {
                ul = document.createElement("ul");
                ul.className = cls;
                ul.dataset.sec = sec;
                t.appendChild(ul);
            }
            ul.appendChild(li);
            if (over() && (ul.children.length > 1 || t.children.length > 1)) {
                ul.removeChild(li);
                if (!ul.children.length)
                    ul.remove();
                const prevLast = inner().lastElementChild;
                newPage(sec);
                if (prevLast && /^H[23]$/.test(prevLast.tagName))
                    inner().appendChild(prevLast);
                ul = document.createElement("ul");
                ul.className = cls;
                ul.dataset.sec = sec;
                inner().appendChild(ul);
                ul.appendChild(li);
            }
        };
        newPage("Pembuka");
        const toc = document.createElement("div");
        toc.className = "bk-toc";
        toc.innerHTML = `<h2>Isi bab</h2><ol></ol>`;
        const secs = [];
        kids.forEach(el => {
            if (el.classList.contains("crumb"))
                return;
            if (el.classList.contains("lhead")) {
                put(el, "Pembuka");
                put(toc, "Pembuka");
                return;
            }
            if (el.matches("section.blk")) {
                const h2 = el.querySelector(":scope > h2");
                const name = h2 ? h2.textContent.trim() : "Bagian";
                newPage(name);
                const first = pages.length - 1;
                secs.push({ name, first, key: (SECKEY.find(([, re]) => re.test(name)) || [name])[0] });
                [...el.children].forEach(ch => {
                    if (ch.tagName === "UL" && (ch.classList.contains("vocab") || ch.classList.contains("ex"))) {
                        const cls = ch.className;
                        [...ch.children].forEach(li => putLi(li, cls, name));
                    }
                    else
                        put(ch, name);
                });
                return;
            }
            put(el, secs.length ? secs[secs.length - 1].name : "Pembuka");
        });
        pages.forEach((pg, i) => {
            pg.dataset.i = i;
            pg.setAttribute("aria-label", "Halaman " + (i + 1) + " dari " + pages.length);
            const head = document.createElement("div");
            head.className = "bp-head";
            head.setAttribute("aria-hidden", "true");
            head.innerHTML = `<span>Bab ${k} · ${escH(l.t)}</span><span>${escH(pg.dataset.sec === "Pembuka" ? "Pembuka" : pg.dataset.sec)}</span>`;
            const foot = document.createElement("div");
            foot.className = "bp-foot";
            foot.innerHTML = `<span class="bp-num">${i + 1}</span>`;
            pg.insertBefore(head, pg.firstChild);
            pg.appendChild(foot);
        });
        toc.querySelector("ol").innerHTML = secs.map(s => `<li><button type="button" class="bk-goto" data-p="${s.first}"><span>${escH(s.name)}</span><span class="bk-dots-l" aria-hidden="true"></span><span class="bk-n">hlm. ${s.first + 1}</span></button></li>`).join("");
        $("#bkTabs").innerHTML = secs.map((s, i) => `<button type="button" class="bk-tab t${i}" data-p="${s.first}" data-key="${s.key}">${escH(s.name.replace(/^Dialog dan latihan keterampilan$/, "Latihan"))}</button>`).join("");
        this.pages = pages;
        this.secs = secs;
        if (this.wantSec) {
            const s = secs.find(x => x.key === this.wantSec);
            if (s)
                start = s.first;
            this.wantSec = null;
        }
        start = Math.max(0, Math.min(pages.length - 1, start | 0));
        wrap.addEventListener("click", e => { const g = e.target.closest(".bk-goto,.bk-tab"); if (g) {
            this.show(+g.dataset.p, true);
            return;
        } });
        $("#bkPrev").addEventListener("click", () => this.step(-1));
        $("#bkNext").addEventListener("click", () => this.step(1));
        $("#bkSel").addEventListener("change", e => { location.hash = "#b" + e.target.value; });
        spread.addEventListener("touchstart", e => { if (e.touches.length !== 1 || e.target.closest("input,textarea,select,.tbl,table,.tools"))
            return; this.touch = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() }; }, { passive: true });
        spread.addEventListener("touchend", e => { const t = this.touch; this.touch = null; if (!t)
            return; const c = e.changedTouches[0], dx = c.clientX - t.x, dy = c.clientY - t.y; if (Math.abs(dx) > 60 && Math.abs(dy) < 50 && Date.now() - t.t < 700)
            this.step(dx < 0 ? 1 : -1); });
        this.keyOff();
        this.keyFn = e => {
            if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey)
                return;
            if (e.target.closest("input,textarea,select,[contenteditable],[role=tablist]"))
                return;
            if (!$("#srch").hidden || document.body.classList.contains("dr-open") && !isPinLayout())
                return;
            if (e.key === "ArrowRight" || e.key === "PageDown") {
                e.preventDefault();
                this.step(1);
            }
            else if (e.key === "ArrowLeft" || e.key === "PageUp") {
                e.preventDefault();
                this.step(-1);
            }
        };
        document.addEventListener("keydown", this.keyFn);
        if (!this.mq && window.matchMedia) {
            this.mq = matchMedia("(min-width: 900px)");
            const re = () => { if (curView() === "bab" && this.k) {
                this.want = this.p;
                lesson(this.k);
            } };
            this.mq.addEventListener ? this.mq.addEventListener("change", re) : this.mq.addListener(re);
        }
        this.show(start, false, true);
    },
    keyOff() { if (this.keyFn) {
        document.removeEventListener("keydown", this.keyFn);
        this.keyFn = null;
    } },
    per() { return isWide() ? 2 : 1; },
    show(p, user, first) {
        const n = this.pages.length;
        if (!n)
            return;
        p = Math.max(0, Math.min(n - 1, p));
        const per = this.per();
        const s = per === 2 ? p - (p % 2) : p;
        const dir = s > this.p ? "f" : s < this.p ? "b" : "";
        const prev = this.p;
        this.p = s;
        this.pages.forEach((pg, i) => { const on = i >= s && i < s + per; pg.hidden = !on; pg.classList.toggle("left", per === 2 && i === s); pg.classList.toggle("right", per === 2 && i === s + 1); });
        const sp = $("#bkSpread");
        sp.classList.toggle("single", per === 2 && s + 1 >= n);
        if (!first && dir) {
            sp.classList.remove("turn-f", "turn-b");
            void sp.offsetWidth;
            sp.classList.add("turn-" + dir);
        }
        const last = Math.min(n, s + per);
        $("#bkPg").textContent = per === 2 && last > s + 1 ? `Halaman ${s + 1}–${last} dari ${n}` : `Halaman ${s + 1} dari ${n}`;
        const k = this.k;
        $("#bkPrev").disabled = s === 0 && k === 1;
        $("#bkPrev").querySelector("span").textContent = s === 0 && k > 1 ? "Bab " + (k - 1) : "Sebelumnya";
        const atEnd = s + per >= n;
        $("#bkNext").querySelector("span").textContent = atEnd ? (k < L.length ? "Bab " + (k + 1) : "Ke beranda") : "Berikutnya";
        const cs = this.secs.filter(x => x.first <= s + per - 1).pop();
        document.querySelectorAll("#bkTabs .bk-tab").forEach(b => { const on = cs && +b.dataset.p === cs.first; b.classList.toggle("on", on); if (on)
            b.setAttribute("aria-current", "true");
        else
            b.removeAttribute("aria-current"); });
        $("#bkDots").innerHTML = Array.from({ length: Math.ceil(n / per) }, (_, i) => `<i class="${i === Math.floor(s / per) ? "on" : ""}"></i>`).join("");
        store.bookPos = { k, p: s };
        try {
            localStorage.setItem(KEY, JSON.stringify(store));
        }
        catch (e) { }
        try {
            history.replaceState(history.state, "", "#b" + k + (s ? "-" + (s + 1) : ""));
        }
        catch (e) { }
        if (user || dir) {
            AU.stop();
            const top = $("#book").getBoundingClientRect().top;
            if (top < 0)
                window.scrollTo({ top: scrollY + top - 70, behavior: "smooth" });
        }
        if (user && !first) {
            const h = this.pages[s].querySelector("h1,h2,h3");
            if (h) {
                h.tabIndex = -1;
                h.focus({ preventScroll: true });
            }
        }
    },
    step(d) {
        const per = this.per(), n = this.pages.length, s = this.p;
        if (d > 0) {
            if (s + per < n)
                this.show(s + per, true);
            else if (this.k < L.length) {
                this.want = 0;
                location.hash = "#b" + (this.k + 1);
            }
            else
                location.hash = "#";
        }
        else {
            if (s > 0)
                this.show(s - per, true);
            else if (this.k > 1) {
                this.want = 1e6;
                location.hash = "#b" + (this.k - 1);
            }
        }
    } };
function bookify(k) { try {
    Book.build(k);
}
catch (e) {
    console.error(e);
} }
/* ---------- Daftar 12 bab (map bermotif) ---------- */
function babStatus(k) { const c = chapterProg(k); if (store.done[k])
    return ["Selesai", "done", c.pct]; if (store.placed[k])
    return ["Lewat tes penempatan", "done", c.pct]; if (store.seen[k] || store.best[k] != null)
    return ["Sedang dipelajari", "prog", c.pct]; return ["Belum mulai", "", c.pct]; }
function babs() {
    const st = startChapter() || 1;
    $("#app").innerHTML = `<div class="lhead"><h1>Daftar isi · 12 bab</h1><p class="lead">Pilih map untuk membuka bab di buku belajar. Urutan mengikuti tema A1 dari perkenalan sampai liburan.</p></div>
  <ul class="grid babgrid">${L.map((l, i) => {
        const k = i + 1, [t, c, p] = babStatus(k);
        return `<li><a class="tile ${c === "done" ? "done" : k === st && doneCount() < L.length ? "next" : ""}" href="#b${k}"><span class="num">${store.done[k] ? "✓" : k}</span><b lang="de">${l.t}</b><span class="sub">${l.sub}</span>
      <span class="tp"><span class="meter" role="progressbar" aria-label="Progres bab ${k}" aria-valuenow="${p}" aria-valuemin="0" aria-valuemax="100"><i style="width:${p}%"></i></span><span class="tpn">${p}%</span></span>
      <span class="foot"><span class="pill ${c === "done" ? "ok" : ""}">${t}</span>${store.best[k] != null ? `<span class="pill">Kuis ${store.best[k]}%</span>` : ""}</span></a></li>`;
    }).join("")}</ul>`;
}
/* ---------- Beranda ringkas ---------- */
function greet() { const h = new Date().getHours(); return h < 11 ? "Guten Morgen" : h < 18 ? "Guten Tag" : "Guten Abend"; }
function home() {
    if (typeof checkQuests === "function")
        checkQuests();
    const n = doneCount(), total = L.length, st = startChapter(), k = st || 1, l = L[k - 1], c = chapterProg(k);
    const who = (typeof Supa !== "undefined" && Supa.sess && (Supa.sess.name || Supa.sess.email.split("@")[0])) || "";
    const due = dueCards(0).length, pos = store.bookPos && store.bookPos.k === k ? store.bookPos.p : 0;
    const dstr = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
    const qs = questsToday().map(questState), qn = qs.filter(q => q.done).length;
    $("#app").innerHTML = `
  <div class="hm hm3">
    <div class="hm-greet"><p class="hm-date">${dstr}</p><h1>${greet()}${who ? ", " + escH(who) : ""}!</h1>
      <p class="lead">${n === 0 ? "Selamat datang. Mulai dari bab 1, satu halaman setiap kali." : `${n} dari ${total} bab selesai. Lanjutkan dari halaman terakhirmu.`}</p>
      <div class="hm-chips"><a class="hm-chip" href="#main">${IC("bolt")}<b>Level ${level()}</b><span>${store.xp || 0} XP</span></a><a class="hm-chip" href="#progres">${IC("flame")}<b>${streak()}</b><span>hari beruntun</span></a><a class="hm-chip" href="#jalur">${IC("route")}<b>${n}/${total}</b><span>bab</span></a></div></div>
    <section class="hero cont" aria-labelledby="contT">
      <span class="tag">Lanjutkan belajar</span>
      <h2 id="contT"><span class="cont-n">Bab ${k} dari ${total}</span> <span lang="de">${l.t}</span></h2>
      <p class="note">${l.sub}${pos ? ` · terakhir di halaman ${pos + 1}` : ""}</p>
      <div class="meter" role="progressbar" aria-label="Progres bab ${k}" aria-valuenow="${c.pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${c.pct}%"></i></div>
      <p class="say">Progres bab ${c.pct}%${store.placement ? ` · tes penempatan: mulai bab ${Math.min(store.placement.start, 12)}` : ""}</p>
      <div class="btns"><a class="btn big" href="#b${k}${pos ? "-" + (pos + 1) : ""}">${n === 0 && k === 1 && !pos ? "Mulai bab 1" : "Lanjut belajar"} ${IC("right")}</a></div>
      <ol class="hm-trail" aria-label="Perjalanan 12 bab">${L.map((x, i) => `<li class="${store.done[i + 1] ? "d" : i + 1 === k ? "c" : ""}"><a href="#b${i + 1}" aria-label="Bab ${i + 1}: ${escH(x.t)}${store.done[i + 1] ? ", selesai" : ""}">${i + 1}</a></li>`).join("")}</ol>
      ${store.placement ? "" : `<p class="hm-pl">Belum tahu mulai dari mana? <a href="#penempatan">Ikuti tes penempatan</a>.</p>`}
    </section>
    <section class="hm-mis" aria-labelledby="misT"><h2 id="misT" class="hm-h">Misi hari ini · ${qn}/3</h2>${questsHTML(true)}<a class="hm-more" href="#main">Main &amp; belajar ${IC("right")}</a></section>
    <nav class="hm-dest" aria-label="Tujuan utama"><ul>
      <li><a class="dest d1" href="#buku">${IC("book")}<b>Buku belajar</b><span>12 bab, halaman demi halaman</span></a></li>
      <li><a class="dest d2" href="#main">${IC("puzzle")}<b>Main &amp; belajar</b><span>Cocokkan kata, kuis 5 soal, lencana</span></a></li>
      <li><a class="dest d3" href="#kartu">${IC("cards")}<b>Kartu kosakata</b><span>${due ? due + " kartu jatuh tempo" : "Pengulangan berjarak"}</span></a></li>
      <li><a class="dest d4" href="#tes">${IC("exam")}<b>Tes latihan</b><span>Simulasi ujian A1 empat bagian</span></a></li></ul></nav>
  </div>`;
    $("#app").classList.remove("hide-id");
}
/* ---------- Mulai ---------- */
function shellInit() {
    Drawer.init();
    Search.init();
    const app = $("#app");
    if (app && window.MutationObserver)
        new MutationObserver(() => enhanceSoon()).observe(app, { childList: true });
}
shellInit();
/* ---------- Pola kalimat sebagai buku (satu pola per halaman, per bab) ---------- */
let polaQ = "", polaP = 0;
function pola(bab) {
    const all = PAT.map((p, i) => ({ p, i })).sort((a, b) => a.p.bab - b.p.bab || a.i - b.i);
    const babs = [...new Set(all.map(x => x.p.bab))];
    if (bab) {
        const f = all.findIndex(x => x.p.bab === bab);
        if (f >= 0) {
            polaP = f;
            polaQ = "";
        }
    }
    const app = $("#app");
    app.classList.add("bookview");
    app.innerHTML = `<div class="book pbook" id="pbook"><div class="lhead pb-head"><h1>Pola kalimat</h1><p class="lead">Satu pola per halaman, berurutan per bab. Baca rumusnya, dengarkan contohnya, lalu latih langsung.</p></div>
    <div class="bk-bar"><label class="bk-sel"><span class="sr">Pilih bab</span><select class="sel" id="pbSel">${babs.map(b => `<option value="${b}">Bab ${b} · ${escH(L[b - 1].t)} (${all.filter(x => x.p.bab === b).length} pola)</option>`).join("")}</select></label>
      <input class="inp pb-q" id="pq" type="search" placeholder="Cari pola: akusatif, jam, modal..." aria-label="Cari pola" value="${esc(polaQ)}"><span class="bk-pg" id="pbPg" aria-live="polite"></span></div>
    <div class="bk-cover"><div class="bk-ribbon" aria-hidden="true"></div><div class="bk-spread" id="plist"></div></div>
    <div class="bk-nav"><button class="btn alt" id="pbPrev" type="button">${IC("left")}<span>Sebelumnya</span></button><div class="bk-dots" id="pbDots" aria-hidden="true"></div><button class="btn" id="pbNext" type="button"><span>Berikutnya</span>${IC("right")}</button></div></div>`;
    const spread = $("#plist");
    let items = all, s = 0;
    const page = ({ p, i }, n, tot) => `<section class="bpage" data-i="${n}" aria-label="Halaman ${n + 1} dari ${tot}"><div class="bp-head" aria-hidden="true"><span>Bab ${p.bab} · ${escH(L[p.bab - 1].t)}</span><span>Pola</span></div><div class="bp-in">
    <article class="pat"><div class="st">Bab ${p.bab} · pola ${all.filter(x => x.p.bab === p.bab).findIndex(x => x.i === i) + 1} dari ${all.filter(x => x.p.bab === p.bab).length}</div><h3>${p.t}</h3><div class="formula">${p.rumus}</div>
    <ul class="ex">${p.ex.map(e => `<li><button class="spk" data-say="${esc(e[0])}" aria-label="Dengar">${SPK}</button><div class="w"><b lang="de">${e[0]}</b><span class="mean">${e[1]}</span></div></li>`).join("")}</ul>
    <div class="tip"><span class="lab">Jebakan</span><br>${p.jb}</div>
    <div class="row" style="align-items:center"><button class="btn alt" data-p="${i}" type="button">Latih pola ini</button><a href="#b${p.bab}">Buka bab ${p.bab}</a></div><div class="quiz" id="pq${i}" hidden style="margin-top:12px"></div></article>
    </div><div class="bp-foot"><span class="bp-num">${n + 1}</span></div></section>`;
    const per = () => isWide() ? 2 : 1;
    function render() {
        const f = polaQ.trim().toLowerCase();
        items = f ? all.filter(({ p }) => (p.t + " " + p.tags + " " + p.rumus).toLowerCase().includes(f)) : all;
        spread.innerHTML = items.length ? items.map((x, n) => page(x, n, items.length)).join("") : `<section class="bpage left"><div class="bp-in"><p class="note">Tidak ada pola yang cocok dengan “${escH(polaQ)}”. Coba kata lain atau kosongkan pencarian.</p></div></section>`;
        wireSpk(spread);
        spread.querySelectorAll("[data-p]").forEach(b => b.addEventListener("click", () => latihPola(+b.dataset.p)));
        const at = f ? 0 : Math.min(polaP, items.length - 1);
        show(Math.max(0, at), false);
    }
    function show(n, user) {
        const pages = [...spread.querySelectorAll(".bpage[data-i]")], N = pages.length;
        if (!N) {
            $("#pbPg").textContent = "0 hasil";
            $("#pbPrev").disabled = $("#pbNext").disabled = true;
            return;
        }
        const k = per();
        n = Math.max(0, Math.min(N - 1, n));
        const st = n;
        const dir = st > s ? "f" : st < s ? "b" : "";
        s = st;
        pages.forEach((pg, i) => { const on = i >= st && i < st + k; pg.hidden = !on; pg.classList.toggle("left", k === 2 && i === st); pg.classList.toggle("right", k === 2 && i === st + 1); });
        spread.classList.toggle("single", k === 2 && st + 1 >= N);
        if (user && dir) {
            spread.classList.remove("turn-f", "turn-b");
            void spread.offsetWidth;
            spread.classList.add("turn-" + dir);
        }
        const last = Math.min(N, st + k);
        $("#pbPg").textContent = (polaQ ? N + " hasil · " : "") + (k === 2 && last > st + 1 ? `Halaman ${st + 1}–${last} dari ${N}` : `Halaman ${st + 1} dari ${N}`);
        $("#pbPrev").disabled = st === 0;
        $("#pbNext").disabled = st + k >= N;
        $("#pbDots").innerHTML = Array.from({ length: Math.ceil(N / k) }, (_, i) => `<i class="${i === Math.floor(st / k) ? "on" : ""}"></i>`).join("");
        const cur = items[st];
        if (cur) {
            $("#pbSel").value = String(cur.p.bab);
            if (!polaQ) {
                polaP = st;
                try {
                    history.replaceState(history.state, "", "#pola-" + cur.p.bab);
                }
                catch (e) { }
            }
        }
        if (user) {
            AU.stop();
            const t = $("#pbook").getBoundingClientRect().top;
            if (t < 0)
                window.scrollTo({ top: scrollY + t - 70, behavior: "smooth" });
        }
    }
    $("#pbPrev").addEventListener("click", () => show(s - per(), true));
    $("#pbNext").addEventListener("click", () => show(s + per(), true));
    $("#pbSel").addEventListener("change", e => { polaQ = ""; $("#pq").value = ""; const f = all.findIndex(x => x.p.bab === +e.target.value); polaP = f; render(); show(f, true); });
    $("#pq").addEventListener("input", e => { polaQ = e.target.value; render(); });
    spread.addEventListener("touchstart", e => { if (e.touches.length !== 1 || e.target.closest("input,textarea,select,.quiz"))
        return; spread._t = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() }; }, { passive: true });
    spread.addEventListener("touchend", e => { const t = spread._t; spread._t = null; if (!t)
        return; const c = e.changedTouches[0], dx = c.clientX - t.x, dy = c.clientY - t.y; if (Math.abs(dx) > 60 && Math.abs(dy) < 50 && Date.now() - t.t < 700)
        show(s + (dx < 0 ? per() : -per()), true); });
    Book.keyOff();
    Book.keyFn = e => {
        if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.target.closest("input,textarea,select,[contenteditable]"))
            return;
        if (!$("#srch").hidden)
            return;
        if (e.key === "ArrowRight") {
            e.preventDefault();
            show(s + per(), true);
        }
        else if (e.key === "ArrowLeft") {
            e.preventDefault();
            show(s - per(), true);
        }
    };
    document.addEventListener("keydown", Book.keyFn);
    render();
}
/* =====================================================================
   MAIN & BELAJAR: XP, level, lencana, misi harian, cocokkan kata,
   kuis 5 soal, perjalanan 12 bab, dan kamus kartu berhalaman.
   Semua tersimpan di store (localStorage + sinkronisasi akun).
   ===================================================================== */
KIND.kuis5 = ["Kuis cepat 5 soal", "W"];
KIND.cocok = ["Permainan cocokkan kata", "W"];
const todayKey = () => keyOf(new Date());
function gEnsure() { ["unk", "badges", "qdone", "vday"].forEach(k => { if (!store[k] || typeof store[k] !== "object" || Array.isArray(store[k]))
    store[k] = {}; }); if (!(store.xp >= 0))
    store.xp = 0; }
gEnsure();
/* gabung data permainan saat sinkronisasi / cadangan */
const _mergeStore = mergeStore;
mergeStore = function (a, b) {
    const r = _mergeStore(a, b);
    const A = a || {}, B = b || {};
    r.xp = Math.max(A.xp || 0, B.xp || 0, r.xp || 0);
    ["badges", "qdone"].forEach(f => { r[f] = Object.assign({}, A[f] || {}, B[f] || {}); });
    r.vday = {};
    [A.vday || {}, B.vday || {}].forEach(o => Object.keys(o).forEach(k => r.vday[k] = Math.max(r.vday[k] || 0, o[k] || 0)));
    const newer = (B.upd || 0) > (A.upd || 0);
    r.unk = Object.assign({}, newer ? A.unk || {} : B.unk || {}, newer ? B.unk || {} : A.unk || {});
    return r;
};
const _ensureStore = ensureStore;
ensureStore = function (s) { s = _ensureStore(s); ["unk", "badges", "qdone", "vday"].forEach(k => { if (!s[k] || typeof s[k] !== "object" || Array.isArray(s[k]))
    s[k] = {}; }); if (!(s.xp >= 0))
    s.xp = 0; return s; };
/* ---------- XP, level, lencana ---------- */
const level = () => Math.floor((store.xp || 0) / 100) + 1;
const lvlPct = () => (store.xp || 0) % 100;
function xpPop(n, msg) {
    let el = document.getElementById("xppop");
    if (!el) {
        el = document.createElement("div");
        el.id = "xppop";
        el.className = "xppop";
        el.setAttribute("role", "status");
        el.setAttribute("aria-live", "polite");
        document.body.appendChild(el);
    }
    el.innerHTML = `<b>+${n} XP</b>${msg ? `<span>${escH(msg)}</span>` : ""}`;
    el.classList.remove("on");
    void el.offsetWidth;
    el.classList.add("on");
    clearTimeout(xpPop.t);
    xpPop.t = setTimeout(() => el.classList.remove("on"), 2600);
    updXP();
}
function gainXP(n, msg, quiet) {
    gEnsure();
    n = Math.max(0, Math.round(n));
    if (!n)
        return;
    const lv = level();
    store.xp += n;
    save(store);
    if (!quiet)
        xpPop(n, msg);
    if (level() > lv)
        setTimeout(() => celebrate("Naik ke level " + level() + "!", "Kumpulkan 100 XP untuk naik level berikutnya."), 700);
    setTimeout(checkBadges, 60);
    setTimeout(checkQuests, 30);
}
const BADGES = [
    ["first", "Langkah pertama", "Selesaikan satu latihan bernilai.", () => store.log.some(e => e.p != null)],
    ["b1", "Bab 1 selesai", "Lulus kuis bab 1.", () => !!store.done[1]],
    ["b3", "Tiga bab", "Selesaikan 3 bab.", () => doneCount() >= 3],
    ["b6", "Setengah jalan", "Selesaikan 6 bab.", () => doneCount() >= 6],
    ["b12", "Siap A1", "Selesaikan ke-12 bab.", () => doneCount() >= 12],
    ["s3", "Beruntun 3 hari", "Belajar 3 hari berturut-turut.", () => streak() >= 3],
    ["s7", "Beruntun 7 hari", "Belajar 7 hari berturut-turut.", () => streak() >= 7],
    ["x100", "100 XP", "Kumpulkan 100 XP.", () => (store.xp || 0) >= 100],
    ["x500", "500 XP", "Kumpulkan 500 XP.", () => (store.xp || 0) >= 500],
    ["w50", "Kolektor kata", "Kuasai 50 kata.", () => CARDS.filter(c => isKnown(c.key)).length >= 50],
    ["match", "Mata elang", "Selesaikan Cocokkan kata tanpa salah.", () => store.log.some(e => e.k === "cocok" && e.p === 100)],
    ["q5", "Sempurna 5/5", "Jawab benar semua soal kuis 5 soal.", () => store.log.some(e => e.k === "kuis5" && e.p === 100)],
    ["quest", "Misi tuntas", "Selesaikan semua misi harian dalam satu hari.", () => Object.keys(store.qdone).some(k => k.endsWith("|all"))],
    ["exam", "Peserta ujian", "Selesaikan satu bagian simulasi ujian.", () => store.ex4.length > 0 || store.exams.length > 0],
    ["speak", "Berani bicara", "Kerjakan satu latihan Sprechen.", () => store.log.some(e => KIND[e.k] && KIND[e.k][1] === "Sp")]
];
function checkBadges() {
    gEnsure();
    let got = null;
    BADGES.forEach(([id, t, d, f]) => { if (!store.badges[id]) {
        let ok = false;
        try {
            ok = f();
        }
        catch (e) { }
        if (ok) {
            store.badges[id] = Date.now();
            got = [t, d];
        }
    } });
    if (got) {
        save(store);
        celebrate("Lencana baru: " + got[0], got[1]);
    }
}
function celebrate(title, sub) {
    let el = document.getElementById("cele");
    if (!el) {
        el = document.createElement("div");
        el.id = "cele";
        el.className = "cele";
        el.setAttribute("role", "status");
        el.setAttribute("aria-live", "polite");
        document.body.appendChild(el);
    }
    el.innerHTML = `<span class="cele-st" aria-hidden="true"></span><b>${escH(title)}</b><span>${escH(sub || "")}</span>`;
    el.classList.remove("on");
    void el.offsetWidth;
    el.classList.add("on");
    clearTimeout(celebrate.t);
    celebrate.t = setTimeout(() => el.classList.remove("on"), 3600);
}
/* setiap aktivitas bernilai memberi XP secara otomatis */
const _logRes = logRes;
logRes = function (k, b, p, x) { _logRes(k, b, p, x); const n = p == null ? 3 : 5 + Math.round(Math.max(0, Math.min(100, p)) / 10); gainXP(n, KIND[k] ? KIND[k][0] : "Latihan"); };
const _bumpRev = bumpRev;
bumpRev = function () { _bumpRev(); gEnsure(); store.xp += 1; updXP(); setTimeout(checkQuests, 30); };
/* ---------- Misi harian ---------- */
const todayLog = () => { const d = new Date(); d.setHours(0, 0, 0, 0); const t0 = d.getTime(); return store.log.filter(e => e.t >= t0); };
const QUESTS = {
    min: { t: () => "Belajar " + store.plan.daily + " menit", goal: () => store.plan.daily, val: () => Math.floor((store.days[todayKey()] || 0) / 60), h: "#buku", u: "menit" },
    cards: { t: () => "Ulangi 10 kartu kosakata", goal: () => 10, val: () => store.revd[todayKey()] || 0, h: "#kartu", u: "kartu" },
    quiz5: { t: () => "Selesaikan 1 kuis 5 soal", goal: () => 1, val: () => todayLog().filter(e => e.k === "kuis5").length, h: "#main-kuis", u: "kuis" },
    match: { t: () => "Main 1 Cocokkan kata", goal: () => 1, val: () => todayLog().filter(e => e.k === "cocok").length, h: "#main-cocok", u: "permainan" },
    skill: { t: () => "Kerjakan 1 latihan Hören, Lesen, Schreiben, atau Sprechen", goal: () => 1, val: () => todayLog().filter(e => KIND[e.k] && ["H", "L", "S", "Sp"].includes(KIND[e.k][1])).length, h: "#dengar", u: "latihan" },
    bab: { t: () => "Kerjakan kuis satu bab", goal: () => 1, val: () => todayLog().filter(e => e.k === "kuis").length, h: "#buku", u: "kuis" },
    words: { t: () => "Tandai 8 kata: tahu atau belum", goal: () => 8, val: () => store.vday[todayKey()] || 0, h: "#kamus", u: "kata" }
};
function questsToday() {
    const k = todayKey();
    let h = 0;
    for (const c of k)
        h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const pool = ["cards", "quiz5", "match", "skill", "bab", "words"];
    const a = pool[h % pool.length], rest = pool.filter(x => x !== a);
    const b = rest[(h >>> 5) % rest.length];
    return ["min", a, b];
}
function questState(id) { const q = QUESTS[id]; const g = q.goal(), v = Math.min(g, q.val()); return { id, t: q.t(), g, v, done: v >= g, h: q.h, u: q.u }; }
function checkQuests() {
    gEnsure();
    const k = todayKey();
    let all = true, changed = false;
    questsToday().forEach(id => { const s = questState(id); if (s.done && !store.qdone[k + "|" + id]) {
        store.qdone[k + "|" + id] = Date.now();
        changed = true;
        store.xp += 20;
        xpPop(20, "Misi selesai: " + s.t);
    } if (!s.done)
        all = false; });
    if (all && !store.qdone[k + "|all"]) {
        store.qdone[k + "|all"] = Date.now();
        store.xp += 30;
        changed = true;
        setTimeout(() => celebrate("Semua misi hari ini selesai!", "+30 XP bonus. Sampai jumpa besok."), 900);
    }
    if (changed) {
        save(store);
        setTimeout(checkBadges, 1200);
    }
}
function questsHTML(compact) {
    const qs = questsToday().map(questState);
    const n = qs.filter(q => q.done).length;
    return `<div class="quests"><div class="q-top"><span class="note">+20 XP per misi, +30 XP bonus jika semua selesai</span></div><ul class="q-list">${qs.map(q => `<li class="${q.done ? "done" : ""}"><span class="q-ck" aria-hidden="true">${q.done ? "✓" : ""}</span><span class="q-t"><a href="${q.h}">${escH(q.t)}</a><span class="q-bar" role="progressbar" aria-label="${escH(q.t)}" aria-valuenow="${q.v}" aria-valuemin="0" aria-valuemax="${q.g}"><i style="width:${Math.round(q.v / q.g * 100)}%"></i></span></span><span class="q-n">${q.v}/${q.g}</span></li>`).join("")}</ul></div>`;
}
function updXP() { const el = document.getElementById("hdrXP"); if (el) {
    el.textContent = "Lv " + level() + " · " + (store.xp || 0) + " XP";
    el.setAttribute("aria-label", "Level " + level() + ", " + (store.xp || 0) + " XP");
} }
function xpCard() { return `<div class="xpcard"><div class="xp-lv"><span>Level</span><b>${level()}</b></div><div class="xp-main"><div class="xp-row"><b>${store.xp || 0} XP</b><span class="note">${100 - lvlPct()} XP lagi ke level ${level() + 1}</span></div><div class="q-bar big" role="progressbar" aria-label="Progres level" aria-valuenow="${lvlPct()}" aria-valuemin="0" aria-valuemax="100"><i style="width:${lvlPct()}%"></i></div></div><div class="xp-st">${IC("flame")}<b>${streak()}</b><span>hari beruntun</span></div></div>`; }
/* ---------- Bahan permainan dari kosakata asli ---------- */
function wordPool(bab) { const src = bab ? DICT.filter(d => d.bab === bab) : DICT.filter(d => d.bab > 0); const seen = new Set(); return shuffle(src).filter(d => { const m = d.ar.toLowerCase(); if (seen.has(m))
    return false; seen.add(m); return true; }); }
const babOpts = sel => `<option value="0"${!sel ? " selected" : ""}>Semua bab</option>` + L.map((l, i) => `<option value="${i + 1}"${sel === i + 1 ? " selected" : ""}>Bab ${i + 1} · ${escH(l.t)}</option>`).join("");
/* ---------- Main & belajar (hub) ---------- */
function mainHub() {
    checkQuests();
    checkBadges();
    const st = startChapter() || 1;
    $("#app").innerHTML = `<div class="lhead"><h1>Main &amp; belajar</h1><p class="lead">Permainan singkat dari kosakata 12 bab. Setiap permainan memberi XP dan menghitung misi harian.</p></div>
  ${xpCard()}
  <div class="mh-grid">
    <section class="mh-q"><h2 class="hm-h">Misi hari ini · ${questsToday().map(questState).filter(q => q.done).length}/3</h2>${questsHTML()}</section>
    <section class="mh-games"><h2 class="hm-h">Pilih permainan</h2><ul class="games">
      <li><a class="game g1" href="#main-cocok-${st}">${IC("puzzle")}<b>Cocokkan kata</b><span>6 pasang Jerman–Indonesia, bab ${st}</span></a></li>
      <li><a class="game g2" href="#main-kuis-${st}">${IC("bolt")}<b>Kuis 5 soal</b><span>Arti, kata Jerman, dan artikel</span></a></li>
      <li><a class="game g3" href="#kamus" data-flash>${IC("cards")}<b>Kartu kilat</b><span>Tahu atau belum? Isi antrian ulang</span></a></li>
      <li><a class="game g4" href="#jalur">${IC("route")}<b>Perjalanan 12 bab</b><span>Bintang dan cap untuk setiap bab</span></a></li></ul></section>
  </div>
  <section class="blk"><h2>Lencana (${Object.keys(store.badges).filter(k => BADGES.some(b => b[0] === k)).length}/${BADGES.length})</h2><ul class="badges">${BADGES.map(([id, t, d]) => { const got = store.badges[id]; return `<li class="${got ? "got" : ""}"><span class="bd-ic" aria-hidden="true">${IC(got ? "trophy" : "lock")}</span><b>${t}</b><span class="note">${d}</span>${got ? `<span class="pill ok">Didapat</span>` : ""}</li>`; }).join("")}</ul></section>`;
    const f = $("#app").querySelector("[data-flash]");
    if (f)
        f.addEventListener("click", () => { kmode = "flash"; });
}
/* ---------- Cocokkan kata ---------- */
function cocok(bab) {
    bab = bab || 0;
    const words = wordPool(bab).slice(0, 6);
    if (words.length < 3) {
        $("#app").innerHTML = `<div class="lhead"><h1>Cocokkan kata</h1></div><p>Kata belum cukup untuk bab ini.</p>`;
        return;
    }
    const left = shuffle(words), right = shuffle(words);
    let pick = null, errs = 0, done = 0;
    const t0 = Date.now();
    $("#app").innerHTML = `<div class="lhead"><h1>Cocokkan kata</h1><p class="lead">Pilih kata Jerman, lalu pilih artinya. Pasangan benar akan terkunci.</p></div>
  <div class="tools g-tools"><label>Bab: <select class="sel" id="mcBab">${babOpts(bab)}</select></label><span class="g-stat" id="mcStat" aria-live="polite">0/${words.length} pasang · 0 salah</span></div>
  <div class="match" id="match"><ul class="mcol" aria-label="Kata Jerman">${left.map(w => `<li><button type="button" class="mtile" data-side="de" data-k="${esc(w.key)}" lang="de">${w.de}</button></li>`).join("")}</ul>
  <ul class="mcol" aria-label="Arti Indonesia">${right.map(w => `<li><button type="button" class="mtile" data-side="id" data-k="${esc(w.key)}">${w.ar}</button></li>`).join("")}</ul></div>
  <div id="mcRes" aria-live="polite"></div>`;
    $("#mcBab").addEventListener("change", e => { location.hash = "#main-cocok" + (+e.target.value ? "-" + e.target.value : ""); });
    const stat = () => $("#mcStat").textContent = `${done}/${words.length} pasang · ${errs} salah`;
    $("#match").addEventListener("click", e => {
        const b = e.target.closest(".mtile");
        if (!b || b.disabled)
            return;
        if (!pick || pick.dataset.side === b.dataset.side) {
            if (pick)
                pick.setAttribute("aria-pressed", "false");
            pick = b;
            b.setAttribute("aria-pressed", "true");
            if (b.dataset.side === "de")
                speak(b.textContent);
            return;
        }
        const a = pick;
        pick = null;
        a.setAttribute("aria-pressed", "false");
        if (a.dataset.k === b.dataset.k) {
            [a, b].forEach(x => { x.disabled = true; x.classList.add("ok"); });
            done++;
            stat();
            if (done === words.length) {
                const sc = Math.max(0, 100 - errs * 10), sec = Math.round((Date.now() - t0) / 1000);
                $("#mcRes").innerHTML = `<div class="g-res ${sc === 100 ? "perfect" : ""}"><b>${sc === 100 ? "Sempurna!" : "Selesai!"}</b><span>${words.length} pasang dalam ${sec} detik, ${errs} salah. Nilai ${sc}%.</span><div class="row"><button class="btn" id="mcAgain" type="button">Main lagi</button><a class="btn alt" href="#main-kuis${bab ? "-" + bab : ""}">Kuis 5 soal</a><a class="btn alt" href="#main">Main &amp; belajar</a></div></div>`;
                $("#mcAgain").addEventListener("click", () => cocok(bab));
                logRes("cocok", bab, sc, "Cocokkan kata" + (bab ? " bab " + bab : ""));
            }
        }
        else {
            errs++;
            stat();
            [a, b].forEach(x => { x.classList.add("no"); setTimeout(() => x.classList.remove("no"), 500); });
        }
    });
}
/* ---------- Kuis 5 soal ---------- */
function kuis5(bab) {
    bab = bab || 0;
    const pool = wordPool(bab);
    const all = wordPool(0);
    if (pool.length < 4) {
        $("#app").innerHTML = `<p>Kata belum cukup.</p>`;
        return;
    }
    const arts = pool.filter(d => /^(der|die|das) /.test(d.de));
    const qs = pool.slice(0, 5).map((w, i) => {
        const type = i % 3 === 2 && arts.length ? "art" : i % 2 ? "id2de" : "de2id";
        if (type === "art") {
            const a = arts[i % arts.length];
            return { q: `Artikel yang tepat untuk <b lang="de">${a.de.replace(/^(der|die|das) /, "")}</b> (${escH(a.ar)})?`, opts: ["der", "die", "das"], ans: a.de.split(" ")[0], say: a.de };
        }
        const others = shuffle(all.filter(x => x.key !== w.key)).slice(0, 3);
        if (type === "id2de")
            return { q: `Bahasa Jermannya <b>“${escH(w.ar)}”</b>?`, opts: shuffle([w, ...others]).map(x => x.de), ans: w.de, say: w.de };
        return { q: `Arti <b lang="de">${w.de}</b>?`, opts: shuffle([w, ...others]).map(x => x.ar), ans: w.ar, say: w.de };
    });
    let i = 0, right = 0;
    $("#app").innerHTML = `<div class="lhead"><h1>Kuis 5 soal</h1><p class="lead">Lima soal cepat dari kosakata${bab ? " bab " + bab : " semua bab"}. Jawaban langsung diperiksa.</p></div>
  <div class="tools g-tools"><label>Bab: <select class="sel" id="k5Bab">${babOpts(bab)}</select></label></div><div class="quiz k5" id="k5"></div>`;
    $("#k5Bab").addEventListener("change", e => { location.hash = "#main-kuis" + (+e.target.value ? "-" + e.target.value : ""); });
    const box = $("#k5");
    const show = () => {
        const q = qs[i];
        box.innerHTML = `<div class="k5-top"><span>Soal ${i + 1} dari 5</span><span class="k5-dots">${qs.map((_, j) => `<i class="${j < i ? "p" : ""}${j === i ? " c" : ""}"></i>`).join("")}</span></div><p class="qtext">${q.q}</p><div class="opts">${q.opts.map(o => `<button type="button" class="opt" data-o="${esc(o)}">${o}</button>`).join("")}</div><div id="k5fb" aria-live="polite"></div>`;
        box.querySelectorAll(".opt").forEach(b => b.addEventListener("click", () => {
            const ok = b.dataset.o === q.ans;
            if (ok)
                right++;
            box.querySelectorAll(".opt").forEach(x => { x.disabled = true; if (x.dataset.o === q.ans)
                x.classList.add("ok");
            else if (x === b)
                x.classList.add("no"); });
            box.querySelector(".k5-dots i.c").classList.add(ok ? "r" : "w");
            $("#k5fb").innerHTML = `<div class="fb ${ok ? "ok" : "no"}"><b>${ok ? "Benar!" : "Belum tepat."}</b> ${ok ? "" : "Jawaban: <b>" + q.ans + "</b>. "}<button class="spk sm" type="button" data-say="${esc(q.say)}" aria-label="Dengar ${esc(q.say)}">${SPK}</button></div><div class="row"><button class="btn" id="k5n" type="button">${i < 4 ? "Soal berikutnya" : "Lihat hasil"}</button></div>`;
            wireSpk(box);
            const n = $("#k5n");
            n.focus();
            n.addEventListener("click", () => { i++; if (i < 5)
                show();
            else
                end(); });
        }));
    };
    const end = () => {
        const pct = right * 20;
        box.innerHTML = `<div class="g-res ${pct === 100 ? "perfect" : ""}"><b>${right}/5 benar${pct === 100 ? " · Sempurna!" : ""}</b><span>${pct >= 80 ? "Bagus sekali, kosakatanya sudah melekat." : pct >= 60 ? "Lumayan. Ulangi kata yang salah di Kartu kilat." : "Baca lagi kosakata bab ini di buku, lalu coba lagi."}</span><div class="row"><button class="btn" id="k5a" type="button">Kuis lagi</button><a class="btn alt" href="#main-cocok${bab ? "-" + bab : ""}">Cocokkan kata</a><a class="btn alt" href="${bab ? "#b" + bab : "#buku"}">Buka buku</a></div></div>`;
        $("#k5a").addEventListener("click", () => kuis5(bab));
        logRes("kuis5", bab, pct, "Kuis 5 soal" + (bab ? " bab " + bab : ""));
    };
    show();
}
/* ---------- Perjalanan 12 bab ---------- */
function jalur() {
    const st = startChapter() || 1;
    $("#app").innerHTML = `<div class="lhead"><h1>Perjalanan 12 bab</h1><p class="lead">Satu bab = satu perhentian. Bintang dari nilai kuis bab: ★ 60%, ★★ 80%, ★★★ 100%.</p></div>
  <ol class="journey">${L.map((l, i) => {
        const k = i + 1, b = store.best[k], stars = b == null ? 0 : b >= 100 ? 3 : b >= 80 ? 2 : b >= 60 ? 1 : 0, cls = store.done[k] ? "done" : k === st ? "cur" : "";
        return `<li class="jp ${cls}"><span class="jp-n" aria-hidden="true">${store.done[k] ? "✓" : k}</span><div class="jp-b"><span class="jp-k">Bab ${k}${k === st && !store.done[k] ? " · sekarang" : ""}</span><b lang="de">${l.t}</b><span class="jp-s" aria-label="${stars} dari 3 bintang">${"★".repeat(stars)}<span class="off">${"★".repeat(3 - stars)}</span></span>
      <span class="jp-a"><a href="#b${k}">Buku</a><a href="#main-cocok-${k}">Cocokkan</a><a href="#main-kuis-${k}">Kuis 5</a></span></div></li>`;
    }).join("")}</ol>`;
}
/* ---------- Kamus: kartu berhalaman, kartu kilat, antrian ulang ---------- */
let kmode = "grid", dpage = 0;
const isUnk = k => !!(store.unk && store.unk[k]);
const vMark = () => { const k = todayKey(); store.vday[k] = (store.vday[k] || 0) + 1; };
function setKnown(k, known) { gEnsure(); store.known[k] = known; if (known)
    delete store.unk[k];
else {
    store.unk[k] = Date.now();
    if (store.srs[k] && store.srs[k].reps >= 3)
        store.srs[k].reps = 2;
} vMark(); store.xp += 1; save(store); updXP(); setTimeout(checkQuests, 30); }
const queueList = () => DICT.filter(d => isUnk(d.key) || (isHard(d) && !isKnown(d.key)));
function kamus() {
    gEnsure();
    const per = isWide() ? 12 : 8;
    const q0 = queueList().length;
    $("#app").innerHTML = `<div class="lhead"><h1>Kamus kosakata</h1><p class="lead">${DICT.length} kata dari 12 bab dan kosakata tematik. Ketik dalam bahasa Jerman atau Indonesia.</p></div>
  <div class="seg vmode" role="group" aria-label="Mode kamus">${[["grid", "Kartu kata"], ["flash", "Kartu kilat"], ["queue", "Antrian ulang (" + q0 + ")"]].map(([k, t]) => `<button type="button" data-mode="${k}" aria-pressed="${kmode === k}">${t}</button>`).join("")}</div>
  <div class="vtools"><input class="inp" id="dq" type="search" placeholder="Cari: Bahnhof, stasiun, essen..." aria-label="Cari kata" value="${esc(dq)}">
    <select class="sel" id="dcat" aria-label="Kategori"><option value="">Semua kategori</option>${Object.entries(VCAT).map(([k, v]) => `<option value="${k}" ${dcat === k ? "selected" : ""}>${v}</option>`).join("")}</select>
    <select class="sel" id="dbab" aria-label="Bab"><option value="0">Semua bab</option>${L.map((l, i) => `<option value="${i + 1}" ${dbab === i + 1 ? "selected" : ""}>Bab ${i + 1}. ${l.t}</option>`).join("")}<option value="-1" ${dbab === -1 ? "selected" : ""}>Kosakata tematik</option></select></div>
  <div class="seg vflt" role="group" aria-label="Saring">${[["all", "Semua"], ["todo", "Belum dikuasai"], ["unk", "Belum tahu"], ["known", "Dikuasai"], ["fav", "Favorit"], ["hard", "Sering salah"]].map(([k, t]) => `<button type="button" data-f="${k}" aria-pressed="${dflt === k}">${t}</button>`).join("")}</div>
  <p class="note" id="dcount" aria-live="polite"></p><div id="vbox"><ul class="vocab dict vcards" id="dlist"></ul><nav class="pager" id="dmore" aria-label="Halaman kamus"></nav></div>
  <details class="vhelp"><summary>Cara membaca pelafalan</summary><p class="note">Huruf besar = suku kata bertekanan, sy = sch, kh = ch kasar (Buch), h setelah i/e = ch lembut (ich), c = tsch, y = j, v = w, ts = z. Kata dianggap dikuasai jika kamu menandai “Tahu” atau sudah tiga kali berturut-turut diingat di Kartu kosakata. “Sering salah” = kata yang dua kali atau lebih dinilai “Lagi” di Kartu.</p></details>`;
    const filtered = () => { const q = normA(dq); return DICT.filter(d => (!q || d.n.includes(q) || d.na.includes(q)) && (!dcat || d.cat === dcat) && (!dbab || (dbab === -1 ? d.bab === 0 : d.bab === dbab)) && (dflt === "all" || (dflt === "fav" && store.fav[d.key]) || (dflt === "known" && isKnown(d.key)) || (dflt === "todo" && !isKnown(d.key)) || (dflt === "unk" && isUnk(d.key)) || (dflt === "hard" && isHard(d)))); };
    const card = d => `<li data-k="${esc(d.key)}" class="${isKnown(d.key) ? "kn" : isUnk(d.key) ? "uk" : ""}"><div class="vc-top"><button class="spk" type="button" data-say="${esc(d.de)}" aria-label="Dengar ${esc(d.de)}">${SPK}</button><div class="w"><b lang="de">${d.de}</b><span class="say">${d.pr}</span><span class="dmean">${d.ar}</span></div>
    <button class="ib star" type="button" data-fav aria-pressed="${!!store.fav[d.key]}" aria-label="Favorit">${store.fav[d.key] ? "★" : "☆"}</button></div>
    <div class="vc-act"><button class="ib yes" type="button" data-kn aria-pressed="${isKnown(d.key)}">${isKnown(d.key) ? "✓ Tahu" : "Tahu"}</button><button class="ib nope" type="button" data-unk aria-pressed="${isUnk(d.key)}">Belum tahu</button></div>
    <details class="vc-more"><summary>Detail: jamak & contoh</summary>${/^(der|die|das) /.test(d.de) ? `<span class="pl">Artikel: <b>${d.de.split(" ")[0]}</b></span>` : ""}${d.pl && d.pl !== "-" ? `<span class="pl">Jamak: ${d.pl}</span>` : ""}${d.ex ? `<span class="vex"><button class="spk sm" type="button" data-say="${esc(d.ex)}" aria-label="Dengar contoh">${SPK}</button><span><i lang="de">${d.ex}</i><span class="note">${d.exid}</span></span></span>` : ""}<span class="foot2"><span class="pill">${VCAT[d.cat] || ""}</span>${d.bab ? `<a class="pill" href="#b${d.bab}">Bab ${d.bab}</a>` : `<span class="pill">Tematik</span>`}${isHard(d) ? `<span class="pill hardp">Sering salah</span>` : ""}</span></details></li>`;
    const wire = root => {
        wireSpk(root);
        root.querySelectorAll("li[data-k]").forEach(li => {
            const k = li.dataset.k;
            li.querySelector("[data-fav]").addEventListener("click", e => { store.fav[k] = !store.fav[k]; save(store); const b = e.currentTarget; b.setAttribute("aria-pressed", String(store.fav[k])); b.textContent = store.fav[k] ? "★" : "☆"; });
            li.querySelector("[data-kn]").addEventListener("click", () => { const now = !isKnown(k); if (now)
                setKnown(k, true);
            else {
                store.known[k] = false;
                if (store.srs[k] && store.srs[k].reps >= 3)
                    store.srs[k].reps = 2;
                save(store);
            } draw(); });
            li.querySelector("[data-unk]").addEventListener("click", () => { if (isUnk(k)) {
                delete store.unk[k];
                save(store);
            }
            else
                setKnown(k, false); draw(); });
        });
    };
    function draw() {
        const list = kmode === "queue" ? queueList() : filtered();
        const pages = Math.max(1, Math.ceil(list.length / per));
        dpage = Math.min(dpage, pages - 1);
        document.querySelectorAll(".vtools,.vflt").forEach(x => x.hidden = kmode === "queue");
        $("#dcount").textContent = kmode === "queue" ? (list.length ? `${list.length} kata di antrian ulang: kata yang kamu tandai “Belum tahu” dan kata yang sering salah.` : "Antrian kosong. Tandai “Belum tahu” pada kata yang belum kamu ingat.") : `${list.length} kata ditemukan${list.length > per ? ` · halaman ${dpage + 1} dari ${pages}` : ""}.`;
        if (kmode === "flash" || kmode === "queue" && list.length && $("#vbox").dataset.flash === "1") {
            flash(list);
            return;
        }
        $("#vbox").dataset.flash = "";
        $("#vbox").innerHTML = `${kmode === "queue" && list.length ? `<div class="row"><button class="btn" id="qStart" type="button">Latih antrian dengan kartu kilat</button></div>` : ""}<ul class="vocab dict vcards" id="dlist">${list.slice(dpage * per, dpage * per + per).map(card).join("") || `<li class="empty"><span class="note">${kmode === "queue" ? "Belum ada kata di antrian." : "Tidak ada kata yang cocok. Coba kata lain atau ubah saringan."}</span></li>`}</ul><nav class="pager" id="dmore" aria-label="Halaman kamus"></nav>`;
        wire($("#dlist"));
        if (pages > 1) {
            const btn = (p, t, lab, on) => `<button type="button" class="pg${on ? " on" : ""}" data-p="${p}"${lab ? ` aria-label="${lab}"` : ""}${on ? ' aria-current="page"' : ""}>${t}</button>`;
            const nums = [];
            for (let p = 0; p < pages; p++) {
                if (p === 0 || p === pages - 1 || Math.abs(p - dpage) <= 1)
                    nums.push(p);
                else if (nums[nums.length - 1] !== "…")
                    nums.push("…");
            }
            $("#dmore").innerHTML = btn(Math.max(0, dpage - 1), IC("left"), "Halaman sebelumnya") + nums.map(p => p === "…" ? `<span class="pg-gap">…</span>` : btn(p, p + 1, "Halaman " + (p + 1), p === dpage)).join("") + btn(Math.min(pages - 1, dpage + 1), IC("right"), "Halaman berikutnya");
            $("#dmore").querySelectorAll("[data-p]").forEach(b => b.addEventListener("click", () => { dpage = +b.dataset.p; draw(); const t = $("#dcount"); if (t && t.getBoundingClientRect().top < 70)
                t.scrollIntoView({ block: "start" }); }));
        }
        const qs = $("#qStart");
        if (qs)
            qs.addEventListener("click", () => { $("#vbox").dataset.flash = "1"; flash(list); });
    }
    function flash(list) {
        const box = $("#vbox");
        box.dataset.flash = kmode === "queue" ? "1" : "";
        const deck = shuffle(list).slice(0, 20);
        let i = 0, yes = 0;
        if (!deck.length) {
            box.innerHTML = `<p class="note">Tidak ada kata untuk dilatih. Ubah saringan atau kembali ke Kartu kata.</p>`;
            return;
        }
        const show = () => {
            const d = deck[i];
            box.innerHTML = `<div class="fc"><div class="fc-top"><span>Kartu ${i + 1} dari ${deck.length}</span><span>${yes} tahu</span></div>
        <button type="button" class="fc-card" id="fcCard" aria-label="Balik kartu"><span class="fc-front"><b lang="de">${d.de}</b><span class="say">${d.pr}</span><span class="note">Ketuk untuk melihat arti</span></span><span class="fc-back" hidden><b>${d.ar}</b>${d.pl && d.pl !== "-" ? `<span class="pl">Jamak: ${d.pl}</span>` : ""}${d.ex ? `<i lang="de">${d.ex}</i><span class="note">${d.exid}</span>` : ""}</span></button>
        <div class="fc-act"><button class="spk" type="button" data-say="${esc(d.de)}" aria-label="Dengar ${esc(d.de)}">${SPK}</button><button class="btn alt" type="button" id="fcNo">Belum tahu</button><button class="btn" type="button" id="fcYes">Tahu</button></div>
        <p class="note fc-help">Spasi = balik kartu · ← belum tahu · → tahu</p></div>`;
            wireSpk(box);
            const card = $("#fcCard");
            const flip = () => { card.classList.toggle("flipped"); card.querySelector(".fc-front").hidden = card.classList.contains("flipped"); card.querySelector(".fc-back").hidden = !card.classList.contains("flipped"); };
            card.addEventListener("click", flip);
            const ans = k => { setKnown(d.key, k); if (k)
                yes++; i++; if (i < deck.length)
                show();
            else
                end(); };
            $("#fcYes").addEventListener("click", () => ans(true));
            $("#fcNo").addEventListener("click", () => ans(false));
            if (keyHandler)
                document.removeEventListener("keydown", keyHandler);
            keyHandler = e => { if (e.target.closest("input,textarea,select"))
                return; if (e.key === " ") {
                e.preventDefault();
                flip();
            }
            else if (e.key === "ArrowRight") {
                e.preventDefault();
                ans(true);
            }
            else if (e.key === "ArrowLeft") {
                e.preventDefault();
                ans(false);
            } };
            document.addEventListener("keydown", keyHandler);
        };
        const end = () => {
            if (keyHandler) {
                document.removeEventListener("keydown", keyHandler);
                keyHandler = null;
            }
            const pct = Math.round(yes / deck.length * 100);
            box.innerHTML = `<div class="g-res"><b>${yes} dari ${deck.length} kata kamu tahu (${pct}%)</b><span>${deck.length - yes ? `${deck.length - yes} kata masuk antrian ulang.` : "Semua kata sudah kamu tahu."}</span><div class="row"><button class="btn" id="fcAgain" type="button">Latih lagi</button><button class="btn alt" id="fcQ" type="button">Lihat antrian ulang</button></div></div>`;
            gainXP(Math.max(2, Math.round(yes / 2)), "Kartu kilat");
            $("#fcAgain").addEventListener("click", () => flash(kmode === "queue" ? queueList() : list));
            $("#fcQ").addEventListener("click", () => { kmode = "queue"; kamus(); });
        };
        show();
    }
    $("#dq").addEventListener("input", e => { dq = e.target.value; dpage = 0; draw(); });
    $("#dcat").addEventListener("change", e => { dcat = e.target.value; dpage = 0; draw(); });
    $("#dbab").addEventListener("change", e => { dbab = +e.target.value; dpage = 0; draw(); });
    $("#app").querySelectorAll(".vflt button").forEach(b => b.addEventListener("click", () => { dflt = b.dataset.f; dpage = 0; $("#app").querySelectorAll(".vflt button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); draw(); }));
    $("#app").querySelectorAll(".vmode button").forEach(b => b.addEventListener("click", () => { kmode = b.dataset.mode; dpage = 0; $("#vbox").dataset.flash = ""; $("#app").querySelectorAll(".vmode button").forEach(x => x.setAttribute("aria-pressed", String(x === b))); draw(); }));
    draw();
}
updXP();
setTimeout(() => { updXP(); checkBadges(); }, 800);
/* ===== Router ===== */
function route() {
    if (keyHandler) {
        document.removeEventListener("keydown", keyHandler);
        keyHandler = null;
    }
    if (Mic.active)
        Mic.stop();
    if (chat && chat.busy && chat.ctl)
        chat.ctl.abort();
    if (activeTimer) {
        clearInterval(activeTimer);
        activeTimer = null;
    }
    AU.stop();
    REC.stop();
    if (typeof Book !== "undefined")
        Book.keyOff();
    const app = $("#app");
    app.classList.remove("hide-id", "bookview");
    app.classList.toggle("nospeech", !hasAudio());
    const h = (location.hash || "").replace(/^#/, "");
    let m, tab = "";
    if (needGate()) {
        document.body.setAttribute("data-view", "masuk");
        masuk();
        document.querySelectorAll("#tabs a").forEach(x => x.removeAttribute("aria-current"));
        updAcct();
        updateProg();
        window.scrollTo(0, 0);
        return;
    }
    try {
        if (h === "mix") {
            mix();
            tab = "latihan";
        }
        else if (m = h.match(/^b(\d+)(?:-(\d+))?$/)) {
            if (+m[1] >= 1 && +m[1] <= L.length) {
                if (m[2])
                    Book.want = +m[2] - 1;
                lesson(+m[1]);
                tab = "buku";
            }
            else {
                home();
                tab = "home";
            }
        }
        else if (h === "buku") {
            const bp = store.bookPos, k = bp && L[bp.k - 1] ? bp.k : (startChapter() || 1);
            Book.want = bp && bp.k === k ? bp.p : 0;
            lesson(k);
            tab = "buku";
        }
        else if (h === "babs") {
            babs();
            tab = "babs";
        }
        else if (h === "main") {
            mainHub();
            tab = "main";
        }
        else if (m = h.match(/^main-cocok(?:-(\d+))?$/)) {
            cocok(m[1] ? +m[1] : 0);
            tab = "main";
        }
        else if (m = h.match(/^main-kuis(?:-(\d+))?$/)) {
            kuis5(m[1] ? +m[1] : 0);
            tab = "main";
        }
        else if (h === "jalur") {
            jalur();
            tab = "jalur";
        }
        else if (h === "kamus") {
            kamus();
            tab = "kamus";
        }
        else if (h === "kartu") {
            kartu();
            tab = "kartu";
        }
        else if (h === "latihan") {
            latihan();
            tab = "latihan";
        }
        else if (h === "tata") {
            tata();
            tab = "tata";
        }
        else if (m = h.match(/^tata-([a-z-]+)$/)) {
            tataView(m[1]);
            tab = "tata";
        }
        else if (h === "pola") {
            pola();
            tab = "pola";
        }
        else if (m = h.match(/^pola-(\d+)$/)) {
            pola(+m[1]);
            tab = "pola";
        }
        else if (h === "dengar") {
            dengar();
            tab = "dengar";
        }
        else if (m = h.match(/^dengar-info-(\d+)$/)) {
            dengarView(+m[1], true);
            tab = "dengar";
        }
        else if (m = h.match(/^dengar-(\d+)$/)) {
            dengarView(+m[1]);
            tab = "dengar";
        }
        else if (h === "baca") {
            bacaList();
            tab = "baca";
        }
        else if (m = h.match(/^r(\d+)$/)) {
            if (RD[+m[1] - 1])
                bacaView(+m[1]);
            else
                bacaList();
            tab = "baca";
        }
        else if (h === "tulis") {
            tulis();
            tab = "tulis";
        }
        else if (h === "tulis-susun") {
            tulisSusun();
            tab = "tulis";
        }
        else if (h === "tulis-terjemah") {
            tulisTerjemah();
            tab = "tulis";
        }
        else if (h === "tulis-formulir") {
            tulisFormular(-1);
            tab = "tulis";
        }
        else if (m = h.match(/^tulis-formulir-(\d+)$/)) {
            tulisFormular(+m[1] - 1);
            tab = "tulis";
        }
        else if (h === "tulis-pesan") {
            tulisPesan();
            tab = "tulis";
        }
        else if (h === "tulis-situasi") {
            tulisSituasi();
            tab = "tulis";
        }
        else if (m = h.match(/^tulis-(\d+)$/)) {
            tulisBab(+m[1]);
            tab = "tulis";
        }
        else if (h === "bicara") {
            bicara();
            tab = "bicara";
        }
        else if (h === "bicara-lafal") {
            bicaraLafal();
            tab = "bicara";
        }
        else if (h === "bicara-kenal") {
            bicaraKenal();
            tab = "bicara";
        }
        else if (h === "bicara-minta") {
            bicaraMinta();
            tab = "bicara";
        }
        else if (m = h.match(/^bicara-(\d+)$/)) {
            bicaraBab(+m[1]);
            tab = "bicara";
        }
        else if (h === "ulangi") {
            ulangi();
            tab = "bicara";
        }
        else if (h === "ngobrol") {
            ngobrol();
            tab = "bicara";
        }
        else if (h === "dialog") {
            dialogList();
            tab = "dialog";
        }
        else if (m = h.match(/^d(\d+)$/)) {
            if (DLG[+m[1] - 1])
                dialogView(+m[1]);
            else
                dialogList();
            tab = "dialog";
        }
        else if (h === "tes") {
            tes();
            tab = "tes";
        }
        else if (h === "tes-cepat") {
            tesCepat();
            tab = "tes";
        }
        else if (h === "penempatan") {
            penempatan();
            tab = "tes";
        }
        else if (h === "tes-hoeren") {
            tesHoeren();
            tab = "tes";
        }
        else if (h === "tes-lesen") {
            tesLesen();
            tab = "tes";
        }
        else if (h === "tes-schreiben") {
            tesSchreiben();
            tab = "tes";
        }
        else if (h === "tes-sprechen") {
            tesSprechen();
            tab = "tes";
        }
        else if (h === "akun" || h === "masuk") {
            akun();
            tab = "akun";
        }
        else if (h === "rencana") {
            rencana();
            tab = "rencana";
        }
        else if (h === "progres") {
            progres();
            tab = "progres";
        }
        else {
            home();
            tab = "home";
        }
    }
    catch (err) {
        app.innerHTML = `<a class="crumb" href="#">← Beranda</a><div class="goal" style="margin-top:16px"><b>Halaman ini gagal dimuat.</b><br>Coba muat ulang halaman. Jika masih terjadi, kirim detail ini ke pengembang: <span class="note">${escH(String(err && err.message || err))}</span></div>`;
    }
    document.body.setAttribute("data-view", tab === "buku" ? "bab" : (tab || "home"));
    let cur = null;
    document.querySelectorAll("#tabs a").forEach(a => { if (a.dataset.t === tab) {
        a.setAttribute("aria-current", "page");
        cur = a;
    }
    else
        a.removeAttribute("aria-current"); });
    const tb = $("#tabs");
    if (cur && tb) {
        const l = cur.offsetLeft - tb.offsetLeft, r = l + cur.offsetWidth;
        if (l < tb.scrollLeft || r > tb.scrollLeft + tb.clientWidth)
            tb.scrollLeft = Math.max(0, l - 24);
    }
    updateProg();
    updAcct();
    window.scrollTo(0, 0);
}
addEventListener("hashchange", route);
if (HAS_SPEECH) {
    try {
        speechSynthesis.getVoices();
    }
    catch (e) { }
}
route();
window.__mdOK = true;
