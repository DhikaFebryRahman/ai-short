# Review — Mengapa Otak Masih Memproses Suara Saat Kita Tidur Nyenyak?

## Creative Calls
- **Durasi & Struktur:** Menggunakan durasi penuh `68 detik` (`1.0s` pembuka + `64.91s` voiceover utuh + `1.5s` penutup, dibulatkan ke atas ke detik penuh) tanpa end card Scene 6, sesuai persetujuan user.
- **Gaya Visual:** 2D full-screen bernuansa malam lembut (`#101A36` → `#22386B`) di seluruh 5 scene tanpa kotak pembatas kaku, dengan palet kontras tinggi (`#F8FAFC`, `#FCD34D`, `#38BDF8`, `#34D399`, `#FB7185`) dan elemen latar depan kontekstual di area `y = 1530–1920`.
- **Akurasi Ilmiah & Narasi:** Seluruh 141 kata naskah dipertahankan verbatim di `captions.html` dan disinkronkan per kata terhadap `assets/audio/transcript.json`. Visual membedakan aktivitas listrik/pendengaran otak pada N3 dengan kesadaran penuh (`RESPONS OTAK ≠ SADAR PENUH`), menampilkan filter thalamus (bukan sakelar mati), serta menjaga label EEG eksplisit sebagai ilustrasi konseptual.
- **Audio:** BGM instrumental malam lembut (`bgm.wav`, 72 BPM) disintesis deterministik lokal; SFX memanfaatkan Openverse CC0 (`whoosh-soft.wav`, `gleam-chime.wav`, `bell-call.wav`, `water-drop.wav`) serta sintesis lokal (`pop-soft.wav`, `eeg-pulse.wav`, `filter-soft.wav`).

## Measured & Inspected
- **Verifikasi `hyperframes check --json`:** `overall ok: true`, `0 errors` across `lint`, `runtime`, `layout`, `contrast`, `craft`, `audio`.
- **Inspeksi Visual:** Meninjau `review-beats.jpg`, `review-phone.jpg` (360 px), dan frame individual (`4.78s`, `9.35s`, `16.38s`, `31.98s`, `51.5s`, `61.35s`, `67.75s`). Memperbaiki kejelasan kata yang belum diucapkan (`opacity: 0.46`), posisi jendela Scene 1, jeda transisi header antar-scene agar bebas `content_overlap`, lingkaran halo terbuka di Scene 4, serta bulan sabit dan lekuk otak penjaga malam di Scene 5.
- **Belum Didengar Langsung:** Kualitas audio (BGM, VO, dan SFX) baru diukur secara numerik (`volumedetect`, `silencedetect`, `hyperframes check` audio pass) dan belum didengar secara manual.

## Weakest Shot & Future Iteration
- Beat transisi antara suara kipas angin dan nama panggilan di awal Scene 3 (`23.45s–28.5s`) menggunakan pergerakan kamera perlahan; ke depan dapat ditambah animasi denyut gelombang kipas yang lebih berirama bila diinginkan.

## Warnings Kept on Purpose
- `outside_safe_zone` pada `eyebrow` (`top ~258px`) dan dua label pinggir (`SUARA BIASA`, `otak tidak memutus...`) serta `text_below_floor` pada chip/label sekunder (`20–22px`, sesuai ukuran pill/HUD Kapsul Fakta `AGENTS.md`). Seluruh judul utama (`42–44px`), caption kinetik (`36–40px`), dan pesan inti tetap terbaca jelas pada preview `360px`.
- `composition_file_too_large` pada `captions.html` (402 baris) karena menampung 29 grup caption verbatim 141 kata dalam satu track `data-track-kind="captions"`.
