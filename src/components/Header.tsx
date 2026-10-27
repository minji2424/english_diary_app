import React from 'react';
import { Sparkles, Plus, Flame, BookOpen, BookmarkCheck, BarChart3, Flower2, Sprout } from 'lucide-react';
import { GardenIcon } from './GardenIcons';

interface HeaderProps {
  activeTab: 'garden' | 'write' | 'history' | 'vocab' | 'stats';
  setActiveTab: (tab: 'garden' | 'write' | 'history' | 'vocab' | 'stats') => void;
  streak: number;
  totalDiaries: number;
  onNewDiary: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  streak,
  totalDiaries,
  onNewDiary,
}) => {
  return (
    <>
      {/* Top Minimal Bar */}
      <header className="sticky top-0 z-30 bg-[#F8F5F8]/90 backdrop-blur-md border-b border-[#E8E2F5]">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between font-mono-typewriter">
          {/* Brand */}
          <div
            onClick={() => setActiveTab('garden')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-[#2A1DBE] flex items-center justify-center text-white shadow-2xs group-hover:scale-105 transition-transform">
              <GardenIcon name="tree" className="w-5 h-5" color="white" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-[#2A1DBE]">
                Native<span className="text-[#6456E2]">Ink</span>
              </span>
              <span className="text-[10px] text-[#2A1DBE]/60 ml-2 hidden sm:inline">
                garden diary
              </span>
            </div>
          </div>

          {/* Right Action: Streak & New Memory */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBE5FA] border border-[#2A1DBE]/20 text-[#2A1DBE] text-[11px] font-bold">
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
              <span>{streak}d streak</span>
            </div>

            <button
              onClick={onNewDiary}
              className="flex items-center gap-1 bg-[#2A1DBE] hover:bg-[#1E11A8] text-white px-3 py-1 rounded-full text-xs font-bold transition-all shadow-2xs active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">plant entry</span>
            </button>
          </div>
        </div>
      </header>

      {/* Floating Bottom Aesthetic Dock (matching screenshot bottom navigation!) */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40">
        <div className="bg-[#E4DDF7]/95 backdrop-blur-md border border-[#D5CBF2] p-1.5 rounded-2xl shadow-lg flex items-center gap-1.5 font-mono-typewriter">
          {/* Garden View Tab (Left button in screenshot: [🌷🍄]) */}
          <button
            onClick={() => setActiveTab('garden')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'garden'
                ? 'bg-[#2A1DBE] text-white shadow-xs scale-102'
                : 'text-[#2A1DBE] hover:bg-white/60'
            }`}
            title="기억 정원 보기 (Garden Tapestry)"
          >
            <GardenIcon
              name="flower"
              color={activeTab === 'garden' ? 'white' : '#2A1DBE'}
              className="w-4 h-4"
            />
            <span className="text-[11px] hidden sm:inline">garden</span>
          </button>

          {/* Today's Entry / Write View (Right button in screenshot: [🌸]) */}
          <button
            onClick={() => setActiveTab('write')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'write'
                ? 'bg-[#2A1DBE] text-white shadow-xs scale-102'
                : 'text-[#2A1DBE] hover:bg-white/60'
            }`}
            title="일기 작성하기 (Write Memory)"
          >
            <GardenIcon
              name="tree"
              color={activeTab === 'write' ? 'white' : '#2A1DBE'}
              className="w-4 h-4"
            />
            <span className="text-[11px] hidden sm:inline">write</span>
          </button>

          {/* History / Filter Tab */}
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'history'
                ? 'bg-[#2A1DBE] text-white shadow-xs scale-102'
                : 'text-[#2A1DBE] hover:bg-white/60'
            }`}
            title="일기 모아보기 & 달력"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">history</span>
            {totalDiaries > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'history' ? 'bg-white/20 text-white' : 'bg-[#D6CBEF] text-[#2A1DBE]'
              }`}>
                {totalDiaries}
              </span>
            )}
          </button>

          {/* Vocab Vault Tab */}
          <button
            onClick={() => setActiveTab('vocab')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'vocab'
                ? 'bg-[#2A1DBE] text-white shadow-xs scale-102'
                : 'text-[#2A1DBE] hover:bg-white/60'
            }`}
            title="표현 단어장"
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">vocab</span>
          </button>

          {/* Stats Tab */}
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'stats'
                ? 'bg-[#2A1DBE] text-white shadow-xs scale-102'
                : 'text-[#2A1DBE] hover:bg-white/60'
            }`}
            title="성장 리포트"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="text-[11px] hidden sm:inline">stats</span>
          </button>
        </div>
      </div>
    </>
  );
};
