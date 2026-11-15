# Aturan proyek video Kapsul Fakta (HyperFrames)

## Spesifikasi

- Komposisi 1080x1920, 30 fps. Durasi = durasi voiceover + 1 detik pembuka + 1,5 detik penutup, dibulatkan ke atas ke detik penuh. MAKSIMAL 60 detik; jika lebih tanya saya. Voiceover mulai di detik 1.0.
- Jangan memotong, mempercepat, atau mengubah isi narasi. Ejaan teks di layar persis seperti naskah.
- Seluruh animasi harus deterministik mengikuti timeline HyperFrames (`window.__timelines`, GSAP timeline paused, `data-start`, `data-duration`). Dilarang `Math.random()`, `Date.now()`, fetch jaringan saat runtime, dan animasi/transition CSS yang tidak deterministik.
- Variabel tema dan warna disatukan di CSS `:root` / `data-composition-variables` agar mudah dirawat.

## Struktur & Gaya (2D Full-Screen Cerah)

- Setiap episode dipisahkan di foldernya sendiri di bawah `episodes/<nama-proyek>/` (contoh: `episodes/deja-vu-2d/`). Episode baru dibuat dengan `npx hyperframes init episodes/<nama-proyek>` agar episode sebelumnya tetap aman.
- Top bar bersegmen: satu segmen per scene, terisi seiring scene berjalan; label seri huruf besar spasi lebar di kiri; counter "01 / NN" di kanan.
- Tampilan penuh 1 screen (1080x1920, tanpa kotak pembatas kaku) dengan ilustrasi karakter & lingkungan 2D bergerak yang hidup dan palet warna cerah yang kontras.
- Caption kinetik kata demi kata (menggantikan subtitle): pengantar serif miring (`Playfair Display` / `Lora Italic`), kata kunci `Poppins` bold beraksen warna dengan kontras tinggi agar jelas di atas ilustrasi penuh.
- Objek dan karakter utama bergerak halus mengikuti narasi dengan gerakan kamera (pan/zoom) dan chip label kecil di bawah aksi utama.
- Zona aman platform vertikal: konten teks, HUD, dan caption berada di area aman agar tidak tertutup UI Shorts/Reels/TikTok.

## Input User & Audio (VO + BGM + SFX)

- User dapat memulai episode dari topik, naskah bebas, atau referensi format output GPT (skrip, storyboard, metadata/JSON) agar agent men-generate materi sesuai format tersebut.
- File voiceover (VO) dapat disediakan manual oleh user, sedangkan BGM dan SFX ditangani oleh agent.
- Jalur BGM: gunakan `media-use` (katalog HeyGen bila sudah `npx hyperframes auth login`, atau MusicGen lokal bila terpasang) **atau** sintesis BGM instrumental deterministik lokal (Python/FFmpeg) saat offline; verifikasi loudness VO + BGM + SFX (`volumedetect`) bebas clipping.

## Proses (wajib)

0. **Audit & aktivasi skills sebelum generate (WAJIB):** Sebelum menulis kode video atau naskah visual baru, periksa daftar skill di `.agents/skills/` (dan skill global/plugin yang relevan), baca `SKILL.md` dari seluruh skill yang dibutuhkan, lalu sebutkan singkat skill mana saja yang dipakai:
   - *Kontrak & CLI HyperFrames:* `hyperframes`, `hyperframes-cli`, `hyperframes-registry`
   - *Koreografi & Prinsip Animasi:* `motion-design` (Three Pillars, layer Primary/Secondary/Ambient, Motion Personality, aturan 1/3)
   - *Arsitektur & Performa GSAP:* `gsap-core` (transform aliases `x`/`y`/`scale`/`rotation`, `immediateRender: false` untuk multi-tween pada properti sama), `gsap-timeline` (labels, `<`/`>` placement, defaults), `gsap-plugins` (`SplitText`, `DrawSVG`/`MorphSVG`/`MotionPath` gratis via CDN/npm), `gsap-performance` (properti compositor saja, batch reads/writes), `gsap-utils` (`clamp`, `mapRange`, `interpolate`, `snap`)
   - *Gaya 2D, Karakter & SVG:* `kapsul-2d-character-rig`, `hyperframes-lottie-svg`, `style-sampling`, `awesome-opus5-5-videos`
   - *Aset, Audio, BGM, SFX & Pemrosesan:* `media-use`, `kapsul-sfx-sound-design`, `ffmpeg`
   - *Desain & Input Eksternal (bila relevan):* `canva-cli`, `canva-edit-design`, `canva-resize-for-social-media`, `figma`, `reverse-any-video`, `motion-graphics-by-nalarka`, `remotion-to-hyperframes`
1. Ukur durasi & jeda voiceover (`ffmpeg` / `ffprobe`); selaraskan batas scene dan caption dengan jeda kalimat. Siapkan/generate BGM & cue SFX di `episodes/<nama-proyek>/assets/`.
2. Bangun atau edit komposisi di `episodes/<nama-proyek>/index.html` + `compositions/`, lalu dari dalam folder episode jalankan `npx hyperframes check --json` dan periksa snapshot frame dengan `npx hyperframes snapshot --at ...` sebelum lanjut.
3. Jalankan Studio Preview dari dalam folder episode (`npx hyperframes preview --background`) untuk review dan tunggu persetujuan saya sebelum render MP4 penuh. Gunakan `npx hyperframes preview --stop` saat review selesai.
4. Render penuh hanya setelah saya setuju: `npx hyperframes render --quality delivery --output renders/<nama-video>.mp4`.
5. Verifikasi hasil MP4 dengan `ffprobe`: durasi, jumlah frame, `1080x1920`, `30 fps`, `H.264` + `AAC`. Laporkan angka sebenarnya. Jangan menyatakan selesai sebelum itu.

## Key Technical Rules (HyperFrames)

- Setiap elemen bertimed wajib memakai `data-start`, durasi, dan `class="clip"`.
- Daftarkan satu timeline root paused per komposisi pada `window.__timelines["<composition-id>"] = gsap.timeline({ paused: true })`.
- Gunakan `data-composition-src="compositions/file.html"` untuk sub-komposisi.

## Hemat token & Kejujuran

- Pakai struktur dan pola komponen HyperFrames yang sudah ada; jangan mencetak file panjang di chat.
- Jika error, tampilkan pesan asli dan jelaskan. Laporkan keterbatasan secara jujur (timing perkiraan, klaim fakta di naskah, status auth/engine BGM, atau warning dari `hyperframes check`).
