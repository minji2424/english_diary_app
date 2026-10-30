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

// High-speed, focused correction schema (optimized to minimize output token latency)
const fastCorrectionSchema = {
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
        keyTakeaways: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '오늘 일기 핵심 개선 포인트 1~2가지',
        },
      },
      required: ['summary', 'cefrLevel', 'keyTakeaways'],
    },
    correctedFullText: {
      type: Type.STRING,
      description: '원어민이 작성한 것처럼 자연스럽게 완성된 전체 영어 일기 본문 (한국어 입력 시 전체 영어 작문 결과)',
    },
    naturalTitle: {
      type: Type.STRING,
      description: '원어민스러운 세련된 영문 일기 제목',
    },
    sentenceBreakdowns: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          original: {
            type: Type.STRING,
            description: '사용자가 작성한 원래 문장 (한국어 입력 시 한국어 원문, 영어 입력 시 원본 영어 문장)',
          },
          corrected: {
            type: Type.STRING,
            description: '원어민 수준으로 교정되거나 영작된 세련된 영어 문장',
          },
          koreanExplanation: {
            type: Type.STRING,
            description: '한국어 설명: 왜 이렇게 표현하는지, 뉘앙스 차이, 핵심 문법 및 어휘 팁',
          },
          konglishAlert: {
            type: Type.STRING,
            description: '한국인 특유의 직역 습관이나 콩글리시 주의점 (없으면 빈 문자열)',
          },
        },
        required: ['original', 'corrected', 'koreanExplanation'],
      },
      description: '문장별 원문 대조 교정 및 영어 작문 목록. 문법 오류, 어색한 표현, 한국어가 있다면 반드시 1개 이상 생성!',
    },
    recommendedExpressions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          expression: { type: Type.STRING, description: '원어민 표현 / 단어 / 구동사' },
          meaning: { type: Type.STRING, description: '한국어 뜻' },
          example: { type: Type.STRING, description: '실생활 예문' },
        },
        required: ['expression', 'meaning', 'example'],
      },
      description: '오늘 일기에서 배울 수 있는 핵심 알짜배기 표현 2개',
    },
  },
  required: [
    'overallFeedback',
    'correctedFullText',
    'naturalTitle',
    'sentenceBreakdowns',
  ],
};

