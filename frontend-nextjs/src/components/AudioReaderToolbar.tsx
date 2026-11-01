import React, { useState } from 'react';

interface AudioToolbarProps {
  textToRead: string;
  subject?: string;
  activeTab?: string;
  onAmbienceChange?: (ambience: 'off' | 'rain' | 'forest') => void;
  onFontSizeChange?: (size: 'normal' | 'large' | 'xlarge') => void;
  onThemeChange?: (theme: 'dark' | 'sepia' | 'contrast') => void;
}

export default function AudioReaderToolbar({
  textToRead,
  subject,
  activeTab,
  onAmbienceChange,
  onFontSizeChange,
  onThemeChange
}: AudioToolbarProps) {
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [rate, setRate] = useState<number>(1.0);
  const [ambient, setAmbient] = useState<'off' | 'rain' | 'forest'>('off');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [themeMode, setThemeMode] = useState<'dark' | 'sepia' | 'contrast'>('dark');
  const [activeAudioSource, setActiveAudioSource] = useState<any>(null);
  const [activeAudioCtx, setActiveAudioCtx] = useState<any>(null);

  const isHindi = subject?.toLowerCase().includes('hindi');

  const stopAmbience = () => {
    try {
      if (activeAudioSource) {
        activeAudioSource.stop();
        activeAudioSource.disconnect();
      }
      if (activeAudioCtx && activeAudioCtx.state !== 'closed') {
        activeAudioCtx.close();
      }
    } catch {}
    setActiveAudioSource(null);
    setActiveAudioCtx(null);
  };

  const handleToggleAmbience = (type: 'off' | 'rain' | 'forest') => {
    stopAmbience();
    setAmbient(type);
    if (onAmbienceChange) onAmbienceChange(type);

    if (type === 'off') return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const bufferSize = ctx.sampleRate * 3;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        output[i] *= type === 'rain' ? 0.08 : 0.05;
        b6 = white * 0.115926;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = type === 'rain' ? 'lowpass' : 'bandpass';
      filter.frequency.value = type === 'rain' ? 800 : 1200;

      const gain = ctx.createGain();
      gain.gain.value = 0.25;

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      whiteNoise.start(0);

      setActiveAudioSource(whiteNoise);
      setActiveAudioCtx(ctx);
    } catch (err) {
      console.warn('Web Audio API playback error:', err);
    }
  };

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = rate;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const changeRate = (newRate: number) => {
    setRate(newRate);
    if (isSpeaking && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = newRate;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleFontChange = (sz: 'normal' | 'large' | 'xlarge') => {
    setFontSize(sz);
    if (onFontSizeChange) onFontSizeChange(sz);
  };

  const handleThemeModeChange = (th: 'dark' | 'sepia' | 'contrast') => {
    setThemeMode(th);
    if (onThemeChange) onThemeChange(th);
  };

  if (isHindi || !textToRead) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gradient-to-r from-indigo-50/90 via-teal-50/50 to-indigo-50/90 border border-indigo-200/80 rounded-2xl shadow-xs backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={handleToggleSpeech}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02]"
        >
          <span>{isSpeaking ? '⏸ Stop Narration' : `🔊 Listen to Active ${activeTab || 'Section'}`}</span>
        </button>
        <span className="text-xs font-bold text-slate-600 hidden sm:inline">
          {isSpeaking ? `Narrating active ${activeTab || 'section'} aloud...` : 'Audio Assistant Ready'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Speed Controls */}
        <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 shadow-xs">
          <span>Speed:</span>
          {[0.75, 1.0, 1.25].map((r) => (
            <button
              key={r}
              onClick={() => changeRate(r)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold transition-all ${rate === r ? 'bg-indigo-600 text-white shadow-xs' : 'hover:bg-slate-100 text-slate-600'}`}
            >
              {r}x
            </button>
          ))}
        </div>

        {/* Reading Comfort Font Size */}
        <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 shadow-xs">
          <span>Font:</span>
          <button
            onClick={() => handleFontChange('normal')}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold ${fontSize === 'normal' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            Aa
          </button>
          <button
            onClick={() => handleFontChange('large')}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold ${fontSize === 'large' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            Aa+
          </button>
        </div>

        {/* Ambient Soundscapes */}
        <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 shadow-xs">
          <span>Ambience:</span>
          <button
            onClick={() => handleToggleAmbience('off')}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${ambient === 'off' ? 'bg-slate-900 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
            Off
          </button>
          <button
            onClick={() => handleToggleAmbience('rain')}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${ambient === 'rain' ? 'bg-teal-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
            title="Calming Rainfall Soundscape"
          >
            🌧️ Rain
          </button>
          <button
            onClick={() => handleToggleAmbience('forest')}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${ambient === 'forest' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
            title="Relaxing Forest Soundscape"
          >
            🍃 Forest
          </button>
        </div>
      </div>
    </div>
  );
}
