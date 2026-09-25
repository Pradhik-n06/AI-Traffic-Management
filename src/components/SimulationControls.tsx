import React from 'react';
import { SystemConfig, ScenarioPreset, AppTheme } from '../types/traffic';
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Gauge,
  Sparkles,
  Zap,
} from 'lucide-react';

interface SimulationControlsProps {
  isRunning: boolean;
  onToggleRunning: () => void;
  onReset: () => void;
  speedMultiplier: number;
  onSpeedChange: (speed: number) => void;
  config: SystemConfig;
  onUpdateConfig: (partial: Partial<SystemConfig>) => void;
  currentPreset: ScenarioPreset;
  onSelectPreset: (preset: ScenarioPreset) => void;
  theme?: AppTheme;
}

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  isRunning,
  onToggleRunning,
  onReset,
  speedMultiplier,
  onSpeedChange,
  config,
  onUpdateConfig,
  currentPreset,
  onSelectPreset,
  theme = 'dark',
}) => {
  const containerBg =
    theme === 'light'
      ? 'bg-white border-slate-200 shadow-sm text-slate-900'
      : theme === 'thermal'
      ? 'bg-[#100624]/95 border-amber-500/30 shadow-xl text-amber-100'
      : 'bg-slate-900/90 border-slate-800 shadow-xl backdrop-blur-sm text-slate-100';

  const subTextColor =
    theme === 'light' ? 'text-slate-500' : theme === 'thermal' ? 'text-amber-200/70' : 'text-slate-400';

  const sliderTrack =
    theme === 'light' ? 'accent-emerald-600' : 'accent-emerald-500';

  return (
    <div className={`${containerBg} border rounded-2xl p-5 space-y-4 transition-colors`}>
      {/* Top Header: Controls & Presets */}
      <div className={`flex flex-wrap items-center justify-between pb-3 border-b gap-3 ${
        theme === 'light' ? 'border-slate-200' : theme === 'thermal' ? 'border-amber-500/20' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-500" />
          <h3 className={`text-sm font-bold tracking-wide ${theme === 'light' ? 'text-slate-900' : 'text-slate-100'}`}>
            Simulation Controls & Traffic Flow Calibrator
          </h3>
        </div>

        {/* Start / Pause / Reset Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleRunning}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md ${
              isRunning
                ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                ⏸ Pause Simulation
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                ▶ Start Simulation
              </>
            )}
          </button>

          <button
            onClick={onReset}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${
              theme === 'light'
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border-slate-700'
            }`}
            title="Reset vehicles and timing"
          >
            <RotateCcw className="w-3.5 h-3.5 opacity-60" />
            🔄 Reset
          </button>

          {/* Speed multiplier selector */}
          <div className={`flex items-center p-1 rounded-xl border text-xs ${
            theme === 'light' ? 'bg-slate-100 border-slate-200' : theme === 'thermal' ? 'bg-[#0f0524] border-amber-500/30' : 'bg-slate-950 border-slate-800'
          }`}>
            {[0.5, 1, 2, 3].map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-2.5 py-1 rounded-lg font-mono-numbers text-[11px] font-bold transition-colors cursor-pointer ${
                  speedMultiplier === s
                    ? theme === 'light'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'bg-slate-800 text-emerald-400 border border-slate-700'
                    : subTextColor
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sliders: Generation Rate & Density */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
        {/* Slider 1: Global Generation Rate */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-200">
              Vehicle Generation Rate
            </span>
            <span className="font-mono-numbers text-emerald-400 font-bold">
              {config.globalSpawnIntensity.toFixed(1)}x Intensity
            </span>
          </div>
          <input
            type="range"
            min={0.5}
            max={2.5}
            step={0.1}
            value={config.globalSpawnIntensity}
            onChange={(e) =>
              onUpdateConfig({ globalSpawnIntensity: parseFloat(e.target.value) })
            }
            className={`w-full ${sliderTrack} cursor-pointer`}
          />
          <p className={`text-[11px] ${subTextColor}`}>
            Controls frequency of new vehicles entering all 4 intersection branches
          </p>
        </div>

        {/* Slider 2: North-South Inbound Spawn Rate */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-200">
              North-South Spawn Flow
            </span>
            <span className="font-mono-numbers text-sky-400 font-bold">
              Level {config.spawnRateNorth} / 10
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={config.spawnRateNorth}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              onUpdateConfig({ spawnRateNorth: val, spawnRateSouth: Math.max(1, val - 1) });
            }}
            className="w-full accent-sky-500 cursor-pointer"
          />
          <p className={`text-[11px] ${subTextColor}`}>
            Increase to test heavy rush hour queueing on the North ↔ South corridor
          </p>
        </div>

        {/* Slider 3: East-West Inbound Spawn Rate */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-slate-200">
              East-West Spawn Flow
            </span>
            <span className="font-mono-numbers text-amber-400 font-bold">
              Level {config.spawnRateEast} / 10
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={config.spawnRateEast}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              onUpdateConfig({ spawnRateEast: val, spawnRateWest: Math.max(1, val - 1) });
            }}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <p className={`text-[11px] ${subTextColor}`}>
            Increase to test heavy commercial avenue queueing on the East ↔ West corridor
          </p>
        </div>
      </div>

      {/* Quick Demonstration Presets */}
      <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
        <span className={`text-[11px] uppercase font-bold tracking-wider ${subTextColor} mr-1`}>
          Instant Scenarios:
        </span>

        <button
          onClick={() => {
            onSelectPreset('heavy-ns');
            onUpdateConfig({ spawnRateNorth: 6, spawnRateSouth: 5, spawnRateEast: 2, spawnRateWest: 2 });
          }}
          className={`px-3 py-1.5 rounded-xl border transition-colors cursor-pointer font-medium ${
            currentPreset === 'heavy-ns'
              ? 'bg-sky-500/20 text-sky-400 border-sky-500/50 font-bold'
              : theme === 'light'
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
          }`}
        >
          🚗 Heavy North-South Rush
        </button>

        <button
          onClick={() => {
            onSelectPreset('heavy-ew');
            onUpdateConfig({ spawnRateNorth: 2, spawnRateSouth: 2, spawnRateEast: 6, spawnRateWest: 5 });
          }}
          className={`px-3 py-1.5 rounded-xl border transition-colors cursor-pointer font-medium ${
            currentPreset === 'heavy-ew'
              ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 font-bold'
              : theme === 'light'
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
          }`}
        >
          🚙 Heavy East-West Rush
        </button>

        <button
          onClick={() => {
            onSelectPreset('balanced');
            onUpdateConfig({ spawnRateNorth: 4, spawnRateSouth: 4, spawnRateEast: 4, spawnRateWest: 4 });
          }}
          className={`px-3 py-1.5 rounded-xl border transition-colors cursor-pointer font-medium ${
            currentPreset === 'balanced'
              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 font-bold'
              : theme === 'light'
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
          }`}
        >
          ⚖️ Balanced 4-Way Traffic
        </button>

        <button
          onClick={() => {
            onSelectPreset('off-peak');
            onUpdateConfig({ spawnRateNorth: 1, spawnRateSouth: 1, spawnRateEast: 1, spawnRateWest: 1 });
          }}
          className={`px-3 py-1.5 rounded-xl border transition-colors cursor-pointer font-medium ${
            currentPreset === 'off-peak'
              ? 'bg-purple-500/20 text-purple-400 border-purple-500/50 font-bold'
              : theme === 'light'
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
          }`}
        >
          🌙 Quiet Off-Peak (15s Green)
        </button>

        <button
          onClick={() => {
            onSelectPreset('emergency-priority');
          }}
          className={`px-3 py-1.5 rounded-xl border transition-colors cursor-pointer font-medium ${
            currentPreset === 'emergency-priority'
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 font-bold'
              : theme === 'light'
              ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800'
          }`}
        >
          🚨 Ambulance Priority Test
        </button>
      </div>
    </div>
  );
};
