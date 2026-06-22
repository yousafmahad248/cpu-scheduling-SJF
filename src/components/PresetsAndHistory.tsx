/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layers, History, Trash2, ArrowRight } from 'lucide-react';
import { SavedSimulation } from '../types';

interface PresetItem {
  id: string;
  name: string;
  description: string;
  processes: { id: string; name: string; arrivalTime: number; burstTime: number }[];
}

interface PresetsAndHistoryProps {
  presets: PresetItem[];
  history: SavedSimulation[];
  onSelectPreset: (preset: PresetItem) => void;
  onSelectHistory: (item: SavedSimulation) => void;
  onDeleteHistory: (id: string) => void;
  onClearHistory: () => void;
}

export default function PresetsAndHistory({
  presets,
  history,
  onSelectPreset,
  onSelectHistory,
  onDeleteHistory,
  onClearHistory
}: PresetsAndHistoryProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" id="presets-and-history">
      
      {/* COLUMN 1: Academic Workload Presets */}
      <div className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm flex flex-col h-[340px]">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-3 h-10">
          <Layers className="w-4 h-4 text-indigo-600" />
          <h4 className="text-sm font-display font-bold uppercase tracking-wider text-slate-950">Lessons & Workloads</h4>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 scrollbar pr-1" id="presets-scroller">
          {presets.map((preset) => (
            <div
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-indigo-200 cursor-pointer transition-all duration-200 group flex justify-between items-start"
              id={`preset-card-${preset.id}`}
            >
              <div className="flex-1">
                <span className="text-xs font-sans font-bold text-slate-900 block group-hover:text-indigo-600 transition-colors">
                  {preset.name}
                </span>
                <p className="text-[10px] text-slate-500 leading-normal mt-1 line-clamp-2">
                  {preset.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {preset.processes.map((p, idx) => (
                    <span key={idx} className="font-mono text-[9px] bg-indigo-50 px-1.5 py-0.5 rounded text-indigo-800 border border-indigo-100/50 shrink-0">
                      {p.name}:{p.burstTime}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-1 px-1.5 rounded-lg text-slate-400 group-hover:text-indigo-600 hover:bg-indigo-50 self-center">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* COLUMN 2: Simulation History Logs */}
      <div className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm flex flex-col h-[340px]">
        <div className="flex items-center justify-between gap-2 mb-3 border-b border-slate-100 pb-3 h-10">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-display font-bold uppercase tracking-wider text-slate-950">Simulation History</h4>
          </div>
          
          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-[10px] font-mono font-bold text-slate-400 hover:text-rose-600 bg-transparent py-0.5 px-2 rounded hover:bg-slate-50 transition-all cursor-pointer"
              id="btn-clear-history"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 scrollbar pr-1" id="history-scroller">
          {history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
              <History className="w-6 h-6 text-slate-300" />
              <p className="text-xs font-sans font-medium">No saved simulations yet.</p>
              <p className="text-[10px] text-slate-400 text-center max-w-[240px]">Add processes above and compute to store details automatically.</p>
            </div>
          ) : (
            history.map((record) => {
              const dateString = new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              return (
                <div
                  key={record.id}
                  className="p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-indigo-200 cursor-pointer group flex justify-between items-center transition-all"
                  onClick={() => onSelectHistory(record)}
                  id={`history-card-${record.id}`}
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <span className="text-xs font-sans font-bold text-slate-800 block truncate group-hover:text-indigo-600 transition-colors">
                      {record.name}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 mt-1 block">
                      Saved at {dateString} • {record.result.processes.length} Processes
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteHistory(record.id);
                      }}
                      className="p-1 px-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                      title="Delete log"
                      id={`delete-history-${record.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="p-1 px-1.5 rounded-lg text-slate-400 group-hover:text-indigo-600 hover:bg-indigo-50">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
