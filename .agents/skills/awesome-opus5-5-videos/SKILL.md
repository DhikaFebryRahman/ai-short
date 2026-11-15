---
name: awesome-opus5-5-videos
description: >-
  Katalog dan panduan eksekusi 703 prompt animasi dan video berbasis kode
  (HTML, Canvas, SVG, GSAP, Three.js, WebGL/Shader, CSS, dan game/interaktif)
  dari koleksi Awesome Opus 5.5 Videos. Gunakan saat user ingin mencari inspirasi
  atau template prompt video/animasi web, membuat motion graphics berbasis
  HTML/Canvas/SVG/GSAP/Three.js/shader, UI motion loop, adegan 3D, explainer
  interaktif, atau merender animasi web deterministik menjadi file MP4.
---

# Awesome Opus 5.5 Videos

Skill ini membungkus koleksi **703 prompt video & animasi berbasis kode** ([`data/videos.json`](./data/videos.json) dan [`prompts/`](./prompts/)) ke dalam alur pencarian hemat-token dan adaptasi produksi untuk HTML, Canvas, SVG, GSAP, Three.js, shader, maupun ekspor video MP4.

## Aturan Hemat Token (Wajib)

1. **Jangan membaca `data/videos.json` (~813 KB) atau `README.md` (~63 KB) secara utuh.** Selalu gunakan [`scripts/search_prompts.py`](./scripts/search_prompts.py).
2. **Filter dulu dengan `--full-only`** bila mencari blueprint lengkap (496 prompt lengkap vs 207 entri parsial).
3. **Urutkan dengan `--sort length`** bila ingin menemukan prompt produksi yang paling detail (mencakup art direction, timeline, `seek(t)`, Playwright, dan `ffmpeg`).

## Cara Mencari & Membaca Prompt

Jalankan dari terminal menggunakan path absolut skill ini:

```bash
SEARCH="/home/dkaary/Documents/Code/ai-short/.agents/skills/awesome-opus5-5-videos/scripts/search_prompts.py"

# Lihat statistik kategori & tech tag
python3 "$SEARCH" --stats

# Cari prompt lengkap berdasarkan kategori, tag, atau kata kunci
python3 "$SEARCH" -c motion -t svg -t gsap --full-only --sort length -n 10
python3 "$SEARCH" -c explainer -q "kinetic typography" --full-only -n 10
python3 "$SEARCH" -c 3d -t threejs --full-only --sort length -n 10
python3 "$SEARCH" -c interactive -t shader --full-only -n 10

# Tampilkan isi lengkap satu prompt berdasarkan slug
python3 "$SEARCH" --show twoclipping-402193
```

Kategori tersedia: `motion` (369), `3d` (117), `explainer` (116), `interactive` (101).
Tech tag utama: `canvas`, `svg`, `threejs`, `shader`, `gsap`, `css`, `audio`, `playable`, `particles`, `pixel`, `webgl`, `physics`, `ai-image`.

## Alur Kerja Penggunaan

### Mode A — User mencari inspirasi atau referensi prompt
1. Jalankan [`scripts/search_prompts.py`](./scripts/search_prompts.py) dengan filter yang sesuai kebutuhan user.
2. Buka 1–3 kandidat terbaik dengan `--show <slug>`.
3. Sajikan ringkasan opsi (slug, kategori, stack teknologi, tautan/author asli) dan tampilkan atau adaptasikan promptnya sesuai topik user.

### Mode B — User ingin membuat animasi web atau video nyata
1. Cari 1–2 prompt produksi relevan di kategori/tag yang cocok (`--full-only --sort length`) lalu pelajari polanya (`<direction>`, `<structure>`, `<build>`, `<gotchas>`).
2. Sesuaikan dengan permintaan user (topik, teks, durasi, resolusi/rasio aspek, palet warna, aset/brand). Jangan menyalin mentah konten/brand milik contoh.
3. Bangun implementasi sebagai **satu file HTML self-contained** (atau folder proyek rapi di workspace user):
   - Jika targetnya **video MP4**, wajib pakai fungsi waktu deterministik (mis. `window.seek(t)` atau timeline GSAP yang di-pause dan di-`seek(t)` per frame) — hindari `setInterval`, `requestAnimationFrame` non-deterministik, atau `Math.random()` tanpa seed.
   - Jika targetnya **animasi/pengalaman interaktif di browser**, pastikan responsif, lancar di 60 fps, dan tidak bergantung pada aset lokal yang hilang.
4. **Verifikasi sebelum menyerahkan**:
   - **Untuk output HTML interaktif**: periksa error JS/console dan uji tampilan pada viewport target (jika Playwright tersedia, atau beri tahu user cara membukanya di browser).
   - **Untuk output video MP4**: cek dulu ketersediaan Playwright dan `ffmpeg`/`ffprobe`; jangan asal menginstal paket sistem tanpa izin user. Render still keyframe / contact sheet dulu untuk memeriksa tipografi, clipping, dan layout sebelum render penuh, lalu verifikasi file MP4 akhir dengan `ffprobe` (durasi, resolusi, fps, codec).

## Catatan Kompatibilitas
- Prompt di dalam `prompts/` ditulis dalam Bahasa Inggris dan banyak menyebut Claude Opus 5.5; perlakukan sebagai spesifikasi teknis & arah kreatif yang dijalankan oleh agent saat ini.
- Untuk video explainer singkat dengan voiceover memakai Python (`Pillow` + `numpy` + `ffmpeg`) tanpa browser, gunakan skill `motion-graphics-nalarka-antigravity` bila lebih cocok.
