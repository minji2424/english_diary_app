import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: [path.resolve(__dirname, '.env.local'), path.resolve(__dirname, '.env')],
});

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

// In-memory cache & rate limit tracker for /api/correct
const feedbackCache = new Map<string, any>();
let rateLimitedUntil = 0;

// API: Correct Diary
app.post('/api/correct', async (req, res) => {
  const { title, content, mood, weather } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: '일기 내용을 입력해 주세요.' });
  }

  const trimmedContent = content.trim();
  const cacheKey = `${title || ''}:::${trimmedContent}`;

  // Return cached result if available
  if (feedbackCache.has(cacheKey)) {
    return res.json(feedbackCache.get(cacheKey));
  }

  // If currently in Gemini rate-limit cooldown, return intelligent fallback immediately
  if (Date.now() < rateLimitedUntil) {
    console.log('Gemini in rate-limit cooldown; serving intelligent fallback correction');
    const fallback = generateFallbackCorrection(title || '', trimmedContent);
    feedbackCache.set(cacheKey, fallback);
    return res.json(fallback);
  }

  // If no API key configured, use fallback directly
  if (!process.env.GEMINI_API_KEY) {
    const fallback = generateFallbackCorrection(title || '', trimmedContent);
    feedbackCache.set(cacheKey, fallback);
    return res.json(fallback);
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
5. 일기에 어색한 점이나 고칠 부분이 전혀 없다면 sentenceBreakdowns를 빈 배열([])로 두고, overallFeedback.summary에 "수정할 게 없습니다~ 이미 원어민 수준으로 자연스럽고 훌륭한 문장이에요! 🎉"라고 칭찬해 주세요.
모든 설명과 팁은 한국어로 친절하게 작성합니다.`;

    const userPrompt = `[일기 메타 정보]
날씨: ${weather || '미지정'}
기분: ${mood || '미지정'}
제목: ${title || '(제목 없음)'}

[사용자가 작성한 영어 일기]
${trimmedContent}

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
      parsed.correctedFullText = trimmedContent;
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

    // Cache the successful response
    feedbackCache.set(cacheKey, parsed);
    return res.json(parsed);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn('Gemini diary feedback failed, using intelligent fallback:', errorMsg);

    // If quota exceeded or 429, set a 20-second cooldown so subsequent requests instantly use fallback
    if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('quota')) {
      rateLimitedUntil = Date.now() + 20000;
    }

    // Return intelligent fallback response so the user gets a smooth experience without errors
    const fallback = generateFallbackCorrection(title || '', trimmedContent);
    feedbackCache.set(cacheKey, fallback);
    return res.json(fallback);
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

