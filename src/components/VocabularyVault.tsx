import React, { useState } from 'react';
import { ChevronLeft, Search, Star, ChevronDown, Volume2, X } from 'lucide-react';
import { SavedExpression } from '../types/diary';

interface VocabularyVaultProps {
  expressions: SavedExpression[];
  onBack: () => void;
  onToggleMastered: (id: string) => void;
  onDeleteExpression?: (id: string) => void;
}

export const VocabularyVault: React.FC<VocabularyVaultProps> = ({
  expressions,
  onBack,
  onToggleMastered,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'favorites'>('all');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical'>('recent');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);

  // Filter expressions
  const filtered = expressions
    .filter((item) => {
      if (filterTab === 'favorites' && !item.mastered) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.expression.toLowerCase().includes(q) ||
        item.meaning.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.expression.localeCompare(b.expression);
      }
      // default: recent
      return (b.savedAt || '').localeCompare(a.savedAt || '');
    });

  // Audio pronunciation
  const handlePronounce = (id: string, text: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    setPlayingId(id);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);
    window.speechSynthesis.speak(utterance);
  };

  // Format date helper YYYY.MM.DD
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '2026.10.25';
    if (dateStr.includes('.')) return dateStr;
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="relative min-h-screen bg-[#FAF9FB] flex flex-col justify-between max-w-md mx-auto select-none px-6 py-4 w-full">
      {/* Top Header matching ______________a73d9185.png */}
      <div className="flex items-center justify-between pt-2 pb-4 w-full">
        <button
          onClick={onBack}
          aria-label="뒤로가기"
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#1F1735] hover:bg-purple-50 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2]" />
        </button>

        <h1 className="text-base font-semibold tracking-wide text-[#1F1735]">
          표현 사전
        </h1>

        <button
          onClick={() => setIsSearchOpen((prev) => !prev)}
          aria-label="검색"
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#1F1735] hover:bg-purple-50 transition-colors cursor-pointer"
        >
          {isSearchOpen ? <X className="w-5 h-5 stroke-[2]" /> : <Search className="w-5 h-5 stroke-[2]" />}
        </button>
      </div>

      {/* Expandable Search Input */}
      {isSearchOpen && (
        <div className="mb-4 animate-fadeIn">
          <div className="relative">
            <Search className="w-4 h-4 text-purple-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="영어 표현이나 한국어 뜻 검색..."
              className="w-full bg-white pl-9 pr-4 py-2.5 rounded-2xl border border-purple-100 text-xs font-sans-clean text-[#1F1735] placeholder-purple-300 focus:outline-none focus:border-[#7D4C7D]"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Filter Pills matching ______________a73d9185.png */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setFilterTab('all')}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
            filterTab === 'all'
              ? 'bg-[#7D4C7D] text-white shadow-xs'
              : 'bg-[#F0EBF0] text-[#333] hover:bg-[#E8E1E8]'
          }`}
        >
          전체
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('favorites')}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
            filterTab === 'favorites'
              ? 'bg-[#7D4C7D] text-white shadow-xs'
              : 'bg-[#F0EBF0] text-[#333] hover:bg-[#E8E1E8]'
          }`}
        >
          즐겨찾기
        </button>
      </div>

      {/* Count & Sort Row matching ______________a73d9185.png */}
      <div className="flex items-center justify-between py-1 mb-3 text-xs text-[#555]">
        <span className="font-medium text-[#1F1735]">
          저장한 표현 {filtered.length}
        </span>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSortDropdown((prev) => !prev)}
            className="flex items-center gap-1 hover:text-[#1F1735] cursor-pointer"
          >
            <span>{sortBy === 'recent' ? '최근 저장순' : '알파벳순'}</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showSortDropdown && (
            <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-purple-100 py-1 z-30 animate-fadeIn">
              <button
                type="button"
                onClick={() => {
                  setSortBy('recent');
                  setShowSortDropdown(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-purple-50 cursor-pointer ${
                  sortBy === 'recent' ? 'text-[#7D4C7D] font-semibold' : 'text-[#333]'
                }`}
              >
                최근 저장순
              </button>
              <button
                type="button"
                onClick={() => {
                  setSortBy('alphabetical');
                  setShowSortDropdown(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-purple-50 cursor-pointer ${
                  sortBy === 'alphabetical' ? 'text-[#7D4C7D] font-semibold' : 'text-[#333]'
                }`}
              >
                알파벳순
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cards List matching ______________a73d9185.png */}
      <div className="flex-1 space-y-3 pb-8 w-full">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-xs text-[#9872A2]">
            {filterTab === 'favorites'
              ? '즐겨찾기한 표현이 아직 없습니다.'
              : '저장된 표현이 없습니다.'}
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-5 shadow-xs border border-purple-50/70 hover:shadow-sm transition-all"
            >
              {/* Row 1: Expression + Teal Star */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[16px] font-semibold text-[#1F1735] tracking-tight">
                  {item.expression}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handlePronounce(item.id, item.expression)}
                    aria-label="발음 듣기"
                    title="발음 듣기"
                    className="p-1 text-gray-300 hover:text-[#7D4C7D] transition-colors cursor-pointer"
                  >
                    <Volume2 className={`w-4 h-4 ${playingId === item.id ? 'text-[#7D4C7D] animate-pulse' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleMastered(item.id)}
                    aria-label="즐겨찾기 토글"
                    className="p-1 cursor-pointer transition-transform active:scale-120"
                  >
                    {item.mastered ? (
                      /* Filled Teal Star #5FA7A9 matching mockup */
                      <Star className="w-5 h-5 fill-[#5FA7A9] text-[#5FA7A9]" />
                    ) : (
                      /* Outline Teal Star #5FA7A9 matching mockup */
                      <Star className="w-5 h-5 text-[#5FA7A9] stroke-[1.8]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Row 2: Korean Meaning */}
              <p className="text-[13px] font-sans-clean text-[#555] mb-2">
                {item.meaning}
              </p>

              {/* Row 3: Date */}
              <p className="text-[11px] font-mono text-[#999]">
                {formatDate(item.savedAt)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
