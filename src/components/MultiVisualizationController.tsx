import { BarChart3, Circle, Waves, Sparkles, Activity, TrendingUp, Globe, Disc3 } from "lucide-react";
import { MultiVisualizationConfig } from "@/types/audio";

interface MultiVisualizationControllerProps {
  config: MultiVisualizationConfig;
  onConfigChange: (config: MultiVisualizationConfig) => void;
  isVisible: boolean;
}

const visualizationTypes = [
  { type: "bars" as const, icon: BarChart3, label: "Frequency Bars", color: "#60a5fa" },
  { type: "circular" as const, icon: Circle, label: "Circular", color: "#a78bfa" },
  { type: "waveform" as const, icon: Waves, label: "Waveform", color: "#34d399" },
  { type: "particles" as const, icon: Sparkles, label: "Particles", color: "#fbbf24" },
  { type: "mirrored-waveform" as const, icon: Activity, label: "Mirrored Waveform", color: "#f472b6" },
  { type: "3d-globe" as const, icon: Globe, label: "3D Globe", color: "#38bdf8" },
  { type: "3d-disc" as const, icon: Disc3, label: "3D Disc", color: "#fb7185" },
  { type: "analytics" as const, icon: TrendingUp, label: "Advanced Analytics", color: "#fb923c" },
];

export const MultiVisualizationController = ({
  config,
  onConfigChange,
  isVisible,
}: MultiVisualizationControllerProps) => {
  const toggleVisualization = (
    type: keyof MultiVisualizationConfig["enabled"]
  ) => {
    onConfigChange({
      ...config,
      enabled: {
        ...config.enabled,
        [type]: !config.enabled[type],
      },
    });
  };

  return (
    <div
      className={`transition-all duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className="flex gap-1"
      >
        {/* Toggle Controls */}
        {visualizationTypes.map(({ type, icon: Icon, label, color }) => {
          const isEnabled = config.enabled[type];
          return (
            <button
              key={type}
              onClick={() => toggleVisualization(type)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                isEnabled
                  ? ""
                  : "opacity-30 hover:opacity-60"
              }`}
              style={{
                boxShadow: isEnabled ? `0 0 8px ${color}30` : undefined,
                background: isEnabled
                  ? `linear-gradient(135deg, ${color}25, ${color}10)`
                  : "rgba(20, 20, 20, 0.4)",
              }}
              title={`${label}`}
            >
              <Icon
                className="w-4 h-4"
                style={{
                  color: color,
                  opacity: isEnabled ? 1 : 0.5,
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
