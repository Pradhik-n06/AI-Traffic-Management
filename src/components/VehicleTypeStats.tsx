import React from 'react';
import { LaneStats, LaneDirection, AppTheme, WeatherCondition } from '../types/traffic';
import { Car, Bus, Truck, Bike, ShieldCheck, Sun, CloudRain, CloudFog } from 'lucide-react';

interface VehicleTypeStatsProps {
  stats: Record<LaneDirection, LaneStats>;
  weather?: WeatherCondition;
  theme?: AppTheme;
}

export const VehicleTypeStats: React.FC<VehicleTypeStatsProps> = ({
  stats,
  weather = 'clear',
  theme = 'dark',
}) => {
  // Aggregate vehicle types across all 4 directions
  const totals = {
    Car: 0,
    Bus: 0,
    Truck: 0,
    Motorcycle: 0,
  };

  Object.values(stats).forEach((lane) => {
    totals.Car += lane.classes.Car || 0;
    totals.Bus += lane.classes.Bus || 0;
    totals.Truck += lane.classes.Truck || 0;
    totals.Motorcycle += lane.classes.Motorcycle || 0;
  });

  const totalActive = totals.Car + totals.Bus + totals.Truck + totals.Motorcycle;
  const confPercent = weather === 'fog' ? 83 : weather === 'rain' ? 89 : 94;

  const containerBg =
    theme === 'light'
      ? 'bg-white border-slate-200 shadow-sm text-slate-900'
      : theme === 'thermal'
      ? 'bg-[#100624]/95 border-amber-500/30 shadow-xl text-amber-100'
      : 'bg-slate-900/90 border-slate-800 shadow-xl backdrop-blur-sm text-slate-100';

  const cardBg =
    theme === 'light'
      ? 'bg-slate-50 border-slate-200'
      : theme === 'thermal'
      ? 'bg-[#090215] border-amber-500/20'
      : 'bg-slate-950/80 border-slate-800';

  const subTextColor =
    theme === 'light' ? 'text-slate-500' : theme === 'thermal' ? 'text-amber-200/70' : 'text-slate-400';

  const vehicleCards = [
    {
      type: 'Cars',
      icon: <Car className="w-5 h-5 text-sky-400" />,
      emoji: '🚗',
      count: totals.Car,
      color: 'text-sky-400',
      badge: 'Passenger & Sedans',
    },
    {
      type: 'Buses',
      icon: <Bus className="w-5 h-5 text-orange-400" />,
      emoji: '🚌',
      count: totals.Bus,
      color: 'text-orange-400',
      badge: 'Public Transit',
    },
    {
      type: 'Trucks',
      icon: <Truck className="w-5 h-5 text-purple-400" />,
      emoji: '🚚',
      count: totals.Truck,
      color: 'text-purple-400',
      badge: 'Heavy Freight',
    },
    {
      type: 'Motorcycles',
      icon: <Bike className="w-5 h-5 text-emerald-400" />,
      emoji: '🏍',
      count: totals.Motorcycle,
      color: 'text-emerald-400',
      badge: 'Two-Wheelers',
    },
  ];

  return (
    <div className={`${containerBg} border rounded-2xl p-5 space-y-4 transition-colors`}>
      {/* Header */}
      <div className={`flex flex-wrap items-center justify-between pb-3 border-b gap-2 ${
        theme === 'light' ? 'border-slate-200' : theme === 'thermal' ? 'border-amber-500/20' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">🚗</span>
          <div>
            <h3 className={`text-sm font-bold tracking-wide ${theme === 'light' ? 'text-slate-900' : 'text-slate-100'}`}>
              Vehicle Classification & Fleet Statistics
            </h3>
            <p className={`text-xs ${subTextColor}`}>
              Multi-class vehicle recognition breakdown across all intersection arms
            </p>
          </div>
        </div>

        {/* System AI Detection Confidence Statistic */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
            theme === 'light'
              ? 'bg-slate-100 border-slate-200 text-slate-700'
              : theme === 'thermal'
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
              : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}>
            {weather === 'rain' ? (
              <CloudRain className="w-3.5 h-3.5 text-sky-400" />
            ) : weather === 'fog' ? (
              <CloudFog className="w-3.5 h-3.5 text-purple-400" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="text-[11px] font-mono-numbers font-medium capitalize">
              Weather: <strong className="text-slate-100">{weather}</strong>
            </span>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
            theme === 'light'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : theme === 'thermal'
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="text-xs font-mono-numbers font-bold">
              AI Detection Confidence: {confPercent}%
            </span>
          </div>
        </div>
      </div>

      {/* 4 Vehicle Type Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {vehicleCards.map((vc) => (
          <div
            key={vc.type}
            className={`${cardBg} border rounded-xl p-3.5 flex flex-col justify-between transition-all`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl" title={vc.type}>
                {vc.emoji}
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${subTextColor}`}>
                {vc.type}
              </span>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-1.5">
                <span className={`font-mono-numbers text-2xl font-black ${
                  theme === 'light' ? 'text-slate-900' : theme === 'thermal' ? 'text-amber-300' : 'text-slate-100'
                }`}>
                  {vc.count}
                </span>
                <span className={`text-xs ${subTextColor}`}>
                  {vc.count === 1 ? 'vehicle' : 'vehicles'}
                </span>
              </div>
              <div className={`text-[10px] font-medium mt-0.5 ${subTextColor}`}>
                {vc.badge}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
