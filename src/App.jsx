import { useState, useCallback, useEffect } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { useAudioEngine } from './hooks/useAudioEngine';
import {
  ToneType,
  DEFAULT_VOLUME,
  DEFAULT_ISOCHRONIC_SETTINGS,
  DEFAULT_BINAURAL_SETTINGS,
  DEFAULT_MONAURAL_SETTINGS,
  TONE_TYPES_CONFIG,
  DEFAULT_EXPORT_DURATION_MINUTES,
  MIN_EXPORT_DURATION_MINUTES,
  MAX_EXPORT_DURATION_MINUTES,
  PRESETS
} from './constants';

export default function App() {
  const [selectedToneType, setSelectedToneType] = useState(ToneType.ISOCHRONIC);
  const [isochronicSettings, setIsochronicSettings] = useState(DEFAULT_ISOCHRONIC_SETTINGS);
  const [binauralSettings, setBinauralSettings] = useState(DEFAULT_BINAURAL_SETTINGS);
  const [monauralSettings, setMonauralSettings] = useState(DEFAULT_MONAURAL_SETTINGS);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);

  const [exportDuration, setExportDuration] = useState(DEFAULT_EXPORT_DURATION_MINUTES);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatusMessage, setExportStatusMessage] = useState("");

  const audio = useAudioEngine();
  const { play, stop, isPlaying, setGlobalVolume, exportAudioAsWav } = audio;

  const getCurrentSettings = useCallback(() => {
    switch (selectedToneType) {
      case ToneType.ISOCHRONIC:
        return isochronicSettings;
      case ToneType.BINAURAL:
        return binauralSettings;
      case ToneType.MONAURAL:
        return monauralSettings;
      default:
        return DEFAULT_ISOCHRONIC_SETTINGS;
    }
  }, [selectedToneType, isochronicSettings, binauralSettings, monauralSettings]);

  const handlePlayToggle = useCallback(() => {
    if (isExporting) return;
    
    if (isPlaying) {
      stop();
    } else {
      play(selectedToneType, getCurrentSettings(), volume);
    }
  }, [isPlaying, play, stop, selectedToneType, getCurrentSettings, volume, isExporting]);

  // Atualiza o áudio quando as configurações mudam
  useEffect(() => {
    if (isPlaying && !isExporting) {
      play(selectedToneType, getCurrentSettings(), volume);
    }
  }, [selectedToneType, isochronicSettings, binauralSettings, monauralSettings, volume, isPlaying, isExporting, play, getCurrentSettings]);

  // Para o áudio quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (isPlaying) {
        stop();
      }
    };
  }, [stop, isPlaying]);

  const updateSettings = (newSettings) => {
    if (isExporting) return;
    
    switch (selectedToneType) {
      case ToneType.ISOCHRONIC:
        setIsochronicSettings(prev => ({ ...prev, ...newSettings }));
        break;
      case ToneType.BINAURAL:
        setBinauralSettings(prev => ({ ...prev, ...newSettings }));
        break;
      case ToneType.MONAURAL:
        setMonauralSettings(prev => ({ ...prev, ...newSettings }));
        break;
    }
  };

  const handleToneTypeChange = (type) => {
    if (isPlaying || isExporting) return;
    setSelectedToneType(type);
  };

  const handleVolumeChange = (vol) => {
    if (isExporting) return;
    setVolume(vol);
    setGlobalVolume(vol);
  };

  const handleExportDurationChange = (dur) => {
    if (isExporting) return;
    
    let newDur = Math.max(MIN_EXPORT_DURATION_MINUTES, Math.min(dur, MAX_EXPORT_DURATION_MINUTES));
    if (isNaN(newDur) || !isFinite(newDur)) {
      newDur = DEFAULT_EXPORT_DURATION_MINUTES;
    }
    setExportDuration(newDur);
  };

  const handleExport = useCallback(async () => {
    if (isExporting || isPlaying) {
      setExportStatusMessage(
        isPlaying 
          ? "Pare a reprodução antes de exportar." 
          : "Exportação já em andamento."
      );
      return;
    }

    setIsExporting(true);
    setExportStatusMessage("Inicializando exportação...");
    
    try {
      setExportStatusMessage("Renderizando áudio... Aguarde.");
      await exportAudioAsWav(
        selectedToneType, 
        getCurrentSettings(), 
        volume, 
        exportDuration * 60
      );
      setExportStatusMessage("Exportação concluída! Verifique seus downloads.");
    } catch (err) {
      console.error("Export failed:", err);
      setExportStatusMessage(`Falha na exportação: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportStatusMessage(""), 7000);
    }
  }, [isExporting, isPlaying, exportAudioAsWav, selectedToneType, getCurrentSettings, volume, exportDuration]);

  const handlePresetSelect = useCallback((presetId) => {
    if (isExporting) return;
    
    const preset = PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    
    setSelectedToneType(preset.toneType);
    
    switch (preset.toneType) {
      case ToneType.ISOCHRONIC:
        setIsochronicSettings(preset.settings);
        break;
      case ToneType.BINAURAL:
        setBinauralSettings(preset.settings);
        break;
      case ToneType.MONAURAL:
        setMonauralSettings(preset.settings);
        break;
    }
  }, [isExporting]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-gray-800 shadow-2xl rounded-xl p-6 md:p-8">
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-500">
            Aura Harmonics
          </h1>
          <p className="text-gray-400 mt-2">
            Crie sua experiência auditiva para foco, relaxamento ou meditação.
          </p>
        </header>

        {/* Main Content */}
        <main>
          <ControlPanel
            toneTypesConfig={TONE_TYPES_CONFIG}
            selectedToneType={selectedToneType}
            onToneTypeChange={handleToneTypeChange}
            settings={getCurrentSettings()}
            onSettingsChange={updateSettings}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            onPlayToggle={handlePlayToggle}
            isPlaying={isPlaying}
            onExport={handleExport}
            exportDuration={exportDuration}
            onExportDurationChange={handleExportDurationChange}
            isExporting={isExporting}
            exportStatusMessage={exportStatusMessage}
            presets={PRESETS}
            onPresetSelect={handlePresetSelect}
          />
        </main>

        {/* Footer */}
        <footer className="mt-8 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Aura Harmonics. Todos os direitos reservados.</p>
          <p className="mt-1">Experimente com responsabilidade. Não é um dispositivo médico.</p>
        </footer>
      </div>
    </div>
  );
}
