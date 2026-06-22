/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { simulateSJFNonPreemptive, simulateSJFPreemptive } from './src/utils/scheduling';
import { ProcessInput, SavedSimulation } from './src/types';

// Simple in-memory database of simulation runs
let simulationHistory: SavedSimulation[] = [
  {
    id: 'history-1',
    name: 'Classic Multi-Job Workload',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    result: {
      processes: [
        { id: '1', name: 'P1', arrivalTime: 0, burstTime: 8 },
        { id: '2', name: 'P2', arrivalTime: 1, burstTime: 4 },
        { id: '3', name: 'P3', arrivalTime: 2, burstTime: 9 },
        { id: '4', name: 'P4', arrivalTime: 3, burstTime: 5 }
      ],
      nonPreemptive: simulateSJFNonPreemptive([
        { id: '1', name: 'P1', arrivalTime: 0, burstTime: 8 },
        { id: '2', name: 'P2', arrivalTime: 1, burstTime: 4 },
        { id: '3', name: 'P3', arrivalTime: 2, burstTime: 9 },
        { id: '4', name: 'P4', arrivalTime: 3, burstTime: 5 }
      ]),
      preemptive: simulateSJFPreemptive([
        { id: '1', name: 'P1', arrivalTime: 0, burstTime: 8 },
        { id: '2', name: 'P2', arrivalTime: 1, burstTime: 4 },
        { id: '3', name: 'P3', arrivalTime: 2, burstTime: 9 },
        { id: '4', name: 'P4', arrivalTime: 3, burstTime: 5 }
      ])
    }
  }
];

const PRESETS = [
  {
    id: 'preset-classic',
    name: 'Classic Academic Case',
    description: 'Standard textbook problem demonstrating preemptive vs non-preemptive turnaround differences.',
    processes: [
      { id: 'p1', name: 'P1', arrivalTime: 0, burstTime: 8 },
      { id: 'p2', name: 'P2', arrivalTime: 1, burstTime: 4 },
      { id: 'p3', name: 'P3', arrivalTime: 2, burstTime: 9 },
      { id: 'p4', name: 'P4', arrivalTime: 3, burstTime: 5 }
    ]
  },
  {
    id: 'preset-heavy-srtf',
    name: 'High Preemption workload',
    description: 'A set of processes where short processes arrive just in time to interrupt long-running processes.',
    processes: [
      { id: 'p1', name: 'P1', arrivalTime: 0, burstTime: 12 },
      { id: 'p2', name: 'P2', arrivalTime: 2, burstTime: 2 },
      { id: 'p3', name: 'P3', arrivalTime: 4, burstTime: 3 },
      { id: 'p4', name: 'P4', arrivalTime: 6, burstTime: 1 }
    ]
  },
  {
    id: 'preset-simultaneous',
    name: 'Simultaneous Arrivals',
    description: 'All processes arrive at Time 0. SJF non-preemptive and preemptive converge to the exact same schedules.',
    processes: [
      { id: 'p1', name: 'P1', arrivalTime: 0, burstTime: 6 },
      { id: 'p2', name: 'P2', arrivalTime: 0, burstTime: 2 },
      { id: 'p3', name: 'P3', arrivalTime: 0, burstTime: 8 },
      { id: 'p4', name: 'P4', arrivalTime: 0, burstTime: 4 }
    ]
  },
  {
    id: 'preset-tiebreaker',
    name: 'Tie-Breaker FCFS Demo',
    description: 'Processes have identical burst times but different arrival times to demonstrate FCFS tie-breaking.',
    processes: [
      { id: 'p1', name: 'P1', arrivalTime: 1, burstTime: 4 },
      { id: 'p2', name: 'P2', arrivalTime: 0, burstTime: 4 },
      { id: 'p3', name: 'P3', arrivalTime: 2, burstTime: 4 }
    ]
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing and cross-origin security configurations
  app.use(express.json());

  // 1. API: Simulate CPU Scheduling (POST /api/simulate)
  app.post('/api/simulate', (req, res) => {
    try {
      const { processes, name } = req.body;
      if (!processes || !Array.isArray(processes)) {
         res.status(400).json({ error: 'Processes array is required' });
         return;
      }

      // Convert inputs to standard formats
      const cleanProcesses: ProcessInput[] = processes.map((p: any) => ({
        id: String(p.id || Math.random().toString(36).substring(7)),
        name: String(p.name || `P_${p.id}`),
        arrivalTime: Math.max(0, parseInt(p.arrivalTime) || 0),
        burstTime: Math.max(1, parseInt(p.burstTime) || 1)
      }));

      const nonPreemptive = simulateSJFNonPreemptive(cleanProcesses);
      const preemptive = simulateSJFPreemptive(cleanProcesses);

      const response = {
        processes: cleanProcesses,
        nonPreemptive,
        preemptive
      };

      // Save to history automatically if a name is supplied, or randomly save up to 10
      const historyName = name || `Simulation at ${new Date().toLocaleTimeString()}`;
      const newHistoryItem: SavedSimulation = {
        id: `history-${Date.now()}`,
        name: historyName,
        timestamp: new Date().toISOString(),
        result: response
      };

      simulationHistory.unshift(newHistoryItem);
      // Bound history to last 15 items
      if (simulationHistory.length > 15) {
        simulationHistory.pop();
      }

      res.json({
        simulation: response,
        savedId: newHistoryItem.id
      });
    } catch (err: any) {
      console.error('Simulation error:', err);
      res.status(500).json({ error: err.message || 'Error occurred during simulation computation' });
    }
  });

  // 2. API: Get Historical Simulation Runs (GET /api/history)
  app.get('/api/history', (req, res) => {
    res.json(simulationHistory);
  });

  // 3. API: Delete individual item from history (DELETE /api/history/:id)
  app.delete('/api/history/:id', (req, res) => {
    const { id } = req.params;
    simulationHistory = simulationHistory.filter(item => item.id !== id);
    res.json({ success: true, remaining: simulationHistory.length });
  });

  // 4. API: Clear entire history (POST /api/history/clear)
  app.post('/api/history/clear', (req, res) => {
    simulationHistory = [];
    res.json({ success: true });
  });

  // 5. API: Retrieve Preset Workloads (GET /api/presets)
  app.get('/api/presets', (req, res) => {
    res.json(PRESETS);
  });

  // Live Server Status Indicator (GET /api/health)
  app.get('/api/health', (req, res) => {
    res.json({ status: 'online', service: 'SJF Scheduler Engine', time: new Date() });
  });

  // Vite middleware for dev mode and static files for prod mode
  if (process.env.NODE_ENV !== "production") {
    console.log("Configuring Vite Development Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log("Configuring Production Static Server...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OK] SJF Sim Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Critical server launch failure:", err);
});
