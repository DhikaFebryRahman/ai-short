import type { ProjectData } from "../../../shared/types";

const ROLE_LABEL: Record<string, string> = {
  istilah_kunci: "istilah kunci (amber #FDAE1E)",
  aksi: "aksi/arah (cyan #3CE1FE)",
  berhasil: "berhasil (hijau #34DC8C)",
  masalah: "masalah (merah lembut #F87171)",
};

/**
 * Compose Prompt B automatically from project script, storyboard scenes,
 * asset paths, silence intervals, and reference notes.
 */
export const buildAgentPromptB = (project: ProjectData): string => {
  const lines: string[] = [];

  lines.push(`# PROMPT B — PRODUKSI VIDEO KAPSUL FAKTA`);
  lines.push(`Judul Proyek: ${project.title}`);
  lines.push(`Slug Proyek: ${project.slug}`);
  lines.push(`Label Seri: ${project.seri}`);
  lines.push(`Spesifikasi: 1080x1920, 30 fps, voiceover mulai detik 1.0, penutup 1.5 detik (maksimal 60 detik).`);
  lines.push("");

  lines.push(`## 1. ASET YANG TERSEDIA`);
  if (project.voiceover) {
    lines.push(
      `- Voiceover: projects/${project.slug}/${project.voiceover.relativePath} (durasi ${project.voiceover.durationSeconds.toFixed(2)}s, total video ${Math.ceil(project.voiceover.durationSeconds + 2.5)}s)`,
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
    lines.push(`- Voiceover: BELUM DIUNGGAH`);
  }

  if (project.music.mode === "none") {
    lines.push(`- Musik latar: Tidak ada`);
  } else if (project.music.relativePath) {
    lines.push(
      `- Musik latar (${project.music.mode}): projects/${project.slug}/${project.music.relativePath} (volume ${(project.music.volume * 100).toFixed(0)}%)`,
    );
  }

  if (project.reference) {
    lines.push(
      `- Video referensi: projects/${project.slug}/${project.reference.relativePath}`,
    );
    if (project.reference.contactSheetPath) {
      lines.push(
        `- Contact sheet referensi: projects/${project.slug}/${project.reference.contactSheetPath}`,
      );
    }
    lines.push(
      `- CATATAN PENTING REFERENSI: Ikuti gaya visual, ritme, dan komposisi saja — BUKAN topik atau isi adegan referensi.`,
    );
  } else {
    lines.push(`- Video referensi: Tidak dilampirkan (ikuti gaya standar AGENTS.md).`);
  }

  if (project.konsepVisualGlobal?.trim()) {
    lines.push("");
    lines.push(`## 2. KONSEP VISUAL GLOBAL`);
    lines.push(project.konsepVisualGlobal.trim());
  }

  lines.push("");
  lines.push(
    `## ${project.konsepVisualGlobal?.trim() ? "3" : "2"}. NASKAH & ALUR STORYBOARD PER SCENE`,
  );

  project.scenes.forEach((scene, index) => {
    lines.push("");
    const timeSuffix = scene.timestamp ? ` [${scene.timestamp}]` : "";
    lines.push(
      `### ${scene.id.toUpperCase()} (${index + 1}/${project.scenes.length}) — ${scene.judul}${timeSuffix}`,
    );
    lines.push(
      `- Fungsi: ${scene.fungsi.toUpperCase()} | Status: ${scene.status}${scene.estimasiDetik ? ` | Durasi: ${scene.estimasiDetik}s` : ""}`,
    );
    lines.push(
      scene.narasi.trim()
        ? `- Narasi persis: "${scene.narasi}"`
        : `- Narasi: (kosong / visual-only)`,
    );
    if (scene.pemahamanPenonton) {
      lines.push(`- Pemahaman penonton: ${scene.pemahamanPenonton}`);
    }
    if (scene.ideVisual && (!scene.shots || scene.shots.length === 0)) {
      lines.push(`- Ide visual: ${scene.ideVisual}`);
    }
    lines.push(`- Chip / teks utama di layar: ${scene.chip || "-"}`);
    lines.push(`- Preset kamera: ${scene.kamera}`);
    lines.push(
      `- Kebutuhan 3D: ${scene.butuh3D ? "YA (utamakan @remotion/three)" : "Tidak wajib 3D / boleh 2D atau 3D ringan"}${scene.alasan3D ? ` — Alasan: ${scene.alasan3D}` : ""}`,
    );
    if (scene.kataSorot.length > 0) {
      const highlights = scene.kataSorot
        .map(
          (h) =>
            `"${h.kata}" [${ROLE_LABEL[h.peran] ?? h.peran}]`,
        )
        .join("; ");
      lines.push(`- Kata sorot: ${highlights}`);
    }
    if (scene.shots && scene.shots.length > 0) {
      lines.push(`- Rincian Shot Visual (${scene.shots.length}):`);
      scene.shots.forEach((shot, sIdx) => {
        const shotTime = shot.timestamp ? ` (${shot.timestamp})` : "";
        lines.push(`  - SHOT ${sIdx + 1} — ${shot.judul}${shotTime}`);
        if (shot.visual3D) lines.push(`    - Visual 3D: ${shot.visual3D}`);
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

  if (project.catatanVisual?.trim()) {
    lines.push("");
    lines.push(`## CATATAN PENTING UNTUK VISUAL`);
    lines.push(project.catatanVisual.trim());
  }

  if (project.claims.length > 0) {
    lines.push("");
    lines.push(`## STATUS VERIFIKASI KLAIM`);
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
  lines.push(`## INSTRUKSI EKSEKUSI`);
  lines.push(`1. Bangun scene-01 terlebih dahulu, render satu still, dan tunggu persetujuan saya.`);
  lines.push(`2. Selaraskan batas scene dan kata pada caption kinetik dengan jeda voiceover.`);
  lines.push(`3. Gunakan komponen & tema yang sudah ada di src/ serta @remotion/three untuk elemen 3D, jangan ubah ejaan narasi.`);

  return lines.join("\n");
};

