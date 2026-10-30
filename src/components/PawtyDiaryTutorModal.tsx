import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Sparkles, Copy, Check, RefreshCw, ChevronRight } from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  extractedEnglish?: string[];
}

interface PawtyDiaryTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertIntoDiary?: (sentence: string) => void;
}

const QUICK_STARTERS = [
  '☕ 오늘 친구랑 예쁜 카페 다녀왔어',
  '💻 야근해서 너무 피곤한 하루였어',
  '🌧️ 비가 와서 하루 종일 방콕했어',
  '🤔 쓸 만한 일이 없는데 어떤 주제가 좋을까?',
  '✍️ 내가 쓴 문장 좀 자연스럽게 고쳐줘',
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-1',
    role: 'assistant',
    text: `안녕냥! 🐾 영어 일기 쓰기가 막막하신가요?

"오늘 친구 만났어", "치킨 먹었어", "기분이 조금 우울했어" 처럼 오늘 있었던 일이나 느낀 감정을 한국어로 편하게 말씀해 주세요! 

일기에 바로 적을 수 있는 자연스러운 원어민 영어 문장과 친절한 뉘앙스 팁을 알려드릴게요 ✨`,
    timestamp: '방금 전',
  },
];

// Helper to extract English sentences from bot response (in quotes or bullet points)
function extractEnglishSentences(text: string): string[] {
  const sentences: string[] = [];
  // Match text inside double quotes that look like English sentences
  const quoteMatches = text.match(/"([A-Za-z0-9\s,.'!?-]{8,})"/g);
  if (quoteMatches) {
    quoteMatches.forEach((m) => {
      const cleaned = m.replace(/^"|"$/g, '').trim();
      if (cleaned && !sentences.includes(cleaned)) {
        sentences.push(cleaned);
      }
    });
  }

  // Also match bullet lines starting with English
  const lines = text.split('\n');
  lines.forEach((line) => {
    const trimmed = line.trim().replace(/^[-*•]\s*/, '');
    const engMatch = trimmed.match(/^"([A-Za-z0-9\s,.'!?-]{8,})"/);
    if (engMatch && !sentences.includes(engMatch[1])) {
      sentences.push(engMatch[1]);
    }
  });

  return sentences.slice(0, 3);
}

