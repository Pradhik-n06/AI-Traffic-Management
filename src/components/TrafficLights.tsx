import React from 'react';
import { LaneDirection, LightColor, AppTheme } from '../types/traffic';
import { ArrowUpDown, ArrowLeftRight, Clock, AlertTriangle } from 'lucide-react';

interface TrafficLightsProps {
  lampStates: Record<LaneDirection, LightColor>;
  countdown: number;
  currentCorridor: 'NORTH-SOUTH' | 'EAST-WEST';
  isYellow: boolean;
  emergencyActive?: boolean;
  theme?: AppTheme;
}

export const TrafficLights: React.FC<TrafficLightsProps> = ({
  lampStates,
  countdown,
  currentCorridor,
  isYellow,
  emergencyActive,
  theme = 'dark',
}) => {
  const lanes: { id: LaneDirection; label: string; corridor: 'NS' | 'EW' }[] = [
    { id: 'North', label: 'NORTH', corridor: 'NS' },
    { id: 'South', label: 'SOUTH', corridor: 'NS' },
    { id: 'East', label: 'EAST', corridor: 'EW' },
    { id: 'West', label: 'WEST', corridor: 'EW' },
  ];

  const containerBg =
    theme === 'light'
      ? 'bg-white border-slate-200 shadow-sm text-slate-900'
      : theme === 'thermal'
      ? 'bg-[#100624]/95 border-amber-500/30 shadow-xl text-amber-100'
      : 'bg-slate-900/90 border-slate-800 shadow-xl backdrop-blur-sm text-slate-100';

  const subTextColor =
    theme === 'light' ? 'text-slate-500' : theme === 'thermal' ? 'text-amber-200/70' : 'text-slate-400';

  const lightPodBg =
    theme === 'light'
      ? 'bg-slate-50/90 border-slate-200'
      : theme === 'thermal'
      ? 'bg-[#080214] border-amber-900/50'
      : 'bg-slate-950/80 border-slate-800/90';

  const activeCorridorLabel = currentCorridor === 'NORTH-SOUTH' ? 'NORTH-SOUTH' : 'EAST-WEST';

  return (
    <div className={`${containerBg} border rounded-2xl p-5 transition-colors space-y-4`}>
      {/* 1. Live Countdown Banner */}
      <div className={`p-4 rounded-xl border flex flex-col justify-between ${
        isYellow
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${
              isYellow
                ? 'bg-amber-400 traffic-glow-yellow animate-pulse'
                : 'bg-emerald-500 traffic-glow-green animate-pulse'
            }`} />
            <span className="font-mono-numbers font-black text-sm sm:text-base tracking-wider">
              {isYellow ? `🟡 ${activeCorridorLabel} (CLEARANCE)` : `🟢 ${activeCorridorLabel}`}
            </span>
          </div>

          {emergencyActive && (
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-500 border border-rose-500/40 animate-pulse flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              EMERGENCY
            </span>
          )}
        </div>

        <div className="mt-2.5 flex items-baseline justify-between">
          <span className={`text-xs font-semibold ${subTextColor}`}>
            {isYellow ? 'Yellow Light Clearance:' : 'Green Time Remaining:'}
          </span>
          <div className="flex items-baseline gap-1 font-mono-numbers">
            <span className={`text-3xl font-black ${
              isYellow ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {countdown}
            </span>
            <span className="text-xs font-bold text-slate-400">seconds</span>
          </div>
        </div>
      </div>

      {/* 2. Four Traffic Signals Display (NORTH, SOUTH, EAST, WEST) */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {lanes.map(({ id, label }) => {
          const state = lampStates[id];
          const isRed = state === 'RED';
          const isYellowState = state === 'YELLOW';
          const isGreen = state === 'GREEN';

          return (
            <div
              key={id}
              className={`flex flex-col items-center p-2.5 sm:p-3 rounded-xl border shadow-sm ${lightPodBg}`}
            >
              <span className={`text-[11px] font-extrabold tracking-wider mb-2 ${
                theme === 'light' ? 'text-slate-800' : 'text-slate-200'
              }`}>
                {label}
              </span>

              {/* Physical Traffic Signal Post & Housing */}
              <div className="w-13 sm:w-14 bg-gradient-to-b from-neutral-800 via-neutral-900 to-neutral-950 border-2 border-neutral-700 rounded-2xl p-2 flex flex-col items-center gap-2.5 shadow-2xl relative">
                {/* RED BULB */}
                <div className="relative flex flex-col items-center">
                  <div className="w-8 h-2 bg-neutral-800 border-t border-x border-neutral-600 rounded-t-full -mb-1 z-10 opacity-90 shadow-md" />
                  <div
                    className={`w-7 sm:w-8 h-7 sm:h-8 rounded-full transition-all duration-200 border border-neutral-900/50 flex items-center justify-center ${
                      isRed
                        ? 'bg-rose-500 traffic-glow-red opacity-100 ring-2 ring-rose-400'
                        : 'bg-rose-950/40 opacity-20'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full border border-white/20 opacity-60" />
                  </div>
                </div>

                {/* YELLOW BULB */}
                <div className="relative flex flex-col items-center">
                  <div className="w-8 h-2 bg-neutral-800 border-t border-x border-neutral-600 rounded-t-full -mb-1 z-10 opacity-90 shadow-md" />
                  <div
                    className={`w-7 sm:w-8 h-7 sm:h-8 rounded-full transition-all duration-200 border border-neutral-900/50 flex items-center justify-center ${
                      isYellowState
                        ? 'bg-amber-400 traffic-glow-yellow opacity-100 ring-2 ring-amber-300'
                        : 'bg-amber-950/40 opacity-20'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full border border-white/20 opacity-60" />
                  </div>
                </div>

                {/* GREEN BULB */}
                <div className="relative flex flex-col items-center">
                  <div className="w-8 h-2 bg-neutral-800 border-t border-x border-neutral-600 rounded-t-full -mb-1 z-10 opacity-90 shadow-md" />
                  <div
                    className={`w-7 sm:w-8 h-7 sm:h-8 rounded-full transition-all duration-200 border border-neutral-900/50 flex items-center justify-center ${
                      isGreen
                        ? 'bg-emerald-500 traffic-glow-green opacity-100 ring-2 ring-emerald-400'
                        : 'bg-emerald-950/40 opacity-20'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full border border-white/20 opacity-60" />
                  </div>
                </div>
              </div>

              {/* Status Indicator Label */}
              <div className="mt-2.5 flex items-center gap-1 font-mono-numbers">
                <span
                  className={`text-[10px] font-bold tracking-wide ${
                    isGreen
                      ? 'text-emerald-400'
                      : isYellowState
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {isGreen ? '🟢' : isYellowState ? '🟡' : '🔴'} {state}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
