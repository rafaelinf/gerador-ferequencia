import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Square, Volume2 } from 'lucide-react';
import ParameterInput from './ParameterInput';
import { ToneType, TONE_TYPES_CONFIG, PRESETS } from '../constants';

export default function FrequenciesTab({ 
  selectedToneType, 
  onToneTypeChange,
  settings,
  onSettingsChange,
  volume,
  onVolumeChange
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSettings, setCurrentSettings] = useState(settings);
  
  // Referências de áudio
  const audioContextRef = useRef(null);
  const masterGainRef = useRef(null);
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
    
    const nodesToStop = [osc1Ref.current, osc2Ref.current, pulseLFORef.current];
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
      isochronicCarrierGainRef.current
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
  }, []);

  // Criar gráfico de áudio
  const createAudioGraph = useCallback((context, outputNode, type, settings) => {
    const ac = context;
    
    switch (type) {
      case ToneType.ISOCHRONIC:
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
        
      case ToneType.BINAURAL:
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
        
      case ToneType.MONAURAL:
        // Oscilador simples
        osc1Ref.current = ac.createOscillator();
        osc1Ref.current.frequency.setValueAtTime(settings.frequency, ac.currentTime);
        osc1Ref.current.type = 'sine';
        
        // Conectar diretamente
        osc1Ref.current.connect(outputNode);
        break;
    }
  }, []);

  // Validar e limpar configurações antes de usar
  const getValidatedSettings = useCallback(() => {
    const validated = { ...currentSettings };
    
    // Garantir que todos os valores sejam números finitos
    Object.keys(validated).forEach(key => {
      if (typeof validated[key] === 'number') {
        if (!isFinite(validated[key]) || isNaN(validated[key])) {
          // Usar valores padrão se o valor não for válido
          switch (key) {
            case 'frequency':
              validated[key] = 136.1;
              break;
            case 'modulationFrequency':
              validated[key] = 7.83;
              break;
            case 'modulationDepth':
              validated[key] = 50;
              break;
            case 'carrierVolume':
              validated[key] = 0.8;
              break;
            case 'leftFrequency':
              validated[key] = 100;
              break;
            case 'rightFrequency':
              validated[key] = 110;
              break;
            default:
              validated[key] = 0;
          }
        }
      }
    });
    
    return validated;
  }, [currentSettings]);

  // Atualizar configurações em tempo real
  const updateSettings = useCallback((newSettings) => {
    const updatedSettings = { ...currentSettings, ...newSettings };
    setCurrentSettings(updatedSettings);
    onSettingsChange(updatedSettings);
    
    // Se estiver tocando, atualizar áudio em tempo real SEM PARAR
    if (isPlaying && audioContextRef.current) {
      try {
        // Aplicar mudanças diretamente nos osciladores ativos
        if (selectedToneType === ToneType.ISOCHRONIC) {
          // Atualizar frequência do oscilador principal
          if (osc1Ref.current) {
            osc1Ref.current.frequency.setValueAtTime(
              updatedSettings.frequency || 136.1, 
              audioContextRef.current.currentTime
            );
          }
          
          // Atualizar frequência do LFO
          if (pulseLFORef.current) {
            pulseLFORef.current.frequency.setValueAtTime(
              updatedSettings.modulationFrequency || 7.83, 
              audioContextRef.current.currentTime
            );
          }
          
          // Atualizar profundidade de modulação
          if (lfoModulatorGainRef.current) {
            lfoModulatorGainRef.current.gain.setValueAtTime(
              updatedSettings.modulationDepth || 50, 
              audioContextRef.current.currentTime
            );
          }
          
          // Atualizar volume do portador
          if (isochronicCarrierGainRef.current) {
            isochronicCarrierGainRef.current.gain.setValueAtTime(
              updatedSettings.carrierVolume || 0.8, 
              audioContextRef.current.currentTime
            );
          }
        }
        
        else if (selectedToneType === ToneType.BINAURAL) {
          // Atualizar frequência esquerda
          if (osc1Ref.current) {
            osc1Ref.current.frequency.setValueAtTime(
              updatedSettings.leftFrequency || 100, 
              audioContextRef.current.currentTime
            );
          }
          
          // Atualizar frequência direita
          if (osc2Ref.current) {
            osc2Ref.current.frequency.setValueAtTime(
              updatedSettings.rightFrequency || 110, 
              audioContextRef.current.currentTime
            );
          }
        }
        
        else if (selectedToneType === ToneType.MONAURAL) {
          // Atualizar frequência
          if (osc1Ref.current) {
            osc1Ref.current.frequency.setValueAtTime(
              updatedSettings.frequency || 200, 
              audioContextRef.current.currentTime
            );
          }
        }
        
        console.log('Configurações atualizadas em tempo real:', updatedSettings);
      } catch (error) {
        console.error('Erro ao atualizar configurações em tempo real:', error);
      }
    }
  }, [currentSettings, onSettingsChange, isPlaying, selectedToneType]);

  // Sincronizar configurações quando mudam externamente
  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setCurrentSettings(settings);
    }
  }, [settings]);

  // Tocar frequências
  const playFrequencies = useCallback(() => {
    try {
      initAudioContext();
      stopAllNodes();
      
      // Configurar volume
      if (masterGainRef.current && audioContextRef.current) {
        masterGainRef.current.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
      }
      
      // Obter configurações validadas
      const validatedSettings = getValidatedSettings();
      
      // Criar gráfico de áudio
      createAudioGraph(audioContextRef.current, masterGainRef.current, selectedToneType, validatedSettings);
      
      // Iniciar osciladores
      if (osc1Ref.current) {
        osc1Ref.current.start(audioContextRef.current.currentTime);
      }
      if (osc2Ref.current) {
        osc2Ref.current.start(audioContextRef.current.currentTime);
      }
      if (pulseLFORef.current) {
        pulseLFORef.current.start(audioContextRef.current.currentTime);
      }
      
      setIsPlaying(true);
    } catch (error) {
      console.error('Erro ao tocar frequências:', error);
    }
  }, [initAudioContext, stopAllNodes, createAudioGraph, selectedToneType, volume, getValidatedSettings]);

  // Parar frequências
  const stopFrequencies = useCallback(() => {
    stopAllNodes();
    setIsPlaying(false);
  }, [stopAllNodes]);

  // Aplicar preset
  const applyPreset = useCallback((preset) => {
    console.log('Aplicando preset:', preset);
    
    // Aplicar apenas as configurações, NÃO mudar o tipo de tom
    onSettingsChange(preset.settings);
    setCurrentSettings(preset.settings);
  }, [onSettingsChange]);

  // Limpar áudio quando componente for desmontado
  useEffect(() => {
    return () => {
      stopAllNodes();
    };
  }, [stopAllNodes]);

  // Atualizar volume em tempo real
  useEffect(() => {
    if (masterGainRef.current && audioContextRef.current && isPlaying) {
      masterGainRef.current.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
    }
  }, [volume, isPlaying]);

  return (
    <div className="space-y-6">
      {/* Seleção de Tipo de Tom */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipo de Tom</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.values(ToneType).map((type) => (
            <button
              key={type}
              onClick={() => onToneTypeChange(type)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedToneType === type
                  ? 'border-violet-500 bg-violet-50 text-violet-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="text-center">
                <div className="text-sm font-medium">
                  {TONE_TYPES_CONFIG.find(config => config.id === type)?.label || type}
                </div>
                <div className="text-xs text-gray-500 mt-1">Configure e toque frequências</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Presets */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Presets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRESETS.map((preset, index) => (
            <button
              key={index}
              onClick={() => applyPreset(preset)}
              className={`p-3 text-left rounded-lg border transition-colors duration-200 ${
                preset.toneType === selectedToneType && 
                JSON.stringify(preset.settings) === JSON.stringify(currentSettings)
                  ? 'border-violet-500 bg-violet-50 text-violet-700'
                  : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50'
              }`}
            >
              <div className="font-medium text-sm text-gray-900">{preset.name}</div>
              <div className="text-xs text-gray-500 mt-1">{preset.description}</div>
              <div className="text-xs text-violet-600 mt-1 font-medium">
                {preset.toneType === ToneType.ISOCHRONIC && 'Isocrônico'}
                {preset.toneType === ToneType.BINAURAL && 'Binaurais'}
                {preset.toneType === ToneType.MONAURAL && 'Monaurais'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Configurações */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações</h3>
        <div className="space-y-4">
          {selectedToneType === ToneType.ISOCHRONIC && (
            <>
              <ParameterInput
                label="Frequência Base (Hz)"
                value={currentSettings.frequency || 136.1}
                onChange={(value) => updateSettings({ frequency: value })}
                min={1}
                max={20000}
                step={1}
                unit="Hz"
              />
              <ParameterInput
                label="Frequência de Modulação (Hz)"
                value={currentSettings.modulationFrequency || 7.83}
                onChange={(value) => updateSettings({ modulationFrequency: value })}
                min={0.1}
                max={100}
                step={0.1}
                unit="Hz"
              />
              <ParameterInput
                label="Profundidade de Modulação"
                value={currentSettings.modulationDepth || 50}
                onChange={(value) => updateSettings({ modulationDepth: value })}
                min={0}
                max={100}
                step={1}
                unit="%"
              />
              <ParameterInput
                label="Volume do Portador"
                value={currentSettings.carrierVolume || 0.8}
                onChange={(value) => updateSettings({ carrierVolume: value })}
                min={0}
                max={1}
                step={0.01}
                unit=""
              />
            </>
          )}
          
          {selectedToneType === ToneType.BINAURAL && (
            <>
              <ParameterInput
                label="Frequência Esquerda (Hz)"
                value={currentSettings.leftFrequency || 100}
                onChange={(value) => updateSettings({ leftFrequency: value })}
                min={1}
                max={20000}
                step={1}
                unit="Hz"
              />
              <ParameterInput
                label="Frequência Direita (Hz)"
                value={currentSettings.rightFrequency || 110}
                onChange={(value) => updateSettings({ rightFrequency: value })}
                min={1}
                max={20000}
                step={1}
                unit="Hz"
              />
            </>
          )}
          
          {selectedToneType === ToneType.MONAURAL && (
            <ParameterInput
              label="Frequência (Hz)"
              value={currentSettings.frequency || 200}
              onChange={(value) => updateSettings({ frequency: value })}
              min={1}
              max={20000}
              step={1}
              unit="Hz"
            />
          )}
        </div>
      </div>

      {/* Controles de Áudio */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Controles de Áudio</h3>
        
        {/* Controles de Play/Stop */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={isPlaying ? stopFrequencies : playFrequencies}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              isPlaying
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-violet-500 hover:bg-violet-600 text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-5 h-5" />
                <span>Parar</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Tocar</span>
              </>
            )}
          </button>
        </div>

        {/* Controle de Volume */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Volume2 className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Volume Principal</span>
            <span className="text-sm text-gray-500 ml-auto">{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>
    </div>
  );
}
