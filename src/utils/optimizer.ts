import { Project, ProjectPiece, PlacedPiece, CutLine, SheetResult, OptimizationOutput } from '../types/project';

export const MUTED_PIECE_COLORS = [
  '#94A3B8', // slate
  '#A8A29E', // stone
  '#CBD5E1', // light slate
  '#D6D3D1', // light stone
  '#FCA5A5', // light red
  '#A7F3D0', // light green
];

interface ExpandedItem {
  id: string;
  pieceId: string;
  label: string;
  length: number;
  width: number;
  canRotate: boolean;
  area: number;
}

export function optimizeProject(project: Project): OptimizationOutput {
  const isSheet = project.materialMode === 'sheet';
  const stockW = project.stockWidth > 0 ? project.stockWidth : 48;
  const stockL = project.stockLength > 0 ? project.stockLength : 96;
  const kerf = project.kerfWidth >= 0 ? project.kerfWidth : 0.125;
  const globalRotate = project.allowRotation;

  // Expand pieces by quantity
  const items: ExpandedItem[] = [];
  project.pieces.forEach((p, pIdx) => {
    const qty = Math.max(1, p.quantity || 1);
    const pLength = Math.max(0.1, Number(p.length) || 0);
    const pWidth = isSheet ? Math.max(0.1, Number(p.width) || 0) : stockW;
    
    for (let q = 0; q < qty; q++) {
      items.push({
        id: `${p.id}-${q}`,
        pieceId: p.id,
        label: p.label || `Part ${pIdx + 1}`,
        length: pLength,
        width: pWidth,
        canRotate: globalRotate && (p.canRotate !== false),
        area: pLength * pWidth,
      });
    }
  });

  const totalPiecesRequested = items.length;
  if (totalPiecesRequested === 0) {
    return {
      sheets: [],
      totalStockCount: 0,
      wastePercentage: 0,
      totalCuts: 0,
      totalPiecesPlaced: 0,
      totalPiecesRequested: 0,
    };
  }

  // Sort descending by area (or length for linear)
  items.sort((a, b) => b.area - a.area || b.length - a.length);

  // Shelf packing state
  interface Shelf {
    y: number;
    height: number;
    currentX: number;
  }

  interface InternalSheet {
    sheetIndex: number;
    width: number;
    length: number;
    placed: PlacedPiece[];
    shelves: Shelf[];
    cutLines: CutLine[];
  }

  const sheets: InternalSheet[] = [];

  function createNewSheet(): InternalSheet {
    const newSheet: InternalSheet = {
      sheetIndex: sheets.length + 1,
      width: stockW,
      length: stockL,
      placed: [],
      shelves: [],
      cutLines: [],
    };
    sheets.push(newSheet);
    return newSheet;
  }

  // Place each item using first-fit shelf packing
  items.forEach((item, itemIdx) => {
    const color = MUTED_PIECE_COLORS[itemIdx % MUTED_PIECE_COLORS.length];
    let placed = false;

    // Orientations to try: standard [w, l] and rotated [l, w]
    const orientations = [{ w: item.width, l: item.length, rot: false }];
    if (isSheet && item.canRotate && item.width !== item.length) {
      orientations.push({ w: item.length, l: item.width, rot: true });
    }

    // Try placing on existing sheets first
    for (const sheet of sheets) {
      for (const orient of orientations) {
        // 1. Try existing shelves
        for (const shelf of sheet.shelves) {
          if (
            shelf.currentX + orient.w <= sheet.width &&
            shelf.y + orient.l <= sheet.length
          ) {
            // Fits on this shelf
            const pX = shelf.currentX;
            const pY = shelf.y;

            sheet.placed.push({
              pieceId: item.pieceId,
              label: item.label,
              x: pX,
              y: pY,
              width: orient.w,
              length: orient.l,
              rotated: orient.rot,
              color,
            });

            // Update shelf
            shelf.currentX += orient.w + kerf;
            if (orient.l > shelf.height) {
              shelf.height = orient.l;
            }

            // Cross cut line
            sheet.cutLines.push({
              x1: pX + orient.w,
              y1: pY,
              x2: pX + orient.w,
              y2: pY + orient.l,
            });

            placed = true;
            break;
          }
        }
        if (placed) break;

        // 2. Try starting a new shelf on this sheet
        const nextY =
          sheet.shelves.length === 0
            ? 0
            : sheet.shelves[sheet.shelves.length - 1].y +
              sheet.shelves[sheet.shelves.length - 1].height +
              kerf;

        if (orient.w <= sheet.width && nextY + orient.l <= sheet.length) {
          const newShelf: Shelf = {
            y: nextY,
            height: orient.l,
            currentX: orient.w + kerf,
          };
          sheet.shelves.push(newShelf);

          sheet.placed.push({
            pieceId: item.pieceId,
            label: item.label,
            x: 0,
            y: nextY,
            width: orient.w,
            length: orient.l,
            rotated: orient.rot,
            color,
          });

          // Rip cut line for the shelf
          if (nextY > 0) {
            sheet.cutLines.push({
              x1: 0,
              y1: nextY,
              x2: sheet.width,
              y2: nextY,
            });
          }
          // Cross cut line for piece
          sheet.cutLines.push({
            x1: orient.w,
            y1: nextY,
            x2: orient.w,
            y2: nextY + orient.l,
          });

          placed = true;
          break;
        }
      }
      if (placed) break;
    }

    // If still not placed, open a new sheet
    if (!placed) {
      const newSheet = createNewSheet();
      for (const orient of orientations) {
        if (orient.w <= newSheet.width && orient.l <= newSheet.length) {
          const newShelf: Shelf = {
            y: 0,
            height: orient.l,
            currentX: orient.w + kerf,
          };
          newSheet.shelves.push(newShelf);

          newSheet.placed.push({
            pieceId: item.pieceId,
            label: item.label,
            x: 0,
            y: 0,
            width: orient.w,
            length: orient.l,
            rotated: orient.rot,
            color,
          });

          newSheet.cutLines.push({
            x1: orient.w,
            y1: 0,
            x2: orient.w,
            y2: orient.l,
          });

          placed = true;
          break;
        }
      }
    }
  });

  // Calculate totals and waste
  let totalStockArea = 0;
  let totalUsedArea = 0;
  let totalCuts = 0;
  let totalPiecesPlaced = 0;

  const resultSheets: SheetResult[] = sheets.map((s) => {
    const sheetArea = s.width * s.length;
    const used = s.placed.reduce((acc, p) => acc + p.width * p.length, 0);
    const waste = Math.max(0, sheetArea - used);
    const wastePct = Math.round((waste / sheetArea) * 100);

    totalStockArea += sheetArea;
    totalUsedArea += used;
    totalCuts += s.cutLines.length;
    totalPiecesPlaced += s.placed.length;

    return {
      sheetIndex: s.sheetIndex,
      width: s.width,
      length: s.length,
      placedPieces: s.placed,
      cutLines: s.cutLines,
      wastePercentage: wastePct,
      cutsCount: s.cutLines.length,
    };
  });

  const totalWastePct =
    totalStockArea > 0
      ? Math.round(((totalStockArea - totalUsedArea) / totalStockArea) * 100)
      : 0;

  return {
    sheets: resultSheets,
    totalStockCount: resultSheets.length,
    wastePercentage: totalWastePct,
    totalCuts,
    totalPiecesPlaced,
    totalPiecesRequested,
  };
}

