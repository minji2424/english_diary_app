import React, { useState, useEffect } from 'react';
import { PawtyHome } from './components/PawtyHome';
import { PawtyDiaryDetail } from './components/PawtyDiaryDetail';
import { PawtyDiaryEditor } from './components/PawtyDiaryEditor';
import { ExpressionPolish } from './components/ExpressionPolish';
import { VocabularyVault } from './components/VocabularyVault';
import { PawtyHistory } from './components/PawtyHistory';
import { SettingsView } from './components/SettingsView';
import { PawtyDiaryTutorModal } from './components/PawtyDiaryTutorModal';
import {
  DiaryEntry,
  SavedExpression,
  WeatherType,
  MoodType,
  CorrectionResult,
  CatId,
  SentenceBreakdown,
} from './types/diary';
import {
  getStoredDiaries,
  saveDiaries,
  getStoredExpressions,
  saveExpressions,
} from './utils/storage';
import { readCorrectionResponse } from './utils/correctionApi';
import { AlertCircle, CheckCircle } from 'lucide-react';

export type AppView =
  | 'home'
  | 'detail'
  | 'write'
  | 'polish'
  | 'vault'
  | 'history'
  | 'settings';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [editorInitialMode, setEditorInitialMode] = useState<'original' | 'feedback'>('original');
  const [currentYearMonth, setCurrentYearMonth] = useState<{ year: number; month: number }>(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() + 1 };
  });
  const [diaries, setDiaries] = useState<DiaryEntry[]>(() => getStoredDiaries());
  const [expressions, setExpressions] = useState<SavedExpression[]>(() => getStoredExpressions());
  const [currentDiary, setCurrentDiary] = useState<DiaryEntry | null>(() => {
    const list = getStoredDiaries();
    const today = new Date();
    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return list.find((d) => d.date === todayString) || (list.length > 0 ? list[0] : null);
  });
  const [isCorrecting, setIsCorrecting] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    saveDiaries(diaries);
  }, [diaries]);

  useEffect(() => {
    saveExpressions(expressions);
  }, [expressions]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Select diary to view in detail
  const handleSelectDiary = (diary: DiaryEntry) => {
    setCurrentDiary(diary);
    setCurrentView('detail');
  };

  // Start new diary writing
  const handleNewDiary = (date?: string) => {
    setEditorInitialMode('original');
    const now = new Date().toISOString();
    const today = new Date();
    const selectedDate = date || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setCurrentDiary({
      id: `pawty-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      date: selectedDate,
      createdAt: now,
      updatedAt: now,
      weather: 'sunny',
      mood: 'peaceful',
      originalTitle: '',
      originalContent: '',
      wordCount: 0,
    });
    setCurrentView('write');
  };

  // Edit an existing diary
  const handleEditDiary = (diary: DiaryEntry) => {
    setCurrentDiary(diary);
    setEditorInitialMode('original');
    setCurrentView('write');
  };

  // Delete diary
  const handleDeleteDiary = (id: string) => {
    const updatedDiaries = diaries.filter((diary) => diary.id !== id);
    if (updatedDiaries.length === diaries.length) {
      showToast('삭제할 일기를 찾지 못했습니다. 새로고침 후 다시 시도해 주세요.');
      return;
    }

    saveDiaries(updatedDiaries);
    setDiaries(updatedDiaries);
    setCurrentDiary((current) => (current?.id === id ? null : current));
    showToast('일기가 삭제되었습니다.');
    setCurrentView('home');
  };

  // Request AI expression polish via backend /api/correct
  const handleRequestPolish = async (data: {
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
  }) => {
    setIsCorrecting(true);
    setErrorMessage(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    try {
      const response = await fetch('/api/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          date: data.date,
          weather: data.weather,
          mood: data.mood,
          stamp: data.catId,
          photoUrl: data.photoUrl,
        }),
        signal: controller.signal,
      });

      const result = await readCorrectionResponse(response);
      const wordCount = data.content.trim() ? data.content.trim().split(/\s+/).length : 0;
      const now = new Date().toISOString();

      let targetDiary: DiaryEntry;

      const isExistingDiary = currentDiary && diaries.some((diary) => diary.id === currentDiary.id);
      if (isExistingDiary) {
        targetDiary = {
          ...currentDiary,
          originalTitle: data.title,
          originalContent: data.content,
          date: data.date,
          weather: data.weather,
          mood: data.mood,
          catId: data.catId,
          catName: data.catName,
          catTitle: data.catTitle,
          customDrawingUrl: data.customDrawingUrl,
          photoUrl: data.photoUrl,
          photoUrls: data.photoUrls,
          wordCount,
          correctionResult: result,
          updatedAt: now,
        };
        setDiaries((prev) => prev.map((d) => (d.id === targetDiary.id ? targetDiary : d)));
      } else {
        targetDiary = {
          id: 'pawty-' + Date.now(),
          originalTitle: data.title,
          originalContent: data.content,
          date: data.date,
          weather: data.weather,
          mood: data.mood,
          catId: data.catId,
          catName: data.catName,
          catTitle: data.catTitle,
          customDrawingUrl: data.customDrawingUrl,
          photoUrl: data.photoUrl,
          photoUrls: data.photoUrls,
          wordCount,
          correctionResult: result,
          createdAt: now,
          updatedAt: now,
        };
        setDiaries((prev) => [targetDiary, ...prev]);
      }

      setCurrentDiary(targetDiary);
      setCurrentView('polish');
    } catch (error) {
      console.error('Failed to polish diary:', error);
      setErrorMessage(error instanceof Error ? error.message : 'AI 피드백 생성 중 오류가 발생했습니다.');
    } finally {
      clearTimeout(timeoutId);
      setIsCorrecting(false);
    }
  };

  // Direct save without polish
  const handleSaveDirect = (data: {
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
  }) => {
    const wordCount = data.content.trim() ? data.content.trim().split(/\s+/).length : 0;
    const now = new Date().toISOString();

    const entry: DiaryEntry = {
      id: currentDiary?.id || `pawty-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      originalTitle: data.title,
      originalContent: data.content,
      date: data.date,
      weather: data.weather,
      mood: data.mood,
      catId: data.catId,
      catName: data.catName,
      catTitle: data.catTitle,
      customDrawingUrl: data.customDrawingUrl,
      photoUrl: data.photoUrl,
      photoUrls: data.photoUrls,
      correctionResult: data.correctionResult,
      wordCount,
      savedWithPolish: Boolean(data.correctionResult),
      createdAt: currentDiary?.createdAt || now,
      updatedAt: now,
    };

    setDiaries((prev) => [entry, ...prev.filter((d) => d.id !== entry.id)]);
    setCurrentDiary(entry);

    // Save expressions if any
    if (data.savedBreakdowns && data.savedBreakdowns.length > 0) {
      setExpressions((prev) => {
        const newItems: SavedExpression[] = [];
        data.savedBreakdowns!.forEach((sb) => {
          if (!prev.some((e) => e.expression.toLowerCase() === sb.corrected.toLowerCase())) {
            newItems.push({
              id: 'exp-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
              expression: sb.corrected,
              meaning: sb.koreanExplanation.split('.')[0] || sb.koreanExplanation,
              example: data.content,
              category: sb.categoryTag || 'AI 추천 표현',
              sourceDiaryId: entry.id,
              savedAt: data.date.replace(/-/g, '.'),
              mastered: true,
            });
          }
        });
        return [...newItems, ...prev];
      });
    }

    // Sync calendar to the saved diary's month
    const [y, m] = data.date.split('-').map(Number);
    if (y && m) {
      setCurrentYearMonth({ year: y, month: m });
    }

    showToast('일기가 달력에 반영되었습니다! 🐾');
    setCurrentView('detail');
  };

  const handleExpressionBookmark = (breakdown: SentenceBreakdown, shouldSave: boolean) => {
    const expression = breakdown.corrected.trim();
    if (!expression) return;

    setExpressions((prev) => {
      if (!shouldSave) {
        return currentDiary?.id
          ? prev.filter((item) => !(
              item.sourceDiaryId === currentDiary.id &&
              item.expression.toLowerCase() === expression.toLowerCase()
            ))
          : prev;
      }

      if (prev.some((item) => item.expression.toLowerCase() === expression.toLowerCase())) {
        return prev;
      }

      return [{
        id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        expression,
        meaning: breakdown.koreanExplanation.split('.')[0] || breakdown.koreanExplanation,
        example: currentDiary?.originalContent || breakdown.original,
        category: breakdown.categoryTag || 'AI 추천 표현',
        sourceDiaryId: currentDiary?.id,
        savedAt: (currentDiary?.date || '').replace(/-/g, '.'),
        mastered: false,
      }, ...prev];
    });
  };

  // User selects "이 표현으로 수정하기" in Screen 4
  const handleSavePolished = (target: DiaryEntry) => {
    const polishedText = target.correctionResult?.correctedFullText || target.originalContent;
    const updated: DiaryEntry = {
      ...target,
      originalContent: polishedText,
      savedWithPolish: true,
      updatedAt: new Date().toISOString(),
    };
    setCurrentDiary(updated);
    setDiaries((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));

    const [y, m] = target.date.split('-').map(Number);
    if (y && m) {
      setCurrentYearMonth({ year: y, month: m });
    }

    showToast('수정된 표현이 반영되었습니다! ✨');
    setCurrentView('detail');
  };

  // Toggle favorite / starred in vocabulary vault
  const handleToggleMastered = (id: string) => {
    setExpressions((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, mastered: !item.mastered } : item
      )
    );
  };

  // Delete expression from vault
  const handleDeleteExpression = (id: string) => {
    setExpressions((prev) => prev.filter((item) => item.id !== id));
    showToast('표현이 삭제되었습니다.');
  };

  // User selects "내 문장 그대로 저장"
  const handleSaveOriginal = (target: DiaryEntry) => {
    const updated: DiaryEntry = {
      ...target,
      savedWithPolish: false,
      updatedAt: new Date().toISOString(),
    };
    setCurrentDiary(updated);
    setDiaries((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));

    const [y, m] = target.date.split('-').map(Number);
    if (y && m) {
      setCurrentYearMonth({ year: y, month: m });
    }

    showToast('새 일기가 저장되었습니다! 🐾');
    setCurrentView('detail');
  };

  // Trigger polish from Detail view floating sparkle button
  const handleDetailPolish = (diary: DiaryEntry) => {
    setCurrentDiary(diary);
    setEditorInitialMode('feedback');
    setCurrentView('write');
  };

  // Reset diaries
  const handleResetData = () => {
    setDiaries([]);
    saveDiaries([]);
    setCurrentDiary(null);
    showToast('모든 일기가 삭제되었습니다.');
    setCurrentView('home');
  };

  return (
    <div className="min-h-screen bg-[#FAF9FB] text-[#1F1735] flex flex-col items-center justify-start">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#7D4C7D] text-white px-5 py-2.5 rounded-full shadow-lg border border-purple-200/30 flex items-center gap-2 text-xs font-sans-clean font-medium animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-white shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full mx-auto p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 flex items-start justify-between gap-3 text-xs animate-fadeIn shadow-lg">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">교정 요청 안내</p>
              <p className="text-rose-800 mt-0.5">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-800 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Responsive Container: Seamless full-bleed layout with NO boundary lines */}
      <div className="w-full max-w-md md:max-w-3xl lg:max-w-4xl xl:max-w-5xl bg-[#FAF9FB] min-h-screen flex flex-col relative mx-auto transition-all">
        {/* Main Monthly Dot Calendar Matrix */}
        {currentView === 'home' && (
          <PawtyHome
            diaries={diaries}
            currentYearMonth={currentYearMonth}
            onYearMonthChange={(y, m) => setCurrentYearMonth({ year: y, month: m })}
            onSelectDiary={handleSelectDiary}
            onNewDiary={handleNewDiary}
            onOpenVault={() => setCurrentView('vault')}
            onOpenChat={() => setIsChatOpen(true)}
            onOpenSettings={() => setCurrentView('settings')}
          />
        )}

        {/* Diary Detail View matching before_e56b2543.png */}
        {currentView === 'detail' && currentDiary && (
          <PawtyDiaryDetail
            diary={currentDiary}
            allDiaries={diaries}
            onBack={() => setCurrentView('home')}
            onSelectDiary={handleSelectDiary}
            onEdit={handleEditDiary}
            onPolish={handleDetailPolish}
            onDelete={handleDeleteDiary}
            onNewDiaryAtDate={handleNewDiary}
            onOpenVault={() => setCurrentView('vault')}
          />
        )}

        {/* Expression Vault / 표현 사전 matching ______________a73d9185.png */}
        {currentView === 'vault' && (
          <VocabularyVault
            expressions={expressions}
            onBack={() => setCurrentView('home')}
            onToggleMastered={handleToggleMastered}
            onDeleteExpression={handleDeleteExpression}
          />
        )}

        {/* Diary Editor matching write_ca4eb862.png */}
        {currentView === 'write' && (
          <PawtyDiaryEditor
            initialTitle={currentDiary?.originalTitle || ''}
            initialContent={currentDiary?.originalContent || ''}
            initialDate={currentDiary?.date}
            initialWeather={currentDiary?.weather}
            initialMood={currentDiary?.mood}
            initialCatId={currentDiary?.catId}
            initialCustomDrawingUrl={currentDiary?.customDrawingUrl}
            initialPhotoUrl={currentDiary?.photoUrl}
            initialPhotoUrls={currentDiary?.photoUrls}
            initialBreakdowns={currentDiary?.correctionResult?.sentenceBreakdowns}
            initialCorrectionResult={currentDiary?.correctionResult}
            initialMode={editorInitialMode}
            onBack={() => setCurrentView(diaries.some((entry) => entry.id === currentDiary?.id) ? 'detail' : 'home')}
            onSaveDirect={handleSaveDirect}
            onExpressionBookmark={handleExpressionBookmark}
          />
        )}

        {/* Expression Polish (Screen 5) */}
        {currentView === 'polish' && currentDiary && (
          <ExpressionPolish
            diary={currentDiary}
            onBack={() => setCurrentView('write')}
            onClose={() => setCurrentView('detail')}
            onSavePolished={handleSavePolished}
            onSaveOriginal={handleSaveOriginal}
          />
        )}

        {/* Diary History & Filter (Screen 7) */}
        {currentView === 'history' && (
          <PawtyHistory
            diaries={diaries}
            onSelectDiary={handleSelectDiary}
            onBack={() => setCurrentView('home')}
            onNewDiary={handleNewDiary}
          />
        )}

        {/* Settings View (Screen 2) */}
        {currentView === 'settings' && (
          <SettingsView
            onBack={() => setCurrentView('home')}
            diaries={diaries}
            onResetData={handleResetData}
          />
        )}
      </div>

      {/* Global AI English Diary Tutor Chatbot Modal */}
      <PawtyDiaryTutorModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onInsertIntoDiary={(sentence) => {
          handleNewDiary();
          showToast('일기 작성 화면으로 이동하여 문장을 작성해 보세요 🐾');
        }}
      />
    </div>
  );
}
