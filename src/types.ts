/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProcessInput {
  id: string;
  name: string;
  arrivalTime: number;
  burstTime: number;
}

export interface ScheduledProcessResult {
  id: string;
  name: string;
  arrivalTime: number;
  burstTime: number;
  completionTime: number;
  turnaroundTime: number;
  waitingTime: number;
}

export interface GanttBlock {
  processId: string; // "IDLE" or process ID
  processName: string;
  startTime: number;
  endTime: number;
  duration: number;
}

export interface SimulationEvent {
  time: number;
  type: 'arrival' | 'start' | 'preempt' | 'complete' | 'idle' | 'context_switch';
  message: string;
  processId?: string;
  processName?: string;
}

export interface SimulationResult {
  algorithm: 'SJF_NON_PREEMPTIVE' | 'SJF_PREEMPTIVE';
  processes: ScheduledProcessResult[];
  gantt: GanttBlock[];
  events: SimulationEvent[];
  averageWaitingTime: number;
  averageTurnaroundTime: number;
  cpuUtilization: number; // percentage
  throughput: number; // processes per unit time
}

export interface ComparisonResult {
  processes: ProcessInput[];
  nonPreemptive: SimulationResult;
  preemptive: SimulationResult;
}

export interface SavedSimulation {
  id: string;
  timestamp: string;
  name: string;
  result: ComparisonResult;
}
