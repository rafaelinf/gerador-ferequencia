import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Play, Pause, Square, Volume2, Music, FileAudio } from 'lucide-react';

export default function MusicTab({ 
  onMusicLoaded,
  onMusicPlayPause,
  onMusicStop,
  onMusicVolumeChange,
  externalAudioFile = null
}) {
  const [audioFile, setAudioFile] = useState(externalAudioFile);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  
  // Referência para o elemento audio HTML nativo
  const audioRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // Limpar intervalo quando componente for desmontado
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Atualizar arquivo externo
  useEffect(() => {
    if (externalAudioFile && externalAudioFile !== audioFile) {
      setAudioFile(externalAudioFile);
    }
  }, [externalAudioFile, audioFile]);

  // Upload de arquivo
  const handleFileUpload = useCallback(async (file) => {
    if (!file) return;
    
    try {
      // Limpar estado anterior
      setIsPlaying(false);
      setCurrentTime(0);
      
      // Criar URL para o arquivo
      const fileUrl = URL.createObjectURL(file);
      
      // Configurar arquivo
      const newAudioFile = {
        file,
        url: fileUrl,
        name: file.name,
        size: file.size,
        duration: 0 // Será definido quando o áudio carregar
      };
      
      setAudioFile(newAudioFile);
      
      // Notificar componente pai
      onMusicLoaded(newAudioFile);
      
    } catch (error) {
      console.error('Erro ao carregar arquivo:', error);
      alert('Erro ao carregar arquivo de áudio. Verifique se o formato é suportado.');
    }
  }, [onMusicLoaded]);

  // Quando o áudio carrega, obter duração
  const handleAudioLoaded = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  // Tocar/pausar
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      // Pausar
      audioRef.current.pause();
      setIsPlaying(false);
      onMusicPlayPause(false);
      
      // Parar progresso
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    } else {
      // Tocar
      audioRef.current.play();
      setIsPlaying(true);
      onMusicPlayPause(true);
      
      // Iniciar progresso
      progressIntervalRef.current = setInterval(() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
          
          // Final da música
          if (audioRef.current.ended) {
            setIsPlaying(false);
            setCurrentTime(0);
            onMusicPlayPause(false);
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
          }
        }
      }, 100);
    }
  }, [isPlaying, onMusicPlayPause]);

  // Parar
  const stopMusic = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    setIsPlaying(false);
    setCurrentTime(0);
    onMusicStop();
    
    // Parar progresso
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, [onMusicStop]);

  // Volume
  const handleVolumeChange = useCallback((newVolume) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    onMusicVolumeChange(newVolume);
  }, [onMusicVolumeChange]);

  // Seek
  const handleSeek = useCallback((e) => {
    if (!audioRef.current || !duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    
    // Reposicionar áudio
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }, [duration]);

  // Formatar tempo
  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Formatar tamanho
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Upload area
  if (!audioFile) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <Music className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload de Música</h3>
            <p className="text-gray-500 mb-6">
              Faça upload de um arquivo de áudio para usar como música de fundo
            </p>
            
            <div className="max-w-md mx-auto">
              <label className="block">
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleFileUpload(e.target.files[0])}
                  className="sr-only"
                />
                <div className="upload-area cursor-pointer">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <div className="text-sm text-gray-600">
                    <span className="font-medium text-violet-600 hover:text-violet-500">
                      Clique para selecionar
                    </span>
                    {' '}ou arraste e solte
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    MP3, WAV, OGG até 50MB
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Player
  return (
    <div className="space-y-6">
      {/* Elemento audio oculto */}
      <audio
        ref={audioRef}
        src={audioFile.url}
        onLoadedMetadata={handleAudioLoaded}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
          onMusicPlayPause(false);
        }}
        style={{ display: 'none' }}
      />

      {/* Informações do Arquivo */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <FileAudio className="w-12 h-12 text-violet-500" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{audioFile.name}</h3>
            <div className="text-sm text-gray-500 space-x-4">
              <span>{formatFileSize(audioFile.size)}</span>
              <span>•</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controles de Áudio */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Controles de Áudio</h3>
        
        {/* Controles de Play/Pause/Stop */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={togglePlayPause}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              isPlaying
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-violet-500 hover:bg-violet-600 text-white'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-5 h-5" />
                <span>Pausar</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Tocar</span>
              </>
            )}
          </button>
          
          <button
            onClick={stopMusic}
            className="flex items-center space-x-2 px-6 py-3 rounded-lg font-medium bg-gray-500 hover:bg-gray-600 text-white transition-all duration-200"
          >
            <Square className="w-5 h-5" />
            <span>Parar</span>
          </button>
        </div>

        {/* Barra de Progresso */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 cursor-pointer relative" onClick={handleSeek}>
            <div 
              className="bg-violet-500 h-2 rounded-full transition-all duration-200"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
            <div 
              className="absolute top-0 w-4 h-4 bg-violet-600 rounded-full shadow-md transform -translate-y-1 cursor-pointer"
              style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`, transform: 'translateX(-50%) translateY(-50%)' }}
            />
          </div>
        </div>

        {/* Controle de Volume */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Volume2 className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Volume</span>
            <span className="text-sm text-gray-500 ml-auto">{Math.round(volume * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>
    </div>
  );
}