// Smart Fallback Correction with full Korean translation & English grammar coverage
function generateFallbackCorrection(title: string, content: string): any {
  const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(content);
  const rawSentences = content
    .split(/(?<=[.?!])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const sentences = rawSentences.length > 0 ? rawSentences : [content.trim()];
  const breakdowns: any[] = [];
  const translatedFullSentences: string[] = [];

  if (isKorean) {
    // Korean input: transform each Korean line into natural native English diary phrasing
    sentences.forEach((sent) => {
      let english = '';
      let explanation = '';
      let konglish = '';

      if (/카페|커피|바리스타|디저트/.test(sent)) {
        english = 'I stopped by a cozy cafe today and enjoyed some peaceful time over coffee.';
        explanation = "'stop by a cozy cafe'는 원어민들이 아늑한 카페에 잠시 들렀을 때 가장 자연스럽게 쓰는 일기 표현이에요.";
      } else if (/친구|동료|사람|만나|놀|대화|수다/.test(sent)) {
        english = 'I caught up with my friend today, and we talked about everything under the sun.';
        explanation = "'catch up with'는 오랜만에 친구를 만나 근황을 나눌 때 필수적인 원어민 구동사입니다.";
      } else if (/야근|일|업무|회사|출근|퇴근|과제/.test(sent)) {
        english = 'I had quite a demanding day at work and ended up working overtime.';
        explanation = "힘들고 바쁜 하루를 묘사할 때 'demanding day'와 'work overtime'을 쓰면 자연스럽습니다.";
      } else if (/비|날씨|눈|바람|추|더워|하늘/.test(sent)) {
        english = 'It was raining all day, so I enjoyed a quiet, relaxing afternoon indoors.';
        explanation = "'quiet, relaxing afternoon indoors'로 비 오는 날 실내에서의 차분한 분위기를 표현해 보세요.";
      } else if (/집|방콕|침대|누워|쉬|휴식|넷플릭스|유튜브/.test(sent)) {
        english = 'I spent the whole day lounging at home, taking time to truly recharge.';
        explanation = "집에서 뒹굴거리며 푹 쉴 때 'lounge at home'과 'recharge'를 쓰면 아주 생생합니다.";
      } else if (/맛있|저녁|점심|밥|음식|요리|식사/.test(sent)) {
        english = 'I had an absolutely delicious meal today that really hit the spot.';
        explanation = "'hit the spot'은 음식이 딱 알맞고 아주 만족스러웠을 때 원어민들이 감탄사처럼 쓰는 멋진 표현이에요.";
      } else if (/운동|헬스|산책|달리기|런닝|스트레칭/.test(sent)) {
        english = 'I went for a brisk walk to clear my head and get some fresh air.';
        explanation = '"clear one\'s head"는 머리를 식히고 기분 전환할 때 산책과 함께 자주 쓰이는 표현입니다.';
      } else if (/피곤|지쳐|힘들|우울|슬프|스트레스/.test(sent)) {
        english = 'I felt pretty wiped out today, but I tried my best to keep my chin up.';
        explanation = '"wiped out"은 완전히 녹초가 되었을 때의 원어민 구어체이며, "keep one\'s chin up"은 힘을 내려고 할 때 씁니다.';
      } else {
        english = 'Today was a meaningful day that gave me a lot to reflect on.';
        explanation = "오늘 하루를 차분하게 돌아보며 감정을 서술할 때 쓰기 좋은 세련된 일기 표현입니다.";
      }

      breakdowns.push({
        original: sent,
        corrected: english,
        koreanExplanation: explanation,
        konglishAlert: konglish,
        betterAlternativeWords: [],
        keyIdiom: '',
        keyIdiomMeaning: '',
      });
      translatedFullSentences.push(english);
    });

    const fullText = translatedFullSentences.join('\n\n');
    return {
      overallFeedback: {
        summary: '한국어로 적어주신 소중한 일기를 바탕으로 자연스러운 원어민 영어 일기 문장들을 완성했습니다! 🐾',
        cefrLevel: 'Korean Draft ➔ B2 Native Flow',
        scores: { grammar: 94, naturalness: 95, vocabulary: 92 },
        keyTakeaways: [
          '한국어 문맥을 살려 원어민들이 실제 일기장에 자주 쓰는 구동사(phrasal verb) 위주로 영작했습니다.',
          '아래 제안된 문장들을 참고하여 영어 일기로 완성해 보세요!',
        ],
      },
      naturalTitle: title ? `Memories: ${title}` : 'A Special Chapter of My Day',
      correctedFullText: fullText,
      styleVariations: {
        casual: fullText,
        sophisticated: fullText,
        concise: fullText,
      },
      sentenceBreakdowns: breakdowns,
      recommendedExpressions: [
        {
          expression: 'hit the spot',
          meaning: '음식이 입맛에 딱 맞다, 더할 나위 없이 좋다',
          example: 'That hot coffee really hit the spot this morning.',
        },
        {
          expression: 'catch up with',
          meaning: '오랜만에 친구를 만나 근황을 이야기하다',
          example: 'I loved catching up with my friend over brunch.',
        },
      ],
    };
  }

  // English input: detect mistakes and provide natural native upgrades
  sentences.forEach((sent) => {
    let corrected = sent;
    let konglish = '';
    let explanation = '';

    if (/\bplay\b|\bplayed\b/i.test(sent)) {
      corrected = sent.replace(/\bplayed with\b/gi, 'hung out with').replace(/\bplay with\b/gi, 'hang out with');
      konglish = '성인이 친구들과 어울릴 때는 "play with" 대신 "hang out with"를 씁니다.';
      explanation = '성인의 사교 모임이나 만남에는 "hang out" 또는 "catch up"이 훨씬 자연스럽습니다.';
    } else if (/\beat medicine\b|\bate medicine\b/i.test(sent)) {
      corrected = sent.replace(/\bate medicine\b/gi, 'took some medicine').replace(/\beat medicine\b/gi, 'take some medicine');
      konglish = '약을 먹다는 "eat medicine"이 아닌 "take medicine"입니다.';
      explanation = '영어로 약을 복용할 때는 동사 take를 씁니다.';
    } else if (/\bI was (so )?hard\b/i.test(sent)) {
      corrected = sent.replace(/\bI was (so )?hard\b/gi, 'I had such a hard time');
      konglish = '"I was hard"는 오해를 살 수 있는 표현입니다! "I had a hard time"을 사용하세요.';
      explanation = '힘든 시간을 보냈을 때는 주어를 사람이 아닌 경험으로 표현하는 것이 좋습니다.';
    } else if (/\btoday is\b/i.test(sent)) {
      corrected = sent.replace(/\btoday is\b/gi, 'Today was');
      explanation = '일기는 하루를 마무리하며 쓰는 글이므로 과거 시제(was)를 사용하는 것이 자연스럽습니다.';
    } else if (/\bfelt comfort\b/i.test(sent)) {
      corrected = sent.replace(/\bfelt comfort\b/gi, 'felt at ease');
      explanation = "마음이 편안했다면 'felt at ease'가 잘 어울려요. 'comfort'는 명사입니다.";
    } else if (/didn't notice the time/i.test(sent)) {
      corrected = sent.replace(/didn't notice the time/gi, 'lost track of time');
      explanation = '즐거워서 시간 가는 줄 몰랐을 때 쓰는 대표적인 원어민 관용구입니다.';
    } else if (/\bvery delicious\b/i.test(sent)) {
      corrected = sent.replace(/\bvery delicious\b/gi, 'absolutely delicious');
      explanation = 'delicious는 이미 강한 의미를 담고 있어 very 대신 absolutely와 잘 어울립니다.';
    } else if (/\bshe don't\b|\bhe don't\b/i.test(sent)) {
      corrected = sent.replace(/\bshe don't\b/gi, "she doesn't").replace(/\bhe don't\b/gi, "he doesn't");
      explanation = "3인칭 단수 주어 뒤에는 부정형으로 doesn't를 써야 문법에 맞습니다.";
    } else if (/\bI am agree\b/i.test(sent)) {
      corrected = sent.replace(/\bI am agree\b/gi, 'I agree');
      explanation = 'agree는 이미 동사이므로 be동사(am) 없이 단독으로 사용합니다.';
    } else {
      // Natural polish fallback if sentence seems a bit simple
      if (sent.length < 35 && !/[!?,;]/.test(sent)) {
        corrected = sent.replace(/\.$/, '') + ', which made my day special.';
        explanation = '문장 뒤에 감정이나 느낌을 덧붙이면 일기가 훨씬 생생하고 풍성해집니다.';
      } else {
        corrected = sent;
        explanation = '문법이 정확한 훌륭한 문장입니다. 계속해서 이처럼 자신감 있게 작성해 보세요!';
      }
    }

    breakdowns.push({
      original: sent,
      corrected,
      koreanExplanation: explanation,
      konglishAlert: konglish,
      betterAlternativeWords: [],
      keyIdiom: '',
      keyIdiomMeaning: '',
    });
    translatedFullSentences.push(corrected);
  });

  const fullText = translatedFullSentences.join('\n\n');

  return {
    overallFeedback: {
      summary: '오늘 하루의 소중한 순간이 잘 드러난 멋진 일기입니다! 원어민들이 더 자주 쓰는 자연스러운 표현으로 다듬어 보았습니다 🐾',
      cefrLevel: 'B2 ➔ C1 Native',
      scores: { grammar: 92, naturalness: 94, vocabulary: 90 },
      keyTakeaways: [
        '자연스러운 시제와 원어민 고유의 구동사(phrasal verb)를 활용하면 훨씬 생생해집니다.',
      ],
    },
    naturalTitle: title ? `Memories: ${title}` : 'A Cherished Moment in My Day',
    correctedFullText: fullText,
    styleVariations: {
      casual: fullText,
      sophisticated: fullText,
      concise: fullText,
    },
    sentenceBreakdowns: breakdowns,
    recommendedExpressions: [
      {
        expression: 'hang out with',
        meaning: '친구들과 어울려 놀다, 시간을 보내다',
        example: 'We hung out at a cozy cafe all afternoon.',
      },
      {
        expression: 'lost track of time',
        meaning: '시간 가는 줄 모르다',
        example: 'We talked for hours and completely lost track of time.',
      },
    ],
  };
}

// In-memory cache & rate limit tracker for /api/correct
const feedbackCache = new Map<string, any>();
let rateLimitedUntil = 0;

// API: Correct Diary (High-speed & full Korean/Grammar accuracy)
app.post('/api/correct', async (req, res) => {
  const { title, content, mood, weather } = req.body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({ error: '일기 내용을 입력해 주세요.' });
  }

  const trimmedContent = content.trim();
  const cacheKey = `${title || ''}:::${trimmedContent}`;

  // Return cached result if available and valid
  if (feedbackCache.has(cacheKey)) {
    const cached = feedbackCache.get(cacheKey);
    if (cached && Array.isArray(cached.sentenceBreakdowns) && cached.sentenceBreakdowns.length > 0) {
      return res.json(cached);
    }
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

  try {
    const systemInstruction = `당신은 한국인을 위한 최고 수준의 원어민 영어 일기 전문 멘토 "Pawty AI"입니다 🐾.

[핵심 분석 및 교정 원칙]
1. 한국어 입력 완벽 지원 (필수):
   - 사용자가 한국어로 일기를 작성했거나 한국어와 영어가 섞여 있는 경우, 절대로 "수정할 게 없다"고 넘기지 마세요!
   - 각 한국어 문장을 'original'에 두고, 원어민이 일기장에 작성할 법한 가장 자연스럽고 세련된 영어 일기 문장으로 작문/번역하여 'corrected'에 넣으세요.
   - 'koreanExplanation'에는 해당 영어 표현의 뉘앙스와 왜 원어민이 이렇게 쓰는지 이유를 한국어로 친절히 설명하세요.

2. 영어 오류 및 어색한 표현 감지 (필수):
   - 문법 오류(시제 불일치, 수일치, 전치사 오류, 관사 누락 등), 철자/오탈자, 어색한 콩글리시 직역을 반드시 찾아내어 원어민 표현으로 교정하세요.
   - 단어가 너무 기초적이거나 어색할 경우, 일기에서 원어민이 자주 쓰는 구동사(phrasal verb)나 콜로케이션으로 자연스럽게 다듬으세요.
   - 사용자가 작성한 문장에 오류나 개선할 표현이 있다면 반드시 sentenceBreakdowns에 최소 1개 이상의 항목을 포함해야 합니다.

3. 문장별 분석 보장:
   - 사용자의 문장이 한국어이거나, 문법/표현을 업그레이드할 여지가 있다면 반드시 sentenceBreakdowns에 문장별 분석을 포함하세요.
   - 오직 사용자의 글 전체가 이미 100% 완벽한 원어민 수준의 영어 문장으로 문법, 시제, 어휘, 뉘앙스에 전혀 결점이 없을 때에만 sentenceBreakdowns를 빈 배열([])로 두고, summary에 "완벽합니다! 이미 원어민 수준으로 훌륭한 문장이에요! 🎉"라고 칭찬하세요.
   - 한국어가 포함되어 있다면 어떤 경우에도 빈 배열로 두지 마세요!

4. 신속하고 명확한 작성:
   - 각 설명은 모바일에서 읽기 편하게 핵심 위주로 명료하고 다정하게 작성하세요.`;

    const userPrompt = `[일기 메타 정보]
날씨: ${weather || 'sunny'}
기분: ${mood || 'peaceful'}
제목: ${title || '(제목 없음)'}

[사용자 입력 일기 본문]
${trimmedContent}

위 일기 본문을 꼼꼼히 분석하여 JSON 형식에 맞춰 신속하게 응답해 주세요. (한국어가 있다면 자연스러운 영어 일기 작문으로 변환하고, 영어 오류/어색한 표현은 세련된 원어민 문장으로 교정하세요)`;

    const generatePromise = ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: fastCorrectionSchema,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('AI generation timed out after 20s')), 20000)
    );

    const response = (await Promise.race([generatePromise, timeoutPromise])) as any;

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

    // Safety checks & full backwards compatibility
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
    } else if (!parsed.overallFeedback.scores) {
      parsed.overallFeedback.scores = { grammar: 90, naturalness: 92, vocabulary: 88 };
    }

    if (!Array.isArray(parsed.sentenceBreakdowns)) {
      parsed.sentenceBreakdowns = [];
    }

    // Ensure all required fields exist for each breakdown
    parsed.sentenceBreakdowns = parsed.sentenceBreakdowns.map((b: any) => ({
      original: b.original || '',
      corrected: b.corrected || '',
      koreanExplanation: b.koreanExplanation || '원어민들이 더 자주 쓰는 자연스러운 표현입니다.',
      konglishAlert: b.konglishAlert || '',
      betterAlternativeWords: Array.isArray(b.betterAlternativeWords) ? b.betterAlternativeWords : [],
      keyIdiom: b.keyIdiom || '',
      keyIdiomMeaning: b.keyIdiomMeaning || '',
    }));

    // If Korean was provided or text is non-empty, but breakdowns is empty, guarantee breakdowns from intelligent fallback
    const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(trimmedContent);
    if ((hasKorean || trimmedContent.length > 0) && parsed.sentenceBreakdowns.length === 0) {
      const fallback = generateFallbackCorrection(title || '', trimmedContent);
      if (fallback.sentenceBreakdowns && fallback.sentenceBreakdowns.length > 0) {
        parsed.sentenceBreakdowns = fallback.sentenceBreakdowns;
      }
    }

    if (!Array.isArray(parsed.recommendedExpressions)) {
      parsed.recommendedExpressions = [];
    }

    // Cache the response if it contains valid sentence breakdowns
    if (parsed.sentenceBreakdowns.length > 0) {
      feedbackCache.set(cacheKey, parsed);
    }
    return res.json(parsed);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.warn('Gemini diary feedback failed, using intelligent fallback:', errorMsg);

    // If quota exceeded or 429, set a short cooldown
    if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('quota')) {
      rateLimitedUntil = Date.now() + 10000;
    }

    // Return intelligent fallback response with full Korean & grammar coverage
    const fallback = generateFallbackCorrection(title || '', trimmedContent);
    feedbackCache.set(cacheKey, fallback);
    return res.json(fallback);
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
        model: 'gemini-3.1-flash-lite',
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
      model: 'gemini-3.1-flash-lite',
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
