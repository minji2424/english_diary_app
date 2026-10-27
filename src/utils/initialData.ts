import { DiaryEntry, SavedExpression } from '../types/diary';

export const INITIAL_DIARIES: DiaryEntry[] = [
  {
    id: 'pawty-1',
    date: '2026-10-26',
    createdAt: '2026-10-26T14:30:00Z',
    updatedAt: '2026-10-26T14:30:00Z',
    weather: 'sunny',
    mood: 'peaceful',
    catId: 'momo',
    catName: '모모',
    catTitle: '느긋한 관찰자',
    photoUrl: '/assets/cat_memory_orange.png',
    photoUrls: [
      '/assets/cat_memory_orange.png',
      '/assets/aistudio/__________de0de914.png',
      'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80',
    ],
    originalTitle: 'A little pause',
    originalContent: `Today, I went to a small café with Jisoo. We talked about little things for two hours.

I felt comfort and didn't notice the time.`,
    wordCount: 26,
    preferredStyle: 'standard',
    savedWithPolish: true,
    correctionResult: {
      overallFeedback: {
        summary: '친구와의 따스한 온기와 여유로운 한때가 아름답게 묻어나는 일기입니다. 감정을 나타낼 때 "felt comfort" 대신 "felt at ease"를, 시간 가는 줄 모를 땐 "lost track of time"을 쓰면 완벽한 원어민 감성이 됩니다.',
        cefrLevel: 'B1 ➔ C1 Native',
        scores: {
          grammar: 92,
          naturalness: 86,
          vocabulary: 88,
        },
        keyTakeaways: [
          '"I felt comfort"보다 "I felt at ease"가 마음이 평온하고 편안한 뉘앙스를 자연스럽게 전합니다.',
          '시간 가는 줄 몰랐다는 감성 표현은 "lost track of time"이 가장 대표적입니다.',
        ],
      },
      naturalTitle: 'A little pause',
      correctedFullText: `Today, I went to a small café with Jisoo. We talked about little things for two hours.

I felt at ease and lost track of time.`,
      styleVariations: {
        casual: `Today, I went to a small café with Jisoo. We talked about little things for two hours. I felt at ease and totally lost track of time!`,
        sophisticated: `This afternoon, I visited a cozy little café with Jisoo. We shared gentle conversations for two peaceful hours. I felt completely at ease, losing all track of time.`,
        concise: `Visited a café with Jisoo today. Two hours of gentle conversation left me feeling at ease, having lost track of time.`,
      },
      sentenceBreakdowns: [
        {
          original: 'I felt comfort',
          corrected: 'I felt at ease',
          koreanExplanation: "마음이 편안했다면 'at ease'가 잘 어울려요. 'comfort'는 감정을 나타내는 명사예요.",
          categoryTag: '감정을 표현하는 말',
          konglishAlert: '',
          betterAlternativeWords: [
            { originalWord: 'felt comfort', suggestedWord: 'felt at ease', reason: '자연스러운 형용사적 감정 상태 표현' },
          ],
          keyIdiom: 'at ease',
          keyIdiomMeaning: '마음이 편안한, 안도하는',
        },
        {
          original: "didn't notice the time",
          corrected: 'lost track of time',
          koreanExplanation: '즐거워서 시간 가는 줄 몰랐을 때 쓰는 표현이에요. 원래 문장의 따뜻한 느낌도 그대로예요.',
          categoryTag: '일상에서 자주 쓰는 표현',
          konglishAlert: '',
          betterAlternativeWords: [
            { originalWord: "didn't notice the time", suggestedWord: 'lost track of time', reason: '몰입하여 시간을 잊었을 때 원어민이 늘 쓰는 표현' },
          ],
          keyIdiom: 'lose track of time',
          keyIdiomMeaning: '시간 가는 줄 모르다',
        },
      ],
      recommendedExpressions: [
        {
          expression: 'at ease',
          meaning: '마음이 편안하고 안락한 상태',
          example: 'Being with good friends always makes me feel at ease.',
          category: '감정을 표현하는 말',
        },
        {
          expression: 'lose track of time',
          meaning: '시간 가는 줄 모르다',
          example: 'We had such fun chatting that I completely lost track of time.',
          category: '일상에서 자주 쓰는 표현',
        },
      ],
    },
  },
];

export const INITIAL_EXPRESSIONS: SavedExpression[] = [];
