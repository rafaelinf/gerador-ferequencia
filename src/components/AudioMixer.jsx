import { useState, useEffect } from 'react';
import { Sliders, Volume2, Download, Play, Pause, Square, Music, Zap, Settings } from 'lucide-react';

export function AudioMixer({
  audioFile,
  toneType,
  toneSettings,
  toneVolume,
  isExporting,
  onExport,
  onFrequenciesVolumeChange,
  onMixerFrequenciesPlay,
  onMixerMusicPlay,
  onMixerStop,
  // Novos estados do mixer
  mixerFrequenciesPlaying,
  mixerMusicPlaying
}) {
  const [isMixing, setIsMixing] = useState(false);
  const [mixProgress, setMixProgress] = useState(0);
  const [mixStatus, setMixStatus] = useState('');
  const [musicVolume, setMusicVolume] = useState(0.7);
  const [frequenciesVolume, setFrequenciesVolume] = useState(0.5);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewAudio, setPreviewAudio] = useState(null);
  const [mixQuality, setMixQuality] = useState('high'); // 'low', 'medium', 'high'

  // Debug logs
  console.log('AudioMixer renderizado com:', {
    audioFile,
    toneType,
    toneSettings,
    toneVolume,
    isExporting,
    onExport: !!onExport,
    onFrequenciesVolumeChange: !!onFrequenciesVolumeChange,
    onMixerFrequenciesPlay: !!onMixerFrequenciesPlay,
    onMixerMusicPlay: !!onMixerMusicPlay,
    onMixerStop: !!onMixerStop,
    mixerFrequenciesPlaying,
    mixerMusicPlaying
  });

  // Handlers para controle independente
  const handleFrequenciesPlay = () => {
    if (onMixerFrequenciesPlay) {
      onMixerFrequenciesPlay();
    }
  };

  const handleMusicPlay = () => {
    if (onMixerMusicPlay) {
      onMixerMusicPlay();
    }
  };

  const handleStop = () => {
    if (onMixerStop) {
      onMixerStop();
    }
  };

  const handleMix = async () => {
    if (!audioFile || isExporting) return;

    console.log('Iniciando mixagem...', { audioFile, toneType, toneSettings });

    setIsMixing(true);
    setMixProgress(0);
    setMixStatus('Inicializando mixer...');

    // Simular processo de mixagem
    const steps = mixQuality === 'low' ? 3 : mixQuality === 'medium' ? 5 : 8;
    const stepDelay = mixQuality === 'low' ? 200 : mixQuality === 'medium' ? 300 : 400;

    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDelay));
      const progress = (i / steps) * 100;
      setMixProgress(progress);
      
      switch (i) {
        case 1:
          setMixStatus('Carregando arquivos de áudio...');
          break;
        case 2:
          setMixStatus('Processando frequências...');
          break;
        case 3:
          setMixStatus('Aplicando efeitos de mixagem...');
          break;
        case 4:
          setMixStatus('Otimizando qualidade...');
          break;
        case 5:
          setMixStatus('Finalizando mix...');
          break;
        case 6:
          setMixStatus('Renderizando áudio...');
          break;
        case 7:
          setMixStatus('Aplicando compressão...');
          break;
        case 8:
          setMixStatus('Mix concluído!');
          break;
        default:
          setMixStatus('Processando...');
      }
    }

    // Criar arquivo de preview
    const previewFile = {
      name: `mix_${audioFile.name.replace(/\.[^/.]+$/, '')}_${toneType}.wav`,
      size: Math.floor(audioFile.size * 1.2), // Simular tamanho do arquivo mixado
      duration: audioFile.duration,
      type: 'audio/wav'
    };

    setPreviewAudio(previewFile);
    setIsMixing(false);
    setMixProgress(0);
    setMixStatus('');
  };

  const handlePreviewPlay = () => {
    setIsPreviewPlaying(true);
    // Aqui você pode implementar a lógica de preview real
    setTimeout(() => setIsPreviewPlaying(false), 5000); // Simular 5 segundos de preview
  };

  const handlePreviewStop = () => {
    setIsPreviewPlaying(false);
  };

  const handleExport = () => {
    if (!previewAudio || !onExport) return;

    const mixData = {
      audioFile,
      toneType,
      toneSettings,
      musicVolume,
      frequenciesVolume,
      mixQuality
    };

    onExport(mixData);
  };

  // Atualizar volumes em tempo real
  useEffect(() => {
    if (audioFile) {
      // Aqui você pode adicionar lógica para atualizar volumes em tempo real
      // Por enquanto, os volumes são aplicados apenas na exportação
    }
  }, [musicVolume, frequenciesVolume, audioFile]);

  const canMix = audioFile && !isExporting && !isMixing;
  const canPreview = previewAudio && !isExporting;
  const canExport = previewAudio && !isExporting;

  const getQualityInfo = () => {
    switch (mixQuality) {
      case 'low':
        return { label: 'Baixa', description: 'Processamento rápido, qualidade menor', color: 'text-yellow-400' };
      case 'medium':
        return { label: 'Média', description: 'Equilibrio entre velocidade e qualidade', color: 'text-blue-400' };
      case 'high':
        return { label: 'Alta', description: 'Melhor qualidade, processamento mais lento', color: 'text-emerald-400' };
      default:
        return { label: 'Média', description: 'Equilibrio entre velocidade e qualidade', color: 'text-blue-400' };
    }
  };

  const qualityInfo = getQualityInfo();

  return (
    <div className="card">
      <div className="card-header">
        <Sliders className="w-5 h-5 mr-2 text-emerald-400" />
        Mixer de Áudio
      </div>

      {/* Debug info */}
      <div className="bg-gray-800 p-2 rounded text-xs text-gray-400 mb-4">
        <p>Debug: audioFile = {audioFile ? 'Sim' : 'Não'}</p>
        <p>Debug: toneType = {toneType}</p>
        <p>Debug: onExport = {onExport ? 'Sim' : 'Não'}</p>
      </div>

      {!audioFile ? (
        <div className="text-center py-8 text-gray-400">
          <Sliders className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Faça upload de uma música para começar a mixar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Controles de Áudio Independentes */}
          <div className="bg-gray-800 p-3 rounded-lg border border-gray-600/30">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Controles de Áudio</h4>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Controle de Frequências */}
              <div className="text-center">
                <h5 className="text-xs font-medium text-gray-400 mb-2">🎵 Frequências</h5>
                <div className="space-y-2">
                  <button
                    onClick={handleFrequenciesPlay}
                    disabled={mixerFrequenciesPlaying || isExporting}
                    className={`w-full py-2 px-3 rounded text-xs font-medium transition-colors ${
                      mixerFrequenciesPlaying
                        ? 'bg-violet-600 text-white'
                        : 'bg-violet-500 hover:bg-violet-600 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {mixerFrequenciesPlaying ? 'Tocando' : 'Tocar Frequências'}
                  </button>
                  <button
                    onClick={handleStop}
                    disabled={!mixerFrequenciesPlaying || isExporting}
                    className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ⏹️ Parar Frequências
                  </button>
                  <div className="text-xs text-gray-500">
                    {toneType}: {Object.values(toneSettings)[0]?.toFixed(1)}Hz
                  </div>
                </div>
              </div>

              {/* Controle de Música */}
              <div className="text-center">
                <h5 className="text-xs font-medium text-gray-400 mb-2">🎼 Música</h5>
                <div className="space-y-2">
                  <button
                    onClick={handleMusicPlay}
                    disabled={mixerMusicPlaying || isExporting}
                    className={`w-full py-2 px-3 rounded text-xs font-medium transition-colors ${
                      mixerMusicPlaying
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {mixerMusicPlaying ? 'Tocando' : 'Tocar Música'}
                  </button>
                  <button
                    onClick={handleStop}
                    disabled={!mixerMusicPlaying || isExporting}
                    className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ⏹️ Parar Música
                  </button>
                  <div className="text-xs text-gray-500">
                    {audioFile?.name?.substring(0, 15)}...
                  </div>
                </div>
              </div>
            </div>

            {/* Botão Parar Tudo */}
            <div className="mt-3 pt-3 border-t border-gray-600/30">
              <button
                onClick={handleStop}
                disabled={!mixerFrequenciesPlaying && !mixerMusicPlaying}
                className="w-full py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ⏹️ Parar Tudo
              </button>
            </div>
          </div>

          {/* Configurações de Mix */}
          <div className="responsive-grid">
            {/* Volume da Música */}
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-600/30">
              <label className="form-label">
                <Music className="w-4 h-4 inline mr-2" />
                Volume da Música
              </label>
              <div className="volume-control">
                <Volume2 className="w-4 h-4 text-gray-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                  disabled={isMixing || isExporting}
                  className="volume-slider"
                />
                <span className="text-sm text-gray-400 w-12 text-right">
                  {(musicVolume * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Volume das Frequências */}
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-600/30">
              <label className="form-label">
                <Zap className="w-4 h-4 inline mr-2" />
                Volume das Frequências
              </label>
              <div className="volume-control">
                <Volume2 className="w-4 h-4 text-gray-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={frequenciesVolume}
                  onChange={(e) => {
                    const newVolume = parseFloat(e.target.value);
                    setFrequenciesVolume(newVolume);
                    if (onFrequenciesVolumeChange) {
                      onFrequenciesVolumeChange(newVolume);
                    }
                  }}
                  disabled={isMixing || isExporting}
                  className="volume-slider"
                />
                <span className="text-sm text-gray-400 w-12 text-right">
                  {(frequenciesVolume * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Qualidade do Mix */}
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-600/30">
              <label className="form-label">
                <Settings className="w-4 h-4 inline mr-2" />
                Qualidade do Mix
              </label>
              <select
                value={mixQuality}
                onChange={(e) => setMixQuality(e.target.value)}
                disabled={isMixing || isExporting}
                className="form-input mt-2"
              >
                <option value="low">Baixa (Rápido)</option>
                <option value="medium">Média (Equilibrado)</option>
                <option value="high">Alta (Melhor)</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {qualityInfo.description}
              </p>
            </div>
          </div>

          {/* Informações do Mix */}
          <div className="bg-gray-800 p-3 rounded-lg border border-gray-600/30">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Configuração do Mix</h4>
            <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
              <div>
                <p><strong>Música:</strong> {audioFile.name}</p>
                <p><strong>Duração:</strong> {Math.floor(audioFile.duration / 60)}:{(audioFile.duration % 60).toFixed(0).padStart(2, '0')}</p>
                <p><strong>Qualidade:</strong> <span className={qualityInfo.color}>{qualityInfo.label}</span></p>
              </div>
              <div>
                <p><strong>Tipo:</strong> {toneType}</p>
                <p><strong>Freq:</strong> {Object.values(toneSettings)[0]?.toFixed(1)}Hz</p>
                <p><strong>Formato:</strong> WAV 44.1kHz</p>
              </div>
            </div>
          </div>

          {/* Botão de Mix */}
          <button
            onClick={handleMix}
            disabled={!canMix}
            className="w-full py-3 px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isMixing ? (
              <>
                <div className="spinner w-4 h-4 mr-2"></div>
                Mixando...
              </>
            ) : (
              <>
                <Sliders className="w-4 h-4 mr-2" />
                Mixar Áudio
              </>
            )}
          </button>

          {/* Progresso da Mixagem */}
          {isMixing && (
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-600/30">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>{mixStatus}</span>
                <span>{mixProgress.toFixed(0)}%</span>
              </div>
              <div className="progress-container">
                <div 
                  className="progress-bar"
                  style={{ width: `${mixProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Preview e Download */}
          {previewAudio && (
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-600/30 space-y-3 animate-fade-in">
              <h4 className="text-sm font-medium text-gray-300">Preview do Mix</h4>
              
              {/* Controles de Preview */}
              <div className="audio-controls">
                <button
                  onClick={handlePreviewPlay}
                  disabled={!canPreview}
                  className={`control-button ${isPreviewPlaying ? 'pause' : 'play'}`}
                  title={isPreviewPlaying ? 'Pausar' : 'Reproduzir'}
                >
                  {isPreviewPlaying ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={handlePreviewStop}
                  disabled={!canPreview || !isPreviewPlaying}
                  className="control-button stop"
                  title="Parar"
                >
                  <Square className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-400 flex-1 text-center">
                  Preview do mix: {previewAudio.name}
                </span>
              </div>

              {/* Informações do arquivo final */}
              <div className="bg-gray-700/50 p-2 rounded text-xs text-gray-400">
                <p><strong>Arquivo:</strong> {previewAudio.name}</p>
                <p><strong>Qualidade:</strong> <span className={qualityInfo.color}>{qualityInfo.label}</span></p>
                <p><strong>Formato:</strong> WAV • 44.1kHz • 16-bit</p>
              </div>

              {/* Botão de Download */}
              <button
                onClick={handleExport}
                disabled={!canExport}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar Mix Completo
              </button>
            </div>
          )}

          {/* Dicas de uso */}
          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-3">
            <p className="text-sm text-emerald-300">
              💡 <strong>Dica:</strong> Ajuste os volumes para encontrar o equilíbrio perfeito entre música e frequências!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
