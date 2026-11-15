# Kapsul Fakta — HyperFrames Video Workspace

Workspace video explainer vertikal (`1080x1920`, `30 fps`) berbasis **HyperFrames** (HTML + SVG + GSAP deterministik) dengan tiap episode dipisahkan di bawah `episodes/<nama-proyek>/`.

## Struktur Workspace

- `episodes/` — Folder terpisah per episode HyperFrames:
  - `episodes/deja-vu-2d/` — Episode *Déjà Vu* (termasuk `index.html`, `compositions/`, `assets/`, `renders/deja-vu-2d.mp4`)
- `AGENTS.md` & `.agent/rules/kapsul-fakta.md` — Aturan wajib spesifikasi, audit skills (`motion-design`, `gsap-*`, `hyperframes*`, `kapsul-*`, `media-use`, `ffmpeg`, dll.), dan alur produksi
- `.agents/skills/` — Kumpulan skill HyperFrames, Motion Design, GSAP, karakter rig 2D, audio/SFX, Canva/Figma, dan FFmpeg
- `remotion-draf/` — Arsip folder proyek Remotion lama (`projects/`, `public/`, `referensi/`)

## Alur Episode Baru

1. Inisialisasi folder episode baru:
   ```bash
   npx hyperframes init episodes/<nama-proyek> --fps 30 --width 1080 --height 1920
   ```
2. Taruh file VO manual di `episodes/<nama-proyek>/assets/` (BGM & SFX di-generate atau disiapkan oleh agent).
3. Validasi, preview, dan render dari dalam folder episode:
   ```bash
   cd episodes/<nama-proyek>
   npx hyperframes check --json
   npx hyperframes preview --background
   npx hyperframes render --quality delivery --output renders/<nama-proyek>.mp4
   ```
