import React from 'react';
import { RotateCcw, Grid3x3, Maximize, Minimize } from 'lucide-react';
import { MultiVisualizationConfig } from '@/types/audio';

interface GridControlPanelProps {
  config: MultiVisualizationConfig;
  onConfigChange?: (config: MultiVisualizationConfig) => void;
  className?: string;
}

export const GridControlPanel: React.FC<GridControlPanelProps> = ({
  config,
  onConfigChange,
  className = "",
}) => {
  const resetAllSizes = () => {
    if (!onConfigChange) return;
    
    const updatedPositions = { ...config.positions };
    Object.keys(updatedPositions).forEach(key => {
      updatedPositions[key as keyof typeof updatedPositions] = {
        ...updatedPositions[key as keyof typeof updatedPositions],
        colSpan: 1,
        rowSpan: 1,
      };
    });
    
    onConfigChange({
      ...config,
      positions: updatedPositions,
    });
  };

  const maximizeAll = () => {
    if (!onConfigChange) return;
    
    const updatedPositions = { ...config.positions };
    Object.keys(updatedPositions).forEach(key => {
      updatedPositions[key as keyof typeof updatedPositions] = {
        ...updatedPositions[key as keyof typeof updatedPositions],
        colSpan: 2,
        rowSpan: 2,
      };
    });
    
    onConfigChange({
      ...config,
      positions: updatedPositions,
    });
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-lg p-1 border border-white/10">
        <button
          onClick={resetAllSizes}
          className="p-2 rounded-md hover:bg-white/10 transition-colors duration-200 group"
          title="Reset all sizes to 1×1 (R)"
        >
          <RotateCcw className="w-4 h-4 text-white/70 group-hover:text-white" />
        </button>
        
        <button
          onClick={maximizeAll}
          className="p-2 rounded-md hover:bg-white/10 transition-colors duration-200 group"
          title="Maximize all items (M)"
        >
          <Maximize className="w-4 h-4 text-white/70 group-hover:text-white" />
        </button>
        
        <div className="w-px h-6 bg-white/20" />
        
        <div className="px-2 py-1 text-xs text-white/60 font-mono">
          <Grid3x3 className="w-3 h-3 inline mr-1" />
          Grid Controls
        </div>
      </div>
      
      <div className="text-xs text-white/50 hidden sm:block">
        Hover items to resize • Drag to reposition
      </div>
    </div>
  );
};