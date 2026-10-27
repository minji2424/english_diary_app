import React, { useState } from 'react';
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  AlertTriangle, 
  Bookmark, 
  BookmarkCheck, 
  ArrowRight, 
  Award, 
  BookOpen, 
  RotateCcw,
  Edit3
} from 'lucide-react';
import { CorrectionResult, SavedExpression, DiaryEntry } from '../types/diary';
import { SpeechService } from '../utils/speech';
import { GardenIcon } from './GardenIcons';

interface CorrectionViewProps {
  diary: DiaryEntry;
  onSaveExpression: (exp: { expression: string; meaning: string; example: string; category: string }) => void;
  savedExpressions: SavedExpression[];
  onApplyStyle: (styleKey: 'standard' | 'casual' | 'sophisticated' | 'concise', text: string) => void;
  onEditDiary: () => void;
}

export const CorrectionView: React.FC<CorrectionViewProps> = ({
  diary,
  onSaveExpression,
  savedExpressions,
  onApplyStyle,
  onEditDiary,
}) => {
  const correction = diary.correctionResult;
  const [selectedStyle, setSelectedStyle] = useState<'standard' | 'casual' | 'sophisticated' | 'concise'>(
    diary.preferredStyle || 'standard'
  );
  const [copied, setCopied] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [playingSentenceIndex, setPlayingSentenceIndex] = useState<number | null>(null);
  const [audioSpeed, setAudioSpeed] = useState<number>(0.95);

  if (!correction) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-[#DED7EC] text-center font-mono-typewriter">
        <p className="text-[#2A1DBE]">아직 교정 분석 결과가 없습니다.</p>
        <button
          onClick={onEditDiary}
          className="mt-4 px-4 py-2 bg-[#2A1DBE] text-white rounded-full text-xs"
        >
          일기 작성으로 이동
        </button>
      </div>
    );
  }

  const getCurrentStyleText = (): string => {
    switch (selectedStyle) {
      case 'casual':
        return correction.styleVariations.casual;
      case 'sophisticated':
        return correction.styleVariations.sophisticated;
      case 'concise':
        return correction.styleVariations.concise;
      case 'standard':
      default:
        return correction.correctedFullText;
    }
  };

  const currentText = getCurrentStyleText();

  const handlePlayFullAudio = () => {
    if (isPlayingAudio) {
      SpeechService.stop();
      setIsPlayingAudio(false);
      return;
    }

    setIsPlayingAudio(true);
    setPlayingSentenceIndex(null);
    SpeechService.speak(currentText, {
      rate: audioSpeed,
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
  };

  const handlePlaySentenceAudio = (text: string, index: number) => {
    if (isPlayingAudio && playingSentenceIndex === index) {
      SpeechService.stop();
      setIsPlayingAudio(false);
      setPlayingSentenceIndex(null);
      return;
    }

    setIsPlayingAudio(true);
    setPlayingSentenceIndex(index);
    SpeechService.speak(text, {
      rate: audioSpeed,
      onEnd: () => {
        setIsPlayingAudio(false);
        setPlayingSentenceIndex(null);
      },
      onError: () => {
        setIsPlayingAudio(false);
        setPlayingSentenceIndex(null);
      },
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isExpressionSaved = (exprText: string): boolean => {
    return savedExpressions.some(
      (e) => e.expression.toLowerCase() === exprText.toLowerCase()
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 font-mono-typewriter">
      {/* 1. Pinterest Header Card with Photo & Monoline Stamp */}
      <div className="dot-grid rounded-3xl border border-[#DED7EC] p-5 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="bg-[#2A1DBE] text-white px-3 py-1 rounded-full text-xs font-bold">
              {diary.date}
            </span>
            <div className="p-1 bg-[#EBE5FA] rounded-lg">
              <GardenIcon name={diary.stamp || 'flower'} color="#2A1DBE" className="w-5 h-5" />
            </div>
          </div>

          <span className="text-xs bg-[#EBE5FA] text-[#2A1DBE] px-3 py-1 rounded-full font-bold border border-[#2A1DBE]/20">
            {correction.overallFeedback.cefrLevel}
          </span>
        </div>

        {/* Photo if present */}
        {diary.photoUrl && (
          <div className="mb-4 overflow-hidden rounded-2xl border-2 border-white shadow-xs max-h-60 sm:max-h-72">
            <img src={diary.photoUrl} alt="Memory" className="w-full h-full object-cover" />
          </div>
        )}

        <h2 className="text-lg sm:text-xl font-bold text-[#2A1DBE] mb-2">
          "{correction.naturalTitle || diary.originalTitle || 'Memory'}"
        </h2>

        {/* Scores Pills */}
        <div className="grid grid-cols-3 gap-2 my-4">
          <div className="bg-white/80 p-2.5 rounded-xl border border-[#E3DCFA] text-center">
            <p className="text-[10px] text-stone-500">문법 정확도</p>
            <p className="text-base font-bold text-[#2A1DBE]">
              {correction.overallFeedback.scores.grammar}점
            </p>
          </div>
          <div className="bg-white/80 p-2.5 rounded-xl border border-[#E3DCFA] text-center">
            <p className="text-[10px] text-stone-500">원어민 자연스러움</p>
            <p className="text-base font-bold text-[#2A1DBE]">
              {correction.overallFeedback.scores.naturalness}점
            </p>
          </div>
          <div className="bg-white/80 p-2.5 rounded-xl border border-[#E3DCFA] text-center">
            <p className="text-[10px] text-stone-500">어휘 풍부도</p>
            <p className="text-base font-bold text-[#2A1DBE]">
              {correction.overallFeedback.scores.vocabulary}점
            </p>
          </div>
        </div>

        {/* Editorial Summary */}
        <div className="p-3.5 bg-white/90 rounded-2xl border border-[#E3DCFA] text-xs text-stone-700 font-sans-clean leading-relaxed">
          <p className="font-bold text-[#2A1DBE] mb-1 font-mono-typewriter">
            💌 원어민 멘토 총평
          </p>
          {correction.overallFeedback.summary}
        </div>
      </div>

      {/* 2. Style Variations & Full Native Text */}
      <div className="bg-white rounded-3xl border border-[#DED7EC] p-5 sm:p-6 shadow-xs">
        {/* Style selector pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-[#2A1DBE]/10">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => {
                setSelectedStyle('standard');
                onApplyStyle('standard', correction.correctedFullText);
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                selectedStyle === 'standard'
                  ? 'bg-[#2A1DBE] text-white shadow-2xs'
                  : 'bg-[#F2EDFD] text-[#2A1DBE] hover:bg-[#E7DFFB]'
              }`}
            >
              standard
            </button>
            <button
              onClick={() => {
                setSelectedStyle('casual');
                onApplyStyle('casual', correction.styleVariations.casual);
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                selectedStyle === 'casual'
                  ? 'bg-[#2A1DBE] text-white shadow-2xs'
                  : 'bg-[#F2EDFD] text-[#2A1DBE] hover:bg-[#E7DFFB]'
              }`}
            >
              casual ☕
            </button>
            <button
              onClick={() => {
                setSelectedStyle('sophisticated');
                onApplyStyle('sophisticated', correction.styleVariations.sophisticated);
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                selectedStyle === 'sophisticated'
                  ? 'bg-[#2A1DBE] text-white shadow-2xs'
                  : 'bg-[#F2EDFD] text-[#2A1DBE] hover:bg-[#E7DFFB]'
              }`}
            >
              poetic 🖋️
            </button>
            <button
              onClick={() => {
                setSelectedStyle('concise');
                onApplyStyle('concise', correction.styleVariations.concise);
              }}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                selectedStyle === 'concise'
                  ? 'bg-[#2A1DBE] text-white shadow-2xs'
                  : 'bg-[#F2EDFD] text-[#2A1DBE] hover:bg-[#E7DFFB]'
              }`}
            >
              concise ⚡
            </button>
          </div>

          {/* Audio and Copy actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePlayFullAudio}
              className={`p-2 rounded-xl text-xs flex items-center gap-1 transition-all ${
                isPlayingAudio && playingSentenceIndex === null
                  ? 'bg-[#2A1DBE] text-white animate-pulse'
                  : 'bg-[#F2EDFD] text-[#2A1DBE] hover:bg-[#E7DFFB]'
              }`}
              title="원어민 발음 듣기"
            >
              {isPlayingAudio && playingSentenceIndex === null ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={handleCopy}
              className="p-2 bg-[#F2EDFD] hover:bg-[#E7DFFB] text-[#2A1DBE] rounded-xl text-xs transition-colors"
              title="전체 복사"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* The Native Text */}
        <div className="p-4 bg-[#FAF7FA] rounded-2xl border border-[#EBE5FA]">
          <p className="text-base sm:text-lg text-[#1D1268] leading-relaxed whitespace-pre-line select-text">
            {currentText}
          </p>
        </div>
      </div>

      {/* 3. Sentence Breakdowns */}
      <div className="space-y-3.5">
        <h3 className="text-sm font-bold text-[#2A1DBE] flex items-center gap-1.5">
          <BookOpen className="w-4 h-4" />
          <span>sentence breakdown ({correction.sentenceBreakdowns.length})</span>
        </h3>

        {correction.sentenceBreakdowns.map((sb, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-[#DED7EC] p-4 sm:p-5 space-y-2.5 shadow-2xs"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#2A1DBE]">0{idx + 1}.</span>
              <button
                onClick={() => handlePlaySentenceAudio(sb.corrected, idx)}
                className="text-[#2A1DBE] hover:underline flex items-center gap-1 text-[11px]"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>listen</span>
              </button>
            </div>

            {/* Original vs Native */}
            <div className="space-y-1.5 text-xs sm:text-sm">
              <p className="text-stone-400 line-through decoration-stone-300">
                {sb.original}
              </p>
              <p className="text-[#2A1DBE] font-bold">
                {sb.corrected}
              </p>
            </div>

            {/* Konglish Alert if exists */}
            {sb.konglishAlert && sb.konglishAlert.trim().length > 0 && (
              <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-xl text-xs text-rose-950 font-sans-clean flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="font-bold">콩글리시 탈출 팁: </strong>
                  {sb.konglishAlert}
                </span>
              </div>
            )}

            {/* Explanation in Korean */}
            <div className="p-3 bg-[#FAF7FA] rounded-xl border border-[#EBE5FA] text-xs text-stone-700 font-sans-clean leading-relaxed">
              💡 {sb.koreanExplanation}
            </div>

            {/* Word swap & Idiom bookmark */}
            {sb.keyIdiom && sb.keyIdiom.trim().length > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-[#2A1DBE]/10 text-xs">
                <span className="text-[#2A1DBE] font-bold">
                  {sb.keyIdiom} {sb.keyIdiomMeaning && `(${sb.keyIdiomMeaning})`}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onSaveExpression({
                      expression: sb.keyIdiom || '',
                      meaning: sb.keyIdiomMeaning || '',
                      example: sb.corrected,
                      category: '핵심 표현',
                    })
                  }
                  className="text-[11px] text-[#2A1DBE] font-bold hover:underline flex items-center gap-1"
                >
                  <Bookmark className="w-3 h-3" />
                  <span>단어장에 저장</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 4. Recommended Expressions Vault */}
      {correction.recommendedExpressions && correction.recommendedExpressions.length > 0 && (
        <div className="bg-[#FAF7FA] p-5 rounded-3xl border border-[#DED7EC] space-y-3">
          <h4 className="text-sm font-bold text-[#2A1DBE] flex items-center gap-1.5">
            <BookmarkCheck className="w-4 h-4" />
            <span>오늘 일기의 알짜배기 표현</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {correction.recommendedExpressions.map((exp, idx) => {
              const saved = isExpressionSaved(exp.expression);
              return (
                <div
                  key={idx}
                  className="bg-white p-3.5 rounded-2xl border border-[#E4DEF2] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] bg-[#EBE5FA] text-[#2A1DBE] px-2 py-0.5 rounded-full font-bold">
                        {exp.category}
                      </span>
                      <button
                        onClick={() => onSaveExpression(exp)}
                        className="text-[#2A1DBE] hover:opacity-70 text-xs"
                      >
                        {saved ? (
                          <BookmarkCheck className="w-3.5 h-3.5" />
                        ) : (
                          <Bookmark className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <h5 className="font-bold text-sm text-[#2A1DBE]">{exp.expression}</h5>
                    <p className="text-xs text-stone-600 font-sans-clean mt-0.5">{exp.meaning}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom actions */}
      <div className="flex items-center justify-between pt-4">
        <button
          onClick={onEditDiary}
          className="text-xs text-[#2A1DBE] hover:underline flex items-center gap-1"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>다시 수정하기</span>
        </button>

        <button
          onClick={handleCopy}
          className="bg-[#2A1DBE] text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-xs hover:bg-[#1E11A8]"
        >
          교정본 복사하기 ✨
        </button>
      </div>
    </div>
  );
};
