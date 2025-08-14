import { useState } from 'react';
import { ParameterInput } from './ParameterInput';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { FREQUENCY_RANGES } from '../constants';

export function ControlPanel({
  toneTypesConfig,
  selectedToneType,
  onToneTypeChange,
  settings,
  onSettingsChange,
  volume,
  onVolumeChange,
  onPlayToggle,
  isPlaying,
  onExport,
  exportDuration,
  onExportDurationChange,
  isExporting,
  exportStatusMessage,
  presets,
  onPresetSelect
}) {
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);

  const renderSettingsInputs = () => {
    if (selectedToneType === 'Isochronic') {
      return (
        <>
          <ParameterInput
            label="Frequência Portadora (Hz)"
            id="carrierFreq"
            value={settings.carrierFreq}
            onChange={v => onSettingsChange({ carrierFreq: v })}
            min={FREQUENCY_RANGES.carrierFreq.min}
            max={FREQUENCY_RANGES.carrierFreq.max}
            step={FREQUENCY_RANGES.carrierFreq.step}
          />
          <ParameterInput
            label="Frequência de Pulsação (Hz)"
            id="pulseFreq"
            value={settings.pulseFreq}
            onChange={v => onSettingsChange({ pulseFreq: v })}
            min={FREQUENCY_RANGES.pulseFreq.min}
            max={FREQUENCY_RANGES.pulseFreq.max}
            step={FREQUENCY_RANGES.pulseFreq.step}
          />
        </>
      );
    } else if (selectedToneType === 'Binaural') {
      return (
        <>
          <ParameterInput
            label="Frequência Base (Hz)"
            id="baseFreq"
            value={settings.baseFreq}
            onChange={v => onSettingsChange({ baseFreq: v })}
            min={FREQUENCY_RANGES.baseFreq.min}
            max={FREQUENCY_RANGES.baseFreq.max}
            step={FREQUENCY_RANGES.baseFreq.step}
          />
          <ParameterInput
            label="Frequência de Batida (Hz)"
            id="beatFreq"
            value={settings.beatFreq}
            onChange={v => onSettingsChange({ beatFreq: v })}
            min={FREQUENCY_RANGES.beatFreq.min}
            max={FREQUENCY_RANGES.beatFreq.max}
            step={FREQUENCY_RANGES.beatFreq.step}
          />
        </>
      );
    } else {
      return (
        <>
          <ParameterInput
            label="Frequência 1 (Hz)"
            id="freq1"
            value={settings.freq1}
            onChange={v => onSettingsChange({ freq1: v })}
            min={FREQUENCY_RANGES.freq1.min}
            max={FREQUENCY_RANGES.freq1.max}
            step={FREQUENCY_RANGES.freq1.step}
          />
          <ParameterInput
            label="Frequência 2 (Hz)"
            id="freq2"
            value={settings.freq2}
            onChange={v => onSettingsChange({ freq2: v })}
            min={FREQUENCY_RANGES.freq2.min}
            max={FREQUENCY_RANGES.freq2.max}
            step={FREQUENCY_RANGES.freq2.step}
          />
        </>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Tipo de Tom */}
      <div className="p-1 bg-gray-700 rounded-lg flex space-x-1">
        {toneTypesConfig.map(tone => (
          <button
            key={tone.id}
            onClick={() => onToneTypeChange(tone.id)}
            disabled={isPlaying || isExporting}
            className={`w-full py-2.5 px-4 rounded-md text-sm font-medium transition-colors duration-150 focus:outline-none ${
              selectedToneType === tone.id
                ? 'bg-violet-600 text-white shadow-md'
                : 'text-gray-300 hover:bg-gray-600 hover:text-white'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {tone.label}
          </button>
        ))}
      </div>

      {/* Presets */}
      <div className="p-4 bg-gray-700/50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-200 mb-3">Presets</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {presets.map(p => (
            <button
              key={p.id}
              onClick={() => onPresetSelect(p.id)}
              disabled={isExporting}
              title={p.description}
              className="px-3 py-2 text-xs font-medium text-center text-white bg-violet-500 rounded-lg hover:bg-violet-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed truncate"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Configurações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4 bg-gray-700/50 rounded-lg">
        {renderSettingsInputs()}
      </div>

      {/* Volume */}
      <div className="p-4 bg-gray-700/50 rounded-lg">
        <label htmlFor="volume" className="block text-sm font-medium text-gray-300 mb-1">
          Volume Principal
        </label>
        <div className="flex items-center space-x-3">
          <input
            id="volume"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={e => onVolumeChange(parseFloat(e.target.value))}
            disabled={isExporting}
            className="input-range"
          />
          <span className="text-sm text-gray-400 w-12 text-right">
            {(volume * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Controles de Reprodução */}
      <div className="flex justify-center items-center space-x-4 pt-4">
        <button
          onClick={onPlayToggle}
          disabled={isExporting}
          aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
          className={`p-4 rounded-full transition-all duration-150 focus:outline-none ${
            isPlaying
              ? 'bg-teal-500 text-white hover:bg-teal-600'
              : 'bg-green-500 text-white hover:bg-green-600'
          } disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {isPlaying ? "Pausar" : "Reproduzir"}
        </button>
        <button
          onClick={() => {
            if (isPlaying) onPlayToggle();
          }}
          disabled={!isPlaying || isExporting}
          className="p-4 bg-red-500 text-white rounded-full transition-all duration-150 hover:bg-red-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Parar
        </button>
      </div>

      {/* Exportação */}
      <div className="mt-6 pt-6 border-t border-gray-700 space-y-4 p-4 bg-gray-700/50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-200">Exportar Áudio</h3>
        <ParameterInput
          label="Duração (minutos)"
          id="exportDuration"
          value={exportDuration}
          onChange={onExportDurationChange}
          min={1}
          max={120}
          step={1}
          unit="min"
        />
        <button
          onClick={onExport}
          disabled={isPlaying || isExporting}
          className="w-full py-2.5 px-4 rounded-md text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? "Exportando..." : "Exportar como WAV"}
        </button>
        <p className="text-xs text-gray-400 text-center export-status">
          {exportStatusMessage}
        </p>
      </div>

      {/* Informações */}
      <div className="mt-6 pt-6 border-t border-gray-700 p-4 bg-gray-700/50 rounded-lg">
        <button
          onClick={() => setIsInfoExpanded(!isInfoExpanded)}
          className="w-full text-left text-lg font-medium text-gray-200 hover:text-violet-400 transition-colors flex justify-between items-center"
          aria-expanded={isInfoExpanded}
        >
          Informações sobre Frequências Sonoras
          {isInfoExpanded ? (
            <ChevronUpIcon className="w-5 h-5" />
          ) : (
            <ChevronDownIcon className="w-5 h-5" />
          )}
        </button>
        {isInfoExpanded && (
          <div className="mt-3 text-xs text-gray-400 space-y-2 animate-fade-in">
            <p>
              As frequências sonoras (Hz) têm usos em áudio e terapias sonoras; use com responsabilidade.
            </p>
            <ul className="list-disc list-inside pl-2">
              <li>
                <strong>174 Hz:</strong> Alívio de estresse e ansiedade.
              </li>
              <li>
                <strong>396 Hz:</strong> Liberação de medos e limpeza emocional.
              </li>
              <li>
                <strong>528 Hz:</strong> Transformação emocional e cura.
              </li>
              <li>
                <strong>639 Hz:</strong> Conexão e relacionamentos.
              </li>
              <li>
                <strong>741 Hz:</strong> Expressão e criatividade.
              </li>
              <li>
                <strong>852 Hz:</strong> Intuição e consciência espiritual.
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
