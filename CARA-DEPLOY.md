# Cara deploy Mein Deutsch A1

Isi ZIP ini sudah siap online. **Semua file langsung ada di akar ZIP** (bukan di dalam folder lagi):

```
index.html      ← seluruh website (tampilan, kode, gambar sudah ada di dalam file ini)
404.html        ← salinan index.html, untuk alamat yang salah ketik
js/config.js    ← isi alamat & kunci Supabase di sini kalau mau login online (boleh kosong)
assets/         ← cadangan gambar/ikon (tidak wajib, website tetap jalan tanpanya)
.nojekyll       ← khusus GitHub Pages
```

Yang paling penting: **`index.html` harus berada di folder paling atas situsmu**, bukan di dalam subfolder. Kalau tampilan berantakan (teks polos tanpa warna), hampir selalu karena file diunggah ke folder yang salah atau yang diunggah adalah versi lama yang CSS-nya terpisah.

## Pilihan 1 – Netlify (paling mudah, gratis)
1. Ekstrak ZIP ini di komputer.
2. Buka https://app.netlify.com/drop
3. Seret **folder hasil ekstrak** (yang langsung berisi `index.html`) ke halaman itu.
4. Selesai, Netlify memberi alamat `https://nama-acak.netlify.app`.

## Pilihan 2 – Vercel
1. Buka https://vercel.com/new, pilih upload / deploy folder (atau hubungkan repo GitHub berisi file-file ini).
2. Framework: **Other**. Build command: kosong. Output directory: `.` (titik).

## Pilihan 3 – GitHub Pages
1. Buat repository baru, unggah **isi** ZIP (index.html, 404.html, js, assets, .nojekyll) ke akar repository, bukan ke dalam folder.
2. Settings → Pages → Source: *Deploy from a branch*, Branch: `main` / folder `/ (root)`.
3. Tunggu 1–2 menit, buka `https://namamu.github.io/nama-repo/`.

## Pilihan 4 – Hosting biasa (cPanel, Hostinger, Niagahoster, InfinityFree, dll.)
1. Buka File Manager → masuk ke folder `public_html` (atau `htdocs`).
2. Unggah ZIP ini ke `public_html`, lalu pilih **Extract** di sana.
3. Pastikan `index.html` ada langsung di `public_html`, bukan di `public_html/mein-deutsch-a1/`.
4. Hapus file `index.php` / `default.html` bawaan hosting jika ada, karena bisa tampil lebih dulu.

## Setelah online
- Buka situsmu, lalu tekan **Ctrl+Shift+R** (atau bersihkan cache) agar versi lama tidak tampil.
- Login online: isi `js/config.js` (panduan Supabase ada di README proyek), lalu unggah ulang file itu saja. Jangan lupa isi *Site URL* di Supabase dengan alamat situsmu.
- Huruf (font) diambil dari Google Fonts. Jika internet pengunjung memblokirnya, website tetap jalan dengan huruf cadangan.
