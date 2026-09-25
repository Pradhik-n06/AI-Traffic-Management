import React from 'react';
import { AppTheme } from '../types/traffic';
import { Moon, Flame, Sun } from 'lucide-react';

interface ThemeToggleProps {
  theme: AppTheme;
  onThemeChange: (newTheme: AppTheme) => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onThemeChange }) => {
  const options: { id: AppTheme; label: string; shortLabel: string; icon: React.ReactNode; activeColor: string }[] = [
    {
      id: 'dark',
      label: 'Modern Dark',
      shortLabel: 'Dark',
      icon: <Moon className="w-3.5 h-3.5" />,
      activeColor: 'bg-slate-800 text-slate-100 shadow-sm border border-slate-700',
    },
    {
      id: 'thermal',
      label: 'High-Contrast Thermal',
      shortLabel: 'Thermal',
      icon: <Flame className="w-3.5 h-3.5" />,
      activeColor: 'bg-amber-500/20 text-amber-300 shadow-sm border border-amber-500/50 font-bold',
    },
    {
      id: 'light',
      label: 'Minimalist Light',
      shortLabel: 'Light',
      icon: <Sun className="w-3.5 h-3.5" />,
      activeColor: 'bg-white text-slate-900 shadow-sm border border-slate-200 font-bold',
    },
  ];

  return (
    <div
      role="group"
      aria-label="Interface Theme Mode"
      className={`flex items-center p-1 rounded-xl text-xs transition-colors ${
        theme === 'light'
          ? 'bg-slate-100 border border-slate-300'
          : theme === 'thermal'
          ? 'bg-[#140828] border border-amber-500/30'
          : 'bg-slate-950 border border-slate-800'
      }`}
    >
      {options.map((opt) => {
        const isActive = theme === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onThemeChange(opt.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              isActive
                ? opt.activeColor
                : theme === 'light'
                ? 'text-slate-600 hover:text-slate-900'
                : theme === 'thermal'
                ? 'text-amber-200/60 hover:text-amber-200'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={`Switch interface to ${opt.label} mode`}
          >
            {opt.icon}
            <span className="hidden sm:inline">{opt.shortLabel}</span>
          </button>
        );
      })}
    </div>
  );
};
