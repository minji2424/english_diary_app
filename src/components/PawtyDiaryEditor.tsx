import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Image as ImageIcon, Sparkles, Bookmark, Loader2, X } from 'lucide-react';
import { WeatherType, MoodType, CatId, SentenceBreakdown, CorrectionResult } from '../types/diary';
import { CatDrawingCanvas } from './CatDrawingCanvas';
import { CatIcon } from './CatIcons';

interface PawtyDiaryEditorProps {
  initialTitle?: string;
  initialContent?: string;
  initialDate?: string;
  initialWeather?: WeatherType;
  initialMood?: MoodType;
  initialCatId?: CatId;
  initialCustomDrawingUrl?: string;
  initialPhotoUrl?: string;
  initialPhotoUrls?: string[];
  initialBreakdowns?: SentenceBreakdown[];
  initialCorrectionResult?: CorrectionResult;
  initialMode?: 'original' | 'feedback';
  onBack: () => void;
  onExpressionBookmark?: (breakdown: SentenceBreakdown, shouldSave: boolean) => void;
  onSaveDirect: (data: {
    title: string;
    content: string;
    date: string;
    weather: WeatherType;
    mood: MoodType;
    catId: CatId;
    catName: string;
    catTitle: string;
    customDrawingUrl?: string;
    photoUrl?: string;
    photoUrls?: string[];
    savedBreakdowns?: SentenceBreakdown[];
    correctionResult?: CorrectionResult;
  }) => void;
}

