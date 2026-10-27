import React from 'react';
import { ChevronLeft, Sparkles, X } from 'lucide-react';
import { DiaryEntry } from '../types/diary';

interface ExpressionPolishProps {
  diary: DiaryEntry;
  onBack: () => void;
  onClose: () => void;
  onSavePolished: (diary: DiaryEntry) => void;
  onSaveOriginal: (diary: DiaryEntry) => void;
}

export const ExpressionPolish: React.FC<ExpressionPolishProps> = ({
  diary,
  onBack,
  onClose,
  onSavePolished,
  onSaveOriginal,
}) => {
  const result = diary.correctionResult;
  const breakdowns = (result?.sentenceBreakdowns || []).filter(
    (b) =>
      b.original &&
      b.corrected &&
      b.original.trim().toLowerCase().replace(/[.,!?;:'"“”’]/g, '') !==
        b.corrected.trim().toLowerCase().replace(/[.,!?;:'"“”’]/g, '')
  );

  return (
    <div className="relative min-h-screen bg-[#FAF9FB] flex flex-col justify-between max-w-md mx-auto select-none px-6 py-4 w-full">
      {/* Top Header matching AI_FEEDBACK_a04df8ed.png */}
      <div className="flex items-center justify-between pt-2 pb-6 w-full">
        <button
          onClick={onBack}
          aria-label="뒤로가기"
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#1F1735] hover:bg-purple-50 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2]" />
        </button>

        <div className="flex items-center gap-1.5 text-base font-semibold text-[#1F1735]">
          <Sparkles className="w-4 h-4 text-[#7D4C7D] stroke-[2]" />
          <span>AI feedback</span>
        </div>

        <button
          onClick={onClose}
          aria-label="닫기"
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#1F1735] hover:bg-purple-50 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5 stroke-[2]" />
        </button>
      </div>

      {/* Cards List matching AI_FEEDBACK_a04df8ed.png */}
      <div className="flex-1 space-y-6 pt-2 pb-6 w-full flex flex-col justify-center overflow-y-auto">
        {breakdowns.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-purple-100/80 shadow-xs flex flex-col items-center justify-center text-center gap-3.5 my-auto animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-[#F6EFF7] flex items-center justify-center text-2xl shadow-inner">
              🐾
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-[#7D4C7D]">
                수정할 게 없습니다~ 🎉
              </h3>
              <p className="text-xs text-[#5D5569] leading-relaxed max-w-xs">
                문법과 어휘가 이미 아주 자연스럽고 완벽해요!<br />
                원어민처럼 훌륭하게 작성된 일기입니다.
              </p>
            </div>
          </div>
        ) : (
          breakdowns.map((item, idx) => (
            <div key={idx} className="space-y-3">
              {/* ME row */}
              <div className="flex items-center gap-2.5">
                <span className="bg-[#7D4C7D] text-white text-[11px] font-sans-clean font-bold px-2.5 py-0.5 rounded-full shrink-0">
                  ME
                </span>
                <span className="text-[15px] font-sans-clean text-[#7D4C7D]">
                  {item.original}
                </span>
              </div>

              {/* AI row */}
              <div className="flex items-center gap-2.5">
                <span className="bg-[#FF3B30] text-white text-[11px] font-sans-clean font-bold px-2.5 py-0.5 rounded-full shrink-0">
                  AI
                </span>
                <span className="text-[15px] font-sans-clean text-[#FF3B30] font-medium">
                  {item.corrected}
                </span>
              </div>

              {/* Subtle Divider Line */}
              <div className="border-b border-[#EFE8F2] pt-1" />

              {/* Korean Explanation */}
              <p className="text-[13px] font-sans-clean text-[#2C2420] leading-relaxed pt-1">
                {item.koreanExplanation}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Bottom Action Button matching AI_FEEDBACK_a04df8ed.png */}
      <div className="pt-4 pb-6 w-full">
        <button
          onClick={() => (breakdowns.length === 0 ? onSaveOriginal(diary) : onSavePolished(diary))}
          className="w-full py-4 px-6 rounded-2xl bg-[#7D4C7D] hover:bg-[#6C3E6C] text-white font-sans-clean font-medium text-sm transition-all shadow-md shadow-purple-900/15 active:scale-98 cursor-pointer text-center"
        >
          {breakdowns.length === 0 ? '이대로 일기 저장하기' : '이 표현으로 수정하기'}
        </button>
      </div>
    </div>
  );
};