export const PawtyDiaryTutorModal: React.FC<PawtyDiaryTutorModalProps> = ({
  isOpen,
  onClose,
  onInsertIntoDiary,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('pawty_tutor_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_MESSAGES;
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSentence, setCopiedSentence] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom(true);
    try {
      localStorage.setItem('pawty_tutor_chat_history', JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText ?? input).trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Send conversation history to server
      const response = await fetch('/api/diary-tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            text: m.text,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const data = await response.json();
      const botReply = data.reply || '문장을 생성하는 데 문제가 발생했어요. 다시 시도해 주세요.';
      const extractedEnglish = extractEnglishSentences(botReply);

      const botMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        extractedEnglish,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      const fallbackBotMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: `오늘 하루에 대해 이야기해 주셔서 감사해요 🐾\n\n일기에 바로 적기 좋은 자연스러운 표현:\n- "Today was a busy yet productive day."\n  (오늘은 바빴지만 알찬 하루였어.)\n- "I took some time to recharge and rest."\n  (충전하고 푹 쉬는 시간을 가졌어.)\n\n💡 *Tip*: 짧은 한 문장이라도 영어로 적어보는 습관이 실력을 키워줘요!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        extractedEnglish: [
          'Today was a busy yet productive day.',
          'I took some time to recharge and rest.',
        ],
      };
      setMessages((prev) => [...prev, fallbackBotMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSentence(text);
    setTimeout(() => setCopiedSentence(null), 2000);
  };

  const handleResetChat = () => {
    if (window.confirm('대화 내용을 처음으로 초기화할까요?')) {
      setMessages(INITIAL_MESSAGES);
      try {
        localStorage.removeItem('pawty_tutor_chat_history');
      } catch {
        // ignore
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-xs animate-fadeIn select-none">
      <div className="relative w-full max-w-lg bg-[#FAF9FB] rounded-[28px] shadow-2xl flex flex-col h-[85vh] max-h-[720px] overflow-hidden border border-[#E8DDE9]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-[#F0E6F2] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#F5EFF6] flex items-center justify-center text-[#7D4C7D] shadow-xs">
              <Bot className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-[#1F1735]">Pawty 일기 튜터</h3>
                <span className="px-2 py-0.5 rounded-full bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-semibold">
                  AI 상시 대기
                </span>
              </div>
              <p className="text-[11px] text-[#9A7186]">영어로 쓰기 막막한 내용을 한국어로 물어보세요!</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleResetChat}
              title="대화 초기화"
              className="p-2 text-[#9A7186] hover:text-[#7D4C7D] rounded-full hover:bg-[#FAF7FA] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="닫기"
              className="p-2 text-[#9A7186] hover:text-[#7D4C7D] rounded-full hover:bg-[#FAF7FA] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fadeIn`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[82%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-[#7D4C7D] text-white rounded-tr-xs'
                      : 'bg-white border border-[#EFE8F2] text-[#1F1735] rounded-tl-xs space-y-2'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>

                  {/* If assistant provided extractable English sentences, show convenient copy / insert buttons */}
                  {!isUser && m.extractedEnglish && m.extractedEnglish.length > 0 && (
                    <div className="pt-2 border-t border-[#F5EFF6] space-y-1.5 mt-2">
                      <span className="text-[11px] font-bold text-[#7D4C7D] block">
                        📝 일기에 바로 쓰기 좋은 문장:
                      </span>
                      {m.extractedEnglish.map((sentence, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#FAF7FA] border border-[#EAE0EC]"
                        >
                          <span className="text-xs font-semibold text-[#1F1735] line-clamp-2">
                            "{sentence}"
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleCopy(sentence)}
                              title="문장 복사"
                              className="p-1 rounded-lg hover:bg-white text-[#7D4C7D] transition-colors cursor-pointer"
                            >
                              {copiedSentence === sentence ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {onInsertIntoDiary && (
                              <button
                                type="button"
                                onClick={() => {
                                  onInsertIntoDiary(sentence);
                                  onClose();
                                }}
                                title="내 일기에 바로 넣기"
                                className="px-2 py-1 rounded-lg bg-[#7D4C7D] text-white text-[10px] font-bold hover:bg-[#6E3F6E] transition-colors cursor-pointer flex items-center gap-0.5"
                              >
                                <span>일기에 추가</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-[#A89BAA] mt-1 px-1">{m.timestamp}</span>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start gap-2.5 animate-fadeIn">
              <div className="w-8 h-8 rounded-xl bg-white border border-[#E8DDE9] flex items-center justify-center text-[#7D4C7D] shadow-xs">
                <Sparkles className="w-4 h-4 animate-spin text-[#7D4C7D]" />
              </div>
              <div className="bg-white border border-[#EFE8F2] rounded-2xl rounded-tl-xs px-4 py-3 text-xs text-[#7D4C7D] flex items-center gap-2">
                <span>포티가 원어민 일기 표현을 생각하고 있어요... 🐾</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Chips */}
        <div className="px-4 py-2 bg-white/70 border-t border-[#F0E6F2] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] text-[#9A7186] font-semibold whitespace-nowrap pl-1">
            추천 질문:
          </span>
          {QUICK_STARTERS.map((starter, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(starter)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-full bg-[#FAF7FA] border border-[#E8DDE9] text-[11px] text-[#554555] font-medium whitespace-nowrap hover:bg-[#F5EFF6] hover:text-[#7D4C7D] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {starter}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 sm:p-4 bg-white border-t border-[#F0E6F2] flex items-center gap-2 shrink-0"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="한국어로 오늘 있었던 일을 편하게 말해주세요..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-[#FAF7FA] border border-[#E8DDE9] text-xs font-sans text-[#1F1735] placeholder-[#A89BAA] focus:outline-none focus:border-[#7D4C7D] focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-10 h-10 rounded-2xl bg-[#7D4C7D] hover:bg-[#6E3F6E] disabled:bg-[#D2C3D2] text-white flex items-center justify-center shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
            aria-label="전송"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
