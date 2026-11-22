import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { formatINR, formatINRAbbreviated, formatINRPieces } from '../utils/formatCurrency';

export function PipelineValueChart({ pipelineValue = 0, pipelineValueDelta = '+0% vs last month', monthlyData }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const defaultMonthlyData = [
    { month: 'Jan', won: 0, entering: 0 },
    { month: 'Feb', won: 0, entering: 0 },
    { month: 'Mar', won: 0, entering: 0 },
    { month: 'Apr', won: 0, entering: 0 },
    { month: 'May', won: 0, entering: 0 },
    { month: 'Jun', won: 0, entering: 0 },
    { month: 'Jul', won: 0, entering: 0 },
    { month: 'Aug', won: 0, entering: 0 },
    { month: 'Sep', won: 0, entering: 0 },
    { month: 'Oct', won: 0, entering: 0 },
    { month: 'Nov', won: 0, entering: 0 },
    { month: 'Dec', won: 0, entering: 0 },
  ];

  const data = monthlyData && monthlyData.length > 0 ? monthlyData : defaultMonthlyData;
  const maxVal = Math.max(...data.flatMap((d) => [d.won || 0, d.entering || 0]), 10000);

  const totalWon = data.reduce((acc, d) => acc + (d.won || 0), 0);
  const totalEntering = data.reduce((acc, d) => acc + (d.entering || 0), 0);

  // Splitting total into rupee and paise for muted display
  const { whole, paise } = formatINRPieces(pipelineValue || 0);

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 mb-6 shadow-2xs">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Pipeline Value Total */}
        <div className="lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
                Pipeline Value
              </span>
              <span className="inline-flex items-center text-xs font-semibold text-[#10B981] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                {pipelineValueDelta}
              </span>
            </div>
            <div className="text-4xl font-extrabold tracking-tight text-[#111827] tabular-nums">
              {whole}
              <span className="text-2xl font-normal text-[#9CA3AF]">.{paise}</span>
            </div>
            <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
              Total unweighted potential across active stages.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-[#E5E7EB] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-[#2563EB]" />
                <span className="text-[#4B5563] font-medium">Won / Closed Value</span>
              </div>
              <span className="font-semibold text-[#111827] tabular-nums">{formatINR(totalWon)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-xs bg-[#93C5FD]" />
                <span className="text-[#4B5563] font-medium">Value Entering Pipeline</span>
              </div>
              <span className="font-semibold text-[#111827] tabular-nums">{formatINR(totalEntering)}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Jan - Dec Vertical Bar Chart */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium text-[#6B7280]">Monthly Velocity & Intake (Jan–Dec)</span>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#2563EB]" />
                <span className="text-[#6B7280]">Won / Closed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#93C5FD]" />
                <span className="text-[#6B7280]">Entering Pipeline</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="relative h-56 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-[#E5E7EB]">
            {data.map((item, idx) => {
              const wonHeight = maxVal > 0 ? ((item.won || 0) / maxVal) * 100 : 0;
              const enteringHeight = maxVal > 0 ? ((item.entering || 0) / maxVal) * 100 : 0;
              const isHovered = hoveredIndex === idx;

              return (
                <div
                  key={item.month}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Tooltip on Hover */}
                  {isHovered && (
                    <div className="absolute -top-14 z-20 bg-[#111827] text-white text-[10px] py-1.5 px-2.5 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
                      <div className="font-semibold mb-0.5">{item.month} Performance</div>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-300">Won: {formatINRAbbreviated(item.won || 0)}</span>
                        <span className="text-blue-200">Entering: {formatINRAbbreviated(item.entering || 0)}</span>
                      </div>
                    </div>
                  )}

                  {/* Paired Bars */}
                  <div className="w-full flex items-end justify-center gap-1 h-full pb-1">
                    {/* Won Bar */}
                    <div
                      style={{ height: `${Math.max(wonHeight, 2)}%` }}
                      className="w-1/2 max-w-[12px] bg-[#2563EB] rounded-t-xs transition-all duration-300 group-hover:brightness-110"
                    />
                    {/* Entering Bar */}
                    <div
                      style={{ height: `${Math.max(enteringHeight, 2)}%` }}
                      className="w-1/2 max-w-[12px] bg-[#93C5FD] rounded-t-xs transition-all duration-300 group-hover:brightness-110"
                    />
                  </div>

                  {/* Month Label */}
                  <span className="text-[10px] font-medium text-[#6B7280] group-hover:text-[#111827] mt-1 transition-colors">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] pt-2">
            <span>Historical closed revenue</span>
            <span>Live pipeline pacing</span>
          </div>
        </div>
      </div>
    </div>
  );
}
