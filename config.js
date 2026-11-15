/* Mein Deutsch A1 – config.js
   Pengaturan akun online (Supabase). Lihat README.md bagian "Login & simpan progres di akun".
   1. Buat proyek gratis di https://supabase.com
   2. Project Settings > API: salin "Project URL" dan kunci "anon public"
   3. Tempel di bawah ini, simpan, lalu unggah ulang file ini.
   Biarkan kosong jika belum memakai akun: website tetap jalan, progres disimpan di browser.
   Kunci anon memang boleh terlihat publik; data dilindungi aturan RLS dari SQL di README. */
window.MD_CONFIG = {
  supabaseUrl: "",      // contoh: "https://abcdefghijk.supabase.co"
  supabaseAnonKey: ""   // contoh: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...."
};
