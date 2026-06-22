/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProcessInput, ScheduledProcessResult, GanttBlock, SimulationEvent, SimulationResult } from '../types';

/**
 * Simulates Shortest Job First - Non-Preemptive.
 */
export function simulateSJFNonPreemptive(processes: ProcessInput[]): SimulationResult {
  const sortedProcesses = [...processes].map(p => ({ ...p }));
  const completed: ScheduledProcessResult[] = [];
  const gantt: GanttBlock[] = [];
  const events: SimulationEvent[] = [];
  
  if (processes.length === 0) {
    return createEmptyResult('SJF_NON_PREEMPTIVE');
  }

  // Arrival events
  sortedProcesses.forEach(p => {
    events.push({
      time: p.arrivalTime,
      type: 'arrival',
      message: `Process ${p.name} arrived (Burst Time = ${p.burstTime})`,
      processId: p.id,
      processName: p.name
    });
  });

  let currentTime = 0;
  const remainingSet = new Set(sortedProcesses.map(p => p.id));
  const processMap = new Map(sortedProcesses.map(p => [p.id, p]));

  while (remainingSet.size > 0) {
    // Filter processes that have arrived and are not completed
    const available = sortedProcesses.filter(p => remainingSet.has(p.id) && p.arrivalTime <= currentTime);

    if (available.length === 0) {
      // CPU is idle. Find the next process to arrive
      const nextProcesses = sortedProcesses.filter(p => remainingSet.has(p.id));
      const nextArrival = Math.min(...nextProcesses.map(p => p.arrivalTime));
      
      events.push({
        time: currentTime,
        type: 'idle',
        message: `CPU is idle waiting for processes...`
      });

      gantt.push({
        processId: 'IDLE',
        processName: 'Idle',
        startTime: currentTime,
        endTime: nextArrival,
        duration: nextArrival - currentTime
      });

      currentTime = nextArrival;
      continue;
    }

    // Select the process with the shortest burst time
    // Tie breaker: 1. Arrival Time, 2. Process Name/ID (Lexicographical)
    available.sort((a, b) => {
      if (a.burstTime !== b.burstTime) {
        return a.burstTime - b.burstTime;
      }
      if (a.arrivalTime !== b.arrivalTime) {
        return a.arrivalTime - b.arrivalTime;
      }
      return a.name.localeCompare(b.name);
    });

    const active = available[0];
    const startTime = currentTime;
    const endTime = startTime + active.burstTime;

    events.push({
      time: startTime,
      type: 'start',
      message: `CPU starts executing ${active.name} for ${active.burstTime} units`,
      processId: active.id,
      processName: active.name
    });

    gantt.push({
      processId: active.id,
      processName: active.name,
      startTime: startTime,
      endTime: endTime,
      duration: active.burstTime
    });

    currentTime = endTime;

    const turnAroundTime = currentTime - active.arrivalTime;
    const waitingTime = turnAroundTime - active.burstTime;

    completed.push({
      id: active.id,
      name: active.name,
      arrivalTime: active.arrivalTime,
      burstTime: active.burstTime,
      completionTime: currentTime,
      turnaroundTime: turnAroundTime,
      waitingTime: waitingTime
    });

    events.push({
      time: currentTime,
      type: 'complete',
      message: `Process ${active.name} finished. Turnaround Time = ${turnAroundTime}, Waiting Time = ${waitingTime}`,
      processId: active.id,
      processName: active.name
    });

    remainingSet.delete(active.id);
  }

  // Sort completed processes by process name/id for presentation
  completed.sort((a, b) => a.name.localeCompare(b.name));

  // Sort events chronologically. For equal times, show arrivals before starts, and completes before arrivals/starts.
  events.sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    const order = { complete: 1, arrival: 2, idle: 3, context_switch: 4, start: 5, preempt: 6 };
    return order[a.type] - order[b.type];
  });

  const stats = calculateStats(completed, gantt);

  return {
    algorithm: 'SJF_NON_PREEMPTIVE',
    processes: completed,
    gantt,
    events,
    ...stats
  };
}

/**
 * Simulates Shortest Job First - Preemptive (Shortest Remaining Time First / SRTF).
 */
