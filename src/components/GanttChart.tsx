/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GanttBlock } from '../types';

export const PROCESS_COLOR_PALETTE = [
  { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', text: 'text-emerald-700', hex: '#10b981', borderHex: '#a7f3d0' },
  { bg: 'bg-blue-100 text-blue-800 border-blue-200', text: 'text-blue-700', hex: '#3b82f6', borderHex: '#bfdbfe' },
  { bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', text: 'text-indigo-700', hex: '#6366f1', borderHex: '#c7d2fe' },
  { bg: 'bg-rose-100 text-rose-800 border-rose-200', text: 'text-rose-700', hex: '#f43f5e', borderHex: '#fecdd3' },
  { bg: 'bg-amber-100 text-amber-800 border-amber-200', text: 'text-amber-700', hex: '#f59e0b', borderHex: '#fde68a' },
  { bg: 'bg-violet-100 text-violet-800 border-violet-200', text: 'text-violet-700', hex: '#8b5cf6', borderHex: '#ddd6fe' },
  { bg: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200', text: 'text-fuchsia-700', hex: '#d946ef', borderHex: '#fbcfe8' },
];

export function getProcessColors(processName: string, isIdle: boolean = false) {
  if (isIdle || processName.toUpperCase() === 'IDLE') {
    return {
      bg: 'bg-slate-100 text-slate-500 border-slate-200 border-dashed',
      text: 'text-slate-500',
      hex: '#64748b',
      borderHex: '#e2e8f0'
    };
  }
  let hash = 0;
  for (let i = 0; i < processName.length; i++) {
    hash = processName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PROCESS_COLOR_PALETTE.length;
  return PROCESS_COLOR_PALETTE[index];
}

interface GanttChartProps {
  timeline: GanttBlock[];
  highlightBlockIdx?: number; // optionally highlight block during step-by-step playback
  title: string;
}

export default function GanttChart({ timeline, highlightBlockIdx = -1, title }: GanttChartProps) {
  if (timeline.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-slate-400 border border-slate-200 rounded-2xl bg-white shadow-sm" id="gantt-empty">
        <p className="text-sm font-sans font-medium">No execution data available. Please run simulation.</p>
      </div>
    );
  }

  const totalDuration = timeline[timeline.length - 1].endTime;

  return (
    <div className="p-6 border border-slate-200 rounded-2xl bg-white shadow-sm" id={`gantt-container-${title.replace(/\s+/g, '-').toLowerCase()}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h4 className="text-sm font-display font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 inline-block"></span>
          {title}
        </h4>
        <div className="flex items-center gap-4 text-xs font-mono text-slate-500">
          <span>Total Cycle: <strong className="text-indigo-600">{totalDuration}ms</strong></span>
          <span className="text-slate-200">|</span>
          <span>Blocks Count: <strong className="text-slate-700">{timeline.length}</strong></span>
        </div>
      </div>

      {/* Responsive Horizontal Scroll Stage for Gantt Chart */}
      <div className="overflow-x-auto pb-4 pt-1 mb-4 scrollbar" id="gantt-scroller">
        <div 
          className="relative min-w-[700px] h-32 flex rounded-xl border border-slate-200 bg-slate-50 overflow-hidden"
          style={{ width: '100%' }}
        >
          {timeline.map((block, idx) => {
            const widthPercentage = (block.duration / totalDuration) * 100;
            const { bg, text, hex, borderHex } = getProcessColors(block.processName, block.processId === 'IDLE');
            const isHighlighted = highlightBlockIdx === idx;

            return (
              <div
                key={idx}
                className={`relative h-full flex flex-col justify-between border-r border-slate-200/80 flex-shrink-0 transition-all duration-300 group
                  ${bg} 
                  ${isHighlighted ? 'ring-2 ring-indigo-600 ring-offset-2 ring-offset-white scale-[0.99] z-10' : ''}
                `}
                style={{ width: `${widthPercentage}%` }}
                id={`gantt-block-${idx}`}
              >
                {/* Accent bar at the top */}
                <div className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: hex }}
                />

                {/* Grid hover trigger */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-5 bg-black/5 transition-opacity" />

                {/* Header label */}
                <div className="px-3 pt-4 flex justify-between items-start">
                  <span className={`font-display font-bold text-sm tracking-wide ${text}`}>
                    {block.processName}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500 opacity-60 group-hover:opacity-100 transition-opacity">
                    Δ {block.duration}ms
                  </span>
                </div>

                {/* Subtext info */}
                <span className="px-3 pb-8 font-mono text-[10px] text-slate-400 line-clamp-1">
                  {block.processId === 'IDLE' ? 'No scheduled job' : `Shortest CPU burst`}
                </span>

                {/* Timeline axis coordinates under the block */}
                <div className="absolute bottom-1.5 left-0 right-0 px-2 flex justify-between font-mono text-[10px] text-slate-500">
                  <span className="font-medium text-slate-600 group-hover:text-indigo-600 transition-all">{block.startTime}</span>
                  {idx === timeline.length - 1 && (
                    <span className="font-semibold text-slate-600 group-hover:text-indigo-600 transition-all">{block.endTime}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend list */}
      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs border-t border-slate-100 pt-3" id="gantt-legend">
        <span className="text-slate-400 font-mono text-[10px] uppercase font-bold tracking-wider">Legend:</span>
        {Array.from(new Set(timeline.map(b => b.processName))).map((pName) => {
          const isIdle = pName === 'Idle';
          const { bg, text } = getProcessColors(pName, isIdle);
          return (
            <div key={pName} className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-mono ${bg}`}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getProcessColors(pName, isIdle).hex }}></span>
              {pName}
            </div>
          );
        })}
      </div>
    </div>
  );
}
