import React, { useRef, useState, useCallback, useEffect } from "react";
import { Waves, Move, GripVertical } from "lucide-react";
import { VisualizationPosition } from "@/types/audio";

interface DraggableVisualizationItemProps {
  type: string;
  position: VisualizationPosition;
  isPlaying: boolean;
  children: React.ReactNode;
  onPositionChange: (type: string, position: VisualizationPosition) => void;
  containerBounds: DOMRect | null;
  allPositions?: Record<string, VisualizationPosition>;
}

export const DraggableVisualizationItem: React.FC<
  DraggableVisualizationItemProps
> = ({
  type,
  position,
  isPlaying,
  children,
  onPositionChange,
  containerBounds,
  allPositions = {},
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only start drag if clicking on the drag handle or the visualization itself
      const target = e.target as HTMLElement;
      if (target.closest(".drag-handle") || target.closest("canvas")) {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({
          x: e.clientX - position.x,
          y: e.clientY - position.y,
        });
      }
    },
    [position.x, position.y]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerBounds) return;

      e.preventDefault();

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Constrain to container bounds with snap-to-grid (20px grid)
      const gridSize = 20;
      const maxX = containerBounds.width - position.width;
      const maxY = containerBounds.height - position.height;

      const constrainedX = Math.max(0, Math.min(maxX, newX));
      const constrainedY = Math.max(0, Math.min(maxY, newY));

      // Snap to grid
      const snappedX = Math.round(constrainedX / gridSize) * gridSize;
      const snappedY = Math.round(constrainedY / gridSize) * gridSize;

      onPositionChange(type, {
        ...position,
        x: snappedX,
        y: snappedY,
      });
    },
    [isDragging, dragStart, position, onPositionChange, type, containerBounds]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";
    } else {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={itemRef}
      className={`absolute rounded-lg bg-black/20 border overflow-hidden transition-all duration-200 ${
        isDragging 
          ? "shadow-2xl scale-105 z-50 border-white/40 bg-black/40" 
          : isHovered 
          ? "border-white/20 shadow-lg" 
          : "border-white/10"
      }`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${position.width}px`,
        height: `${position.height}px`,
        zIndex: isDragging ? 1000 : position.zIndex,
        transform: isDragging ? 'rotate(-1deg)' : 'rotate(0deg)',
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Drag Handle */}
      <div
        className={`drag-handle absolute top-2 right-2 z-10 p-1 rounded bg-black/60 backdrop-blur-sm transition-all duration-200 cursor-grab active:cursor-grabbing ${
          isHovered || isDragging ? "opacity-100 scale-110" : "opacity-0 scale-90"
        }`}
        title="Drag to move"
      >
        <GripVertical className="w-4 h-4 text-white/80" />
      </div>

      {/* Visualization Type Label */}
      <div
        className={`absolute top-2 left-2 z-10 px-2 py-1 rounded text-xs font-medium bg-black/60 backdrop-blur-sm transition-all duration-200 ${
          isHovered || isDragging ? "opacity-100 scale-105" : "opacity-0 scale-95"
        }`}
        style={{ color: "var(--color-text-primary)" }}
      >
        {type.charAt(0).toUpperCase() + type.slice(1).replace("-", " ")}
      </div>

      {/* Content */}
      <div className="w-full h-full">{children}</div>

      {/* Placeholder when not playing */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="text-center"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <Waves className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium capitalize">
              {type.replace("-", " ")}
            </p>
          </div>
        </div>
      )}

      {/* Resize handles (for future enhancement) */}
      <div
        className={`absolute bottom-0 right-0 w-3 h-3 bg-white/20 cursor-se-resize transition-opacity duration-200 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
        title="Resize (coming soon)"
      />
    </div>
  );
};
