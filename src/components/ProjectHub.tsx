import React, { useState } from 'react';
import { SavedProject, MaterialMode, Unit, ProjectTemplateId, WoodFinish, CutPiece } from '../types/cutlist';
import { PROJECT_PRESETS, ProjectPreset } from '../utils/projectPresets';
import {
  Plus,
  Layers,
  FolderOpen,
  Trash2,
  Copy,
  Clock,
  Sparkles,
  ArrowRight,
  Box,
  Compass,
} from 'lucide-react';

interface ProjectHubProps {
  projects: SavedProject[];
  onOpenProject: (project: SavedProject) => void;
  onCreateProject: (project: SavedProject) => void;
  onDeleteProject: (id: string, e: React.MouseEvent) => void;
  onDuplicateProject: (project: SavedProject, e: React.MouseEvent) => void;
}

export const ProjectHub: React.FC<ProjectHubProps> = ({
  projects,
  onOpenProject,
  onCreateProject,
  onDeleteProject,
  onDuplicateProject,
}) => {
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [projectName, setProjectName] = useState<string>('My Woodworking Project');
  const [mode, setMode] = useState<MaterialMode>('sheet');
  const [unit, setUnit] = useState<Unit>('inches');
  const [stockPreset, setStockPreset] = useState<'4x8' | '5x5' | '8ft' | '10ft' | 'custom'>('4x8');
  const [sheetWidth, setSheetWidth] = useState<number>(48);
  const [sheetLength, setSheetLength] = useState<number>(96);
  const [linearLength, setLinearLength] = useState<number>(96);
  const [kerf, setKerf] = useState<number>(0.125);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('blank');

  const handleStockPresetChange = (preset: '4x8' | '5x5' | '8ft' | '10ft' | 'custom') => {
    setStockPreset(preset);
    if (preset === '4x8') {
      setSheetWidth(unit === 'inches' ? 48 : unit === 'cm' ? 122 : 1220);
      setSheetLength(unit === 'inches' ? 96 : unit === 'cm' ? 244 : 2440);
    } else if (preset === '5x5') {
      setSheetWidth(unit === 'inches' ? 60 : unit === 'cm' ? 152.5 : 1525);
      setSheetLength(unit === 'inches' ? 60 : unit === 'cm' ? 152.5 : 1525);
    } else if (preset === '8ft') {
      setLinearLength(unit === 'inches' ? 96 : unit === 'cm' ? 244 : 2440);
    } else if (preset === '10ft') {
      setLinearLength(unit === 'inches' ? 120 : unit === 'cm' ? 305 : 3050);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    let initialPieces: CutPiece[] = [];
    let templateId: ProjectTemplateId = 'bookshelf';
    let woodFinish: WoodFinish = 'plywood';

    if (selectedPresetId !== 'blank') {
      const found = PROJECT_PRESETS.find((p) => p.id === selectedPresetId);
      if (found) {
        initialPieces = found.pieces;
        templateId = found.templateId;
        woodFinish = found.woodFinish;
      }
    }

    const newProject: SavedProject = {
      id: `proj-${now.getTime()}`,
      name: projectName.trim() || 'Untitled Project',
      timestamp: now.getTime(),
      dateStr,
      pieceCount: initialPieces.reduce((sum, p) => sum + p.quantity, 0),
      mode,
      unit,
      showBothUnits: false,
      sheetWidth: mode === 'sheet' ? sheetWidth : 48,
      sheetLength: mode === 'sheet' ? sheetLength : 96,
      linearLength: mode === 'linear' ? linearLength : 96,
      kerf,
      trimMargin: 0,
      thickness: mode === 'sheet' ? (unit === 'inches' ? 0.75 : 19) : (unit === 'inches' ? 1.5 : 38),
      sheetCost: 65,
      linearCost: 0.85,
      templateId,
      woodFinish,
      pieces: initialPieces,
    };

    onCreateProject(newProject);
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl dark:text-white">
            Projects
          </h2>
          <p className="mt-1 text-sm text-stone-500 dark:text-slate-400">
            Create, manage, and optimize your cut lists without limits.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setProjectName(`Project #${projects.length + 1}`);
            setSelectedPresetId('blank');
            setShowCreateModal(true);
          }}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-2xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-stone-950 shadow-sm transition-all hover:bg-amber-400 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Projects Grid or Empty State */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onOpenProject(project)}
              className="group relative flex cursor-pointer flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-5 transition-all hover:border-amber-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-500/80"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                      project.mode === 'sheet'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                    }`}
                  >
                    {project.mode === 'sheet' ? 'Sheet Goods' : 'Linear Stock'}
                  </span>

                  <span className="flex items-center gap-1 font-mono text-[11px] text-stone-400 dark:text-slate-500">
                    <Clock className="h-3 w-3" />
                    {project.dateStr}
                  </span>
                </div>

                <h3 className="mt-3 text-base font-bold text-stone-900 group-hover:text-amber-600 dark:text-white dark:group-hover:text-amber-400">
                  {project.name}
                </h3>

                <p className="mt-1 font-mono text-xs text-stone-500 dark:text-slate-400">
                  {project.mode === 'sheet'
                    ? `${project.sheetWidth}" × ${project.sheetLength}" sheet`
                    : `${project.linearLength}" stock`}
                  {' · '}
                  {project.pieces?.length || 0} parts ({project.pieceCount || 0} cuts)
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-3 dark:border-slate-800">
                <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  Open Project
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => onDuplicateProject(project, e)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-slate-800 dark:hover:text-white"
                    title="Duplicate project"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => onDeleteProject(project.id, e)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                    title="Delete project"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Minimal Empty State - Fast Start Card */
        <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center sm:p-12 dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto max-w-md space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
              <FolderOpen className="h-7 w-7" />
            </div>

            <h3 className="font-display text-xl font-bold text-stone-900 dark:text-white">
              No Projects Yet
            </h3>
            <p className="text-sm text-stone-500 dark:text-slate-400">
              Create a new cut list project to optimize plywood sheet goods or 2×4 lumber with zero waste.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setProjectName('My First Project');
                  setSelectedPresetId('blank');
                  setShowCreateModal(true);
                }}
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl bg-amber-500 px-6 text-sm font-bold text-stone-950 shadow-sm transition-all hover:bg-amber-400"
              >
                <Plus className="h-4 w-4" />
                <span>Create New Project</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <h3 className="font-display text-xl font-bold text-stone-900 dark:text-white">
              Create New Cut List Project
            </h3>
            <p className="mt-1 text-xs text-stone-500 dark:text-slate-400">
              Configure your stock material and start with a clean workspace.
            </p>

            <form onSubmit={handleCreateSubmit} className="mt-6 space-y-5">
              {/* Project Name */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Kitchen Cabinet, Garage Shelf, Desk"
                  className="mt-1.5 w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3.5 text-sm font-medium text-stone-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* Material Mode */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300">
                  Material Stock Type
                </label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('sheet');
                      handleStockPresetChange('4x8');
                    }}
                    className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                      mode === 'sheet'
                        ? 'border-amber-500 bg-amber-50/40 text-stone-900 dark:bg-amber-950/20 dark:text-white'
                        : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold">Sheet Goods</span>
                    <span className="text-[11px] text-stone-400 dark:text-slate-400">Plywood, MDF, OSB (4×8)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('linear');
                      handleStockPresetChange('8ft');
                    }}
                    className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                      mode === 'linear'
                        ? 'border-amber-500 bg-amber-50/40 text-stone-900 dark:bg-amber-950/20 dark:text-white'
                        : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold">Linear Stock</span>
                    <span className="text-[11px] text-stone-400 dark:text-slate-400">2×4 Lumber, Trim, Tubing</span>
                  </button>
                </div>
              </div>

              {/* Stock Dimensions Preset */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300">
                  Standard Stock Size
                </label>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {mode === 'sheet' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStockPresetChange('4x8')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium border ${
                          stockPreset === '4x8'
                            ? 'border-amber-500 bg-amber-500 text-stone-950 font-bold'
                            : 'border-stone-200 bg-stone-50 text-stone-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        Standard 4×8 (48" × 96")
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStockPresetChange('5x5')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium border ${
                          stockPreset === '5x5'
                            ? 'border-amber-500 bg-amber-500 text-stone-950 font-bold'
                            : 'border-stone-200 bg-stone-50 text-stone-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        Baltic Birch (60" × 60")
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStockPresetChange('8ft')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium border ${
                          stockPreset === '8ft'
                            ? 'border-amber-500 bg-amber-500 text-stone-950 font-bold'
                            : 'border-stone-200 bg-stone-50 text-stone-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        8ft Lumber (96")
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStockPresetChange('10ft')}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium border ${
                          stockPreset === '10ft'
                            ? 'border-amber-500 bg-amber-500 text-stone-950 font-bold'
                            : 'border-stone-200 bg-stone-50 text-stone-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        10ft Lumber (120")
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Start mode: Blank vs Template */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-slate-300">
                  Initial Cut List
                </label>
                <select
                  value={selectedPresetId}
                  onChange={(e) => setSelectedPresetId(e.target.value)}
                  className="mt-1.5 w-full min-h-[44px] rounded-xl border border-stone-300 bg-white px-3 text-xs font-medium text-stone-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="blank">✨ Blank Project (Start from Scratch)</option>
                  <optgroup label="Real-World Project Templates">
                    {PROJECT_PRESETS.filter((p) => p.mode === mode).map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.title} ({preset.pieces.length} parts)
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 px-6 py-2.5 text-xs font-bold text-stone-950 shadow-sm transition-all hover:bg-amber-400"
                >
                  Create &amp; Open
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
