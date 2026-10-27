import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Lightbulb, 
  Image as ImageIcon, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Camera,
  X
} from 'lucide-react';
import { WeatherType, MoodType, PromptSpark } from '../types/diary';
import { GardenIcon, ALL_GARDEN_STAMPS, GardenStampType } from './GardenIcons';

interface DiaryEditorProps {
  initialTitle?: string;
  initialContent?: string;
  initialDate?: string;
  initialWeather?: WeatherType;
  initialMood?: MoodType;
  initialStamp?: string;
  initialPhotoUrl?: string;
  isCorrecting: boolean;
  onCorrect: (data: {
    title: string;
    content: string;
    date: string;
    weather: WeatherType;
    mood: MoodType;
    stamp: string;
    photoUrl?: string;
  }) => void;
  onSaveDraft?: (data: {
    title: string;
    content: string;
    date: string;
    weather: WeatherType;
    mood: MoodType;
    stamp: string;
    photoUrl?: string;
  }) => void;
}

const PRESET_PHOTOS = [
  {
    name: 'matcha',
    label: '말차 라떼 데이트 🍵',
    url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'coffee',
    label: '따뜻한 카푸치노 ☕',
    url: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'book',
    label: '책과 찻잔 📖',
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'flower',
    label: '튤립과 정원 🌷',
    url: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'rain',
    label: '비 내리는 창가 🌧️',
    url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'cat',
    label: '나른한 고양이 🐾',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80',
  },
];

const DEFAULT_SPARKS: PromptSpark[] = [
  {
    id: 's1',
    topicKo: 'matcha date with my favorite person',
    promptKo: '소중한 사람과의 소소한 카페 데이트나 행복했던 대화',
    promptEn: 'A sweet cafe date with someone special',
    starter: 'matcha date with my favorite person 🍵',
    category: 'Daily Joy',
  },
  {
    id: 's2',
    topicKo: 'small moment of quiet happiness',
    promptKo: '창밖을 보며 느낀 작은 여유와 평화로움',
    promptEn: 'A quiet, peaceful pause during a busy day',
    starter: 'spent a quiet afternoon sipping iced coffee and listening to the rain 🌧️',
    category: 'Peace',
  },
  {
    id: 's3',
    topicKo: 'studying hard but keeping momentum',
    promptKo: '오늘 하루 열심히 몰입하고 뿌듯했던 순간',
    promptEn: 'Pushed through challenging work and felt proud',
    starter: 'hit the books for three solid hours and finally understood it ✨',
    category: 'Growth',
  },
];

