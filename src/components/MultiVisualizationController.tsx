import { BarChart3, Circle, Waves, Sparkles, Eye, EyeOff } from "lucide-react";
import { MultiVisualizationConfig } from "@/types/audio";

interface MultiVisualizationControllerProps {
  config: MultiVisualizationConfig;
  onConfigChange: (config: MultiVisualizationConfig) => void;
  isVisible: boolean;
}

const visualizationTypes = [
  { type: "bars" as const, icon: BarChart3, label: "Frequency Bars" },
  { type: "circular" as const, icon: Circle, label: "Circular" },
  { type: "waveform" as const, icon: Waves, label: "Waveform" },
  { type: "particles" as const, icon: Sparkles, label: "Particles" },
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
        className="glass p-3 flex gap-2"
        style={{ boxShadow: "var(--box-shadow-glow-sm)" }}
      >
        {/* Toggle Controls */}
        {visualizationTypes.map(({ type, icon: Icon, label }) => {
          const isEnabled = config.enabled[type];
          return (
            <button
              key={type}
              onClick={() => toggleVisualization(type)}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110 relative ${
                isEnabled
                  ? "glass-interactive"
                  : "glass-interactive opacity-40 hover:opacity-70"
              }`}
              style={{
                boxShadow: isEnabled ? "var(--box-shadow-glow-md)" : undefined,
                borderColor: isEnabled
                  ? "var(--color-primary)"
                  : "var(--color-border)",
                background: isEnabled
                  ? `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`
                  : undefined,
              }}
              title={`${label} - ${isEnabled ? "Enabled" : "Disabled"}`}
            >
              <Icon
                className="w-6 h-6"
                style={{
                  color: isEnabled ? "#FFFFFF" : "var(--color-text-disabled)",
                }}
              />

              {/* Status indicator */}
              <div
                className={`absolute -top-1 -right-1 w-3 h-3 rounded-full transition-all duration-300 ${
                  isEnabled ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  background: "var(--color-secondary)",
                  boxShadow: "0 0 6px var(--color-secondary)",
                }}
              >
                <Eye className="w-2 h-2 text-white absolute top-0.5 left-0.5" />
              </div>

              {!isEnabled && (
                <div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full transition-all duration-300"
                  style={{
                    background: "var(--color-text-disabled)",
                  }}
                >
                  <EyeOff className="w-2 h-2 text-white absolute top-0.5 left-0.5" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
