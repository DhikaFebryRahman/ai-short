---
name: kapsul-sfx-sound-design
description: Workflow sound design untuk video motion graphic Kapsul Fakta (HyperFrames): merencanakan cue SFX aksi/transisi, mencari atau membuat SFX via media-use/ffmpeg, menyeimbangkan loudness VO + BGM + SFX, dan memverifikasi mixing tanpa clipping.
---

# Sound Design & SFX Workflow (Kapsul Fakta)

Video motion graphic 2D jauh lebih hidup jika setiap aksi utama, transisi scene, dan kemunculan elemen kunci didukung efek suara (**SFX**) yang rapi dan seimbang di bawah voiceover.

## 1. Cek Kesiapan Aset Audio Terlebih Dahulu
- Gunakan skill `media-use` (`npx hyperframes media-use resolve --type sfx --intent "<intent>" --project .`) untuk mengambil SFX dari Openverse / katalog HeyGen / bundel lokal ke `assets/audio/sfx/`.
- Jika belum sign-in HeyGen atau butuh variasi cepat, cek dulu aset lokal di `assets/` atau `remotion-draf/` dan rapikan durasi/volume dengan `ffmpeg` (skill `ffmpeg`).

## 2. Daftar Cue SFX Standar per Jenis Momen
Gunakan secukupnya (hindari spam SFX yang mengganggu VO):
- **Masuk ruangan / aksi fisik:** `door-open` / `footstep-soft` (`data-volume="0.32"`)
- **Transisi antar scene / swipe / zoom:** `whoosh-soft` (`data-volume="0.28"`, fade out `0.2s`)
- **Pop-up ikon / pill / pertanyaan (`?`):** `pop-bubble` / `ui-chime` (`data-volume="0.30"`)
- **Momen insight / sinyal terhubung:** `spark-chime` / `bell-light` (`data-volume="0.32"`)
- **Mitos dicoret / ketidakcocokan sinyal:** `subtle-buzz` atau `swipe-erase` (`data-volume="0.26"`)

## 3. Penempatan di `index.html` & Standar Mixing
Letakkan setiap SFX pada `<audio class="clip">` di track index terpisah di `index.html`:
```html
<audio id="sfx-door" class="clip" src="assets/audio/sfx/door-open.wav" data-start="0.1" data-duration="0.8" data-volume="0.32" data-track-index="6"></audio>
```
Standar level volume relatif sebelum render:
- **Voiceover (`vo`):** `data-volume="1"` (utama, jernih)
- **Musik Latar (`bgm`):** `data-volume="0.12"`–`0.16` dengan `data-fade-in="0.8"` & `data-fade-out="1.6"`
- **Efek Suara (`sfx`):** `data-volume="0.24"`–`0.38"` (tidak pernah mengalahkan VO)

## 4. Verifikasi Audio Setelah Render
Jalankan wajib setelah render MP4:
```bash
ffmpeg -i renders/<nama-video>.mp4 -af volumedetect -vn -f null - 2>&1 | grep -E "mean_volume|max_volume"
```
Pastikan `max_volume` tetap aman di bawah `-1.0 dB` (tidak clipping `0.0 dB`) dan `mean_volume` wajar (~`-16` hingga `-22 dB`).

