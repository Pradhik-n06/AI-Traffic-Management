import React from 'react';
import { LaneStats, LaneDirection, SystemConfig, AppTheme } from '../types/traffic';
import { BarChart3 } from 'lucide-react';

interface DensityBarChartProps {
  stats: Record<LaneDirection, LaneStats>;
  config: SystemConfig;
  theme?: AppTheme;
}

export const DensityBarChart: React.FC<DensityBarChartProps> = ({ stats, config, theme = 'dark' }) => {
  const lanes: { id: LaneDirection; label: string }[] = [
    { id: 'North', label: 'North' },
    { id: 'South', label: 'South' },
    { id: 'East', label: 'East' },
    { id: 'West', label: 'West' },
  ];

  // Maximum scale for chart visualization
  const vehicleCounts = Object.values(stats).map((s) => s.vehicles);
  const maxVehicleVal = Math.max(25, ...vehicleCounts);

  const containerBg =
    theme === 'light'
      ? 'bg-white border-slate-200 shadow-sm text-slate-900'
      : theme === 'thermal'
      ? 'bg-[#100624]/95 border-amber-500/30 shadow-xl text-amber-100'
      : 'bg-slate-900/90 border-slate-800 shadow-xl backdrop-blur-sm text-slate-100';

  const subTextColor =
    theme === 'light' ? 'text-slate-500' : theme === 'thermal' ? 'text-amber-200/70' : 'text-slate-400';

  const trackBg =
    theme === 'light'
      ? 'bg-slate-100 border-slate-200'
      : theme === 'thermal'
      ? 'bg-[#090215] border-amber-900/40'
      : 'bg-slate-950 border-slate-800/80';

  return (
    <div className={`${containerBg} border rounded-2xl p-5 transition-colors space-y-4`}>
      {/* Header */}
      <div className={`flex items-center justify-between pb-3 border-b ${
        theme === 'light' ? 'border-slate-200' : theme === 'thermal' ? 'border-amber-500/20' : 'border-slate-800'
      }`}>
        <div>
          <h3 className={`text-sm font-black tracking-wide flex items-center gap-2 ${
            theme === 'light' ? 'text-slate-900' : 'text-slate-100'
          }`}>
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            TRAFFIC DENSITY
          </h3>
          <p className={`text-xs ${subTextColor}`}>
            Live queue distribution across North, South, East, and West
          </p>
        </div>

        {/* Legend */}
        <div className={`hidden sm:flex items-center gap-3 text-[11px] ${subTextColor}`}>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Low (0–{config.lowThreshold})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Med ({config.lowThreshold + 1}–{config.mediumThreshold})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> High ({config.mediumThreshold + 1}+)
          </span>
        </div>
      </div>

      {/* Live Density Bar Chart */}
      <div className="space-y-3 font-mono-numbers">
        {lanes.map(({ id, label }) => {
          const count = stats[id]?.vehicles || 0;
          const density = stats[id]?.density || 'LOW';
          const percent = Math.min(100, (count / maxVehicleVal) * 100);

          const barColor =
            density === 'HIGH'
              ? 'bg-rose-500 shadow-rose-500/30'
              : density === 'MEDIUM'
              ? 'bg-amber-400 shadow-amber-400/30'
              : 'bg-emerald-500 shadow-emerald-500/30';

          const textColor =
            density === 'HIGH'
              ? 'text-rose-400'
              : density === 'MEDIUM'
              ? 'text-amber-400'
              : 'text-emerald-400';

          return (
            <div key={id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className={`font-bold w-16 text-xs uppercase tracking-wider ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
                  {label}
                </span>

                <div className="flex items-center gap-2">
                  <span className={`font-mono-numbers font-extrabold text-sm ${
                    theme === 'light' ? 'text-slate-900' : theme === 'thermal' ? 'text-amber-300' : 'text-slate-100'
                  }`}>
                    {count}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                    density === 'HIGH'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      : density === 'MEDIUM'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {density}
                  </span>
                </div>
              </div>

              {/* Progress bar with threshold lines */}
              <div className={`relative w-full h-4 rounded-xl overflow-hidden border ${trackBg}`}>
                {/* Low Threshold line marker (5) */}
                <div
                  className={`absolute top-0 bottom-0 w-[1px] z-10 ${
                    theme === 'light' ? 'bg-slate-300' : 'bg-slate-700'
                  }`}
                  style={{ left: `${(config.lowThreshold / maxVehicleVal) * 100}%` }}
                  title={`Low Threshold: ${config.lowThreshold}`}
                />
                {/* Medium Threshold line marker (15) */}
                <div
                  className={`absolute top-0 bottom-0 w-[1px] z-10 ${
                    theme === 'light' ? 'bg-slate-400' : 'bg-slate-600'
                  }`}
                  style={{ left: `${(config.mediumThreshold / maxVehicleVal) * 100}%` }}
                  title={`Medium Threshold: ${config.mediumThreshold}`}
                />

                {/* Animated bar */}
                <div
                  className={`h-full transition-all duration-300 rounded-lg ${barColor}`}
                  style={{ width: `${Math.max(3, percent)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
