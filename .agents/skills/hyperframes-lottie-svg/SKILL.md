---
name: hyperframes-lottie-svg
description: Panduan mengintegrasikan animasi Lottie (lottie-web), Rive, dan animasi jalur SVG deterministik (strokeDashoffset & getPointAtLength) agar tersinkron sempurna dengan timeline GSAP window.__timelines di HyperFrames.
---

# Deterministic Lottie & SVG Motion in HyperFrames

Gunakan pola ini saat membutuhkan animasi vektor 2D kompleks (Lottie JSON karakter/ikon) atau animasi jalur/partikel SVG agar tetap frame-exact saat di-preview maupun di-render MP4.

## 1. Integrasi Lottie JSON (`lottie-web`)
- **WAJIB simpan file `.json` secara lokal di `assets/lottie/<nama>.json`** — dilarang `fetch()` jaringan eksternal saat runtime render.
- **Matikan loop & autoplay bawaan Lottie** (`loop: false, autoplay: false`), lalu ikat progres frame Lottie langsung ke timeline GSAP root komposisi:

```html
<div id="lottie-host" style="position:absolute; inset:0;"></div>
<script src="https://cdn.jsdelivr.net/npm/lottie-web@5.12.2/build/player/lottie.min.js"></script>
<script>
  (function () {
    "use strict";
    var anim = lottie.loadAnimation({
      container: document.getElementById("lottie-host"),
      renderer: "svg",
      loop: false,
      autoplay: false,
      animationData: window.__LOTTIE_DATA // inline JSON atau script module lokal
    });

    var state = { progress: 0 };
    function syncLottie() {
      if (!anim.totalFrames) return;
      var frame = Math.min(anim.totalFrames - 1, Math.max(0, state.progress * (anim.totalFrames - 1)));
      anim.goToAndStop(frame, true);
    }

    var tl = gsap.timeline({ paused: true });
    tl.to(state, { progress: 1, duration: 5.0, ease: "none", onUpdate: syncLottie }, 0);
    syncLottie();
    tl.seek(0);

    window.__timelines = window.__timelines || {};
    window.__timelines["scene-lottie"] = tl;
  })();
</script>
```

> **Tip inline asset:** Agar deterministik dan zero-fetch bahkan saat headless Chromium membuka komposisi, simpan data JSON ke `assets/lottie/clip.js` sebagai `window.__LOTTIE_DATA = {...}` lalu panggil `<script src="assets/lottie/clip.js"></script>`.

## 2. Animasi Jalur & Spark Partikel SVG (`getTotalLength` + `getPointAtLength`)
Untuk jalur sinyal otak, garis peta, atau koneksi antar objek:
1. Hitung panjang jalur dengan `var len = pathEl.getTotalLength();`.
2. Inisialisasi `gsap.set(pathEl, { strokeDasharray: len, strokeDashoffset: len });`.
3. Animasi menggambar garis + menggerakkan partikel spark bersamaan:
```js
var spark = { p: 0 };
function syncSpark() {
  var pt = pathEl.getPointAtLength(spark.p * len);
  gsap.set(dotEl, { attr: { cx: pt.x.toFixed(1), cy: pt.y.toFixed(1) }, opacity: 1 });
}
syncSpark(); // wajib panggil di init agar posisi awal langsung di atas kurva!
tl.to(pathEl, { strokeDashoffset: 0, duration: 1.4, ease: "power2.out" }, 0.5);
tl.to(spark, { p: 1, duration: 1.4, ease: "power2.out", onUpdate: syncSpark }, 0.5);
```

> **WAJIB — Shared-Container Rule saat Kurva Ikut Bergeser:** Jika `<path>` gelombang (mis. kurva EEG) digeser/di-scroll (`x`, `y`, `scale`), **jangan animasikan `pathEl` langsung!** Bungkus `pathEl` dan `dotEl` di dalam satu `<g id="wave-track">` yang sama lalu animasikan `x`/`y` pada `#wave-track`. Dengan begitu koordinat lokal `getPointAtLength()` dan `dotEl` selalu terkunci 100% di atas kurva di setiap frame!

## 3. Checklist Anti-Error
- Tidak ada CSS `@keyframes` atau `transition` di luar GSAP/HyperFrames timeline.
- Seluruh `<svg>` yang beranimasi zoom/pan di luar viewport memakai atribut `data-layout-allow-overflow` pada wrapper kameranya.
- Partikel teks dekoratif bergerak (seperti `Zzz`, angka/huruf melayang) wajib diberi `data-layout-ignore` pada grup pembungkus `<g>` agar tidak memicu *false-positive* `content_overlap` di `hyperframes check`.
- Jalankan `npx hyperframes check --json` + `npx hyperframes snapshot --at ...` setelah mengubah timeline untuk memastikan tidak ada frame freeze, flicker, atau dot terlepas dari kurva.

