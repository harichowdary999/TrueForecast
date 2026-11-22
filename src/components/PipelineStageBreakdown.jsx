import React from 'react';
import { formatINR } from '../utils/formatCurrency';

export function PipelineStageBreakdown({ stagesData }) {
  const zeroStages = [
    {
      id: 'new',
      name: 'New',
      total: 0,
      percentage: 0,
      count: 0,
      barColor: 'bg-sky-400',
    },
    {
      id: 'quoted',
      name: 'Quoted',
      total: 0,
      percentage: 0,
      count: 0,
      barColor: 'bg-indigo-400',
    },
    {
      id: 'ordered',
      name: 'Ordered',
      total: 0,
      percentage: 0,
      count: 0,
      barColor: 'bg-emerald-400',
    },
    {
      id: 'action-required',
      name: 'Action Required',
      total: 0,
      percentage: 0,
      count: 0,
      barColor: 'bg-amber-400',
    },
  ];

  const stages = stagesData && stagesData.length > 0 ? stagesData : zeroStages;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stages.map((stage) => (
        <div
          key={stage.id || stage.name}
          className="bg-white border border-[#E5E7EB] rounded-xl p-5 hover:border-gray-300 transition-colors shadow-2xs"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              {stage.name}
            </span>
            <span className="text-xs font-semibold text-[#111827] tabular-nums">
              {stage.percentage}%
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-3">
            <span className="text-2xl font-bold tracking-tight text-[#111827] tabular-nums">
              {formatINR(stage.total || 0)}
            </span>
            <span className="text-xs text-[#6B7280]">
              {stage.count || 0} {stage.count === 1 ? 'deal' : 'deals'}
            </span>
          </div>

          {/* Sleek rounded horizontal pastel progress bar */}
          <div className="w-full bg-[#F3F4F6] h-2 rounded-full overflow-hidden">
            <div
              style={{ width: `${Math.min(100, Math.max(0, stage.percentage || 0))}%` }}
              className={`h-full rounded-full transition-all duration-300 ${stage.barColor || 'bg-sky-400'}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
