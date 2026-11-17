# Character & Anatomy SVG Templates (Kapsul Fakta 2D)

Seluruh bagian berada dalam koordinat lokal `(0, 0)` di dalam wrapper `<g transform="translate(X, Y)"><g id="...-anim">`.

## 1. Rig Dasar Karakter Nara (Berdiri / Jalan / Terkejut)

```xml
<g id="nara-pos" transform="translate(465, 678)">
  <g id="nara-anim">
    <ellipse cx="0" cy="364" rx="64" ry="14" fill="#142244" fill-opacity="0.16" />
    <line id="nara-leg-l" x1="-12" y1="210" x2="-22" y2="348" stroke="#1E3A8A" stroke-width="26" stroke-linecap="round" />
    <line id="nara-leg-r" x1="16" y1="210" x2="26" y2="348" stroke="#2563EB" stroke-width="26" stroke-linecap="round" />
    <rect x="-42" y="72" width="84" height="154" rx="28" fill="#FF7E67" stroke="#142244" stroke-width="5" />
    <path d="M-20 74 L0 102 L20 74 Z" fill="#FFB703" stroke="#142244" stroke-width="3.5" />
    <line id="nara-arm-l" x1="-38" y1="98" x2="-68" y2="172" stroke="#FF9F8E" stroke-width="22" stroke-linecap="round" />
    <line id="nara-arm-r" x1="38" y1="98" x2="54" y2="188" stroke="#FF9F8E" stroke-width="22" stroke-linecap="round" />
    <circle cx="0" cy="24" r="42" fill="#FAD2B4" stroke="#142244" stroke-width="5" />
    <path d="M-42 18 C-42 -22 44 -26 42 16 C22 2 -16 2 -42 18 Z" fill="#142244" />
    <circle id="nara-eye-l" cx="-13" cy="22" r="4.5" fill="#142244" />
    <circle id="nara-eye-r" cx="15" cy="22" r="4.5" fill="#142244" />
    <path id="nara-mouth" d="M-8 42 Q2 49 12 40" stroke="#142244" stroke-width="4" stroke-linecap="round" />
  </g>
</g>
```

## 2. Ilustrasi Otak Berlipat 2D (Serebrum + Serebelum + Batang Otak)

```xml
<g id="brain-detail" transform="translate(0, 0)">
  <!-- Batang otak & serebelum -->
  <path d="M-34 84 C-32 118 -20 144 -6 154 L14 150 C6 130 6 108 10 82 Z" fill="#fda4af" stroke="#fef3c7" stroke-width="3" />
  <ellipse cx="-66" cy="72" rx="44" ry="28" fill="#fb7185" stroke="#fef3c7" stroke-width="3.5" />
  <path d="M-98 72 L-34 72 M-90 60 L-42 60 M-90 84 L-42 84" stroke="#831843" stroke-width="2.5" opacity="0.65" />
  <!-- Serebrum dengan lipatan gyri/sulci -->
  <path d="M-136 16 C-146 -68 -74 -128 24 -128 C122 -128 168 -56 150 26 C132 96 52 104 -18 96 C-88 90 -130 64 -136 16 Z" fill="#f472b6" stroke="#fef3c7" stroke-width="4.5" />
  <path d="M-104 -26 Q-58 -68 -8 -36 T92 -42 T132 -12 M-106 14 Q-54 -14 2 18 T112 10 M-58 -88 Q-12 -52 -24 22 T12 72 M42 -96 Q68 -48 44 26" stroke="#831843" stroke-width="4" stroke-linecap="round" fill="none" />
</g>
```

## 3. Speech Bubble Bebas-Cacat (Ekor Bulat Bergradasi)

```xml
<g transform="translate(215 775)">
  <g id="speech-callout" opacity="0">
    <rect x="-76" y="-32" width="152" height="60" rx="30" fill="#fbbf24" stroke="#fef3c7" stroke-width="3.5" />
    <circle cx="92" cy="14" r="9" fill="#fbbf24" stroke="#fef3c7" stroke-width="2.5" />
    <circle cx="112" cy="24" r="5.5" fill="#fbbf24" />
    <text x="0" y="7" text-anchor="middle" font-family="Poppins, sans-serif" font-weight="900" font-size="24" fill="#0f172a">"KEVIN!"</text>
  </g>
</g>
```

## 4. Snippet Animasi GSAP Deterministik

### Animasi `Zzz` Multi-Gelombang (Bebas Overlap `data-layout-ignore`)
```xml
<g id="zzz-layer" data-layout-ignore fill="#7dd3fc" font-family="Poppins, sans-serif" font-weight="900">
  <g transform="translate(430 785)"><text id="z1" x="0" y="0" font-size="30" opacity="0">Z</text></g>
  <g transform="translate(465 755)"><text id="z2" x="0" y="0" font-size="36" opacity="0">z</text></g>
  <g transform="translate(505 725)"><text id="z3" x="0" y="0" font-size="28" opacity="0">z</text></g>
</g>
```
```js
[{ el: z1, t: 0.1, dx: 22, rot: -10 }, { el: z2, t: 0.9, dx: 28, rot: 12 }, { el: z3, t: 1.7, dx: 34, rot: -8 }]
  .forEach(function (z) {
    tl.fromTo(z.el,
      { opacity: 0, y: 12, x: 0, scale: 0.65, rotation: 0 },
      { opacity: 0.95, y: -95, x: z.dx, scale: 1.15, rotation: z.rot, duration: 2.6, repeat: 2, ease: "sine.out" },
      z.t
    );
  });
```

### Jalan Kaki + Kedip Mata Nara
```js
var walkState = { x: 154, stride: 0 };
function syncWalk() {
  var swing = Math.sin(walkState.stride) * 26;
  var bob = Math.abs(Math.sin(walkState.stride)) * -7;
  gsap.set(naraPos, { attr: { transform: "translate(" + walkState.x.toFixed(1) + ", " + (678 + bob).toFixed(1) + ")" } });
  gsap.set(legL, { attr: { x2: (-14 - swing).toFixed(1) } });
  gsap.set(legR, { attr: { x2: (16 + swing).toFixed(1) } });
}
tl.fromTo(walkState, { x: 154, stride: 0 }, { x: 465, stride: Math.PI * 4, duration: 2.55, ease: "power2.out", onUpdate: syncWalk }, 0.15);
```
