# Character SVG Templates — Nara (Kapsul Fakta 2D)

Seluruh bagian tubuh berada dalam koordinat lokal `(0, 0)` di kepala-atas hingga `y ≈ 316..364` di kaki.

## 1. Rig Dasar Karakter (Berdiri / Jalan / Terkejut)

```xml
<g id="nara-pos" transform="translate(465, 678)">
  <g id="nara-anim">
    <!-- Bayangan lantai -->
    <ellipse cx="0" cy="364" rx="64" ry="14" fill="#142244" fill-opacity="0.16" />
    <!-- Kaki kiri & kanan -->
    <line id="nara-leg-l" x1="-12" y1="210" x2="-22" y2="348" stroke="#1E3A8A" stroke-width="26" stroke-linecap="round" />
    <line id="nara-leg-r" x1="16" y1="210" x2="26" y2="348" stroke="#2563EB" stroke-width="26" stroke-linecap="round" />
    <!-- Jaket koral + kerah kuning matahari -->
    <rect x="-42" y="72" width="84" height="154" rx="28" fill="#FF7E67" stroke="#142244" stroke-width="5" />
    <path d="M-20 74 L0 102 L20 74 Z" fill="#FFB703" stroke="#142244" stroke-width="3.5" />
    <!-- Tangan -->
    <line id="nara-arm-l" x1="-38" y1="98" x2="-68" y2="172" stroke="#FF9F8E" stroke-width="22" stroke-linecap="round" />
    <line id="nara-arm-r" x1="38" y1="98" x2="54" y2="188" stroke="#FF9F8E" stroke-width="22" stroke-linecap="round" />
    <!-- Kepala, rambut, mata, mulut -->
    <circle cx="0" cy="24" r="42" fill="#FAD2B4" stroke="#142244" stroke-width="5" />
    <path d="M-42 18 C-42 -22 44 -26 42 16 C22 2 -16 2 -42 18 Z" fill="#142244" />
    <circle id="nara-eye-l" cx="-13" cy="22" r="4.5" fill="#142244" />
    <circle id="nara-eye-r" cx="15" cy="22" r="4.5" fill="#142244" />
    <path id="nara-mouth" d="M-8 42 Q2 49 12 40" stroke="#142244" stroke-width="4" stroke-linecap="round" />
  </g>
</g>
```

## 2. Snippet Animasi GSAP Deterministik

### Jalan Kaki + Bobbing Kepala
```js
var walkState = { x: 154, stride: 0 };
function syncWalk() {
  var swing = Math.sin(walkState.stride) * 26;
  var bob = Math.abs(Math.sin(walkState.stride)) * -7;
  gsap.set(naraPos, { attr: { transform: "translate(" + walkState.x.toFixed(1) + ", " + (678 + bob).toFixed(1) + ")" } });
  gsap.set(legL, { attr: { x2: (-14 - swing).toFixed(1) } });
  gsap.set(legR, { attr: { x2: (16 + swing).toFixed(1) } });
  gsap.set(armR, { attr: { x2: (28 - swing * 0.7).toFixed(1) } });
}
tl.fromTo(walkState, { x: 154, stride: 0 }, { x: 465, stride: Math.PI * 4, duration: 2.55, ease: "power2.out", onUpdate: syncWalk }, 0.15);
```

### Kedip Mata Deterministik (di detik ke-t)
```js
tl.to([eyeL, eyeR], { attr: { r: 0.8 }, duration: 0.06, ease: "power2.in" }, 1.8)
  .to([eyeL, eyeR], { attr: { r: 4.5 }, duration: 0.08, ease: "power2.out" }, 1.88);
```

### Ekspresi Kaget / Penasaran
- Ganti `#nara-mouth` dengan `<ellipse cx="4" cy="36" rx="7" ry="5" fill="#142244" />` atau animasikan `scaleY` pada grup ekspresi.
- Tambahkan badge `?` putih-cyan di kanan atas kepala saat momen pertanyaan muncul.

