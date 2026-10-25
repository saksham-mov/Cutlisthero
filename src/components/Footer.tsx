import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="no-print mt-auto border-t border-[#E7E5E4] dark:border-[#292524] py-6 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#78716C] dark:text-[#A8A29E]">
        {/* Single line legal disclaimer */}
        <p className="text-center sm:text-left">
          CutList Hero · Free · Open source · Always verify cuts are safe for your specific saw and setup.
        </p>

        {/* Small links */}
        <div className="flex items-center gap-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#1C1917] dark:hover:text-[#FAFAF9] transition-colors"
          >
            Source
          </a>
          <a
            href="mailto:vastrakarsaksham2@gmail.com"
            className="hover:text-[#1C1917] dark:hover:text-[#FAFAF9] transition-colors"
          >
            Contact
          </a>
          <a
            href="https://buymeacoffee.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-[#1C1917] dark:hover:text-[#FAFAF9] transition-colors"
          >
            Buy me a coffee
          </a>
        </div>
      </div>
    </footer>
  );
};
