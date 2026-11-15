# Aturan proyek video Kapsul Fakta (HyperFrames)
## Spesifikasi
- Komposisi 1080x1920, 30 fps. Durasi = durasi voiceover + 1 detik pembuka + 1,5 detik penutup, dibulatkan ke atas ke detik penuh. MAKSIMAL 60 detik; jika lebih, berhenti dan tanya saya. Voiceover mulai di detik 1.0.
- Jangan memotong, mempercepat, atau mengubah isi narasi. Ejaan teks di layar persis seperti naskah.
- Seluruh animasi harus deterministik mengikuti timeline HyperFrames (`window.__timelines`, GSAP timeline paused, `data-start`, `data-duration`). Dilarang `Math.random()`, `Date.now()`, fetch jaringan saat runtime, dan animasi/transition CSS yang tidak deterministik.
- Variabel tema dan warna disatukan di CSS `:root` / `data-composition-variables` agar mudah dirawat.
## Gaya (2D Full-Screen Cerah)
- Proyek HyperFrames berada langsung di root workspace ini (`index.html`, `compositions/`, `assets/`, `renders/`).
- Top bar bersegmen: satu segmen per scene, terisi seiring scene berjalan; label seri huruf besar spasi lebar di kiri; counter "01 / NN" di kanan.
- Tampilan penuh 1 screen (1080x1920, tanpa kotak pembatas kaku) dengan ilustrasi karakter & lingkungan 2D bergerak yang hidup dan palet warna cerah yang kontras.
- Caption kinetik kata demi kata (menggantikan subtitle): pengantar serif miring (`Playfair Display` / `Lora Italic`), kata kunci `Poppins` bold beraksen warna dengan kontras tinggi agar jelas di atas ilustrasi penuh.
- Objek dan karakter utama bergerak halus mengikuti narasi dengan gerakan kamera (pan/zoom) dan chip label kecil di bawah aksi utama.
- Zona aman platform vertikal: konten teks, HUD, dan caption berada di area aman agar tidak tertutup UI Shorts/Reels/TikTok.
## Proses (wajib)
0. **Audit & aktivasi skills sebelum generate (WAJIB):** Sebelum menulis kode video atau naskah visual baru, periksa daftar skill di `.agents/skills/` (dan skill global yang relevan), baca `SKILL.md` dari seluruh skill yang dibutuhkan, lalu sebutkan singkat skill mana saja yang dipakai:
   - *Kontrak & CLI HyperFrames:* `hyperframes`, `hyperframes-cli`, `hyperframes-registry`
   - *Gaya 2D, Karakter & Animasi:* `kapsul-2d-character-rig`, `hyperframes-lottie-svg`, `style-sampling`, `awesome-opus5-5-videos`
   - *Aset, Audio, SFX & Pemrosesan:* `media-use`, `kapsul-sfx-sound-design`, `ffmpeg`
   - *Bila relevan dengan input user:* `figma` (desain Figma), `reverse-any-video` (tiru video referensi), `motion-graphics-by-nalarka` (alur naskah/VO), `remotion-to-hyperframes` (porting kode lama)
1. Ukur durasi & jeda voiceover (`ffmpeg` / `ffprobe`); selaraskan batas scene dan caption dengan jeda kalimat.
2. Bangun atau edit komposisi di `index.html` + `compositions/`, jalankan `npx hyperframes check --json` dan periksa snapshot frame dengan `npx hyperframes snapshot --at ...` sebelum lanjut.
3. Jalankan Studio Preview (`npx hyperframes preview --background`) untuk review dan tunggu persetujuan saya sebelum render MP4 penuh. Gunakan `npx hyperframes preview --stop` saat review selesai.
4. Render penuh hanya setelah saya setuju: `npx hyperframes render --quality delivery --output renders/<nama-video>.mp4`.
5. Verifikasi hasil MP4 dengan `ffprobe`: durasi, jumlah frame, `1080x1920`, `30 fps`, `H.264` + `AAC`. Laporkan angka sebenarnya. Jangan menyatakan selesai sebelum itu.
## Key Technical Rules (HyperFrames)
- Setiap elemen bertimed wajib memakai `data-start`, durasi, dan `class="clip"`.
- Daftarkan satu timeline root paused per komposisi pada `window.__timelines["<composition-id>"] = gsap.timeline({ paused: true })`.
- Gunakan `data-composition-src="compositions/file.html"` untuk sub-komposisi.
## Hemat token & Kejujuran
- Pakai struktur dan pola komponen HyperFrames yang sudah ada; jangan mencetak file panjang di chat.
- Jika error, tampilkan pesan asli dan jelaskan. Laporkan keterbatasan secara jujur (timing perkiraan, klaim fakta di naskah, atau warning dari `hyperframes check`).
