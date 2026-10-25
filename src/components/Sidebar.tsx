import React, { useState } from 'react';
import { Project } from '../types/project';
import { formatRelativeTime } from '../utils/time';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#FAFAF9] dark:bg-[#0C0A09] text-[#1C1917] dark:text-[#FAFAF9] p-4 border-r border-[#E7E5E4] dark:border-[#292524]">
      {/* Top action: + New project */}
      <div className="flex items-center justify-between pb-4 border-b border-[#E7E5E4] dark:border-[#292524] mb-3">
        <span className="text-[12px] font-semibold text-[#78716C] dark:text-[#A8A29E] uppercase tracking-wider">
          Projects
        </span>
        <button
          type="button"
          onClick={() => {
            onCreateProject();
            onCloseMobile();
          }}
          className="text-[13px] font-medium text-[#1C1917] hover:text-[#78716C] dark:text-[#FAFAF9] dark:hover:text-[#A8A29E] transition-colors"
        >
          + New
        </button>
      </div>

      {/* Projects List */}
      <div className="flex-1 overflow-y-auto space-y-1 -mx-1 px-1">
        {projects.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-[#78716C] dark:text-[#A8A29E]">
            No saved projects
          </div>
        ) : (
          projects.map((proj) => {
            const isActive = proj.id === activeProjectId;
            const pieceCount = proj.pieces.reduce((sum, p) => sum + (p.quantity || 1), 0);
            const isConfirming = confirmDeleteId === proj.id;

            return (
              <div
                key={proj.id}
                onClick={() => {
                  if (!isConfirming) {
                    onSelectProject(proj.id);
                    onCloseMobile();
                  }
                }}
                className={`group relative flex items-center justify-between p-[10px_12px] rounded-[6px] text-left cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-[#FFFFFF] dark:bg-[#1C1917] shadow-2xs border border-[#E7E5E4] dark:border-[#292524]'
                    : 'hover:bg-[#E7E5E4]/50 dark:hover:bg-[#1C1917]/50'
                }`}
              >
                <div className="min-w-0 flex-1 pr-2">
                  <div className="text-[13px] font-medium text-[#1C1917] dark:text-[#FAFAF9] truncate">
                    {proj.name || 'Untitled project'}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#78716C] dark:text-[#A8A29E] mt-0.5 tabular-nums">
                    <span>{formatRelativeTime(proj.updatedAt)}</span>
                    <span>·</span>
                    <span>{pieceCount} {pieceCount === 1 ? 'piece' : 'pieces'}</span>
                  </div>
                </div>

                {/* Delete / Confirm Delete button */}
                {isConfirming ? (
                  <div
                    className="flex items-center gap-1 z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteProject(proj.id);
                        setConfirmDeleteId(null);
                      }}
                      className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-[#DC2626] text-white"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-1.5 py-0.5 rounded text-[11px] text-[#78716C] hover:text-[#1C1917] dark:text-[#A8A29E] dark:hover:text-[#FAFAF9]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(proj.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#78716C] hover:text-[#DC2626] dark:text-[#A8A29E] dark:hover:text-[#DC2626] transition-opacity"
                    title="Delete project"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar (240px) */}
      <aside className="no-print hidden lg:block w-[240px] shrink-0 border-r border-[#E7E5E4] dark:border-[#292524] h-[calc(100vh-65px)] sticky top-[65px]">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-In Drawer (280px) */}
      {isOpenMobile && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Drawer content */}
          <div className="fixed inset-y-0 left-0 w-[280px] bg-[#FAFAF9] dark:bg-[#0C0A09] shadow-xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
