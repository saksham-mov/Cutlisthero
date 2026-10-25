import React, { useState, useEffect, useRef } from 'react';
import { Project, ProjectPiece, OptimizationOutput } from './types/project';
import { optimizeProject, decodeProjectFromHash } from './utils/optimizer';
import { Sidebar } from './components/Sidebar';
import { StockSection } from './components/StockSection';
import { PiecesSection } from './components/PiecesSection';
import { ResultSection } from './components/ResultSection';
import { Footer } from './components/Footer';

const STORAGE_PROJECTS_KEY = 'cutlisthero_projects_v3';
const STORAGE_ACTIVE_ID_KEY = 'cutlisthero_active_id_v3';
const STORAGE_THEME_KEY = 'cutlisthero_theme_v3';

const DEMO_PROJECT: Project = {
  id: 'demo-1',
  name: '12 pieces · stock 48×96',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  materialMode: 'sheet',
  stockWidth: 48,
  stockLength: 96,
  stockQuantity: 2,
  kerfWidth: 0.125,
  units: 'in',
  allowRotation: true,
  thickness: 0.75,
  pieces: [
    { id: 'dp-1', label: 'Side panel', quantity: 2, length: 36, width: 24, canRotate: true },
    { id: 'dp-2', label: 'Shelf', quantity: 4, length: 36, width: 12, canRotate: true },
    { id: 'dp-3', label: 'Divider', quantity: 4, length: 18, width: 12, canRotate: true },
    { id: 'dp-4', label: 'Back panel', quantity: 1, length: 48, width: 36, canRotate: true },
    { id: 'dp-5', label: 'Top cleat', quantity: 1, length: 36, width: 6, canRotate: true },
  ],
};

