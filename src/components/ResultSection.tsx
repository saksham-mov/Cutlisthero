import React, { useState } from 'react';
import { OptimizationOutput, Project } from '../types/project';
import { GhostDiagram } from './GhostDiagram';
import { encodeProjectToHash } from '../utils/optimizer';

interface ResultSectionProps {
  result: OptimizationOutput | null;
  project: Project;
}

export const ResultSection: React.FC<ResultSectionProps> = ({ result, project }) => {
  const [copied, setCopied] = useState(false);

  if (!result || result.sheets.length === 0) {
    return <GhostDiagram />;
  }

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const hash = encodeProjectToHash(project);
    const url = `${window.location.origin}${window.location.pathname}#${hash}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const isSheet = project.materialMode === 'sheet';
  const unitLabel = project.units || 'in';

  return (
    <div className="space-y-6">
      {/* H2 for SEO & Clean Hierarchy */}
      <div className="flex items-center justify-between border-b border-[#E7E5E4] dark:border-[#292524] pb-3">
        <h2 className="text-[16px] font-semibold text-[#1C1917] dark:text-[#FAFAF9]">
          Optimized Layout
        </h2>

        {/* Monospace Summary Line */}
        <div className="tabular-nums text-[13px] text-[#78716C] dark:text-[#A8A29E]">
          <span className="text-[#1C1917] dark:text-[#FAFAF9] font-medium">
            {result.totalStockCount} {isSheet ? (result.totalStockCount === 1 ? 'sheet' : 'sheets') : (result.totalStockCount === 1 ? 'bar' : 'bars')}
          </span>
          {' · '}
          <span className="text-[#1C1917] dark:text-[#FAFAF9] font-medium">
            {result.wastePercentage}% waste
          </span>
          {' · '}
          <span className="text-[#1C1917] dark:text-[#FAFAF9] font-medium">
            {result.totalCuts} cuts
          </span>
        </div>
      </div>

      {/* SVG Diagrams (one per sheet) */}
      <div className="space-y-6">
        {result.sheets.map((sheet) => {
          const sheetW = sheet.width;
          const sheetL = sheet.length;

          // Padding in viewBox coordinates
          const pad = 4;
          const vbW = sheetW + pad * 2;
          const vbL = sheetL + pad * 2;

          return (
            <div
              key={sheet.sheetIndex}
              className="rounded-[8px] border border-[#E7E5E4] bg-white p-4 dark:border-[#292524] dark:bg-[#1C1917] print-break-inside-avoid shadow-xs"
            >
              <div className="flex items-center justify-between text-[11px] text-[#78716C] dark:text-[#A8A29E] mb-3 tabular-nums">
                <span>
                  {isSheet ? `Sheet ${sheet.sheetIndex}` : `Bar ${sheet.sheetIndex}`} ({sheetW} × {sheetL} {unitLabel})
                </span>
                <span>
                  {sheet.placedPieces.length} parts · {sheet.wastePercentage}% waste
                </span>
              </div>

              {/* Responsive SVG diagram */}
              <div className="w-full flex justify-center overflow-x-auto">
                <svg
                  viewBox={`-${pad} -${pad} ${vbW} ${vbL}`}
                  className="w-full max-w-[600px] h-auto select-none"
                  style={{ maxHeight: '600px' }}
                >
                  <defs>
                    {/* Small hatched pattern for kerf visualization */}
                    <pattern
                      id="kerf-hatch"
                      width="4"
                      height="4"
                      patternUnits="userSpaceOnUse"
                      patternTransform="rotate(45)"
                    >
                      <line x1="0" y1="0" x2="0" y2="4" stroke="#78716C" strokeWidth="0.8" opacity="0.3" />
                    </pattern>
                  </defs>

                  {/* Stock outline (thin gray stroke) */}
                  <rect
                    x="0"
                    y="0"
                    width={sheetW}
                    height={sheetL}
                    fill="#FAFAF9"
                    stroke="#A8A29E"
                    strokeWidth="0.75"
                    className="dark:fill-[#0C0A09] dark:stroke-[#78716C]"
                  />

                  {/* Placed Pieces */}
                  {sheet.placedPieces.map((piece, pIdx) => {
                    const cx = piece.x + piece.width / 2;
                    const cy = piece.y + piece.length / 2;
                    const minDim = Math.min(piece.width, piece.length);
                    const labelFontSize = Math.min(piece.width * 0.16, piece.length * 0.22, 3.5);
                    const dimFontSize = Math.max(1.8, labelFontSize * 0.75);

                    return (
                      <g key={`${piece.pieceId}-${pIdx}`}>
                        {/* Piece rectangle with muted pastel color */}
                        <rect
                          x={piece.x}
                          y={piece.y}
                          width={piece.width}
                          height={piece.length}
                          fill={piece.color}
                          stroke="#1C1917"
                          strokeWidth="0.5"
                          opacity="0.9"
                        />

                        {/* Centered Piece Label & Dimensions (if space permits) */}
                        {minDim > 3 && (
                          <>
                            <text
                              x={cx}
                              y={cy - (minDim > 6 ? dimFontSize * 0.6 : 0)}
                              textAnchor="middle"
                              dominantBaseline="central"
                              fill="#1C1917"
                              fontSize={labelFontSize}
                              fontWeight="500"
                              style={{ pointerEvents: 'none' }}
                            >
                              {piece.label}
                            </text>
                            {minDim > 6 && (
                              <text
                                x={cx}
                                y={cy + labelFontSize * 0.8}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="#44403C"
                                fontSize={dimFontSize}
                                className="tabular-nums"
                                style={{ pointerEvents: 'none' }}
                              >
                                {piece.width} × {piece.length}
                              </text>
                            )}
                          </>
                        )}
                      </g>
                    );
                  })}

                  {/* Cut Lines (dashed gray lines) */}
                  {sheet.cutLines.map((line, lIdx) => (
                    <line
                      key={`cut-${lIdx}`}
                      x1={line.x1}
                      y1={line.y1}
                      x2={line.x2}
                      y2={line.y2}
                      stroke="#44403C"
                      strokeWidth="0.5"
                      strokeDasharray="2 1.5"
                      opacity="0.8"
                    />
                  ))}
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Text Buttons: Print & Share (No icons per spec) */}
      <div className="no-print flex items-center justify-end gap-4 pt-2 relative">
        <button
          type="button"
          onClick={handlePrint}
          className="text-[13px] font-medium text-[#1C1917] hover:text-[#78716C] dark:text-[#FAFAF9] dark:hover:text-[#A8A29E] transition-colors"
        >
          Print
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="text-[13px] font-medium text-[#1C1917] hover:text-[#78716C] dark:text-[#FAFAF9] dark:hover:text-[#A8A29E] transition-colors"
        >
          Share
        </button>

        {/* Tiny "Copied" tooltip for 1.5s */}
        {copied && (
          <span className="absolute -top-7 right-0 px-2 py-0.5 rounded-[4px] bg-[#1C1917] text-[#FAFAF9] text-[11px] font-medium dark:bg-[#FAFAF9] dark:text-[#1C1917] transition-all">
            Copied
          </span>
        )}
      </div>
    </div>
  );
};
