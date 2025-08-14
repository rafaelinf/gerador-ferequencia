export const ToneType = {
  ISOCHRONIC: "Isochronic",
  BINAURAL: "Binaural",
  MONAURAL: "Monaural"
};

export const DEFAULT_VOLUME = 0.5;
export const DEFAULT_ISOCHRONIC_SETTINGS = { carrierFreq: 136.1, pulseFreq: 7.83 };
export const DEFAULT_BINAURAL_SETTINGS = { baseFreq: 100, beatFreq: 10 };
export const DEFAULT_MONAURAL_SETTINGS = { freq1: 200, freq2: 205 };

export const FREQUENCY_RANGES = {
  carrierFreq: { min: 20, max: 1500, step: 0.1 },
  pulseFreq:   { min: 0.5, max: 40, step: 0.1 },
  baseFreq:    { min: 20, max: 1500, step: 0.1 },
  beatFreq:    { min: 0.5, max: 50, step: 0.1 },
  freq1:       { min: 20, max: 1500, step: 0.1 },
  freq2:       { min: 20, max: 1500, step: 0.1 }
};

export const TONE_TYPES_CONFIG = [
  { id: ToneType.ISOCHRONIC, label: 'Tons Isocrônicos' },
  { id: ToneType.BINAURAL, label: 'Batidas Binaurais' },
  { id: ToneType.MONAURAL, label: 'Batidas Monaurais' }
];

export const DEFAULT_EXPORT_DURATION_MINUTES = 5;
export const MIN_EXPORT_DURATION_MINUTES = 1;
export const MAX_EXPORT_DURATION_MINUTES = 120;

export const PRESETS = [
  { 
    id: 'focusAlphaBinaural', 
    name: "Foco (Alpha Binaurais)", 
    description: "Para clareza mental e concentração", 
    toneType: ToneType.BINAURAL, 
    settings: { baseFreq: 100, beatFreq: 10 } 
  },
  { 
    id: 'meditationThetaBinaural', 
    name: "Meditação (Theta Binaurais)", 
    description: "Relaxamento profundo e meditação", 
    toneType: ToneType.BINAURAL, 
    settings: { baseFreq: 136.1, beatFreq: 6 } 
  },
  { 
    id: 'solfeggio528Iso', 
    name: "Solfeggio 528Hz (Isocrônicos)", 
    description: "Equilíbrio emocional e transformação", 
    toneType: ToneType.ISOCHRONIC, 
    settings: { carrierFreq: 528, pulseFreq: 7.83 } 
  },
  { 
    id: 'solfeggio396Monaural', 
    name: "Solfeggio 396Hz (Monaurais)", 
    description: "Liberação de medos e limpeza emocional", 
    toneType: ToneType.MONAURAL, 
    settings: { freq1: 396, freq2: 398 } 
  },
  { 
    id: 'astralProjectionThetaIso', 
    name: "Projeção Astral (Theta Isocrônicos)", 
    description: "Estados alterados de consciência", 
    toneType: ToneType.ISOCHRONIC, 
    settings: { carrierFreq: 100, pulseFreq: 4.5 } 
  },
  { 
    id: 'healingGeneralIso', 
    name: "Cura Geral (432Hz Isocrônicos)", 
    description: "Harmonização e cura energética", 
    toneType: ToneType.ISOCHRONIC, 
    settings: { carrierFreq: 432, pulseFreq: 10 } 
  }
];
