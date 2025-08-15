import { useState, useRef, useEffect } from 'react';
import { Upload, Music, X, Play, Pause, Volume2, FileAudio } from 'lucide-react';

export function AudioUploader({ 
  onAudioLoaded, 
  isPlaying, 
  onPlayPause, 
  onStop, 
  volume, 
  onVolumeChange,
  disabled,
  audioFile: externalAudioFile // Nova prop para receber arquivo externo
}) {
  const [audioFile, setAudioFile] = useState(externalAudioFile);
  const [audioName, setAudioName] = useState(externalAudioFile?.name || '');
  const [audioDuration, setAudioDuration] = useState(externalAudioFile?.duration || 0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  // Atualizar estado quando audioFile externo mudar
  useEffect(() => {
    if (externalAudioFile && externalAudioFile !== audioFile) {
      setAudioFile(externalAudioFile);
      setAudioName(externalAudioFile.name);
      setAudioDuration(externalAudioFile.duration);
      
      // Configurar áudio se não estiver configurado
      if (audioRef.current && externalAudioFile.url) {
        audioRef.current.src = externalAudioFile.url;
        audioRef.current.load();
      }
    }
  }, [externalAudioFile, audioFile]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    processAudioFile(file);
  };

  const processAudioFile = (file) => {
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
      setAudioName(file.name);
      
      // Criar URL para preview
      const url = URL.createObjectURL(file);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.load();
      }
      
      // Extrair metadados do áudio
      const audio = new Audio(url);
      audio.addEventListener('loadedmetadata', () => {
        setAudioDuration(audio.duration);
        onAudioLoaded({
          file: file,
          url: url,
          duration: audio.duration,
          name: file.name
        });
      });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processAudioFile(files[0]);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isAudioPlaying) {
      audioRef.current.pause();
      setIsAudioPlaying(false);
    } else {
      audioRef.current.play();
      setIsAudioPlaying(true);
    }
    onPlayPause();
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsAudioPlaying(false);
      setCurrentTime(0);
    }
    onStop();
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSeek = (e) => {
    if (audioRef.current) {
      const seekTime = (e.target.value / 100) * audioDuration;
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleRemoveAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setAudioFile(null);
    setAudioName('');
    setAudioDuration(0);
    setCurrentTime(0);
    setIsAudioPlaying(false);
    onAudioLoaded(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'mp3':
        return '🎵';
      case 'wav':
        return '🎧';
      case 'ogg':
        return '🎼';
      case 'm4a':
        return '🎤';
      default:
        return '🎵';
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <Music className="w-5 h-5 mr-2 text-violet-400" />
        Música de Fundo
      </div>

      {!audioFile ? (
        <div 
          className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className={`upload-icon ${isDragOver ? 'text-violet-400' : 'text-gray-400'}`}>
            {isDragOver ? <FileAudio className="w-12 h-12 mx-auto mb-4" /> : <Upload className="w-12 h-12 mx-auto mb-4" />}
          </div>
          <p className={`upload-text ${isDragOver ? 'text-violet-300' : 'text-gray-300'} mb-2`}>
            {isDragOver ? 'Solte a música aqui!' : 'Arraste uma música aqui ou clique para selecionar'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Formatos suportados: MP3, WAV, OGG, M4A
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="btn-primary"
          >
            Selecionar Arquivo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Info do arquivo */}
          <div className="bg-gray-800 p-3 rounded-lg border border-gray-600/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getFileIcon(audioName)}</span>
                <div>
                  <p className="text-gray-200 font-medium truncate">{audioName}</p>
                  <p className="text-sm text-gray-400">
                    {formatFileSize(audioFile.size)} • {formatTime(audioDuration)}
                  </p>
                </div>
              </div>
              <button
                onClick={handleRemoveAudio}
                disabled={disabled}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50 rounded-full hover:bg-red-400/10"
                title="Remover música"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Player de áudio */}
          <div className="bg-gray-800 p-3 rounded-lg border border-gray-600/30">
            <div className="audio-controls mb-3">
              <button
                onClick={handlePlayPause}
                disabled={disabled}
                className={`control-button ${isAudioPlaying ? 'pause' : 'play'}`}
                title={isAudioPlaying ? 'Pausar' : 'Reproduzir'}
              >
                {isAudioPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleStop}
                disabled={disabled || !isAudioPlaying}
                className="control-button stop"
                title="Parar"
              >
                <X className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-400 flex-1 text-center">
                {formatTime(currentTime)} / {formatTime(audioDuration)}
              </span>
            </div>

            {/* Barra de progresso */}
            <div className="progress-container mb-3">
              <input
                type="range"
                min="0"
                max="100"
                value={audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0}
                onChange={handleSeek}
                disabled={disabled}
                className="w-full h-2 bg-transparent appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0}%, #4b5563 ${audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0}%, #4b5563 100%)`
                }}
              />
            </div>

            {/* Controle de volume */}
            <div className="volume-control">
              <Volume2 className="w-4 h-4 text-gray-400" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                disabled={disabled}
                className="volume-slider"
              />
              <span className="text-sm text-gray-400 w-12 text-right">
                {(volume * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Dicas de uso */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
            <p className="text-sm text-blue-300">
              💡 <strong>Dica:</strong> Agora você pode ir para a aba "Mixer" para combinar esta música com as frequências sonoras!
            </p>
          </div>
        </div>
      )}

      {/* Áudio element para controle */}
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsAudioPlaying(false)}
        onPlay={() => setIsAudioPlaying(true)}
        onPause={() => setIsAudioPlaying(false)}
        className="hidden"
      />
    </div>
  );
}
