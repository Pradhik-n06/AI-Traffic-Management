import React, { useRef, useEffect, useState } from 'react';
import {
  VehicleDetection,
  SystemConfig,
  SignalDecision,
  LightColor,
  LaneDirection,
  AppTheme,
} from '../types/traffic';
import {
  Layers,
  Crosshair,
  Sliders,
  Sun,
  Moon,
  Flame,
  Cpu,
  Activity,
  Compass,
  CloudRain,
  CloudFog,
} from 'lucide-react';

interface VideoCanvasProps {
  detections: VehicleDetection[];
  config: SystemConfig;
  onUpdateConfig: (partial: Partial<SystemConfig>) => void;
  isRunning: boolean;
  lampStates: Record<LaneDirection, LightColor>;
  decision: SignalDecision;
  theme?: AppTheme;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

const CLASS_COLORS: Record<string, string> = {
  Car: '#38bdf8',
  Bus: '#f97316',
  Truck: '#c084fc',
  Motorcycle: '#34d399',
};

export const VideoCanvas: React.FC<VideoCanvasProps> = ({
  detections,
  config,
  onUpdateConfig,
  isRunning,
  lampStates,
  decision,
  theme = 'dark',
  canvasRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [latencyMs, setLatencyMs] = useState(13.8);
  const [fpsVal, setFpsVal] = useState(60.0);
  const [hoveredVehicle, setHoveredVehicle] = useState<VehicleDetection | null>(null);

  // Simulated CV runtime telemetry
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setLatencyMs(Number((12.5 + Math.random() * 2.5).toFixed(1)));
      setFpsVal(Number((59.2 + Math.random() * 1.5).toFixed(1)));
    }, 1200);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Main high-fidelity 4-way intersection rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const roadW = 180; // Total 4-way road width (2 lanes: 90px inbound, 90px outbound)
    const halfRoad = roadW / 2;
    const stopDist = halfRoad + 10;

    const isNight = config.visionMode === 'night';
    const isThermal = config.visionMode === 'thermal';
    const isRain = config.weather === 'rain';
    const isFog = config.weather === 'fog';

    // 1. CLEAR & DRAW SURROUNDING TERRAIN / GRASS
    ctx.clearRect(0, 0, w, h);

    if (isThermal) {
      ctx.fillStyle = '#080512';
    } else if (isNight) {
      ctx.fillStyle = '#05070f';
    } else if (isFog) {
      ctx.fillStyle = '#0e1626';
    } else if (isRain) {
      ctx.fillStyle = '#070b14';
    } else if (theme === 'light') {
      ctx.fillStyle = '#e2e8f0';
    } else {
      ctx.fillStyle = '#0b111e';
    }
    ctx.fillRect(0, 0, w, h);

    // Sidewalk curbs in corners
    const curbColor = isThermal
      ? '#160d2e'
      : isNight
      ? '#0f1422'
      : isFog
      ? '#1e293b'
      : isRain
      ? '#111827'
      : theme === 'light'
      ? '#cbd5e1'
      : '#1a2333';
    ctx.fillStyle = curbColor;
    ctx.fillRect(0, 0, cx - halfRoad, cy - halfRoad);
    ctx.fillRect(cx + halfRoad, 0, w - (cx + halfRoad), cy - halfRoad);
    ctx.fillRect(0, cy + halfRoad, cx - halfRoad, h - (cy + halfRoad));
    ctx.fillRect(cx + halfRoad, cy + halfRoad, w - (cx + halfRoad), h - (cy + halfRoad));

    // Curb edge lines
    ctx.strokeStyle = isThermal
      ? '#f59e0b'
      : isNight
      ? '#334155'
      : isFog
      ? '#475569'
      : isRain
      ? '#38bdf8'
      : theme === 'light'
      ? '#94a3b8'
      : '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, cx - halfRoad, cy - halfRoad);
    ctx.strokeRect(cx + halfRoad, 0, w - (cx + halfRoad), cy - halfRoad);
    ctx.strokeRect(0, cy + halfRoad, cx - halfRoad, h - (cy + halfRoad));
    ctx.strokeRect(cx + halfRoad, cy + halfRoad, w - (cx + halfRoad), h - (cy + halfRoad));

