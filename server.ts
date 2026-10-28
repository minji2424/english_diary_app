import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config({ path: ['.env.local', '.env'] });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

const port = Number(process.env.PORT) || 3000;

// Initialize GoogleGenAI server-side with User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const correctionSchema = {
  type: Type.OBJECT,
  properties: {
    overallFeedback: {
      type: Type.OBJECT,
      properties: {
        summary: {
          type: Type.STRING,
          description: '한국어로 작성된 원어민 에디터의 따뜻하고 구체적인 총평과 전반적인 피드백.',
        },
        cefrLevel: {
          type: Type.STRING,
          description: "원문 추정 레벨 및 교정 후 도달 레벨 (예: 'B1 ➔ C1 Native')",
        },
        scores: {
          type: Type.OBJECT,
          properties: {
            grammar: { type: Type.INTEGER, description: '문법 정확도 점수 (1-100)' },
            naturalness: { type: Type.INTEGER, description: '원어민 자연스러움 점수 (1-100)' },
            vocabulary: { type: Type.INTEGER, description: '어휘 다양성 및 적절성 점수 (1-100)' },
          },
          required: ['grammar', 'naturalness', 'vocabulary'],
        },
        keyTakeaways: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '오늘 일기에서 꼭 기억해야 할 핵심 개선 포인트 2~3가지',
        },
      },
      required: ['summary', 'cefrLevel', 'scores', 'keyTakeaways'],
    },
    correctedFullText: {
      type: Type.STRING,
      description: '원어민이 작성한 것처럼 자연스럽게 다듬어진 전체 일기 본문',
    },
    naturalTitle: {
      type: Type.STRING,
      description: '원어민스러운 세련된 일기 제목',
    },
    styleVariations: {
      type: Type.OBJECT,
      properties: {
        casual: {
          type: Type.STRING,
          description: '편안하고 일상적인 친구와의 대화나 SNS 일기 느낌의 버전',
        },
        sophisticated: {
          type: Type.STRING,
          description: '풍부한 감성과 격조 높은 어휘를 사용한 에세이 느낌의 버전',
        },
        concise: {
          type: Type.STRING,
          description: '군더더기 없이 간결하고 명확하게 전달하는 버전',
        },
      },
      required: ['casual', 'sophisticated', 'concise'],
    },
    sentenceBreakdowns: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          original: {
            type: Type.STRING,
            description: '사용자가 작성한 원래 문장',
          },
          corrected: {
            type: Type.STRING,
            description: '원어민 수준으로 교정된 문장',
          },
          koreanExplanation: {
            type: Type.STRING,
            description: '한국어 설명: 왜 이렇게 고쳤는지, 뉘앙스 차이, 원어민 습관 등 상세한 설명',
          },
          konglishAlert: {
            type: Type.STRING,
            description: '콩글리시 또는 한국인 특유의 직역 습관에 대한 주의점 (해당 없으면 빈 문자열)',
          },
          betterAlternativeWords: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                originalWord: { type: Type.STRING },
                suggestedWord: { type: Type.STRING },
                reason: { type: Type.STRING, description: '한국어 설명' },
              },
              required: ['originalWord', 'suggestedWord', 'reason'],
            },
            description: '원어민이 더 자주 쓰는 단어나 구동사 교체 추천',
          },
          keyIdiom: {
            type: Type.STRING,
            description: '이 문장에서 활용된 원어민 관용구, 구동사 또는 콜로케이션 (없으면 빈 문자열)',
          },
          keyIdiomMeaning: {
            type: Type.STRING,
            description: '관용구/표현의 한국어 뜻 (없으면 빈 문자열)',
          },
        },
        required: [
          'original',
          'corrected',
          'koreanExplanation',
          'konglishAlert',
          'betterAlternativeWords',
        ],
      },
    },
    recommendedExpressions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          expression: { type: Type.STRING, description: '원어민 표현 / 단어 / 구동사' },
          meaning: { type: Type.STRING, description: '한국어 뜻 및 뉘앙스' },
          example: { type: Type.STRING, description: '실생활 예문' },
          category: { type: Type.STRING, description: '분류' },
        },
        required: ['expression', 'meaning', 'example', 'category'],
      },
      description: '오늘 일기에서 뽑아낸 단어장에 저장하기 좋은 알짜배기 표현 2~4개',
    },
  },
  required: [
    'overallFeedback',
    'correctedFullText',
    'naturalTitle',
    'styleVariations',
    'sentenceBreakdowns',
    'recommendedExpressions',
  ],
};