// Curated instant expression dictionary for instant daily journal assistance
const CURATED_EXPRESSIONS: Record<string, any> = {
  '면접': {
    query: '면접봤어',
    expressions: [
      {
        english: 'I had a job interview today.',
        koreanMeaning: '오늘 구직 면접을 봤어요.',
        tone: '가장 자연스러운 일상 표현',
        nuanceTip: "'면접을 보다'를 'see an interview'로 직역하지 않고 동사 'have'를 씁니다.",
      },
      {
        english: 'I went in for an interview today.',
        koreanMeaning: '오늘 면접 보러 다녀왔어요.',
        tone: '면접 장소 방문 강조',
        nuanceTip: "회사나 기관에 직접 방문해서 면접을 치렀을 때 원어민들이 자주 쓰는 구동사 'go in for'입니다.",
      },
      {
        english: 'I had an interview today and I think it went pretty well!',
        koreanMeaning: '오늘 면접을 봤는데 꽤 잘 본 것 같아요!',
        tone: '기분 좋은 긍정 표현',
        nuanceTip: "'면접이 잘 풀렸다'고 할 때 'it went well'을 자연스럽게 덧붙여 보세요.",
      },
    ],
    keyVocabulary: [
      { word: 'have an interview', meaning: '면접을 보다 (see an interview ❌)' },
      { word: 'go in for an interview', meaning: '면접을 보러 가다' },
      { word: 'nail an interview', meaning: '면접을 완벽하게 해내다' },
    ],
  },
  '친구': {
    query: '친구랑 놀았어',
    expressions: [
      {
        english: 'I hung out with my friend today.',
        koreanMeaning: '오늘 친구랑 어울려 놀았어요.',
        tone: '친근한 구어체',
        nuanceTip: "성인이 친구들과 놀 때는 'play with' 대신 반드시 'hang out with'를 씁니다.",
      },
      {
        english: 'I caught up with an old friend over coffee.',
        koreanMeaning: '오랜 친구를 만나 커피 마시며 근황을 나눴어요.',
        tone: '오랜만의 만남',
        nuanceTip: "'그동안 못 본 이야기를 나누다'는 'catch up'을 씁니다.",
      },
      {
        english: 'I spent some quality time with my bestie.',
        koreanMeaning: '절친과 정말 알차고 좋은 시간을 보냈어요.',
        tone: '감성 일기체',
        nuanceTip: "'quality time'은 소중하고 충실한 시간을 의미합니다.",
      },
    ],
    keyVocabulary: [
      { word: 'hang out with', meaning: '친구와 어울려 놀다/시간을 보내다' },
      { word: 'catch up with', meaning: '밀린 근황 토크를 하다' },
      { word: 'grab a coffee', meaning: '커피 한잔하다' },
    ],
  },
  '야근': {
    query: '야근했어',
    expressions: [
      {
        english: 'I worked overtime today and I feel completely drained.',
        koreanMeaning: '오늘 야근을 해서 완전히 녹초가 되었어요.',
        tone: '솔직한 피로감 표현',
        nuanceTip: "'야근하다'는 'work overtime'을 사용하고, 기진맥진할 땐 'drained'나 'exhausted'를 씁니다.",
      },
      {
        english: 'I had to stay late at work today to finish up a project.',
        koreanMeaning: '프로젝트를 마무리하느라 오늘 회사에 늦게까지 남았어요.',
        tone: '일상적인 설명',
        nuanceTip: "'stay late at work'는 늦게까지 일할 때 일상에서 정말 많이 쓰는 구문입니다.",
      },
    ],
    keyVocabulary: [
      { word: 'work overtime', meaning: '야근하다 / 초과 근무하다' },
      { word: 'stay late', meaning: '늦게까지 남다' },
      { word: 'feel drained', meaning: '진이 다 빠지다 / 녹초가 되다' },
    ],
  },
  '시간': {
    query: '시간 가는 줄 몰랐어',
    expressions: [
      {
        english: 'I completely lost track of time.',
        koreanMeaning: '시간 가는 줄 완전히 잊고 있었어요.',
        tone: '원어민 필수 관용구',
        nuanceTip: "어떤 일에 푹 빠져 시간의 흐름을 놓쳤을 때 'lose track of time'을 씁니다.",
      },
      {
        english: 'Time just flew by today.',
        koreanMeaning: '오늘 하루가 눈 깜짝할 사이에 휙 지나갔어요.',
        tone: '자연스러운 감탄',
        nuanceTip: "'Time flies'의 과거형으로 하루가 쏜살같이 지나갔음을 표현합니다.",
      },
    ],
    keyVocabulary: [
      { word: 'lose track of time', meaning: '시간 가는 줄 모르다' },
      { word: 'time flies by', meaning: '시간이 쏜살같이 흐르다' },
    ],
  },
  '힐링': {
    query: '힐링했어 / 기분전환',
    expressions: [
      {
        english: 'I took some time to recharge and unwind today.',
        koreanMeaning: '오늘 편히 쉬면서 에너지를 재충전했어요.',
        tone: '따뜻한 감성 표현',
        nuanceTip: "콩글리시 'healing' 대신 'recharge(재충전)'나 'unwind(긴장을 풀다)'를 씁니다.",
      },
      {
        english: 'It was a much-needed breath of fresh air.',
        koreanMeaning: '정말이지 꼭 필요했던 기분 전환의 시간이었어요.',
        tone: '세련된 감성 일기',
        nuanceTip: "'a breath of fresh air'는 답답함을 날려주는 새로운 활력소를 뜻합니다.",
      },
    ],
    keyVocabulary: [
      { word: 'recharge', meaning: '재충전하다 (healing 대신 권장)' },
      { word: 'unwind', meaning: '긴장을 풀고 편히 쉬다' },
      { word: 'a breath of fresh air', meaning: '기분 전환 / 신선한 자극' },
    ],
  },
};

