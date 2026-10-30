import { CorrectionResult } from '../types/diary';

export const sanitizeCorrectionResult = (raw: any, fallbackText: string): CorrectionResult => {
  const val = typeof raw === 'object' && raw !== null ? raw : {};
  const feedback = typeof val.overallFeedback === 'object' && val.overallFeedback !== null ? val.overallFeedback : {};
  const scores = typeof feedback.scores === 'object' && feedback.scores !== null ? feedback.scores : {};
  const styles = typeof val.styleVariations === 'object' && val.styleVariations !== null ? val.styleVariations : {};

  const cleanBreakdowns: any[] = [];
  if (Array.isArray(val.sentenceBreakdowns)) {
    val.sentenceBreakdowns.forEach((item: any) => {
      if (typeof item === 'object' && item !== null) {
        cleanBreakdowns.push({
          original: String(item.original || ''),
          corrected: String(item.corrected || item.original || ''),
          koreanExplanation: String(item.koreanExplanation || ''),
          konglishAlert: String(item.konglishAlert || ''),
          betterAlternativeWords: Array.isArray(item.betterAlternativeWords)
            ? item.betterAlternativeWords.map((alt: any) => ({
                originalWord: String(alt?.originalWord || ''),
                suggestedWord: String(alt?.suggestedWord || ''),
                reason: String(alt?.reason || ''),
              }))
            : [],
          keyIdiom: typeof item.keyIdiom === 'string' ? item.keyIdiom : '',
          keyIdiomMeaning: typeof item.keyIdiomMeaning === 'string' ? item.keyIdiomMeaning : '',
        });
      }
    });
  }

  const cleanExpressions: any[] = [];
  if (Array.isArray(val.recommendedExpressions)) {
    val.recommendedExpressions.forEach((expr: any) => {
      if (typeof expr === 'object' && expr !== null) {
        cleanExpressions.push({
          expression: String(expr.expression || ''),
          meaning: String(expr.meaning || ''),
          example: String(expr.example || ''),
          category: String(expr.category || '일반'),
        });
      }
    });
  }

  const correctedFull = typeof val.correctedFullText === 'string' && val.correctedFullText.trim()
    ? val.correctedFullText
    : fallbackText;

  return {
    overallFeedback: {
      summary: typeof feedback.summary === 'string'
        ? feedback.summary
        : cleanBreakdowns.length === 0
          ? '수정할 게 없습니다~ 이미 원어민 수준으로 자연스럽고 훌륭한 문장이에요! 🎉'
          : '오늘 하루의 진솔한 생각이 잘 담긴 멋진 일기입니다.',
      cefrLevel: typeof feedback.cefrLevel === 'string' ? feedback.cefrLevel : 'B2 ➔ C1 Native',
      scores: {
        grammar: typeof scores.grammar === 'number' ? scores.grammar : 90,
        naturalness: typeof scores.naturalness === 'number' ? scores.naturalness : 88,
        vocabulary: typeof scores.vocabulary === 'number' ? scores.vocabulary : 86,
      },
      keyTakeaways: Array.isArray(feedback.keyTakeaways)
        ? feedback.keyTakeaways.map(String)
        : ['자연스러운 원어민 표현으로 다듬어졌습니다.'],
    },
    correctedFullText: correctedFull,
    naturalTitle: typeof val.naturalTitle === 'string' ? val.naturalTitle : 'My English Diary',
    styleVariations: {
      casual: typeof styles.casual === 'string' ? styles.casual : correctedFull,
      sophisticated: typeof styles.sophisticated === 'string' ? styles.sophisticated : correctedFull,
      concise: typeof styles.concise === 'string' ? styles.concise : correctedFull,
    },
    sentenceBreakdowns: cleanBreakdowns,
    recommendedExpressions: cleanExpressions,
  };
};

export async function readCorrectionResponse(response: Response): Promise<CorrectionResult> {
  const responseText = await response.text();
  let payload: unknown;

  try {
    payload = JSON.parse(responseText);
  } catch {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html') || /^\s*<!doctype html/i.test(responseText)) {
      throw new Error(
        'AI 피드백 API 대신 웹 페이지가 응답했습니다. 최신 서버를 실행하고 앱을 다시 배포했는지 확인해 주세요.'
      );
    }
    throw new Error('AI 피드백 서버가 올바른 JSON 응답을 반환하지 않았습니다.');
  }

  if (!response.ok) {
    const errorPayload = typeof payload === 'object' && payload !== null ? (payload as any) : {};
    throw new Error(
      [errorPayload.details, errorPayload.error]
        .find((message): message is string => typeof message === 'string' && message.length > 0) ||
        `AI 피드백 요청에 실패했습니다. (HTTP ${response.status})`
    );
  }

  return sanitizeCorrectionResult(payload, '');
}
