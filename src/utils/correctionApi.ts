import { CorrectionResult } from '../types/diary';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isSentenceBreakdown = (value: unknown): boolean => {
  if (!isRecord(value) || !Array.isArray(value.betterAlternativeWords)) return false;
  return (
    typeof value.original === 'string' &&
    typeof value.corrected === 'string' &&
    typeof value.koreanExplanation === 'string' &&
    typeof value.konglishAlert === 'string' &&
    value.betterAlternativeWords.every(
      (alternative) =>
        isRecord(alternative) &&
        typeof alternative.originalWord === 'string' &&
        typeof alternative.suggestedWord === 'string' &&
        typeof alternative.reason === 'string'
    )
  );
};

const isRecommendedExpression = (value: unknown): boolean =>
  isRecord(value) &&
  typeof value.expression === 'string' &&
  typeof value.meaning === 'string' &&
  typeof value.example === 'string' &&
  typeof value.category === 'string';

const isCorrectionResult = (value: unknown): value is CorrectionResult => {
  if (!isRecord(value) || !isRecord(value.overallFeedback) || !isRecord(value.styleVariations)) {
    return false;
  }

  const feedback = value.overallFeedback;
  const scores = feedback.scores;
  const styles = value.styleVariations;

  return (
    typeof feedback.summary === 'string' &&
    typeof feedback.cefrLevel === 'string' &&
    isRecord(scores) &&
    typeof scores.grammar === 'number' &&
    typeof scores.naturalness === 'number' &&
    typeof scores.vocabulary === 'number' &&
    Array.isArray(feedback.keyTakeaways) &&
    feedback.keyTakeaways.every((item) => typeof item === 'string') &&
    typeof value.correctedFullText === 'string' &&
    typeof value.naturalTitle === 'string' &&
    typeof styles.casual === 'string' &&
    typeof styles.sophisticated === 'string' &&
    typeof styles.concise === 'string' &&
    Array.isArray(value.sentenceBreakdowns) &&
    value.sentenceBreakdowns.every(isSentenceBreakdown) &&
    Array.isArray(value.recommendedExpressions) &&
    value.recommendedExpressions.every(isRecommendedExpression)
  );
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
    const errorPayload = isRecord(payload) ? payload : {};
    throw new Error(
      [errorPayload.details, errorPayload.error]
        .find((message): message is string => typeof message === 'string' && message.length > 0) ||
        `AI 피드백 요청에 실패했습니다. (HTTP ${response.status})`
    );
  }

  if (!isCorrectionResult(payload)) {
    throw new Error('AI 피드백 응답 형식이 올바르지 않습니다.');
  }

  return payload;
}