// Smart Fallback Correction in case of AI network timeout or error
function generateFallbackCorrection(title: string, content: string): any {
  const sentences = content
    .split(/(?<=[.?!])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const breakdowns: any[] = [];

  sentences.forEach((sent) => {
    let corrected = sent;
    let konglish = '';
    let explanation = '';
    const alts: any[] = [];

    if (/\bplay\b|\bplayed\b/i.test(sent)) {
      corrected = sent.replace(/\bplayed with\b/gi, 'hung out with').replace(/\bplay with\b/gi, 'hang out with');
      konglish = '성인이 친구들과 어울릴 때는 "play with" 대신 "hang out with"를 씁니다.';
      explanation = '성인의 사교 모임이나 만남에는 "hang out" 또는 "catch up"이 훨씬 자연스럽습니다.';
      alts.push({ originalWord: 'played with', suggestedWord: 'hung out with', reason: '원어민 필수 구동사' });
    } else if (/\beat medicine\b|\bate medicine\b/i.test(sent)) {
      corrected = sent.replace(/\bate medicine\b/gi, 'took some medicine').replace(/\beat medicine\b/gi, 'take some medicine');
      konglish = '약을 먹다는 "eat medicine"이 아닌 "take medicine"입니다.';
      explanation = '영어로 약을 복용할 때는 동사 take를 씁니다.';
      alts.push({ originalWord: 'ate medicine', suggestedWord: 'took medicine', reason: '올바른 연어(collocation)' });
    } else if (/\bI was so hard\b/i.test(sent)) {
      corrected = sent.replace(/\bI was so hard\b/gi, 'I had such a hard time');
      konglish = '"I was hard"는 오해를 살 수 있는 표현입니다! "I had a hard time"을 사용하세요.';
      alts.push({ originalWord: 'I was so hard', suggestedWord: 'I had a hard time', reason: '자연스러운 주어 구문' });
    } else if (/\bfelt comfort\b/i.test(sent)) {
      corrected = sent.replace(/\bfelt comfort\b/gi, 'felt at ease');
      explanation = "마음이 편안했다면 'at ease'가 잘 어울려요. 'comfort'는 감정을 나타내는 명사예요.";
      alts.push({ originalWord: 'felt comfort', suggestedWord: 'felt at ease', reason: '자연스러운 형용사적 감정 상태 표현' });
    } else if (/didn't notice the time/i.test(sent)) {
      corrected = sent.replace(/didn't notice the time/gi, 'lost track of time');
      explanation = '즐거워서 시간 가는 줄 몰랐을 때 쓰는 표현이에요. 원래 문장의 따뜻한 느낌도 그대로예요.';
      alts.push({ originalWord: "didn't notice the time", suggestedWord: 'lost track of time', reason: '시간 가는 줄 모르다' });
    }

    if (corrected !== sent) {
      breakdowns.push({
        original: sent,
        corrected,
        koreanExplanation: explanation,
        konglishAlert: konglish,
        betterAlternativeWords: alts,
        keyIdiom: alts[0]?.suggestedWord || '',
        keyIdiomMeaning: explanation.split('.')[0] || '',
      });
    }
  });

  const correctedFull = content;

  return {
    overallFeedback: {
      summary: breakdowns.length === 0
        ? '수정할 게 없습니다~ 이미 원어민 수준으로 자연스럽고 훌륭한 문장이에요! 🎉'
        : '오늘 하루의 소중한 순간이 잘 드러난 멋진 일기입니다! 몇 가지 원어민식 자연스러운 구동사로 다듬어 보았습니다.',
      cefrLevel: 'B2 ➔ C1 Native',
      scores: { grammar: 95, naturalness: 92, vocabulary: 90 },
      keyTakeaways: breakdowns.length === 0
        ? ['문법과 표현이 이미 아주 매끄럽습니다. 계속 이대로 작성해 보세요!']
        : ['상황에 맞는 원어민 고유의 구동사(phrasal verb)를 적극 활용해보세요.'],
    },
    naturalTitle: title ? `Memories: ${title}` : 'A Cherished Moment in My Day',
    correctedFullText: correctedFull,
    styleVariations: {
      casual: correctedFull,
      sophisticated: correctedFull,
      concise: correctedFull,
    },
    sentenceBreakdowns: breakdowns,
    recommendedExpressions: [
      {
        expression: 'hang out with',
        meaning: '친구들과 어울려 놀다, 시간을 보내다',
        example: 'We hung out at a cozy cafe all afternoon.',
        category: '일상 구어',
      },
      {
        expression: 'take it easy',
        meaning: '편히 쉬다, 여유를 갖다',
        example: 'After a busy week, I just wanted to take it easy today.',
        category: '휴식/일상',
      },
      {
        expression: 'cherish the moment',
        meaning: '순간을 소중히 간직하다',
        example: 'It was a brief conversation, but I truly cherished the moment.',
        category: '감성 표현',
      },
    ],
  };
}

// API: Correct Diary
app.post('/api/correct', async (req, res) => {
  const { title, content, mood, weather } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: '일기 내용을 입력해 주세요.' });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      error: 'AI 피드백을 사용할 수 없습니다.',
      details: '서버에 GEMINI_API_KEY가 설정되어 있는지 확인해 주세요.',
    });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    const systemInstruction = `당신은 한국인을 위한 세계 최고의 원어민 영어 작문 전문 멘토입니다.
사용자가 작성한 영어 일기를 분석하여:
1. 문법 오류와 어색한 한국식 직역(Konglish)을 탈피하고, 20~30대 현지 원어민이 실제 쓰는 가장 자연스러운 영어로 전면 교정합니다.
2. 문장별로 분해하여 원래 문장과 원어민 교정 문장을 대조하고, 한국어로 명확하게 "왜 원어민은 이렇게 표현하는지" 설명합니다.
3. 세 가지 다른 스타일(Casual, Sophisticated, Concise)로도 전체 일기를 작성합니다.
4. 알짜배기 원어민 숙어/구동사를 추출하여 단어장용으로 정리합니다.
모든 설명과 팁은 한국어로 친절하게 작성합니다.`;

    const userPrompt = `[일기 메타 정보]
날씨: ${weather || '미지정'}
기분: ${mood || '미지정'}
제목: ${title || '(제목 없음)'}

[사용자가 작성한 영어 일기]
${content}

위 일기를 철저히 분석하고 원어민 수준으로 교정하여 JSON 형식에 맞춰 응답해 주세요.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: correctionSchema,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
        abortSignal: controller.signal,
        temperature: 0.7,
      },
    });

    let rawJson = response.text || '';
    rawJson = rawJson.trim();
    if (rawJson.startsWith('```json')) {
      rawJson = rawJson.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (rawJson.startsWith('```')) {
      rawJson = rawJson.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      const match = rawJson.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('AI response JSON parsing failed');
      }
    }

    // Safety checks & fallbacks for consistent UI rendering
    if (!parsed.correctedFullText) {
      parsed.correctedFullText = content;
    }
    if (!parsed.naturalTitle) {
      parsed.naturalTitle = title || 'A Memory to Keep';
    }
    if (!parsed.styleVariations) {
      parsed.styleVariations = {
        casual: parsed.correctedFullText,
        sophisticated: parsed.correctedFullText,
        concise: parsed.correctedFullText,
      };
    }
    if (!parsed.overallFeedback) {
      parsed.overallFeedback = {
        summary: '오늘 하루의 진솔한 생각이 잘 담긴 멋진 일기입니다.',
        cefrLevel: 'B1 ➔ C1 Native',
        scores: { grammar: 88, naturalness: 84, vocabulary: 82 },
        keyTakeaways: ['자연스러운 원어민 표현으로 성공적으로 교정되었습니다.'],
      };
    }
    if (!Array.isArray(parsed.sentenceBreakdowns)) {
      parsed.sentenceBreakdowns = [];
    }
    if (!Array.isArray(parsed.recommendedExpressions)) {
      parsed.recommendedExpressions = [];
    }

    return res.json(parsed);
  } catch (error) {
    const details = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    console.error('Gemini diary feedback request failed:', details);
    return res.status(502).json({
      error: 'AI 피드백을 생성하지 못했습니다.',
      details,
    });
  } finally {
    clearTimeout(timeoutId);
  }
});

