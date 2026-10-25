import React from 'react';

export const GhostDiagram: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <p className="text-[13px] text-[#78716C] dark:text-[#A8A29E] mb-6">
        Your optimized layout will appear here
      </p>

      {/* Ghosted SVG schematic (30% opacity) */}
      <div className="w-full max-w-[540px] opacity-30 select-none pointer-events-none transition-opacity">
        <svg
          viewBox="0 0 480 320"
          className="w-full h-auto rounded border border-[#E7E5E4] dark:border-[#292524] bg-white dark:bg-[#1C1917]"
        >
          {/* Sheet background */}
          <rect x="0" y="0" width="480" height="320" fill="none" stroke="#78716C" strokeWidth="1" strokeDasharray="4 4" />

          {/* Ghosted pieces */}
          <rect x="10" y="10" width="140" height="200" fill="#94A3B8" rx="2" />
          <text x="80" y="105" textAnchor="middle" fill="#1C1917" fontSize="12" fontWeight="500">Side panel</text>
          <text x="80" y="125" textAnchor="middle" fill="#78716C" fontSize="10">24 × 36</text>

          <rect x="155" y="10" width="140" height="200" fill="#A8A29E" rx="2" />
          <text x="225" y="105" textAnchor="middle" fill="#1C1917" fontSize="12" fontWeight="500">Side panel</text>
          <text x="225" y="125" textAnchor="middle" fill="#78716C" fontSize="10">24 × 36</text>

          <rect x="300" y="10" width="170" height="95" fill="#CBD5E1" rx="2" />
          <text x="385" y="52" textAnchor="middle" fill="#1C1917" fontSize="12" fontWeight="500">Top panel</text>
          <text x="385" y="68" textAnchor="middle" fill="#78716C" fontSize="10">34 × 18</text>

          <rect x="300" y="110" width="170" height="95" fill="#D6D3D1" rx="2" />
          <text x="385" y="152" textAnchor="middle" fill="#1C1917" fontSize="12" fontWeight="500">Bottom panel</text>
          <text x="385" y="168" textAnchor="middle" fill="#78716C" fontSize="10">34 × 18</text>

          {/* Shelves row */}
          <rect x="10" y="215" width="110" height="95" fill="#FCA5A5" rx="2" />
          <text x="65" y="260" textAnchor="middle" fill="#1C1917" fontSize="11" fontWeight="500">Shelf</text>
          <text x="65" y="275" textAnchor="middle" fill="#78716C" fontSize="9">12 × 34</text>

          <rect x="125" y="215" width="110" height="95" fill="#A7F3D0" rx="2" />
          <text x="180" y="260" textAnchor="middle" fill="#1C1917" fontSize="11" fontWeight="500">Shelf</text>
          <text x="180" y="275" textAnchor="middle" fill="#78716C" fontSize="9">12 × 34</text>

          <rect x="240" y="215" width="110" height="95" fill="#94A3B8" rx="2" />
          <text x="295" y="260" textAnchor="middle" fill="#1C1917" fontSize="11" fontWeight="500">Shelf</text>
          <text x="295" y="275" textAnchor="middle" fill="#78716C" fontSize="9">12 × 34</text>

          {/* Cut lines */}
          <line x1="0" y1="212" x2="480" y2="212" stroke="#78716C" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="297" y1="0" x2="297" y2="212" stroke="#78716C" strokeWidth="1" strokeDasharray="3 3" />
        </svg>
      </div>
    </div>
  );
};
