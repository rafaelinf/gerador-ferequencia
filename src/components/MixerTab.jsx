import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Square, Volume2, Download, Sliders, Music, Radio } from 'lucide-react';

export default function MixerTab({ 
  audioFile,
  selectedToneType,
  settings,
  onExport
}) {
  const [isMixing, setIsMixing] = useState(false);
  const [mixProgress, setMixProgress] = useState(0);
  const [exportQuality, setExportQuality] = useState('high');
  const [exportDuration, setExportDuration] = useState(5);
  
  // Estados de áudio
  const [frequenciesPlaying, setFrequenciesPlaying] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [frequenciesVolume, setFrequenciesVolume] = useState(0.5);
  const [musicVolume, setMusicVolume] = useState(0.7);
  
  // Referências de áudio
  const audioContextRef = useRef(null);
  const masterGainRef = useRef(null);
  const frequenciesGainRef = useRef(null);
  const musicGainRef = useRef(null);
  const musicSourceRef = useRef(null);
  
  // Referências para frequências
  const osc1Ref = useRef(null);
  const osc2Ref = useRef(null);
  const panner1Ref = useRef(null);
  const panner2Ref = useRef(null);
  const isochronicCarrierGainRef = useRef(null);
  const pulseLFORef = useRef(null);
  const lfoModulatorGainRef = useRef(null);

  // Inicializar contexto de áudio
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.connect(audioContextRef.current.destination);
    }
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  // Parar todos os nós de áudio
  const stopAllNodes = useCallback(() => {
    if (!audioContextRef.current) return;
    
    const nodesToStop = [osc1Ref.current, osc2Ref.current, pulseLFORef.current, musicSourceRef.current];
    nodesToStop.forEach(node => {
      if (node) {
        try { 
          node.stop(); 
        } catch(e) {}
        try { 
          node.disconnect(); 
        } catch(e) {}
      }
    });
    
    const nodesToDisconnect = [
      panner1Ref.current, 
      panner2Ref.current, 
      lfoModulatorGainRef.current, 
      isochronicCarrierGainRef.current,
      frequenciesGainRef.current,
      musicGainRef.current
    ];
    
    nodesToDisconnect.forEach(node => { 
      if (node) { 
        try { 
          node.disconnect(); 
        } catch(e) {} 
      } 
    });
    
    // Limpar referências
    osc1Ref.current = null; 
    osc2Ref.current = null; 
    pulseLFORef.current = null;
    panner1Ref.current = null; 
    panner2Ref.current = null; 
    lfoModulatorGainRef.current = null; 
    isochronicCarrierGainRef.current = null;
    musicSourceRef.current = null;
  }, []);

  // Criar gráfico de áudio para frequências
  const createFrequenciesGraph = useCallback((context, outputNode, type, settings) => {
    const ac = context;
    console.log('Criando frequências:', { type, settings });
    
    switch (type) {
      case 'Isochronic':
        console.log('Criando frequências isocrônicas');
        // Oscilador principal
        osc1Ref.current = ac.createOscillator();
        osc1Ref.current.frequency.setValueAtTime(settings.frequency, ac.currentTime);
        osc1Ref.current.type = 'sine';
        
        // Ganho para modulação
        isochronicCarrierGainRef.current = ac.createGain();
        isochronicCarrierGainRef.current.gain.setValueAtTime(settings.carrierVolume, ac.currentTime);
        
        // LFO para modulação
        pulseLFORef.current = ac.createOscillator();
        pulseLFORef.current.frequency.setValueAtTime(settings.modulationFrequency, ac.currentTime);
        pulseLFORef.current.type = 'sine';
        
        // Ganho do LFO
        lfoModulatorGainRef.current = ac.createGain();
        lfoModulatorGainRef.current.gain.setValueAtTime(settings.modulationDepth, ac.currentTime);
        
        // Conectar
        pulseLFORef.current.connect(lfoModulatorGainRef.current);
        lfoModulatorGainRef.current.connect(osc1Ref.current.frequency);
        osc1Ref.current.connect(isochronicCarrierGainRef.current);
        isochronicCarrierGainRef.current.connect(outputNode);
        break;
        
      case 'Binaural':
        console.log('Criando frequências binaurais');
        // Oscilador esquerdo
        osc1Ref.current = ac.createOscillator();
        osc1Ref.current.frequency.setValueAtTime(settings.leftFrequency, ac.currentTime);
        osc1Ref.current.type = 'sine';
        
        // Oscilador direito
        osc2Ref.current = ac.createOscillator();
        osc2Ref.current.frequency.setValueAtTime(settings.rightFrequency, ac.currentTime);
        osc2Ref.current.type = 'sine';
        
        // Panners para separar canais
        panner1Ref.current = ac.createStereoPanner();
        panner1Ref.current.pan.setValueAtTime(-1, ac.currentTime); // Esquerda
        
        panner2Ref.current = ac.createStereoPanner();
        panner2Ref.current.pan.setValueAtTime(1, ac.currentTime); // Direita
        
        // Conectar
        osc1Ref.current.connect(panner1Ref.current);
        osc2Ref.current.connect(panner2Ref.current);
        panner1Ref.current.connect(outputNode);
        panner2Ref.current.connect(outputNode);
        break;
        
      case 'Monaural':
        console.log('Criando frequências monaurais');
        // Oscilador simples
        osc1Ref.current = ac.createOscillator();
        osc1Ref.current.frequency.setValueAtTime(settings.frequency, ac.currentTime);
        osc1Ref.current.type = 'sine';
        
        // Conectar diretamente
        osc1Ref.current.connect(outputNode);
        break;
        
      default:
        console.log('Tipo de frequência não reconhecido:', type);
        break;
    }
  }, []);

  // Tocar frequências no mixer
  const playFrequencies = useCallback(() => {
    console.log('Tentando tocar frequências:', { selectedToneType, settings });
    
    if (!selectedToneType || !settings) {
      console.log('Faltando dados:', { selectedToneType, settings });
      return;
    }
    
    try {
      initAudioContext();
      
      // Parar apenas as frequências anteriores (não a música)
      if (osc1Ref.current || osc2Ref.current || pulseLFORef.current) {
        if (osc1Ref.current) {
          try { osc1Ref.current.stop(); } catch(e) {}
          osc1Ref.current = null;
        }
        if (osc2Ref.current) {
          try { osc2Ref.current.stop(); } catch(e) {}
          osc2Ref.current = null;
        }
        if (pulseLFORef.current) {
          try { pulseLFORef.current.stop(); } catch(e) {}
          pulseLFORef.current = null;
        }
        
        // Desconectar nós de frequência
        [panner1Ref.current, panner2Ref.current, lfoModulatorGainRef.current, isochronicCarrierGainRef.current, frequenciesGainRef.current].forEach(node => {
          if (node) { 
            try { node.disconnect(); } catch(e) {} 
          }
        });
        
        panner1Ref.current = null;
        panner2Ref.current = null;
        lfoModulatorGainRef.current = null;
        isochronicCarrierGainRef.current = null;
      }
      
      // Criar ganho para frequências
      frequenciesGainRef.current = audioContextRef.current.createGain();
      frequenciesGainRef.current.gain.setValueAtTime(frequenciesVolume, audioContextRef.current.currentTime);
      frequenciesGainRef.current.connect(masterGainRef.current);
      
      // Criar gráfico de áudio
      createFrequenciesGraph(audioContextRef.current, frequenciesGainRef.current, selectedToneType, settings);
      
      // Iniciar osciladores
      if (osc1Ref.current) {
        console.log('Iniciando osc1');
        osc1Ref.current.start(audioContextRef.current.currentTime);
      }
      if (osc2Ref.current) {
        console.log('Iniciando osc2');
        osc2Ref.current.start(audioContextRef.current.currentTime);
      }
      if (pulseLFORef.current) {
        console.log('Iniciando LFO');
        pulseLFORef.current.start(audioContextRef.current.currentTime);
      }
      
      setFrequenciesPlaying(true);
      console.log('Frequências iniciadas com sucesso');
    } catch (error) {
      console.error('Erro ao tocar frequências no mixer:', error);
    }
  }, [selectedToneType, settings, initAudioContext, createFrequenciesGraph, frequenciesVolume]);

  // Parar frequências no mixer
  const stopFrequencies = useCallback(() => {
    if (osc1Ref.current || osc2Ref.current || pulseLFORef.current) {
      // Parar apenas osciladores
      if (osc1Ref.current) {
        try { osc1Ref.current.stop(); } catch(e) {}
        osc1Ref.current = null;
      }
      if (osc2Ref.current) {
        try { osc2Ref.current.stop(); } catch(e) {}
        osc2Ref.current = null;
      }
      if (pulseLFORef.current) {
        try { pulseLFORef.current.stop(); } catch(e) {}
        pulseLFORef.current = null;
      }
      
      // Desconectar nós de frequência
      [panner1Ref.current, panner2Ref.current, lfoModulatorGainRef.current, isochronicCarrierGainRef.current, frequenciesGainRef.current].forEach(node => {
        if (node) { 
          try { node.disconnect(); } catch(e) {} 
        }
      });
      
      panner1Ref.current = null;
      panner2Ref.current = null;
      lfoModulatorGainRef.current = null;
      isochronicCarrierGainRef.current = null;
    }
    setFrequenciesPlaying(false);
  }, []);

  // Tocar música no mixer
  const playMusic = useCallback(async () => {
    if (!audioFile || !audioFile.url) return;
    
    try {
      initAudioContext();
      
      // Parar apenas a música anterior (não as frequências)
      if (musicSourceRef.current) {
        try { musicSourceRef.current.stop(); } catch(e) {}
        musicSourceRef.current = null;
      }
      
      if (musicGainRef.current) {
        try { musicGainRef.current.disconnect(); } catch(e) {}
        musicGainRef.current = null;
      }
      
      // Criar ganho para música
      musicGainRef.current = audioContextRef.current.createGain();
      musicGainRef.current.gain.setValueAtTime(musicVolume, audioContextRef.current.currentTime);
      musicGainRef.current.connect(masterGainRef.current);
      
      // Carregar e decodificar música
      const response = await fetch(audioFile.url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      
      // Criar source para música
      musicSourceRef.current = audioContextRef.current.createBufferSource();
      musicSourceRef.current.buffer = audioBuffer;
      musicSourceRef.current.loop = true;
      musicSourceRef.current.connect(musicGainRef.current);
      
      // Tocar música
      musicSourceRef.current.start(0);
      setMusicPlaying(true);
    } catch (error) {
      console.error('Erro ao tocar música no mixer:', error);
    }
  }, [audioFile, initAudioContext, musicVolume]);

  // Parar música no mixer
  const stopMusic = useCallback(() => {
    if (musicSourceRef.current) {
      try { musicSourceRef.current.stop(); } catch(e) {}
      musicSourceRef.current = null;
    }
    
    if (musicGainRef.current) {
      try { musicGainRef.current.disconnect(); } catch(e) {}
      musicGainRef.current = null;
    }
    
    setMusicPlaying(false);
  }, []);

  // Parar tudo
  const stopAll = useCallback(() => {
    stopAllNodes();
    setFrequenciesPlaying(false);
    setMusicPlaying(false);
  }, [stopAllNodes]);

  // Atualizar volume das frequências em tempo real
  useEffect(() => {
    if (frequenciesGainRef.current && audioContextRef.current && frequenciesPlaying) {
      frequenciesGainRef.current.gain.setValueAtTime(frequenciesVolume, audioContextRef.current.currentTime);
    }
  }, [frequenciesVolume, frequenciesPlaying]);

  // Atualizar volume da música em tempo real
  useEffect(() => {
    if (musicGainRef.current && audioContextRef.current && musicPlaying) {
      musicGainRef.current.gain.setValueAtTime(musicVolume, audioContextRef.current.currentTime);
    }
  }, [musicVolume, musicPlaying]);

  // Limpar áudio quando componente for desmontado
  useEffect(() => {
    return () => {
      stopAllNodes();
    };
  }, [stopAllNodes]);

  // Simular progresso de mix
  const simulateMixProgress = useCallback(() => {
    setIsMixing(true);
    setMixProgress(0);
    
    const interval = setInterval(() => {
      setMixProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsMixing(false);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  }, []);

  // Exportar mix
  const handleExport = useCallback(() => {
    if (!audioFile || !selectedToneType || !settings) {
      alert('É necessário ter música e frequências configuradas para exportar.');
      return;
    }
    
    simulateMixProgress();
    
    // Simular tempo de processamento
    setTimeout(() => {
      onExport({
        audioFile,
        selectedToneType,
        settings,
        frequenciesVolume,
        musicVolume,
        exportQuality,
        exportDuration
      });
      setIsMixing(false);
    }, 2000);
  }, [audioFile, selectedToneType, settings, frequenciesVolume, musicVolume, exportQuality, exportDuration, onExport, simulateMixProgress]);

  return (
    <div className="space-y-6">
      {/* Status do Mixer */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Sliders className="w-6 h-6 text-violet-500" />
          <h3 className="text-lg font-semibold text-gray-900">Status do Mixer</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Radio className={`w-5 h-5 ${frequenciesPlaying ? 'text-green-500' : 'text-gray-400'}`} />
            <span className="text-sm font-medium text-gray-700">Frequências</span>
            <span className={`ml-auto px-2 py-1 text-xs rounded-full ${
              frequenciesPlaying ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}>
              {frequenciesPlaying ? 'Tocando' : 'Parado'}
            </span>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Music className={`w-5 h-5 ${musicPlaying ? 'text-green-500' : 'text-gray-400'}`} />
            <span className="text-sm font-medium text-gray-700">Música</span>
            <span className={`ml-auto px-2 py-1 text-xs rounded-full ${
              musicPlaying ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}>
              {musicPlaying ? 'Tocando' : 'Parado'}
            </span>
          </div>
        </div>
        
        {/* Debug info */}
        <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
          <div>Debug: selectedToneType = {selectedToneType}</div>
          <div>Debug: settings = {JSON.stringify(settings)}</div>
        </div>
      </div>

      {/* Controles de Áudio */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Controles de Áudio</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controles de Frequências */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700">Frequências</h4>
            
            <div className="flex space-x-3">
              <button
                onClick={frequenciesPlaying ? stopFrequencies : playFrequencies}
                disabled={!selectedToneType || !settings}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  !selectedToneType || !settings
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : frequenciesPlaying
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-violet-500 hover:bg-violet-600 text-white'
                }`}
              >
                {frequenciesPlaying ? (
                  <>
                    <Square className="w-4 h-4" />
                    <span>Parar</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Tocar</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Volume</span>
                <span className="text-gray-500">{Math.round(frequenciesVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={frequenciesVolume}
                onChange={(e) => setFrequenciesVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          {/* Controles de Música */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700">Música</h4>
            
            <div className="flex space-x-3">
              <button
                onClick={musicPlaying ? stopMusic : playMusic}
                disabled={!audioFile}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  !audioFile
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : musicPlaying
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-violet-500 hover:bg-violet-600 text-white'
                }`}
              >
                {musicPlaying ? (
                  <>
                    <Square className="w-4 h-4" />
                    <span>Parar</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Tocar</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Volume</span>
                <span className="text-gray-500">{Math.round(musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={musicVolume}
                onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        </div>

        {/* Botão para parar tudo */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={stopAll}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium bg-gray-500 hover:bg-gray-600 text-white transition-all duration-200"
          >
            <Square className="w-4 h-4" />
            <span>Parar Tudo</span>
          </button>
        </div>
      </div>

      {/* Configurações de Exportação */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações de Exportação</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Qualidade</label>
            <select
              value={exportQuality}
              onChange={(e) => setExportQuality(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            >
              <option value="low">Baixa (128kbps)</option>
              <option value="medium">Média (256kbps)</option>
              <option value="high">Alta (320kbps)</option>
            </select>
          </div>
          
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Duração (minutos)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={exportDuration}
              onChange={(e) => setExportDuration(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Exportação */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Exportar Mix</h3>
        
        {isMixing && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Processando...</span>
              <span>{mixProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-violet-500 h-2 rounded-full transition-all duration-200"
                style={{ width: `${mixProgress}%` }}
              />
            </div>
          </div>
        )}
        
        <button
          onClick={handleExport}
          disabled={!audioFile || !selectedToneType || !settings || isMixing}
          className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
            !audioFile || !selectedToneType || !settings || isMixing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
          }`}
        >
          <Download className="w-5 h-5" />
          <span>{isMixing ? 'Processando...' : 'Exportar Mix'}</span>
        </button>
        
        {(!audioFile || !selectedToneType || !settings) && (
          <p className="text-sm text-gray-500 mt-3 text-center">
            {!audioFile && !selectedToneType && 'Faça upload de música e configure frequências para exportar'}
            {!audioFile && selectedToneType && 'Faça upload de música para exportar'}
            {audioFile && !selectedToneType && 'Configure frequências para exportar'}
          </p>
        )}
      </div>
    </div>
  );
}