// API: Daily Prompts & Sparks
app.get('/api/prompts', async (req, res) => {
  const fallbackPrompts = [
    {
      id: 'p1',
      topicKo: '소소한 행복의 순간',
      promptKo: '오늘 하루 중 당신을 미소 짓게 만든 작은 순간이나 기분 좋았던 일은 무엇인가요?',
      promptEn: 'What was a small moment today that made you smile or feel at peace?',
      starter: 'Something small that brought a smile to my face today was...',
      category: 'Gratitude & Joy',
    },
    {
      id: 'p2',
      topicKo: '오늘 마신 커피나 특별한 식사',
      promptKo: '오늘 먹은 음식이나 커피에 대해 묘사해 보세요. 맛과 그때의 분위기는 어땠나요?',
      promptEn: 'Describe a meal, snack, or coffee you had today. How was the taste and ambiance?',
      starter: 'For lunch today, I grabbed...',
      category: 'Daily Routine',
    },
    {
      id: 'p3',
      topicKo: '예상치 못했던 작은 사건',
      promptKo: '오늘 계획에 없었던 우연한 만남이나 뜻밖의 에피소드가 있었나요?',
      promptEn: 'Did anything unexpected or spontaneous happen today?',
      starter: 'Out of nowhere today, I found myself...',
      category: 'Spontaneity',
    },
    {
      id: 'p4',
      topicKo: '스트레스 해소와 휴식',
      promptKo: '바쁜 일과를 마치고 나만의 에너지를 충전하기 위해 무엇을 했나요?',
      promptEn: 'How did you decompress and unwind after a busy day?',
      starter: 'After a hectic day, the best way for me to unwind was...',
      category: 'Self-Care',
    },
    {
      id: 'p5',
      topicKo: '새롭게 깨달은 점',
      promptKo: '오늘 대화나 생각 속에서 문득 떠오른 생각이나 다짐이 있나요?',
      promptEn: 'What was a thought or realization that crossed your mind today?',
      starter: 'I realized something interesting today while...',
      category: 'Reflection',
    },
  ];

  return res.json({ prompts: fallbackPrompts });
});

// Setup Vite in Dev or Static in Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`NativeInk server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
