import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Search, 
  Trash2, 
  Eye, 
  Edit3, 
  LayoutGrid, 
  RotateCcw, 
  SlidersHorizontal, 
  X, 
  ChevronDown, 
  ChevronUp, 
  BookOpen 
} from 'lucide-react';
import { DiaryEntry, WeatherType, MoodType } from '../types/diary';
import { GardenIcon } from './GardenIcons';

interface DiaryHistoryProps {
  diaries: DiaryEntry[];
  onSelectDiary: (diary: DiaryEntry) => void;
  onEditDiary: (diary: DiaryEntry) => void;
  onDeleteDiary: (id: string) => void;
  onNewDiary: () => void;
}

const MOOD_OPTIONS: { id: MoodType | 'all'; label: string; emoji: string }[] = [
  { id: 'all', label: '모든 기분', emoji: '✨' },
  { id: 'happy', label: '행복/뿌듯', emoji: '😊' },
  { id: 'peaceful', label: '평온/여유', emoji: '😌' },
  { id: 'productive', label: '생산적/열공', emoji: '☕' },
  { id: 'grateful', label: '감사/따뜻', emoji: '🌸' },
  { id: 'excited', label: '신남/기대', emoji: '🎉' },
  { id: 'tired', label: '지침/피곤', emoji: '🥱' },
  { id: 'thoughtful', label: '고민/사색', emoji: '🤔' },
  { id: 'melancholy', label: '울적/센치', emoji: '🥺' },
];

const WEATHER_OPTIONS: { id: WeatherType | 'all'; label: string; emoji: string }[] = [
  { id: 'all', label: '모든 날씨', emoji: '🌈' },
  { id: 'sunny', label: '맑음', emoji: '☀️' },
  { id: 'cloudy', label: '구름', emoji: '⛅' },
  { id: 'rainy', label: '비', emoji: '🌧️' },
  { id: 'snowy', label: '눈', emoji: '❄️' },
  { id: 'windy', label: '바람', emoji: '💨' },
  { id: 'night', label: '밤', emoji: '🌙' },
];

