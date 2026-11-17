---
name: kapsul-pre-preview-qa
description: Checklist anti-revisi wajib sebelum membuka Studio Preview untuk video Kapsul Fakta (HyperFrames). Menangkap kekurangan kepadatan animasi (terutama 0-5s dan Zzz), kesesuaian tema gelap/cerah, kejelasan anatomi & mekanisme sebab-akibat, jangkar spasial, cacat speech bubble, dan sinkronisasi titik-kurva SVG sebelum user me-review.
---

# Pre-Preview Anti-Revision QA (Kapsul Fakta)

Skill ini merangkum pola revisi yang paling sering terjadi di episode-episode sebelumnya agar **seluruh masalah dicegah sebelum `npx hyperframes preview` dijalankan**.

## 1. Gerbang Kualitas Wajib Sebelum `preview`

### A. Kepadatan Gerak & Zero Dead-Zone (Terutama Detik `0–5s` & Semua Scene)
- **Jangan pernah membiarkan scene tampak statis dalam jendela >2 detik.**
- Setiap scene wajib memadukan **3 layer motion aktif**:
  1. **Primary:** aksi narasi utama (gerakan kamera pan/zoom, objek berpindah, kurva tergambar, atau transisi kondisi).
  2. **Secondary:** elemen pasangan ikut bereaksi! (*Contoh:* jika sel matang berdenyut lalu berubah jadi sel baru, sel baru wajib ikut berdenyut; jika gelombang suara mengenai gendang telinga, gendang telinga ikut bergetar dan pulsa saraf melesat ke otak.)
  3. **Ambient hidup:** partikel mengambang, sinar pemindai/aurora/awan bergeser, korona Matahari berputar, lampu tidur/bintang berkelip, kipas berputar, serta **`Zzz` tidur melayang bertingkat kontinyu** (jangan pernah huruf `"Zzz"` statis!).

### B. Tema Warna Sesuai Konteks Topik (Sebelum Mulai Koding)
- **Topik malam hari / tidur / luar angkasa / planet / laut dalam:** siapkan tema **Gelap Kontras Tinggi** (`#040814`–`#0F2046` + aksen neon/hangat `#FBBF24`, `#38BDF8`, `#34D399`, `#FB7185`, teks `#F8FAFC`) atau konfirmasikan di awal bersama pertanyaan durasi/End Card.
- **Topik siang / alam / biologi harian:** gunakan tema **Daylight Cerah** standar `AGENTS.md`.

### C. Kejelasan Ilustrasi & Mekanisme Sebab-Akibat
- **Hindari ilustrasi terlalu polos:** kepala manusia samping harus jelas (dahi, hidung, bibir, dagu, telinga + saluran telinga); otak harus jelas berlipat (gyri/sulci + serebelum + batang otak); jangan sekadar lingkaran/oval polos.
- **Jelaskan mekanisme sebagai proses visual (Sebab → Aksi → Akibat):** jangan menaruh kotak berlabel statis seperti `"PROTEIN"` saja. Perlihatkan panah stres/kekeringan menekan sel → molekul pelindung datang mengunci membran & DNA → sel kembali stabil.

### D. Anti-Cacat Gelembung, Teks Terpotong, & Jangkar Spasial
- **Speech bubble & callout:** hindari segitiga `<polygon>` ekor terpisah yang menyembul cacat di sudut pil bulat — pakai 2 titik lingkaran berekor (`o •`) dan gunakan nama natural (mis. `"KEVIN!"`), bukan placeholder (`"NAMAMU!"`).
- **Teks di dalam kotak SVG:** cek panjang string huruf kapital bold terhadap lebar `<rect>`; beri margin kanan-kiri >=`25px` agar teks tidak terpotong di tepi kotak.
- **Jangkar logis & arah:**
  - Petir harus berada tepat di bawah awan, bukan melayang di sampingnya.
  - Jumlah objek kunci harus cocok dengan narasi (jika menyebut dua planet Jupiter & Saturnus, tampilkan berlian/properti di keduanya).
  - Arah gerak dan hadap karakter (mis. arah renang ikan) harus searah dengan lintasan geraknya; elemen yang diminta muncul dari bawah / mengecil ke pusat harus menuju titik tengah sebenarnya.
- **Teks dekoratif bergerak (`Zzz`, angka melayang):** beri `data-layout-ignore` pada pembungkus `<g>` agar tidak memicu *false-positive* `content_overlap`.

### E. Anti-Bug Transform & Kurva SVG
- **2-Layer Wrapper Wajib:** Jangan pernah menganimasikan GSAP `x`/`y`/`scale`/`rotation` langsung pada `<g transform="translate(X Y)">`; gunakan `<g transform="translate(X Y)"><g id="...-anim">`.
- **Jangan pakai `svgOrigin` di dalam `<g transform="translate(...)">`:** gunakan `transformOrigin: "50% 50%"` pada inner `<g>`.
- **Shared-Container Kurva + Dot:** Bila `<path>` ikut bergeser (`x`/`y`), bungkus `<path>` dan `dot` `getPointAtLength()` ke dalam satu `<g id="...-track">` agar bola pelacak tidak pernah lepas dari garis!

## 2. Protokol Inspeksi Snapshot Wajib (`snapshot` + `read_file`)
Sebelum menjalankan `preview --background`:
1. Jalankan `npx hyperframes snapshot --at ...` mencakup **minimal 2 titik per scene** (termasuk detik awal `1.5s–3.5s` saat elemen hook muncul dan setiap puncak aksi scene).
2. Buka `contact-sheet-*.jpg` dengan `read_file` dan verifikasi **6 hal ini secara visual**:
   - Ada teks terpotong di tepi layar atau keluar kotak (`...`)?
   - Ada speech bubble/ekor/garis terlihat cacat atau menabrak jendela/judul?
   - Ada objek meloncat ke pojok kiri/atas (tanda bug `translate` GSAP)?
   - Ada titik pelacak terlepas dari kurva/gelombang?
   - Kata caption belum-diucapkan cukup terbaca kontrasnya?
   - Ilustrasi inti terlihat detail & hidup (termasuk `Zzz` jika ada karakter tidur)?
3. Baru jalankan `npx hyperframes check --json` (wajib `0 error`, `0 audio warning`), lalu aktifkan `preview --background`.
