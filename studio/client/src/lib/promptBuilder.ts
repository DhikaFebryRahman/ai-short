import type { ProjectData } from "../../../shared/types";

const ROLE_LABEL: Record<string, string> = {
  istilah_kunci: "istilah kunci (amber #FFB703)",
  aksi: "aksi/arah (cyan #0EA5E9)",
  berhasil: "berhasil (hijau #10B981)",
  masalah: "masalah (merah lembut #F43F5E)",
};

/**
 * Compose HyperFrames production prompt automatically from topic/script,
 * storyboard scenes, asset paths, silence intervals, and AGENTS.md standards.
 */
export const buildAgentPromptB = (project: ProjectData): string => {
  const lines: string[] = [];
  const basePath = `episodes/${project.slug}`;

  lines.push(`# PRODUKSI EPISODE KAPSUL FAKTA (HYPERFRAMES)`);
  lines.push(`Judul Episode: ${project.title}`);
  lines.push(`Folder Episode: ${basePath}/`);
  lines.push(`Label Seri (Top Bar): ${project.seri}`);
  lines.push(
    `Spesifikasi: 1080x1920, 30 fps, voiceover mulai detik 1.0, penutup +1.5 detik (maksimal 60 detik).`,
  );
  lines.push("");

  lines.push(`## 1. ASET & AUDIO (${basePath}/assets/)`);
  if (project.voiceover) {
    lines.push(
      `- Voiceover: ${basePath}/${project.voiceover.relativePath} (durasi ${project.voiceover.durationSeconds.toFixed(2)}s, target video ${Math.ceil(project.voiceover.durationSeconds + 2.5)}s)`,
    );
    if (project.voiceover.silences.length > 0) {
      const jedaText = project.voiceover.silences
        .map(
          (s) =>
            `${s.start.toFixed(2)}s–${s.end.toFixed(2)}s (${s.duration.toFixed(2)}s)`,
        )
        .join(", ");
      lines.push(`- Jeda terdeteksi (ffmpeg silencedetect): ${jedaText}`);
    }
  } else {
    lines.push(
      `- Voiceover: BELUM DIUNGGAH (buat dulu draf naskah & storyboard untuk saya rekam VO-nya, jika input masih berupa topik).`,
    );
  }

  lines.push(
    `- BGM & SFX: Agent siapkan otomatis (via media-use atau sintesis instrumental lokal) + cue SFX di ${basePath}/assets/audio/`,
  );
  lines.push(`- Gaya visual: Ikuti gaya 2D full-screen cerah standar AGENTS.md.`);

  const rawCombinedGpt =
    project.rawGptText?.trim() ||
    [project.rawNaskahText, project.rawStoryboardText]
      .filter((s) => Boolean(s?.trim()))
      .join("\n\n");

  if (rawCombinedGpt) {
    lines.push("");
    lines.push(`## 2. NASKAH & STORYBOARD DARI GPT (LENGKAP)`);
    lines.push(rawCombinedGpt);
  } else if (project.scenes.length > 0) {
    lines.push("");
    lines.push(`## NASKAH & STORYBOARD PER SCENE (${project.scenes.length})`);

    project.scenes.forEach((scene, index) => {
      lines.push("");
      const timeSuffix = scene.timestamp ? ` [${scene.timestamp}]` : "";
      lines.push(
        `### ${scene.id.toUpperCase()} (${index + 1}/${project.scenes.length}): ${scene.judul}${timeSuffix}`,
      );
      lines.push(
        `- Fungsi: ${scene.fungsi.toUpperCase()}${scene.estimasiDetik ? ` | Durasi: ${scene.estimasiDetik}s` : ""}`,
      );
      lines.push(
        scene.narasi.trim()
          ? `- Narasi persis: "${scene.narasi}"`
          : `- Narasi: (mengikuti naskah utama / visual-only)`,
      );
      if (scene.pemahamanPenonton) {
        lines.push(`- Pemahaman penonton: ${scene.pemahamanPenonton}`);
      }
      if (scene.ideVisual && (!scene.shots || scene.shots.length === 0)) {
        lines.push(`- Ide visual: ${scene.ideVisual}`);
      }
      if (scene.chip) {
        lines.push(`- Chip / teks di layar: ${scene.chip}`);
      }
      lines.push(`- Preset kamera: ${scene.kamera}`);
      if (scene.kataSorot.length > 0) {
        const highlights = scene.kataSorot
          .map(
            (h) => `"${h.kata}" [${ROLE_LABEL[h.peran] ?? h.peran}]`,
          )
          .join("; ");
        lines.push(`- Kata sorot: ${highlights}`);
      }
      if (scene.shots && scene.shots.length > 0) {
        lines.push(`- Rincian Shot Visual (${scene.shots.length}):`);
        scene.shots.forEach((shot, sIdx) => {
          const shotTime = shot.timestamp ? ` (${shot.timestamp})` : "";
          lines.push(`  - SHOT ${sIdx + 1}: ${shot.judul}${shotTime}`);
          if (shot.visual3D) lines.push(`    - Visual: ${shot.visual3D}`);
          if (shot.gerakanKamera) {
            lines.push(`    - Gerakan kamera: ${shot.gerakanKamera}`);
          }
          if (shot.animasi) lines.push(`    - Animasi: ${shot.animasi}`);
          if (shot.teksDiLayar) {
            lines.push(`    - Teks di layar: ${shot.teksDiLayar}`);
          }
          if (shot.audio) lines.push(`    - Audio: ${shot.audio}`);
          if (shot.transisi) lines.push(`    - Transisi: ${shot.transisi}`);
        });
      }
    });
  }

  if (project.catatanVisual?.trim()) {
    lines.push("");
    lines.push(`## CATATAN KHUSUS VISUAL`);
    lines.push(project.catatanVisual.trim());
  }

  if (project.claims.length > 0) {
    lines.push("");
    lines.push(`## VERIFIKASI KLAIM`);
    project.claims.forEach((c, idx) => {
      lines.push(`${idx + 1}. [${c.tercentang ? "x" : " "}] ${c.teks}`);
    });
  }

  if (project.pesanAgent?.trim()) {
    lines.push("");
    lines.push(`## ARAHAN TAMBAHAN`);
    lines.push(project.pesanAgent.trim());
  }

  lines.push("");
  lines.push(`## INSTRUKSI EKSEKUSI (SESUAI AGENTS.md)`);
  lines.push(
    `1. Audit & baca SKILL.md yang relevan terlebih dahulu (hyperframes*, motion-design, gsap-*, kapsul-2d-character-rig, kapsul-sfx-sound-design, media-use, ffmpeg).`,
  );
  lines.push(
    `2. Bangun komposisi HyperFrames 2D full-screen cerah di ${basePath}/index.html + compositions/:`,
  );
  lines.push(
    `   - Top bar atas-lebar (top: 64px; left: 36px; width: 1008px), teks label seri & "01 / NN" kecil (~22px) polos tanpa kotak/tombol.`,
  );
  lines.push(
    `   - Tanpa scene identitas channel / end-card tambahan di akhir; selesai bersih di scene penutup narasi (+1,5 detik).`,
  );
  lines.push(
    `   - Bagian bawah layar (y ~ 1530–1920) wajib diisi elemen latar depan kontekstual agar tidak polos, tetap menjaga area caption bersih.`,
  );
  lines.push(
    `3. Jalankan \`npx hyperframes check --json\` + cek snapshot visual, lalu nyalakan \`npx hyperframes preview --background\` untuk saya review SEBELUM render MP4 penuh & thumbnail 9:16.`,
  );

  return lines.join("\n");
};

