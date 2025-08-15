import { useState, useRef, useCallback, useEffect } from 'react';

export function useAudioEngine() {
  const audioContextRef = useRef(null);
  const masterGainRef = useRef(null);
  const masterMixerGainRef = useRef(null);
  const frequenciesGainRef = useRef(null);
  const musicGainRef = useRef(null);
  const musicSourceRef = useRef(null);
  const musicBufferRef = useRef(null);
  const currentPlayingTypeRef = useRef(null);

  // Referências para frequências
  const osc1Ref = useRef(null);
  const osc2Ref = useRef(null);
  const panner1Ref = useRef(null);
  const panner2Ref = useRef(null);
  const isochronicCarrierGainRef = useRef(null);
  const pulseLFORef = useRef(null);
  const lfoModulatorGainRef = useRef(null);

  // Referências para mixer
  // (masterMixerGainRef, frequenciesGainRef, musicGainRef, musicSourceRef, musicBufferRef já declarados acima)

  const ensureAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      masterGainRef.current = audioContextRef.current.createGain();
      masterMixerGainRef.current = audioContextRef.current.createGain();
      masterMixerGainRef.current.connect(audioContextRef.current.destination);
      masterGainRef.current.connect(masterMixerGainRef.current);
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  const stopAllNodes = useCallback((context = audioContextRef.current) => {
    if (!context) return;
    
    // Parar nós de frequência
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
    
    // Parar música
    if (musicSourceRef.current) {
      try {
        musicSourceRef.current.stop();
      } catch(e) {}
    }
    
    // Limpar referências
    osc1Ref.current = null; 
    osc2Ref.current = null; 
    pulseLFORef.current = null;
    musicSourceRef.current = null;

    // Desconectar nós
    const nodesToDisconnect = [
      panner1Ref.current, 
      panner2Ref.current, 
      lfoModulatorGainRef.current, 
      isochronicCarrierGainRef.current,
      musicGainRef.current,
      frequenciesGainRef.current
    ];
    
    nodesToDisconnect.forEach(node => { 
      if (node) { 
        try { 
          node.disconnect(); 
        } catch(e) {} 
      } 
    });
    
    panner1Ref.current = null; 
    panner2Ref.current = null; 
    lfoModulatorGainRef.current = null; 
    isochronicCarrierGainRef.current = null;
    musicGainRef.current = null;
    frequenciesGainRef.current = null;

    if (context === audioContextRef.current) {
      currentPlayingTypeRef.current = null;
    }
  }, []);

  const createAudioGraph = useCallback((ac, destinationNode, type, settings, nodeRefs) => {
    // Clean existing refs
    Object.values(nodeRefs).forEach(ref => {
      if (ref.current) { 
        try { 
          ref.current.disconnect(); 
        } catch(e) {} 
        ref.current = null; 
      }
    });

    switch (type) {
      case 'Isochronic': {
        const { carrierFreq, pulseFreq } = settings;
        nodeRefs.osc1Ref.current = ac.createOscillator();
        nodeRefs.osc1Ref.current.type = 'sine';
        nodeRefs.osc1Ref.current.frequency.setValueAtTime(carrierFreq, ac.currentTime);

        nodeRefs.isochronicCarrierGainRef.current = ac.createGain();
        nodeRefs.isochronicCarrierGainRef.current.gain.setValueAtTime(0.5, ac.currentTime);

        nodeRefs.pulseLFORef.current = ac.createOscillator();
        nodeRefs.pulseLFORef.current.type = 'sine';
        nodeRefs.pulseLFORef.current.frequency.setValueAtTime(pulseFreq, ac.currentTime);

        nodeRefs.lfoModulatorGainRef.current = ac.createGain();
        nodeRefs.lfoModulatorGainRef.current.gain.setValueAtTime(0.5, ac.currentTime);

        nodeRefs.osc1Ref.current.connect(nodeRefs.isochronicCarrierGainRef.current);
        nodeRefs.isochronicCarrierGainRef.current.connect(destinationNode);

        nodeRefs.pulseLFORef.current.connect(nodeRefs.lfoModulatorGainRef.current);
        nodeRefs.lfoModulatorGainRef.current.connect(nodeRefs.isochronicCarrierGainRef.current.gain);
        break;
      }
      case 'Binaural': {
        const { baseFreq, beatFreq } = settings;
        const freqLeft = baseFreq - beatFreq / 2;
        const freqRight = baseFreq + beatFreq / 2;

        nodeRefs.osc1Ref.current = ac.createOscillator();
        nodeRefs.osc1Ref.current.type = 'sine';
        nodeRefs.osc1Ref.current.frequency.setValueAtTime(freqLeft, ac.currentTime);
        nodeRefs.panner1Ref.current = ac.createStereoPanner();
        nodeRefs.panner1Ref.current.pan.setValueAtTime(-1, ac.currentTime);
        nodeRefs.osc1Ref.current.connect(nodeRefs.panner1Ref.current).connect(destinationNode);

        nodeRefs.osc2Ref.current = ac.createOscillator();
        nodeRefs.osc2Ref.current.type = 'sine';
        nodeRefs.osc2Ref.current.frequency.setValueAtTime(freqRight, ac.currentTime);
        nodeRefs.panner2Ref.current = ac.createStereoPanner();
        nodeRefs.panner2Ref.current.pan.setValueAtTime(1, ac.currentTime);
        nodeRefs.osc2Ref.current.connect(nodeRefs.panner2Ref.current).connect(destinationNode);
        break;
      }
      case 'Monaural': {
        const { freq1, freq2 } = settings;
        nodeRefs.osc1Ref.current = ac.createOscillator();
        nodeRefs.osc1Ref.current.type = 'sine';
        nodeRefs.osc1Ref.current.frequency.setValueAtTime(freq1, ac.currentTime);
        nodeRefs.osc1Ref.current.connect(destinationNode);

        nodeRefs.osc2Ref.current = ac.createOscillator();
        nodeRefs.osc2Ref.current.type = 'sine';
        nodeRefs.osc2Ref.current.frequency.setValueAtTime(freq2, ac.currentTime);
        nodeRefs.osc2Ref.current.connect(destinationNode);
        break;
      }
    }
  }, []);

  const loadMusic = useCallback(async (audioFile) => {
    if (!audioContextRef.current || !audioFile) return null;

    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      musicBufferRef.current = audioBuffer;
      return audioBuffer;
    } catch (error) {
      console.error('Erro ao carregar música:', error);
      return null;
    }
  }, []);

  const play = useCallback((type, settings, globalVolume, musicFile = null, musicVolume = 0.7, frequenciesVolume = 0.5) => {
    ensureAudioContext();
    const ac = audioContextRef.current;
    const masterGain = masterGainRef.current;
    if (!ac || !masterGain) return;
    
    stopAllNodes();

    // Configurar volumes
    masterGain.gain.setValueAtTime(globalVolume, ac.currentTime);
    currentPlayingTypeRef.current = type;

    // Criar ganho para frequências
    frequenciesGainRef.current = ac.createGain();
    frequenciesGainRef.current.gain.setValueAtTime(frequenciesVolume, ac.currentTime);
    frequenciesGainRef.current.connect(masterGain);

    // Criar ganho para música
    if (musicFile && musicBufferRef.current) {
      musicGainRef.current = ac.createGain();
      musicGainRef.current.gain.setValueAtTime(musicVolume, ac.currentTime);
      musicGainRef.current.connect(masterGain);

      // Criar source para música
      musicSourceRef.current = ac.createBufferSource();
      musicSourceRef.current.buffer = musicBufferRef.current;
      musicSourceRef.current.connect(musicGainRef.current);
      musicSourceRef.current.loop = true;
    }

    const liveNodeRefs = {
      osc1Ref, osc2Ref, panner1Ref, panner2Ref, 
      isochronicCarrierGainRef, pulseLFORef, lfoModulatorGainRef
    };

    createAudioGraph(ac, frequenciesGainRef.current, type, settings, liveNodeRefs);

    // Iniciar nós de frequência
    if (liveNodeRefs.osc1Ref.current) {
      try { 
        liveNodeRefs.osc1Ref.current.start(ac.currentTime); 
      } catch(e) {}
    }
    if (liveNodeRefs.osc2Ref.current) {
      try { 
        liveNodeRefs.osc2Ref.current.start(ac.currentTime); 
      } catch(e) {}
    }
    if (liveNodeRefs.pulseLFORef.current) {
      try { 
        liveNodeRefs.pulseLFORef.current.start(ac.currentTime); 
      } catch(e) {}
    }

    // Iniciar música
    if (musicSourceRef.current) {
      try {
        musicSourceRef.current.start(ac.currentTime);
      } catch(e) {}
    }

    // Não usar setIsPlaying pois não existe mais
    // setIsPlaying(true);
  }, [ensureAudioContext, stopAllNodes, createAudioGraph]);

  const stop = useCallback(() => { 
    stopAllNodes(); 
    // Não usar setIsPlaying pois não existe mais
    // setIsPlaying(false); 
  }, [stopAllNodes]);

  const setGlobalVolume = useCallback((volume) => {
    if (masterGainRef.current && audioContextRef.current) {
      masterGainRef.current.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
    }
  }, []);

  const setMusicVolume = useCallback((volume) => {
    if (musicGainRef.current && audioContextRef.current) {
      musicGainRef.current.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
    }
  }, []);

  const setFrequenciesVolume = useCallback((volume) => {
    if (frequenciesGainRef.current && audioContextRef.current) {
      frequenciesGainRef.current.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
    }
  }, []);

  // WAV encoding helpers
  function interleave(inputL, inputR) {
    const length = inputL.length + inputR.length;
    const result = new Float32Array(length);
    let index = 0, inputIndex = 0;
    while (index < length) {
      result[index++] = inputL[inputIndex];
      result[index++] = inputR[inputIndex];
      inputIndex++;
    }
    return result;
  }

  function encodeWAV(audioBuffer) {
    const numChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const bitDepth = 16;
    let result;
    
    if (numChannels === 2) {
      result = interleave(audioBuffer.getChannelData(0), audioBuffer.getChannelData(1));
    } else {
      result = audioBuffer.getChannelData(0);
    }

    const dataLength = result.length * (bitDepth / 8);
    const buffer = new ArrayBuffer(44 + dataLength);
    const view = new DataView(buffer);
    let offset = 0;

    function writeString(str) { 
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset++, str.charCodeAt(i)); 
      }
    }

    writeString('RIFF');
    view.setUint32(offset, 36 + dataLength, true); 
    offset += 4;
    writeString('WAVE');
    writeString('fmt ');
    view.setUint32(offset, 16, true); 
    offset += 4;
    view.setUint16(offset, 1, true); 
    offset += 2; // PCM
    view.setUint16(offset, numChannels, true); 
    offset += 2;
    view.setUint32(offset, sampleRate, true); 
    offset += 4;
    view.setUint32(offset, sampleRate * numChannels * (bitDepth/8), true); 
    offset += 4;
    view.setUint16(offset, numChannels * (bitDepth/8), true); 
    offset += 2;
    view.setUint16(offset, bitDepth, true); 
    offset += 2;
    writeString('data');
    view.setUint32(offset, dataLength, true); 
    offset += 4;

    let index = 0;
    while (offset < 44 + dataLength && index < result.length) {
      let sample = result[index++];
      sample = Math.max(-1, Math.min(1, sample));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
    return new Blob([view], { type: 'audio/wav' });
  }

  const exportAudioAsWav = async (type, settings, globalVolume, durationInSeconds, musicFile = null, musicVolume = 0.7, frequenciesVolume = 0.5) => {
    const sampleRate = 44100;
    const numChannels = (type === 'Binaural') ? 2 : 1;
    const OfflineAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    
    if (!OfflineAC) {
      throw new Error("OfflineAudioContext não suportado no navegador.");
    }

    // Se tiver música, usar sua duração, senão usar a duração especificada
    const finalDuration = musicFile ? musicFile.duration : durationInSeconds;
    const offlineCtx = new OfflineAC(numChannels, Math.floor(sampleRate * finalDuration), sampleRate);
    
    const offlineMasterGain = offlineCtx.createGain();
    offlineMasterGain.gain.setValueAtTime(globalVolume, 0);
    offlineMasterGain.connect(offlineCtx.destination);

    // Criar ganhos separados para música e frequências
    const offlineMusicGain = offlineCtx.createGain();
    const offlineFrequenciesGain = offlineCtx.createGain();
    
    offlineMusicGain.gain.setValueAtTime(musicVolume, 0);
    offlineFrequenciesGain.gain.setValueAtTime(frequenciesVolume, 0);
    
    offlineMusicGain.connect(offlineMasterGain);
    offlineFrequenciesGain.connect(offlineMasterGain);

    const offlineNodeRefs = {
      osc1Ref: { current: null },
      osc2Ref: { current: null },
      panner1Ref: { current: null },
      panner2Ref: { current: null },
      isochronicCarrierGainRef: { current: null },
      pulseLFORef: { current: null },
      lfoModulatorGainRef: { current: null }
    };

    // Criar gráfico de frequências
    createAudioGraph(offlineCtx, offlineFrequenciesGain, type, settings, offlineNodeRefs);

    // Adicionar música se disponível
    if (musicFile && musicBufferRef.current) {
      const offlineMusicSource = offlineCtx.createBufferSource();
      offlineMusicSource.buffer = musicBufferRef.current;
      offlineMusicSource.connect(offlineMusicGain);
      
      // Se a música for mais curta que a duração desejada, fazer loop
      if (musicFile.duration < finalDuration) {
        offlineMusicSource.loop = true;
        offlineMusicSource.loopStart = 0;
        offlineMusicSource.loopEnd = musicFile.duration;
      }
      
      offlineMusicSource.start(0);
    }

    // Iniciar nós de frequência
    if (offlineNodeRefs.osc1Ref.current) {
      try { 
        offlineNodeRefs.osc1Ref.current.start(0); 
      } catch(e) {}
    }
    if (offlineNodeRefs.osc2Ref.current) {
      try { 
        offlineNodeRefs.osc2Ref.current.start(0); 
      } catch(e) {}
    }
    if (offlineNodeRefs.pulseLFORef.current) {
      try { 
        offlineNodeRefs.pulseLFORef.current.start(0); 
      } catch(e) {}
    }

    const rendered = await offlineCtx.startRendering();
    if (!rendered || rendered.length === 0) {
      throw new Error("Render vazio.");
    }
    
    const wavBlob = encodeWAV(rendered);

    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style.display = 'none';
    a.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g,'-');
    const musicSuffix = musicFile ? '_with_music' : '';
    a.download = `aura_harmonics_${type.toLowerCase().replace(/\s+/g,'_')}${musicSuffix}_${timestamp}.wav`;
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return true;
  };

  const mixAudio = useCallback(async (audioFile, type, settings, globalVolume, musicVolume, frequenciesVolume) => {
    setIsMixing(true);
    
    try {
      // Carregar música
      const musicBuffer = await loadMusic(audioFile);
      if (!musicBuffer) {
        throw new Error('Falha ao carregar música');
      }

      // Simular processo de mixagem
      await new Promise(resolve => setTimeout(resolve, 2000));

      setIsMixing(false);
      return {
        success: true,
        duration: musicBuffer.duration,
        sampleRate: musicBuffer.sampleRate
      };
    } catch (error) {
      setIsMixing(false);
      throw error;
    }
  }, [loadMusic]);

  // Estados independentes para cada aba
  const [frequenciesPlaying, setFrequenciesPlaying] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [mixerFrequenciesPlaying, setMixerFrequenciesPlaying] = useState(false);
  const [mixerMusicPlaying, setMixerMusicPlaying] = useState(false);

  // Função para tocar apenas frequências (aba frequências)
  const playFrequenciesOnly = useCallback(async (toneType, settings, volume = 0.5) => {
    try {
      await ensureAudioContext();
      
      // Parar música se estiver tocando
      if (musicPlaying) {
        stopMusic();
      }
      
      // Parar qualquer áudio que esteja tocando
      stopAllNodes();
      
      // Configurar volumes
      if (masterGainRef.current && audioContextRef.current) {
        masterGainRef.current.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
      }
      
      // Criar ganho para frequências
      if (audioContextRef.current) {
        frequenciesGainRef.current = audioContextRef.current.createGain();
        frequenciesGainRef.current.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
        frequenciesGainRef.current.connect(masterGainRef.current);
      }
      
      // Tocar frequências usando a função play
      play(toneType, settings, volume);
      
      setFrequenciesPlaying(true);
      return true;
    } catch (error) {
      console.error('Erro ao tocar frequências:', error);
      throw error;
    }
  }, [ensureAudioContext, musicPlaying, stopMusic, stopAllNodes, play]);

  // Função para parar apenas frequências
  const stopFrequencies = useCallback(() => {
    if (frequenciesPlaying) {
      stopAllNodes();
      setFrequenciesPlaying(false);
    }
  }, [frequenciesPlaying]);

  // Função para tocar apenas música (aba música)
  const playMusicOnly = useCallback(async (musicFile, musicVolume = 0.7) => {
    if (!musicFile) return;

    try {
      await ensureAudioContext();
      
      // Parar frequências se estiverem tocando
      if (frequenciesPlaying) {
        stopFrequencies();
      }
      
      // Parar qualquer áudio que esteja tocando
      stopAllNodes();
      
      // Carregar música se ainda não foi carregada
      if (!musicBufferRef.current) {
        await loadMusic(musicFile);
      }
      
      if (!musicBufferRef.current) {
        throw new Error('Falha ao carregar música');
      }
      
      // Configurar música
      musicSourceRef.current = audioContextRef.current.createBufferSource();
      musicSourceRef.current.buffer = musicBufferRef.current;
      
      // Configurar volume da música
      musicGainRef.current.gain.setValueAtTime(musicVolume, audioContextRef.current.currentTime);
      
      // Conectar música ao sistema de áudio
      musicSourceRef.current.connect(musicGainRef.current);
      musicGainRef.current.connect(masterMixerGainRef.current);
      masterMixerGainRef.current.connect(audioContextRef.current.destination);
      
      // Tocar música
      musicSourceRef.current.start(0);
      
      // Configurar para parar quando a música terminar
      musicSourceRef.current.onended = () => {
        musicSourceRef.current = null;
        setMusicPlaying(false);
      };
      
      setMusicPlaying(true);
      return true;
    } catch (error) {
      console.error('Erro ao tocar música:', error);
      throw error;
    }
  }, [ensureAudioContext, frequenciesPlaying, stopFrequencies, loadMusic]);

  // Função para parar apenas música
  const stopMusic = useCallback(() => {
    if (musicPlaying && musicSourceRef.current) {
      musicSourceRef.current.stop();
      musicSourceRef.current = null;
      setMusicPlaying(false);
    }
  }, [musicPlaying]);

  // Função para tocar frequências no mixer (independente)
  const playMixerFrequencies = useCallback(async (toneType, settings, volume = 0.5) => {
    try {
      await ensureAudioContext();
      
      // Parar frequências da aba frequências se estiverem tocando
      if (frequenciesPlaying) {
        stopFrequencies();
      }
      
      // Tocar frequências
      const success = await play(toneType, settings, volume);
      if (success) {
        setMixerFrequenciesPlaying(true);
      }
      return success;
    } catch (error) {
      console.error('Erro ao tocar frequências no mixer:', error);
      throw error;
    }
  }, [ensureAudioContext, frequenciesPlaying, stopFrequencies, play]);

  // Função para tocar música no mixer (independente)
  const playMixerMusic = useCallback(async (musicFile, musicVolume = 0.7) => {
    if (!musicFile) return;

    try {
      await ensureAudioContext();
      
      // Parar música da aba música se estiver tocando
      if (musicPlaying) {
        stopMusic();
      }
      
      // Carregar música se ainda não foi carregada
      if (!musicBufferRef.current) {
        await loadMusic(musicFile);
      }
      
      if (!musicBufferRef.current) {
        throw new Error('Falha ao carregar música');
      }
      
      // Configurar música para mixer
      const mixerMusicSource = audioContextRef.current.createBufferSource();
      mixerMusicSource.buffer = musicBufferRef.current;
      
      // Configurar volume da música
      musicGainRef.current.gain.setValueAtTime(musicVolume, audioContextRef.current.currentTime);
      
      // Conectar música ao sistema de áudio
      mixerMusicSource.connect(musicGainRef.current);
      musicGainRef.current.connect(masterMixerGainRef.current);
      masterMixerGainRef.current.connect(audioContextRef.current.destination);
      
      // Tocar música
      mixerMusicSource.start(0);
      
      // Configurar para parar quando a música terminar
      mixerMusicSource.onended = () => {
        setMixerMusicPlaying(false);
      };
      
      setMixerMusicPlaying(true);
      return true;
    } catch (error) {
      console.error('Erro ao tocar música no mixer:', error);
      throw error;
    }
  }, [ensureAudioContext, musicPlaying, stopMusic, loadMusic]);

  // Função para parar tudo no mixer
  const stopMixer = useCallback(() => {
    stopAllNodes();
    setMixerFrequenciesPlaying(false);
    setMixerMusicPlaying(false);
  }, []);

  // Função para parar tudo (todas as abas)
  const stopAll = useCallback(() => {
    stopAllNodes();
    setFrequenciesPlaying(false);
    setMusicPlaying(false);
    setMixerFrequenciesPlaying(false);
    setMixerMusicPlaying(false);
  }, [stopAllNodes]);

  useEffect(() => {
    const ac = audioContextRef.current;
    return () => {
      stopAllNodes();
      if (ac && ac.state !== 'closed') {
        ac.close().catch(() => {});
        audioContextRef.current = null;
        masterGainRef.current = null;
      }
    };
  }, [stopAllNodes]);

  return { 
    play, 
    stop, 
    setGlobalVolume, 
    setMusicVolume,
    setFrequenciesVolume,
    exportAudioAsWav,
    mixAudio,
    loadMusic,
    playMusicOnly,
    playFrequenciesOnly,
    stopFrequencies,
    frequenciesPlaying,
    musicPlaying,
    playMixerFrequencies,
    playMixerMusic,
    stopMixer,
    stopAll,
    mixerFrequenciesPlaying,
    mixerMusicPlaying
  };
}
