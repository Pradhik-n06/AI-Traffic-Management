import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  VehicleDetection,
  LaneStats,
  SignalDecision,
  SystemConfig,
  ScenarioPreset,
  LaneDirection,
  AppTheme,
} from './types/traffic';
import { TrafficIntersectionSimulator } from './utils/trafficSimulation';
import { soundFx } from './utils/audioFeedback';
import { VideoCanvas } from './components/VideoCanvas';
import { TrafficLights } from './components/TrafficLights';
import { LaneStatsCards } from './components/LaneStatsCards';
import { SignalDecisionBanner } from './components/SignalDecisionBanner';
import { SimulationControls } from './components/SimulationControls';
import { DensityBarChart } from './components/DensityBarChart';
import { SummaryResultsTable } from './components/SummaryResultsTable';
import { EfficiencyBenchmark } from './components/EfficiencyBenchmark';
import { VehicleTypeStats } from './components/VehicleTypeStats';
import { ThemeToggle } from './components/ThemeToggle';
import { SettingsModal } from './components/SettingsModal';
import { PythonCodeModal } from './components/PythonCodeModal';
import { FacultyVivaGuide } from './components/FacultyVivaGuide';
import {
  Play,
  Pause,
  RotateCcw,
  Settings2,
  Code2,
  GraduationCap,
  AlertCircle,
  Volume2,
  VolumeX,
  Gauge,
  LayoutDashboard,
  ShieldAlert,
} from 'lucide-react';

const DEFAULT_CONFIG: SystemConfig = {
  lowThreshold: 5,
  mediumThreshold: 15,
  greenTimeLow: 15,
  greenTimeMedium: 30,
  greenTimeHigh: 45,
  boundaryCenterX: 0.5,
  boundaryCenterY: 0.5,
  confidenceThreshold: 0.35,
  enableTracking: true,
  showBoundingBoxes: true,
  showCentroids: true,
  showLaneBoundaries: true,
  showLabels: true,
  visionMode: 'day',
  weather: 'clear',
  audioFeedback: true,
  showScanlines: false,
  spawnRateNorth: 6,
  spawnRateSouth: 5,
  spawnRateEast: 2,
  spawnRateWest: 2,
  globalSpawnIntensity: 1.0,
};

