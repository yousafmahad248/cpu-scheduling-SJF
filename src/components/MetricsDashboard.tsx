/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Clock, Cpu, Zap, Activity } from 'lucide-react';
import { SimulationResult } from '../types';

interface MetricsDashboardProps {
  result: SimulationResult;
  compareResult?: SimulationResult; // Optional other result to show comparison offsets!
}

export default function MetricsDashboard({ result, compareResult }: MetricsDashboardProps) {
  const { averageWaitingTime, averageTurnaroundTime, cpuUtilization, throughput } = result;

  // Compute comparisons if available
  const getComparisonText = (current: number, compare: number, isLowerBetter = true) => {
    if (!compare) return null;
    const diff = current - compare;
    if (diff === 0) return <span className="text-slate-400 text-xs">Equal performance</span>;
    
    const percentage = Math.abs((diff / compare) * 100).toFixed(1);
    const isBetter = isLowerBetter ? diff < 0 : diff > 0;

    return (
      <div className={`flex flex-col items-end gap-0.5 text-xs font-semibold ${isBetter ? 'text-emerald-600' : 'text-rose-600'}`}>
        <span>{isBetter ? '↓ Better by' : '↑ Slower by'} {percentage}%</span>
        <span className="text-[9px] text-slate-400 font-normal">vs other mode</span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="metrics-dashboard">
      
      {/* CARD 1: Average Waiting Time */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm relative overflow-hidden group"
        id="metric-awt"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
            <Clock className="w-5 h-5" />
          </div>
          {compareResult && getComparisonText(averageWaitingTime, compareResult.averageWaitingTime, true)}
        </div>
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold block mb-1">Avg Waiting Time</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-display font-bold text-slate-900">{averageWaitingTime}</span>
          <span className="text-sm font-mono text-slate-400">ms</span>
        </div>
        <div className="mt-4 text-xs text-slate-500 leading-relaxed">
          Average duration a process spends in the ready queue.
        </div>
      </motion.div>

      {/* CARD 2: Average Turnaround Time */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm relative overflow-hidden group"
        id="metric-atat"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
            <Activity className="w-5 h-5" />
          </div>
          {compareResult && getComparisonText(averageTurnaroundTime, compareResult.averageTurnaroundTime, true)}
        </div>
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold block mb-1">Avg Turnaround Time</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-display font-bold text-slate-900">{averageTurnaroundTime}</span>
          <span className="text-sm font-mono text-slate-400">ms</span>
        </div>
        <div className="mt-4 text-xs text-slate-500 leading-relaxed">
          How long from job submission to execution completion.
        </div>
      </motion.div>

      {/* CARD 3: CPU Utilization */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm relative overflow-hidden group"
        id="metric-utilization"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Cpu className="w-5 h-5" />
          </div>
          {compareResult && getComparisonText(cpuUtilization, compareResult.cpuUtilization, false)}
        </div>
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold block mb-1">CPU Utilization</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-display font-bold text-slate-900">{cpuUtilization}</span>
          <span className="text-sm font-mono text-slate-400">%</span>
        </div>
        {/* Simple Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4 overflow-hidden">
          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${cpuUtilization}%` }}></div>
        </div>
        <div className="mt-1.5 text-[10px] text-slate-400 text-right font-mono">
          Idle duration: {(100 - cpuUtilization).toFixed(1)}%
        </div>
      </motion.div>

      {/* CARD 4: Throughput */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm relative overflow-hidden group"
        id="metric-throughput"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <Zap className="w-5 h-5" />
          </div>
          {compareResult && getComparisonText(throughput, compareResult.throughput, false)}
        </div>
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold block mb-1">System Throughput</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-display font-bold text-slate-900">{throughput}</span>
          <span className="text-sm font-mono text-slate-400">jobs/ms</span>
        </div>
        <div className="mt-4 text-xs text-slate-500 leading-relaxed">
          Number of process executions completed per millisecond unit.
        </div>
      </motion.div>

    </div>
  );
}