    // 2. ASPHALT ROADWAY (North-South & East-West Crossroad)
    const asphaltColor = isThermal
      ? '#120a24'
      : isNight
      ? '#090d16'
      : isRain
      ? '#090e17' // darker, wet asphalt
      : isFog
      ? '#162030' // haze-diffused asphalt
      : theme === 'light'
      ? '#334155'
      : '#151d2b';
    ctx.fillStyle = asphaltColor;
    // Vertical road (North-South)
    ctx.fillRect(cx - halfRoad, 0, roadW, h);
    // Horizontal road (East-West)
    ctx.fillRect(0, cy - halfRoad, w, roadW);

    // Wet road sheen specular highlights when raining
    if (isRain && !isThermal) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.04)';
      ctx.fillRect(cx - halfRoad + 10, 0, roadW - 20, h);
      ctx.fillRect(0, cy - halfRoad + 10, w, roadW - 20);
    }

    // Junction center box
    const junctionColor = isThermal
      ? '#180e30'
      : isNight
      ? '#0c121f'
      : isRain
      ? '#0b111c'
      : isFog
      ? '#182436'
      : theme === 'light'
      ? '#3e4c63'
      : '#182132';
    ctx.fillStyle = junctionColor;
    ctx.fillRect(cx - halfRoad, cy - halfRoad, roadW, roadW);

    // 3. ROAD MARKINGS: Double solid yellow center divider lines
    ctx.strokeStyle = isThermal ? '#f59e0b' : '#eab308';
    ctx.lineWidth = 2;

    // North center divider
    ctx.beginPath();
    ctx.moveTo(cx - 2, 0);
    ctx.lineTo(cx - 2, cy - stopDist - 16);
    ctx.moveTo(cx + 2, 0);
    ctx.lineTo(cx + 2, cy - stopDist - 16);
    ctx.stroke();

    // South center divider
    ctx.beginPath();
    ctx.moveTo(cx - 2, cy + stopDist + 16);
    ctx.lineTo(cx - 2, h);
    ctx.moveTo(cx + 2, cy + stopDist + 16);
    ctx.lineTo(cx + 2, h);
    ctx.stroke();

    // West center divider
    ctx.beginPath();
    ctx.moveTo(0, cy - 2);
    ctx.lineTo(cx - stopDist - 16, cy - 2);
    ctx.moveTo(0, cy + 2);
    ctx.lineTo(cx - stopDist - 16, cy + 2);
    ctx.stroke();

    // East center divider
    ctx.beginPath();
    ctx.moveTo(cx + stopDist + 16, cy - 2);
    ctx.lineTo(w, cy - 2);
    ctx.moveTo(cx + stopDist + 16, cy + 2);
    ctx.lineTo(w, cy + 2);
    ctx.stroke();

    // 4. SOLID WHITE STOP LINES
    ctx.strokeStyle = isThermal ? '#fbbf24' : '#ffffff';
    ctx.lineWidth = 4;

    // North stop line (inbound: left side of North road, x from cx - halfRoad to cx)
    ctx.beginPath();
    ctx.moveTo(cx - halfRoad, cy - stopDist);
    ctx.lineTo(cx, cy - stopDist);
    ctx.stroke();

    // South stop line (inbound: right side of South road, x from cx to cx + halfRoad)
    ctx.beginPath();
    ctx.moveTo(cx, cy + stopDist);
    ctx.lineTo(cx + halfRoad, cy + stopDist);
    ctx.stroke();

    // East stop line (inbound: top side of East road, y from cy - halfRoad to cy)
    ctx.beginPath();
    ctx.moveTo(cx + stopDist, cy - halfRoad);
    ctx.lineTo(cx + stopDist, cy);
    ctx.stroke();

    // West stop line (inbound: bottom side of West road, y from cy to cy + halfRoad)
    ctx.beginPath();
    ctx.moveTo(cx - stopDist, cy);
    ctx.lineTo(cx - stopDist, cy + halfRoad);
    ctx.stroke();

    // 5. HIGH-CONTRAST ZEBRA CROSSWALKS (All 4 branches)
    ctx.fillStyle = isThermal ? '#8b5cf6' : isNight ? '#94a3b8' : '#f8fafc';
    const stripeW = 9;
    const stripeGap = 6;
    // North crosswalk
    for (let x = cx - halfRoad + 4; x < cx + halfRoad - 4; x += stripeW + stripeGap) {
      ctx.fillRect(x, cy - stopDist - 18, stripeW, 14);
    }
    // South crosswalk
    for (let x = cx - halfRoad + 4; x < cx + halfRoad - 4; x += stripeW + stripeGap) {
      ctx.fillRect(x, cy + stopDist + 4, stripeW, 14);
    }
    // East crosswalk
    for (let y = cy - halfRoad + 4; y < cy + halfRoad - 4; y += stripeW + stripeGap) {
      ctx.fillRect(cx + stopDist + 4, y, 14, stripeW);
    }
    // West crosswalk
    for (let y = cy - halfRoad + 4; y < cy + halfRoad - 4; y += stripeW + stripeGap) {
      ctx.fillRect(cx - stopDist - 18, y, 14, stripeW);
    }

    // 6. ROAD DIRECTION ARROWS (Painted on inbound asphalt)
    ctx.fillStyle = isThermal ? 'rgba(251, 191, 36, 0.7)' : 'rgba(255, 255, 255, 0.55)';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // North inbound arrow pointing down
    ctx.fillText('↓', cx - 45, cy - stopDist - 38);
    // South inbound arrow pointing up
    ctx.fillText('↑', cx + 45, cy + stopDist + 38);
    // East inbound arrow pointing left
    ctx.fillText('←', cx + stopDist + 38, cy - 45);
    // West inbound arrow pointing right
    ctx.fillText('→', cx - stopDist - 38, cy + 45);

    // 7. DRAW FOUR PHYSICAL TRAFFIC LIGHT POSTS ON JUNCTION CORNERS
    const drawCornerSignal = (
      postX: number,
      postY: number,
      lane: LaneDirection,
      directionLabel: string
    ) => {
      const state = lampStates[lane] || 'RED';
      const isRed = state === 'RED';
      const isYellowState = state === 'YELLOW';
      const isGreen = state === 'GREEN';

      ctx.save();
      // Outer chassis
      ctx.fillStyle = '#111827';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(postX - 12, postY - 32, 24, 64, 8);
      ctx.fill();
      ctx.stroke();

      // Label on top
      ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.textAlign = 'center';
      ctx.fillText(directionLabel[0], postX, postY - 36);

      // Red bulb
      ctx.fillStyle = isRed ? '#ef4444' : '#450a0a';
      ctx.beginPath();
      ctx.arc(postX, postY - 18, 7, 0, Math.PI * 2);
      ctx.fill();
      if (isRed) {
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Yellow bulb
      ctx.fillStyle = isYellowState ? '#eab308' : '#422006';
      ctx.beginPath();
      ctx.arc(postX, postY, 7, 0, Math.PI * 2);
      ctx.fill();
      if (isYellowState) {
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Green bulb
      ctx.fillStyle = isGreen ? '#22c55e' : '#052e16';
      ctx.beginPath();
      ctx.arc(postX, postY + 18, 7, 0, Math.PI * 2);
      ctx.fill();
      if (isGreen) {
        ctx.strokeStyle = '#86efac';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Active glow bloom
      if (isGreen) {
        ctx.fillStyle = 'rgba(34, 197, 94, 0.35)';
        ctx.beginPath();
        ctx.arc(postX, postY + 18, 16, 0, Math.PI * 2);
        ctx.fill();
      } else if (isYellowState) {
        ctx.fillStyle = 'rgba(234, 179, 8, 0.4)';
        ctx.beginPath();
        ctx.arc(postX, postY, 16, 0, Math.PI * 2);
        ctx.fill();
      } else if (isRed) {
        ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.beginPath();
        ctx.arc(postX, postY - 18, 16, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    // North light post (top-right corner of junction)
    drawCornerSignal(cx + halfRoad + 18, cy - halfRoad - 24, 'North', 'NORTH');
    // South light post (bottom-left corner of junction)
    drawCornerSignal(cx - halfRoad - 18, cy + halfRoad + 24, 'South', 'SOUTH');
    // East light post (top-left corner of junction)
    drawCornerSignal(cx - halfRoad - 24, cy - halfRoad - 18, 'East', 'EAST');
    // West light post (bottom-right corner of junction)
    drawCornerSignal(cx + halfRoad + 24, cy + halfRoad + 18, 'West', 'WEST');

    // 8. RENDER VEHICLES MOVING THROUGH THE JUNCTION
    for (const det of detections) {
      const [x1, y1, x2, y2] = det.bbox;
      const [vx, vy] = det.center;
      const vw = x2 - x1;
      const vh = y2 - y1;
      const isVertical = det.lane === 'North' || det.lane === 'South';

      // Headlights beam: on in Night mode, Fog (penetrating mist cone), and Rain
      const needHeadlights = isNight || isFog || isRain;
      if (needHeadlights && !isThermal) {
        ctx.save();
        const beamAlpha = isFog ? 0.28 : isNight ? 0.22 : 0.14;
        ctx.fillStyle = `rgba(254, 240, 138, ${beamAlpha})`;
        ctx.beginPath();
        const reach = isFog ? 60 : 75;
        const spread = isFog ? 22 : 15;
        if (det.lane === 'North') {
          // Heading down
          ctx.moveTo(x1 + 3, y2);
          ctx.lineTo(x1 - spread, y2 + reach);
          ctx.lineTo(x2 + spread, y2 + reach);
          ctx.lineTo(x2 - 3, y2);
        } else if (det.lane === 'South') {
          // Heading up
          ctx.moveTo(x1 + 3, y1);
          ctx.lineTo(x1 - spread, y1 - reach);
          ctx.lineTo(x2 + spread, y1 - reach);
          ctx.lineTo(x2 - 3, y1);
        } else if (det.lane === 'East') {
          // Heading left
          ctx.moveTo(x1, y1 + 3);
          ctx.lineTo(x1 - reach, y1 - spread);
          ctx.lineTo(x1 - reach, y2 + spread);
          ctx.lineTo(x1, y2 - 3);
        } else {
          // Heading right
          ctx.moveTo(x2, y1 + 3);
          ctx.lineTo(x2 + reach, y1 - spread);
          ctx.lineTo(x2 + reach, y2 + spread);
          ctx.lineTo(x2, y2 - 3);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // Tire water spray kicked up behind moving vehicles in Rain
      if (isRain && !isThermal && det.speed > 0.4) {
        ctx.save();
        ctx.fillStyle = 'rgba(186, 230, 253, 0.25)';
        if (det.lane === 'North') {
          ctx.fillRect(x1 + 2, y1 - 8, vw - 4, 6);
        } else if (det.lane === 'South') {
          ctx.fillRect(x1 + 2, y2 + 2, vw - 4, 6);
        } else if (det.lane === 'East') {
          ctx.fillRect(x2 + 2, y1 + 2, 6, vh - 4);
        } else {
          ctx.fillRect(x1 - 8, y1 + 2, 6, vh - 4);
        }
        ctx.restore();
      }

      // Vehicle shadow
      ctx.fillStyle = isThermal ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.roundRect(x1 + 2, y1 + 3, vw, vh, 4);
      ctx.fill();

      // Vehicle body color
      let bodyColor = '#3b82f6';
      if (isThermal) {
        bodyColor = det.isEmergency ? '#ff0055' : '#fb923c';
      } else if (det.isEmergency) {
        bodyColor = '#ef4444';
      } else if (det.class === 'Bus') {
        bodyColor = '#ea580c';
      } else if (det.class === 'Truck') {
        bodyColor = '#8b5cf6';
      } else if (det.class === 'Motorcycle') {
        bodyColor = '#10b981';
      }

      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.roundRect(x1, y1, vw, vh, 4);
      ctx.fill();

      // Vehicle windshield & roof details
      ctx.fillStyle = isThermal ? '#fef08a' : isNight ? '#0b0f19' : '#0f172a';
      if (isVertical) {
        ctx.fillRect(x1 + 3, y1 + vh * 0.22, vw - 6, vh * 0.18);
        ctx.fillRect(x1 + 3, y1 + vh * 0.65, vw - 6, vh * 0.14);
      } else {
        ctx.fillRect(x1 + vw * 0.22, y1 + 3, vw * 0.18, vh - 6);
        ctx.fillRect(x1 + vw * 0.65, y1 + 3, vw * 0.14, vh - 6);
      }

      // Brake lights (glow red when stopping or stopped)
      if (det.speed < 0.3) {
        ctx.fillStyle = '#ef4444';
        if (det.lane === 'North') {
          ctx.fillRect(x1 + 2, y1 - 2, 4, 2);
          ctx.fillRect(x2 - 6, y1 - 2, 4, 2);
        } else if (det.lane === 'South') {
          ctx.fillRect(x1 + 2, y2, 4, 2);
          ctx.fillRect(x2 - 6, y2, 4, 2);
        } else if (det.lane === 'East') {
          ctx.fillRect(x2, y1 + 2, 2, 4);
          ctx.fillRect(x2, y2 - 6, 2, 4);
        } else if (det.lane === 'West') {
          ctx.fillRect(x1 - 2, y1 + 2, 2, 4);
          ctx.fillRect(x1 - 2, y2 - 6, 2, 4);
        }
      }

      // AI Bounding Box & Class Badges
      if (config.showBoundingBoxes) {
        const strokeCol = CLASS_COLORS[det.class] || '#38bdf8';
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x1, y1, vw, vh);

        // Corner brackets
        const cl = 5;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1 + cl);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x1 + cl, y1);
        ctx.moveTo(x2 - cl, y1);
        ctx.lineTo(x2, y1);
        ctx.lineTo(x2, y1 + cl);
        ctx.stroke();

        if (config.showLabels) {
          const badgeText = det.class;
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          const tw = ctx.measureText(badgeText).width;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(x1, Math.max(12, y1 - 13), tw + 6, 12);
          ctx.fillStyle = strokeCol;
          ctx.fillText(badgeText, x1 + 3, Math.max(12, y1 - 4));
        }
      }

      // Centroid dot
      if (config.showCentroids) {
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(vx, vy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 9. APPROACH QUEUE BADGES (Overlayed on each road approach)
    const drawApproachBadge = (
      bx: number,
      by: number,
      lane: LaneDirection,
      count: number
    ) => {
      const state = lampStates[lane] || 'RED';
      const isGreen = state === 'GREEN';
      const isYellowState = state === 'YELLOW';
      const bgCol = isGreen
        ? 'rgba(34, 197, 94, 0.92)'
        : isYellowState
        ? 'rgba(234, 179, 8, 0.92)'
        : 'rgba(239, 68, 68, 0.92)';

      ctx.save();
      const text = `${lane.toUpperCase()}: ${count} QUEUED · ${state}`;
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      const tw = ctx.measureText(text).width;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(bx - tw / 2 - 8, by - 10, tw + 16, 20, 6);
      ctx.fill();
      ctx.strokeStyle = bgCol;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, bx, by);
      ctx.restore();
    };

    // Calculate queue counts for road labels
    const northQueue = detections.filter(
      (d) => d.lane === 'North' && d.center[1] < cy - stopDist
    ).length;
    const southQueue = detections.filter(
      (d) => d.lane === 'South' && d.center[1] > cy + stopDist
    ).length;
    const eastQueue = detections.filter(
      (d) => d.lane === 'East' && d.center[0] > cx + stopDist
    ).length;
    const westQueue = detections.filter(
      (d) => d.lane === 'West' && d.center[0] < cx - stopDist
    ).length;

    drawApproachBadge(cx - 45, 24, 'North', northQueue);
    drawApproachBadge(cx + 45, h - 24, 'South', southQueue);
    drawApproachBadge(w - 110, cy - 45, 'East', eastQueue);
    drawApproachBadge(110, cy + 45, 'West', westQueue);

    // 10. ATMOSPHERIC WEATHER VISUAL LAYERS
    if (isRain && !isThermal) {
      // Dynamic falling raindrops and streaks
      ctx.save();
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.42)';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      const t = performance.now() * 0.001;
      for (let i = 0; i < 96; i++) {
        const rx = ((i * 71 + t * 450) % (w + 60)) - 30;
        const ry = (i * 37 + t * 900) % (h + 30);
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 5, ry + 15);
      }
      ctx.stroke();

      // Puddle ripple rings on road shoulders and corners
      ctx.strokeStyle = 'rgba(186, 230, 253, 0.18)';
      ctx.lineWidth = 1;
      for (let p = 0; p < 8; p++) {
        const px = ((p * 137 + t * 40) % (w - 120)) + 60;
        const py = ((p * 79 + t * 25) % (h - 120)) + 60;
        const radius = ((t * 18 + p * 6) % 14);
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    } else if (isFog && !isThermal) {
      // Dense atmospheric fog and drifting mist layers
      ctx.save();
      const t = performance.now() * 0.0005;

      // Soft ambient fog overlay
      ctx.fillStyle = 'rgba(203, 213, 225, 0.18)';
      ctx.fillRect(0, 0, w, h);

      // Drifting mist plumes
      const fogX1 = ((t * 70) % (w + 400)) - 200;
      const mist1 = ctx.createRadialGradient(fogX1, cy - 70, 30, fogX1, cy - 70, 260);
      mist1.addColorStop(0, 'rgba(226, 232, 240, 0.25)');
      mist1.addColorStop(1, 'rgba(226, 232, 240, 0)');
      ctx.fillStyle = mist1;
      ctx.fillRect(0, 0, w, h);

      const fogX2 = w - (((t * 50) % (w + 400)) - 200);
      const mist2 = ctx.createRadialGradient(fogX2, cy + 70, 40, fogX2, cy + 70, 240);
      mist2.addColorStop(0, 'rgba(226, 232, 240, 0.20)');
      mist2.addColorStop(1, 'rgba(226, 232, 240, 0)');
      ctx.fillStyle = mist2;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }, [detections, lampStates, config, theme]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl flex flex-col">
      {/* Top CV Diagnostic Telemetry HUD */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-900/95 border-b border-slate-800 text-xs text-slate-300 gap-2">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-100 flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isRunning ? 'bg-emerald-400 traffic-glow-green animate-pulse' : 'bg-slate-500'
              }`}
            />
            4-WAY JUNCTION SIMULATION
          </span>
          <span className="text-slate-600">|</span>
          <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono-numbers text-slate-400">
            <span className="flex items-center gap-1">
              <Cpu className="w-3 h-3 text-sky-400" />
              YOLOv8n ({latencyMs}ms)
            </span>
            <span className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" />
              {fpsVal} FPS
            </span>
            <span className="text-emerald-400 font-bold">
              AI Confidence: {config.weather === 'fog' ? '83%' : config.weather === 'rain' ? '89%' : '94%'}
            </span>
            <span>
              Active: <strong className="text-slate-200">{detections.length}</strong>
            </span>
          </div>
        </div>

        {/* Vision Mode & Weather Condition Toggles */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Weather condition buttons */}
          <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] mr-1">
            <button
              onClick={() => onUpdateConfig({ weather: 'clear' })}
              className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer ${
                (config.weather || 'clear') === 'clear'
                  ? 'bg-slate-800 text-amber-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Clear Weather: Dry Road & Normal Grip"
            >
              <Sun className="w-3 h-3" />
              Clear
            </button>
            <button
              onClick={() => onUpdateConfig({ weather: 'rain' })}
              className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer ${
                config.weather === 'rain'
                  ? 'bg-slate-800 text-sky-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Rain Weather: Wet Asphalt, Reduced Speed & 22px Stop Buffer"
            >
              <CloudRain className="w-3 h-3" />
              Rain
            </button>
            <button
              onClick={() => onUpdateConfig({ weather: 'fog' })}
              className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer ${
                config.weather === 'fog'
                  ? 'bg-slate-800 text-purple-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Fog Weather: Low Visibility, Caution Speed & 26px Safety Gap"
            >
              <CloudFog className="w-3 h-3" />
              Fog
            </button>
          </div>

          {/* Vision mode buttons */}
          <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] mr-1">
            <button
              onClick={() => onUpdateConfig({ visionMode: 'day' })}
              className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer ${
                config.visionMode === 'day'
                  ? 'bg-slate-800 text-sky-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Daylight Asphalt Mode"
            >
              <Sun className="w-3 h-3" />
              Day
            </button>
            <button
              onClick={() => onUpdateConfig({ visionMode: 'night' })}
              className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer ${
                config.visionMode === 'night'
                  ? 'bg-slate-800 text-indigo-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Night Vision Mode (Headlights on asphalt)"
            >
              <Moon className="w-3 h-3" />
              Night
            </button>
            <button
              onClick={() => onUpdateConfig({ visionMode: 'thermal' })}
              className={`px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer ${
                config.visionMode === 'thermal'
                  ? 'bg-slate-800 text-amber-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Thermal FLIR Infrared Mode"
            >
              <Flame className="w-3 h-3" />
              Thermal
            </button>
          </div>

          <button
            onClick={() =>
              onUpdateConfig({ showBoundingBoxes: !config.showBoundingBoxes })
            }
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
              config.showBoundingBoxes
                ? 'bg-slate-800 text-sky-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle AI Bounding Boxes"
          >
            <Layers className="w-3.5 h-3.5" />
            AI Boxes
          </button>

          <button
            onClick={() => onUpdateConfig({ showCentroids: !config.showCentroids })}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
              config.showCentroids
                ? 'bg-slate-800 text-amber-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Vehicle Centroids"
          >
            <Crosshair className="w-3.5 h-3.5" />
            Centroids
          </button>
        </div>
      </div>

      {/* Main Four-Way Intersection Canvas */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[16/9.5] bg-neutral-950 flex items-center justify-center overflow-hidden select-none"
      >
        <canvas
          ref={canvasRef}
          width={1000}
          height={580}
          className="w-full h-full object-contain"
        />

        {/* Scanlines visual texture overlay if enabled */}
        {config.showScanlines && (
          <div className="absolute inset-0 pointer-events-none z-20 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        )}

        {/* Compass HUD */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs shadow-lg flex items-center gap-2">
          <Compass className="w-4 h-4 text-emerald-400" />
          <span className="font-mono-numbers font-bold text-slate-200 text-[11px]">
            N ↔ S | E ↔ W CROSSROAD
          </span>
        </div>

        {/* Weather Condition Overlay HUD Badge */}
        <div className="absolute top-4 right-4 z-20 pointer-events-none bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs shadow-lg flex items-center gap-2.5">
          {config.weather === 'rain' ? (
            <>
              <CloudRain className="w-4 h-4 text-sky-400 animate-pulse shrink-0" />
              <div className="flex flex-col text-right">
                <span className="font-bold text-sky-300 text-[11px] leading-tight">RAIN: WET ROAD</span>
                <span className="text-[10px] text-slate-400 font-mono">Speed 78% · 22px Stop Buffer</span>
              </div>
            </>
          ) : config.weather === 'fog' ? (
            <>
              <CloudFog className="w-4 h-4 text-purple-400 animate-pulse shrink-0" />
              <div className="flex flex-col text-right">
                <span className="font-bold text-purple-300 text-[11px] leading-tight">FOG: LOW VISIBILITY</span>
                <span className="text-[10px] text-slate-400 font-mono">Speed 70% · 26px Safety Gap</span>
              </div>
            </>
          ) : (
            <>
              <Sun className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex flex-col text-right">
                <span className="font-bold text-amber-300 text-[11px] leading-tight">CLEAR WEATHER</span>
                <span className="text-[10px] text-slate-400 font-mono">Dry Road · 14px Stop Buffer</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