// URL state hash encoder/decoder for 1-click sharing
export function encodeProjectToHash(project: Project): string {
  try {
    const json = JSON.stringify({
      n: project.name,
      m: project.materialMode,
      w: project.stockWidth,
      l: project.stockLength,
      q: project.stockQuantity,
      k: project.kerfWidth,
      u: project.units,
      r: project.allowRotation,
      t: project.thickness,
      p: project.pieces.map((p) => [p.label, p.quantity, p.length, p.width, p.canRotate ? 1 : 0]),
    });
    return btoa(encodeURIComponent(json));
  } catch {
    return '';
  }
}

export function decodeProjectFromHash(hash: string): Partial<Project> | null {
  try {
    const raw = hash.replace(/^#\/?/, '');
    if (!raw) return null;
    const json = decodeURIComponent(atob(raw));
    const d = JSON.parse(json);
    return {
      name: d.n || 'Shared Project',
      materialMode: d.m || 'sheet',
      stockWidth: d.w || 48,
      stockLength: d.l || 96,
      stockQuantity: d.q || 1,
      kerfWidth: d.k !== undefined ? d.k : 0.125,
      units: d.u || 'in',
      allowRotation: d.r !== undefined ? d.r : true,
      thickness: d.t || 0.75,
      pieces: Array.isArray(d.p)
        ? d.p.map((item: any, i: number) => ({
            id: `p-${i}-${Date.now()}`,
            label: item[0] || `Part ${i + 1}`,
            quantity: item[1] || 1,
            length: item[2] || 24,
            width: item[3] || 12,
            canRotate: item[4] === 1,
          }))
        : [],
    };
  } catch {
    return null;
  }
}
