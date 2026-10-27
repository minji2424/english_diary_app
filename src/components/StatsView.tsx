import React from 'react';
import { 
  Flame, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  Smile
} from 'lucide-react';
import { DiaryEntry, SavedExpression, MoodType } from '../types/diary';
import { GardenIcon } from './GardenIcons';

interface StatsViewProps {
  diaries: DiaryEntry[];
  expressions: SavedExpression[];
  streak: number;
  onNewDiary: () => void;
}

const MOOD_EMOJIS: Record<MoodType, string> = {
  happy: '😊 행복/뿌듯',
  peaceful: '😌 평온/여유',
  productive: '☕ 생산적/열공',
  grateful: '🌸 감사/따뜻',
  excited: '🎉 신남/기대',
  tired: '🥱 지침/피곤',
  thoughtful: '🤔 고민/사색',
  melancholy: '🥺 울적/센치',
};

export const StatsView: React.FC<StatsViewProps> = ({
  diaries,
  expressions,
  streak,
  onNewDiary,
}) => {
  const totalWords = diaries.reduce((acc, d) => acc + (d.wordCount || 0), 0);
  const correctedCount = diaries.filter((d) => d.correctionResult).length;
  const masteredCount = expressions.filter((e) => e.mastered).length;

  const correctedDiaries = diaries.filter((d) => d.correctionResult);
  const avgGrammar =
    correctedDiaries.length > 0
      ? Math.round(
          correctedDiaries.reduce(
            (acc, d) => acc + (d.correctionResult?.overallFeedback.scores.grammar || 0),
            0
          ) / correctedDiaries.length
        )
      : 85;

  const avgNaturalness =
    correctedDiaries.length > 0
      ? Math.round(
          correctedDiaries.reduce(
            (acc, d) => acc + (d.correctionResult?.overallFeedback.scores.naturalness || 0),
            0
          ) / correctedDiaries.length
        )
      : 80;

  const avgVocabulary =
    correctedDiaries.length > 0
      ? Math.round(
          correctedDiaries.reduce(
            (acc, d) => acc + (d.correctionResult?.overallFeedback.scores.vocabulary || 0),
            0
          ) / correctedDiaries.length
        )
      : 82;

  const moodCounts: Record<string, number> = {};
  diaries.forEach((d) => {
    moodCounts[d.mood] = (moodCounts[d.mood] || 0) + 1;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 font-mono-typewriter">
      {/* Hero Banner */}
      <div className="dot-grid rounded-3xl border border-[#DED7EC] p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2A1DBE]/10 pb-5">
          <div>
            <span className="text-[10px] font-bold text-[#2A1DBE] bg-[#EBE5FA] px-3 py-1 rounded-full">
              (each memory grows your garden)
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#2A1DBE] mt-2">
              기억 정원 성장 리포트 🌿
            </h2>
            <p className="text-xs text-[#2A1DBE]/70 mt-1">
              매일의 영작 기록이 모여 하나의 아름다운 정원이 됩니다.
            </p>
          </div>

          <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-2xl border border-[#E3DCFA] shadow-2xs">
            <Flame className="w-6 h-6 text-orange-500 fill-orange-500 animate-pulse" />
            <div>
              <p className="text-[10px] text-stone-400 font-bold">streak</p>
              <p className="text-lg font-bold text-[#2A1DBE]">{streak} days</p>
            </div>
          </div>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
          <div className="bg-white/80 p-3.5 rounded-2xl border border-[#E4DEF2]">
            <p className="text-[10px] text-stone-500">planted memories</p>
            <p className="text-xl font-bold text-[#2A1DBE] mt-0.5">{diaries.length}편</p>
          </div>
          <div className="bg-white/80 p-3.5 rounded-2xl border border-[#E4DEF2]">
            <p className="text-[10px] text-stone-500">words logged</p>
            <p className="text-xl font-bold text-[#2A1DBE] mt-0.5">{totalWords} words</p>
          </div>
          <div className="bg-white/80 p-3.5 rounded-2xl border border-[#E4DEF2]">
            <p className="text-[10px] text-stone-500">native polished</p>
            <p className="text-xl font-bold text-[#2A1DBE] mt-0.5">{correctedCount}편</p>
          </div>
          <div className="bg-white/80 p-3.5 rounded-2xl border border-[#E4DEF2]">
            <p className="text-[10px] text-stone-500">mastered expressions</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">{masteredCount}개</p>
          </div>
        </div>
      </div>

      {/* Average Competency Meters */}
      <div className="bg-white rounded-3xl border border-[#DED7EC] p-6 shadow-xs">
        <h3 className="text-sm font-bold text-[#2A1DBE] mb-1 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4" />
          <span>영작 역량 성장 지표</span>
        </h3>
        <p className="text-xs text-stone-500 font-sans-clean mb-4">
          원어민 AI 에디터가 평가한 최근 작성 일기들의 평균 점수입니다.
        </p>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-stone-700">문법 정확도 (grammar)</span>
              <span className="font-bold text-[#2A1DBE]">{avgGrammar} / 100</span>
            </div>
            <div className="w-full bg-[#EBE5FA] rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#2A1DBE] h-2 rounded-full transition-all duration-700"
                style={{ width: `${avgGrammar}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-stone-700">원어민 자연스러움 (natural flow)</span>
              <span className="font-bold text-[#2A1DBE]">{avgNaturalness} / 100</span>
            </div>
            <div className="w-full bg-[#EBE5FA] rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#6456E2] h-2 rounded-full transition-all duration-700"
                style={{ width: `${avgNaturalness}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-stone-700">어휘 다양성 (vocabulary)</span>
              <span className="font-bold text-[#2A1DBE]">{avgVocabulary} / 100</span>
            </div>
            <div className="w-full bg-[#EBE5FA] rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-500 h-2 rounded-full transition-all duration-700"
                style={{ width: `${avgVocabulary}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mood breakdown */}
      <div className="bg-[#FAF7FA] rounded-3xl border border-[#DED7EC] p-5 shadow-2xs">
        <h4 className="text-xs font-bold text-[#2A1DBE] mb-3 flex items-center gap-1.5">
          <Smile className="w-3.5 h-3.5" />
          <span>기분 기록 분포 (mood frequencies)</span>
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.keys(MOOD_EMOJIS).slice(0, 4).map((mKey) => (
            <div key={mKey} className="bg-white p-2.5 rounded-xl border border-[#EBE5FA] text-center">
              <span className="text-xs font-sans-clean">{MOOD_EMOJIS[mKey as MoodType]}</span>
              <p className="text-xs font-bold text-[#2A1DBE] mt-1">{moodCounts[mKey] || 0}회</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
