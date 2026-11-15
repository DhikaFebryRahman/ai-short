import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Clapperboard,
  FileText,
  FolderKanban,
  MessageSquareCode,
  Moon,
  Music2,
  Settings,
  Sun,
} from "lucide-react";
import type { ProjectData, ProjectSummary } from "../../shared/types";
import { api } from "./lib/api";
import { AsetTab } from "./tabs/AsetTab";
import { PengaturanTab } from "./tabs/PengaturanTab";
import { PromptAgentTab } from "./tabs/PromptAgentTab";
import { ProyekTab } from "./tabs/ProyekTab";
import { RenderHasilTab } from "./tabs/RenderHasilTab";
import { StoryboardTab } from "./tabs/StoryboardTab";

type TabId =
  | "proyek"
  | "storyboard"
  | "aset"
  | "prompt"
  | "render"
  | "pengaturan";

const SIDE_TABS: readonly {
  readonly id: TabId;
  readonly label: string;
  readonly icon: React.ComponentType<{ size?: number }>;
  readonly requiresProject?: boolean;
}[] = [
  { id: "proyek", label: "Episode", icon: FolderKanban },
  {
    id: "storyboard",
    label: "Naskah & Storyboard",
    icon: FileText,
    requiresProject: true,
  },
  { id: "aset", label: "Aset", icon: Music2, requiresProject: true },
  {
    id: "prompt",
    label: "Prompt & Revisi Agent",
    icon: MessageSquareCode,
    requiresProject: true,
  },
  {
    id: "render",
    label: "Render & Hasil",
    icon: Clapperboard,
    requiresProject: true,
  },
  { id: "pengaturan", label: "Pengaturan", icon: Settings },
];

type ThemeMode = "light" | "dark";
const THEME_STORAGE_KEY = "kapsul-fakta-theme";

const readInitialTheme = (): ThemeMode => {
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark"
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
};

export const App: React.FC = () => {
  const [theme, setTheme] = useState<ThemeMode>(readInitialTheme);
  const [activeTab, setActiveTab] = useState<TabId>("proyek");
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [activeProject, setActiveProject] = useState<ProjectData | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Abaikan jika penyimpanan lokal dibatasi
    }
  }, [theme]);


  const refreshProjects = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await api.listProjects();
      setProjects(res.projects);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void refreshProjects();
  }, [refreshProjects]);

  const selectProject = async (slug: string) => {
    const res = await api.getProject(slug);
    setActiveProject(res.project);
  };

  const handleCreate = async (title: string, seri: string) => {
    const res = await api.createProject(title, seri);
    setActiveProject(res.project);
    await refreshProjects();
    setActiveTab("storyboard");
  };

  const handleDuplicate = async (slug: string) => {
    const res = await api.duplicateProject(slug);
    setActiveProject(res.project);
    await refreshProjects();
  };

  const handleArchiveToggle = async (slug: string, archived: boolean) => {
    const res = await api.archiveProject(slug, archived);
    if (activeProject?.slug === slug) {
      setActiveProject(res.project);
    }
    await refreshProjects();
  };

  const handleProjectUpdate = (patch: Partial<ProjectData>) => {
    if (!activeProject) return;
    const optimistic: ProjectData = {
      ...activeProject,
      ...patch,
    };
    setActiveProject(optimistic);
    setSaveState("saving");

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }

    const slug = optimistic.slug;
    saveTimerRef.current = window.setTimeout(async () => {
      try {
        const res = await api.saveProject(slug, optimistic);
        setActiveProject(res.project);
        setSaveState("saved");
        await refreshProjects();
      } catch {
        setSaveState("idle");
      }
    }, 350);
  };

  const handleProjectReplaced = async (project: ProjectData) => {
    setActiveProject(project);
    setSaveState("saved");
    await refreshProjects();
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-eyebrow">Kapsul Fakta</div>
          <div className="brand-title">Studio Produksi</div>
        </div>

        <div className="theme-controls">
          <div className="theme-switch" role="group" aria-label="Tema tampilan">
            <button
              type="button"
              className={`theme-switch-btn ${theme === "light" ? "active" : ""}`}
              aria-pressed={theme === "light"}
              onClick={() => setTheme("light")}
            >
              <Sun size={14} />
              <span>Terang</span>
            </button>
            <button
              type="button"
              className={`theme-switch-btn ${theme === "dark" ? "active" : ""}`}
              aria-pressed={theme === "dark"}
              onClick={() => setTheme("dark")}
            >
              <Moon size={14} />
              <span>Gelap</span>
            </button>
          </div>
        </div>

        <nav className="nav-list" aria-label="Menu utama">
          {SIDE_TABS.map((tab) => {
            const Icon = tab.icon;
            const disabled = Boolean(tab.requiresProject && !activeProject);
            return (
              <button
                key={tab.id}
                type="button"
                className={`nav-item ${activeTab === tab.id ? "active" : ""}`}
                disabled={disabled}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={17} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Proyek Aktif
          </div>
          {activeProject ? (
            <>
              <div style={{ fontWeight: 600, fontSize: 13 }}>
                {activeProject.title}
              </div>
              <div className="mono" style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                {activeProject.slug}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {saveState === "saving"
                  ? "Menyimpan..."
                  : saveState === "saved"
                    ? "Tersimpan"
                    : "Siap"}
              </div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              Pilih atau buat proyek di tab Proyek.
            </div>
          )}
        </div>
      </aside>

      <main className="main-area">
        {activeTab === "proyek" ? (
          <ProyekTab
            projects={projects}
            activeSlug={activeProject?.slug ?? null}
            loading={loadingList}
            onSelect={selectProject}
            onCreate={handleCreate}
            onDuplicate={handleDuplicate}
            onArchiveToggle={handleArchiveToggle}
            onOpenFolder={async (slug) => {
              await api.openFolder(slug);
            }}
          />
        ) : null}

        {activeTab === "storyboard" && activeProject ? (
          <StoryboardTab
            project={activeProject}
            onUpdate={handleProjectUpdate}
          />
        ) : null}

        {activeTab === "aset" && activeProject ? (
          <AsetTab
            project={activeProject}
            onProjectReplaced={handleProjectReplaced}
          />
        ) : null}

        {activeTab === "prompt" && activeProject ? (
          <PromptAgentTab
            project={activeProject}
            onUpdate={handleProjectUpdate}
            onProjectReplaced={handleProjectReplaced}
          />
        ) : null}

        {activeTab === "render" && activeProject ? (
          <RenderHasilTab
            project={activeProject}
            onProjectReplaced={handleProjectReplaced}
          />
        ) : null}

        {activeTab === "pengaturan" ? <PengaturanTab /> : null}
      </main>
    </div>
  );
};

