import React from 'react';
import { SignalDecision, LaneStats, LaneDirection, AppTheme } from '../types/traffic';
import { ArrowUpDown, ArrowLeftRight, Clock, AlertTriangle } from 'lucide-react';

interface SignalDecisionBannerProps {
  decision: SignalDecision;
  stats: Record<LaneDirection, LaneStats>;
  countdown?: number;
  isRunning: boolean;
  theme?: AppTheme;
}

export const SignalDecisionBanner: React.FC<SignalDecisionBannerProps> = ({
  decision,
  stats,
  countdown,
  isRunning,
  theme = 'dark',
}) => {
  const containerBg =
    theme === 'light'
      ? 'bg-white border-slate-200 shadow-sm text-slate-900'
      : theme === 'thermal'
      ? 'bg-[#100624]/95 border-amber-500/30 shadow-xl text-amber-100'
      : 'bg-slate-900/90 border-slate-800 shadow-xl backdrop-blur-sm text-slate-100';

  const rowBg =
    theme === 'light'
      ? 'bg-slate-50 border-slate-200'
      : theme === 'thermal'
      ? 'bg-[#0a0316] border-amber-500/20'
      : 'bg-slate-950/80 border-slate-800/80';

  const subTextColor =
    theme === 'light' ? 'text-slate-500' : theme === 'thermal' ? 'text-amber-200/70' : 'text-slate-400';

  const isNS = decision.recommendedSignal === 'NORTH-SOUTH';

  const lanes: { id: LaneDirection; label: string }[] = [
    { id: 'North', label: 'NORTH' },
    { id: 'South', label: 'SOUTH' },
    { id: 'East', label: 'EAST' },
    { id: 'West', label: 'WEST' },
  ];

  return (
    <div className={`${containerBg} border rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-colors`}>
      {/* 1. Header Banner */}
      <div className={`flex flex-wrap items-center justify-between pb-3 border-b gap-2 ${
        theme === 'light' ? 'border-slate-200' : theme === 'thermal' ? 'border-amber-500/20' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-lg">
            🤖
          </div>
          <div>
            <h3 className={`text-sm font-black tracking-wide flex items-center gap-2 ${
              theme === 'light' ? 'text-slate-900' : 'text-slate-100'
            }`}>
              AI TRAFFIC DECISION
              {decision.emergencyActive && (
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-500 border border-rose-500/40 animate-pulse">
                  OVERRIDE
                </span>
              )}
            </h3>
            <p className={`text-xs ${subTextColor}`}>
              Real-time density analysis & adaptive signal calculation
            </p>
          </div>
        </div>

        <div className={`flex items-center gap-2 text-xs ${subTextColor}`}>
          <span>Status: <strong className={isRunning ? 'text-emerald-500 font-bold' : 'text-slate-400'}>{isRunning ? 'ONLINE' : 'PAUSED'}</strong></span>
        </div>
      </div>

      {/* 2. Four-Way Dynamic Approach Queue Counts Table */}
      <div className="space-y-1.5">
        {lanes.map(({ id, label }) => {
          const s = stats[id] || { vehicles: 0, density: 'LOW' };
          const count = s.vehicles;
          const density = s.density;

          const densityBadgeClass =
            density === 'HIGH'
              ? 'bg-rose-500/15 text-rose-400 border-rose-500/40'
              : density === 'MEDIUM'
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
              : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40';

          const isHighest = decision.highestLane === id;

          return (
            <div
              key={id}
              className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-mono-numbers transition-all ${rowBg} ${
                isHighest ? 'ring-1 ring-emerald-500/40' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className={`font-bold tracking-wider ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                  {label}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className={`font-bold text-sm ${
                  theme === 'light' ? 'text-slate-900' : theme === 'thermal' ? 'text-amber-300' : 'text-slate-100'
                }`}>
                  {count} {count === 1 ? 'vehicle' : 'vehicles'}
                </span>

                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold border ${densityBadgeClass}`}>
                  {density}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Divider Line */}
      <div className={`border-t my-1 ${
        theme === 'light' ? 'border-slate-200' : theme === 'thermal' ? 'border-amber-500/20' : 'border-slate-800'
      }`} />

      {/* 4. Priority Decision & Adaptive Green Time Display */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* PRIORITY DIRECTION */}
        <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
          theme === 'light'
            ? 'bg-emerald-50/70 border-emerald-300'
            : theme === 'thermal'
            ? 'bg-[#090215] border-emerald-500/40'
            : 'bg-slate-950/80 border-emerald-500/30'
        }`}>
          <div className={`text-[11px] font-bold uppercase tracking-wider ${subTextColor}`}>
            PRIORITY:
          </div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 traffic-glow-green animate-pulse" />
            <span className="font-mono-numbers font-black text-base tracking-wide text-emerald-500">
              {decision.recommendedSignal === 'NORTH-SOUTH' ? 'NORTH ↔ SOUTH' : 'EAST ↔ WEST'}
            </span>
          </div>
          <div className={`text-[10px] mt-1.5 font-mono-numbers ${subTextColor}`}>
            {isNS ? decision.northSouthCount : decision.eastWestCount} veh total in corridor
          </div>
        </div>

        {/* GREEN TIME */}
        <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
          theme === 'light'
            ? 'bg-sky-50/70 border-sky-300'
            : theme === 'thermal'
            ? 'bg-[#090215] border-amber-500/40'
            : 'bg-slate-950/80 border-sky-500/30'
        }`}>
          <div className={`text-[11px] font-bold uppercase tracking-wider ${subTextColor}`}>
            GREEN TIME:
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className={`font-mono-numbers text-2xl font-black ${
              theme === 'light' ? 'text-sky-600' : theme === 'thermal' ? 'text-amber-300' : 'text-sky-400'
            }`}>
              {decision.recommendedGreenTime}
            </span>
            <span className={`text-xs font-bold ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
              seconds
            </span>
          </div>
          <div className={`text-[10px] mt-1 font-mono-numbers ${subTextColor} flex items-center gap-1`}>
            {countdown !== undefined && (
              <>
                <Clock className="w-3 h-3 text-amber-500" />
                <span>Remaining: <strong className="text-amber-400 font-bold">{countdown}s</strong></span>
              </>
            )}
          </div>
        </div>

        {/* REASON */}
        <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${rowBg}`}>
          <div className={`text-[11px] font-bold uppercase tracking-wider ${subTextColor}`}>
            REASON:
          </div>
          <div className={`mt-1 text-xs font-extrabold ${theme === 'light' ? 'text-slate-900' : 'text-slate-100'}`}>
            Highest traffic density
          </div>
          <div className={`text-[10px] mt-1 font-mono-numbers line-clamp-2 ${subTextColor}`}>
            {decision.reason}
          </div>
        </div>
      </div>
    </div>
  );
};