export function simulateSJFPreemptive(processes: ProcessInput[]): SimulationResult {
  if (processes.length === 0) {
    return createEmptyResult('SJF_PREEMPTIVE');
  }

  const sortedProcesses = processes.map(p => ({
    ...p,
    remainingTime: p.burstTime
  }));

  const completed: ScheduledProcessResult[] = [];
  const rawGantt: { processId: string; processName: string; time: number }[] = [];
  const events: SimulationEvent[] = [];

  // Log initial arrival events
  sortedProcesses.forEach(p => {
    events.push({
      time: p.arrivalTime,
      type: 'arrival',
      message: `Process ${p.name} arrived (Burst Time = ${p.burstTime})`,
      processId: p.id,
      processName: p.name
    });
  });

  const totalProcesses = processes.length;
  let currentTime = 0;
  let activeProcessId: string | null = null;
  const completionMap = new Map<string, number>();

  while (completionMap.size < totalProcesses) {
    // Get processes that have arrived and have remaining time > 0
    const available = sortedProcesses.filter(p => p.arrivalTime <= currentTime && p.remainingTime > 0);

    if (available.length === 0) {
      // Find the next arrival
      const unarrived = sortedProcesses.filter(p => p.arrivalTime > currentTime);
      if (unarrived.length > 0) {
        const nextArrival = Math.min(...unarrived.map(p => p.arrivalTime));
        for (let t = currentTime; t < nextArrival; t++) {
          rawGantt.push({ processId: 'IDLE', processName: 'Idle', time: t });
        }
        if (activeProcessId !== null) {
          activeProcessId = null;
        }
        currentTime = nextArrival;
      } else {
        // Break to avoid infinite loop
        break;
      }
      continue;
    }

    // Select process with shortest remaining time
    // Tie breaker: 1. Arrival time, 2. Lexicographical ID/name
    available.sort((a, b) => {
      if (a.remainingTime !== b.remainingTime) {
        return a.remainingTime - b.remainingTime;
      }
      if (a.arrivalTime !== b.arrivalTime) {
        return a.arrivalTime - b.arrivalTime;
      }
      return a.name.localeCompare(b.name);
    });

    const selected = available[0];

    // If context switch happened
    if (activeProcessId !== selected.id) {
      if (activeProcessId !== null) {
        const currentActive = sortedProcesses.find(p => p.id === activeProcessId);
        if (currentActive && currentActive.remainingTime > 0) {
          events.push({
            time: currentTime,
            type: 'preempt',
            message: `Process ${currentActive.name} preempted by ${selected.name} (Remaining Time for ${currentActive.name} = ${currentActive.remainingTime})`,
            processId: currentActive.id,
            processName: currentActive.name
          });
        }
      }
      
      events.push({
        time: currentTime,
        type: 'start',
        message: `CPU starts/resumes executing ${selected.name} (Remaining Time = ${selected.remainingTime})`,
        processId: selected.id,
        processName: selected.name
      });
      activeProcessId = selected.id;
    }

    // Record raw Gantt unit
    rawGantt.push({
      processId: selected.id,
      processName: selected.name,
      time: currentTime
    });

    // Execute for 1 unit of time
    selected.remainingTime -= 1;
    currentTime += 1;

    // Check if finished
    if (selected.remainingTime === 0) {
      completionMap.set(selected.id, currentTime);
      
      const turnAroundTime = currentTime - selected.arrivalTime;
      const waitingTime = turnAroundTime - selected.burstTime;
      
      completed.push({
        id: selected.id,
        name: selected.name,
        arrivalTime: selected.arrivalTime,
        burstTime: selected.burstTime,
        completionTime: currentTime,
        turnaroundTime: turnAroundTime,
        waitingTime: waitingTime
      });

      events.push({
        time: currentTime,
        type: 'complete',
        message: `Process ${selected.name} completed! Turnaround Time = ${turnAroundTime}, Waiting Time = ${waitingTime}`,
        processId: selected.id,
        processName: selected.name
      });

      activeProcessId = null;
    }
  }

  // Compress raw Gantt (1s steps) into compact blocks
  const gantt: GanttBlock[] = [];
  if (rawGantt.length > 0) {
    let currentBlock = {
      processId: rawGantt[0].processId,
      processName: rawGantt[0].processName,
      startTime: rawGantt[0].time,
      endTime: rawGantt[0].time + 1,
      duration: 1
    };

    for (let i = 1; i < rawGantt.length; i++) {
       const step = rawGantt[i];
       if (step.processId === currentBlock.processId && step.time === currentBlock.endTime) {
         currentBlock.endTime += 1;
         currentBlock.duration += 1;
       } else {
         gantt.push({ ...currentBlock });
         currentBlock = {
           processId: step.processId,
           processName: step.processName,
           startTime: step.time,
           endTime: step.time + 1,
           duration: 1
         };
       }
    }
    gantt.push(currentBlock);
  }

  // Sort processes alphabetically by name for result view
  completed.sort((a, b) => a.name.localeCompare(b.name));

  // Sort events chronologically
  events.sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    const order = { complete: 1, arrival: 2, idle: 3, context_switch: 4, start: 5, preempt: 6 };
    return order[a.type] - order[b.type];
  });

  const stats = calculateStats(completed, gantt);

  return {
    algorithm: 'SJF_PREEMPTIVE',
    processes: completed,
    gantt,
    events,
    ...stats
  };
}

/**
 * Calculators for standard CPU Scheduling Performance metrics
 */
function calculateStats(completed: ScheduledProcessResult[], gantt: GanttBlock[]) {
  if (completed.length === 0) {
    return { averageWaitingTime: 0, averageTurnaroundTime: 0, cpuUtilization: 0, throughput: 0 };
  }

  const numProcesses = completed.length;
  const totalWaitingTime = completed.reduce((sum, p) => sum + p.waitingTime, 0);
  const totalTurnaroundTime = completed.reduce((sum, p) => sum + p.turnaroundTime, 0);

  const averageWaitingTime = totalWaitingTime / numProcesses;
  const averageTurnaroundTime = totalTurnaroundTime / numProcesses;

  const totalTime = gantt.length > 0 ? gantt[gantt.length - 1].endTime : 0;
  const idleTime = gantt
    .filter(g => g.processId === 'IDLE')
    .reduce((sum, g) => sum + g.duration, 0);

  const cpuUtilization = totalTime > 0 ? ((totalTime - idleTime) / totalTime) * 100 : 0;
  const throughput = totalTime > 0 ? numProcesses / totalTime : 0;

  return {
    averageWaitingTime: parseFloat(averageWaitingTime.toFixed(2)),
    averageTurnaroundTime: parseFloat(averageTurnaroundTime.toFixed(2)),
    cpuUtilization: parseFloat(cpuUtilization.toFixed(2)),
    throughput: parseFloat(throughput.toFixed(3))
  };
}

function createEmptyResult(algorithm: 'SJF_NON_PREEMPTIVE' | 'SJF_PREEMPTIVE'): SimulationResult {
  return {
    algorithm,
    processes: [],
    gantt: [],
    events: [],
    averageWaitingTime: 0,
    averageTurnaroundTime: 0,
    cpuUtilization: 0,
    throughput: 0
  };
}
