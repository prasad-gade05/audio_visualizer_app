import { useState, useEffect } from "react";
import { AudioData } from "@/types/audio";
import { analyzeAudioData } from "./VisualizationLabels";

interface AudioStatsPanelProps {
  audioData: AudioData;
  isPlaying: boolean;
  isVisible: boolean;
  mode?: "compact" | "detailed";
}

export const AudioStatsPanel = ({
  audioData,
  isPlaying,
  isVisible,
  mode = "detailed",
}: AudioStatsPanelProps) => {
  const [peakHistory, setPeakHistory] = useState<number[]>([]);
  const [dominantFreqHistory, setDominantFreqHistory] = useState<number[]>([]);
  const [spectralCentroid, setSpectralCentroid] = useState(0);
  const [spectralSpread, setSpectralSpread] = useState(0);
  const [zeroCrossingRate, setZeroCrossingRate] = useState(0);
  const [harmonicRatio, setHarmonicRatio] = useState(0);

  const stats = analyzeAudioData(audioData);

  // Advanced audio analysis
  useEffect(() => {
    if (!isPlaying || !audioData.frequencyData?.length) return;

    const freq = audioData.frequencyData;
    const time = audioData.timeData;

    // Calculate spectral centroid (brightness measure)
    let weightedSum = 0;
    let magnitudeSum = 0;
    for (let i = 0; i < freq.length; i++) {
      const magnitude = freq[i] / 255;
      const frequency = (i * 22050) / freq.length; // Approximate frequency
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }
    const centroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
    setSpectralCentroid(centroid);

    // Calculate spectral spread (measure of frequency distribution width)
    let variance = 0;
    for (let i = 0; i < freq.length; i++) {
      const magnitude = freq[i] / 255;
      const frequency = (i * 22050) / freq.length;
      variance += Math.pow(frequency - centroid, 2) * magnitude;
    }
    const spread = magnitudeSum > 0 ? Math.sqrt(variance / magnitudeSum) : 0;
    setSpectralSpread(spread);

    // Calculate zero crossing rate (texture/noisiness measure)
    if (time?.length) {
      let crossings = 0;
      for (let i = 1; i < time.length; i++) {
        if ((time[i] - 128) * (time[i - 1] - 128) < 0) {
          crossings++;
        }
      }
      setZeroCrossingRate(crossings / time.length);
    }

    // Calculate harmonic-to-noise ratio (tonal quality)
    const fundamentalBin = Math.floor(
      (stats.peakFrequency * freq.length) / 22050
    );
    const harmonicBins = [
      fundamentalBin,
      fundamentalBin * 2,
      fundamentalBin * 3,
    ].filter((bin) => bin < freq.length);
    const harmonicEnergy = harmonicBins.reduce(
      (sum, bin) => sum + freq[bin],
      0
    );
    const totalEnergy = freq.reduce((sum, val) => sum + val, 0);
    setHarmonicRatio(totalEnergy > 0 ? harmonicEnergy / totalEnergy : 0);

    // Update peak history for trend analysis
    setPeakHistory((prev) => {
      const newHistory = [...prev, stats.rmsLevel].slice(-30); // Keep last 30 samples
      return newHistory;
    });

    // Update dominant frequency history
    setDominantFreqHistory((prev) => {
      const newHistory = [...prev, stats.peakFrequency].slice(-20);
      return newHistory;
    });
  }, [audioData, isPlaying, stats.peakFrequency, stats.rmsLevel]);

  // Calculate trends
  const peakTrend =
    peakHistory.length > 10
      ? peakHistory.slice(-5).reduce((a, b) => a + b, 0) / 5 -
        peakHistory.slice(-15, -10).reduce((a, b) => a + b, 0) / 5
      : 0;

  const freqStability =
    dominantFreqHistory.length > 5
      ? 1 -
        (Math.max(...dominantFreqHistory.slice(-10)) -
          Math.min(...dominantFreqHistory.slice(-10))) /
          1000
      : 0;

  // Audio characteristics classification
  const getAudioCharacteristics = () => {
    const characteristics = [];

    if (stats.bassLevel > 0.7) characteristics.push("Bass-Heavy");
    if (stats.trebleLevel > 0.6) characteristics.push("Bright");
    if (spectralCentroid > 3000) characteristics.push("Sharp");
    if (spectralCentroid < 1000) characteristics.push("Warm");
    if (zeroCrossingRate > 0.1) characteristics.push("Noisy");
    if (harmonicRatio > 0.3) characteristics.push("Tonal");
    if (stats.dynamicRange > 40) characteristics.push("Dynamic");
    if (freqStability > 0.8) characteristics.push("Stable");

    return characteristics.length > 0 ? characteristics : ["Neutral"];
  };

  // Audio quality assessment
  const getQualityMetrics = () => {
    let clarity = Math.min(1, harmonicRatio * 2);
    let richness = Math.min(
      1,
      (stats.bassLevel + stats.midLevel + stats.trebleLevel) / 3
    );
    let presence = Math.min(1, stats.midLevel * 1.5);
    let brightness = Math.min(1, spectralCentroid / 5000);

    return { clarity, richness, presence, brightness };
  };

  const quality = getQualityMetrics();
  const characteristics = getAudioCharacteristics();

  if (!isVisible) return null;

  return (
    <div className="w-full h-full pointer-events-auto">
      <div className="glass p-4 w-full h-full overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse"></div>
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Advanced Audio Analytics
            </h3>
          </div>
          <div className="px-2 py-1 bg-green-500/20 border border-green-400/30 rounded text-xs text-green-300">
            {isPlaying ? "LIVE" : "SILENT"}
          </div>
        </div>

        {isPlaying ? (
          <div className="space-y-4">
            {/* Real-time Core Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Peak Frequency
                  </span>
                  <span
                    className="text-xs font-mono"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {Math.round(stats.peakFrequency)}Hz
                  </span>
                </div>
                <div
                  className="text-xs font-semibold"
                  style={{ color: "var(--color-accent)" }}
                >
                  {stats.peakFrequency < 250
                    ? "Sub-Bass"
                    : stats.peakFrequency < 500
                    ? "Bass"
                    : stats.peakFrequency < 2000
                    ? "Mid"
                    : stats.peakFrequency < 4000
                    ? "High-Mid"
                    : "Treble"}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    RMS Level
                  </span>
                  <span
                    className="text-xs font-mono"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {stats.rmsLevel.toFixed(1)}dB
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div
                    className="text-xs"
                    style={{
                      color:
                        peakTrend > 0
                          ? "#10b981"
                          : peakTrend < 0
                          ? "#ef4444"
                          : "#6b7280",
                    }}
                  >
                    {peakTrend > 0.1
                      ? "↗ Rising"
                      : peakTrend < -0.1
                      ? "↘ Falling"
                      : "→ Stable"}
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Spectral Analysis */}
            <div className="space-y-2">
              <h4
                className="text-xs font-medium"
                style={{ color: "var(--color-text-primary)" }}
              >
                Spectral Analysis
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      Brightness
                    </span>
                    <span style={{ color: "var(--color-text-primary)" }}>
                      {Math.round(spectralCentroid)}Hz
                    </span>
                  </div>
                  <div className="w-full h-1 bg-gray-700 rounded mt-1">
                    <div
                      className="h-1 bg-gradient-to-r from-orange-500 to-yellow-400 rounded transition-all duration-200"
                      style={{
                        width: `${Math.min(
                          100,
                          (spectralCentroid / 5000) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--color-text-secondary)" }}>
                      Spread
                    </span>
                    <span style={{ color: "var(--color-text-primary)" }}>
                      {Math.round(spectralSpread)}Hz
                    </span>
                  </div>
                  <div className="w-full h-1 bg-gray-700 rounded mt-1">
                    <div
                      className="h-1 bg-gradient-to-r from-purple-500 to-pink-400 rounded transition-all duration-200"
                      style={{
                        width: `${Math.min(
                          100,
                          (spectralSpread / 3000) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Audio Quality Metrics */}
            <div className="space-y-2">
              <h4
                className="text-xs font-medium"
                style={{ color: "var(--color-text-primary)" }}
              >
                Quality Assessment
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    label: "Clarity",
                    value: quality.clarity,
                    color: "from-blue-500 to-cyan-400",
                  },
                  {
                    label: "Richness",
                    value: quality.richness,
                    color: "from-green-500 to-emerald-400",
                  },
                  {
                    label: "Presence",
                    value: quality.presence,
                    color: "from-yellow-500 to-orange-400",
                  },
                  {
                    label: "Brightness",
                    value: quality.brightness,
                    color: "from-pink-500 to-rose-400",
                  },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="flex items-center justify-between"
                  >
                    <span
                      className="text-xs"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {metric.label}
                    </span>
                    <div className="flex items-center gap-1">
                      <div className="w-8 h-1 bg-gray-700 rounded overflow-hidden">
                        <div
                          className={`h-1 bg-gradient-to-r ${metric.color} transition-all duration-300`}
                          style={{ width: `${metric.value * 100}%` }}
                        />
                      </div>
                      <span
                        className="text-xs font-mono w-8"
                        style={{ color: "var(--color-text-primary)" }}
                      >
                        {Math.round(metric.value * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audio Characteristics Tags */}
            <div className="space-y-2">
              <h4
                className="text-xs font-medium"
                style={{ color: "var(--color-text-primary)" }}
              >
                Audio Profile
              </h4>
              <div className="flex flex-wrap gap-1">
                {characteristics.map((char, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-full text-xs text-cyan-300"
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>

            {/* Frequency Distribution with Enhanced Info */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4
                  className="text-xs font-medium"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Frequency Distribution
                </h4>
                <span
                  className="text-xs"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Stability: {Math.round(freqStability * 100)}%
                </span>
              </div>
              <div className="space-y-1">
                {[
                  {
                    label: "Bass",
                    value: stats.bassLevel,
                    range: "20-250Hz",
                    color: "bg-purple-500",
                  },
                  {
                    label: "Mid",
                    value: stats.midLevel,
                    range: "250-4kHz",
                    color: "bg-green-500",
                  },
                  {
                    label: "Treble",
                    value: stats.trebleLevel,
                    range: "4-20kHz",
                    color: "bg-cyan-500",
                  },
                ].map((band) => (
                  <div key={band.label} className="flex items-center space-x-2">
                    <span
                      className="w-12 text-xs"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {band.label}
                    </span>
                    <div className="flex-1 bg-gray-700 rounded-full h-1.5">
                      <div
                        className={`${band.color} h-1.5 rounded-full transition-all duration-200`}
                        style={{ width: `${band.value * 100}%` }}
                      />
                    </div>
                    <span
                      className="text-xs font-mono w-8"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {Math.round(band.value * 100)}%
                    </span>
                    <span
                      className="text-xs w-16"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {band.range}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Stats */}
            <div className="flex justify-between text-xs pt-2 border-t border-white/10">
              <div>
                <span style={{ color: "var(--color-text-secondary)" }}>
                  Range:{" "}
                </span>
                <span style={{ color: "var(--color-text-primary)" }}>
                  {stats.dynamicRange.toFixed(1)}dB
                </span>
              </div>
              <div>
                <span style={{ color: "var(--color-text-secondary)" }}>
                  Active:{" "}
                </span>
                <span style={{ color: "var(--color-text-primary)" }}>
                  {stats.activeBins}/1024
                </span>
              </div>
              <div>
                <span style={{ color: "var(--color-text-secondary)" }}>
                  ZCR:{" "}
                </span>
                <span style={{ color: "var(--color-text-primary)" }}>
                  {(zeroCrossingRate * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-700/50 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <p
              className="text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              No audio signal detected
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Play audio to see analytics
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
