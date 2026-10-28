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
  const today = new Date();
  const [localYearMonth, setLocalYearMonth] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth() + 1,
  }));
  const year = currentYearMonth?.year ?? localYearMonth.year;
  const month = currentYearMonth?.month ?? localYearMonth.month;
  const [activeDate, setActiveDate] = useState<string>(() =>
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  );

  const changeMonth = (delta: number) => {
    const next = new Date(year, month - 1 + delta, 1);
    setLocalYearMonth({ year: next.getFullYear(), month: next.getMonth() + 1 });
    onYearMonthChange?.(next.getFullYear(), next.getMonth() + 1);
    setActiveDate(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`);
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

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const calendarCells = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

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

      {/* Month selector */}
      <div className="flex items-center justify-center gap-3 py-2 w-full">
        <button
          onClick={() => changeMonth(-1)}
          className="text-[#B89EB8] hover:text-[#7D4C7D] transition-colors p-1 cursor-pointer"
          aria-label="이전 달"
          title="이전 달"
        >
          <ChevronLeft className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        <span className="bg-[#7D4C7D] text-white text-xs sm:text-[13px] font-sans font-medium px-5 py-1 rounded-full shadow-xs tracking-wider">
          {year}년 {month}월
        </span>

        <button
          onClick={() => changeMonth(1)}
          className="text-[#B89EB8] hover:text-[#7D4C7D] transition-colors p-1 cursor-pointer"
          aria-label="다음 달"
          title="다음 달"
        >
          <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>

      {/* Monthly calendar: dates flow left to right, then top to bottom */}
      <div className="w-full flex-1 flex flex-col items-center justify-start pt-2 pb-24">
        <div className="w-full max-w-[420px]">
          <div className="grid grid-cols-7 place-items-center mb-1 text-[10px] font-sans text-[#A892B1]">
            {['일', '월', '화', '수', '목', '금', '토'].map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-x-1 sm:gap-x-1.5 gap-y-1 sm:gap-y-1.5 place-items-center w-full mx-auto">
            {calendarCells.map((dayNum, index) => {
              if (dayNum === null) return <div key={`empty-${index}`} className="w-9 h-9 sm:w-10 sm:h-10" />;
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const diary = diaryByDate.get(dateStr);
              const hasDiary = Boolean(diary);
              const isSelected = activeDate === dateStr;

              if (hasDiary && diary) {
                return (
                  <div
                    key={dateStr}
                    onClick={() => onSelectDiary(diary)}
                    onMouseEnter={() => setActiveDate(dateStr)}
                    className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 cursor-pointer group"
                    title={`${dateStr}: ${diary.originalTitle || '고양이 일기'}`}
                  >
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

              const jitter = getDotJitter(dayNum, month);
              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => onNewDiary(dateStr)}
                  onMouseEnter={() => setActiveDate(dateStr)}
                  className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 group cursor-pointer"
                  title={`${dateStr} 일기 쓰기`}
                >
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
          </div>
        </div>
      </div>

      {/* Floating Bottom Navigation Dock matching main_419c9fa7.png */}
      <PawtyNavDock
        activeTab="home"
        onGoHome={() => {}}
        onGoDiary={() => {
          const now = new Date();
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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
