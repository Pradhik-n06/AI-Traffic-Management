import {
  VehicleClass,
  LaneDirection,
  DensityTier,
  VehicleDetection,
  LaneStats,
  SignalDecision,
  SystemConfig,
  ScenarioPreset,
  LightColor,
} from '../types/traffic';

export interface SimulatedVehicle {
  id: number;
  class: VehicleClass;
  direction: LaneDirection; // Approach direction: North, South, East, West
  x: number;
  y: number;
  speed: number;
  targetSpeed: number;
  width: number;
  height: number;
  color: string;
  hasPassedStopLine: boolean;
  waitingSec: number;
  confidence: number;
  isEmergency?: boolean;
}

export class TrafficIntersectionSimulator {
  private vehicles: SimulatedVehicle[] = [];
  private nextId = 1;
  private width = 1000;
  private height = 580;
  private roadWidth = 180; // Total width of 4-way crossroad
  private currentCorridor: 'NORTH-SOUTH' | 'EAST-WEST' = 'NORTH-SOUTH';
  private phaseCountdown = 30; // active cycle remaining seconds
  private isYellowTransition = false;
  private yellowCountdown = 0;
  private emergencyActive = false;
  private emergencyLane: LaneDirection | null = null;
  private spawnTimers: Record<LaneDirection, number> = {
    North: 0,
    South: 0,
    East: 0,
    West: 0,
  };

  constructor() {
    this.resetScenario('heavy-ns');
  }

