import React, { useRef, useState, useCallback, useEffect } from "react";
import { Waves, Move, GripVertical } from "lucide-react";
import { VisualizationPosition } from "@/types/audio";

interface GridDraggableVisualizationItemProps {
  type: string;
  position: VisualizationPosition;
  isPlaying: boolean;
  children: React.ReactNode;
  onPositionChange: (type: string, newGridSlot: number) => void;
  onGridSlotSwap: (draggedType: string, targetType: string) => void;
  gridSlot: number;
  gridCols: string;
  gridRows: string;
  spanClass?: string;
  allTypes: string[];
}

export const GridDraggableVisualizationItem: React.FC<GridDraggableVisualizationItemProps> = ({
  type,
  position,
  isPlaying,
  children,
  onPositionChange,
  onGridSlotSwap,
  gridSlot,
  gridCols,
  gridRows,
  spanClass = "",
  allTypes,
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [draggedOver, setDraggedOver] = useState<number | null>(null);

  // Enhanced drag start with better UX
  const handleDragStart = useCallback((e: React.DragEvent) => {
    // Set ghost image for better visual feedback
    if (itemRef.current) {
      const rect = itemRef.current.getBoundingClientRect();
      e.dataTransfer.setDragImage(itemRef.current, rect.width / 2, rect.height / 2);
    }

    setIsDragging(true);
    
    // Set drag data with more information
    const dragData = {
      type,
      currentSlot: gridSlot,
      sourceElement: 'visualization'
    };
    
    e.dataTransfer.setData("application/json", JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = "move";
  }, [type, gridSlot]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDraggedOver(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    // Only show drop indicator if this is a different item
    try {
      const dragData = JSON.parse(e.dataTransfer.getData("application/json"));
      if (dragData && dragData.currentSlot !== gridSlot) {
        setDraggedOver(gridSlot);
      }
    } catch {
      // Fallback for older browsers
      setDraggedOver(gridSlot);
    }
  }, [gridSlot]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear drag over if we're actually leaving the element
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDraggedOver(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDraggedOver(null);
    
    try {
      const dragDataString = e.dataTransfer.getData("application/json") || e.dataTransfer.getData("text/plain");
      const dragData = JSON.parse(dragDataString);
      const { type: draggedType, currentSlot } = dragData;
      
      // Only swap if it's a different position
      if (draggedType !== type && currentSlot !== gridSlot) {
        // Use atomic swap to prevent duplicate grid slots
        onGridSlotSwap(draggedType, type);
      }
    } catch (error) {
      console.error("Error handling drop:", error);
    }
  }, [type, gridSlot, onGridSlotSwap]);

  return (
    <div
      ref={itemRef}
      className={`relative overflow-hidden rounded-lg bg-black/20 border min-h-0 min-w-0 transition-all duration-300 ease-out cursor-pointer ${spanClass} ${
        isDragging 
          ? "opacity-60 scale-95 border-blue-400/60 shadow-2xl transform rotate-1" 
          : draggedOver === gridSlot 
          ? "border-blue-400/80 bg-blue-500/15 scale-102 shadow-xl animate-pulse" 
          : isHovered 
          ? "border-white/30 shadow-lg scale-101" 
          : "border-white/10"
      }`}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        zIndex: isDragging ? 1000 : draggedOver === gridSlot ? 999 : position?.zIndex || 1,
      }}
      title="Drag to swap positions"
    >
      {/* Enhanced Drag Handle */}
      <div
        className={`absolute top-2 right-2 z-20 p-2 rounded-lg bg-black/80 backdrop-blur-sm transition-all duration-300 pointer-events-none ${
          isHovered || isDragging 
            ? "opacity-100 scale-110 shadow-lg" 
            : "opacity-0 scale-90"
        }`}
      >
        <GripVertical className="w-4 h-4 text-white/90" />
      </div>

      {/* Enhanced Visualization Type Label */}
      <div
        className={`absolute top-2 left-2 z-20 px-3 py-1.5 rounded-lg text-xs font-medium bg-black/80 backdrop-blur-sm transition-all duration-300 ${
          isHovered || isDragging ? "opacity-100 scale-105" : "opacity-0 scale-95"
        }`}
        style={{ color: "var(--color-text-primary)" }}
      >
        {type.charAt(0).toUpperCase() + type.slice(1).replace("-", " ")}
      </div>

      {/* Enhanced Grid Slot Indicator */}
      <div
        className={`absolute bottom-2 right-2 z-20 px-2 py-1 rounded-full text-xs font-mono bg-black/80 backdrop-blur-sm transition-all duration-300 ${
          isHovered || isDragging ? "opacity-100 scale-110" : "opacity-60"
        }`}
        style={{ color: "var(--color-text-secondary)" }}
      >
        #{gridSlot + 1}
      </div>

      {/* Enhanced Drop Zone Indicator */}
      {draggedOver === gridSlot && (
        <div className="absolute inset-2 border-2 border-dashed border-blue-400/80 rounded-lg bg-blue-500/15 flex items-center justify-center backdrop-blur-sm">
          <div className="text-blue-300 text-sm font-medium flex items-center gap-2 animate-pulse">
            <Move className="w-4 h-4" />
            Drop here to swap
          </div>
        </div>
      )}

      {/* Content */}
      <div className="w-full h-full relative z-10">
        {children}
      </div>

      {/* Enhanced Placeholder when not playing */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div
            className="text-center transition-all duration-300"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <Waves className={`w-8 h-8 mx-auto mb-2 opacity-50 transition-transform duration-300 ${
              isHovered ? "scale-110" : "scale-100"
            }`} />
            <p className="text-sm font-medium capitalize">
              {type.replace("-", " ")}
            </p>
          </div>
        </div>
      )}

      {/* Drag Instruction Tooltip */}
      {isHovered && !isDragging && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
          <div className="bg-black/90 backdrop-blur-sm px-3 py-2 rounded-lg text-xs text-white/90 font-medium shadow-lg border border-white/20 animate-fadeIn">
            <div className="flex items-center gap-2">
              <GripVertical className="w-3 h-3" />
              Drag to reposition
            </div>
          </div>
        </div>
      )}
    </div>
  );
};