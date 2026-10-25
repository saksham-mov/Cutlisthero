import React, { useRef } from 'react';
import { Project, ProjectPiece } from '../types/project';

interface PiecesSectionProps {
  project: Project;
  onUpdatePieces: (pieces: ProjectPiece[]) => void;
}

export const PiecesSection: React.FC<PiecesSectionProps> = ({ project, onUpdatePieces }) => {
  const isSheet = project.materialMode === 'sheet';
  const labelInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const handleAddPiece = (insertAfterIndex?: number) => {
    const newId = `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newPiece: ProjectPiece = {
      id: newId,
      label: '',
      quantity: 1,
      length: 24,
      width: isSheet ? 12 : 0,
      canRotate: true,
    };

    let nextPieces: ProjectPiece[];
    if (insertAfterIndex !== undefined && insertAfterIndex >= 0) {
      nextPieces = [
        ...project.pieces.slice(0, insertAfterIndex + 1),
        newPiece,
        ...project.pieces.slice(insertAfterIndex + 1),
      ];
    } else {
      nextPieces = [...project.pieces, newPiece];
    }

    onUpdatePieces(nextPieces);

    // Auto-focus label of new piece
    setTimeout(() => {
      labelInputRefs.current[newId]?.focus();
    }, 50);
  };

  const handleUpdateField = (id: string, updates: Partial<ProjectPiece>) => {
    onUpdatePieces(
      project.pieces.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const handleDeletePiece = (id: string, focusPrevIndex?: number) => {
    const nextPieces = project.pieces.filter((p) => p.id !== id);
    onUpdatePieces(nextPieces);

    if (focusPrevIndex !== undefined && focusPrevIndex >= 0 && nextPieces[focusPrevIndex]) {
      setTimeout(() => {
        labelInputRefs.current[nextPieces[focusPrevIndex].id]?.focus();
      }, 50);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
    field: 'label' | 'quantity' | 'length' | 'width'
  ) => {
    const piece = project.pieces[index];

    // Enter in any field adds a new row below
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPiece(index);
    }

    // Backspace in empty Label field deletes that row
    if (e.key === 'Backspace' && field === 'label' && piece.label === '') {
      if (project.pieces.length > 1) {
        e.preventDefault();
        handleDeletePiece(piece.id, index - 1);
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Header Row: Pieces (N) and [+ Add] */}
      <div className="flex items-center justify-between">
        <span className="text-[14px] font-medium text-[#1C1917] dark:text-[#FAFAF9]">
          Pieces ({project.pieces.length})
        </span>
        <button
          type="button"
          onClick={() => handleAddPiece()}
          className="text-[13px] font-medium text-[#1C1917] hover:text-[#78716C] dark:text-[#FAFAF9] dark:hover:text-[#A8A29E] transition-colors"
        >
          + Add
        </button>
      </div>

      {/* Piece Rows */}
      <div className="space-y-1.5">
        {project.pieces.map((piece, index) => (
          <div
            key={piece.id}
            className="group flex items-center gap-2 py-0.5"
          >
            {/* Label */}
            <input
              type="text"
              placeholder={`Part ${index + 1}`}
              ref={(el) => { labelInputRefs.current[piece.id] = el; }}
              value={piece.label}
              onChange={(e) => handleUpdateField(piece.id, { label: e.target.value })}
              onKeyDown={(e) => handleKeyDown(e, index, 'label')}
              className="flex-1 min-w-[120px] h-9 px-3 rounded-[6px] border border-[#E7E5E4] bg-white text-[13px] font-medium text-[#1C1917] placeholder:text-[#78716C] focus:border-[#1C1917] focus:outline-none dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9] dark:placeholder:text-[#A8A29E] dark:focus:border-[#FAFAF9]"
            />

            {/* Qty */}
            <input
              type="number"
              min="1"
              placeholder="Qty"
              value={piece.quantity || ''}
              onChange={(e) => handleUpdateField(piece.id, { quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              onKeyDown={(e) => handleKeyDown(e, index, 'quantity')}
              className="w-16 h-9 px-2 text-center rounded-[6px] border border-[#E7E5E4] bg-white text-[13px] font-medium text-[#1C1917] placeholder:text-[#78716C] focus:border-[#1C1917] focus:outline-none dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9] dark:placeholder:text-[#A8A29E] dark:focus:border-[#FAFAF9]"
            />

            {/* Length */}
            <input
              type="number"
              step="any"
              min="0.1"
              placeholder="Length"
              value={piece.length || ''}
              onChange={(e) => handleUpdateField(piece.id, { length: parseFloat(e.target.value) || 0 })}
              onKeyDown={(e) => handleKeyDown(e, index, 'length')}
              className="w-20 h-9 px-2 text-center rounded-[6px] border border-[#E7E5E4] bg-white text-[13px] font-medium text-[#1C1917] placeholder:text-[#78716C] focus:border-[#1C1917] focus:outline-none dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9] dark:placeholder:text-[#A8A29E] dark:focus:border-[#FAFAF9]"
            />

            {/* Width (Sheet mode only) */}
            {isSheet && (
              <input
                type="number"
                step="any"
                min="0.1"
                placeholder="Width"
                value={piece.width || ''}
                onChange={(e) => handleUpdateField(piece.id, { width: parseFloat(e.target.value) || 0 })}
                onKeyDown={(e) => handleKeyDown(e, index, 'width')}
                className="w-20 h-9 px-2 text-center rounded-[6px] border border-[#E7E5E4] bg-white text-[13px] font-medium text-[#1C1917] placeholder:text-[#78716C] focus:border-[#1C1917] focus:outline-none dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9] dark:placeholder:text-[#A8A29E] dark:focus:border-[#FAFAF9]"
              />
            )}

            {/* Delete button (revealed on hover) */}
            <button
              type="button"
              onClick={() => handleDeletePiece(piece.id)}
              className="w-8 h-9 flex items-center justify-center text-[#78716C] hover:text-[#DC2626] dark:text-[#A8A29E] dark:hover:text-[#DC2626] opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete row"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
