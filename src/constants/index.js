export const ToneType = {
  ISOCHRONIC: "Isochronic",
  BINAURAL: "Binaural",
  MONAURAL: "Monaural"
};

export const DEFAULT_VOLUME = 0.5;
export const DEFAULT_ISOCHRONIC_SETTINGS = { 
  frequency: 136.1, 
  modulationFrequency: 7.83, 
  modulationDepth: 50, 
  carrierVolume: 0.8 
};

export const DEFAULT_BINAURAL_SETTINGS = { 
  leftFrequency: 100, 
  rightFrequency: 110 
};

export const DEFAULT_MONAURAL_SETTINGS = { 
  frequency: 200 
};

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
    settings: { leftFrequency: 100, rightFrequency: 110 } 
  },
  { 
    id: 'meditationThetaBinaural', 
    name: "Meditação (Theta Binaurais)", 
    description: "Relaxamento profundo e meditação", 
    toneType: ToneType.BINAURAL, 
    settings: { leftFrequency: 136.1, rightFrequency: 142.1 } 
  },
  { 
    id: 'solfeggio528Iso', 
    name: "Solfeggio 528Hz (Isocrônicos)", 
    description: "Equilíbrio emocional e transformação", 
    toneType: ToneType.ISOCHRONIC, 
    settings: { frequency: 528, modulationFrequency: 7.83, modulationDepth: 50, carrierVolume: 0.8 } 
  },
  { 
    id: 'solfeggio396Monaural', 
    name: "Solfeggio 396Hz (Monaurais)", 
    description: "Liberação de medos e limpeza emocional", 
    toneType: ToneType.MONAURAL, 
    settings: { frequency: 396 } 
  },
  { 
    id: 'astralProjectionThetaIso', 
    name: "Projeção Astral (Theta Isocrônicos)", 
    description: "Estados alterados de consciência", 
    toneType: ToneType.ISOCHRONIC, 
    settings: { frequency: 100, modulationFrequency: 4.5, modulationDepth: 60, carrierVolume: 0.7 } 
  },
  { 
    id: 'healingGeneralIso', 
    name: "Cura Geral (432Hz Isocrônicos)", 
    description: "Harmonização e cura energética", 
    toneType: ToneType.ISOCHRONIC, 
    settings: { frequency: 432, modulationFrequency: 10, modulationDepth: 40, carrierVolume: 0.8 } 
  }
];
