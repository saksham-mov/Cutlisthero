import React from 'react';
import { Project } from '../types/project';

interface StockSectionProps {
  project: Project;
  onChange: (updated: Partial<Project>) => void;
}

export const StockSection: React.FC<StockSectionProps> = ({ project, onChange }) => {
  return (
    <div className="space-y-3">
      {/* Row 1: Material mode, Width, Length, Qty */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <select
          value={project.materialMode}
          onChange={(e) => onChange({ materialMode: e.target.value as 'sheet' | 'linear' })}
          className="h-9 px-3 rounded-[6px] border border-[#E7E5E4] bg-white text-[13px] font-medium text-[#1C1917] focus:border-[#1C1917] focus:outline-none dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9] dark:focus:border-[#FAFAF9] cursor-pointer"
        >
          <option value="sheet">Sheet</option>
          <option value="linear">Linear</option>
        </select>

        {project.materialMode === 'sheet' ? (
          <input
            type="number"
            step="any"
            min="1"
            placeholder="Width: 48"
            value={project.stockWidth || ''}
            onChange={(e) => onChange({ stockWidth: parseFloat(e.target.value) || 0 })}
            className="h-9 px-3 rounded-[6px] border border-[#E7E5E4] bg-white text-[13px] font-medium text-[#1C1917] placeholder:text-[#78716C] focus:border-[#1C1917] focus:outline-none dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9] dark:placeholder:text-[#A8A29E] dark:focus:border-[#FAFAF9]"
          />
        ) : (
          <div className="h-9 px-3 rounded-[6px] border border-dashed border-[#E7E5E4] bg-stone-50/50 flex items-center text-[12px] text-[#78716C] dark:border-[#292524] dark:bg-[#1C1917]/50 dark:text-[#A8A29E]">
            Single bar
          </div>
        )}

        <input
          type="number"
          step="any"
          min="1"
          placeholder="Length: 96"
          value={project.stockLength || ''}
          onChange={(e) => onChange({ stockLength: parseFloat(e.target.value) || 0 })}
          className="h-9 px-3 rounded-[6px] border border-[#E7E5E4] bg-white text-[13px] font-medium text-[#1C1917] placeholder:text-[#78716C] focus:border-[#1C1917] focus:outline-none dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9] dark:placeholder:text-[#A8A29E] dark:focus:border-[#FAFAF9]"
        />

        <input
          type="number"
          min="1"
          placeholder="Qty: 1"
          value={project.stockQuantity || ''}
          onChange={(e) => onChange({ stockQuantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
          className="h-9 px-3 rounded-[6px] border border-[#E7E5E4] bg-white text-[13px] font-medium text-[#1C1917] placeholder:text-[#78716C] focus:border-[#1C1917] focus:outline-none dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9] dark:placeholder:text-[#A8A29E] dark:focus:border-[#FAFAF9]"
        />
      </div>

      {/* Row 2: Kerf, Thickness, Allow Rotation */}
      <div className="flex flex-wrap items-center gap-4 text-[13px] text-[#78716C] dark:text-[#A8A29E] pt-1">
        <label className="flex items-center gap-1.5">
          <span>Kerf:</span>
          <input
            type="number"
            step="0.001"
            min="0"
            value={project.kerfWidth}
            onChange={(e) => onChange({ kerfWidth: parseFloat(e.target.value) || 0 })}
            className="w-16 h-7 px-2 rounded-[6px] border border-[#E7E5E4] bg-white text-[12px] font-medium text-[#1C1917] focus:border-[#1C1917] focus:outline-none dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9]"
          />
        </label>

        <label className="flex items-center gap-1.5">
          <span>Thickness:</span>
          <input
            type="number"
            step="0.0625"
            min="0"
            value={project.thickness}
            onChange={(e) => onChange({ thickness: parseFloat(e.target.value) || 0 })}
            className="w-16 h-7 px-2 rounded-[6px] border border-[#E7E5E4] bg-white text-[12px] font-medium text-[#1C1917] focus:border-[#1C1917] focus:outline-none dark:border-[#292524] dark:bg-[#1C1917] dark:text-[#FAFAF9]"
          />
        </label>

        {project.materialMode === 'sheet' && (
          <label className="flex items-center gap-1.5 cursor-pointer select-none text-[#1C1917] dark:text-[#FAFAF9]">
            <input
              type="checkbox"
              checked={project.allowRotation}
              onChange={(e) => onChange({ allowRotation: e.target.checked })}
              className="rounded-[4px] border-[#E7E5E4] text-[#1C1917] focus:ring-0 dark:border-[#292524]"
            />
            <span>Allow rotation</span>
          </label>
        )}
      </div>
    </div>
  );
};
