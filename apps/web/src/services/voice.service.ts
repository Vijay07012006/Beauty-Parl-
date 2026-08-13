// Web Speech API interfaces
export interface VoiceServiceRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

export class VoiceService {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private activeUtterance: SpeechSynthesisUtterance | null = null;

  initSpeechRecognition(
    onResult: (text: string, isFinal: boolean) => void,
    onEnd: () => void,
    onError: (err: any) => void
  ) {
    if (typeof window === 'undefined') return null;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech recognition is not supported in this browser.');
      return null;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'en-US';
      this.recognition.continuous = false;
      this.recognition.interimResults = true;

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const text = finalTranscript || interimTranscript;
        const isFinal = finalTranscript.length > 0;
        onResult(text, isFinal);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        onEnd();
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        onError(event);
      };

      return this.recognition;
    } catch (e) {
      console.error('Error initializing SpeechRecognition:', e);
      return null;
    }
  }

  startListening() {
    if (this.recognition && !this.isListening) {
      this.recognition.start();
      this.isListening = true;
      this.stopSpeaking(); // Stop speaking when we start listening
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  speak(text: string, onStart?: () => void, onEnd?: () => void) {
    if (typeof window === 'undefined') return;
    this.synthesis = window.speechSynthesis;
    if (!this.synthesis) return;

    this.stopSpeaking();

    // Strip out markdown formatting (stars, backticks, emojis etc.) for cleaner speech
    const cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/#+\s+([^\n]+)/g, '$1')
      .replace(/-\s+/g, '')
      .replace(/[`_*[\]()]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'en-US';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    if (onStart) utterance.onstart = onStart;
    utterance.onend = () => {
      this.activeUtterance = null;
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      this.activeUtterance = null;
      if (onEnd) onEnd();
    };

    this.activeUtterance = utterance;
    this.synthesis.speak(utterance);
  }

  stopSpeaking() {
    if (typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    if (synth && synth.speaking) {
      synth.cancel();
    }
  }
}
