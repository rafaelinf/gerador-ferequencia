import { useState, useRef, useCallback, useEffect } from 'react';

export function useAudioEngine() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef(null);
  const masterGainRef = useRef(null);

  const osc1Ref = useRef(null);
  const osc2Ref = useRef(null);
  const panner1Ref = useRef(null);
  const panner2Ref = useRef(null);
  const isochronicCarrierGainRef = useRef(null);
  const pulseLFORef = useRef(null);
  const lfoModulatorGainRef = useRef(null);
  const currentPlayingTypeRef = useRef(null);

  const ensureAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.connect(audioContextRef.current.destination);
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  const stopAllNodes = useCallback((context = audioContextRef.current) => {
    if (!context) return;
    
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
    
    osc1Ref.current = null; 
    osc2Ref.current = null; 
    pulseLFORef.current = null;

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
    
    panner1Ref.current = null; 
    panner2Ref.current = null; 
    lfoModulatorGainRef.current = null; 
    isochronicCarrierGainRef.current = null;

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

  const play = useCallback((type, settings, globalVolume) => {
    ensureAudioContext();
    const ac = audioContextRef.current;
    const masterGain = masterGainRef.current;
    if (!ac || !masterGain) return;
    
    stopAllNodes();

    masterGain.gain.setValueAtTime(globalVolume, ac.currentTime);
    currentPlayingTypeRef.current = type;

    const liveNodeRefs = {
      osc1Ref, osc2Ref, panner1Ref, panner2Ref, 
      isochronicCarrierGainRef, pulseLFORef, lfoModulatorGainRef
    };

    createAudioGraph(ac, masterGain, type, settings, liveNodeRefs);

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

    setIsPlaying(true);
  }, [ensureAudioContext, stopAllNodes, createAudioGraph]);

  const stop = useCallback(() => { 
    stopAllNodes(); 
    setIsPlaying(false); 
  }, [stopAllNodes]);

  const setGlobalVolume = useCallback((volume) => {
    if (masterGainRef.current && audioContextRef.current) {
      masterGainRef.current.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
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

  const exportAudioAsWav = async (type, settings, globalVolume, durationInSeconds) => {
    const sampleRate = 44100;
    const numChannels = (type === 'Binaural') ? 2 : 1;
    const OfflineAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    
    if (!OfflineAC) {
      throw new Error("OfflineAudioContext não suportado no navegador.");
    }

    const offlineCtx = new OfflineAC(numChannels, Math.floor(sampleRate * durationInSeconds), sampleRate);
    const offlineMasterGain = offlineCtx.createGain();
    offlineMasterGain.gain.setValueAtTime(globalVolume, 0);
    offlineMasterGain.connect(offlineCtx.destination);

    const offlineNodeRefs = {
      osc1Ref: { current: null },
      osc2Ref: { current: null },
      panner1Ref: { current: null },
      panner2Ref: { current: null },
      isochronicCarrierGainRef: { current: null },
      pulseLFORef: { current: null },
      lfoModulatorGainRef: { current: null }
    };

    createAudioGraph(offlineCtx, offlineMasterGain, type, settings, offlineNodeRefs);

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
    a.download = `aura_harmonics_${type.toLowerCase().replace(/\s+/g,'_')}_${timestamp}.wav`;
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return true;
  };

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
    isPlaying, 
    setGlobalVolume, 
    exportAudioAsWav 
  };
}
