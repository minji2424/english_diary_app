import { DiaryEntry, SavedExpression } from '../types/diary';

const DIARIES_KEY = 'pawty_diaries_v4';
const EXPRESSIONS_KEY = 'pawty_expressions_user_saved_v5';

export function getStoredDiaries(): DiaryEntry[] {
  try {
    const raw = localStorage.getItem(DIARIES_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error('Stored diaries must be an array');
    }

    const diaries = (parsed as DiaryEntry[]).filter((diary) => diary.id !== 'pawty-1');
    if (diaries.length !== parsed.length) {
      saveDiaries(diaries);
    }
    return diaries;
  } catch (e) {
    console.error('Failed to parse diaries from localStorage', e);
    return [];
  }
}

export function saveDiaries(diaries: DiaryEntry[]): void {
  try {
    localStorage.setItem(DIARIES_KEY, JSON.stringify(diaries));
  } catch (e) {
    console.error('Failed to save diaries to localStorage', e);
  }
}

export function getStoredExpressions(): SavedExpression[] {
  try {
    const raw = localStorage.getItem(EXPRESSIONS_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse expressions from localStorage', e);
    return [];
  }
}

export function saveExpressions(expressions: SavedExpression[]): void {
  try {
    localStorage.setItem(EXPRESSIONS_KEY, JSON.stringify(expressions));
  } catch (e) {
    console.error('Failed to save expressions to localStorage', e);
  }
}

export function calculateWritingStreak(diaries: DiaryEntry[]): number {
  if (diaries.length === 0) return 0;

  const uniqueDates = Array.from(new Set(diaries.map((d) => d.date)))
    .sort()
    .reverse();
  if (uniqueDates.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterday = yesterdayDate.toISOString().split('T')[0];

  const latestDate = uniqueDates[0];
  if (latestDate !== today && latestDate !== yesterday) {
    return 0;
  }

  let streak = 1;
  let currentDate = new Date(latestDate);

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i]);
    const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
      currentDate = prevDate;
    } else {
      break;
    }
  }

  return streak;
}