export const DiaryEditor: React.FC<DiaryEditorProps> = ({
  initialTitle = '',
  initialContent = '',
  initialDate,
  initialWeather = 'sunny',
  initialMood = 'happy',
  initialStamp = 'tree',
  initialPhotoUrl,
  isCorrecting,
  onCorrect,
  onSaveDraft,
}) => {
  const [date, setDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [weather, setWeather] = useState<WeatherType>(initialWeather);
  const [mood, setMood] = useState<MoodType>(initialMood);
  const [selectedStamp, setSelectedStamp] = useState<string>(initialStamp);
  const [photoUrl, setPhotoUrl] = useState<string>(
    initialPhotoUrl || PRESET_PHOTOS[0].url
  );
  const [showPhotoPicker, setShowPhotoPicker] = useState<boolean>(false);
  const [customPhotoInput, setCustomPhotoInput] = useState<string>('');
  const [title, setTitle] = useState<string>(initialTitle);
  const [content, setContent] = useState<string>(initialContent);
  const [showSparks, setShowSparks] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (initialTitle !== undefined) setTitle(initialTitle);
    if (initialContent !== undefined) setContent(initialContent);
    if (initialDate) setDate(initialDate);
    if (initialStamp) setSelectedStamp(initialStamp);
    if (initialPhotoUrl !== undefined) setPhotoUrl(initialPhotoUrl);
  }, [initialTitle, initialContent, initialDate, initialStamp, initialPhotoUrl]);

  // Format date like '15.03'
  const datePillText = (() => {
    try {
      const parts = date.split('-');
      return `${parts[2]}.${parts[1]}`;
    } catch {
      return date;
    }
  })();

  const words = content.trim().length > 0 ? content.trim().split(/\s+/).length : 0;

  const handleApplySpark = (starter: string) => {
    if (content.trim()) {
      setContent((prev) => `${prev}\n${starter}`);
    } else {
      setContent(starter);
    }
    setShowSparks(false);
  };

  const handleLoadSample = () => {
    setSelectedStamp('coffee');
    setPhotoUrl(PRESET_PHOTOS[0].url);
    setTitle('matcha date with my favorite person');
    setContent(
      `Today after work, I had a matcha date with my favorite person at our neighborhood cafe.
We drank delicious iced matcha latte and played with each other for two hours.
I was so hard recently because of heavy study, but talking together gave me great energy.
I promise to myself to keep this happy feeling tomorrow!`
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    onCorrect({
      title,
      content,
      date,
      weather,
      mood,
      stamp: selectedStamp,
      photoUrl,
    });
  };

  const handleSave = () => {
    if (onSaveDraft) {
      onSaveDraft({
        title,
        content,
        date,
        weather,
        mood,
        stamp: selectedStamp,
        photoUrl,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  return (
    <div className="max-w-xl mx-auto dot-grid rounded-3xl border border-[#DED7EC] p-5 sm:p-8 shadow-xs">
      {/* Top Bar: Aesthetic Tagline & Date Capsule */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] sm:text-xs text-[#2A1DBE]/80 font-mono-typewriter italic">
          (each memory grows your garden)
        </p>

        {/* Date Capsule like '15.03' */}
        <div className="flex items-center gap-1.5 bg-[#E8E2FA] border border-[#2A1DBE]/20 px-3 py-1 rounded-full text-[#2A1DBE] text-xs font-mono-typewriter font-bold shadow-2xs">
          <span>{datePillText}</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-4 h-4 opacity-0 absolute cursor-pointer"
            title="날짜 변경"
          />
        </div>
      </div>

      {/* Row of Botanical Garden Stamp Stickers (As seen in screenshot 1) */}
      <div className="bg-white/80 backdrop-blur-2xs rounded-2xl p-2.5 sm:p-3 border border-[#E3DCFA] mb-6 shadow-2xs">
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
          {ALL_GARDEN_STAMPS.slice(0, 8).map((st) => {
            const isSelected = selectedStamp === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStamp(st.id)}
                className={`p-2 rounded-xl transition-all duration-200 flex-shrink-0 ${
                  isSelected
                    ? 'bg-[#E3DCFA] ring-2 ring-[#2A1DBE] scale-110 shadow-xs'
                    : 'text-[#2A1DBE]/60 hover:text-[#2A1DBE] hover:bg-[#F2EDFD]'
                }`}
                title={st.label}
              >
                <GardenIcon
                  name={st.id}
                  color="#2A1DBE"
                  className="w-6 h-6"
                  strokeWidth={isSelected ? 2 : 1.6}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Central Aesthetic Photo (Matcha / Daily Polaroid View) */}
      <div className="relative mb-6">
        <div className="relative group max-w-sm mx-auto overflow-hidden rounded-2xl border-2 border-white shadow-md bg-stone-100">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Daily Memory"
              className="w-full h-64 sm:h-72 object-cover transition-transform duration-500 group-hover:scale-102"
            />
          ) : (
            <div className="w-full h-64 bg-[#F5EFFB] flex flex-col items-center justify-center text-[#2A1DBE]">
              <GardenIcon name={selectedStamp} className="w-16 h-16 mb-2" color="#2A1DBE" />
              <span className="text-xs font-mono-typewriter">사진 추가하기</span>
            </div>
          )}

          {/* Change Photo Overlay Button */}
          <button
            type="button"
            onClick={() => setShowPhotoPicker(!showPhotoPicker)}
            className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-xs text-[#2A1DBE] p-2 rounded-xl text-xs font-mono-typewriter font-semibold flex items-center gap-1.5 shadow-sm hover:bg-white transition-all"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>사진 감성 선택</span>
          </button>
        </div>

        {/* Photo Selection Drawer */}
        {showPhotoPicker && (
          <div className="mt-3 p-3 bg-white rounded-2xl border border-[#DED7EC] shadow-md animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-mono-typewriter text-[#2A1DBE] mb-2 font-bold">
              <span>핀터레스트 무드 사진 선택</span>
              <button onClick={() => setShowPhotoPicker(false)}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2">
              {PRESET_PHOTOS.map((p) => (
                <div
                  key={p.name}
                  onClick={() => {
                    setPhotoUrl(p.url);
                    setShowPhotoPicker(false);
                  }}
                  className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                    photoUrl === p.url ? 'border-[#2A1DBE] ring-1 ring-[#2A1DBE]' : 'border-transparent hover:opacity-80'
                  }`}
                >
                  <img src={p.url} alt={p.label} className="w-full h-14 object-cover" />
                  <p className="text-[10px] text-center font-mono-typewriter truncate py-0.5 bg-[#FAF7FA] text-stone-700">
                    {p.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Custom URL Input */}
            <div className="flex items-center gap-1.5 text-xs">
              <input
                type="text"
                placeholder="내 사진 이미지 URL 직접 붙여넣기..."
                value={customPhotoInput}
                onChange={(e) => setCustomPhotoInput(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-lg border border-stone-200 font-mono-typewriter text-[11px] focus:outline-none focus:border-[#2A1DBE]"
              />
              <button
                type="button"
                onClick={() => {
                  if (customPhotoInput.trim()) {
                    setPhotoUrl(customPhotoInput.trim());
                    setCustomPhotoInput('');
                    setShowPhotoPicker(false);
                  }
                }}
                className="bg-[#2A1DBE] text-white px-3 py-1.5 rounded-lg font-mono-typewriter text-xs"
              >
                적용
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Editor Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title / Mood caption */}
        <div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="entry title (e.g. matcha date with my favorite person...)"
            className="w-full bg-transparent font-mono-typewriter text-base sm:text-lg font-bold text-[#2A1DBE] placeholder:text-[#2A1DBE]/30 focus:outline-none border-b border-[#2A1DBE]/20 pb-1.5 transition-colors focus:border-[#2A1DBE]"
          />
        </div>

        {/* Content Textarea with Minimalist Typewriter Font */}
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="write your daily memory in english freely.
(e.g. matcha date with my favorite person 🍵)

틀려도 괜찮아요! 원어민 AI 에디터가 자연스러운 영어로 교정해 드립니다."
            rows={5}
            className="w-full bg-white/70 backdrop-blur-2xs rounded-2xl p-4 font-mono-typewriter text-[#1F146E] placeholder:text-[#2A1DBE]/30 text-sm sm:text-base leading-relaxed border border-[#E3DCFA] focus:outline-none focus:border-[#2A1DBE] focus:bg-white transition-all resize-y min-h-[140px]"
          />
        </div>

        {/* Quick Suggestions & Load Sample */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-typewriter pt-1">
          <button
            type="button"
            onClick={() => setShowSparks(!showSparks)}
            className="flex items-center gap-1 text-[#2A1DBE] hover:underline"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>오늘의 영작 추천 아이디어</span>
            {showSparks ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <button
            type="button"
            onClick={handleLoadSample}
            className="text-[11px] text-[#2A1DBE]/70 hover:text-[#2A1DBE] underline"
          >
            말차 데이트 예시 불러오기 🍵
          </button>
        </div>

        {/* Sparks List */}
        {showSparks && (
          <div className="space-y-2 p-3 bg-white/90 rounded-2xl border border-[#E3DCFA] animate-fadeIn">
            {DEFAULT_SPARKS.map((s) => (
              <div
                key={s.id}
                onClick={() => handleApplySpark(s.starter)}
                className="p-2.5 rounded-xl hover:bg-[#F2EDFD] cursor-pointer transition-colors border border-transparent hover:border-[#2A1DBE]/20"
              >
                <p className="text-xs font-mono-typewriter text-[#2A1DBE] font-bold">
                  "{s.starter}"
                </p>
                <p className="text-[11px] text-stone-500 font-sans-clean mt-0.5">
                  {s.promptKo}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Monospace Footer & Primary Action */}
        <div className="pt-3 border-t border-[#2A1DBE]/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] font-mono-typewriter text-[#2A1DBE]/60 flex items-center gap-3">
            <span>{words} words written</span>
            {saveSuccess && (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <Check className="w-3 h-3" /> saved!
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="text-[#2A1DBE] hover:underline"
            >
              임시저장
            </button>
          </div>

          {/* Primary Action Button: Cobalt Blue Pill */}
          <button
            type="submit"
            disabled={!content.trim() || isCorrecting}
            className={`w-full sm:w-auto px-6 py-3 rounded-full font-mono-typewriter font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 ${
              !content.trim() || isCorrecting
                ? 'bg-[#2A1DBE]/20 text-[#2A1DBE]/40 cursor-not-allowed'
                : 'bg-[#2A1DBE] hover:bg-[#2013A4] text-white hover:shadow-md'
            }`}
          >
            {isCorrecting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>growing memory...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>polish with native ai ✨</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
