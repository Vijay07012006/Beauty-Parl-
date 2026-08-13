export class VoiceService {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;
  private activeUtterance: SpeechSynthesisUtterance | null = null;

  init() {
    if (typeof window === 'undefined') return null;
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      throw new Error('Speech recognition not supported in this browser.');
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'en-US';
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    return this.recognition;
  }

  startListening(onInterim?: (text: string) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not initialized.'));
        return;
      }
      this.isListening = true;
      let finalTranscript = '';
      this.stopSpeaking(); // Stop speaking when starting to listen

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript = event.results[i][0].transcript.trim();
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (onInterim && interimTranscript) {
          onInterim(interimTranscript);
        }
        if (finalTranscript) {
          this.isListening = false;
          resolve(finalTranscript);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        reject(new Error(`Voice input error: ${event.error}`));
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (!finalTranscript) {
          reject(new Error('No speech detected.'));
        }
      };

      try {
        this.recognition.start();
      } catch (e) {
        reject(e);
      }
    });
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