export const DiaryHistory: React.FC<DiaryHistoryProps> = ({
  diaries,
  onSelectDiary,
  onEditDiary,
  onDeleteDiary,
  onNewDiary,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [selectedWeather, setSelectedWeather] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [datePreset, setDatePreset] = useState<'all' | '7days' | '30days' | 'thisMonth' | 'custom'>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'cards' | 'calendar'>('cards');
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());

  const handleApplyPreset = (preset: 'all' | '7days' | '30days' | 'thisMonth') => {
    setDatePreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === '30days') {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setStartDate(d.toISOString().split('T')[0]);
      setEndDate(todayStr);
    } else if (preset === 'thisMonth') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(todayStr);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedMood('all');
    setSelectedWeather('all');
    setStartDate('');
    setEndDate('');
    setDatePreset('all');
  };

  const hasActiveFilters =
    searchTerm.trim().length > 0 ||
    selectedMood !== 'all' ||
    selectedWeather !== 'all' ||
    startDate !== '' ||
    endDate !== '';

  const filteredDiaries = diaries.filter((d) => {
    const matchesSearch =
      !searchTerm.trim() ||
      d.originalTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.originalContent.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.date.includes(searchTerm) ||
      (d.correctionResult?.naturalTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.correctionResult?.correctedFullText || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMood = selectedMood === 'all' || d.mood === selectedMood;
    const matchesWeather = selectedWeather === 'all' || d.weather === selectedWeather;
    const matchesStartDate = !startDate || d.date >= startDate;
    const matchesEndDate = !endDate || d.date <= endDate;

    return matchesSearch && matchesMood && matchesWeather && matchesStartDate && matchesEndDate;
  });

  const year = currentCalendarMonth.getFullYear();
  const month = currentCalendarMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 font-mono-typewriter">
      {/* Search & Comprehensive Filter Panel */}
      <div className="dot-grid rounded-3xl border border-[#DED7EC] p-5 shadow-xs">
        {/* Top Search bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#2A1DBE]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="search memories..."
              className="w-full pl-10 pr-4 py-2 bg-white/90 border border-[#E4DEF2] rounded-2xl text-xs text-[#2A1DBE] placeholder:text-[#2A1DBE]/30 focus:outline-none focus:border-[#2A1DBE]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-center">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-1 px-3 py-2 rounded-2xl text-xs font-bold transition-all ${
                hasActiveFilters
                  ? 'bg-[#2A1DBE] text-white'
                  : 'bg-white text-[#2A1DBE] border border-[#E3DCFA] hover:bg-[#F2EDFD]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>filters</span>
              {showAdvancedFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {/* View Mode */}
            <div className="flex items-center bg-white p-1 rounded-2xl border border-[#E3DCFA]">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-xl text-xs ${
                  viewMode === 'cards' ? 'bg-[#2A1DBE] text-white' : 'text-[#2A1DBE] hover:bg-[#F2EDFD]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-1.5 rounded-xl text-xs ${
                  viewMode === 'calendar' ? 'bg-[#2A1DBE] text-white' : 'text-[#2A1DBE] hover:bg-[#F2EDFD]'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-[#2A1DBE]/10 space-y-3.5 animate-fadeIn">
            {/* Presets */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-[#2A1DBE] text-[11px]">date range:</span>
              <div className="flex flex-wrap gap-1 text-[11px]">
                <button
                  onClick={() => handleApplyPreset('all')}
                  className={`px-2.5 py-0.5 rounded-full ${
                    datePreset === 'all' && !startDate && !endDate
                      ? 'bg-[#2A1DBE] text-white font-bold'
                      : 'bg-white text-[#2A1DBE] border border-[#E3DCFA]'
                  }`}
                >
                  all
                </button>
                <button
                  onClick={() => handleApplyPreset('7days')}
                  className={`px-2.5 py-0.5 rounded-full ${
                    datePreset === '7days'
                      ? 'bg-[#2A1DBE] text-white font-bold'
                      : 'bg-white text-[#2A1DBE] border border-[#E3DCFA]'
                  }`}
                >
                  last 7d
                </button>
                <button
                  onClick={() => handleApplyPreset('30days')}
                  className={`px-2.5 py-0.5 rounded-full ${
                    datePreset === '30days'
                      ? 'bg-[#2A1DBE] text-white font-bold'
                      : 'bg-white text-[#2A1DBE] border border-[#E3DCFA]'
                  }`}
                >
                  last 30d
                </button>
                <button
                  onClick={() => handleApplyPreset('thisMonth')}
                  className={`px-2.5 py-0.5 rounded-full ${
                    datePreset === 'thisMonth'
                      ? 'bg-[#2A1DBE] text-white font-bold'
                      : 'bg-white text-[#2A1DBE] border border-[#E3DCFA]'
                  }`}
                >
                  this month
                </button>
              </div>
            </div>

            {/* Custom Dates */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="bg-white px-2.5 py-1 rounded-xl border border-[#E3DCFA] text-[#2A1DBE]"
              />
              <span className="text-[#2A1DBE]/40">~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="bg-white px-2.5 py-1 rounded-xl border border-[#E3DCFA] text-[#2A1DBE]"
              />
            </div>

            {/* Mood Chips */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#2A1DBE] block">mood:</span>
              <div className="flex flex-wrap gap-1">
                {MOOD_OPTIONS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMood(m.id)}
                    className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                      selectedMood === m.id
                        ? 'bg-[#2A1DBE] text-white font-bold'
                        : 'bg-white text-stone-700 hover:bg-[#F2EDFD] border border-[#E3DCFA]'
                    }`}
                  >
                    <span>{m.emoji}</span> {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Weather Chips */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#2A1DBE] block">weather:</span>
              <div className="flex flex-wrap gap-1">
                {WEATHER_OPTIONS.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => setSelectedWeather(w.id)}
                    className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                      selectedWeather === w.id
                        ? 'bg-[#2A1DBE] text-white font-bold'
                        : 'bg-white text-stone-700 hover:bg-[#F2EDFD] border border-[#E3DCFA]'
                    }`}
                  >
                    <span>{w.emoji}</span> {w.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reset */}
            {hasActiveFilters && (
              <div className="pt-2 flex justify-between items-center text-xs">
                <span className="text-[#2A1DBE]/70 font-bold">
                  {filteredDiaries.length} memories found
                </span>
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-[#2A1DBE] underline text-[11px]"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>필터 초기화</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-3xl border border-[#DED7EC] p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#2A1DBE] text-sm">
              {year}년 {month + 1}월
            </h3>
            <div className="flex gap-1 text-xs">
              <button
                onClick={() => setCurrentCalendarMonth(new Date(year, month - 1, 1))}
                className="px-2 py-1 rounded-lg border border-[#E3DCFA] text-[#2A1DBE]"
              >
                &larr;
              </button>
              <button
                onClick={() => setCurrentCalendarMonth(new Date(year, month + 1, 1))}
                className="px-2 py-1 rounded-lg border border-[#E3DCFA] text-[#2A1DBE]"
              >
                &rarr;
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`b-${i}`} className="h-16 bg-[#FAF7FA] rounded-xl" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const match = filteredDiaries.find((d) => d.date === dateStr);

              return (
                <div
                  key={dayNum}
                  onClick={() => match && onSelectDiary(match)}
                  className={`h-16 p-1.5 rounded-xl border flex flex-col justify-between ${
                    match
                      ? 'bg-[#E3DCFA] border-[#2A1DBE] cursor-pointer'
                      : 'bg-white border-[#F0EBF7]'
                  }`}
                >
                  <span className="text-[11px] font-bold text-[#2A1DBE]">{dayNum}</span>
                  {match && (
                    <GardenIcon
                      name={match.stamp || 'flower'}
                      color="#2A1DBE"
                      className="w-5 h-5 mx-auto"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="space-y-3">
          {filteredDiaries.map((diary) => (
            <div
              key={diary.id}
              className="bg-white rounded-3xl border border-[#DED7EC] p-5 shadow-2xs hover:border-[#2A1DBE]/40 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-[#2A1DBE] text-white px-3 py-0.5 rounded-full text-xs font-bold">
                    {diary.date}
                  </span>
                  <div className="p-1 bg-[#EBE5FA] rounded-lg">
                    <GardenIcon name={diary.stamp || 'flower'} color="#2A1DBE" className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs">
                  <button
                    onClick={() => onSelectDiary(diary)}
                    className="text-[#2A1DBE] hover:underline font-bold"
                  >
                    보기
                  </button>
                  <button
                    onClick={() => onEditDiary(diary)}
                    className="text-stone-400 hover:text-stone-700 ml-2"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('삭제하시겠습니까?')) onDeleteDiary(diary.id);
                    }}
                    className="text-stone-300 hover:text-red-500 ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Photo & Snippet */}
              <div onClick={() => onSelectDiary(diary)} className="cursor-pointer flex items-center gap-3">
                {diary.photoUrl && (
                  <img
                    src={diary.photoUrl}
                    alt="Memory"
                    className="w-14 h-14 object-cover rounded-xl border border-[#E3DCFA] shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-[#2A1DBE] truncate mb-0.5">
                    {diary.correctionResult?.naturalTitle || diary.originalTitle || 'Memory'}
                  </h4>
                  <p className="text-xs text-[#2A1DBE]/70 line-clamp-2 leading-relaxed">
                    {diary.correctionResult?.correctedFullText || diary.originalContent}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
