export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy' | 'night';

export type MoodType = 
  | 'happy' 
  | 'peaceful' 
  | 'productive' 
  | 'tired' 
  | 'thoughtful' 
  | 'excited' 
  | 'melancholy'
  | 'grateful';

export type CatId =
  | 'momo'
  | 'neuru'
  | 'hodu'
  | 'dubu'
  | 'tori'
  | 'sogeum'
  | 'mouse_cat'
  | 'double_yarn'
  | 'paw'
  | 'fish';

export interface WordAlternative {
  originalWord: string;
  suggestedWord: string;
  reason: string;
}

export interface SentenceBreakdown {
  original: string;
  corrected: string;
  koreanExplanation: string;
  konglishAlert: string;
  betterAlternativeWords: WordAlternative[];
  keyIdiom?: string;
  keyIdiomMeaning?: string;
  categoryTag?: string; // e.g. '감정을 표현하는 말', '일상에서 자주 쓰는 표현'
}

export interface RecommendedExpression {
  expression: string;
  meaning: string;
  example: string;
  category: string;
}

export interface CorrectionResult {
  overallFeedback: {
    summary: string;
    cefrLevel: string;
    scores: {
      grammar: number;
      naturalness: number;
      vocabulary: number;
    };
    keyTakeaways: string[];
  };
  correctedFullText: string;
  naturalTitle: string;
  styleVariations: {
    casual: string;
    sophisticated: string;
    concise: string;
  };
  sentenceBreakdowns: SentenceBreakdown[];
  recommendedExpressions: RecommendedExpression[];
}

export interface DiaryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  weather: WeatherType;
  mood: MoodType;
  originalTitle: string;
  originalContent: string;
  wordCount: number;
  stamp?: string;
  catId?: CatId;
  catName?: string;
  catTitle?: string;
  customDrawingUrl?: string; // Data URL of the user's hand-drawn cat illustration
  photoUrl?: string;
  photoUrls?: string[];
  correctionResult?: CorrectionResult;
  preferredStyle?: 'standard' | 'casual' | 'sophisticated' | 'concise';
  savedWithPolish?: boolean;
}

export interface SavedExpression {
  id: string;
  expression: string;
  meaning: string;
  example?: string;
  category?: string;
  sourceDiaryId?: string;
  savedAt: string;
  mastered: boolean;
}

export interface PromptSpark {
  id: string;
  topicKo: string;
  promptKo: string;
  promptEn: string;
  starter: string;
  category: string;
}
