/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, ShieldCheck, HelpCircle, ArrowRightLeft } from 'lucide-react';
import { SimulationResult } from '../types';

interface AlgorithmComparisonProps {
  nonPreemptive: SimulationResult;
  preemptive: SimulationResult;
}

export default function AlgorithmComparison({ nonPreemptive, preemptive }: AlgorithmComparisonProps) {
  const awtDiff = nonPreemptive.averageWaitingTime - preemptive.averageWaitingTime;
  const atatDiff = nonPreemptive.averageTurnaroundTime - preemptive.averageTurnaroundTime;

  // Find which is more optimal
  const optimalAwt = nonPreemptive.averageWaitingTime <= preemptive.averageWaitingTime 
    ? { name: 'Non-Preemptive SJF', value: nonPreemptive.averageWaitingTime, saving: Math.abs(awtDiff) }
    : { name: 'Preemptive SJF (SRTF)', value: preemptive.averageWaitingTime, saving: Math.abs(awtDiff) };

  const maxVal = Math.max(
    nonPreemptive.averageWaitingTime,
    preemptive.averageWaitingTime,
    nonPreemptive.averageTurnaroundTime,
    preemptive.averageTurnaroundTime,
    5 // safe division guard
  );

  return (
    <div className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-6" id="algorithm-comparison">
      <div>
        <h4 className="text-sm font-display font-bold uppercase tracking-wider text-slate-950 flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
          Comparative Analysis: Non-Preemptive vs Preemptive
        </h4>
        <p className="text-xs text-slate-500 mt-1">Comparing scheduling efficiency and metric performance side-by-side</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Comparison Bars */}
        <div className="lg:col-span-7 space-y-5 p-5 rounded-xl border border-slate-200 bg-slate-50">
          <h5 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-200 pb-2 mb-3">
            Metric Efficiency Bars (Shorter is Better)
          </h5>

          {/* Average Waiting Time graph */}
          <div className="space-y-2.5">
            <span className="text-xs font-sans text-slate-700 font-semibold">Average Waiting Time (AWT)</span>
            
            {/* NonPreemptive */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono font-bold text-slate-500 w-24 truncate">Non-Preemptive</span>
              <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden h-5 flex items-center">
                <div 
                  className="bg-indigo-600 hover:bg-indigo-700 transition-all h-full rounded-r-sm flex items-center pl-2"
                  style={{ width: `${Math.max(5, (nonPreemptive.averageWaitingTime / maxVal) * 100)}%` }}
                >
                  <span className="font-mono text-[9px] text-white font-bold">
                    {nonPreemptive.averageWaitingTime}ms
                  </span>
                </div>
              </div>
            </div>

            {/* Preemptive */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono font-bold text-slate-500 w-24 truncate">SRTF Preemptive</span>
              <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden h-5 flex items-center">
                <div 
                  className="bg-emerald-600 hover:bg-emerald-700 transition-all h-full rounded-r-sm flex items-center pl-2"
                  style={{ width: `${Math.max(5, (preemptive.averageWaitingTime / maxVal) * 100)}%` }}
                >
                  <span className="font-mono text-[9px] text-white font-bold">
                    {preemptive.averageWaitingTime}ms
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Average Turnaround Time graph */}
          <div className="space-y-2.5 pt-4 border-t border-slate-200">
            <span className="text-xs font-sans text-slate-700 font-semibold">Average Turnaround Time (ATAT)</span>
            
            {/* NonPreemptive */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono font-bold text-slate-500 w-24 truncate">Non-Preemptive</span>
              <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden h-5 flex items-center">
                <div 
                  className="bg-indigo-600 hover:bg-indigo-700 transition-all h-full rounded-r-sm flex items-center pl-2"
                  style={{ width: `${Math.max(5, (nonPreemptive.averageTurnaroundTime / maxVal) * 100)}%` }}
                >
                  <span className="font-mono text-[9px] text-white font-bold">
                    {nonPreemptive.averageTurnaroundTime}ms
                  </span>
                </div>
              </div>
            </div>

            {/* Preemptive */}
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono font-bold text-slate-500 w-24 truncate">SRTF Preemptive</span>
              <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden h-5 flex items-center">
                <div 
                  className="bg-emerald-600 hover:bg-emerald-700 transition-all h-full rounded-r-sm flex items-center pl-2"
                  style={{ width: `${Math.max(5, (preemptive.averageTurnaroundTime / maxVal) * 100)}%` }}
                >
                  <span className="font-mono text-[9px] text-white font-bold">
                    {preemptive.averageTurnaroundTime}ms
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Optimality Verdict */}
        <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-xl border border-slate-200 bg-slate-50">
          <div>
            <h5 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block border-b border-slate-200 pb-2 mb-3">
              Efficiency Verdict
            </h5>

            {awtDiff === 0 ? (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-950">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <span className="font-bold block text-indigo-900 mb-0.5">Absolute Congruence</span>
                  Both models resulted in equal average waiting times. This frequently happens if arrival times are identical in sequence, or no context-switches were triggered.
                </div>
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 text-slate-700">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold block text-emerald-900 mb-0.5">
                      {optimalAwt.name} wins
                    </span>
                    By minimizing process waiting overheads, this mode saved <strong className="text-emerald-700 font-bold">{optimalAwt.saving.toFixed(2)}ms</strong> average waiting duration per process.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-white border border-slate-200 text-slate-500">
                  <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="text-[10px] leading-relaxed">
                    <strong className="text-slate-700 block mb-0.5">Why the difference?</strong> Preemptive SJF (SRTF) is mathematically proven to be the **most optimal** scheduling algorithm in terms of minimizing *Average Waiting Time*. However, in real operating systems, it incurs high context-switching CPU costs which can degrade actual throughput.
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-200 grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 font-mono block font-bold uppercase tracking-wider">AWT SAVING</span>
              <span className="text-sm font-semibold font-mono text-emerald-600">
                {Math.abs(awtDiff).toFixed(1)} ms
              </span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl">
              <span className="text-[10px] text-slate-400 font-mono block font-bold uppercase tracking-wider">ATAT SAVING</span>
              <span className="text-sm font-semibold font-mono text-emerald-600">
                {Math.abs(atatDiff).toFixed(1)} ms
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