export default function App() {
  const [theme, setTheme] = useState<AppTheme>('dark');
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1.0);
  const [currentPreset, setCurrentPreset] = useState<ScenarioPreset>('heavy-ns');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'benchmark'>('dashboard');

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);
  const [isVivaModalOpen, setIsVivaModalOpen] = useState<boolean>(false);

  // Refs
  const simulatorRef = useRef<TrafficIntersectionSimulator | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const prevCorridorRef = useRef<'NORTH-SOUTH' | 'EAST-WEST'>('NORTH-SOUTH');

  // Sync theme with body class
  useEffect(() => {
    document.body.className = `theme-${theme}`;
  }, [theme]);

  const handleThemeChange = (newTheme: AppTheme) => {
    setTheme(newTheme);
    if (newTheme === 'thermal') {
      setConfig((prev) => ({ ...prev, visionMode: 'thermal' }));
    } else if (newTheme === 'light') {
      setConfig((prev) => ({ ...prev, visionMode: 'day' }));
    }
  };

  // Simulation output state
  const [detections, setDetections] = useState<VehicleDetection[]>([]);
  const [laneStats, setLaneStats] = useState<Record<LaneDirection, LaneStats>>({
    North: { lane: 'North', vehicles: 16, density: 'HIGH', classes: { Car: 10, Bus: 3, Truck: 2, Motorcycle: 1 }, waitingTimeAvgSec: 28 },
    South: { lane: 'South', vehicles: 14, density: 'MEDIUM', classes: { Car: 9, Bus: 2, Truck: 2, Motorcycle: 1 }, waitingTimeAvgSec: 22 },
    East:  { lane: 'East',  vehicles: 4,  density: 'LOW',    classes: { Car: 3, Bus: 1, Truck: 0, Motorcycle: 0 }, waitingTimeAvgSec: 8 },
    West:  { lane: 'West',  vehicles: 3,  density: 'LOW',    classes: { Car: 2, Bus: 0, Truck: 1, Motorcycle: 0 }, waitingTimeAvgSec: 6 },
  });
  const [decision, setDecision] = useState<SignalDecision>({
    currentSignal: 'NORTH-SOUTH',
    recommendedSignal: 'NORTH-SOUTH',
    recommendedGreenTime: 45,
    highestLane: 'North',
    highestCount: 16,
    highestDensity: 'HIGH',
    northSouthCount: 30,
    eastWestCount: 7,
    lampStates: { North: 'GREEN', South: 'GREEN', East: 'RED', West: 'RED' },
    emergencyActive: false,
    emergencyLane: null,
    reason: 'North-South queue (30 veh) outweighs East-West (7 veh). High density corridor granted 45s green.',
  });
  const [countdown, setCountdown] = useState<number>(30);
  const [isYellow, setIsYellow] = useState<boolean>(false);

  // Initialize simulator
  useEffect(() => {
    simulatorRef.current = new TrafficIntersectionSimulator();
    simulatorRef.current.resetScenario('heavy-ns');
  }, []);

  // Update scenario
  const handleSelectPreset = (preset: ScenarioPreset) => {
    setCurrentPreset(preset);
    setErrorMessage(null);
    if (simulatorRef.current) {
      simulatorRef.current.resetScenario(preset);
    }
  };

  // Emergency vehicle preemption toggle
  const handleToggleEmergency = (lane: LaneDirection = 'North') => {
    if (simulatorRef.current) {
      simulatorRef.current.toggleEmergency(lane);
      soundFx.playEmergencyAlert(config.audioFeedback);
    }
  };

  // Main animation / simulation tick loop
  const updateTick = useCallback(
    (now: number) => {
      const deltaSec = Math.min(0.08, (now - lastTimeRef.current) / 1000) * speedMultiplier;
      lastTimeRef.current = now;

      const sim = simulatorRef.current;
      if (sim && isRunning) {
        sim.step(config, deltaSec);
        const results = sim.getDetections(config);

        // Check if corridor changed to play audio chime
        if (results.decision.currentSignal !== prevCorridorRef.current) {
          prevCorridorRef.current = results.decision.currentSignal;
          soundFx.playSignalChange(config.audioFeedback);
        }

        setDetections(results.detections);
        setLaneStats(results.laneStats);
        setDecision(results.decision);
        setCountdown(sim.getPhaseCountdown());
        setIsYellow(sim.isYellow());
      }

      animFrameRef.current = requestAnimationFrame(updateTick);
    },
    [isRunning, speedMultiplier, config]
  );

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(updateTick);
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [updateTick]);

  const handleToggleRunning = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    if (simulatorRef.current) {
      simulatorRef.current.resetScenario(currentPreset);
    }
    setErrorMessage(null);
  };

  // Theme-derived background classes
  const mainBgClass =
    theme === 'light'
      ? 'bg-[#f8fafc] text-slate-900 selection:bg-emerald-600 selection:text-white'
      : theme === 'thermal'
      ? 'bg-[#05020c] text-amber-100 selection:bg-amber-500 selection:text-black'
      : 'bg-[#090d16] text-slate-100 selection:bg-emerald-500 selection:text-slate-950';

  const headerBgClass =
    theme === 'light'
      ? 'bg-white/95 border-slate-200 shadow-sm text-slate-900'
      : theme === 'thermal'
      ? 'bg-[#090318]/95 border-amber-500/30 shadow-lg text-amber-200'
      : 'bg-[#090d16]/95 border-slate-800 text-slate-100';

  const subTextColor =
    theme === 'light' ? 'text-slate-500' : theme === 'thermal' ? 'text-amber-200/70' : 'text-slate-400';

  return (
    <div className={`min-h-screen ${mainBgClass} flex flex-col font-sans transition-colors duration-200`}>
      {/* 3-ZONE TOP BAR CONTRACT */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 ${headerBgClass}`}>
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl border flex items-center justify-center text-lg shadow-sm ${
            theme === 'light'
              ? 'bg-emerald-50 border-emerald-300'
              : theme === 'thermal'
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
              : 'bg-emerald-500/10 border-emerald-500/30'
          }`}>
            🚦
          </div>
          <div>
            <a href="/" className={`text-base font-extrabold tracking-tight hover:opacity-80 transition-opacity ${
              theme === 'light' ? 'text-slate-900' : theme === 'thermal' ? 'text-amber-300 font-mono' : 'text-slate-100'
            }`}>
              AI SMART TRAFFIC SIGNAL
            </a>
            <span className={`hidden md:inline text-xs ml-2 font-medium ${subTextColor}`}>
              AI-Based Adaptive Traffic Management System
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links / Segmented Control */}
        <nav className={`hidden xl:flex items-center gap-1 p-1 rounded-xl border text-xs ${
          theme === 'light' ? 'bg-slate-100 border-slate-200' : theme === 'thermal' ? 'bg-[#0f0524] border-amber-500/30' : 'bg-slate-900/80 border-slate-800'
        }`}>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                : subTextColor
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            4-Way Junction
          </button>

          <button
            onClick={() => setActiveTab('benchmark')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'benchmark'
                ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                : subTextColor
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            Fixed vs AI Benchmark
          </button>
        </nav>

        {/* Zone 3: Primary Actions & Theme Toggle */}
        <div className="flex items-center gap-2">
          {/* Header Theme Toggle */}
          <ThemeToggle theme={theme} onThemeChange={handleThemeChange} />

          {/* Sound toggle */}
          <button
            onClick={() => setConfig((prev) => ({ ...prev, audioFeedback: !prev.audioFeedback }))}
            className={`p-1.5 sm:p-2 rounded-xl border transition-colors cursor-pointer ${
              config.audioFeedback
                ? theme === 'light' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-800 text-emerald-400 border-slate-700'
                : theme === 'light' ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
            title={config.audioFeedback ? 'Sound Chimes Enabled' : 'Sound Muted'}
          >
            {config.audioFeedback ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Emergency Preemption Button */}
          <button
            onClick={() => handleToggleEmergency('North')}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
              decision.emergencyActive
                ? 'bg-rose-500 text-white border-rose-400 shadow-lg animate-pulse'
                : theme === 'light'
                ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                : 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
            }`}
            title="Simulate ambulance arrival to demonstrate priority preemption to faculty"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{decision.emergencyActive ? 'Emergency Active' : 'Test Emergency'}</span>
          </button>

          <button
            onClick={() => setIsVivaModalOpen(true)}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${
              theme === 'light'
                ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
            }`}
            title="College Viva presentation script & faculty Q&A"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Viva Guide</span>
          </button>

          <button
            onClick={() => setIsCodeModalOpen(true)}
            className={`px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${
              theme === 'light'
                ? 'bg-sky-50 text-sky-700 border-sky-300 hover:bg-sky-100'
                : 'bg-sky-500/10 text-sky-300 border-sky-500/30 hover:bg-sky-500/20'
            }`}
            title="View complete Python source code and download project ZIP"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Python Code & ZIP</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className={`p-1.5 sm:p-2 rounded-xl border transition-colors cursor-pointer ${
              theme === 'light'
                ? 'bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
            }`}
            title="Configure density thresholds and camera calibration"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error notification banner if any */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-500 text-xs flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-700 font-bold ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 1. INTERACTIVE SIMULATION CONTROLS & DENSITY SLIDERS */}
        <section>
          <SimulationControls
            isRunning={isRunning}
            onToggleRunning={handleToggleRunning}
            onReset={handleReset}
            speedMultiplier={speedMultiplier}
            onSpeedChange={(s) => setSpeedMultiplier(s)}
            config={config}
            onUpdateConfig={(p) => setConfig((prev) => ({ ...prev, ...p }))}
            currentPreset={currentPreset}
            onSelectPreset={handleSelectPreset}
            theme={theme}
          />
        </section>

        {/* Emergency Vehicle Override Alert Banner */}
        {decision.emergencyActive && (
          <div className="p-4 rounded-2xl bg-rose-500/15 border-2 border-rose-500/50 shadow-xl flex flex-wrap items-center justify-between gap-3 text-rose-300 animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚨</span>
              <div>
                <h4 className="text-sm font-black tracking-wide text-rose-400">
                  EMERGENCY VEHICLE DETECTED
                </h4>
                <div className="text-xs text-rose-200 mt-0.5 font-medium flex flex-wrap items-center gap-2">
                  <span>Approach Direction: <strong className="text-white font-mono uppercase">{decision.emergencyLane || 'NORTH'}</strong></span>
                  <span>·</span>
                  <span>
                    AI ACTION: <strong className="text-emerald-400 font-bold">{decision.emergencyLane === 'East' || decision.emergencyLane === 'West' ? 'EAST-WEST → GREEN' : 'NORTH-SOUTH → GREEN'}</strong> | <strong className="text-rose-400 font-bold">{decision.emergencyLane === 'East' || decision.emergencyLane === 'West' ? 'NORTH-SOUTH → RED' : 'EAST-WEST → RED'}</strong>
                  </span>
                  <span>·</span>
                  <span className="text-rose-300/80">Priority preemption active until vehicle clears junction.</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleToggleEmergency(decision.emergencyLane || 'North')}
              className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs cursor-pointer shadow-md transition-colors"
            >
              Cancel Override
            </button>
          </div>
        )}

        {/* 2. MAIN CENTERPIECE: VISUAL FOUR-WAY ROAD JUNCTION & AI DECISION PANEL */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main 4-Way Road Intersection Canvas (8 cols) */}
          <div className="lg:col-span-8 space-y-3">
            <VideoCanvas
              detections={detections}
              config={config}
              onUpdateConfig={(p) => setConfig((prev) => ({ ...prev, ...p }))}
              isRunning={isRunning}
              lampStates={decision.lampStates}
              decision={decision}
              theme={theme}
              canvasRef={canvasRef}
            />
          </div>

          {/* AI Decision Panel & Physical Signal Housings (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Prominent AI Traffic Decision Panel */}
            <SignalDecisionBanner
              decision={decision}
              stats={laneStats}
              countdown={countdown}
              isRunning={isRunning}
              theme={theme}
            />

            {/* Visual Traffic Signal Lamps Housing */}
            <TrafficLights
              lampStates={decision.lampStates}
              countdown={countdown}
              currentCorridor={decision.currentSignal}
              isYellow={isYellow}
              emergencyActive={decision.emergencyActive}
              theme={theme}
            />
          </div>
        </section>

        {/* 3. FOUR APPROACH DIRECTION CARDS (NORTH, SOUTH, EAST, WEST with Vehicles, Density, Signal) */}
        <section className="space-y-3">
          <div className={`flex items-center justify-between text-xs px-1 ${subTextColor}`}>
            <span className={`font-bold uppercase tracking-wider text-[11px] ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>
              Four-Way Approach Direction Statistics
            </span>
            <span>
              Real-time vehicle counting, density tiering & active signal indicators
            </span>
          </div>
          <LaneStatsCards stats={laneStats} lampStates={decision.lampStates} theme={theme} />
        </section>

        {/* 4. VEHICLE CLASSIFICATION FLEET STATISTICS */}
        <section>
          <VehicleTypeStats stats={laneStats} weather={config.weather} theme={theme} />
        </section>

        {/* 5. TRAFFIC DENSITY CHART & RESULTS AUDIT TABLE */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <DensityBarChart stats={laneStats} config={config} theme={theme} />
          </div>
          <div className="lg:col-span-7">
            <SummaryResultsTable
              stats={laneStats}
              decision={decision}
              totalDetections={detections.length}
              theme={theme}
            />
          </div>
        </section>

        {/* 6. EFFICIENCY BENCHMARK COMPARISON */}
        <section>
          <EfficiencyBenchmark decision={decision} stats={laneStats} theme={theme} />
        </section>
      </main>

      {/* QUIET FOOTER */}
      <footer className={`mt-auto border-t py-5 px-6 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 ${
        theme === 'light'
          ? 'bg-white border-slate-200 text-slate-500'
          : theme === 'thermal'
          ? 'bg-[#090318] border-amber-500/20 text-amber-200/70'
          : 'bg-[#090d16] border-slate-800/80 text-slate-400'
      }`}>
        <div className="flex items-center gap-2">
          <span>AI Smart Traffic Signal · Realistic Four-Way Traffic Intersection Simulation</span>
          <span>·</span>
          <span>College AI Project Prototype</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsVivaModalOpen(true)}
            className="hover:underline transition-colors cursor-pointer text-amber-500 font-semibold"
          >
            Presentation Script & Viva Q&A
          </button>
          <button
            onClick={() => setIsCodeModalOpen(true)}
            className="hover:underline transition-colors cursor-pointer text-sky-500 font-semibold"
          >
            Download Python Files (.zip)
          </button>
        </div>
      </footer>

      {/* CALIBRATION & SETTINGS MODAL */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSave={(newCfg) => setConfig(newCfg)}
        onResetDefaults={() => setConfig(DEFAULT_CONFIG)}
      />

      {/* PYTHON SOURCE CODE & ZIP DOWNLOAD MODAL */}
      <PythonCodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />

      {/* FACULTY VIVA & ORAL GUIDE MODAL */}
      <FacultyVivaGuide
        isOpen={isVivaModalOpen}
        onClose={() => setIsVivaModalOpen(false)}
      />
    </div>
  );
}