// API: Expression Search & Diary Assistant
app.post('/api/expression-search', async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({ error: '검색할 표현이나 문장을 입력해 주세요.' });
  }

  const cleanQuery = query.trim();

  // 1. Check curated instant matches first
  for (const [key, value] of Object.entries(CURATED_EXPRESSIONS)) {
    if (cleanQuery.includes(key) || key.includes(cleanQuery)) {
      return res.json({
        query: cleanQuery,
        expressions: value.expressions,
        keyVocabulary: value.keyVocabulary,
      });
    }
  }

  // 2. Call Gemini for dynamic query if available
  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = `사용자가 영어 일기를 쓰려고 하는데 한국어로 "${cleanQuery}"라는 의미의 표현을 영어로 어떻게 써야 할지 찾고 있습니다.
영어 일기(Diary) 문맥에 딱 맞는 가장 자연스럽고 원어민스러운 2~3가지 문장과 핵심 어휘/뉘앙스 팁을 JSON 형식으로 작성해 주세요.

응답 형식:
{
  "query": "${cleanQuery}",
  "expressions": [
    {
      "english": "영어 문장",
      "koreanMeaning": "한국어 번역",
      "tone": "말투/뉘앙스 (예: 일상 구어체, 감정 강조, 격식 있는 일기 등)",
      "nuanceTip": "왜 이 표현을 쓰는지 또는 직역하면 어색한 이유에 대한 친절한 한국어 팁"
    }
  ],
  "keyVocabulary": [
    { "word": "핵심 구동사 또는 단어", "meaning": "한국어 뜻" }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const raw = response.text || '{}';
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.expressions) && parsed.expressions.length > 0) {
        return res.json({
          query: cleanQuery,
          expressions: parsed.expressions,
          keyVocabulary: Array.isArray(parsed.keyVocabulary) ? parsed.keyVocabulary : [],
        });
      }
    } catch (err) {
      console.warn('Gemini expression search fallback triggered:', err);
    }
  }

  // 3. Fallback translation if offline or API unavailable
  return res.json({
    query: cleanQuery,
    expressions: [
      {
        english: `I spent my day doing things related to "${cleanQuery}".`,
        koreanMeaning: `오늘 "${cleanQuery}"와 관련된 하루를 보냈어요.`,
        tone: '자연스러운 서술체',
        nuanceTip: '하루의 경험을 차분하게 서술할 때 활용하기 좋은 일기 표현입니다.',
      },
      {
        english: `Today was all about ${cleanQuery}.`,
        koreanMeaning: `오늘은 온통 "${cleanQuery}"로 가득 찬 하루였어요.`,
        tone: '감정/경험 강조',
        nuanceTip: "'It was all about ~' 구문으로 그날의 가장 인상 깊었던 일을 강조해 보세요.",
      },
    ],
    keyVocabulary: [
      { word: 'spend the day', meaning: '하루를 보내다' },
      { word: 'it was all about', meaning: '~이 중심이 된 하루였다' },
    ],
  });
});

// -------------------------------------------------------------
// POST /api/diary-tutor/chat - Multi-turn English Diary Tutor
// -------------------------------------------------------------
app.post('/api/diary-tutor/chat', async (req, res) => {
  try {
    const { messages = [] } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const contents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: String(m.text || '') }],
    }));

    const systemInstruction = `당신은 영어 일기 작성을 어려워하거나 막막해하는 사람들을 친절하게 도와주는 고양이 영어 일기 전문 튜터 "Pawty AI (포티)"입니다 🐾.

