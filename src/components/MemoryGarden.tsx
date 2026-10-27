import React, { useState } from 'react';
import { DiaryEntry } from '../types/diary';
import { GardenIcon, ALL_GARDEN_STAMPS } from './GardenIcons';
import { Sparkles, Calendar, Plus, Eye, Volume2 } from 'lucide-react';
import { SpeechService } from '../utils/speech';

interface MemoryGardenProps {
  diaries: DiaryEntry[];
  onSelectDiary: (diary: DiaryEntry) => void;
  onNewDiary: () => void;
}

export const MemoryGarden: React.FC<MemoryGardenProps> = ({
  diaries,
  onSelectDiary,
  onNewDiary,
}) => {
  const [selectedDiaryId, setSelectedDiaryId] = useState<string | null>(
    diaries.length > 0 ? diaries[0].id : null
  );

  const selectedDiary = diaries.find((d) => d.id === selectedDiaryId) || diaries[0];

  // Helper to format date like 'wednesday, 30.09'
  const formatDatePill = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = days[d.getDay()];
      const dayNum = String(d.getDate()).padStart(2, '0');
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      return `${dayName}, ${dayNum}.${monthNum}`;
    } catch {
      return dateStr;
    }
  };

  // Build garden grid slots
  // We want a rich garden tapestry of stamps!
  const stampSlots = [...diaries].reverse();

  // Floating letters as seen in the uploaded screenshot 2
  const floatingLetters = [
    { char: 'e', top: '25%', left: '15%', rot: '-12deg' },
    { char: 'a', top: '12%', left: '80%', rot: '8deg' },
    { char: 'o', top: '48%', left: '85%', rot: '-6deg' },
    { char: 'y', top: '70%', left: '12%', rot: '15deg' },
  ];

  return (
    <div className="relative min-h-[580px] sm:min-h-[640px] dot-grid rounded-3xl border border-[#DED7EC] p-5 sm:p-8 flex flex-col justify-between overflow-hidden shadow-xs">
      {/* Whimsical scattered typewriter letters (from screenshot 2) */}
      {floatingLetters.map((item, idx) => (
        <span
          key={idx}
          className="absolute select-none pointer-events-none font-mono-typewriter text-xs text-[#2A1DBE]/20 bg-white/70 px-1.5 py-0.5 rounded shadow-2xs border border-[#2A1DBE]/15"
          style={{
            top: item.top,
            left: item.left,
            transform: `rotate(${item.rot})`,
          }}
        >
          {item.char}
        </span>
      ))}

      {/* Top Header & Year Capsule */}
      <div className="text-center z-10 space-y-2">
        <span className="inline-block bg-[#2A1DBE] text-white px-5 py-1 rounded-full text-xs font-mono-typewriter font-bold tracking-widest shadow-2xs">
          2026
        </span>
        <p className="text-xs sm:text-sm text-[#2A1DBE]/80 font-mono-typewriter italic">
          (each memory grows your garden)
        </p>
      </div>

      {/* Garden Tapestry Dot Matrix with Cobalt Doodles */}
      <div className="my-6 z-10">
        <div className="max-w-2xl mx-auto bg-white/60 backdrop-blur-2xs rounded-2xl p-4 sm:p-6 border border-[#E4DEF2]/90 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#2A1DBE] font-mono-typewriter mb-4 pb-2 border-b border-[#2A1DBE]/10">
            <span>나의 기억 정원: {diaries.length}송이 개화</span>
            <button
              onClick={onNewDiary}
              className="flex items-center gap-1 text-[11px] bg-[#EBE5FA] hover:bg-[#DCD5FA] text-[#2A1DBE] px-2.5 py-1 rounded-lg font-bold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>새 기억 심기</span>
            </button>
          </div>

          {/* Doodles Matrix */}
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-3 sm:gap-4 py-2 place-items-center">
            {stampSlots.map((entry, index) => {
              const isSelected = selectedDiary?.id === entry.id;
              const stampName = entry.stamp || ALL_GARDEN_STAMPS[index % ALL_GARDEN_STAMPS.length].id;

              return (
                <button
                  key={entry.id}
                  onClick={() => setSelectedDiaryId(entry.id)}
                  className={`group relative p-2 rounded-xl transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#E3DCFA] ring-2 ring-[#2A1DBE] scale-110 shadow-xs'
                      : 'hover:bg-[#EBE5FA]/70 hover:scale-105'
                  }`}
                  title={`${entry.date}: ${entry.originalTitle || 'Memory'}`}
                >
                  <GardenIcon
                    name={stampName}
                    color="#2A1DBE"
                    className="w-7 h-7 sm:w-8 sm:h-8 transition-transform group-hover:scale-110"
                    strokeWidth={isSelected ? 2 : 1.7}
                  />

                  {/* Little growth dot */}
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#2A1DBE]" />
                </button>
              );
            })}

            {/* Empty invitation slots */}
            {Array.from({ length: Math.max(4, 18 - stampSlots.length) }).map((_, i) => (
              <button
                key={`empty-${i}`}
                onClick={onNewDiary}
                className="w-10 h-10 rounded-xl border border-dashed border-[#2A1DBE]/20 flex items-center justify-center text-[#2A1DBE]/30 hover:text-[#2A1DBE] hover:border-[#2A1DBE]/60 transition-all text-xs"
                title="오늘의 일기를 쓰고 정원에 심기"
              >
                +
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Memory Inspection Card (Bottom Preview as in Screenshot 1) */}
      {selectedDiary && (
        <div className="z-10 max-w-xl mx-auto w-full bg-white rounded-2xl border border-[#DED7EC] p-4 sm:p-5 shadow-xs animate-fadeIn">
          {/* Date pill like in Screenshot 2: 'wednesday, 30.09' */}
          <div className="flex items-center justify-between mb-3">
            <span className="bg-[#2A1DBE] text-white text-xs font-mono-typewriter font-semibold px-3 py-1 rounded-full shadow-2xs">
              {formatDatePill(selectedDiary.date)}
            </span>

            <div className="flex items-center gap-2">
              {selectedDiary.correctionResult && (
                <span className="text-[11px] font-mono-typewriter text-[#2A1DBE] bg-[#EBE5FA] px-2 py-0.5 rounded-full font-bold">
                  native polished
                </span>
              )}
              <button
                onClick={() => onSelectDiary(selectedDiary)}
                className="text-xs font-mono-typewriter text-[#2A1DBE] font-bold flex items-center gap-1 hover:underline"
              >
                <span>상세 보기</span>
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Photo & Text row */}
          <div className="flex items-center gap-4">
            {/* Optional Thumbnail */}
            {selectedDiary.photoUrl ? (
              <img
                src={selectedDiary.photoUrl}
                alt="Memory"
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl border border-[#E3DCFA] shadow-2xs shrink-0"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#F4EFFB] rounded-xl border border-[#E3DCFA] flex items-center justify-center text-[#2A1DBE] shrink-0">
                <GardenIcon
                  name={selectedDiary.stamp || 'flower'}
                  color="#2A1DBE"
                  className="w-8 h-8"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h4 className="font-mono-typewriter text-sm sm:text-base font-bold text-[#1F146E] truncate mb-1">
                {selectedDiary.correctionResult?.naturalTitle || selectedDiary.originalTitle || 'Memory snippet'}
              </h4>
              <p className="font-mono-typewriter text-xs text-[#2A1DBE]/80 line-clamp-2 leading-relaxed">
                {selectedDiary.correctionResult?.correctedFullText || selectedDiary.originalContent}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
