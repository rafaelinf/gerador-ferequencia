import React, { useState } from 'react';
import { Radio, Music, Sliders } from 'lucide-react';
import FrequenciesTab from './FrequenciesTab';
import MusicTab from './MusicTab';
import MixerTab from './MixerTab';

export default function ControlPanel({
  selectedToneType,
  onToneTypeChange,
  settings,
  onSettingsChange,
  volume,
  onVolumeChange,
  audioFile,
  onMusicLoaded,
  onMusicPlayPause,
  onMusicStop,
  onMusicVolumeChange,
  onExport
}) {
  const [activeTab, setActiveTab] = useState('frequencies');

  const tabs = [
    {
      id: 'frequencies',
      name: 'Frequências',
      icon: Radio,
      description: 'Configure e toque frequências'
    },
    {
      id: 'music',
      name: 'Música',
      icon: Music,
      description: 'Upload e controle de música'
    },
    {
      id: 'mixer',
      name: 'Mixer',
      icon: Sliders,
      description: 'Misture frequências com música'
    }
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'frequencies':
        return (
          <FrequenciesTab
            selectedToneType={selectedToneType}
            onToneTypeChange={onToneTypeChange}
            settings={settings}
            onSettingsChange={onSettingsChange}
            volume={volume}
            onVolumeChange={onVolumeChange}
          />
        );
      
      case 'music':
        return (
          <MusicTab
            onMusicLoaded={onMusicLoaded}
            onMusicPlayPause={onMusicPlayPause}
            onMusicStop={onMusicStop}
            onMusicVolumeChange={onMusicVolumeChange}
            externalAudioFile={audioFile}
          />
        );
      
      case 'mixer':
        return (
          <MixerTab
            audioFile={audioFile}
            selectedToneType={selectedToneType}
            settings={settings}
            onExport={onExport}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Navegação por Abas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 flex flex-col items-center py-4 px-6 transition-all duration-200 ${
                  isActive
                    ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-6 h-6 mb-2 ${isActive ? 'text-violet-600' : 'text-gray-400'}`} />
                <span className="text-sm font-medium">{tab.name}</span>
                <span className="text-xs text-gray-400 mt-1">{tab.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo da Aba Ativa */}
      <div className="min-h-[600px]">
        {renderActiveTab()}
      </div>
    </div>
  );
}
