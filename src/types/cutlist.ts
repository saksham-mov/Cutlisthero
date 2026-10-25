export type Unit = 'inches' | 'mm' | 'cm';

export type MaterialMode = 'sheet' | 'linear';

export type ThemeMode = 'light' | 'dark' | 'shop';

export type PieceRole =
  | 'side_left'
  | 'side_right'
  | 'top'
  | 'bottom'
  | 'shelf'
  | 'back'
  | 'divider'
  | 'door'
  | 'drawer_front'
  | 'drawer_bottom'
  | 'leg'
  | 'apron'
  | 'face_frame'
  | 'other';

export type ProjectTemplateId =
  | 'box'
  | 'bookshelf'
  | 'cabinet'
  | 'planter'
  | 'workbench'
  | 'drawer'
  | 'custom';

export type WoodFinish = 'plywood' | 'oak' | 'maple' | 'walnut' | 'cherry';

export interface CutPiece {
  id: string;
  name: string;
  length: number; // Length (along stock length / sheet length)
  width: number;  // Width (sheet mode only; 0 for linear)
  quantity: number;
  canRotate: boolean;
  role?: PieceRole;
  completed?: boolean;
}

export interface StockConfig {
  unit: Unit;
  showBothUnits: boolean;
  mode: MaterialMode;
  sheetWidth: number;   // e.g. 48" or 1220mm
  sheetLength: number;  // e.g. 96" or 2440mm
  linearLength: number; // e.g. 96" or 2440mm
  kerf: number;         // e.g. 0.125" or 3.2mm
  trimMargin: number;   // e.g. 0" or 0.25"
  sheetCost: number;    // optional cost per sheet in $
  linearCost: number;   // optional cost per linear foot / meter in $
  thickness: number;    // material thickness (default 0.75" / 19mm)
  templateId?: ProjectTemplateId;
  woodFinish?: WoodFinish;
  isManualMode?: boolean;
}

export interface PlacedPiece {
  pieceId: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotated: boolean;
  color: string;
  cutIndex: number;
  hasOverlap?: boolean;
  isOutOfBounds?: boolean;
}

export interface CutLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  orientation: 'horizontal' | 'vertical';
  kerf: number;
}

export interface OffcutRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  area: number;
  recommendation: string;
}

export interface OptimizedSheet {
  sheetIndex: number;
  width: number;
  length: number;
  placedPieces: PlacedPiece[];
  cutLines: CutLine[];
  offcuts: OffcutRect[];
  usedArea: number;
  totalArea: number;
  wasteArea: number;
  wastePercentage: number;
  cutsCount: number;
  hasErrors?: boolean;
}

export interface PlacedLinearPiece {
  pieceId: string;
  label: string;
  start: number;
  length: number;
  color: string;
  cutIndex: number;
}

export interface OptimizedLinearStick {
  stickIndex: number;
  stockLength: number;
  placedPieces: PlacedLinearPiece[];
  usedLength: number;
  wasteLength: number;
  wastePercentage: number;
  cutsCount: number;
}

export interface OptimizationResult {
  mode: MaterialMode;
  unit: Unit;
  showBothUnits: boolean;
  sheets?: OptimizedSheet[];
  sticks?: OptimizedLinearStick[];
  totalPartsDemanded: number;
  totalPartsPlaced: number;
  unplacedPieces: { piece: CutPiece; missingCount: number; reason: string }[];
  totalStockCount: number;
  totalStockCapacity: number; // total area or length
  totalUsedAmount: number;    // total used area or length
  totalWastePercentage: number;
  totalCuts: number;
  totalMaterialCost: number;
  wasteCost: number;
  executionTimeMs: number;
  allOffcuts: { sheetIndex: number; offcut: OffcutRect }[];
}

export interface SavedProject {
  id: string;
  name: string;
  timestamp: number;
  dateStr: string;
  pieceCount: number;
  mode: MaterialMode;
  unit: Unit;
  showBothUnits: boolean;
  sheetWidth: number;
  sheetLength: number;
  linearLength: number;
  kerf: number;
  trimMargin: number;
  thickness?: number;
  templateId?: ProjectTemplateId;
  woodFinish?: WoodFinish;
  sheetCost: number;
  linearCost: number;
  isManualMode?: boolean;
  pieces: CutPiece[];
  manualPlacedPieces?: { [sheetIndex: number]: PlacedPiece[] };
}

