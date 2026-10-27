import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { DiaryEntry } from '../types/diary';
import { CatIcon } from './CatIcons';
import { PawtyNavDock } from './PawtyNavDock';

interface PawtyHomeProps {
  diaries: DiaryEntry[];
  currentYearMonth?: { year: number; month: number };
  onYearMonthChange?: (year: number, month: number) => void;
  onSelectDiary: (diary: DiaryEntry) => void;
  onNewDiary: (date?: string) => void;
  onOpenVault: () => void;
  onOpenSettings?: () => void;
}

export const PawtyHome: React.FC<PawtyHomeProps> = ({
  diaries,
  currentYearMonth,
  onYearMonthChange,
  onSelectDiary,
  onNewDiary,
  onOpenVault,
}) => {
  // 1-Year Calendar State (default 2026)
  const [year, setYear] = useState<number>(currentYearMonth?.year || 2026);

  // Active hover/selected date tooltip (default showing 2026-10-25 matching main.png)
  const [activeDate, setActiveDate] = useState<string>('2026-10-25');

  // Synchronize year if parent passes yearMonth
  React.useEffect(() => {
    if (currentYearMonth) {
      setYear(currentYearMonth.year);
    }
  }, [currentYearMonth]);

  // Navigate to previous year
  const handlePrevYear = () => {
    const nextY = year - 1;
    setYear(nextY);
    onYearMonthChange?.(nextY, currentYearMonth?.month || 10);
  };

  // Navigate to next year
  const handleNextYear = () => {
    const nextY = year + 1;
    setYear(nextY);
    onYearMonthChange?.(nextY, currentYearMonth?.month || 10);
  };

  // Fast lookup by date string: "YYYY-MM-DD"
  const diaryByDate = useMemo(() => {
    const map = new Map<string, DiaryEntry>();
    diaries.forEach((d) => map.set(d.date, d));
    return map;
  }, [diaries]);

  // Format date for the teal pill: e.g. "sunday, 25.10"
  const formatDatePill = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dayNames = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ];
      const dayName = dayNames[dateObj.getDay()];
      return `${dayName}, ${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

  // 12 months array (1 to 12)
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  // 31 days array (1 to 31)
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // Subtle organic doodle jitter for empty dots (살짝 삐뚤빼뚤 귀엽게)
  const getDotJitter = (day: number, month: number) => {
    const hash = Math.sin(day * 12.9898 + month * 78.233) * 43758.5453;
    const r1 = hash - Math.floor(hash);
    const hash2 = Math.cos(day * 4.898 + month * 93.23) * 23421.631;
    const r2 = hash2 - Math.floor(hash2);
    const dx = (r1 - 0.5) * 3.6;
    const dy = (r2 - 0.5) * 3.6;
    const scale = 0.85 + r1 * 0.3;
    return { dx, dy, scale };
  };

  return (
    <div className="relative min-h-screen bg-[#FAF9FB] flex flex-col items-center justify-start select-none px-4 sm:px-6 py-3 w-full max-w-sm sm:max-w-md mx-auto">
      {/* Top Header: 'Pawty' on left (Griun Mongtori), Book icon on right matching main.png */}
      <div className="flex items-center justify-between w-full pt-1 pb-1">
        <h1 className="text-3xl sm:text-4xl font-mongtori font-bold tracking-tight text-[#7D4C7D]">
          Pawty
        </h1>

        <button
          onClick={onOpenVault}
          aria-label="표현 사전 열기"
          title="표현 사전 (AI 추천 표현 모음)"
          className="p-1 text-[#7D4C7D] hover:opacity-80 transition-opacity cursor-pointer"
        >
          <BookOpen className="w-6 h-6 stroke-[1.8]" />
        </button>
      </div>

      {/* Year Selector (< 2026 >) matching main.png */}
      <div className="flex items-center justify-center gap-3 py-2 w-full">
        <button
          onClick={handlePrevYear}
          className="text-[#B89EB8] hover:text-[#7D4C7D] transition-colors p-1 cursor-pointer"
          aria-label="이전 해"
          title="이전 해"
        >
          <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        <span className="bg-[#7D4C7D] text-white text-xs sm:text-[13px] font-sans font-medium px-5 py-1 rounded-full shadow-xs tracking-wider">
          {year}
        </span>

        <button
          onClick={handleNextYear}
          className="text-[#B89EB8] hover:text-[#7D4C7D] transition-colors p-1 cursor-pointer"
          aria-label="다음 해"
          title="다음 해"
        >
          <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>

      {/* 12-Column x 31-Row Year Dot Matrix matching main.png exactly */}
      <div className="w-full flex-1 flex flex-col items-center justify-start pt-2 pb-24">
        <div className="grid grid-cols-12 gap-x-1 sm:gap-x-1.5 gap-y-1 sm:gap-y-1.5 place-items-center w-full max-w-[420px] mx-auto">
          {days.map((dayNum) => (
            <React.Fragment key={`day-row-${dayNum}`}>
              {months.map((monthNum) => {
                const daysInMonth = new Date(year, monthNum, 0).getDate();
                if (dayNum > daysInMonth) {
                  // Non-existent day in month (e.g. Feb 30, 31)
                  return <div key={`${monthNum}-${dayNum}`} className="w-7 h-7 sm:w-8 sm:h-8" />;
                }

                const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const diary = diaryByDate.get(dateStr);
                const hasDiary = Boolean(diary);
                const isSelected = activeDate === dateStr;

                // 1. Day with Diary: Render Cat Artwork
                if (hasDiary && diary) {
                  return (
                    <div
                      key={dateStr}
                      onClick={() => onSelectDiary(diary)}
                      onMouseEnter={() => setActiveDate(dateStr)}
                      className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 cursor-pointer group"
                      title={`${dateStr}: ${diary.originalTitle || '고양이 일기'}`}
                    >
                      {/* Teal Tooltip Pill matching main.png: e.g. "sunday, 25.10" */}
                      {isSelected && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#59A8B0] text-white text-[9px] sm:text-[10px] font-sans px-2.5 py-0.5 rounded-full shadow-md z-30 pointer-events-none">
                          {formatDatePill(dateStr)}
                        </div>
                      )}

                      <div className="w-full h-full flex items-center justify-center transition-transform group-hover:scale-125">
                        {diary.customDrawingUrl ? (
                          <img
                            src={diary.customDrawingUrl}
                            alt="Cat"
                            className="w-full h-full object-contain pointer-events-none select-none drop-shadow-xs"
                          />
                        ) : (
                          <CatIcon name={diary.catId || 'momo'} size={28} className="w-full h-full object-contain" />
                        )}
                      </div>
                    </div>
                  );
                }

                // 2. Empty Day: Render Clean Plum Dot
                const jitter = getDotJitter(dayNum, monthNum);
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => onNewDiary(dateStr)}
                    onMouseEnter={() => setActiveDate(dateStr)}
                    className="relative flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 group cursor-pointer"
                    title={`${dateStr} 일기 쓰기`}
                  >
                    {/* Tooltip on hover/active */}
                    {isSelected && (
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#59A8B0] text-white text-[9px] sm:text-[10px] font-sans px-2.5 py-0.5 rounded-full shadow-md z-30 pointer-events-none">
                        {formatDatePill(dateStr)}
                      </div>
                    )}

                    <span
                      className="w-1.5 h-1.5 rounded-full bg-[#7D4C7D] transition-transform group-hover:scale-150"
                      style={{
                        transform: `translate(${jitter.dx.toFixed(2)}px, ${jitter.dy.toFixed(2)}px) scale(${jitter.scale.toFixed(2)})`,
                      }}
                    />
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Floating Bottom Navigation Dock matching main_419c9fa7.png */}
      <PawtyNavDock
        activeTab="home"
        onGoHome={() => {}}
        onGoDiary={() => {
          const todayStr = '2026-10-26';
          const existing = diaryByDate.get(todayStr);
          if (existing) {
            onSelectDiary(existing);
          } else {
            onNewDiary(todayStr);
          }
        }}
      />
    </div>
  );
};