/**
 * Compose a targeted revision prompt from open revision notes.
 */
export const buildRevisionPrompt = (project: ProjectData): string => {
  const openItems = (project.revisions ?? []).filter((r) => !r.resolved);
  const basePath = `episodes/${project.slug}`;
  const lines: string[] = [];

  lines.push(`# REVISI KOMPOSISI HYPERFRAMES: ${project.title}`);
  lines.push(`Folder Episode: ${basePath}/`);
  lines.push("");
  lines.push(`Tolong perbaiki bagian berikut dari preview ${basePath}/:`);

  if (openItems.length === 0) {
    lines.push(`1. (Belum ada catatan revisi. Isi target & catatan di atas.)`);
  } else {
    openItems.forEach((item, idx) => {
      const timePart = item.timestamp.trim()
        ? ` [detik ${item.timestamp.trim()}]`
        : "";
      lines.push(`${idx + 1}. **${item.target}**${timePart}: ${item.note}`);
    });
  }

  lines.push("");
  lines.push(
    `Setelah edit, jalankan \`npx hyperframes check --json\` dan periksa snapshot di detik yang direvisi, lalu biarkan \`npx hyperframes preview --background\` tetap aktif agar saya cek ulang sebelum render MP4 penuh.`,
  );

  return lines.join("\n");
};

/**
 * Compose final approval prompt to render full delivery MP4 + 9:16 thumbnail.
 */
export const buildRenderApprovalPrompt = (project: ProjectData): string =>
  [
    `Studio Preview untuk \`episodes/${project.slug}/\` sudah sesuai.`,
    `Silakan hentikan preview (\`npx hyperframes preview --stop\`), render MP4 penuh ke \`episodes/${project.slug}/renders/${project.slug}.mp4\`, buatkan thumbnail YouTube Shorts 9:16 (1080x1920 PNG) ke \`episodes/${project.slug}/renders/${project.slug}-thumbnail.png\`, lalu verifikasi dengan \`ffprobe\`, \`volumedetect\`, dan inspeksi visual.`,
  ].join(" ");
