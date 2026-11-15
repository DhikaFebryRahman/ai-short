---
name: kapsul-2d-character-rig
description: Panduan karakter 2D modular (Nara), rig animasi SVG+GSAP deterministik, dan palet warna cerah daylight full-screen (1080x1920) untuk proyek Kapsul Fakta di HyperFrames. Gunakan setiap kali membuat atau mengedit video explainer 2D full-screen bergaya cerah tanpa kotak pembatas.
---

# Kapsul 2D Character Rig & Daylight Full-Screen System

Skill ini memastikan seluruh episode 2D Kapsul Fakta tampil konsisten: **100% full-screen (1080×1920)** tanpa kotak pembatas, palet **Cerah Hangat / Daylight** ber-kontras tinggi, dan karakter 2D (**Nara**) yang ter-rig aman di GSAP.

## 1. Aturan Koordinat & Anti-Bug SVG + GSAP (WAJIB)
- **Jangan pernah menganimasikan CSS `x` atau `y` GSAP langsung pada `<g transform="translate(X, Y)">`** karena GSAP akan menimpa `translate(X, Y)` SVG menjadi `0` (karakter meloncat ke tepi atas layar).
- Selalu gunakan **pola 2-layer wrapper**:
  ```xml
  <g id="sN-nara-pos" transform="translate(500, 710)">
    <g id="sN-nara-anim">
      <!-- seluruh tubuh karakter di koordinat lokal (0,0) -->
    </g>
  </g>
  ```
  - Animasi posisi dasar di panggung: target `#sN-nara-pos` memakai `{ attr: { transform: "translate(X, Y)" } }`.
  - Animasi bounce/napas/masuk-keluar lokal: target `#sN-nara-anim` memakai `x`, `y`, `scale`, `opacity`.

## 2. Palet Warna Cerah Daylight & Kontras Aman
Gunakan token berikut agar lolos `hyperframes check` (`contrast >= 4.5:1`):
- **Langit & Latar:**
  - Sky blue top: `#A7DCFF` → `#CBE7FF` → `#E7F6FF`
  - Warm sunlit cream wall/horizon: `#FFEED6` → `#FFF6E5` → `#FFF9EF`
  - Meadow / park mint: `#BCEFD0` / `#A7E8BD` / `#6EE7B7`
  - Golden oak / cream floor: `#F7D49C` → `#FCE7C8`
- **Tinta Teks & Garis Tepi (High Contrast):**
  - Ink utama & outline kartun: `#142244` (`stroke-width: 4.5`–`6`)
  - Muted italic serif: `#243B6B`
  - Amber keyword text: `#9A3412` (aksen fill `#FFB703` / `#F59E0B`)
  - Cyan keyword text: `#0369A1` (aksen fill `#0EA5E9` / `#38BDF8`)
  - Mint/Green keyword text: `#047857` (aksen fill `#10B981` / `#34D399`)
  - Coral/Red keyword text: `#BE123C` (aksen fill `#F43F5E` / `#FF7E67`)

## 3. Zona Aman Vertikal (`1080×1920` TikTok / Reels / Shorts)
- Seluruh HUD, badge, pill, dan caption HTML diletakkan pada **kolom aman**: `left: 118px; width: 750px;` (`x: 118..868` agar bebas dari tombol kanan TikTok/Shorts).
- **Top HUD:** `top: 256px;`
- **Area aksi utama karakter & lingkungan:** `y: 360px` – `1040px`
- **Chip label aksi (`.pill-bar`):** `top: 1066px; height: 62px;`
- **Caption kinetik (`.cap-band`):** `top: 1138px; height: 140px;` dengan background halo krem radial lembut `radial-gradient(ellipse at center, rgba(255, 250, 242, 0.9) 0%, rgba(255, 250, 242, 0.68) 65%, transparent 100%)`.

## 4. Template Rig & Pose Karakter
Baca [references/character-svg-templates.md](references/character-svg-templates.md) untuk copy-paste langsung rig SVG Nara (pose *walk*, *curious/echo*, *hold-lens*, *surprised*, *wave-bye*) beserta snippet animasi langkah kaki & kedip mata GSAP.

