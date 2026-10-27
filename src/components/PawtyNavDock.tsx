import React from 'react';

export const PawIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="6" cy="9" r="1.8" />
    <circle cx="10" cy="5.5" r="2" />
    <circle cx="14" cy="5.5" r="2" />
    <circle cx="18" cy="9" r="1.8" />
    <path d="M12 11.5c-2.8 0-5 1.8-5 4 0 1.8 1.4 3.2 3.2 3.2.7 0 1.3-.3 1.8-.7.5.4 1.1.7 1.8.7 1.8 0 3.2-1.4 3.2-3.2 0-2.2-2.2-4-5-4z" />
  </svg>
);

export const HomeIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M3 11l9-8 9 8v10a1 1 0 01-1 1H4a1 1 0 01-1-1V11z" />
  </svg>
);

interface PawtyNavDockProps {
  activeTab: 'home' | 'diary';
  onGoHome: () => void;
  onGoDiary: () => void;
}

export const PawtyNavDock: React.FC<PawtyNavDockProps> = ({
  activeTab,
  onGoHome,
  onGoDiary,
}) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 select-none">
      <div className="bg-[#F6EDF7] rounded-2xl shadow-[0_4px_24px_rgba(125,76,125,0.14)] p-1.5 flex items-center gap-1.5 border border-purple-100/60">
        {/* Left Button: Home */}
        <button
          type="button"
          onClick={onGoHome}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            activeTab === 'home'
              ? 'bg-[#7D4C7D] text-white shadow-xs cursor-default'
              : 'bg-transparent hover:bg-white/60 text-[#7D4C7D] cursor-pointer active:scale-95'
          }`}
          aria-label="홈 달력으로 이동"
          title="홈 달력"
        >
          <HomeIcon className="w-6 h-6" />
        </button>

        {/* Right Button: Paw (Diary) */}
        <button
          type="button"
          onClick={onGoDiary}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            activeTab === 'diary'
              ? 'bg-[#7D4C7D] text-white shadow-xs cursor-default'
              : 'bg-transparent hover:bg-white/60 text-[#7D4C7D] cursor-pointer active:scale-95'
          }`}
          aria-label="오늘 일기로 이동"
          title="오늘 일기"
        >
          <PawIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
