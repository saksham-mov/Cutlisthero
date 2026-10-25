import React, { useState, useEffect, useRef } from 'react';
import {
  Unit,
  MaterialMode,
  CutPiece,
  StockConfig,
  OptimizationResult,
  PieceRole,
  ProjectTemplateId,
  WoodFinish,
  PlacedPiece,
} from '../types/cutlist';
import {
  optimizeSheetGoods,
  optimizeLinearStock,
  formatDimension,
  encodeProjectToHash,
} from '../utils/optimizer';
import { autoLabelPieces } from '../utils/assemblyTemplates';
import { SheetSvgDiagram } from './SheetSvgDiagram';
import { LinearSvgDiagram } from './LinearSvgDiagram';
import { CutChecklist } from './CutChecklist';
import { ScrapBinTracker } from './ScrapBinTracker';
import { ManualTray } from './ManualTray';
import { EmptyState } from './EmptyState';
import { AssemblyViewer3D } from './AssemblyViewer3D';
import { DimensionInput } from './DimensionInput';
import { CsvImportExportModal } from './CsvImportExportModal';
import { PresetSelectorModal } from './PresetSelectorModal';
import { ProjectPreset } from '../utils/projectPresets';
import {
  Layers,
  Ruler,
  Plus,
  Trash2,
  Copy,
  Sparkles,
  Printer,
  RotateCcw,
  AlertCircle,
  Scissors,
  DollarSign,
  Share2,
  Sliders,
  Box,
  HandMetal,
  Check,
  CheckCircle2,
  FileSpreadsheet,
  ArrowLeftRight,
  ArrowLeft,
  Pencil,
} from 'lucide-react';

const STORAGE_KEY = 'cutlisthero_state_v2';

interface OptimizerProps {
  onAutoSaveProject?: (projectData: any) => void;
  sharedState?: any;
  projectName?: string;
  onUpdateProjectName?: (name: string) => void;
  onBackToProjects?: () => void;
}

