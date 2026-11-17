---
name: kapsul-2d-character-rig
description: Panduan karakter 2D modular (Nara), rig animasi SVG+GSAP deterministik, ilustrasi anatomis jelas, dan pemilihan palet warna adaptif (daylight cerah atau kosmos/malam kontras tinggi) full-screen (1080x1920) untuk proyek Kapsul Fakta di HyperFrames. Gunakan setiap kali membuat atau mengedit video explainer 2D full-screen.
---

# Kapsul 2D Character Rig & Full-Screen Visual System

Skill ini memastikan seluruh episode 2D Kapsul Fakta tampil konsisten: **100% full-screen (`1080×1920`)**, palet kontras tinggi yang sesuai konteks topik (**Cerah Daylight** atau **Kosmos/Malam Gelap**), ilustrasi anatomis/objek yang jelas, dan rig SVG+GSAP bebas loncatan koordinat.

## 1. Aturan Koordinat & Anti-Bug SVG + GSAP (WAJIB)
- **Jangan pernah menganimasikan CSS `x`, `y`, `scale`, atau `rotation` GSAP langsung pada `<g transform="translate(X, Y)">`** karena GSAP akan menimpa `translate(X, Y)` SVG menjadi `0` (objek meloncat ke pojok/tepi layar).
- **Jangan pernah memakai `svgOrigin: "540 Y"` pada elemen anak yang sudah berada di dalam `<g transform="translate(X, Y)">`** — gunakan `transformOrigin: "50% 50%"` pada inner `<g>` agar rotasi/skala tetap di pusat lokal objek!
- Selalu gunakan **pola 2-layer wrapper**:
  ```xml
  <g id="sN-obj-pos" transform="translate(540, 710)">
    <g id="sN-obj-anim">
      <!-- seluruh bentuk di koordinat lokal (0,0) -->
    </g>
  </g>
  ```
  - Animasi perpindahan global di panggung: target `#sN-obj-pos` memakai `{ attr: { transform: "translate(X, Y)" } }`.
  - Animasi bounce/napas/skala/rotasi lokal: target `#sN-obj-anim` memakai `x`, `y`, `scale`, `rotation`, `opacity`, `transformOrigin: "50% 50%"`.

## 2. Pemilihan Palet Tema Adaptif & Kontras Aman (`>= 4.5:1`)
Pilih palet sesuai latar topik agar selaras dengan ekspektasi visual penonton (bila ragu, tanyakan di awal):
- **A. Tema Daylight Cerah** (alam darat, hewan darat/laut dangkal, sejarah, biologi harian):
  - Langit/Latar: `#9EE7FF` → `#E4F8F4` → `#FFF3DA`
  - Tinta utama & outline: `#142244` (`stroke-width: 4.5–6`)
  - Teks aksen gelap kontras tinggi: Amber `#9A3412`, Cyan `#0369A1`, Mint `#047857`, Coral `#BE123C`
  - Backdrop caption: radial/frosted krem-putih `rgba(255, 252, 246, 0.94)` dengan kata belum-diucapkan `opacity: 0.56` (jangan pernah terlalu pudar `0.12`!).
- **B. Tema Kosmos / Malam Hari Gelap Kontras Tinggi** (luar angkasa, planet, laut dalam, tidur/malam):
  - Latar kosmos/malam: `#040814` / `#060C1F` → `#09132B` → `#0F2046` dengan nebula & bintang deterministik
  - Teks utama & HUD: `#F8FAFC` / `#E2E8F0`
  - Teks & border neon kontras tinggi: Amber `#FBBF24` (`#FDE68A`), Cyan `#38BDF8` (`#7DD3FC`), Emerald `#34D399` (`#6EE7B7`), Coral `#FB7185` (`#FDA4AF`)
  - Backdrop caption: panel gelap `rgba(9, 19, 43, 0.92)` bertepi glow lembut.

## 3. Zona Aman & Layout Vertikal Standar (`1080×1920`, Selaras `AGENTS.md`)
- **Top Bar HUD:** `top: 64px; left: 36px; width: 1008px;` (label seri huruf besar spasi lebar di kiri + counter `"01 / NN"` di kanan polos `~22px` tanpa kotak/pill).
- **Header Judul Scene (`eyebrow` + `h1/h2`):** `top: 204px; left: 140px; width: 800px;`
- **Area Aksi Utama Ilustrasi:** `y: 410px` – `1200px` (pastikan ada margin bersih di atas `1245px`).
- **Chip Label Aksi (`.pill-bar`):** `top: 1245px; left: 130px; width: 820px; height: 62px;`
- **Caption Kinetik (`.cap-band`):** `top: 1340px; left: 130px; width: 820px; height: 165px;`
- **Latar Depan Kontekstual Wajib:** `y: 1530px` – `1920px` (meja/lanskap/konsol telemetri agar bawah layar tidak polos).

## 4. Anti-Cacat Gelembung Bicara, Ilustrasi Anatomis, & Zzz
- **Gelembung Ucapan (Speech Bubble):** Jangan gunakan `<polygon>` segitiga ekor terpisah yang sering menyembul cacat di sudut `<rect rx="...">`. Gunakan pil bulat bersih dengan **2 titik gelembung berekor** (`<circle r="9"/>` lalu `<circle r="5.5"/>`) mengarah ke objek tujuan, dan pakai nama natural (mis. `"KEVIN!"`), hindari teks placeholder literal (`"NAMAMU!"`).
- **Standar Detail Ilustrasi Inti:** Jangan menggambar organ atau manusia sebagai satu oval polos:
  - **Kepala manusia tampak samping:** wajib menampilkan garis dahi, batang hidung, bibir, dagu, leher, rambut, mata tertutup dengan bulu mata, daun telinga, saluran telinga, dan koklea spiral bila konteks pendengaran.
  - **Otak 2D:** wajib menampilkan lobus serebrum berlipat (gyri/sulci), serebelum bergaris di belakang-bawah, dan batang otak agar langsung terbaca sebagai otak.
- **Animasi `Zzz` Tidur:** Setiap adegan tidur wajib memiliki multi-partikel `Z z z` berstagger yang melayang naik, miring lembut, dan memudar deterministik (`data-layout-ignore` pada wrapper `<g>`), jangan pernah teks `"Zzz"` statis!

## 5. Template Rig, Kepala, Otak, & Zzz
Baca [references/character-svg-templates.md](references/character-svg-templates.md) untuk copy-paste langsung rig SVG Nara, kepala tampak samping, otak berlipat 2D, speech bubble bebas-cacat, dan animasi `Zzz` deterministik.
