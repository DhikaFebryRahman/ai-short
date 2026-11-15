# Kapsul Fakta — HyperFrames Video Project

Proyek video pendek vertikal (`1080×1920`, `30 fps`) berbasis **HyperFrames** (HTML/SVG/GSAP) yang berjalan langsung di direktori root ini.

## Struktur Direktori
- `index.html` & `hyperframes.json` — komposisi root dan konfigurasi HyperFrames
- `compositions/` — sub-komposisi (`backdrop.html`, `hud.html`, `captions.html`, `scene-01.html`–`scene-06.html`)
- `assets/` — aset audio & media aktif (`vo.mp3`, `bgm.wav`)
- `renders/` — hasil render MP4 HyperFrames (`renders/deja-vu-2d.mp4`)
- `remotion-draf/` — arsip aset lama (`projects/`, `public/`, `referensi/`)
- `out/` — arsip hasil render lama (`out/video.mp4`)
- `studio/` — antarmuka web Studio lokal (`npm run ui`)

## Perintah Utama
```bash
# Validasi lint, kontras, layout, audio
npx hyperframes check --json

# Buka Studio Preview di browser
npx hyperframes preview --background

# Render video MP4 kualitas delivery
npx hyperframes render --quality delivery --output renders/deja-vu-2d.mp4
```