export const Optimizer: React.FC<OptimizerProps> = ({
  onAutoSaveProject,
  sharedState,
  projectName = 'My Cut Project',
  onUpdateProjectName,
  onBackToProjects,
}) => {
  const [currentTitle, setCurrentTitle] = useState<string>(projectName);

  useEffect(() => {
    if (projectName) setCurrentTitle(projectName);
  }, [projectName]);

  // Material mode & units
  const [mode, setMode] = useState<MaterialMode>('sheet');
  const [unit, setUnit] = useState<Unit>('inches');
  const [showBothUnits, setShowBothUnits] = useState<boolean>(false);

  // Stock dimensions
  const [sheetWidth, setSheetWidth] = useState<number>(48);
  const [sheetLength, setSheetLength] = useState<number>(96);
  const [linearLength, setLinearLength] = useState<number>(96);
  const [kerf, setKerf] = useState<number>(0.125);
  const [trimMargin, setTrimMargin] = useState<number>(0);
  const [thickness, setThickness] = useState<number>(0.75);

  // Cost calculator inputs
  const [sheetCost, setSheetCost] = useState<number>(65);
  const [linearCost, setLinearCost] = useState<number>(0.85);

  // Pieces — start clean, zero demo data!
  const [pieces, setPieces] = useState<CutPiece[]>([]);

  // 3D Assembly settings
  const [templateId, setTemplateId] = useState<ProjectTemplateId>('bookshelf');
  const [woodFinish, setWoodFinish] = useState<WoodFinish>('plywood');
  const [show3DViewer, setShow3DViewer] = useState<boolean>(false);
  const [showAutoLabelModal, setShowAutoLabelModal] = useState<boolean>(false);

  // Manual arrangement mode
  const [isManualMode, setIsManualMode] = useState<boolean>(false);

  // Modals
  const [showPresetModal, setShowPresetModal] = useState<boolean>(false);
  const [showCsvModal, setShowCsvModal] = useState<boolean>(false);

  // Result
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [shareToast, setShareToast] = useState<boolean>(false);

  const resultsRef = useRef<HTMLDivElement>(null);


  // Load state from localStorage or sharedState
  useEffect(() => {
    if (sharedState) {
      applyLoadedState(sharedState);
      return;
    }
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        applyLoadedState(parsed);
      }
    } catch {}
  }, [sharedState]);

  const applyLoadedState = (data: any) => {
    if (data.mode) setMode(data.mode);
    if (data.unit) setUnit(data.unit);
    if (data.showBothUnits !== undefined) setShowBothUnits(data.showBothUnits);
    if (data.sheetWidth) setSheetWidth(data.sheetWidth);
    if (data.sheetLength) setSheetLength(data.sheetLength);
    if (data.linearLength) setLinearLength(data.linearLength);
    if (data.kerf !== undefined) setKerf(data.kerf);
    if (data.trimMargin !== undefined) setTrimMargin(data.trimMargin);
    if (data.thickness !== undefined) setThickness(data.thickness);
    if (data.sheetCost !== undefined) setSheetCost(data.sheetCost);
    if (data.linearCost !== undefined) setLinearCost(data.linearCost);
    if (data.isManualMode !== undefined) setIsManualMode(data.isManualMode);
    if (data.templateId) setTemplateId(data.templateId);
    if (data.woodFinish) setWoodFinish(data.woodFinish);
    if (Array.isArray(data.pieces)) setPieces(data.pieces);
  };

  // Auto-save to localStorage
  useEffect(() => {
    const projectData = {
      mode,
      unit,
      showBothUnits,
      sheetWidth,
      sheetLength,
      linearLength,
      kerf,
      trimMargin,
      thickness,
      sheetCost,
      linearCost,
      isManualMode,
      templateId,
      woodFinish,
      pieces,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projectData));
      if (onAutoSaveProject && pieces.length > 0) {
        onAutoSaveProject(projectData);
      }
    } catch {}
  }, [
    mode,
    unit,
    showBothUnits,
    sheetWidth,
    sheetLength,
    linearLength,
    kerf,
    trimMargin,
    thickness,
    sheetCost,
    linearCost,
    isManualMode,
    templateId,
    woodFinish,
    pieces,
  ]);

  // Run calculation
  const runOptimization = () => {
    if (pieces.length === 0) {
      setResult(null);
      return;
    }

    const stockConfig: StockConfig = {
      unit,
      showBothUnits,
      mode,
      sheetWidth: Number(sheetWidth) || 48,
      sheetLength: Number(sheetLength) || 96,
      linearLength: Number(linearLength) || 96,
      kerf: Number(kerf) || 0.125,
      trimMargin: Number(trimMargin) || 0,
      sheetCost: Number(sheetCost) || 0,
      linearCost: Number(linearCost) || 0,
      thickness: Number(thickness) || 0.75,
      templateId,
      woodFinish,
      isManualMode,
    };

    if (mode === 'sheet') {
      const res = optimizeSheetGoods(pieces, stockConfig);
      setResult(res);
    } else {
      const res = optimizeLinearStock(pieces, stockConfig);
      setResult(res);
    }
  };

  // Re-run on mode or pieces change
  useEffect(() => {
    runOptimization();
  }, [mode, kerf, sheetWidth, sheetLength, linearLength, trimMargin, sheetCost, linearCost]);

  // Handle Drag-to-rearrange update on a specific sheet
  const handleUpdateSheetPieces = (sheetIndex: number, updatedPieces: PlacedPiece[]) => {
    if (!result || !result.sheets) return;
    setResult((prev) => {
      if (!prev || !prev.sheets) return prev;
      const nextSheets = prev.sheets.map((s) => {
        if (s.sheetIndex === sheetIndex) {
          const usedArea = updatedPieces.reduce((acc, p) => acc + p.width * p.height, 0);
          const totalArea = s.width * s.length;
          const wasteArea = Math.max(0, totalArea - usedArea);
          const wastePercentage = Number(((wasteArea / totalArea) * 100).toFixed(1));
          return {
            ...s,
            placedPieces: updatedPieces,
            usedArea,
            wasteArea,
            wastePercentage,
          };
        }
        return s;
      });
      return {
        ...prev,
        sheets: nextSheets,
      };
    });
  };

  const handleResetSheet = (sheetIndex: number) => {
    runOptimization();
  };

  // Unit Toggle (inches / mm / cm)
  const handleUnitToggle = (newUnit: Unit) => {
    if (newUnit === unit) return;
    setUnit(newUnit);

    if (newUnit === 'mm') {
      setSheetWidth(1220);
      setSheetLength(2440);
      setLinearLength(2440);
      setKerf(3.2);
      setThickness(19);
      setPieces((prev) =>
        prev.map((p) => ({
          ...p,
          length: Math.round(p.length * (unit === 'inches' ? 25.4 : 10)),
          width: Math.round(p.width * (unit === 'inches' ? 25.4 : 10)),
        }))
      );
    } else if (newUnit === 'cm') {
      setSheetWidth(122);
      setSheetLength(244);
      setLinearLength(244);
      setKerf(0.32);
      setThickness(1.9);
      setPieces((prev) =>
        prev.map((p) => ({
          ...p,
          length: Number((p.length * (unit === 'inches' ? 2.54 : 0.1)).toFixed(1)),
          width: Number((p.width * (unit === 'inches' ? 2.54 : 0.1)).toFixed(1)),
        }))
      );
    } else {
      // inches
      setSheetWidth(48);
      setSheetLength(96);
      setLinearLength(96);
      setKerf(0.125);
      setThickness(0.75);
      setPieces((prev) =>
        prev.map((p) => ({
          ...p,
          length: Math.round(((p.length / (unit === 'mm' ? 25.4 : 2.54)) * 4)) / 4 || 12,
          width: Math.round(((p.width / (unit === 'mm' ? 25.4 : 2.54)) * 4)) / 4 || 12,
        }))
      );
    }
  };

  // Add piece row
  const addPiece = () => {
    const newId = String(Date.now());
    const newPiece: CutPiece = {
      id: newId,
      name: `Part ${pieces.length + 1}`,
      length: unit === 'inches' ? 24 : unit === 'cm' ? 60 : 600,
      width: mode === 'sheet' ? (unit === 'inches' ? 12 : unit === 'cm' ? 30 : 300) : 0,
      quantity: 1,
      canRotate: true,
      role: 'shelf',
    };
    setPieces([...pieces, newPiece]);
  };

  const updatePiece = (id: string, updates: Partial<CutPiece>) => {
    setPieces((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const removePiece = (id: string) => {
    setPieces((prev) => prev.filter((p) => p.id !== id));
  };

  const duplicatePiece = (id: string) => {
    const p = pieces.find((item) => item.id === id);
    if (!p) return;
    setPieces([...pieces, { ...p, id: String(Date.now()), name: `${p.name} (Copy)` }]);
  };

  const handleSwapDimensions = (id: string) => {
    setPieces((prev) =>
      prev.map((p) => {
        if (p.id === id && mode === 'sheet') {
          return { ...p, length: p.width, width: p.length };
        }
        return p;
      })
    );
  };

  const handleSelectPreset = (preset: ProjectPreset) => {
    setMode(preset.mode);
    setUnit(preset.unit);
    if (preset.sheetWidth) setSheetWidth(preset.sheetWidth);
    if (preset.sheetLength) setSheetLength(preset.sheetLength);
    if (preset.linearLength) setLinearLength(preset.linearLength);
    setKerf(preset.kerf);
    setTrimMargin(preset.trimMargin);
    setThickness(preset.thickness);
    setTemplateId(preset.templateId);
    setWoodFinish(preset.woodFinish);
    setPieces(preset.pieces);
  };

  const handleImportPieces = (imported: CutPiece[], replace: boolean) => {
    if (replace) {
      setPieces(imported);
    } else {
      setPieces((prev) => [...prev, ...imported]);
    }
  };


  // Share URL to clipboard
  const handleShare = () => {
    const hash = encodeProjectToHash({
      mode,
      unit,
      showBothUnits,
      sheetWidth,
      sheetLength,
      linearLength,
      kerf,
      trimMargin,
      sheetCost,
      linearCost,
      isManualMode,
      pieces,
    });
    const shareUrl = `${window.location.origin}${window.location.pathname}#/${hash}`;
    navigator.clipboard.writeText(shareUrl);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2500);
  };

  // 3D Assembly click handler
  // 3D Assembly click handler
  const handleOpen3D = () => {
    let currentPieces = pieces;
    if (currentPieces.length === 0) {
      currentPieces = WORKED_EXAMPLE_PIECES;
      setPieces(WORKED_EXAMPLE_PIECES);
    }

    // Check if roles are assigned
    const hasRoles = currentPieces.some((p) => p.role && p.role !== 'other');
    if (!hasRoles) {
      setShowAutoLabelModal(true);
    } else {
      setShow3DViewer(true);
    }
  };

  useEffect(() => {
    const handleTrigger3D = () => {
      handleOpen3D();
    };
    window.addEventListener('cutlisthero:open-3d', handleTrigger3D);
    return () => window.removeEventListener('cutlisthero:open-3d', handleTrigger3D);
  }, [pieces, templateId]);

  const handleAutoLabelAndOpen3D = () => {
    let currentPieces = pieces.length > 0 ? pieces : WORKED_EXAMPLE_PIECES;
    const labeled = autoLabelPieces(currentPieces, templateId);
    setPieces(labeled.pieces);
    setTemplateId(labeled.templateId);
    setShowAutoLabelModal(false);
    setShow3DViewer(true);
  };

  const totalPartCount = pieces.reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);

  return (
    <div id="optimizer" className="space-y-8">
      {/* Main Tool Container */}
      <div className="rounded-3xl border border-stone-200 bg-white p-4 shadow-xl sm:p-6 lg:p-8 dark:border-slate-800 dark:bg-slate-900">
        {/* Top Control Bar: Material Mode & Unit Selection */}
        <div className="flex flex-col gap-4 border-b border-stone-100 pb-6 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl dark:text-white">
                Optimize Your Cuts in Seconds
              </h2>
              <span className="font-mono text-xs text-stone-400 dark:text-slate-500 hidden md:inline">
                · Last updated: October 26, 2026
              </span>
            </div>
            <p className="mt-1 text-xs text-stone-500 sm:text-sm dark:text-slate-400">
              Interactive 2D cutting diagrams, drag-to-rearrange, kerf slider, and 3D assembly preview.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Material Mode Selector */}
            <div className="flex rounded-xl bg-stone-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setMode('sheet')}
                className={`min-h-[44px] px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'sheet'
                    ? 'bg-white text-stone-900 shadow-xs dark:bg-slate-700 dark:text-white'
                    : 'text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Sheet Goods (4×8)
              </button>
              <button
                type="button"
                onClick={() => setMode('linear')}
                className={`min-h-[44px] px-3.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'linear'
                    ? 'bg-white text-stone-900 shadow-xs dark:bg-slate-700 dark:text-white'
                    : 'text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Linear Stock (2×4)
              </button>
            </div>

            {/* Units Selector (inches / mm / cm) */}
            <div className="flex rounded-xl bg-stone-100 p-1 dark:bg-slate-800">
              {(['inches', 'mm', 'cm'] as Unit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => handleUnitToggle(u)}
                  className={`min-h-[44px] px-2.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                    unit === u
                      ? 'bg-white text-stone-900 shadow-xs dark:bg-slate-700 dark:text-white'
                      : 'text-stone-600 hover:text-stone-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {u === 'inches' ? 'Inches (")' : u === 'mm' ? 'mm' : 'cm'}
                </button>
              ))}
            </div>

            {/* Show Both Units Toggle */}
            <label className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-slate-400 cursor-pointer select-none px-1">
              <input
                type="checkbox"
                checked={showBothUnits}
                onChange={(e) => setShowBothUnits(e.target.checked)}
                className="rounded border-stone-300 text-amber-500 focus:ring-amber-500 h-4 w-4"
              />
              <span className="hidden sm:inline">Dual Units</span>
            </label>

            {/* Presets and CSV buttons */}
            <div className="flex items-center gap-1.5 border-l border-stone-200 pl-2 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowPresetModal(true)}
                className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-700 hover:border-amber-500 hover:bg-white hover:text-amber-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                title="Load Woodworking Project Templates"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                <span className="hidden md:inline">Presets</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCsvModal(true)}
                className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-700 hover:border-amber-500 hover:bg-white hover:text-amber-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                title="Import or Export Cut List via CSV / Excel"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-500" />
                <span className="hidden md:inline">CSV</span>
              </button>
            </div>
          </div>
        </div>


        {/* Section 1: Stock Dimensions, Kerf Slider & Live Preview Diagram */}
        <div className="pt-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400">
              1. Stock Dimensions &amp; Kerf Controls
            </h3>
            {mode === 'sheet' ? (
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSheetWidth(unit === 'inches' ? 48 : unit === 'cm' ? 122 : 1220);
                    setSheetLength(unit === 'inches' ? 96 : unit === 'cm' ? 244 : 2440);
                  }}
                  className="font-medium text-amber-600 hover:underline dark:text-amber-400"
                >
                  Standard 4×8
                </button>
                <span className="text-stone-300 dark:text-slate-700">·</span>
                <button
                  type="button"
                  onClick={() => {
                    setSheetWidth(unit === 'inches' ? 60 : unit === 'cm' ? 152.5 : 1525);
                    setSheetLength(unit === 'inches' ? 60 : unit === 'cm' ? 152.5 : 1525);
                  }}
                  className="text-stone-500 hover:underline dark:text-slate-400"
                >
                  5×5 Baltic Birch
                </button>
              </div>
            ) : (
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setLinearLength(unit === 'inches' ? 96 : unit === 'cm' ? 244 : 2440)}
                  className="font-medium text-amber-600 hover:underline dark:text-amber-400"
                >
                  8ft (96")
                </button>
                <span className="text-stone-300 dark:text-slate-700">·</span>
                <button
                  type="button"
                  onClick={() => setLinearLength(unit === 'inches' ? 120 : unit === 'cm' ? 305 : 3050)}
                  className="text-stone-500 hover:underline dark:text-slate-400"
                >
                  10ft (120")
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {mode === 'sheet' ? (
              <>
                <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <label className="block text-xs font-medium text-stone-500 dark:text-slate-400">
                    Sheet Width ({unit})
                  </label>
                  <DimensionInput
                    value={sheetWidth}
                    onChange={(val) => setSheetWidth(val)}
                    unit={unit}
                    min={1}
                    className="mt-1 w-full min-h-[44px] rounded-lg border border-stone-300 bg-white px-3 font-mono text-base font-semibold text-stone-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
                <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <label className="block text-xs font-medium text-stone-500 dark:text-slate-400">
                    Sheet Length ({unit})
                  </label>
                  <DimensionInput
                    value={sheetLength}
                    onChange={(val) => setSheetLength(val)}
                    unit={unit}
                    min={1}
                    className="mt-1 w-full min-h-[44px] rounded-lg border border-stone-300 bg-white px-3 font-mono text-base font-semibold text-stone-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </>
            ) : (
              <div className="col-span-2 rounded-xl border border-stone-200 bg-stone-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
                <label className="block text-xs font-medium text-stone-500 dark:text-slate-400">
                  Stock Stick Length ({unit})
                </label>
                <DimensionInput
                  value={linearLength}
                  onChange={(val) => setLinearLength(val)}
                  unit={unit}
                  min={1}
                  className="mt-1 w-full min-h-[44px] rounded-lg border border-stone-300 bg-white px-3 font-mono text-base font-semibold text-stone-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            )}

            {/* Thickness input (for 3D Assembly) */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
              <label className="block text-xs font-medium text-stone-500 dark:text-slate-400">
                Thickness ({unit})
              </label>
              <DimensionInput
                value={thickness}
                onChange={(val) => setThickness(val)}
                unit={unit}
                min={0.1}
                className="mt-1 w-full min-h-[44px] rounded-lg border border-stone-300 bg-white px-3 font-mono text-base font-semibold text-stone-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>


            {/* Material Cost Input */}
            <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-3 dark:border-slate-800 dark:bg-slate-800/40">
              <label className="block text-xs font-medium text-stone-500 dark:text-slate-400">
                {mode === 'sheet' ? 'Cost per Sheet ($)' : 'Cost / Lin Ft ($)'}
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={mode === 'sheet' ? sheetCost : linearCost}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  if (mode === 'sheet') setSheetCost(val);
                  else setLinearCost(val);
                }}
                className="mt-1 w-full min-h-[44px] rounded-lg border border-stone-300 bg-white px-3 font-mono text-base font-semibold text-stone-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            {/* Kerf Slider Card with Live Diagram */}
            <div className="col-span-2 sm:col-span-4 lg:col-span-1 rounded-xl border border-amber-300/80 bg-amber-50/50 p-3 dark:border-amber-900/60 dark:bg-amber-950/20">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-900 dark:text-amber-200">
                  Kerf: {formatDimension(kerf, unit)}
                </span>
                <span className="font-mono text-[10px] text-amber-700 dark:text-amber-400">
                  1/8" = 0.125"
                </span>
              </div>
              <input
                type="range"
                min="0"
                max={unit === 'inches' ? 0.25 : 6.35}
                step={unit === 'inches' ? 0.001 : 0.05}
                value={kerf}
                onChange={(e) => setKerf(parseFloat(e.target.value) || 0)}
                className="mt-2 w-full accent-amber-500 cursor-pointer"
              />
              <div className="mt-1 flex items-center justify-between text-[10px] text-amber-800 dark:text-amber-300">
                <span>0" (Laser)</span>
                <span>Blade Thickness</span>
                <span>1/4" (Dado)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Cut Pieces Table */}
        <div className="pt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-stone-500 dark:text-slate-400">
              2. Cut Pieces ({pieces.length} parts, {totalPartCount} total)
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              {/* Manual Arrangement Mode Toggle */}
              <button
                type="button"
                onClick={() => setIsManualMode(!isManualMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isManualMode
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                    : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                }`}
              >
                <HandMetal className="h-3.5 w-3.5" />
                <span>Manual Override {isManualMode ? 'ON' : 'OFF'}</span>
              </button>

              {/* 3D Assembly View Trigger */}
              <button
                type="button"
                onClick={handleOpen3D}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-xs dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 transition-all"
              >
                <Box className="h-3.5 w-3.5" />
                <span>See Assembly View (3D)</span>
              </button>
            </div>
          </div>

          {/* Manual Tray when Manual Override is ON */}
          {isManualMode && (
            <div className="mb-4">
              <ManualTray
                pieces={pieces}
                unit={unit}
                showBothUnits={showBothUnits}
                onAddPieceToSheet={(piece, rotated) => {
                  if (!result || !result.sheets || result.sheets.length === 0) return;
                  const targetSheet = result.sheets[0];
                  const newPlaced: PlacedPiece = {
                    pieceId: `${piece.id}-${Date.now()}`,
                    label: piece.name,
                    x: 2,
                    y: 2,
                    width: rotated ? piece.length : piece.width,
                    height: rotated ? piece.width : piece.length,
                    rotated,
                    color: '#f59e0b',
                    cutIndex: targetSheet.placedPieces.length + 1,
                  };
                  handleUpdateSheetPieces(1, [...targetSheet.placedPieces, newPlaced]);
                }}
              />
            </div>
          )}

          {/* Empty state if user cleared pieces */}
          {pieces.length === 0 ? (
            <EmptyState
              onAddPiece={addPiece}
              onLoadExample={() => setPieces(WORKED_EXAMPLE_PIECES)}
            />
          ) : (
            <div className="space-y-3">
              {/* Desktop Table Header */}
              <div className="hidden lg:grid grid-cols-12 gap-3 pb-2 text-xs font-semibold text-stone-400 px-2">
                <div className="col-span-3">Label / Part Name</div>
                <div className="col-span-2">3D Role</div>
                <div className="col-span-1 text-center">Qty</div>
                {mode === 'sheet' && <div className="col-span-2">Width ({unit})</div>}
                <div className={mode === 'sheet' ? 'col-span-2' : 'col-span-4'}>Length ({unit})</div>
                {mode === 'sheet' && <div className="col-span-1 text-center">Grain</div>}
                <div className="col-span-1 text-right">Actions</div>
              </div>

              {/* Rows */}
              {pieces.map((piece, index) => (
                <div
                  key={piece.id}
                  className="rounded-2xl border border-stone-200 bg-stone-50/50 p-3 sm:p-4 transition-all hover:border-stone-300 lg:bg-transparent lg:border-stone-100 lg:p-2 dark:border-slate-800 dark:bg-slate-800/30 lg:dark:bg-transparent"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-center">
                    {/* Label */}
                    <div className="lg:col-span-3">
                      <label className="text-[11px] font-medium text-stone-400 lg:hidden">Label</label>
                      <input
                        type="text"
                        placeholder={`Part #${index + 1}`}
                        value={piece.name}
                        onChange={(e) => updatePiece(piece.id, { name: e.target.value })}
                        className="w-full min-h-[44px] rounded-lg border border-stone-300 bg-white px-3 text-sm font-medium text-stone-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>

                    {/* 3D Role Dropdown */}
                    <div className="lg:col-span-2">
                      <label className="text-[11px] font-medium text-stone-400 lg:hidden">3D Role</label>
                      <select
                        value={piece.role || 'other'}
                        onChange={(e) => updatePiece(piece.id, { role: e.target.value as PieceRole })}
                        className="w-full min-h-[44px] rounded-lg border border-stone-300 bg-white px-2 text-xs font-medium text-stone-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white cursor-pointer"
                      >
                        <option value="side_left">Side panel (left)</option>
                        <option value="side_right">Side panel (right)</option>
                        <option value="top">Top panel</option>
                        <option value="bottom">Bottom panel</option>
                        <option value="shelf">Shelf</option>
                        <option value="back">Back panel</option>
                        <option value="divider">Divider</option>
                        <option value="door">Door</option>
                        <option value="drawer_front">Drawer front</option>
                        <option value="drawer_bottom">Drawer bottom</option>
                        <option value="leg">Corner leg</option>
                        <option value="apron">Stretcher / Apron</option>
                        <option value="face_frame">Face frame</option>
                        <option value="other">Other / Custom</option>
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="lg:col-span-1">
                      <label className="text-[11px] font-medium text-stone-400 lg:hidden">Qty</label>
                      <input
                        type="number"
                        min="1"
                        value={piece.quantity}
                        onChange={(e) => updatePiece(piece.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-full min-h-[44px] rounded-lg border border-stone-300 bg-white text-center font-mono text-sm font-bold text-stone-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Width */}
                    {mode === 'sheet' && (
                      <div className="lg:col-span-2">
                        <label className="text-[11px] font-medium text-stone-400 lg:hidden">Width ({unit})</label>
                        <DimensionInput
                          value={piece.width}
                          onChange={(val) => updatePiece(piece.id, { width: val })}
                          unit={unit}
                          min={0.1}
                          className="w-full min-h-[44px] rounded-lg border border-stone-300 bg-white px-3 font-mono text-sm font-semibold text-stone-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        />
                      </div>
                    )}

                    {/* Length */}
                    <div className={mode === 'sheet' ? 'lg:col-span-2' : 'lg:col-span-4'}>
                      <label className="text-[11px] font-medium text-stone-400 lg:hidden">Length ({unit})</label>
                      <DimensionInput
                        value={piece.length}
                        onChange={(val) => updatePiece(piece.id, { length: val })}
                        unit={unit}
                        min={0.1}
                        className="w-full min-h-[44px] rounded-lg border border-stone-300 bg-white px-3 font-mono text-sm font-semibold text-stone-900 focus:border-amber-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>

                    {/* Rotate Toggle */}
                    {mode === 'sheet' && (
                      <div className="flex items-center justify-center lg:col-span-1">
                        <label className="flex min-h-[44px] items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={piece.canRotate}
                            onChange={(e) => updatePiece(piece.id, { canRotate: e.target.checked })}
                            className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                          />
                          <span className="text-[11px] text-stone-500 lg:hidden">Can Rotate</span>
                        </label>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1 lg:col-span-1">
                      {mode === 'sheet' && (
                        <button
                          type="button"
                          onClick={() => handleSwapDimensions(piece.id)}
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-stone-400 hover:bg-stone-200 hover:text-stone-700 dark:hover:bg-slate-800"
                          title="Swap Length & Width (Rotate 90°)"
                        >
                          <ArrowLeftRight className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => duplicatePiece(piece.id)}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-stone-400 hover:bg-stone-200 hover:text-stone-700 dark:hover:bg-slate-800"
                        title="Duplicate piece"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removePiece(piece.id)}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                        title="Delete piece"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

              ))}

              {/* Bottom buttons */}
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={addPiece}
                  className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 px-5 text-sm font-semibold text-stone-700 hover:border-amber-500 hover:bg-amber-50/50 hover:text-amber-800 transition-all dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-200 flex-1 sm:flex-initial"
                >
                  <Plus className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span>Add Another Piece</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    runOptimization();
                    resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="btn-optimize hidden sm:flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-amber-500 px-7 text-sm font-bold text-slate-950 shadow-md hover:bg-amber-400 transition-all active:scale-[0.98]"
                >
                  <Scissors className="h-4 w-4" />
                  <span>Optimize Cuts</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom CTA for Mobile */}
      <div className="no-print fixed bottom-0 left-0 right-0 z-40 bg-white/95 p-3.5 backdrop-blur-md border-t border-stone-200 shadow-2xl sm:hidden dark:bg-slate-900/95 dark:border-slate-800">
        <button
          type="button"
          onClick={() => {
            runOptimization();
            resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="btn-optimize flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 font-display text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all"
        >
          <Scissors className="h-4 w-4" />
          <span>Optimize Cuts ({totalPartCount} pieces)</span>
        </button>
      </div>

      {/* Share Toast */}
      {shareToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-2xl border border-slate-700 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>Project share link copied to clipboard!</span>
        </div>
      )}

      {/* Results Display */}
      <div ref={resultsRef} className="scroll-mt-6 space-y-6">
        {result && (
          <div className="space-y-6">
            {/* KPI Summary Strip with Material Cost & Waste Cost */}
            <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-lg sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-700/60 pb-5">
                <div>
                  <span className="font-mono text-xs uppercase tracking-widest text-amber-400">
                    Optimization Results
                  </span>
                  <h3 className="font-display text-2xl font-bold sm:text-3xl">
                    {result.totalStockCount} {mode === 'sheet' ? (result.totalStockCount === 1 ? 'Sheet' : 'Sheets') : (result.totalStockCount === 1 ? 'Stick' : 'Sticks')} Needed
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Calculated in {result.executionTimeMs}ms · {result.totalPartsPlaced} of {result.totalPartsDemanded} parts placed
                  </p>
                </div>

                <div className="no-print flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleOpen3D}
                    className="flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400 transition-all shadow-md"
                  >
                    <Box className="h-4 w-4" />
                    <span>See 3D Assembly</span>
                  </button>
                  <button
                    onClick={() => setShowCsvModal(true)}
                    className="flex min-h-[44px] items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition-all"
                    title="Export Bill of Materials / CSV"
                  >
                    <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                    <span>Export CSV</span>
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="flex min-h-[44px] items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition-all"
                  >
                    <Printer className="h-4 w-4 text-amber-400" />
                    <span>Print PDF</span>
                  </button>
                </div>
              </div>


              {/* KPI Numbers Grid including Material Cost & Scrap Cost */}
              <div className="grid grid-cols-2 gap-4 pt-5 sm:grid-cols-4">
                <div>
                  <span className="text-xs text-slate-400">Material Waste</span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="font-display text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
                      {result.totalWastePercentage}%
                    </span>
                  </div>
                  {result.wasteCost > 0 && (
                    <span className="text-[11px] text-amber-300 font-mono">
                      ~${result.wasteCost} scrap value
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-xs text-slate-400">Total Material Cost</span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="font-display text-2xl sm:text-3xl font-extrabold text-white font-mono">
                      ${result.totalMaterialCost}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {mode === 'sheet' ? `$${sheetCost}/sheet` : `$${linearCost}/lin ft`}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-400">Total Cuts Required</span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="font-display text-2xl sm:text-3xl font-extrabold text-white font-mono">
                      {result.totalCuts}
                    </span>
                    <span className="text-xs text-slate-400">cuts</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Guillotine table saw cuts</span>
                </div>

                <div>
                  <span className="text-xs text-slate-400">Parts Placed</span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="font-display text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
                      {result.totalPartsPlaced}/{result.totalPartsDemanded}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Kerf: {formatDimension(kerf, unit, showBothUnits)}
                  </span>
                </div>
              </div>
            </div>

            {/* Diagrams */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-stone-900 sm:text-xl dark:text-white">
                  Cutting Diagrams &amp; Layout
                </h3>
                <span className="text-xs text-stone-500 dark:text-slate-400">
                  {mode === 'sheet'
                    ? `${result.sheets?.length || 0} sheets to cut`
                    : `${result.sticks?.length || 0} sticks to cut`}
                </span>
              </div>

              {mode === 'sheet' && result.sheets && (
                <div className="space-y-8">
                  {result.sheets.map((sheet) => (
                    <div key={sheet.sheetIndex} className="space-y-3">
                      <SheetSvgDiagram
                        sheet={sheet}
                        unit={unit}
                        showBothUnits={showBothUnits}
                        kerf={kerf}
                        onUpdateSheetPieces={handleUpdateSheetPieces}
                        onResetSheet={handleResetSheet}
                      />
                      <SawCuttingGuide
                        sheet={sheet}
                        unit={unit}
                        showBothUnits={showBothUnits}
                        kerf={kerf}
                      />
                    </div>
                  ))}
                </div>
              )}

              {mode === 'linear' && result.sticks && (
                <div className="space-y-6">
                  {result.sticks.map((stick) => (
                    <div key={stick.stickIndex} className="space-y-3">
                      <LinearSvgDiagram
                        stick={stick}
                        unit={unit}
                        kerf={kerf}
                      />
                      <SawCuttingGuide
                        stick={stick}
                        unit={unit}
                        showBothUnits={showBothUnits}
                        kerf={kerf}
                      />
                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Waste Piece Tracker (Offcut Scrap Inventory) */}
            <ScrapBinTracker
              offcuts={result.allOffcuts}
              unit={unit}
              showBothUnits={showBothUnits}
            />

            {/* Cut Checklist */}
            <CutChecklist
              pieces={pieces}
              unit={unit}
              mode={mode}
            />
          </div>
        )}
      </div>

      {/* Auto-Label Modal if 3D clicked without assigned roles */}
      {showAutoLabelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <h4 className="font-display text-lg font-bold text-stone-900 dark:text-white">
              Setup 3D Project Assembly
            </h4>
            <p className="mt-2 text-xs text-stone-600 leading-relaxed dark:text-slate-300">
              To see the 3D assembly, select your project template. We can automatically assign roles (Sides, Top, Shelves, Back) to your parts based on their dimensions.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-500 dark:text-slate-400">
                  Select Project Template:
                </label>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value as ProjectTemplateId)}
                  className="mt-1 w-full rounded-xl border border-stone-300 bg-white p-2.5 text-xs font-semibold text-stone-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="bookshelf">Bookshelf with Shelves</option>
                  <option value="cabinet">Cabinet Carcass with Face Frame</option>
                  <option value="box">Simple 6-Sided Box</option>
                  <option value="planter">Outdoor Planter Box</option>
                  <option value="workbench">Workshop Workbench</option>
                  <option value="drawer">Inset Drawer Box</option>
                  <option value="custom">Custom Flat Stack</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-500 dark:text-slate-400">
                  Wood Finish:
                </label>
                <select
                  value={woodFinish}
                  onChange={(e) => setWoodFinish(e.target.value as WoodFinish)}
                  className="mt-1 w-full rounded-xl border border-stone-300 bg-white p-2.5 text-xs font-semibold text-stone-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="plywood">Baltic Birch Plywood</option>
                  <option value="oak">White Oak</option>
                  <option value="maple">Hard Maple</option>
                  <option value="walnut">American Walnut</option>
                  <option value="cherry">Black Cherry</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAutoLabelModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAutoLabelAndOpen3D}
                className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-amber-400 shadow-md"
              >
                Label My Pieces &amp; Open 3D
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3D Assembly Viewer Modal */}
      {show3DViewer && (
        <AssemblyViewer3D
          pieces={pieces}
          unit={unit}
          showBothUnits={showBothUnits}
          thickness={thickness}
          templateId={templateId}
          woodFinish={woodFinish}
          onSelectTemplate={setTemplateId}
          onSelectWoodFinish={setWoodFinish}
          onClose={() => setShow3DViewer(false)}
        />
      )}

      {/* Woodworking Project Presets Modal */}
      <PresetSelectorModal
        isOpen={showPresetModal}
        onClose={() => setShowPresetModal(false)}
        onSelectPreset={handleSelectPreset}
      />

      {/* CSV Import / Export Modal */}
      <CsvImportExportModal
        isOpen={showCsvModal}
        onClose={() => setShowCsvModal(false)}
        pieces={pieces}
        unit={unit}
        mode={mode}
        onImportPieces={handleImportPieces}
      />
    </div>

  );
};
