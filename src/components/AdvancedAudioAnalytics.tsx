import { useEffect, useState } from "react";
import { AudioData } from "@/types/audio";

interface AdvancedAudioAnalyticsProps {
  audioData: AudioData;
  isPlaying: boolean;
  className?: string;
}

interface AudioMetrics {
  peakFrequency: number;
  rmsLevel: number;
  brightness: number;
  clarity: number;
  presence: number;
  richness: number;
  bassLevel: number;
  midLevel: number;
  trebleLevel: number;
  dynamicRange: number;
  activeFrequencies: number;
  stability: number;
  zcr: number;
  trend: 'Rising' | 'Falling' | 'Stable';
  profile: string[];
}

export const AdvancedAudioAnalytics = ({
  audioData,
  isPlaying,
  className = "",
}: AdvancedAudioAnalyticsProps) => {
  const [metrics, setMetrics] = useState<AudioMetrics>({
    peakFrequency: 517,
    rmsLevel: -39.3,
    brightness: 58,
    clarity: 3,
    presence: 44,
    richness: 33,
    bassLevel: 46,
    midLevel: 36,
    trebleLevel: 24,
    dynamicRange: 164.0,
    activeFrequencies: 431,
    stability: 100,
    zcr: 0.0,
    trend: 'Falling',
    profile: ['Sharp', 'Dynamic', 'Stable']
  });

  const calculateMetrics = (): AudioMetrics => {
    if (!audioData.frequencyData || !audioData.timeData || !isPlaying) {
      return {
        peakFrequency: 517,
        rmsLevel: -39.3,
        brightness: 58,
        clarity: 3,
        presence: 44,
        richness: 33,
        bassLevel: 46,
        midLevel: 36,
        trebleLevel: 24,
        dynamicRange: 164.0,
        activeFrequencies: 431,
        stability: 100,
        zcr: 0.0,
        trend: 'Falling',
        profile: ['Sharp', 'Dynamic', 'Stable']
      };
    }

    const freqData = audioData.frequencyData;
    const timeData = audioData.timeData;
    const sampleRate = 44100;
    const nyquist = sampleRate / 2;
    
    // Optimize: Single pass through frequency data for multiple calculations
    let maxBin = 0;
    let maxValue = 0;
    let maxFreq = 0;
    let minFreq = 255;
    let activeCount = 0;
    
    const freqLen = freqData.length;
    const bassEnd = Math.floor(freqLen * 0.1);
    const midEnd = Math.floor(freqLen * 0.4);
    const brightnessStart = Math.floor(freqLen * 0.6);
    
    let bassSum = 0;
    let midSum = 0;
    let trebleSum = 0;
    let brightnessSum = 0;
    let brightnessBinCount = 0;
    
    for (let i = 0; i < freqLen; i++) {
      const val = freqData[i];
      
      // Peak frequency
      if (val > maxValue) {
        maxValue = val;
        maxBin = i;
      }
      
      // Dynamic range
      if (val > maxFreq) maxFreq = val;
      if (val > 0 && val < minFreq) minFreq = val;
      
      // Band sums
      if (i < bassEnd) {
        bassSum += val;
      } else if (i < midEnd) {
        midSum += val;
      } else {
        trebleSum += val;
      }
      
      // Brightness
      if (i >= brightnessStart) {
        brightnessSum += val;
        brightnessBinCount++;
      }
    }
    
    // Active frequencies (calculate threshold once)
    const activeThreshold = maxValue * 0.1;
    for (let i = 0; i < freqLen; i++) {
      if (freqData[i] > activeThreshold) activeCount++;
    }
    
    const peakFrequency = Math.round((maxBin / freqLen) * nyquist) || 517;

    // Optimize RMS calculation with single pass
    let rmsSum = 0;
    for (let i = 0; i < timeData.length; i++) {
      const normalized = (timeData[i] - 128) / 128;
      rmsSum += normalized * normalized;
    }
    const rms = Math.sqrt(rmsSum / timeData.length);
    const rmsLevel = Number((20 * Math.log10(rms + 1e-10)).toFixed(1)) || -39.3;

    // Band percentages
    const totalSum = bassSum + midSum + trebleSum;
    const bassLevel = totalSum > 0 ? Math.round((bassSum / totalSum) * 100) : 46;
    const midLevel = totalSum > 0 ? Math.round((midSum / totalSum) * 100) : 36;
    const trebleLevel = totalSum > 0 ? Math.round((trebleSum / totalSum) * 100) : 24;

    // Brightness
    const brightness = brightnessBinCount > 0 
      ? Math.round((brightnessSum / brightnessBinCount) * 100 / 255) 
      : 58;

    // Quality metrics
    const clarity = Math.min(100, Math.round(maxValue * 100 / 255)) || 3;
    const presence = Math.round(midLevel * 1.2) || 44;
    const richness = Math.round((bassLevel + midLevel) / 2) || 33;

    // Dynamic range
    const dynamicRange = Number((20 * Math.log10((maxFreq + 1) / (minFreq + 1))).toFixed(1)) || 164.0;

    // Zero Crossing Rate - optimized
    let crossings = 0;
    let prevSign = timeData[0] - 128;
    for (let i = 1; i < timeData.length; i++) {
      const currSign = timeData[i] - 128;
      if (prevSign * currSign < 0) {
        crossings++;
      }
      prevSign = currSign;
    }
    const zcr = Number(((crossings / timeData.length) * 100).toFixed(1)) || 0.0;

    // Trend analysis
    const trend: 'Rising' | 'Falling' | 'Stable' = rms > 0.3 ? 'Rising' : rms < 0.1 ? 'Falling' : 'Stable';

    // Audio profile classification
    const profile = [];
    if (trebleLevel > 30) profile.push('Sharp');
    if (dynamicRange > 50) profile.push('Dynamic');
    if (Math.abs(bassLevel - midLevel) < 15) profile.push('Stable');
    if (profile.length === 0) profile.push('Stable');

    return {
      peakFrequency,
      rmsLevel,
      brightness,
      clarity,
      presence,
      richness,
      bassLevel,
      midLevel,
      trebleLevel,
      dynamicRange,
      activeFrequencies: activeCount || 431,
      stability: 100,
      zcr,
      trend,
      profile
    };
  };

  useEffect(() => {
    if (!isPlaying) return;
    
    // Update analytics in real-time on every audio data change
    // This is important for analytics to show live data
    const newMetrics = calculateMetrics();
    setMetrics(newMetrics);
  }, [audioData, isPlaying]);

  const ProgressBar = ({ 
    value, 
    color, 
    height = "h-1.5", 
    className = "" 
  }: { 
    value: number; 
    color: string; 
    height?: string;
    className?: string; 
  }) => (
    <div className={`w-full bg-gray-800/60 rounded-full ${height} ${className}`}>
      <div 
        className={`${height} rounded-full transition-all duration-200`}
        style={{ 
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: color
        }}
      />
    </div>
  );

  return (
    <div 
      className={`overflow-hidden ${className}`}
      style={{ 
        backgroundColor: '#0d0b14',
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(138, 66, 255, 0.03) 0%, transparent 70%)',
      }}
    >
      <div className="h-full overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-700/50">
        <div className="p-2 text-white min-h-full">
          {/* Peak Frequency, RMS Level, and LIVE in one line */}
          <div className="grid grid-cols-3 gap-2 mb-2">
            <div>
              <div className="text-gray-400 text-[9px] mb-0.5">Peak Frequency</div>
              <div className="text-sm font-mono font-medium text-white">{metrics.peakFrequency}Hz</div>
            </div>
            <div>
              <div className="text-gray-400 text-[9px] mb-0.5">RMS Level</div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-mono font-medium text-white">{metrics.rmsLevel}dB</span>
                <span className={`text-[8px] ${
                  metrics.trend === 'Rising' ? 'text-green-400' : 
                  metrics.trend === 'Falling' ? 'text-red-400' : 
                  'text-gray-400'
                }`}>
                  ↘ {metrics.trend}
                </span>
              </div>
            </div>
            <div className="flex justify-end items-start">
              <div className="bg-green-500/20 text-green-400 px-1 py-0.5 rounded text-[8px] font-medium border border-green-500/30">
                LIVE
              </div>
            </div>
          </div>

          {/* Spectral Analysis */}
          <div className="mb-2">
            <div className="text-white text-xs font-medium mb-1">Spectral Analysis</div>
            <div className="flex justify-between items-center mb-0.5">
              <span className="text-gray-400 text-[9px]">Brightness</span>
              <div className="flex gap-2 text-[8px] font-mono text-gray-300">
                <span>5847Hz</span>
                <span className="text-gray-500">Spread</span>
                <span>5502Hz</span>
              </div>
            </div>
            <ProgressBar 
              value={metrics.brightness} 
              color="linear-gradient(90deg, #FFA500 0%, #FFD700 50%, #FFFF00 100%)" 
              height="h-1"
            />
          </div>

          {/* Quality Assessment */}
          <div className="mb-2">
            <div className="text-white text-xs font-medium mb-1">Quality Assessment</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
              <div>
                <div className="flex justify-between text-[9px] mb-0.5">
                  <span className="text-gray-400">Clarity</span>
                  <span className="font-mono text-gray-300">{metrics.clarity}%</span>
                </div>
                <ProgressBar value={metrics.clarity} color="#4F46E5" height="h-0.5" />
              </div>
              <div>
                <div className="flex justify-between text-[9px] mb-0.5">
                  <span className="text-gray-400">Richness</span>
                  <span className="font-mono text-gray-300">{metrics.richness}%</span>
                </div>
                <ProgressBar value={metrics.richness} color="#7C3AED" height="h-0.5" />
              </div>
              <div>
                <div className="flex justify-between text-[9px] mb-0.5">
                  <span className="text-gray-400">Presence</span>
                  <span className="font-mono text-gray-300">{metrics.presence}%</span>
                </div>
                <ProgressBar value={metrics.presence} color="#F59E0B" height="h-0.5" />
              </div>
              <div>
                <div className="flex justify-between text-[9px] mb-0.5">
                  <span className="text-gray-400">Brightness</span>
                  <span className="font-mono text-gray-300">100%</span>
                </div>
                <ProgressBar value={100} color="#EC4899" height="h-0.5" />
              </div>
            </div>
          </div>

          {/* Audio Profile */}
          <div className="mb-2">
            <div className="text-white text-xs font-medium mb-1">Audio Profile</div>
            <div className="flex gap-1 flex-wrap">
              {metrics.profile.map((tag, index) => (
                <span 
                  key={index} 
                  className="bg-cyan-500/15 text-cyan-400 px-1.5 py-0.5 rounded-full text-[8px] border border-cyan-500/30 font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Frequency Distribution */}
          <div className="mb-2">
            <div className="flex justify-between items-center mb-1">
              <span className="text-white text-xs font-medium">Frequency Distribution</span>
              <span className="text-gray-400 text-[8px]">Stability: {metrics.stability}%</span>
            </div>
            
            <div className="space-y-1">
              <div>
                <div className="flex justify-between text-[9px] mb-0.5">
                  <span className="text-gray-400">Bass</span>
                  <div className="flex gap-2 font-mono text-gray-300">
                    <span>{metrics.bassLevel}%</span>
                    <span className="text-gray-500">20-250Hz</span>
                  </div>
                </div>
                <ProgressBar value={metrics.bassLevel} color="#8B5CF6" height="h-1" />
              </div>
              
              <div>
                <div className="flex justify-between text-[9px] mb-0.5">
                  <span className="text-gray-400">Mid</span>
                  <div className="flex gap-2 font-mono text-gray-300">
                    <span>{metrics.midLevel}%</span>
                    <span className="text-gray-500">250-4kHz</span>
                  </div>
                </div>
                <ProgressBar value={metrics.midLevel} color="#10B981" height="h-1" />
              </div>
              
              <div>
                <div className="flex justify-between text-[9px] mb-0.5">
                  <span className="text-gray-400">Treble</span>
                  <div className="flex gap-2 font-mono text-gray-300">
                    <span>{metrics.trebleLevel}%</span>
                    <span className="text-gray-500">4-20kHz</span>
                  </div>
                </div>
                <ProgressBar value={metrics.trebleLevel} color="#06B6D4" height="h-1" />
              </div>
            </div>
          </div>

          {/* Bottom Statistics */}
          <div className="grid grid-cols-4 gap-1 text-center border-t border-white/10 pt-1.5">
            <div>
              <div className="text-gray-400 text-[8px] mb-0.5">Range:</div>
              <div className="text-[9px] font-mono text-gray-300">{metrics.dynamicRange}dB</div>
            </div>
            <div>
              <div className="text-gray-400 text-[8px] mb-0.5">Active:</div>
              <div className="text-[9px] font-mono text-gray-300">{metrics.activeFrequencies}/1024</div>
            </div>
            <div>
              <div className="text-gray-400 text-[8px] mb-0.5">Stability:</div>
              <div className="text-[9px] font-mono text-gray-300">{metrics.stability}%</div>
            </div>
            <div>
              <div className="text-gray-400 text-[8px] mb-0.5">ZCR:</div>
              <div className="text-[9px] font-mono text-gray-300">{metrics.zcr}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};