'use client';

import { Volume2, VolumeX, Mic, MicOff } from 'lucide-react';

interface VoiceSettingsProps {
  ttsEnabled: boolean;
  onTtsChange: (enabled: boolean) => void;
  sttEnabled: boolean;
  onSttChange: (enabled: boolean) => void;
}

export function VoiceSettings({
  ttsEnabled,
  onTtsChange,
  sttEnabled,
  onSttChange,
}: VoiceSettingsProps) {
  return (
    <div className="flex items-center gap-4 bg-secondary/20 border border-border/40 px-3 py-2 rounded-2xl">
      {/* Voice Output (TTS) */}
      <button
        onClick={() => onTtsChange(!ttsEnabled)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
          ttsEnabled
            ? 'bg-primary/20 text-primary border border-primary/20'
            : 'bg-card border border-border/30 text-muted-foreground hover:text-foreground'
        }`}
        title={ttsEnabled ? 'Disable JARVIS voice response' : 'Enable JARVIS voice response'}
      >
        {ttsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        <span>{ttsEnabled ? 'Voice Resp: On' : 'Voice Resp: Off'}</span>
      </button>

      {/* Voice Input (STT) */}
      <button
        onClick={() => onSttChange(!sttEnabled)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
          sttEnabled
            ? 'bg-primary/20 text-primary border border-primary/20'
            : 'bg-card border border-border/30 text-muted-foreground hover:text-foreground'
        }`}
        title={sttEnabled ? 'Disable Voice Commands input' : 'Enable Voice Commands input'}
      >
        {sttEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
        <span>{sttEnabled ? 'Voice Input: On' : 'Voice Input: Off'}</span>
      </button>
    </div>
  );
}
