/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, AlertCircle, Info, Calendar } from 'lucide-react';
import { SimulationEvent, GanttBlock } from '../types';
import { getProcessColors } from './GanttChart';

interface ExecutionWalkthroughProps {
  events: SimulationEvent[];
  gantt: GanttBlock[];
  onTickBlock?: (blockIdx: number) => void; // call parent when block changes
}

export default function ExecutionWalkthrough({ events, gantt, onTickBlock }: ExecutionWalkthroughProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(1500); // interval duration
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Reset to start whenever events change
    setCurrentIdx(0);
    setIsPlaying(false);
  }, [events]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentIdx((prev) => {
          if (prev >= events.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speedMs);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, speedMs, events.length]);

  // Sync state upward to highlight Gantt Block
  useEffect(() => {
    if (events.length === 0 || gantt.length === 0 || !onTickBlock) return;
    
    const activeEvent = events[currentIdx];
    const currentTime = activeEvent.time;

    // Find which block index covers this time slot
    const activeBlockIdx = gantt.findIndex(
      (block) => currentTime >= block.startTime && currentTime <= block.endTime
    );
    
    if (activeBlockIdx !== -1) {
      onTickBlock(activeBlockIdx);
    } else {
      onTickBlock(-1);
    }

    // Auto-scroll the active event into focus
    if (logsEndRef.current) {
      const activeElement = document.getElementById(`walkthrough-event-${currentIdx}`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentIdx, events, gantt, onTickBlock]);

  if (events.length === 0) {
    return null;
  }

  const activeEvent = events[currentIdx];

  const handleNext = () => {
    if (currentIdx < events.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleReset = () => {
    setCurrentIdx(0);
    setIsPlaying(false);
  };

  // Icon type mapping
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'arrival':
        return <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10"></span>;
      case 'start':
        return <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-500/10"></span>;
      case 'preempt':
        return <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-rose-500/10"></span>;
      case 'complete':
        return <span className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-purple-500/10"></span>;
      case 'idle':
        return <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-500/10"></span>;
      default:
        return <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>;
    }
  };

  return (
    <div className="border border-slate-200 rounded-2xl bg-white p-6 shadow-sm flex flex-col h-[400px]" id="execution-walkthrough">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
        <div>
          <h4 className="text-sm font-display font-bold uppercase tracking-wider text-slate-950">Interactive Execution Walkthrough</h4>
          <p className="text-xs text-slate-500 mt-1">Step-by-step CPU log playback & scheduling decisions</p>
        </div>
        
        {/* Playback Button Group */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={handleReset}
            disabled={currentIdx === 0}
            className="p-1.5 text-slate-500 hover:text-indigo-600 disabled:opacity-40 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Restart playback"
            id="control-reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          
          <button
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="p-1.5 text-slate-500 hover:text-indigo-600 disabled:opacity-40 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Step Back"
            id="control-prev"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-all hover:scale-105 shadow-sm flex items-center justify-center cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play Simulation'}
            id="control-play-pause"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </button>

          <button
            onClick={handleNext}
            disabled={currentIdx === events.length - 1}
            className="p-1.5 text-slate-500 hover:text-indigo-600 disabled:opacity-40 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Step Forward"
            id="control-next"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        
        {/* Active Stage Details */}
        <div className="lg:col-span-5 flex flex-col justify-between p-5 rounded-xl border border-slate-200 bg-slate-50">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-1 text-[10px] uppercase font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full">
                Step {currentIdx + 1} of {events.length}
              </span>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider">CPU Time:</span>
                <span className="text-indigo-600 font-bold">{activeEvent.time}ms</span>
              </div>
            </div>

            {/* Event Description Card */}
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="flex gap-2.5 items-start">
                <div className="mt-1 flex-shrink-0">
                  {getEventIcon(activeEvent.type)}
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold block mb-1">
                    Event: {activeEvent.type.replace('_', ' ')}
                  </span>
                  <p className="text-slate-700 text-sm leading-relaxed font-sans font-medium">
                    {activeEvent.message}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Speed settings slider */}
          <div className="border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1.5">
              <span>Simulation Speed:</span>
              <span className="text-indigo-600 font-semibold">{(speedMs / 1000).toFixed(1)}s per step</span>
            </div>
            <input
              type="range"
              min={350}
              max={3000}
              step={100}
              value={speedMs}
              onChange={(e) => setSpeedMs(parseInt(e.target.value))}
              className="w-full accent-indigo-600 bg-slate-200 rounded-lg cursor-pointer h-1"
              id="speed-range"
            />
          </div>
        </div>

        {/* Scrollable Timeline Feed of ALL Logs */}
        <div className="lg:col-span-7 flex flex-col min-h-0 bg-slate-50/50 border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-3.5 py-2.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">Chronological Event Logs</span>
            <span className="text-[10px] text-slate-400 font-sans">Interactive</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar" id="events-log-feed">
            {events.map((event, idx) => {
              const isActive = currentIdx === idx;
              const isPast = idx < currentIdx;

              return (
                <div
                  key={idx}
                  id={`walkthrough-event-${idx}`}
                  onClick={() => {
                    setIsPlaying(false);
                    setCurrentIdx(idx);
                  }}
                  className={`p-3 rounded-xl border text-xs leading-relaxed transition-all duration-200 cursor-pointer flex items-start gap-2.5
                    ${isActive 
                      ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950 font-medium translate-x-1 shadow-sm' 
                      : isPast
                        ? 'bg-white border-slate-100 text-slate-500 opacity-60 hover:opacity-100'
                        : 'bg-transparent border-transparent text-slate-400 opacity-40 hover:opacity-100'
                    }
                  `}
                >
                  <span className="font-mono font-bold text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 shrink-0 min-w-[42px] text-center">
                    T : {event.time}
                  </span>
                  
                  <div className="flex-1">
                    <span className="block font-sans">{event.message}</span>
                  </div>

                  <div className="shrink-0 flex items-center justify-center pt-0.5">
                    {getEventIcon(event.type)}
                  </div>
                </div>
              );
            })}
            <div ref={logsEndRef} />
          </div>
        </div>

      </div>
    </div>
  );
}
