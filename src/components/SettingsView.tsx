import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DiaryEntry } from '../types/diary';

interface SettingsViewProps {
  onBack: () => void;
  diaries: DiaryEntry[];
  onResetData?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onBack,
  diaries,
  onResetData,
}) => {
  const [dailyReminder, setDailyReminder] = useState<boolean>(true);
  const [suggestPolish, setSuggestPolish] = useState<boolean>(true);
  const [reminderTime, setReminderTime] = useState<string>('매일 오후 9:00');
  const [polishStyle, setPolishStyle] = useState<string>('나다운 표현 유지');
  const [language, setLanguage] = useState<string>('한국어');
  const [toast, setToast] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // Export records to JSON
  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(diaries, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `pawty_memories_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotification('기록이 JSON 파일로 다운로드되었습니다.');
  };

  return (
    <div className="relative min-h-screen bg-[#FAF9FB] flex flex-col justify-between max-w-md mx-auto select-none px-6 py-4 w-full">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#7D4C7D] text-white px-4 py-2 rounded-full text-xs font-sans-clean shadow-lg animate-fadeIn">
          {toast}
        </div>
      )}

      {/* Top Header matching ___5d108102.png */}
      <div className="flex items-center justify-between pt-2 pb-6 w-full">
        <button
          onClick={onBack}
          aria-label="뒤로가기"
          className="w-10 h-10 rounded-full flex items-center justify-center text-[#1F1735] hover:bg-purple-50 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2]" />
        </button>

        <h1 className="text-base font-semibold tracking-wide text-[#1F1735]">
          설정
        </h1>

        <div className="w-10" />
      </div>

      {/* Settings List */}
      <div className="flex-1 space-y-8 pb-10 w-full text-left">
        {/* Section 1: 기록 알림 */}
        <div className="space-y-4">
          <p className="text-xs font-sans-clean font-semibold text-[#8E8077]">
            기록 알림
          </p>

          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-sans-clean font-medium text-[#1F1735]">
                하루 한 번, 기억 쓰기
              </p>
              <p className="text-xs font-sans-clean text-[#8E8077] mt-0.5">
                오늘의 작은 순간을 잊지 않도록
              </p>
            </div>
            {/* Toggle switch matching ___5d108102.png (solid dark pill when active) */}
            <button
              type="button"
              onClick={() => setDailyReminder((v) => !v)}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                dailyReminder ? 'bg-[#1F1735]' : 'bg-[#DCD4DE]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  dailyReminder ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              const times = ['매일 오전 9:00', '매일 오후 1:00', '매일 오후 9:00', '매일 오후 11:00'];
              const next = times[(times.indexOf(reminderTime) + 1) % times.length];
              setReminderTime(next);
            }}
            className="w-full flex items-center justify-between py-2 text-sm font-sans-clean hover:opacity-75 transition-opacity cursor-pointer"
          >
            <span className="text-[#1F1735]">알림 시간</span>
            <div className="flex items-center gap-1.5 text-xs text-[#555]">
              <span>{reminderTime}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </button>
        </div>

        {/* Section 2: 표현 다듬기 */}
        <div className="space-y-4">
          <p className="text-xs font-sans-clean font-semibold text-[#8E8077]">
            표현 다듬기
          </p>

          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-sans-clean font-medium text-[#1F1735]">
                저장 전 표현 제안
              </p>
              <p className="text-xs font-sans-clean text-[#8E8077] mt-0.5">
                원래 문장 그대로 저장할 수도 있어요
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSuggestPolish((v) => !v)}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                suggestPolish ? 'bg-[#1F1735]' : 'bg-[#DCD4DE]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  suggestPolish ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              const styles = ['나다운 표현 유지', '자연스러운 구어체', '격식 있는 표현'];
              const next = styles[(styles.indexOf(polishStyle) + 1) % styles.length];
              setPolishStyle(next);
            }}
            className="w-full flex items-center justify-between py-2 text-sm font-sans-clean hover:opacity-75 transition-opacity cursor-pointer"
          >
            <span className="text-[#1F1735]">다듬기 방식</span>
            <div className="flex items-center gap-1.5 text-xs text-[#555]">
              <span>{polishStyle}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              const langs = ['한국어', 'English'];
              const next = langs[(langs.indexOf(language) + 1) % langs.length];
              setLanguage(next);
            }}
            className="w-full flex items-center justify-between py-2 text-sm font-sans-clean hover:opacity-75 transition-opacity cursor-pointer"
          >
            <span className="text-[#1F1735]">설명 언어</span>
            <div className="flex items-center gap-1.5 text-xs text-[#555]">
              <span>{language}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </button>
        </div>

        {/* Section 3: 개인정보 · 기록 관리 */}
        <div className="space-y-4">
          <p className="text-xs font-sans-clean font-semibold text-[#8E8077]">
            개인정보 · 기록 관리
          </p>

          <button
            type="button"
            onClick={handleExport}
            className="w-full flex items-center justify-between py-2 text-sm font-sans-clean hover:opacity-75 transition-opacity cursor-pointer"
          >
            <span className="text-[#1F1735]">기록 내보내기</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm('모든 일기를 삭제하시겠습니까? 삭제한 일기는 복구할 수 없습니다.')) {
                onResetData?.();
              }
            }}
            className="w-full flex items-center justify-between py-2 text-sm font-sans-clean hover:opacity-75 transition-opacity cursor-pointer text-rose-600"
          >
            <span>기록 삭제 및 데이터 관리</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            type="button"
            onClick={() => showNotification('개인정보는 기기 내부 로컬 저장소에만 안전하게 보관됩니다.')}
            className="w-full flex items-center justify-between py-2 text-sm font-sans-clean hover:opacity-75 transition-opacity cursor-pointer"
          >
            <span className="text-[#1F1735]">개인정보 처리방침</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Section 4: 도움말 */}
        <div className="space-y-4">
          <p className="text-xs font-sans-clean font-semibold text-[#8E8077]">
            도움말
          </p>

          <button
            type="button"
            onClick={() => showNotification('Pawty: 매일 작은 영어 일기를 쓰며 고양이들과 함께 성장하는 기록 앱')}
            className="w-full flex items-center justify-between py-2 text-sm font-sans-clean hover:opacity-75 transition-opacity cursor-pointer"
          >
            <span className="text-[#1F1735]">Pawty 사용 안내</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>

          <button
            type="button"
            onClick={() => showNotification('문의: wendymin713@gmail.com')}
            className="w-full flex items-center justify-between py-2 text-sm font-sans-clean hover:opacity-75 transition-opacity cursor-pointer"
          >
            <span className="text-[#1F1735]">문의하기</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Footer matching ___5d108102.png */}
      <div className="pt-6 pb-6 text-center">
        <p className="text-xs font-mono text-[#8E8077]">
          Pawty / version 1.0.0
        </p>
      </div>
    </div>
  );
};
