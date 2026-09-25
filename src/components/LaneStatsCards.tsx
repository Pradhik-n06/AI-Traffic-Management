import React from 'react';
import { LaneStats, LaneDirection, LightColor, AppTheme } from '../types/traffic';
import { Car, Bus, Truck, Bike, Clock } from 'lucide-react';

interface LaneStatsCardsProps {
  stats: Record<LaneDirection, LaneStats>;
  lampStates: Record<LaneDirection, LightColor>;
  theme?: AppTheme;
}

export const LaneStatsCards: React.FC<LaneStatsCardsProps> = ({
  stats,
  lampStates,
  theme = 'dark',
}) => {
  const lanes: { id: LaneDirection; title: string; color: string; border: string; accentBg: string }[] = [
    { id: 'North', title: 'NORTH', color: theme === 'light' ? 'text-sky-600' : 'text-sky-400', border: theme === 'light' ? 'border-sky-300' : theme === 'thermal' ? 'border-sky-500/40' : 'border-sky-500/30', accentBg: 'bg-sky-500' },
    { id: 'South', title: 'SOUTH', color: theme === 'light' ? 'text-emerald-600' : 'text-emerald-400', border: theme === 'light' ? 'border-emerald-300' : theme === 'thermal' ? 'border-emerald-500/40' : 'border-emerald-500/30', accentBg: 'bg-emerald-500' },
    { id: 'East', title: 'EAST', color: theme === 'light' ? 'text-amber-600' : 'text-amber-400', border: theme === 'light' ? 'border-amber-300' : theme === 'thermal' ? 'border-amber-500/40' : 'border-amber-500/30', accentBg: 'bg-amber-500' },
    { id: 'West', title: 'WEST', color: theme === 'light' ? 'text-purple-600' : 'text-purple-400', border: theme === 'light' ? 'border-purple-300' : theme === 'thermal' ? 'border-purple-500/40' : 'border-purple-500/30', accentBg: 'bg-purple-500' },
  ];

  const cardBg =
    theme === 'light'
      ? 'bg-white border shadow-sm'
      : theme === 'thermal'
      ? 'bg-[#100624]/95 border shadow-xl'
      : 'bg-slate-900/90 border shadow-lg backdrop-blur-sm';

  const subTextColor =
    theme === 'light' ? 'text-slate-500' : theme === 'thermal' ? 'text-amber-200/70' : 'text-slate-400';

  const numColor =
    theme === 'light' ? 'text-slate-900' : theme === 'thermal' ? 'text-amber-300' : 'text-slate-100';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {lanes.map(({ id, title, color, border, accentBg }) => {
        const laneData = stats[id] || {
          lane: id,
          vehicles: 0,
          density: 'LOW',
          classes: { Car: 0, Bus: 0, Truck: 0, Motorcycle: 0 },
          waitingTimeAvgSec: 0,
        };

        const signal = lampStates[id] || 'RED';
        const isGreen = signal === 'GREEN';
        const isYellow = signal === 'YELLOW';
        const isHigh = laneData.density === 'HIGH';
        const isMed = laneData.density === 'MEDIUM';

        // Capacity calculation (assume 25 is lane saturation queue)
        const capacityPct = Math.min(100, Math.round((laneData.vehicles / 25) * 100));

        return (
          <div
            key={id}
            className={`${cardBg} ${border} rounded-2xl p-4 transition-all flex flex-col justify-between`}
          >
            <div>
              {/* Header: Title and Signal Status Light */}
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-black tracking-widest ${color}`}>
                  {title}
                </span>

                {/* Signal Badge: 🟢 GREEN, 🟡 YELLOW, 🔴 RED */}
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg border bg-slate-950/60 border-slate-800">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isGreen
                        ? 'bg-emerald-500 traffic-glow-green animate-pulse'
                        : isYellow
                        ? 'bg-amber-400 traffic-glow-yellow'
                        : 'bg-rose-500 traffic-glow-red'
                    }`}
                  />
                  <span
                    className={`text-[11px] font-extrabold font-mono-numbers ${
                      isGreen
                        ? 'text-emerald-400'
                        : isYellow
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    Signal: {isGreen ? '🟢' : isYellow ? '🟡' : '🔴'} {signal}
                  </span>
                </div>
              </div>

              {/* Main Vehicle Count & Density Tag */}
              <div className="mt-2 flex items-baseline justify-between">
                <div>
                  <div className={`text-[11px] uppercase font-bold tracking-wider ${subTextColor}`}>
                    Vehicles
                  </div>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className={`font-mono-numbers text-3xl font-extrabold ${numColor}`}>
                      {laneData.vehicles}
                    </span>
                    <span className={`text-xs font-medium ${subTextColor}`}>in queue</span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className={`text-[11px] uppercase font-bold tracking-wider ${subTextColor}`}>
                    Density
                  </span>
                  <span
                    className={`text-sm font-extrabold mt-0.5 ${
                      isHigh
                        ? 'text-rose-500'
                        : isMed
                        ? 'text-amber-500'
                        : 'text-emerald-500'
                    }`}
                  >
                    {laneData.density}
                  </span>
                </div>
              </div>

              {/* Queue Saturation Meter */}
              <div className="mt-3 space-y-1">
                <div className={`flex justify-between text-[10px] font-mono-numbers ${subTextColor}`}>
                  <span>Approach Queue Load</span>
                  <span>{capacityPct}% capacity</span>
                </div>
                <div
                  className={`w-full h-1.5 rounded-full overflow-hidden border ${
                    theme === 'light'
                      ? 'bg-slate-100 border-slate-200'
                      : theme === 'thermal'
                      ? 'bg-[#080214] border-amber-900/40'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isHigh ? 'bg-rose-500' : isMed ? 'bg-amber-400' : accentBg
                    }`}
                    style={{ width: `${Math.max(4, capacityPct)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Vehicle class micro-breakdown with icons */}
            <div
              className={`mt-3.5 pt-2.5 border-t text-[11px] flex items-center justify-between ${
                theme === 'light'
                  ? 'border-slate-100 text-slate-500'
                  : theme === 'thermal'
                  ? 'border-amber-500/20 text-amber-200/70'
                  : 'border-slate-800 text-slate-400'
              }`}
            >
              <span title="Cars" className="flex items-center gap-1">
                <Car className="w-3 h-3 text-sky-500" />
                <span className={`font-mono-numbers font-bold ${numColor}`}>{laneData.classes.Car}</span>
              </span>
              <span title="Buses" className="flex items-center gap-1">
                <Bus className="w-3 h-3 text-orange-500" />
                <span className={`font-mono-numbers font-bold ${numColor}`}>{laneData.classes.Bus}</span>
              </span>
              <span title="Trucks" className="flex items-center gap-1">
                <Truck className="w-3 h-3 text-purple-500" />
                <span className={`font-mono-numbers font-bold ${numColor}`}>{laneData.classes.Truck}</span>
              </span>
              <span title="Motorcycles" className="flex items-center gap-1">
                <Bike className="w-3 h-3 text-emerald-500" />
                <span className={`font-mono-numbers font-bold ${numColor}`}>{laneData.classes.Motorcycle}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
