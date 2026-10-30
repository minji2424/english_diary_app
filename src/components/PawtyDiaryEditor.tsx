import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Image as ImageIcon, Sparkles, Bookmark, Loader2, X, Lightbulb, Search, Plus, Bot } from 'lucide-react';
import { WeatherType, MoodType, CatId, SentenceBreakdown, CorrectionResult } from '../types/diary';
import { CatDrawingCanvas } from './CatDrawingCanvas';
import { CatIcon } from './CatIcons';
import { readCorrectionResponse } from '../utils/correctionApi';
import { PawtyDiaryTutorModal } from './PawtyDiaryTutorModal';

const WRITING_HINTS = [
  {
    topic: '오늘의 작은 행복',
    question: '오늘 당신을 미소 짓게 한 작은 순간은 무엇이었나요?',
    prompt: 'What was one little thing that made you smile today?',
    starter: 'One little thing that made me smile today was...',
  },
  {
    topic: '기억에 남는 사람',
    question: '오늘 만난 사람과 어떤 이야기를 나눴나요?',
    prompt: 'Who did you spend time with, and what did you talk about?',
    starter: 'I spent time with... and we talked about...',
  },
  {
    topic: '새로운 경험',
    question: '오늘 처음 해봤거나 새롭게 알게 된 것은 무엇인가요?',
    prompt: 'What did you try or learn for the first time today?',
    starter: 'Today, I tried... for the first time, and...',
  },
  {
    topic: '하루를 마무리하며',
    question: '오늘 하루를 돌아봤을 때 가장 고마운 일은 무엇인가요?',
    prompt: 'What is one thing you feel grateful for today?',
    starter: 'Looking back on today, I feel grateful for...',
  },
];

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
  const [feedbackRetryCount, setFeedbackRetryCount] = useState(0);
  const [forceFeedbackRequest, setForceFeedbackRequest] = useState(false);
  const [showDrawingModal, setShowDrawingModal] = useState<boolean>(false);
  const [showChatModal, setShowChatModal] = useState<boolean>(false);
  const [showWritingHints, setShowWritingHints] = useState(false);
  const [helperTab, setHelperTab] = useState<'search' | 'hints'>('search');
  const [expressionQuery, setExpressionQuery] = useState('');
  const [isSearchingExpression, setIsSearchingExpression] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    query: string;
    expressions: {
      english: string;
      koreanMeaning: string;
      tone: string;
      nuanceTip: string;
    }[];
    keyVocabulary?: { word: string; meaning: string }[];
  } | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [bookmarkedSearchIndices, setBookmarkedSearchIndices] = useState<Set<number>>(new Set());
  const [writingHintIndex, setWritingHintIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const clientFeedbackCache = useRef<Map<string, CorrectionResult>>(new Map());

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const executeFeedbackRequest = React.useCallback(async (textToAnalyze: string, bypassCache = false) => {
    const currentText = textToAnalyze.trim();
    if (!currentText) {
      setBreakdowns([]);
      setCorrectionResult(null);
      setIsGeneratingFeedback(false);
      return;
    }

    if (!bypassCache && clientFeedbackCache.current.has(currentText)) {
      const cached = clientFeedbackCache.current.get(currentText)!;
      if (cached && Array.isArray(cached.sentenceBreakdowns) && cached.sentenceBreakdowns.length > 0) {
        setCorrectionResult(cached);
        setBreakdowns(cached.sentenceBreakdowns);
        setFeedbackError(null);
        setIsGeneratingFeedback(false);
        return;
      }
    }

    setFeedbackError(null);
    setIsGeneratingFeedback(true);

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
      });

      const data = await readCorrectionResponse(response);

      if (data && Array.isArray(data.sentenceBreakdowns) && data.sentenceBreakdowns.length > 0) {
        clientFeedbackCache.current.set(currentText, data);
      }

      setCorrectionResult(data);
      setBreakdowns(data.sentenceBreakdowns || []);
      setSavedBreakdownIndices(new Set<number>());
      setFeedbackError(null);
    } catch (error) {
      console.warn('Live diary feedback notice:', error);
      setFeedbackError(error instanceof Error ? error.message : 'AI 피드백 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGeneratingFeedback(false);
      setForceFeedbackRequest(false);
    }
  }, [date, initialTitle, initialWeather, initialMood]);

  useEffect(() => {
    const currentText = content.trim();
    if (!currentText) {
      setBreakdowns([]);
      setCorrectionResult(null);
      setFeedbackError(null);
      setIsGeneratingFeedback(false);
      return;
    }

    // Check client-side memory cache first if valid
    if (!forceFeedbackRequest && clientFeedbackCache.current.has(currentText)) {
      const cached = clientFeedbackCache.current.get(currentText)!;
      if (cached && Array.isArray(cached.sentenceBreakdowns) && cached.sentenceBreakdowns.length > 0) {
        setCorrectionResult(cached);
        setBreakdowns(cached.sentenceBreakdowns);
        setFeedbackError(null);
        setIsGeneratingFeedback(false);
        return;
      }
    }

    if (
      !forceFeedbackRequest &&
      initialCorrectionResult &&
      currentText === initialContent.trim()
    ) {
      setCorrectionResult(initialCorrectionResult);
      setBreakdowns(initialCorrectionResult.sentenceBreakdowns);
      setIsGeneratingFeedback(false);
      return;
    }

    // Don't auto-query in background while typing if text is very short unless explicitly requested
    if (!forceFeedbackRequest && currentText.length < 12) {
      setIsGeneratingFeedback(false);
      return;
    }

    // Gentle debounce while typing
    const delayMs = forceFeedbackRequest ? 0 : 2000;
    const timeoutId = window.setTimeout(() => {
      executeFeedbackRequest(currentText, forceFeedbackRequest);
    }, delayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    content,
    initialContent,
    initialCorrectionResult,
    feedbackRetryCount,
    forceFeedbackRequest,
    executeFeedbackRequest,
  ]);

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
  const handleOpenAIFeedback = () => {
    const currentText = content.trim();
    if (!currentText) {
      showToast('일기를 먼저 작성해 주세요. 🐾');
      return;
    }

    setActiveSubView('ai_feedback');
    if (breakdowns.length === 0 || !clientFeedbackCache.current.has(currentText)) {
      executeFeedbackRequest(currentText, false);
    }
  };

  const handleUseWritingHint = (starter: string) => {
    setContent((currentContent) =>
      currentContent.trim() ? `${currentContent.trimEnd()}\n${starter}` : starter
    );
    setShowWritingHints(false);
  };

  // Search natural English expression for a Korean thought
  const handleSearchExpression = async (queryToSearch?: string) => {
    const q = (queryToSearch ?? expressionQuery).trim();
    if (!q) {
      showToast('검색할 표현을 입력해 주세요.');
      return;
    }
    setExpressionQuery(q);
    setIsSearchingExpression(true);
    setSearchError(null);
    setBookmarkedSearchIndices(new Set());

    try {
      const res = await fetch('/api/expression-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });
      if (!res.ok) {
        throw new Error('표현을 검색하지 못했습니다.');
      }
      const data = await res.json();
      setSearchResult(data);
    } catch (err) {
      console.warn('Expression search error:', err);
      setSearchError('표현을 불러오는 중 문제가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsSearchingExpression(false);
    }
  };

  // Insert expression directly into diary content
  const handleInsertExpression = (englishSentence: string) => {
    setContent((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return englishSentence;
      if (/[.!?]$/.test(trimmed)) {
        return `${trimmed}\n${englishSentence}`;
      }
      return `${trimmed}. ${englishSentence}`;
    });
    showToast('일기에 표현이 추가되었습니다! ✍️');
  };

  // Bookmark searched expression into Vocabulary Vault
  const handleBookmarkSearchedExpression = (idx: number) => {
    if (!searchResult) return;
    const item = searchResult.expressions[idx];
    if (!item) return;

    const isSaved = bookmarkedSearchIndices.has(idx);
    setBookmarkedSearchIndices((prev) => {
      const next = new Set(prev);
      if (isSaved) next.delete(idx);
      else next.add(idx);
      return next;
    });

    const breakdown: SentenceBreakdown = {
      original: item.koreanMeaning,
      corrected: item.english,
      koreanExplanation: item.nuanceTip || item.tone,
      konglishAlert: '',
      betterAlternativeWords: [],
      keyIdiom: item.english,
      keyIdiomMeaning: item.koreanMeaning,
      categoryTag: '표현 검색',
    };

    onExpressionBookmark?.(breakdown, !isSaved);
    showToast(!isSaved ? '표현 사전에 저장되었습니다! 🔖' : '표현 사전 저장이 취소되었습니다.');
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

    // If entire content was replaced or if it still contains Korean characters while full text is ready
    if (
      correctionResult?.correctedFullText &&
      (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(updatedContent) || updatedContent === content)
    ) {
      updatedContent = correctionResult.correctedFullText;
    }

    setContent(updatedContent);
    setActiveSubView('editor');
    showToast('원어민 영어 표현이 일기에 적용되었습니다! ✨');
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
              <Loader2 className="w-7 h-7 animate-spin text-[#7D4C7D]" />
              <p className="text-sm font-semibold text-[#7D4C7D]">포티가 문장과 표현을 분석 중이에요... 🐾</p>
              <p className="text-xs text-[#9A7186]">문법 오류와 한국어 작문을 꼼꼼히 확인하고 있어요</p>
            </div>
          ) : feedbackError ? (
            <div className="rounded-2xl bg-purple-50/70 border border-purple-100 px-4 py-4 text-xs leading-relaxed text-[#7D4C7D]">
              <p>{feedbackError}</p>
              <button
                type="button"
                onClick={() => {
                  setFeedbackError(null);
                  clientFeedbackCache.current.delete(content.trim());
                  executeFeedbackRequest(content.trim(), true);
                }}
                className="mt-3 rounded-xl bg-[#7D4C7D] px-3.5 py-2 font-semibold text-white hover:bg-[#6E3F6E] cursor-pointer"
              >
                다시 시도
              </button>
            </div>
          ) : breakdowns.length === 0 ? (
            content.trim().length > 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-16 h-16 rounded-3xl bg-[#F5EFF6] flex items-center justify-center text-2xl mb-4 text-[#7D4C7D] shadow-xs">
                  ✨
                </div>
                <h4 className="text-[17px] font-sans font-bold text-[#1F1735] mb-2">
                  {/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(content)
                    ? '한국어 일기 분석하기'
                    : 'Spot on! Nothing to correct here'}
                </h4>
                <p className="text-[13px] font-sans text-[#7D4C7D] leading-relaxed max-w-xs">
                  {correctionResult?.overallFeedback?.summary ||
                    (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(content)
                      ? '한국어 일기를 자연스러운 영어 일기 표현으로 바꿔드릴게요!'
                      : '완벽합니다! 교정할 내용이 없어요.')}
                </p>
                <div className="mt-6 p-4 rounded-2xl bg-white border border-[#EFE8F2] w-full text-left">
                  <div className="text-[11px] font-bold text-[#9872A2] mb-1">내 일기</div>
                  <div className="text-[14px] text-[#1F1735] font-sans leading-relaxed">
                    {content}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    clientFeedbackCache.current.delete(content.trim());
                    executeFeedbackRequest(content.trim(), true);
                  }}
                  className="mt-5 px-5 py-2.5 rounded-xl bg-[#7D4C7D] text-white text-xs font-semibold hover:bg-[#6E3F6E] transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  {/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(content)
                    ? '영어로 일기 작문하기 🐾'
                    : '다시 분석하기 🐾'}
                </button>
              </div>
            ) : (
              <p className="py-16 text-center text-xs text-[#9872A2]">
                문장을 입력하면 AI 피드백이 여기에 표시됩니다.
              </p>
            )
          ) : (
            breakdowns.map((item, idx) => {
              const isBookmarked = savedBreakdownIndices.has(idx);
              const isKoreanSentence = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(item.original);
              return (
                <div key={idx} className="space-y-3">
                  {/* Row 1: ME (or 원문) + Original text + Bookmark on right */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="bg-black text-white text-[10px] font-sans font-bold px-2 py-0.5 rounded-full shrink-0">
                        {isKoreanSentence ? '원문 (KR)' : 'ME'}
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
            onClick={breakdowns.length > 0 ? handleApplyPolishedText : () => setActiveSubView('editor')}
            style={{ fontFamily: "'Pretendard', sans-serif" }}
            className="w-full py-4 rounded-2xl bg-[#7D4C7D] hover:bg-[#6E3F6E] active:scale-[0.98] text-white text-center text-[16px] font-pretendard font-semibold shadow-md transition-all cursor-pointer"
          >
            {breakdowns.length > 0
              ? (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(content) ? '영어로 일기 완성하기' : 'Modify using this')
              : 'Keep my writing'}
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

        {showWritingHints && (
          <section className="mb-4 rounded-3xl border border-[#E8DDE9] bg-white p-4 sm:p-5 shadow-xs animate-fadeIn">
            {/* Top Tabs: Expression Search vs Writing Hints */}
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E6F2] mb-3">
              <div className="flex items-center gap-1.5 p-1 bg-[#FAF7FA] rounded-2xl">
                <button
                  type="button"
                  onClick={() => setHelperTab('search')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    helperTab === 'search'
                      ? 'bg-[#7D4C7D] text-white shadow-xs'
                      : 'text-[#6B6070] hover:text-[#7D4C7D]'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>표현 검색</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHelperTab('hints')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    helperTab === 'hints'
                      ? 'bg-[#7D4C7D] text-white shadow-xs'
                      : 'text-[#6B6070] hover:text-[#7D4C7D]'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>영작 힌트</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowWritingHints(false)}
                className="p-1 rounded-full text-[#9A7186] hover:bg-[#FAF7FA] cursor-pointer"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* TAB 1: EXPRESSION SEARCH */}
            {helperTab === 'search' ? (
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-bold text-[#7D4C7D] mb-1.5">
                    한국어로 쓰고 싶은 말을 적으면 원어민 표현으로 찾아드려요
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSearchExpression();
                    }}
                    className="flex items-center gap-2"
                  >
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={expressionQuery}
                        onChange={(e) => setExpressionQuery(e.target.value)}
                        placeholder="예: 오늘 면접봤어, 시간 가는 줄 몰랐어"
                        className="w-full pl-3 pr-3 py-2 rounded-xl bg-[#FAF7FA] border border-[#E8DDE9] text-xs text-[#1F1735] placeholder-[#A89BAA] focus:outline-none focus:border-[#7D4C7D] focus:bg-white transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSearchingExpression}
                      className="px-3.5 py-2 rounded-xl bg-[#7D4C7D] hover:bg-[#6E3F6E] active:scale-95 text-white text-xs font-semibold shadow-xs flex items-center gap-1 cursor-pointer transition-all shrink-0"
                    >
                      {isSearchingExpression ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Search className="w-3.5 h-3.5" />
                      )}
                      <span>검색</span>
                    </button>
                  </form>
                </div>


                {/* Search State / Result Cards */}
                {isSearchingExpression ? (
                  <div className="py-7 flex flex-col items-center justify-center gap-2 text-xs text-[#7D4C7D]">
                    <Loader2 className="w-5 h-5 animate-spin text-[#7D4C7D]" />
                    <span>원어민 일기 표현을 찾는 중... 🐾</span>
                  </div>
                ) : searchError ? (
                  <div className="p-3 rounded-xl bg-purple-50 text-xs text-[#7D4C7D]">
                    {searchError}
                  </div>
                ) : searchResult ? (
                  <div className="space-y-2.5 pt-1 max-h-[300px] overflow-y-auto pr-1">
                    <div className="flex items-center justify-between text-[11px] text-[#9A7186] font-medium">
                      <span>"{searchResult.query}" 추천 영어 표현</span>
                      <span>{searchResult.expressions.length}개 제안</span>
                    </div>

                    {searchResult.expressions.map((expr, idx) => {
                      const isSaved = bookmarkedSearchIndices.has(idx);
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-2xl bg-[#FAF7FA] border border-[#EFE8F2] hover:border-[#D8BFD8] transition-all space-y-2 text-left"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-[#E8DDE9] text-[#7D4C7D] text-[10px] font-bold">
                              {expr.tone}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleBookmarkSearchedExpression(idx)}
                                className="p-1 rounded-lg text-[#5BA8B0] hover:bg-white transition-all cursor-pointer"
                                title={isSaved ? '표현 사전에 저장됨' : '표현 사전에 저장'}
                              >
                                {isSaved ? (
                                  <Bookmark className="w-3.5 h-3.5 fill-[#5BA8B0] stroke-none" />
                                ) : (
                                  <Bookmark className="w-3.5 h-3.5 stroke-[2]" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleInsertExpression(expr.english)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#7D4C7D] hover:bg-[#6E3F6E] active:scale-95 text-white text-[11px] font-semibold transition-all cursor-pointer"
                                title="이 문장을 일기에 바로 삽입"
                              >
                                <Plus className="w-3 h-3" />
                                <span>일기에 추가</span>
                              </button>
                            </div>
                          </div>

                          <p className="text-[13px] font-sans font-semibold text-[#1F1735] leading-snug">
                            {expr.english}
                          </p>
                          <p className="text-[11px] font-sans text-[#6B6070]">
                            {expr.koreanMeaning}
                          </p>
                          {expr.nuanceTip && (
                            <div className="p-2 rounded-xl bg-white border border-[#EFE8F2] text-[11px] text-[#7D4C7D] leading-relaxed">
                              💡 {expr.nuanceTip}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {searchResult.keyVocabulary && searchResult.keyVocabulary.length > 0 && (
                      <div className="p-2.5 rounded-2xl bg-white border border-[#EFE8F2]">
                        <p className="text-[11px] font-bold text-[#7D4C7D] mb-1.5">관련 핵심 어휘 & 구동사</p>
                        <div className="flex flex-wrap gap-1.5">
                          {searchResult.keyVocabulary.map((v, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-lg bg-[#FAF7FA] border border-[#EFE8F2] text-[11px] text-[#1F1735]"
                            >
                              <span className="font-semibold text-[#7D4C7D]">{v.word}</span>: {v.meaning}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="py-2 text-[11px] text-[#9A7186] text-center">
                    궁금한 우리말 표현을 검색해 보세요!
                  </p>
                )}
              </div>
            ) : (
              /* TAB 2: WRITING HINTS */
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#7D4C7D]">
                      {WRITING_HINTS[writingHintIndex].topic}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[#6B6070]">
                      {WRITING_HINTS[writingHintIndex].question}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setWritingHintIndex((index) => (index + 1) % WRITING_HINTS.length)
                    }
                    className="shrink-0 rounded-full bg-[#F5EFF6] px-3 py-1.5 text-xs font-medium text-[#7D4C7D] hover:bg-[#E8DDE9]"
                  >
                    다른 힌트
                  </button>
                </div>
                <p className="mb-3 rounded-xl bg-[#FAF7FA] px-3 py-2 text-xs leading-relaxed text-[#7D4C7D]">
                  {WRITING_HINTS[writingHintIndex].prompt}
                </p>
                <button
                  type="button"
                  onClick={() => handleUseWritingHint(WRITING_HINTS[writingHintIndex].starter)}
                  className="w-full rounded-xl border border-[#E8DDE9] px-3 py-2.5 text-left text-xs leading-relaxed text-[#514454] hover:bg-[#FAF7FA]"
                >
                  <span className="font-semibold text-[#7D4C7D]">문장 시작하기</span>
                  <span className="mt-1 block">{WRITING_HINTS[writingHintIndex].starter}</span>
                </button>
              </div>
            )}
          </section>
        )}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing"
          className="w-full bg-transparent font-sans text-[15px] sm:text-[16px] leading-relaxed text-[#1F1735] placeholder-[#A89BAA] placeholder-opacity-80 focus:outline-none resize-none border-none p-1 min-h-[220px]"
          autoFocus={!hasWrittenText}
        />
      </div>

      {/* Bottom Toolbar:
          Left: [Photo squircle] [Writing hint squircle] [Sparkle squircle]
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

          {/* 2. Expression Search & Writing Hint button */}
          <button
            type="button"
            onClick={() => setShowWritingHints((visible) => !visible)}
            aria-label="표현 검색 및 영작 힌트"
            aria-expanded={showWritingHints}
            title="표현 검색 및 영작 힌트 보기"
            className={`w-12 h-12 rounded-2xl flex items-center justify-center cursor-pointer shadow-xs hover:opacity-90 active:scale-95 transition-all ${
              showWritingHints ? 'bg-[#7D4C7D] text-white' : 'bg-[#E8DDE9] text-[#7D4C7D]'
            }`}
          >
            <Lightbulb className="w-5 h-5 stroke-[1.8]" />
          </button>

          <button
            type="button"
            onClick={handleOpenAIFeedback}
            aria-label="AI 피드백"
            title="AI 피드백 보기"
            className="relative w-12 h-12 rounded-2xl bg-[#E8DDE9] text-[#7D4C7D] flex items-center justify-center cursor-pointer shadow-xs hover:opacity-90 active:scale-95 transition-all"
          >
            {isGeneratingFeedback ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#7D4C7D]" />
            ) : (
              <Sparkles className="w-5 h-5 stroke-[1.8]" />
            )}
            {breakdowns.length > 0 && !isGeneratingFeedback && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF3B30] text-[10px] text-white font-bold flex items-center justify-center animate-fadeIn">
                {breakdowns.length}
              </span>
            )}
          </button>

          {/* 4. AI Diary Tutor Chatbot button */}
          <button
            type="button"
            onClick={() => setShowChatModal(true)}
            aria-label="영어 일기 튜터 챗봇"
            title="Pawty AI 일기 튜터 (일기 작성이 막막할 때 물어보세요!)"
            className="w-12 h-12 rounded-2xl bg-[#E8DDE9] text-[#7D4C7D] hover:bg-[#DBCBDE] flex items-center justify-center cursor-pointer shadow-xs hover:opacity-90 active:scale-95 transition-all"
          >
            <Bot className="w-5 h-5 stroke-[1.8]" />
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
              showToast('나만의 고양이가 일기에 적용되었습니다');
            }}
            onSelectCatPreset={(cId) => {
              setCatId(cId);
              setCustomDrawingUrl(undefined);
              setShowDrawingModal(false);
              showToast('고양이가 선택되었습니다');
            }}
            onClose={() => setShowDrawingModal(false)}
          />
        </div>
      )}

      {/* AI Diary Tutor Chatbot Modal */}
      <PawtyDiaryTutorModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        onInsertIntoDiary={(sentence) => {
          setContent((prev) => (prev.trim() ? `${prev.trim()}\n\n${sentence}` : sentence));
          showToast('문장이 일기에 추가되었습니다 🐾');
        }}
      />
    </div>
  );
};
