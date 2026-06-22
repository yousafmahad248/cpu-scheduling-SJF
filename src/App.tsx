/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Cpu, 
  ShieldAlert, 
  Layers, 
  Info, 
  Activity, 
  ChevronRight, 
  Server, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  Award
} from 'lucide-react';

import { ProcessInput, ComparisonResult, SavedSimulation, SimulationResult } from './types';
import { simulateSJFNonPreemptive, simulateSJFPreemptive } from './utils/scheduling';

import ProcessTable from './components/ProcessTable';
import GanttChart from './components/GanttChart';
import MetricsDashboard from './components/MetricsDashboard';
import ExecutionWalkthrough from './components/ExecutionWalkthrough';
import AlgorithmComparison from './components/AlgorithmComparison';
import PresetsAndHistory from './components/PresetsAndHistory';

// Classic set of processes to bootstrap the simulator with
const DEFAULT_PROCESSES: ProcessInput[] = [
  { id: '1', name: 'P1', arrivalTime: 0, burstTime: 8 },
  { id: '2', name: 'P2', arrivalTime: 1, burstTime: 4 },
  { id: '3', name: 'P3', arrivalTime: 2, burstTime: 9 },
  { id: '4', name: 'P4', arrivalTime: 3, burstTime: 5 }
];

export default function App() {
  const [processes, setProcesses] = useState<ProcessInput[]>(DEFAULT_PROCESSES);
  const [activeTab, setActiveTab] = useState<'non-preemptive' | 'preemptive' | 'comparison'>('non-preemptive');
  
  // Simulation results
  const [simResults, setSimResults] = useState<ComparisonResult | null>(null);
  
  // Highlighted Gantt block indices synced during event walkthrough playback
  const [highlightedBlockNonPreemptive, setHighlightedBlockNonPreemptive] = useState<number>(-1);
  const [highlightedBlockPreemptive, setHighlightedBlockPreemptive] = useState<number>(-1);

  // Backend state
  const [presets, setPresets] = useState<any[]>([]);
  const [history, setHistory] = useState<SavedSimulation[]>([]);
  const [serverOnline, setServerOnline] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 1. Check health & fetch presets/history from backend APIs on mount
  useEffect(() => {
    fetchServerStatus();
    fetchPresets();
    fetchHistory();
  }, []);

  // 2. Compute simulation whenever processes list changes
  useEffect(() => {
    handleSimulate();
  }, [processes]);

  const fetchServerStatus = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setServerOnline(true);
      }
    } catch (e) {
      setServerOnline(false);
      console.log('Backend server starting or offline. Falling back to client computations.');
    }
  };

  const fetchPresets = async () => {
    try {
      const res = await fetch('/api/presets');
      if (res.ok) {
        const data = await res.json();
        setPresets(data);
      }
    } catch (e) {
      // Fallback presets if server fails to load them
      setPresets([
        {
          id: 'preset-classic',
          name: 'Classic Academic Case',
          description: 'Standard textbook problem demonstrating preemptive vs non-preemptive turnaround differences.',
          processes: DEFAULT_PROCESSES
        }
      ]);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.log('Unable to load history. Client offline fallback mode.');
    }
  };

  // Run SJF schedules
  const handleSimulate = async () => {
    if (processes.length === 0) {
      setSimResults(null);
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // 1. Attempt server-side full stack computation & saving
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          processes,
          name: `Sim workload (${processes.length} jobs)`
        })
      });

      if (res.ok) {
        const data = await res.json();
        setSimResults(data.simulation);
        setServerOnline(true);
        fetchHistory(); // refresh history run logs
      } else {
        throw new Error('Server returned non-ok response');
      }
    } catch (err) {
      // 2. Graceful client-side computation fallback in case the node.js server has issues
      console.log('Running robust client-side scheduling backup compute...');
      const nonPreemptive = simulateSJFNonPreemptive(processes);
      const preemptive = simulateSJFPreemptive(processes);

      setSimResults({
        processes,
        nonPreemptive,
        preemptive
      });
    } finally {
      setLoading(false);
    }
  };

  // Add process
  const handleAddProcess = (newProc: ProcessInput) => {
    setProcesses((prev) => [...prev, newProc]);
  };

  // Remove process
  const handleRemoveProcess = (id: string) => {
    setProcesses((prev) => prev.filter((p) => p.id !== id));
  };

  // Clear processes
  const handleClearAll = () => {
    setProcesses([]);
  };

  // Load random selection of processes
  const handleGenerateRandom = () => {
    const defaultPool = [
      { id: 'p1', name: 'P1', arrivalTime: 0, burstTime: 6 },
      { id: 'p2', name: 'P2', arrivalTime: 1, burstTime: 3 },
      { id: 'p3', name: 'P3', arrivalTime: 2, burstTime: 8 },
      { id: 'p4', name: 'P4', arrivalTime: 4, burstTime: 2 },
      { id: 'p5', name: 'P5', arrivalTime: 5, burstTime: 4 }
    ];
    setProcesses(defaultPool);
  };

  // Preset selected
  const handleSelectPreset = (preset: any) => {
    setProcesses(preset.processes);
  };

  // History run selected
  const handleSelectHistory = (item: SavedSimulation) => {
    setProcesses(item.result.processes);
    setSimResults(item.result);
  };

  // Delete log item
  const handleDeleteHistory = async (id: string) => {
    try {
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchHistory();
      }
    } catch (e) {
      // client-side simulation log filter fallback
      setHistory(prev => prev.filter(item => item.id !== id));
    }
  };

  // Clear all history
  const handleClearHistory = async () => {
    try {
      const res = await fetch('/api/history/clear', { method: 'POST' });
      if (res.ok) {
        setHistory([]);
      }
    } catch (e) {
      setHistory([]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-700 flex flex-col font-sans select-none" id="app-root">
      
      {/* HEADER BAR */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50 px-4 py-4 sm:px-6 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo Title */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-xs">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-display font-black text-slate-900 tracking-tight">
                SJF CPU Scheduling Simulator
              </h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase font-bold">
                Shortest Job First • Academic Lab
              </p>
            </div>
          </div>

          {/* Backend Status indicator */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-mono font-bold tracking-wide ${
              serverOnline 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${serverOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              Node.js backend: {serverOnline ? 'Connected' : 'Offline / Client Run'}
            </div>
          </div>

        </div>
      </header>

      {/* WORKSPACE CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">

        {/* SECTION 1: Academic Tutorial & Definitions Header */}
        <section className="p-5 border border-slate-200 bg-white rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl shrink-0 mt-0.5">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-display">Academic Crash Course: SJF & SRTF</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Shortest Job First (SJF) selects the process with the smallest CPU burst time next. It is divided into **Non-Preemptive SJF** (processes cannot be interrupted once executed) and **Preemptive Shortest Remaining Time First (SRTF)** (if a new process arrives with a remaining service time smaller than the current running process, preemption occurs).
              </p>
            </div>
          </div>
          
          {/* Quick Academic Definitions Pill toggles */}
          <div className="flex flex-wrap gap-1.5 shrink-0">
            <span className="px-2.5 py-1 rounded-xl bg-slate-50 text-slate-500 text-[10px] font-mono font-bold border border-slate-200" title="Completion Time (CT): Time when execution completes.">CT</span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-50 text-slate-500 text-[10px] font-mono font-bold border border-slate-200" title="Turnaround Time (TAT): Completion Time - Arrival Time (CT - AT).">TAT</span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-50 text-slate-500 text-[10px] font-mono font-bold border border-slate-200" title="Waiting Time (WT): Turnaround Time - Burst Time (TAT - BT).">WT</span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-50 text-slate-500 text-[10px] font-mono font-bold border border-slate-200" title="First Come First Served (FCFS) tie-breaking rules.">FCFS Tie-Breaker</span>
          </div>
        </section>

        {/* SECTION 2: Process Builder Grid */}
        <section className="grid grid-cols-1 gap-6">
          <ProcessTable
            processes={processes}
            onAddProcess={handleAddProcess}
            onRemoveProcess={handleRemoveProcess}
            onClearAll={handleClearAll}
            onGenerateRandom={handleGenerateRandom}
          />
        </section>

        {/* SECTION 3: Simulation Output Area */}
        {simResults ? (
          <section className="space-y-6">
            
            {/* Tab Switches */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex border border-slate-200 bg-slate-100 p-1 rounded-2xl">
                <button
                  onClick={() => setActiveTab('non-preemptive')}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl font-display cursor-pointer transition-all ${
                    activeTab === 'non-preemptive' 
                      ? 'bg-indigo-600 text-white font-bold shadow-xs' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  id="tab-non-preemptive"
                >
                  Non-Preemptive SJF
                </button>
                <button
                  onClick={() => setActiveTab('preemptive')}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl font-display cursor-pointer transition-all ${
                    activeTab === 'preemptive' 
                      ? 'bg-indigo-600 text-white font-bold shadow-xs' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  id="tab-preemptive"
                >
                  Preemptive SJF (SRTF)
                </button>
                <button
                  onClick={() => setActiveTab('comparison')}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl font-display cursor-pointer transition-all ${
                    activeTab === 'comparison' 
                      ? 'bg-indigo-600 text-white font-bold shadow-xs' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  id="tab-comparison"
                >
                  Comparative Dashboard
                </button>
              </div>

              {loading && <div className="text-xs text-indigo-600 font-mono animate-pulse font-bold">Calculating...</div>}
            </div>

            {/* TAB VIEWPORTS */}
            <AnimatePresence mode="wait">
              {activeTab === 'non-preemptive' && (
                <motion.div
                  key="non-preemptive"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  {/* Performance Indicators */}
                  <MetricsDashboard 
                    result={simResults.nonPreemptive} 
                    compareResult={simResults.preemptive} 
                  />

                  {/* Gantt Chart representation */}
                  <GanttChart
                    timeline={simResults.nonPreemptive.gantt}
                    highlightBlockIdx={highlightedBlockNonPreemptive}
                    title="Non-Preemptive Shortest Job First Execution Timeline"
                  />

                  {/* Comprehensive Step walkthrough and logs */}
                  <ExecutionWalkthrough
                    events={simResults.nonPreemptive.events}
                    gantt={simResults.nonPreemptive.gantt}
                    onTickBlock={setHighlightedBlockNonPreemptive}
                  />

                  {/* Tab-specific table breakdown */}
                  <div className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm">
                    <h4 className="text-sm font-display font-bold uppercase tracking-wider text-slate-950 mb-4">
                      Execution Scheduling Statistics Table
                    </h4>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 font-mono font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                            <th className="py-3 px-4">Process ID</th>
                            <th className="py-3 px-4">Arrival Time</th>
                            <th className="py-3 px-4">Burst Time</th>
                            <th className="py-3 px-4 text-emerald-700">Completion (CT)</th>
                            <th className="py-3 px-4 text-indigo-700">Turnaround (TAT)</th>
                            <th className="py-3 px-4 text-rose-700">Waiting (WT)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {simResults.nonPreemptive.processes.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-4 font-semibold text-slate-900">{p.name}</td>
                              <td className="py-2.5 px-4 font-mono text-slate-600">{p.arrivalTime}ms</td>
                              <td className="py-2.5 px-4 font-mono text-slate-600">{p.burstTime}ms</td>
                              <td className="py-2.5 px-4 font-mono text-emerald-750 font-bold">{p.completionTime}ms</td>
                              <td className="py-2.5 px-4 font-mono text-indigo-750 font-bold">{p.turnaroundTime}ms</td>
                              <td className="py-2.5 px-4 font-mono text-rose-750 font-bold">{p.waitingTime}ms</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'preemptive' && (
                <motion.div
                  key="preemptive"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="space-y-6"
                >
                  {/* Performance Indicators */}
                  <MetricsDashboard 
                    result={simResults.preemptive} 
                    compareResult={simResults.nonPreemptive} 
                  />

                  {/* Gantt Chart representation */}
                  <GanttChart
                    timeline={simResults.preemptive.gantt}
                    highlightBlockIdx={highlightedBlockPreemptive}
                    title="Preemptive (Shortest Remaining Time First - SRTF) Execution Timeline"
                  />

                  {/* Comprehensive Step walkthrough and logs */}
                  <ExecutionWalkthrough
                    events={simResults.preemptive.events}
                    gantt={simResults.preemptive.gantt}
                    onTickBlock={setHighlightedBlockPreemptive}
                  />

                  {/* Tab-specific table breakdown */}
                  <div className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm">
                    <h4 className="text-sm font-display font-bold uppercase tracking-wider text-slate-950 mb-4">
                      Execution Scheduling Statistics Table
                    </h4>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 font-mono font-bold text-slate-400 uppercase tracking-widest text-[10px]">
                            <th className="py-3 px-4">Process ID</th>
                            <th className="py-3 px-4">Arrival Time</th>
                            <th className="py-3 px-4">Burst Time</th>
                            <th className="py-3 px-4 text-emerald-700">Completion (CT)</th>
                            <th className="py-3 px-4 text-indigo-700">Turnaround (TAT)</th>
                            <th className="py-3 px-4 text-rose-700">Waiting (WT)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {simResults.preemptive.processes.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-4 font-semibold text-slate-900">{p.name}</td>
                              <td className="py-2.5 px-4 font-mono text-slate-600">{p.arrivalTime}ms</td>
                              <td className="py-2.5 px-4 font-mono text-slate-600">{p.burstTime}ms</td>
                              <td className="py-2.5 px-4 font-mono text-emerald-750 font-bold">{p.completionTime}ms</td>
                              <td className="py-2.5 px-4 font-mono text-indigo-750 font-bold">{p.turnaroundTime}ms</td>
                              <td className="py-2.5 px-4 font-mono text-rose-750 font-bold">{p.waitingTime}ms</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'comparison' && (
                <motion.div
                  key="comparison"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                >
                  <AlgorithmComparison
                    nonPreemptive={simResults.nonPreemptive}
                    preemptive={simResults.preemptive}
                  />
                </motion.div>
              )}
            </AnimatePresence>

          </section>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border border-slate-200 bg-white shadow-xs rounded-2xl md:col-span-3 text-slate-400 text-center gap-2">
            <Cpu className="w-8 h-8 text-slate-300" />
            <span className="font-display font-medium text-slate-500">Simulator is Idle</span>
            <p className="text-xs text-slate-400 max-w-md px-4 leading-relaxed mt-0.5">
              Add at least one process to the ready queue or load a preset instruction task below to start calculating statistics.
            </p>
          </div>
        )}

        {/* SECTION 4: Presets & Past History Logs */}
        <section className="mt-8">
          <PresetsAndHistory
            presets={presets}
            history={history}
            onSelectPreset={handleSelectPreset}
            onSelectHistory={handleSelectHistory}
            onDeleteHistory={handleDeleteHistory}
            onClearHistory={handleClearHistory}
          />
        </section>

      </main>

      {/* FOOTER BAR */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-[10px] font-mono text-slate-450">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© 2026 Shortest Job First (SJF) CPU Scheduling Interactive Lab.</span>
          <span>Crafted with Node.js & React</span>
        </div>
      </footer>

    </div>
  );
}
