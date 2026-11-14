# Aturan proyek video Kapsul Fakta
## Spesifikasi
- Komposisi 1080x1920, 30 fps. Durasi = durasi voiceover + 1 detik pembuka + 1,5 detik penutup, dibulatkan ke atas ke detik penuh. MAKSIMAL 60 detik; jika lebih, berhenti dan tanya saya. Voiceover mulai di detik 1.0.
- Jangan memotong, mempercepat, atau mengubah isi narasi. Ejaan teks di layar persis seperti naskah.
- Animasi hanya fungsi dari frame (useCurrentFrame, interpolate, spring). Dilarang Math.random, Date.now, dan animasi/transition CSS. Warna dan posisi dari satu tempat (data/tema), bukan tersebar.
## Gaya (dari video referensi di referensi/; ikuti gaya, bukan topik atau urutan adegan)
- Top bar bersegmen: satu segmen per scene, terisi kuning-amber seiring scene berjalan; label seri huruf besar spasi lebar di kiri; counter "01 / NN" di kanan.
- Latar bukan polos tapi tenang: gradasi biru tua (#0D1019 -> #0E1632 -> #112551), glow amber redup kiri-atas, glow biru di bawah, partikel kotak piksel kecil melayang pelan.
- Caption kinetik kata demi kata (menggantikan subtitle): kalimat pengantar miring serif (Lora Italic, #C6CDE4), kata kunci Poppins Bold berwarna + glow. Warna: amber #FDAE1E istilah kunci, cyan #3CE1FE aksi/arah/sudut, hijau #34DC8C berhasil, merah lembut masalah, putih netral.
- Objek utama di tengah yang berubah mengikuti naskah; kamera miring, mendekat, atau memindai dari sudut berbeda sesuai kalimat (gerak halus, ease-in-out). Chip kecil berlabel di bawah visual.
- 3D (CSS 3D atau @remotion/three) hanya pada scene yang ditandai butuh 3D atau yang sulit dijelaskan datar. Selebihnya 2D yang rapi.
- Font: Lora Italic dan Poppins (via @remotion/google-fonts atau file lokal). Zona aman: konten utama y 150-1500.
## Proses (wajib)
1. Analisis video referensi dengan ekstraksi frame (ffmpeg, contact sheet) dan ukur jeda voiceover (ffmpeg silencedetect); selaraskan batas scene dan caption dengan jeda kalimat.
2. Bangun scene pertama saja, tampilkan satu still, TUNGGU persetujuan saya. Lalu bangun sisanya dan biarkan saya cek di Studio.
3. Render penuh hanya setelah saya setuju: npx remotion render src/index.ts <IdKomposisi> out/video.mp4
4. Verifikasi dari file hasil dengan ffprobe: durasi, jumlah frame, 1080x1920, 30 fps, H.264 + AAC. Laporkan angka sebenarnya. Jangan menyatakan selesai sebelum itu.
## Hemat token
- Pakai komponen dan JSON yang sudah ada; jangan menulis ulang. Jangan mencetak file panjang di chat. Perbaiki hanya bagian yang saya minta.
## Kejujuran
- Jika error, tampilkan pesan asli dan jelaskan. Jangan mengklaim hasil "sinematik realistis" bila yang dibuat gaya 2D/3D prosedural. Laporkan keterbatasan (timing per kata perkiraan, klaim fakta yang tampak keliru di naskah).