export const PawtyDiaryEditor: React.FC<PawtyDiaryEditorProps> = ({
  initialTitle = '',
  initialContent = '',
  initialDate = (() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  })(),
  initialWeather = 'sunny',
  initialMood = 'peaceful',
  initialCatId = 'momo',
  initialCustomDrawingUrl,
  initialPhotoUrl,
  initialPhotoUrls,
  initialBreakdowns,
  initialCorrectionResult,
  initialMode = 'original',
  onBack,
  onExpressionBookmark,
  onSaveDirect,
}) => {
  const [content, setContent] = useState<string>(initialContent || '');
  const [date] = useState(initialDate);
  const [catId, setCatId] = useState<CatId>(initialCatId || 'momo');
  const [customDrawingUrl, setCustomDrawingUrl] = useState<string | undefined>(initialCustomDrawingUrl);

  // Photos state: multiple photos
  const [photos, setPhotos] = useState<string[]>(() => {
    if (initialPhotoUrls && initialPhotoUrls.length > 0) return initialPhotoUrls.filter(Boolean);
    if (initialPhotoUrl) return [initialPhotoUrl];
    return [];
  });

  // Current view inside editor: 'editor' or 'ai_feedback'
  const [activeSubView, setActiveSubView] = useState<'editor' | 'ai_feedback'>(
    initialMode === 'feedback' ? 'ai_feedback' : 'editor'
  );

  // Feedback breakdowns
  const [breakdowns, setBreakdowns] = useState<SentenceBreakdown[]>(() => {
    if (initialBreakdowns && initialBreakdowns.length > 0) return initialBreakdowns;
    return [];
  });
  const [correctionResult, setCorrectionResult] = useState<CorrectionResult | null>(
    initialCorrectionResult || null
  );

  const [savedBreakdownIndices, setSavedBreakdownIndices] = useState<Set<number>>(new Set<number>());
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState<boolean>(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [showDrawingModal, setShowDrawingModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  useEffect(() => {
    const currentText = content.trim();
    if (!currentText) {
      setBreakdowns([]);
      setCorrectionResult(null);
      setFeedbackError(null);
      setIsGeneratingFeedback(false);
      return;
    }

    if (initialCorrectionResult && currentText === initialContent.trim()) {
      setCorrectionResult(initialCorrectionResult);
      setBreakdowns(initialCorrectionResult.sentenceBreakdowns);
      setIsGeneratingFeedback(false);
      return;
    }

    const controller = new AbortController();
    setFeedbackError(null);
    setBreakdowns([]);
    setCorrectionResult(null);
    setIsGeneratingFeedback(true);
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch('/api/correct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: initialTitle || 'My English Diary',
            content: currentText,
            date,
            weather: initialWeather,
            mood: initialMood,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.details || errorData.error || 'AI 피드백을 불러오지 못했습니다.');
        }

        const data: CorrectionResult = await response.json();
        if (!Array.isArray(data.sentenceBreakdowns)) {
          throw new Error('AI 피드백 응답 형식이 올바르지 않습니다.');
        }

        setCorrectionResult(data);
        setBreakdowns(data.sentenceBreakdowns);
        setSavedBreakdownIndices(new Set<number>());
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Failed to generate live diary feedback', error);
        setFeedbackError(error instanceof Error ? error.message : 'AI 피드백 생성 중 오류가 발생했습니다.');
        setCorrectionResult(null);
        setBreakdowns([]);
      } finally {
        if (!controller.signal.aborted) setIsGeneratingFeedback(false);
      }
    }, 700);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [content, date, initialTitle, initialContent, initialCorrectionResult, initialWeather, initialMood]);

  // Format the selected date as YYYY.MM.DD.
  const formattedDate = React.useMemo(() => {
    if (date.includes('.')) return date;
    const parts = date.split('-');
    if (parts.length === 3) {
      return `${parts[0]}.${parts[1]}.${parts[2]}`;
    }
    return date;
  }, [date]);

  // Handle local image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result === 'string') {
          setPhotos((prev) => [...prev, result]);
          showToast('사진이 추가되었습니다! 📷');
        }
      };
      reader.onerror = () => showToast('사진을 불러오지 못했습니다. 다시 시도해 주세요.');
      reader.readAsDataURL(file);
    });
    e.currentTarget.value = '';
  };

  // Trigger AI Feedback (Sparkle button)
  const handleOpenAIFeedback = async () => {
    const currentText = content.trim();
    if (!currentText) {
      showToast('영어 일기를 먼저 작성해 주세요. 🐾');
      return;
    }

    setActiveSubView('ai_feedback');
  };

  // Toggle bookmark for Expression Vault
  const handleToggleBookmark = (idx: number) => {
    const shouldSave = !savedBreakdownIndices.has(idx);
    const breakdown = breakdowns[idx];
    setSavedBreakdownIndices((prev) => {
      const next = new Set(prev);
      if (shouldSave) next.add(idx);
      else next.delete(idx);
      return next;
    });
    onExpressionBookmark?.(breakdown, shouldSave);
    showToast(shouldSave ? '표현 사전에 저장되었습니다! 🔖' : '표현 사전 저장이 취소되었습니다.');
  };

  // "Modify using this" button handler matching AI_FEEDBACK_676a2998.png
  const handleApplyPolishedText = () => {
    let updatedContent = content;
    breakdowns.forEach((item) => {
      if (item.original && item.corrected && updatedContent.includes(item.original)) {
        updatedContent = updatedContent.replace(item.original, item.corrected);
      }
    });

    setContent(updatedContent);
    setActiveSubView('editor');
    showToast('원어민 표현이 일기에 적용되었습니다! ✨');
  };

  // Complete & Save Diary into Calendar (DONE button)
  const handleFinalSave = () => {
    const textToSave = content.trim();
    if (!textToSave) {
      showToast('일기 내용을 입력해 주세요. 🐾');
      return;
    }

    const primaryPhoto = photos.length > 0 ? photos[0] : undefined;
    const allPhotos = photos.length > 0 ? photos : undefined;
    const standardDate = date.replace(/\./g, '-');

    // Only save expressions that user explicitly bookmarked into vault
    const userSavedBreakdowns = breakdowns.filter((_, idx) => savedBreakdownIndices.has(idx));

    onSaveDirect({
      title: initialTitle || (textToSave.slice(0, 24) + '...'),
      content: textToSave,
      date: standardDate,
      weather: initialWeather,
      mood: initialMood,
      catId,
      catName: '모모',
      catTitle: '나만의 고양이',
      customDrawingUrl,
      photoUrl: primaryPhoto,
      photoUrls: allPhotos,
      savedBreakdowns: userSavedBreakdowns,
      correctionResult: correctionResult || undefined,
    });
  };

  const hasWrittenText = content.trim().length > 0;

  // View 2: AI FEEDBACK matching AI_FEEDBACK_676a2998.png
  if (activeSubView === 'ai_feedback') {
    return (
      <div className="relative min-h-screen bg-[#FAF9FB] flex flex-col justify-between max-w-sm sm:max-w-md mx-auto select-none px-6 py-4 w-full">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#7D4C7D] text-white px-5 py-2.5 rounded-full text-xs font-sans shadow-lg animate-fadeIn flex items-center gap-1.5 border border-purple-200/40">
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Top Header matching AI_FEEDBACK_676a2998.png */}
        <div className="relative flex items-center justify-center pt-2 pb-5 w-full">
          <button
            type="button"
            onClick={() => setActiveSubView('editor')}
            aria-label="뒤로가기"
            className="absolute left-0 p-1 text-[#1F1735] hover:opacity-75 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2]" />
          </button>

          <div className="flex items-center gap-1.5 text-[17px] font-sans font-bold text-[#1F1735]">
            <span className="text-[18px]">✦</span>
            <span>AI feedback</span>
          </div>
        </div>

        {/* Feedback List matching AI_FEEDBACK_676a2998.png */}
        <div className="flex-1 space-y-7 pt-2 pb-24 overflow-y-auto">
          {isGeneratingFeedback ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-[#7D4C7D]" />
              <p className="text-xs text-[#7D4C7D]">원어민 표현을 분석 중입니다... ✨</p>
            </div>
          ) : feedbackError ? (
            <p className="rounded-2xl bg-rose-50 px-4 py-3 text-xs leading-relaxed text-rose-800">
              {feedbackError}
            </p>
          ) : breakdowns.length === 0 ? (
            <p className="py-16 text-center text-xs text-[#9872A2]">
              문장을 입력하면 AI 피드백이 여기에 표시됩니다.
            </p>
          ) : (
            breakdowns.map((item, idx) => {
              const isBookmarked = savedBreakdownIndices.has(idx);
              return (
                <div key={idx} className="space-y-3">
                  {/* Row 1: ME + Original text + Bookmark on right */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="bg-black text-white text-[10px] font-sans font-bold px-2 py-0.5 rounded-full shrink-0">
                        ME
                      </span>
                      <span className="text-[14px] font-sans text-[#1F1735]">
                        {item.original}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleBookmark(idx)}
                      className="p-1 text-[#5BA8B0] hover:opacity-80 transition-opacity cursor-pointer"
                      title={isBookmarked ? '표현 사전에 저장됨' : '표현 사전에 저장'}
                    >
                      {isBookmarked ? (
                        <Bookmark className="w-4 h-4 fill-[#5BA8B0] stroke-none" />
                      ) : (
                        <Bookmark className="w-4 h-4 stroke-[2]" />
                      )}
                    </button>
                  </div>

                  {/* Row 2: AI + Corrected text */}
                  <div className="flex items-center gap-2.5">
                    <span className="bg-[#FF3B30] text-white text-[10px] font-sans font-bold px-2 py-0.5 rounded-full shrink-0">
                      AI
                    </span>
                    <span className="text-[14px] font-sans text-[#FF3B30] font-medium">
                      {item.corrected}
                    </span>
                  </div>

                  {/* Subtle divider */}
                  <div className="border-b border-[#EFE8F2] pt-1" />

                  {/* Korean Explanation */}
                  <p className="text-[13px] font-sans text-[#333333] leading-relaxed">
                    {item.koreanExplanation}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Button matching AI_FEEDBACK_676a2998.png: "Modify using this" */}
        <div className="fixed bottom-7 left-0 right-0 max-w-sm sm:max-w-md mx-auto px-6 z-40 select-none">
          <button
            type="button"
            onClick={handleApplyPolishedText}
            className="w-full py-4 rounded-2xl bg-[#7D4C7D] hover:bg-[#6E3F6E] active:scale-[0.98] text-white text-center text-[17px] font-mongtori font-bold shadow-md transition-all cursor-pointer"
          >
            Modify using this
          </button>
        </div>
      </div>
    );
  }

  // View 1: WRITING SCREEN matching write_15b8868f.png & write-1_88245910.png
  return (
    <div className="relative min-h-screen bg-[#FAF9FB] flex flex-col justify-between max-w-sm sm:max-w-md mx-auto select-none px-6 py-4 w-full">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#7D4C7D] text-white px-5 py-2.5 rounded-full text-xs font-sans shadow-lg animate-fadeIn flex items-center gap-1.5 border border-purple-200/40">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* Top Header:
          - Selected date
          - Squircle: Before typing shows single dot; after typing shows cat! */}
      <div className="relative flex flex-col items-center pt-2 pb-3 w-full">
        {/* Back button */}
        <button
          type="button"
          onClick={onBack}
          aria-label="뒤로가기"
          className="absolute left-0 top-3 p-1 text-[#7D4C7D] hover:opacity-80 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2]" />
        </button>

        {/* Selected date */}
        <span className="text-[13px] font-sans font-medium text-[#7D4C7D] mb-2 tracking-wide">
          {formattedDate}
        </span>

        {/* Squircle:
            - Before typing (write_15b8868f.png): dot inside
            - After typing (write-1_88245910.png): cat inside (tapping opens drawing canvas) */}
        <button
          type="button"
          onClick={() => {
            if (hasWrittenText) {
              setShowDrawingModal(true);
            }
          }}
          disabled={!hasWrittenText}
          className={`w-14 h-14 rounded-2xl bg-[#F5EFF6] flex items-center justify-center shadow-xs transition-transform ${
            hasWrittenText ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'
          }`}
          title={hasWrittenText ? '고양이 변경 및 그리기' : '일기 작성 후 고양이를 그릴 수 있어요'}
        >
          {hasWrittenText ? (
            customDrawingUrl ? (
              <img
                src={customDrawingUrl}
                alt="Cat"
                className="w-10 h-10 object-contain drop-shadow-xs"
              />
            ) : (
              <CatIcon name={catId} size={32} />
            )
          ) : (
            /* Single purple dot matching write_15b8868f.png */
            <span className="w-1.5 h-1.5 rounded-full bg-[#7D4C7D]" />
          )}
        </button>
      </div>

      {/* Writing Text Area matching write.png / write-1.png */}
      <div className="flex-1 flex flex-col pt-4 pb-24 w-full overflow-y-auto">
        {photos.length > 0 && (
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            {photos.map((photo, index) => (
              <div
                key={`${index}-${photo.slice(0, 32)}`}
                className="relative w-[calc(50%-0.375rem)] max-w-[220px] overflow-hidden rounded-2xl shadow-sm animate-photo-in"
              >
                <img
                  src={photo}
                  alt={`첨부 사진 ${index + 1}`}
                  className="w-full aspect-[4/3] object-cover"
                />
                <button
                  type="button"
                  onClick={() => setPhotos((prev) => prev.filter((_, photoIndex) => photoIndex !== index))}
                  aria-label={`사진 ${index + 1} 삭제`}
                  className="absolute right-2 top-2 rounded-full bg-black/55 p-1 text-white hover:bg-black/70"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing"
          className="w-full bg-transparent font-sans text-[15px] sm:text-[16px] leading-relaxed text-[#1F1735] placeholder-[#A89BAA] placeholder-opacity-80 focus:outline-none resize-none border-none p-1 min-h-[220px]"
          autoFocus={!hasWrittenText}
        />
      </div>

      {/* Bottom Toolbar matching write_15b8868f.png & write-1_88245910.png:
          Left: [Photo squircle] [Sparkle squircle]
          Right: [DONE] button */}
      <div className="fixed bottom-7 left-0 right-0 max-w-sm sm:max-w-md mx-auto px-6 flex items-center justify-between z-40 select-none pointer-events-none">
        {/* Left 2 Squircle Buttons */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          {/* 1. Photo upload button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="사진 추가"
            title="사진 추가"
            className="w-12 h-12 rounded-2xl bg-[#E8DDE9] text-[#7D4C7D] flex items-center justify-center cursor-pointer shadow-xs hover:opacity-90 active:scale-95 transition-all"
          >
            <ImageIcon className="w-5 h-5 stroke-[1.8]" />
          </button>

          {/* 2. Sparkle AI button */}
          <button
            type="button"
            onClick={handleOpenAIFeedback}
            aria-label="AI 피드백"
            title="AI 피드백 보기"
            className="w-12 h-12 rounded-2xl bg-[#E8DDE9] text-[#7D4C7D] flex items-center justify-center cursor-pointer shadow-xs hover:opacity-90 active:scale-95 transition-all"
          >
            <Sparkles className="w-5 h-5 stroke-[1.8]" />
          </button>
        </div>

        {/* Right: Purple 'DONE' Button */}
        <div className="pointer-events-auto">
          <button
            type="button"
            onClick={handleFinalSave}
            aria-label="완료"
            title="완료 및 저장"
            className="h-11 px-6 rounded-2xl bg-[#7D4C7D] hover:bg-[#6E3F6E] text-white font-sans font-bold text-xs tracking-wider flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            DONE
          </button>
        </div>
      </div>

      {/* Direct Drawing Modal */}
      {showDrawingModal && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <CatDrawingCanvas
            initialDrawing={customDrawingUrl}
            initialCatId={catId}
            onSaveDrawing={(dataUrl) => {
              setCustomDrawingUrl(dataUrl);
              setShowDrawingModal(false);
              showToast('나만의 고양이가 일기에 적용되었습니다! 🐾');
            }}
            onSelectCatPreset={(cId) => {
              setCatId(cId);
              setCustomDrawingUrl(undefined);
              setShowDrawingModal(false);
              showToast('고양이 캐릭터가 선택되었습니다! 🐾');
            }}
            onClose={() => setShowDrawingModal(false)}
          />
        </div>
      )}
    </div>
  );
};
