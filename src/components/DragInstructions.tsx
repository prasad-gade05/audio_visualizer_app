import React from "react";
import { Move, MousePointer } from "lucide-react";

interface DragInstructionsProps {
  isVisible: boolean;
}

export const DragInstructions: React.FC<DragInstructionsProps> = ({ isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 pointer-events-none">
      <div className="glass p-4 max-w-md">
        <div className="flex items-center gap-3 mb-2">
          <Move className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
            Drag & Drop Guide
          </h3>
        </div>
        <div className="flex items-start gap-2 text-xs" style={{ color: "var(--color-text-secondary)" }}>
          <MousePointer className="w-4 h-4 mt-0.5 text-blue-400 flex-shrink-0" />
          <p>
            Hover over any visualization to reveal the drag handle (⋮⋮), then drag it to swap positions with another visualization.
          </p>
        </div>
      </div>
    </div>
  );
};