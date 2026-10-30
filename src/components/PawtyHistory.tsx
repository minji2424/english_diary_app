import React, { useState, useMemo } from 'react';
import { ChevronLeft, Search, ChevronDown, Filter, X } from 'lucide-react';
import { DiaryEntry, WeatherType, MoodType, CatId } from '../types/diary';
import { CatIcon } from './CatIcons';

interface PawtyHistoryProps {
  diaries: DiaryEntry[];
  onSelectDiary: (diary: DiaryEntry) => void;
  onBack: () => void;
  onNewDiary: () => void;
}

export const PawtyHistory: React.FC<PawtyHistoryProps> = ({
  diaries,
  onSelectDiary,
  onBack,
  onNewDiary,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('2026.10');
  const [selectedMood, setSelectedMood] = useState<MoodType | 'all'>('all');
  const [selectedWeather, setSelectedWeather] = useState<WeatherType | 'all'>('all');
  const [selectedCat, setSelectedCat] = useState<CatId | 'all'>('all');

  // Month list from available entries
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    diaries.forEach((d) => {
      const parts = d.date.split('-');
      if (parts.length >= 2) {
        set.add(`${parts[0]}.${parts[1]}`);
      }
    });
    const arr = Array.from(set).sort().reverse();
    return arr.length > 0 ? arr : ['2026.10'];
  }, [diaries]);

  // Filtered diaries
  const filteredDiaries = useMemo(() => {
    return diaries.filter((d) => {
      // Month filter
      if (selectedMonth !== 'all') {
        const dMonth = `${d.date.split('-')[0]}.${d.date.split('-')[1]}`;
        if (dMonth !== selectedMonth) return false;
      }
      // Mood filter
      if (selectedMood !== 'all' && d.mood !== selectedMood) return false;
      // Weather filter
      if (selectedWeather !== 'all' && d.weather !== selectedWeather) return false;
      // Cat filter
      if (selectedCat !== 'all' && d.catId !== selectedCat) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = (d.originalTitle || '').toLowerCase().includes(q);
        const inContent = (d.originalContent || '').toLowerCase().includes(q);
        const inCorrected = (d.correctionResult?.correctedFullText || '').toLowerCase().includes(q);
        if (!inTitle && !inContent && !inCorrected) return false;
      }
      return true;
    });
  }, [diaries, selectedMonth, selectedMood, selectedWeather, selectedCat, searchQuery]);

  // Helpers to parse date for list item
  const parseDateInfo = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      return {
        day: String(d),
        dayOfWeek: dayNames[date.getDay()],
      };
    } catch {
      return { day: '01', dayOfWeek: 'SUN' };
    }
  };

  const hasActiveFilters =
    selectedMood !== 'all' || selectedWeather !== 'all' || selectedCat !== 'all' || searchQuery.trim().length > 0;

  return (
    <div className="relative min-h-[92vh] flex flex-col justify-between max-w-md md:max-w-2xl lg:max-w-3xl mx-auto select-none px-4 py-2 w-full">
      {/* Top Bar matching Screen 7 */}
      <div className="flex items-center justify-between py-2 mb-2">
        <button
          onClick={onBack}
          aria-label="뒤로가기"
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#1F1735] hover:bg-[#F2ECE6] transition-colors"
        >
          <ChevronLeft className="w-5 h-5" strokeWidth={2} />
        </button>

        <div className="w-10" />

        <button
          onClick={() => setShowSearch((v) => !v)}
          aria-label="검색"
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#1F1735] hover:bg-[#F2ECE6] transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {/* Search Input Bar (when toggled) */}
      {showSearch && (
        <div className="mb-4 animate-fadeIn">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="검색"
              className="w-full pl-4 pr-10 py-2.5 rounded-full bg-white border border-[#E2D6CD] text-xs text-[#1F1735] placeholder-[#9B8C82] focus:outline-none focus:border-[#8D4F2B]"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 text-[#9B8C82] hover:text-[#1F1735]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Month Selector matching Screen 7: "2026.10 ⌄" */}
      <div className="flex items-center justify-between px-1 mb-6">
        <button
          onClick={() => setShowFilterModal(true)}
          className="flex items-center gap-1.5 text-xl font-mono text-[#1F1735] font-medium hover:opacity-80 transition-opacity"
        >
          <span>{selectedMonth === 'all' ? '전체 기간' : selectedMonth}</span>
          <ChevronDown className="w-4 h-4 stroke-[2.2]" />
        </button>

        {/* Filter badge / button */}
        <button
          onClick={() => setShowFilterModal(true)}
          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-sans-clean transition-colors ${
            hasActiveFilters
              ? 'bg-[#8D4F2B] text-white'
              : 'bg-[#F2ECE6] text-[#7A6E67] hover:bg-[#EBE3DC]'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>필터</span>
        </button>
      </div>

      {/* List of Entries matching Screen 7 */}
      <div className="flex-1 divide-y divide-[#EFE5DE]">
        {filteredDiaries.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <p className="text-xs font-sans-clean text-[#9B8C82]">
              해당하는 기억이 없습니다.
            </p>
            <button
              onClick={onNewDiary}
              className="px-5 py-2 rounded-full bg-[#8D4F2B] text-white text-xs font-sans-clean font-medium hover:bg-[#783E1E]"
            >
              새 기억 쓰기
            </button>
          </div>
        ) : (
          filteredDiaries.map((entry) => {
            const { day, dayOfWeek } = parseDateInfo(entry.date);
            const title = entry.correctionResult?.naturalTitle || entry.originalTitle;
            const snippet = entry.correctionResult?.correctedFullText || entry.originalContent;
            const catName = entry.catName || '모모';

            return (
              <div
                key={entry.id}
                onClick={() => onSelectDiary(entry)}
                className="py-4 px-1 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/40 transition-colors group"
              >
                {/* Left Date indicator matching Screen 7 */}
                <div className="text-left w-10 shrink-0">
                  <div className="text-xl font-mono font-medium text-[#1F1735] leading-none">
                    {day}
                  </div>
                  <div className="text-[10px] font-mono text-[#8E8077] tracking-wider mt-1">
                    {dayOfWeek}
                  </div>
                </div>

                {/* Middle: Title & Snippet */}
                <div className="flex-1 min-w-0 pr-2">
                  <p className="font-mono text-sm font-semibold text-[#1F1735] truncate group-hover:text-[#8D4F2B] transition-colors">
                    {title}
                  </p>
                  <p className="font-mono text-xs text-[#7A6E67] truncate mt-0.5 opacity-90">
                    {snippet.split('\n')[0]}
                  </p>
                </div>

                {/* Right: Cat Stamp & Cat Name matching Screen 7 */}
                <div className="flex flex-col items-center justify-center shrink-0 w-12 text-center">
                  <div className="h-9 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {entry.customDrawingUrl ? (
                      <img src={entry.customDrawingUrl} alt="Drawn cat" className="w-8 h-8 object-contain" />
                    ) : (
                      <CatIcon name={entry.catId || 'momo'} size={30} />
                    )}
                  </div>
                  <span className="text-[11px] font-sans-clean text-[#70645D] mt-0.5">
                    {entry.customDrawingUrl ? '손그림' : catName}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-5 border border-[#ECE3DD] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#F1E8E2] pb-3">
              <h3 className="text-sm font-sans-clean font-bold text-[#1F1735]">
                기록 필터
              </h3>
              <button
                onClick={() => setShowFilterModal(false)}
                className="text-[#9B8C82] hover:text-[#1F1735]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Month options */}
            <div className="space-y-2">
              <label className="text-xs font-sans-clean font-semibold text-[#8D4F2B]">
                월 선택
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedMonth('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono transition-colors ${
                    selectedMonth === 'all'
                      ? 'bg-[#8D4F2B] text-white'
                      : 'bg-[#F4ECE6] text-[#7A6E67]'
                  }`}
                >
                  전체
                </button>
                {availableMonths.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMonth(m)}
                    className={`px-3 py-1.5 rounded-full text-xs font-mono transition-colors ${
                      selectedMonth === m
                        ? 'bg-[#8D4F2B] text-white'
                        : 'bg-[#F4ECE6] text-[#7A6E67]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Cat character filter */}
            <div className="space-y-2">
              <label className="text-xs font-sans-clean font-semibold text-[#8D4F2B]">
                고양이 친구
              </label>
              <div className="flex flex-wrap gap-2">
                {(['all', 'momo', 'neuru', 'hodu', 'dubu', 'tori', 'sogeum'] as const).map((c) => {
                  const names: Record<string, string> = {
                    all: '전체',
                    momo: '모모',
                    neuru: '느루',
                    hodu: '호두',
                    dubu: '두부',
                    tori: '토리',
                    sogeum: '소금',
                  };
                  return (
                    <button
                      key={c}
                      onClick={() => setSelectedCat(c)}
                      className={`px-3 py-1 rounded-full text-xs font-sans-clean transition-colors ${
                        selectedCat === c
                          ? 'bg-[#1F1735] text-white'
                          : 'bg-[#F4ECE6] text-[#7A6E67]'
                      }`}
                    >
                      {names[c]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reset & Apply */}
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  setSelectedMonth('2026.10');
                  setSelectedMood('all');
                  setSelectedWeather('all');
                  setSelectedCat('all');
                  setSearchQuery('');
                  setShowFilterModal(false);
                }}
                className="flex-1 py-2.5 rounded-full border border-[#D5C2B2] text-xs font-sans-clean text-[#7A6E67]"
              >
                초기화
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="flex-1 py-2.5 rounded-full bg-[#8D4F2B] text-white text-xs font-sans-clean font-semibold shadow-sm"
              >
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
