// SpeechSynthesis utility for native English listening practice

export class SpeechService {
  private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private static currentUtterance: SpeechSynthesisUtterance | null = null;

  public static isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public static stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public static speak(
    text: string,
    options?: {
      rate?: number;
      pitch?: number;
      lang?: string;
      onEnd?: () => void;
      onError?: (err: any) => void;
      onStart?: () => void;
    }
  ): void {
    if (!this.synth) {
      if (options?.onError) options.onError(new Error('Speech synthesis not supported in this browser'));
      return;
    }

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options?.lang || 'en-US';
    utterance.rate = options?.rate || 0.95; // Slightly clear and deliberate for language learners
    utterance.pitch = options?.pitch || 1.0;

    // Pick high quality English voice if available
    const voices = this.synth.getVoices();
    const englishVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    if (options?.onStart) utterance.onstart = options.onStart;
    if (options?.onEnd) utterance.onend = () => {
      this.currentUtterance = null;
      options.onEnd?.();
    };
    if (options?.onError) utterance.onerror = (e) => {
      this.currentUtterance = null;
      options.onError?.(e);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }
}