export default function App() {
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROJECTS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_ACTIVE_ID_KEY);
      if (savedId) return savedId;
    } catch {}
    return null;
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_THEME_KEY);
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationOutput | null>(null);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);

  const activeProject = projects.find((p) => p.id === activeProjectId) || null;
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync theme with HTML class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_THEME_KEY, 'light');
    }
  }, [darkMode]);

  // Handle shared URL hash on load
  useEffect(() => {
    if (window.location.hash) {
      const decoded = decodeProjectFromHash(window.location.hash);
      if (decoded && decoded.pieces && decoded.pieces.length > 0) {
        const newProj: Project = {
          id: `shared-${Date.now()}`,
          name: decoded.name || 'Shared project',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          materialMode: decoded.materialMode || 'sheet',
          stockWidth: decoded.stockWidth || 48,
          stockLength: decoded.stockLength || 96,
          stockQuantity: decoded.stockQuantity || 1,
          kerfWidth: decoded.kerfWidth !== undefined ? decoded.kerfWidth : 0.125,
          units: decoded.units || 'in',
          allowRotation: decoded.allowRotation !== undefined ? decoded.allowRotation : true,
          thickness: decoded.thickness || 0.75,
          pieces: decoded.pieces,
        };
        setProjects((prev) => [newProj, ...prev]);
        setActiveProjectId(newProj.id);
        window.history.replaceState(null, '', window.location.pathname);
      }
    }
  }, []);

  // Save projects to localStorage debounced
  const persistProjects = (updatedProjects: Project[], newActiveId?: string) => {
    setProjects(updatedProjects);
    if (newActiveId !== undefined) {
      setActiveProjectId(newActiveId);
      localStorage.setItem(STORAGE_ACTIVE_ID_KEY, newActiveId);
    }
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(updatedProjects));
      } catch {}
    }, 500);
  };

  // Create new project
  const handleCreateProject = () => {
    const newId = `proj-${Date.now()}`;
    const newProject: Project = {
      id: newId,
      name: 'Untitled project',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      materialMode: 'sheet',
      stockWidth: 48,
      stockLength: 96,
      stockQuantity: 1,
      kerfWidth: 0.125,
      units: activeProject?.units || 'in',
      allowRotation: true,
      thickness: 0.75,
      pieces: [
        { id: `p-${Date.now()}-1`, label: 'Piece 1', quantity: 1, length: 24, width: 12, canRotate: true },
      ],
    };

    const next = [newProject, ...projects];
    persistProjects(next, newId);
    setOptimizationResult(null);
  };

  // Open demo project from empty state
  const handleLoadDemoProject = () => {
    const next = [DEMO_PROJECT, ...projects.filter((p) => p.id !== DEMO_PROJECT.id)];
    persistProjects(next, DEMO_PROJECT.id);
    const initialRes = optimizeProject(DEMO_PROJECT);
    setOptimizationResult(initialRes);
  };

  // Delete project
  const handleDeleteProject = (id: string) => {
    const next = projects.filter((p) => p.id !== id);
    let nextActiveId = activeProjectId;
    if (activeProjectId === id) {
      nextActiveId = next.length > 0 ? next[0].id : null;
    }
    persistProjects(next, nextActiveId || '');
    if (!nextActiveId) {
      setOptimizationResult(null);
    }
  };

  // Update active project fields
  const handleUpdateActiveProject = (updates: Partial<Project>) => {
    if (!activeProject) return;

    let updatedName = updates.name !== undefined ? updates.name : activeProject.name;
    const pieces = updates.pieces !== undefined ? updates.pieces : activeProject.pieces;
    const stockW = updates.stockWidth !== undefined ? updates.stockWidth : activeProject.stockWidth;
    const stockL = updates.stockLength !== undefined ? updates.stockLength : activeProject.stockLength;

    // Auto-rename "Untitled project" once pieces exist
    if (
      (activeProject.name === 'Untitled project' || activeProject.name.includes('pieces · stock')) &&
      updates.name === undefined
    ) {
      const totalPieces = pieces.reduce((sum, p) => sum + (p.quantity || 1), 0);
      if (totalPieces > 0) {
        updatedName = `${totalPieces} pieces · stock ${stockW}×${stockL}`;
      }
    }

    const updated: Project = {
      ...activeProject,
      ...updates,
      name: updatedName,
      updatedAt: new Date().toISOString(),
    };

    const next = projects.map((p) => (p.id === activeProject.id ? updated : p));
    persistProjects(next);
  };

  // Run optimization with intentional ~200ms tactile delay
  const handleOptimize = () => {
    if (!activeProject) return;
    setIsOptimizing(true);
    setTimeout(() => {
      const res = optimizeProject(activeProject);
      setOptimizationResult(res);
      setIsOptimizing(false);
    }, 200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF9] text-[#1C1917] dark:bg-[#0C0A09] dark:text-[#FAFAF9]">
      {/* Settings Row / Header */}
      <header className="no-print sticky top-0 z-20 border-b border-[#E7E5E4] bg-[#FAFAF9]/90 backdrop-blur-xs px-4 sm:px-8 py-3 dark:border-[#292524] dark:bg-[#0C0A09]/90">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Mobile hamburger + H1 and subhead */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpenMobile(true)}
              className="lg:hidden p-1.5 rounded-[6px] border border-[#E7E5E4] text-[#1C1917] hover:bg-[#E7E5E4]/50 dark:border-[#292524] dark:text-[#FAFAF9] text-xs font-medium"
              title="Open Projects"
            >
              ☰
            </button>

            <div>
              <h1 className="text-[14px] font-semibold text-[#1C1917] dark:text-[#FAFAF9] tracking-tight">
                Free Cut List Optimizer
              </h1>
              <p className="text-[12px] text-[#78716C] dark:text-[#A8A29E] leading-tight">
                No signup. No daily limit. No paywall.
              </p>
            </div>
          </div>

          {/* Right: Settings Row (Units & Dark mode) */}
          <div className="flex items-center gap-3 text-[13px]">
            {/* Units toggle */}
            <div className="flex rounded-[6px] border border-[#E7E5E4] bg-white p-0.5 dark:border-[#292524] dark:bg-[#1C1917]">
              {(['in', 'mm', 'cm'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => handleUpdateActiveProject({ units: u })}
                  className={`px-2 py-0.5 rounded-[4px] text-[12px] font-medium transition-colors ${
                    (activeProject?.units || 'in') === u
                      ? 'bg-[#1C1917] text-[#FAFAF9] dark:bg-[#FAFAF9] dark:text-[#1C1917]'
                      : 'text-[#78716C] hover:text-[#1C1917] dark:text-[#A8A29E] dark:hover:text-[#FAFAF9]'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>

            {/* Dark mode toggle */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="h-7 px-2.5 rounded-[6px] border border-[#E7E5E4] bg-white text-[12px] font-medium text-[#1C1917] hover:bg-[#E7E5E4]/40 dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9] dark:hover:bg-[#292524] transition-colors"
              title="Toggle theme"
            >
              {darkMode ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex max-w-6xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          projects={projects}
          activeProjectId={activeProjectId}
          onSelectProject={(id) => {
            setActiveProjectId(id);
            setOptimizationResult(null);
          }}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
          isOpenMobile={isSidebarOpenMobile}
          onCloseMobile={() => setIsSidebarOpenMobile(false)}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {!activeProject ? (
            /* Empty State: exactly the minimal prompt spec */
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
              <button
                type="button"
                onClick={handleCreateProject}
                className="text-[16px] font-medium text-[#1C1917] hover:underline dark:text-[#FAFAF9] transition-all"
              >
                Create your first project →
              </button>

              <button
                type="button"
                onClick={handleLoadDemoProject}
                className="text-[13px] text-[#78716C] dark:text-[#A8A29E] hover:text-[#1C1917] dark:hover:text-[#FAFAF9] transition-colors"
              >
                12 pieces on a 4×8 sheet
              </button>
            </div>
          ) : (
            /* Active Project View */
            <div className="space-y-6">
              {/* Project Name (Inline Editable) */}
              <div className="flex items-center justify-between pb-2 border-b border-[#E7E5E4] dark:border-[#292524]">
                {isEditingName ? (
                  <input
                    type="text"
                    autoFocus
                    value={activeProject.name}
                    onChange={(e) => handleUpdateActiveProject({ name: e.target.value })}
                    onBlur={() => setIsEditingName(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setIsEditingName(false);
                    }}
                    className="text-[18px] font-semibold text-[#1C1917] bg-transparent border-b border-[#1C1917] focus:outline-none dark:text-[#FAFAF9] dark:border-[#FAFAF9]"
                  />
                ) : (
                  <h2
                    onClick={() => setIsEditingName(true)}
                    className="text-[18px] font-semibold text-[#1C1917] dark:text-[#FAFAF9] cursor-pointer hover:opacity-80 transition-opacity"
                    title="Click to rename"
                  >
                    {activeProject.name}
                  </h2>
                )}

                <span className="text-[12px] text-[#78716C] dark:text-[#A8A29E] tabular-nums">
                  {activeProject.pieces.reduce((sum, p) => sum + (p.quantity || 1), 0)} pieces
                </span>
              </div>

              {/* Split-View: Left = Inputs (45%), Right = Result (55%) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* LEFT — INPUTS (45% on desktop = 5 of 12 cols, or 5/11) */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Section 1: Stock */}
                  <StockSection
                    project={activeProject}
                    onChange={handleUpdateActiveProject}
                  />

                  {/* Section 2: Pieces */}
                  <PiecesSection
                    project={activeProject}
                    onUpdatePieces={(pieces) => handleUpdateActiveProject({ pieces })}
                  />

                  {/* Section 3: The Optimize Button */}
                  <div className="pt-2 sticky bottom-4 z-10 lg:static">
                    <button
                      type="button"
                      onClick={handleOptimize}
                      disabled={isOptimizing || activeProject.pieces.length === 0}
                      className="w-full h-10 px-4 rounded-[6px] bg-[#1C1917] text-[#FAFAF9] hover:bg-[#292524] text-[14px] font-medium transition-all dark:bg-[#FAFAF9] dark:text-[#1C1917] dark:hover:bg-[#E7E5E4] disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                    >
                      {isOptimizing ? (
                        <>
                          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          <span>Optimizing...</span>
                        </>
                      ) : (
                        <span>Optimize cuts</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* RIGHT — RESULT VIEW (55% on desktop = 7 of 12 cols) */}
                <div className="lg:col-span-7">
                  <ResultSection
                    result={optimizationResult}
                    project={activeProject}
                  />
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
