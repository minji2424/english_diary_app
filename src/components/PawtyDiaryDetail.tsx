import React, { useState, useRef, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { DiaryEntry } from '../types/diary';
import { CatIcon } from './CatIcons';
import { PawtyNavDock } from './PawtyNavDock';

interface PawtyDiaryDetailProps {
  diary: DiaryEntry;
  allDiaries: DiaryEntry[];
  onBack: () => void;
  onSelectDiary: (diary: DiaryEntry) => void;
  onEdit: (diary: DiaryEntry) => void;
  onPolish: (diary: DiaryEntry) => void;
  onDelete: (id: string) => void;
  onNewDiaryAtDate?: (date: string) => void;
  onOpenVault?: () => void;
}

export const PawtyDiaryDetail: React.FC<PawtyDiaryDetailProps> = ({
  diary,
  allDiaries = [],
  onBack,
  onSelectDiary,
  onEdit,
  onNewDiaryAtDate,
}) => {
  // Current active viewed date (e.g. '2026-10-26')
  const [activeDate, setActiveDate] = useState<string>(diary.date);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Sync activeDate if diary prop changes
  React.useEffect(() => {
    setActiveDate(diary.date);
  }, [diary.date, diary.id]);

  // Lookup entry for the active date
  const diaryForDate = useMemo(() => {
    return allDiaries.find((d) => d.date === activeDate) || (activeDate === diary.date ? diary : null);
  }, [allDiaries, activeDate, diary]);

  React.useEffect(() => {
    setActivePhotoIndex(0);
  }, [activeDate]);

  // Date shifting helper (YYYY-MM-DD +/- delta days)
  const shiftDate = (dateStr: string, dayDelta: number) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      dt.setDate(dt.getDate() + dayDelta);
      const resY = dt.getFullYear();
      const resM = String(dt.getMonth() + 1).padStart(2, '0');
      const resD = String(dt.getDate()).padStart(2, '0');
      return `${resY}-${resM}-${resD}`;
    } catch {
      return dateStr;
    }
  };

  // Label for date: 'Today', 'Yesterday', or formatted day name
  const getDateLabel = (dateStr: string) => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const yesterdayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dt = new Date(y, m - 1, d);
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return `${dayNames[dt.getDay()]}, ${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

  // Show each neighboring day's saved cat, or a dot when no diary exists.
  const siblingCats = useMemo(() => {
    return [-2, -1, 0, 1, 2].map((offset) => {
      const date = shiftDate(activeDate, offset);
      return {
        date,
        diary: allDiaries.find((entry) => entry.date === date) ||
          (date === activeDate ? diaryForDate || undefined : undefined),
      };
    });
  }, [activeDate, allDiaries, diaryForDate]);

  // Photos array
  const photos = useMemo(() => {
    if (!diaryForDate) return [];
    if (diaryForDate.photoUrls && diaryForDate.photoUrls.length > 0) {
      return diaryForDate.photoUrls.filter(Boolean);
    }
    if (diaryForDate.photoUrl) {
      return [diaryForDate.photoUrl];
    }
    return [];
  }, [diaryForDate]);

  const hasPhotos = photos.length > 0;
  const currentPhoto = hasPhotos ? photos[activePhotoIndex % photos.length] : '';
  const nextPhoto = hasPhotos ? photos[(activePhotoIndex + 1) % photos.length] : '';
  const hasMultiplePhotos = photos.length > 1;

  // Horizontal slide gesture to transition between days
  const [slideOffset, setSlideOffset] = useState<number>(0);
  const [isSliding, setIsSliding] = useState<boolean>(false);
  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);

  const handleSlideTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isHorizontalSwipeRef.current = null;
    setIsSliding(true);
  };

  const handleSlideTouchMove = (e: React.TouchEvent) => {
    if (!isSliding) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartXRef.current;
    const diffY = currentY - touchStartYRef.current;

    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
        isHorizontalSwipeRef.current = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    if (isHorizontalSwipeRef.current) {
      setSlideOffset(diffX);
    }
  };

  const handleSlideTouchEnd = () => {
    setIsSliding(false);
    if (isHorizontalSwipeRef.current) {
      if (slideOffset > 50) {
        const prevDay = shiftDate(activeDate, -1);
        setActiveDate(prevDay);
      } else if (slideOffset < -50) {
        const nextDay = shiftDate(activeDate, 1);
        setActiveDate(nextDay);
      }
    }
    setSlideOffset(0);
    isHorizontalSwipeRef.current = null;
  };

  // Pointer drag for desktop mice
  const pointerStartXRef = useRef<number>(0);
  const [isPointerDragging, setIsPointerDragging] = useState<boolean>(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    pointerStartXRef.current = e.clientX;
    setIsPointerDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDragging) return;
    const diffX = e.clientX - pointerStartXRef.current;
    if (Math.abs(diffX) > 8) {
      setSlideOffset(diffX);
    }
  };

  const handlePointerUp = () => {
    if (!isPointerDragging) return;
    setIsPointerDragging(false);
    if (slideOffset > 50) {
      const prevDay = shiftDate(activeDate, -1);
      setActiveDate(prevDay);
    } else if (slideOffset < -50) {
      const nextDay = shiftDate(activeDate, 1);
      setActiveDate(nextDay);
    }
    setSlideOffset(0);
  };

  const paragraphs = diaryForDate
    ? (diaryForDate.correctionResult?.correctedFullText || diaryForDate.originalContent)
        .split('\n\n')
        .filter(Boolean)
    : [];

  return (
    <div className="relative min-h-screen bg-[#FAF9FB] flex flex-col justify-between max-w-sm sm:max-w-md mx-auto select-none px-6 py-4 w-full">
      {/* Top Strip matching before_0c617134.png & before-1_ea6b61e6.png */}
      <div className="flex flex-col items-center pt-2 pb-2 w-full relative z-30">
        <span className="text-[12px] font-sans font-medium text-[#7D4C7D] mb-1.5">
          {getDateLabel(activeDate)}
        </span>

        {/* Horizontal Cat Strip */}
        <div className="flex items-center justify-center gap-5 sm:gap-6 w-full py-1 min-h-[60px]">
          {siblingCats.map((item) => {
            const isCurrent = item.date === activeDate;
            if (isCurrent) {
              return (
                <div
                  key={item.date}
                  className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-[#F5EFF6] flex items-center justify-center shadow-xs p-1 cursor-default shrink-0"
                >
                  {item.diary?.customDrawingUrl ? (
                    <img
                      src={item.diary.customDrawingUrl}
                      alt="Cat"
                      className="w-10 h-10 object-contain drop-shadow-xs"
                    />
                  ) : item.diary ? (
                    <CatIcon name={item.diary.catId || 'momo'} size={32} />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7D4C7D]" />
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.date}
                type="button"
                onClick={() => setActiveDate(item.date)}
                className="w-9 h-9 flex items-center justify-center opacity-75 hover:opacity-100 hover:scale-110 active:scale-95 transition-all cursor-pointer shrink-0"
                title={`${item.date}${item.diary ? ' 일기 보기' : ' 일기 없음'}`}
              >
                {item.diary?.customDrawingUrl ? (
                  <img src={item.diary.customDrawingUrl} alt="Cat" className="w-8 h-8 object-contain" />
                ) : item.diary ? (
                  <CatIcon name={item.diary.catId || 'momo'} size={28} />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7D4C7D]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area: Interactive slide container for dates */}
      <div
        onTouchStart={handleSlideTouchStart}
        onTouchMove={handleSlideTouchMove}
        onTouchEnd={handleSlideTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          transform: `translateX(${slideOffset}px)`,
          transition:
            isSliding || isPointerDragging
              ? 'none'
              : 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s ease',
          opacity: 1 - Math.min(Math.abs(slideOffset) / 400, 0.35),
        }}
        className="flex-1 flex flex-col items-center pt-2 pb-24 w-full relative touch-pan-y cursor-grab active:cursor-grabbing"
      >
        {diaryForDate ? (
          /* Case A: Diary exists for this date matching before_0c617134.png */
          <div
            onClick={() => onEdit(diaryForDate)}
            className="flex flex-col items-center w-full cursor-pointer"
            title="터치하여 일기 수정하기"
          >
            {/* Photo with natural adaptive aspect ratio (NO 1/4 count badge) */}
            {hasPhotos && (
              <div className="relative w-full max-w-[280px] sm:max-w-xs my-4 select-none flex flex-col items-center">
                {hasMultiplePhotos && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePhotoIndex((prev) => (prev + 1) % photos.length);
                    }}
                    className="absolute inset-0 rounded-[26px] overflow-hidden shadow-xs bg-[#FAF4EE] transform rotate-3 translate-x-2 translate-y-1 cursor-pointer z-10"
                  >
                    <img
                      src={nextPhoto}
                      alt="Stacked Memory"
                      className="w-full h-auto max-h-[360px] object-cover opacity-85"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/assets/cat_memory_orange.png';
                      }}
                    />
                  </div>
                )}

                <div
                  onClick={(e) => {
                    if (hasMultiplePhotos && Math.abs(slideOffset) < 10) {
                      e.stopPropagation();
                      setActivePhotoIndex((prev) => (prev + 1) % photos.length);
                    }
                  }}
                  className="relative w-full rounded-[26px] overflow-hidden shadow-sm bg-[#FAF4EE] z-20"
                >
                  <img
                    src={currentPhoto}
                    alt="Cat Memory"
                    className="w-full h-auto max-h-[360px] object-cover select-none pointer-events-none"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/assets/cat_memory_orange.png';
                    }}
                  />
                </div>
              </div>
            )}

            {/* Diary Body matching before_0c617134.png */}
            <div className="w-full max-w-xs sm:max-w-sm text-left space-y-4 pt-4 pb-8 font-sans text-[15px] sm:text-[16px] leading-relaxed text-[#1F1735]">
              {paragraphs.map((p, idx) => (
                <p key={idx} className="whitespace-pre-wrap">
                  {p}
                </p>
              ))}
            </div>
          </div>
        ) : (
          /* Case B: No diary exists for this date matching before-1_ea6b61e6.png */
          <div className="flex-1 flex flex-col items-center justify-center w-full py-8">
            <button
              type="button"
              onClick={() => {
                if (onNewDiaryAtDate) {
                  onNewDiaryAtDate(activeDate);
                }
              }}
              className="w-64 sm:w-72 h-88 sm:h-96 rounded-[24px] bg-[#F4F2F5] hover:bg-[#EFECEF] transition-all shadow-xs flex flex-col items-center justify-center gap-3.5 cursor-pointer active:scale-98"
            >
              {/* Circular purple plus button */}
              <div className="w-8 h-8 rounded-full bg-[#A88BAE] text-white flex items-center justify-center shadow-xs">
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </div>

              {/* Text in muted purple */}
              <div className="text-center font-sans text-[13px] text-[#7D4C7D] font-medium leading-snug">
                Tap to<br />add memory
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Floating Bottom Navigation Dock matching before_0c617134.png & before-1_ea6b61e6.png */}
      <PawtyNavDock
        activeTab="diary"
        onGoHome={onBack}
        onGoDiary={() => {
          if (diaryForDate) {
            onEdit(diaryForDate);
          } else if (onNewDiaryAtDate) {
            onNewDiaryAtDate(activeDate);
          }
        }}
      />
    </div>
  );
};
