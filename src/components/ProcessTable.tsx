/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Trash2, Shuffle, Check, Sparkles, BookOpen } from 'lucide-react';
import { ProcessInput } from '../types';
import { getProcessColors } from './GanttChart';

interface ProcessTableProps {
  processes: ProcessInput[];
  onAddProcess: (process: ProcessInput) => void;
  onRemoveProcess: (id: string) => void;
  onClearAll: () => void;
  onGenerateRandom: () => void;
}

export default function ProcessTable({ processes, onAddProcess, onRemoveProcess, onClearAll, onGenerateRandom }: ProcessTableProps) {
  const [name, setName] = useState('');
  const [arrivalTime, setArrivalTime] = useState<number | ''>('');
  const [burstTime, setBurstTime] = useState<number | ''>('');
  const [validationError, setValidationError] = useState('');

  const nextProcessNumber = processes.length > 0 
    ? Math.max(...processes.map(p => {
        const matches = p.name.match(/\d+/);
        return matches ? parseInt(matches[0]) : 0;
      })) + 1
    : 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const targetName = name.trim() || `P${nextProcessNumber}`;
    const targetArrival = arrivalTime === '' ? 0 : Number(arrivalTime);
    const targetBurst = burstTime === '' ? 5 : Number(burstTime);

    if (targetArrival < 0) {
      setValidationError('Arrival Time must be greater than or equal to 0.');
      return;
    }
    if (targetBurst <= 0) {
      setValidationError('Burst Time must be greater than 0.');
      return;
    }

    if (processes.find(p => p.name.toUpperCase() === targetName.toUpperCase())) {
      setValidationError(`Process with name "${targetName}" already exists.`);
      return;
    }

    if (processes.length >= 10) {
      setValidationError('A maximum of 10 processes is allowed to keep the simulation clean.');
      return;
    }

    onAddProcess({
      id: `p-${Date.now()}`,
      name: targetName,
      arrivalTime: targetArrival,
      burstTime: targetBurst
    });

    // Reset inputs
    setName('');
    setArrivalTime('');
    setBurstTime('');
  };

  return (
    <div className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm flex flex-col gap-5" id="process-table-editor">
      
      {/* Title blocks */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-display font-bold uppercase tracking-wider text-slate-950">Process Ready Queue</h4>
          <p className="text-xs text-slate-500 mt-1">Configure Arrival Times and CPU Burst times</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onGenerateRandom}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-indigo-700 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100/80 rounded-xl transition-all font-medium cursor-pointer"
            title="Generate random processes"
            id="btn-random-generate"
          >
            <Shuffle className="w-3.5 h-3.5" />
            Randomize
          </button>
          
          {processes.length > 0 && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-700 border border-rose-200 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all font-medium cursor-pointer"
              id="btn-clear-all"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
        
        {/* Left column: Add Process Form */}
        <form onSubmit={handleSubmit} className="md:col-span-2 flex flex-col gap-4 p-5 rounded-xl border border-slate-200 bg-slate-50">
          <h5 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Append Process
          </h5>

          <div>
            <label className="block text-[11px] font-mono font-bold text-slate-500 mb-1">Process Identifier (Optional)</label>
            <input
              type="text"
              placeholder={`e.g. P${nextProcessNumber}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              maxLength={6}
              id="input-proc-name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono font-bold text-slate-500 mb-1">Arrival Time (ms)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={arrivalTime}
                onChange={(e) => setArrivalTime(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                id="input-proc-arrival"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono font-bold text-slate-500 mb-1">Burst Time (ms)</label>
              <input
                type="number"
                min="1"
                placeholder="5"
                value={burstTime}
                onChange={(e) => setBurstTime(e.target.value === '' ? '' : parseInt(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                id="input-proc-burst"
              />
            </div>
          </div>

          {validationError && (
            <p className="text-rose-700 text-[11px] font-medium leading-normal bg-rose-50 border border-rose-100 p-2.5 rounded-xl">
              {validationError}
            </p>
          )}

          <button
            type="submit"
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs tracking-wider transition-all shadow-sm cursor-pointer"
            id="btn-add-process"
          >
            <Plus className="w-4 h-4" /> Add Process
          </button>
        </form>

        {/* Right column: Dynamic queue list */}
        <div className="md:col-span-3 overflow-hidden rounded-xl border border-slate-200 bg-white flex flex-col justify-between min-h-[220px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="proc-queue-table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                  <th className="py-3 px-4">Process</th>
                  <th className="py-3 px-4">Arrival Time</th>
                  <th className="py-3 px-4">Burst (CPU Cost)</th>
                  <th className="py-3 px-4 w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {processes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400 font-sans">
                      <div className="flex flex-col items-center gap-2">
                        <BookOpen className="w-5 h-5 text-slate-300" />
                        <p className="font-medium">No active processes in ready queue</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Add a process or hit 'Randomize' to load presets</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  processes.map((proc) => {
                    const { bg, text } = getProcessColors(proc.name);
                    return (
                      <tr key={proc.id} className="hover:bg-slate-50/80 group transition-colors">
                        <td className="py-2.5 px-4 flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${bg}`}>
                            {proc.name}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-600">{proc.arrivalTime} ms</td>
                        <td className="py-2.5 px-4 font-mono text-slate-900 font-semibold">{proc.burstTime} ms</td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={() => onRemoveProcess(proc.id)}
                            className="p-1 px-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                            title={`Delete ${proc.name}`}
                            id={`delete-proc-${proc.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {processes.length > 0 && (
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-[10px] font-mono text-slate-500 font-medium flex items-center justify-between">
              <span>Total Workload items: <strong className="text-indigo-600">{processes.length}</strong></span>
              <span>Total Burst Requirement: <strong className="text-slate-700">{processes.reduce((sum, p) => sum + p.burstTime, 0)}ms</strong></span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
