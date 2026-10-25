export interface ProjectPiece {
  id: string;
  label: string;
  quantity: number;
  length: number;
  width: number;
  canRotate: boolean;
}

export interface Project {
  id: string;
  name: string; // user-editable, default "Untitled project"
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  materialMode: 'sheet' | 'linear';
  stockWidth: number;
  stockLength: number;
  stockQuantity: number;
  kerfWidth: number;
  units: 'in' | 'mm' | 'cm';
  allowRotation: boolean;
  thickness: number; // for visual rendering only
  pieces: ProjectPiece[];
}

export interface PlacedPiece {
  pieceId: string;
  label: string;
  x: number;
  y: number;
  width: number;
  length: number;
  rotated: boolean;
  color: string;
}

export interface CutLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface SheetResult {
  sheetIndex: number;
  width: number;
  length: number;
  placedPieces: PlacedPiece[];
  cutLines: CutLine[];
  wastePercentage: number;
  cutsCount: number;
}

export interface OptimizationOutput {
  sheets: SheetResult[];
  totalStockCount: number;
  wastePercentage: number;
  totalCuts: number;
  totalPiecesPlaced: number;
  totalPiecesRequested: number;
}
