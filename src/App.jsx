import React, { useState, useCallback } from 'react';
import { Headphones, Download } from 'lucide-react';
import ControlPanel from './components/ControlPanel';
import { ToneType, DEFAULT_ISOCHRONIC_SETTINGS, DEFAULT_BINAURAL_SETTINGS, DEFAULT_MONAURAL_SETTINGS } from './constants';

export default function App() {
  // Estados para frequências
  const [selectedToneType, setSelectedToneType] = useState(ToneType.ISOCHRONIC);
  const [isochronicSettings, setIsochronicSettings] = useState(DEFAULT_ISOCHRONIC_SETTINGS);
  const [binauralSettings, setBinauralSettings] = useState(DEFAULT_BINAURAL_SETTINGS);
  const [monauralSettings, setMonauralSettings] = useState(DEFAULT_MONAURAL_SETTINGS);
  const [volume, setVolume] = useState(0.5);

  // Estados para música
  const [audioFile, setAudioFile] = useState(null);

  // Handlers para frequências
  const handleToneTypeChange = useCallback((type) => {
    setSelectedToneType(type);
  }, []);

  const handleSettingsChange = useCallback((newSettings) => {
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
  }, [selectedToneType]);

  const handleVolumeChange = useCallback((vol) => {
    setVolume(vol);
  }, []);

  // Handlers para música
  const handleMusicLoaded = useCallback((file) => {
    setAudioFile(file);
  }, []);

  const handleMusicPlayPause = useCallback((isPlaying) => {
    // Aqui você pode adicionar lógica adicional se necessário
    console.log('Música:', isPlaying ? 'tocando' : 'pausada');
  }, []);

  const handleMusicStop = useCallback(() => {
    // Aqui você pode adicionar lógica adicional se necessário
    console.log('Música parada');
  }, []);

  const handleMusicVolumeChange = useCallback((vol) => {
    // Aqui você pode adicionar lógica adicional se necessário
    console.log('Volume da música:', vol);
  }, []);

  // Handler para exportação
  const handleExport = useCallback((exportData) => {
    console.log('Exportando mix:', exportData);
    // Aqui você pode implementar a lógica de exportação
    alert('Funcionalidade de exportação será implementada em breve!');
  }, []);

  // Obter configurações atuais
  const getCurrentSettings = () => {
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-fuchsia-50 to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Headphones className="w-8 h-8 text-violet-600" />
              <h1 className="text-2xl font-bold text-gray-900">Instituto Luz de Lótus - Aura Harmonics</h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Download className="w-4 h-4" />
              <span>Gerador de Frequências</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ControlPanel
          selectedToneType={selectedToneType}
          onToneTypeChange={handleToneTypeChange}
          settings={getCurrentSettings()}
          onSettingsChange={handleSettingsChange}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          audioFile={audioFile}
          onMusicLoaded={handleMusicLoaded}
          onMusicPlayPause={handleMusicPlayPause}
          onMusicStop={handleMusicStop}
          onMusicVolumeChange={handleMusicVolumeChange}
          onExport={handleExport}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>
              Instituto Luz de Lótus - Aura Harmonics - Gerador de Frequências Sonoras
            </p>
            <p className="mt-2">
              Use com responsabilidade. As frequências sonoras podem ter efeitos terapêuticos.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