  public setDimensions(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public toggleEmergency(lane: LaneDirection = 'North') {
    if (this.emergencyActive) {
      this.emergencyActive = false;
      this.emergencyLane = null;
      this.vehicles.forEach((v) => {
        v.isEmergency = false;
      });
    } else {
      this.emergencyActive = true;
      this.emergencyLane = lane;
      // Preempt immediately to corridor matching emergency lane
      const targetCorridor =
        lane === 'North' || lane === 'South' ? 'NORTH-SOUTH' : 'EAST-WEST';
      this.currentCorridor = targetCorridor;
      this.isYellowTransition = false;
      this.phaseCountdown = 25;

      // Spawn or designate an emergency vehicle in that lane
      const existing = this.vehicles.find(
        (v) => v.direction === lane && !v.hasPassedStopLine
      );
      if (existing) {
        existing.isEmergency = true;
        existing.class = 'Bus'; // Emergency vehicle
        existing.color = '#ffffff';
        existing.targetSpeed = 4.2;
      } else {
        this.spawnSingleVehicle(lane, true);
      }
    }
  }

  public resetScenario(preset: ScenarioPreset) {
    this.vehicles = [];
    this.nextId = 1;
    this.emergencyActive = false;
    this.emergencyLane = null;
    this.isYellowTransition = false;

    // Reset spawn timers
    this.spawnTimers = { North: 0, South: 0, East: 0, West: 0 };

    if (preset === 'heavy-ew') {
      this.currentCorridor = 'EAST-WEST';
      this.phaseCountdown = 45;
      this.seedInitialQueue('East', 14);
      this.seedInitialQueue('West', 12);
      this.seedInitialQueue('North', 3);
      this.seedInitialQueue('South', 4);
    } else if (preset === 'balanced') {
      this.currentCorridor = 'NORTH-SOUTH';
      this.phaseCountdown = 30;
      this.seedInitialQueue('North', 8);
      this.seedInitialQueue('South', 8);
      this.seedInitialQueue('East', 8);
      this.seedInitialQueue('West', 8);
    } else if (preset === 'off-peak') {
      this.currentCorridor = 'NORTH-SOUTH';
      this.phaseCountdown = 15;
      this.seedInitialQueue('North', 2);
      this.seedInitialQueue('South', 3);
      this.seedInitialQueue('East', 2);
      this.seedInitialQueue('West', 2);
    } else if (preset === 'emergency-priority') {
      this.currentCorridor = 'NORTH-SOUTH';
      this.phaseCountdown = 30;
      this.emergencyActive = true;
      this.emergencyLane = 'North';
      this.seedInitialQueue('North', 10);
      this.seedInitialQueue('South', 8);
      this.seedInitialQueue('East', 9);
      this.seedInitialQueue('West', 8);
      if (this.vehicles.length > 0) {
        this.vehicles[0].isEmergency = true;
      }
    } else {
      // Default: heavy-ns (North-South rush hour)
      this.currentCorridor = 'NORTH-SOUTH';
      this.phaseCountdown = 45;
      this.seedInitialQueue('North', 16);
      this.seedInitialQueue('South', 14);
      this.seedInitialQueue('East', 4);
      this.seedInitialQueue('West', 3);
    }
  }

  private getDimensions(vClass: VehicleClass, dir: LaneDirection): { w: number; h: number } {
    const isVertical = dir === 'North' || dir === 'South';
    if (vClass === 'Bus') {
      return isVertical ? { w: 26, h: 62 } : { w: 62, h: 26 };
    }
    if (vClass === 'Truck') {
      return isVertical ? { w: 25, h: 54 } : { w: 54, h: 25 };
    }
    if (vClass === 'Motorcycle') {
      return isVertical ? { w: 12, h: 22 } : { w: 22, h: 12 };
    }
    // Car
    return isVertical ? { w: 22, h: 38 } : { w: 38, h: 22 };
  }

  private seedInitialQueue(dir: LaneDirection, count: number) {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const stopDist = this.roadWidth / 2 + 12;

    const colors = ['#38bdf8', '#fbbf24', '#f43f5e', '#a855f7', '#34d399', '#f8fafc', '#94a3b8'];

    const pickClass = (): VehicleClass => {
      const r = Math.random();
      if (r < 0.65) return 'Car';
      if (r < 0.8) return 'Bus';
      if (r < 0.9) return 'Truck';
      return 'Motorcycle';
    };

    let accumOffset = 18;

    for (let i = 0; i < count; i++) {
      const vClass = pickClass();
      const dims = this.getDimensions(vClass, dir);
      const vehicleLength = dir === 'North' || dir === 'South' ? dims.h : dims.w;
      accumOffset += vehicleLength / 2;

      let vx = cx;
      let vy = cy;

      if (dir === 'North') {
        // Enters from top, moves down (stops above stop line)
        vx = cx - 45;
        vy = cy - stopDist - accumOffset;
      } else if (dir === 'South') {
        // Enters from bottom, moves up (stops below stop line)
        vx = cx + 45;
        vy = cy + stopDist + accumOffset;
      } else if (dir === 'East') {
        // Enters from right, moves left (stops right of stop line)
        vx = cx + stopDist + accumOffset;
        vy = cy - 45;
      } else if (dir === 'West') {
        // Enters from left, moves right (stops left of stop line)
        vx = cx - stopDist - accumOffset;
        vy = cy + 45;
      }

      accumOffset += vehicleLength / 2 + 12; // gap between cars

      this.vehicles.push({
        id: this.nextId++,
        class: vClass,
        direction: dir,
        x: vx,
        y: vy,
        speed: 0,
        targetSpeed: 2.2 + Math.random() * 0.8,
        width: dims.w,
        height: dims.h,
        color: colors[i % colors.length],
        hasPassedStopLine: false,
        waitingSec: 0,
        confidence: Number((0.85 + Math.random() * 0.13).toFixed(2)),
      });
    }
  }

  private spawnSingleVehicle(dir: LaneDirection, isEmergency = false): boolean {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const colors = ['#38bdf8', '#fbbf24', '#f43f5e', '#a855f7', '#34d399', '#f8fafc', '#cbd5e1'];

    let vClass: VehicleClass = 'Car';
    if (isEmergency) {
      vClass = 'Bus';
    } else {
      const r = Math.random();
      if (r < 0.65) vClass = 'Car';
      else if (r < 0.8) vClass = 'Bus';
      else if (r < 0.9) vClass = 'Truck';
      else vClass = 'Motorcycle';
    }

    const dims = this.getDimensions(vClass, dir);
    let sx = cx;
    let sy = cy;

    if (dir === 'North') {
      sx = cx - 45;
      sy = -dims.h / 2;
    } else if (dir === 'South') {
      sx = cx + 45;
      sy = this.height + dims.h / 2;
    } else if (dir === 'East') {
      sx = this.width + dims.w / 2;
      sy = cy - 45;
    } else if (dir === 'West') {
      sx = -dims.w / 2;
      sy = cy + 45;
    }

    // Check if spawn point is blocked by any vehicle
    for (const v of this.vehicles) {
      if (v.direction === dir && !v.hasPassedStopLine) {
        const dist = Math.hypot(v.x - sx, v.y - sy);
        if (dist < 65) {
          return false; // too close, do not spawn yet
        }
      }
    }

    this.vehicles.push({
      id: this.nextId++,
      class: vClass,
      direction: dir,
      x: sx,
      y: sy,
      speed: 1.8,
      targetSpeed: isEmergency ? 4.2 : 2.4 + Math.random() * 0.8,
      width: dims.w,
      height: dims.h,
      color: isEmergency ? '#ffffff' : colors[Math.floor(Math.random() * colors.length)],
      hasPassedStopLine: false,
      waitingSec: 0,
      confidence: Number((0.88 + Math.random() * 0.1).toFixed(2)),
      isEmergency,
    });

    return true;
  }

  public step(config: SystemConfig, deltaSec: number = 0.05) {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const stopDist = this.roadWidth / 2 + 10;

    // 1. Spawning vehicles according to directional spawn rates
    const dirs: LaneDirection[] = ['North', 'South', 'East', 'West'];
    const rateMap: Record<LaneDirection, number> = {
      North: config.spawnRateNorth || 5,
      South: config.spawnRateSouth || 4,
      East: config.spawnRateEast || 2,
      West: config.spawnRateWest || 2,
    };
    const intensity = config.globalSpawnIntensity || 1.0;

    for (const d of dirs) {
      this.spawnTimers[d] += deltaSec;
      // Interval: higher rate = smaller interval
      const rate = rateMap[d];
      const intervalSec = Math.max(0.6, 6.0 / (rate * intensity));

      if (this.spawnTimers[d] >= intervalSec) {
        if (this.spawnSingleVehicle(d)) {
          this.spawnTimers[d] = 0;
        }
      }
    }

    // 2. Count active queues for AI decision logic
    const queues: Record<LaneDirection, number> = {
      North: 0,
      South: 0,
      East: 0,
      West: 0,
    };

    for (const v of this.vehicles) {
      if (!v.hasPassedStopLine) {
        queues[v.direction]++;
      }
    }

    const nsQueue = queues.North + queues.South;
    const ewQueue = queues.East + queues.West;

    // 3. Traffic Signal State Machine (Yellow clearance + AI Green Time Allocation)
    if (this.isYellowTransition) {
      this.yellowCountdown -= deltaSec;
      if (this.yellowCountdown <= 0) {
        // Yellow clearance finished -> switch green to the other corridor
        this.isYellowTransition = false;
        const nextCorridor =
          this.currentCorridor === 'NORTH-SOUTH' ? 'EAST-WEST' : 'NORTH-SOUTH';
        this.currentCorridor = nextCorridor;

        // Calculate dynamic green duration based on traffic density
        const relevantQueue = nextCorridor === 'NORTH-SOUTH' ? nsQueue : ewQueue;
        const maxLane =
          nextCorridor === 'NORTH-SOUTH'
            ? Math.max(queues.North, queues.South)
            : Math.max(queues.East, queues.West);

        if (maxLane <= config.lowThreshold) {
          this.phaseCountdown = config.greenTimeLow; // 15s
        } else if (maxLane <= config.mediumThreshold) {
          this.phaseCountdown = config.greenTimeMedium; // 30s
        } else {
          this.phaseCountdown = config.greenTimeHigh; // 45s
          // Bonus for heavy congestion
          if (maxLane > config.mediumThreshold) {
            this.phaseCountdown = Math.min(
              60,
              config.greenTimeHigh + Math.floor((maxLane - config.mediumThreshold) * 1.5)
            );
          }
        }
      }
    } else {
      this.phaseCountdown -= deltaSec;
      if (this.phaseCountdown <= 0) {
        // Phase timer completed -> initiate yellow clearance
        this.isYellowTransition = true;
        this.yellowCountdown = 3.0; // 3 seconds yellow light
      }
    }

    // 4. Vehicle Physical Movement, Stop Lines, and Anti-Collision Queues
    // Weather condition dynamics:
    // - Clear: 100% cruising speed, standard acceleration (0.12), normal stop buffer (14px)
    // - Rain: Wet slippery pavement: 78% cruising speed, lower grip acceleration (0.075), longer braking (0.19), larger safety buffer (22px)
    // - Fog: Low visibility mist: 70% caution speed, careful acceleration (0.085), earlier deceleration (95px), maximum safety buffer (26px)
    const weather = config.weather || 'clear';
    let speedMod = 1.0;
    let accelMod = 0.12;
    let brakeMod = 0.28;
    let decelDistance = 60;
    let safeBuffer = 14;

    if (weather === 'rain') {
      speedMod = 0.78;
      accelMod = 0.075;
      brakeMod = 0.19;
      decelDistance = 85;
      safeBuffer = 22;
    } else if (weather === 'fog') {
      speedMod = 0.70;
      accelMod = 0.085;
      brakeMod = 0.22;
      decelDistance = 95;
      safeBuffer = 26;
    }

    for (let i = 0; i < this.vehicles.length; i++) {
      const v = this.vehicles[i];
      const isGreen =
        (this.currentCorridor === 'NORTH-SOUTH' &&
          (v.direction === 'North' || v.direction === 'South')) ||
        (this.currentCorridor === 'EAST-WEST' &&
          (v.direction === 'East' || v.direction === 'West'));

      const isYellow = this.isYellowTransition && isGreen;
      const isRed = !isGreen;

      // Check if vehicle has crossed stop line into junction
      if (!v.hasPassedStopLine) {
        if (v.direction === 'North' && v.y >= cy - stopDist) {
          v.hasPassedStopLine = true;
        } else if (v.direction === 'South' && v.y <= cy + stopDist) {
          v.hasPassedStopLine = true;
        } else if (v.direction === 'East' && v.x <= cx + stopDist) {
          v.hasPassedStopLine = true;
        } else if (v.direction === 'West' && v.x >= cx - stopDist) {
          v.hasPassedStopLine = true;
        }
      }

      // Desired speed calculation
      let mustStopAtSignal = false;

      if (!v.hasPassedStopLine) {
        if (isRed) {
          mustStopAtSignal = true;
        } else if (isYellow) {
          // In yellow, stop unless already very close to stop line (< 35px)
          if (v.direction === 'North' && cy - stopDist - v.y > 35) mustStopAtSignal = true;
          if (v.direction === 'South' && v.y - (cy + stopDist) > 35) mustStopAtSignal = true;
          if (v.direction === 'East' && v.x - (cx + stopDist) > 35) mustStopAtSignal = true;
          if (v.direction === 'West' && cx - stopDist - v.x > 35) mustStopAtSignal = true;
        }
      }

      // Check distance to car in front (same direction & queue)
      let obstacleDistance = 9999;
      for (let j = 0; j < this.vehicles.length; j++) {
        if (i === j) continue;
        const other = this.vehicles[j];
        if (other.direction !== v.direction) continue;

        if (v.direction === 'North') {
          if (other.y > v.y) {
            const gap = other.y - other.height / 2 - (v.y + v.height / 2);
            if (gap >= 0 && gap < obstacleDistance) obstacleDistance = gap;
          }
        } else if (v.direction === 'South') {
          if (other.y < v.y) {
            const gap = v.y - v.height / 2 - (other.y + other.height / 2);
            if (gap >= 0 && gap < obstacleDistance) obstacleDistance = gap;
          }
        } else if (v.direction === 'East') {
          if (other.x < v.x) {
            const gap = v.x - v.width / 2 - (other.x + other.width / 2);
            if (gap >= 0 && gap < obstacleDistance) obstacleDistance = gap;
          }
        } else if (v.direction === 'West') {
          if (other.x > v.x) {
            const gap = other.x - other.width / 2 - (v.x + v.width / 2);
            if (gap >= 0 && gap < obstacleDistance) obstacleDistance = gap;
          }
        }
      }

      // Distance to stop line if signal requires stopping
      let stopLineDist = 9999;
      if (mustStopAtSignal && !v.hasPassedStopLine) {
        if (v.direction === 'North') stopLineDist = cy - stopDist - (v.y + v.height / 2);
        if (v.direction === 'South') stopLineDist = v.y - v.height / 2 - (cy + stopDist);
        if (v.direction === 'East') stopLineDist = v.x - v.width / 2 - (cx + stopDist);
        if (v.direction === 'West') stopLineDist = cx - stopDist - (v.x + v.width / 2);
      }

      const effectiveClearance = Math.min(obstacleDistance, stopLineDist);
      const currentCruisingTarget = v.isEmergency ? v.targetSpeed : v.targetSpeed * speedMod;

      if (effectiveClearance <= safeBuffer) {
        // Must come to a complete stop
        v.speed = Math.max(0, v.speed - brakeMod);
      } else if (effectiveClearance < decelDistance) {
        // Slow down smoothly taking into account weather stopping distance
        const span = Math.max(1, decelDistance - safeBuffer);
        const progress = Math.max(0, Math.min(1, (effectiveClearance - safeBuffer) / span));
        const target = Math.max(0.3, progress * currentCruisingTarget);
        v.speed = Math.max(0.3, Math.min(target, v.speed - brakeMod * 0.55));
      } else {
        // Free road ahead, accelerate up to weather-adjusted cruising speed
        v.speed = Math.min(currentCruisingTarget, v.speed + accelMod);
      }

      // Update position
      if (v.direction === 'North') v.y += v.speed;
      if (v.direction === 'South') v.y -= v.speed;
      if (v.direction === 'East') v.x -= v.speed;
      if (v.direction === 'West') v.x += v.speed;

      // Track waiting time
      if (v.speed < 0.2) {
        v.waitingSec += deltaSec;
      }
    }

    // 5. Check if emergency vehicle has successfully crossed the junction to resume normal AI operation
    if (this.emergencyActive) {
      const ev = this.vehicles.find((v) => v.isEmergency);
      if (!ev) {
        this.emergencyActive = false;
        this.emergencyLane = null;
      } else {
        let hasCleared = false;
        if (ev.direction === 'North' && ev.y > cy + stopDist + 60) hasCleared = true;
        if (ev.direction === 'South' && ev.y < cy - stopDist - 60) hasCleared = true;
        if (ev.direction === 'East' && ev.x < cx - stopDist - 60) hasCleared = true;
        if (ev.direction === 'West' && ev.x > cx + stopDist + 60) hasCleared = true;

        if (hasCleared) {
          ev.isEmergency = false;
          this.emergencyActive = false;
          this.emergencyLane = null;
        }
      }
    }

    // 6. Remove vehicles that have exited the screen on the opposite side
    this.vehicles = this.vehicles.filter((v) => {
      if (v.direction === 'North' && v.y > this.height + 80) return false;
      if (v.direction === 'South' && v.y < -80) return false;
      if (v.direction === 'East' && v.x < -80) return false;
      if (v.direction === 'West' && v.x > this.width + 80) return false;
      return true;
    });
  }

  public getDetections(config: SystemConfig): {
    detections: VehicleDetection[];
    laneStats: Record<LaneDirection, LaneStats>;
    decision: SignalDecision;
  } {
    const laneCounts: Record<LaneDirection, number> = {
      North: 0,
      South: 0,
      East: 0,
      West: 0,
    };

    const laneClasses: Record<LaneDirection, Record<VehicleClass, number>> = {
      North: { Car: 0, Bus: 0, Truck: 0, Motorcycle: 0 },
      South: { Car: 0, Bus: 0, Truck: 0, Motorcycle: 0 },
      East: { Car: 0, Bus: 0, Truck: 0, Motorcycle: 0 },
      West: { Car: 0, Bus: 0, Truck: 0, Motorcycle: 0 },
    };

    const waitTimes: Record<LaneDirection, number[]> = {
      North: [],
      South: [],
      East: [],
      West: [],
    };

    const detections: VehicleDetection[] = [];

    for (const v of this.vehicles) {
      if (v.x < -20 || v.x > this.width + 20 || v.y < -20 || v.y > this.height + 20) {
        continue;
      }

      // Count only vehicles approaching or queued in their respective arm
      // (do not count vehicles after they have crossed and are exiting)
      if (!v.hasPassedStopLine) {
        laneCounts[v.direction]++;
        laneClasses[v.direction][v.class]++;
        waitTimes[v.direction].push(v.waitingSec);
      }

      const x1 = Math.max(0, v.x - v.width / 2);
      const y1 = Math.max(0, v.y - v.height / 2);
      const x2 = Math.min(this.width, v.x + v.width / 2);
      const y2 = Math.min(this.height, v.y + v.height / 2);

      const weatherConfMod = config.weather === 'fog' ? 0.88 : config.weather === 'rain' ? 0.94 : 1.0;
      const effectiveConf = Number((v.confidence * weatherConfMod).toFixed(2));

      detections.push({
        id: v.id,
        class: v.class,
        confidence: effectiveConf,
        bbox: [x1, y1, x2, y2],
        center: [v.x, v.y],
        lane: v.direction,
        speed: v.speed,
        isEmergency: v.isEmergency,
      });
    }

    const getDensity = (count: number): DensityTier => {
      if (count <= config.lowThreshold) return 'LOW';
      if (count <= config.mediumThreshold) return 'MEDIUM';
      return 'HIGH';
    };

    const calcAvgWait = (arr: number[]): number => {
      if (arr.length === 0) return 0;
      const sum = arr.reduce((a, b) => a + b, 0);
      return Math.round(sum / arr.length);
    };

    const laneStats: Record<LaneDirection, LaneStats> = {
      North: {
        lane: 'North',
        vehicles: laneCounts.North,
        density: getDensity(laneCounts.North),
        classes: laneClasses.North,
        waitingTimeAvgSec: calcAvgWait(waitTimes.North),
      },
      South: {
        lane: 'South',
        vehicles: laneCounts.South,
        density: getDensity(laneCounts.South),
        classes: laneClasses.South,
        waitingTimeAvgSec: calcAvgWait(waitTimes.South),
      },
      East: {
        lane: 'East',
        vehicles: laneCounts.East,
        density: getDensity(laneCounts.East),
        classes: laneClasses.East,
        waitingTimeAvgSec: calcAvgWait(waitTimes.East),
      },
      West: {
        lane: 'West',
        vehicles: laneCounts.West,
        density: getDensity(laneCounts.West),
        classes: laneClasses.West,
        waitingTimeAvgSec: calcAvgWait(waitTimes.West),
      },
    };

    const northSouthCount = laneCounts.North + laneCounts.South;
    const eastWestCount = laneCounts.East + laneCounts.West;

    // AI recommendation calculation
    let recommendedSignal: 'NORTH-SOUTH' | 'EAST-WEST';
    let decisionReason = '';

    if (this.emergencyActive && this.emergencyLane) {
      recommendedSignal =
        this.emergencyLane === 'North' || this.emergencyLane === 'South'
          ? 'NORTH-SOUTH'
          : 'EAST-WEST';
      decisionReason = `Emergency vehicle override detected on ${this.emergencyLane} arm. Immediate green priority allocated.`;
    } else if (northSouthCount >= eastWestCount) {
      recommendedSignal = 'NORTH-SOUTH';
      decisionReason = `North-South queue (${northSouthCount} veh) outweighs East-West (${eastWestCount} veh).`;
    } else {
      recommendedSignal = 'EAST-WEST';
      decisionReason = `East-West queue (${eastWestCount} veh) outweighs North-South (${northSouthCount} veh).`;
    }

    const lanes: LaneDirection[] = ['North', 'South', 'East', 'West'];
    let highestLane: LaneDirection = 'North';
    let highestCount = -1;
    for (const l of lanes) {
      if (laneCounts[l] > highestCount) {
        highestCount = laneCounts[l];
        highestLane = l;
      }
    }

    const highestDensity = getDensity(highestCount);

    let recommendedGreenTime = config.greenTimeLow;
    if (this.emergencyActive) {
      recommendedGreenTime = 30;
    } else if (highestDensity === 'MEDIUM') {
      recommendedGreenTime = config.greenTimeMedium;
    } else if (highestDensity === 'HIGH') {
      recommendedGreenTime = config.greenTimeHigh;
      if (highestCount > config.mediumThreshold) {
        recommendedGreenTime = Math.min(
          60,
          config.greenTimeHigh + Math.floor((highestCount - config.mediumThreshold) * 1.5)
        );
      }
    }

    // Traffic signal states for 4 visual signals
    const lampStates: Record<LaneDirection, LightColor> = {
      North: 'RED',
      South: 'RED',
      East: 'RED',
      West: 'RED',
    };

    if (this.isYellowTransition) {
      if (this.currentCorridor === 'NORTH-SOUTH') {
        lampStates.North = 'YELLOW';
        lampStates.South = 'YELLOW';
        lampStates.East = 'RED';
        lampStates.West = 'RED';
      } else {
        lampStates.East = 'YELLOW';
        lampStates.West = 'YELLOW';
        lampStates.North = 'RED';
        lampStates.South = 'RED';
      }
    } else {
      if (this.currentCorridor === 'NORTH-SOUTH') {
        lampStates.North = 'GREEN';
        lampStates.South = 'GREEN';
        lampStates.East = 'RED';
        lampStates.West = 'RED';
      } else {
        lampStates.East = 'GREEN';
        lampStates.West = 'GREEN';
        lampStates.North = 'RED';
        lampStates.South = 'RED';
      }
    }

    const decision: SignalDecision = {
      currentSignal: this.currentCorridor,
      recommendedSignal,
      recommendedGreenTime,
      highestLane,
      highestCount,
      highestDensity,
      northSouthCount,
      eastWestCount,
      lampStates,
      emergencyActive: this.emergencyActive,
      emergencyLane: this.emergencyLane,
      reason: decisionReason,
    };

    return { detections, laneStats, decision };
  }

  public getPhaseCountdown(): number {
    if (this.isYellowTransition) {
      return Math.max(0, Math.ceil(this.yellowCountdown));
    }
    return Math.max(0, Math.ceil(this.phaseCountdown));
  }

  public isYellow(): boolean {
    return this.isYellowTransition;
  }
}