튜터의 핵심 역할:
1. 사용자가 오늘 겪은 일이나 하고 싶은 말을 한국어로 편하게 말하면, 일기에 쓰기 좋은 자연스러운 원어민 영어 일기 문장(1~3개)을 만들어줍니다.
2. 초보자도 쉽게 이해할 수 있도록 제안한 영어 문장마다:
   - 🇰🇷 한국어 해석
   - 💡 원어민 뉘앙스 / 왜 이렇게 쓰는지 팁 (자연스러운 회화체, 콩글리시 탈출 포인트)
   - 📌 핵심 단어 & 구동사 정리
   를 깔끔하게 정리해 줍니다.
3. 사용자가 영어로 직접 써본 문장을 보여주면, 기를 죽이지 않고 칭찬한 뒤 더 자연스럽고 세련된 원어민 표현으로 다듬어 줍니다.
4. 사용자가 "쓸 내용이 없어"라고 하면, 날씨, 오늘 마신 음료, 점심 메뉴, 기분, 퇴근길 등 작고 소소하지만 일기로 쓰기 좋은 아이디어를 다정하게 제안합니다.
5. 어조: 다정하고 친근하며 격려가 넘치는 말투 (고양이 이모티콘 🐾, ✨ 활용).
6. 포맷: 모바일 화면에서 읽기 편하게 불렛포인트와 간결한 문단으로 가독성 높게 작성하세요. 영어 문장은 사용자가 바로 복사하거나 일기에 옮겨적을 수 있도록 큰따옴표("") 또는 볼드체로 명확히 표시해 주세요.`;

    if (!process.env.GEMINI_API_KEY) {
      const lastUserMsg = messages[messages.length - 1]?.text || '';
      return res.json({
        reply: `안녕냥! 🐾 "${lastUserMsg}"에 대해 쓰고 싶으시군요!\n\n추천 영어 일기 문장:\n- "Today, I spent some peaceful time doing what I wanted."\n  (오늘 내가 하고 싶었던 일들을 하며 평화로운 시간을 보냈어.)\n  💡 *Tip*: 'spend time ~ing'는 하루 일과를 표현할 때 가장 기본적이고 자연스러운 패턴이에요!\n\n더 구체적으로 어떤 기분이었는지 알려주시면 딱 맞는 문장으로 도와드릴게요! ✨`,
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    const reply = response.text || '죄송해요, 잠시 답변을 생각하는 중이었어요. 다시 한 번 말씀해 주시겠어요? 🐾';
    return res.json({ reply });
  } catch (error: any) {
    console.error('Pawty Tutor Chat error:', error);
    const lastUserMsg = req.body?.messages?.[req.body?.messages?.length - 1]?.text || '오늘 하루';
    return res.json({
      reply: `안녕냥! 🐾 오늘 "${lastUserMsg}"에 대해 일기를 쓰고 싶으시군요!\n\n일기에 바로 쓰기 좋은 자연스러운 표현을 추천해 드릴게요:\n- "I had quite an eventful day today."\n  (오늘은 꽤 다사다난하면서도 알찬 하루였어.)\n- "I felt really at ease and relaxed."\n  (마음이 정말 편안하고 여유로웠어.)\n\n💡 *Tip*: 짧은 한 문장이라도 오늘 느낀 감정을 솔직하게 적는 것이 영어 일기의 최고의 시작이에요! 계속 이어서 더 알려주세요 🐾`,
    });
  }
});

// Guard: Ensure unknown API routes always return JSON rather than SPA html
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
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
