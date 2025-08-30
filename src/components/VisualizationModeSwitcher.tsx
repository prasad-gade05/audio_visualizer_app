import { BarChart3, Circle, Waves, Sparkles } from 'lucide-react';
import { VisualizationConfig } from '@/types/audio';

interface VisualizationModeSwitcherProps {
  config: VisualizationConfig;
  onConfigChange: (config: VisualizationConfig) => void;
  isVisible: boolean;
}

const visualizationTypes = [
  { type: 'bars' as const, icon: BarChart3, label: 'Frequency Bars' },
  { type: 'circular' as const, icon: Circle, label: 'Circular' },
  { type: 'waveform' as const, icon: Waves, label: 'Waveform' },
  { type: 'particles' as const, icon: Sparkles, label: 'Particles' },
];

export const VisualizationModeSwitcher = ({ 
  config, 
  onConfigChange, 
  isVisible 
}: VisualizationModeSwitcherProps) => {
  const handleTypeChange = (type: VisualizationConfig['type']) => {
    onConfigChange({
      ...config,
      type
    });
  };

  return (
    <div 
      className={`fixed right-6 top-1/2 transform -translate-y-1/2 z-40 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-30 translate-x-2'
      }`}
    >
      <div className="glass p-3 space-y-2" style={{ boxShadow: 'var(--box-shadow-glow-sm)' }}>
        {visualizationTypes.map(({ type, icon: Icon, label }) => {
          const isSelected = config.type === type;
          return (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                isSelected 
                  ? 'glass-interactive'
                  : 'glass-interactive opacity-60 hover:opacity-100'
              }`}
              style={{
                boxShadow: isSelected ? 'var(--box-shadow-glow-md)' : undefined,
                borderColor: isSelected ? 'var(--color-primary)' : undefined,
                background: isSelected 
                  ? `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`
                  : undefined
              }}
              title={label}
            >
              <Icon 
                className="w-6 h-6" 
                style={{ 
                  color: isSelected ? '#FFFFFF' : 'var(--color-text-secondary)' 
                }} 
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};