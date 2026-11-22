import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { formatINR } from '../utils/formatCurrency';

export function KpiStrip({ summary }) {
  const activeDeals = summary?.activeDeals ?? 0;
  const activeDealsDelta = summary?.activeDealsDelta || '+0% vs last month';
  const quotesSent = summary?.quotesSent ?? 0;
  const quotesSentDelta = summary?.quotesSentDelta || '+0% vs last month';
  const avgDealSize = summary?.avgDealSize ?? 0;
  const avgDealSizeDelta = summary?.avgDealSizeDelta || '+0% vs last month';
  const pipelineValue = summary?.pipelineValue ?? 0;
  const pipelineValueDelta = summary?.pipelineValueDelta || '+0% vs last month';

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden mb-6 shadow-2xs">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E5E7EB]">
        {/* Column 1: Active Deals */}
        <div className="p-5 sm:p-6">
          <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-2">
            Active Deals
          </p>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] tabular-nums">
              {activeDeals}
            </span>
            <span className="inline-flex items-center text-xs font-medium text-[#10B981]">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              {activeDealsDelta}
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-1.5">
            {activeDeals > 0 ? `${activeDeals} enterprise opportunities active` : 'No active deals in database'}
          </p>
        </div>

        {/* Column 2: Quotes Sent / Open Proposals */}
        <div className="p-5 sm:p-6">
          <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-2">
            Quotes Sent
          </p>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] tabular-nums">
              {quotesSent}
            </span>
            <span className="inline-flex items-center text-xs font-medium text-[#10B981]">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              {quotesSentDelta}
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-1.5">
            {quotesSent > 0 ? `${quotesSent} open quotes and proposals` : 'No quotes sent yet'}
          </p>
        </div>

        {/* Column 3: Avg Deal Size */}
        <div className="p-5 sm:p-6">
          <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-2">
            Avg Deal Size
          </p>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] tabular-nums">
              {formatINR(avgDealSize)}
            </span>
            <span className="inline-flex items-center text-xs font-medium text-[#10B981]">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              {avgDealSizeDelta}
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-1.5">
            Mean value across active deals
          </p>
        </div>

        {/* Column 4: Total Pipeline Value */}
        <div className="p-5 sm:p-6">
          <p className="text-xs font-medium text-[#6B7280] uppercase tracking-wider mb-2">
            Pipeline Value
          </p>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827] tabular-nums">
              {formatINR(pipelineValue)}
            </span>
            <span className="inline-flex items-center text-xs font-medium text-[#10B981]">
              <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              {pipelineValueDelta}
            </span>
          </div>
          <p className="text-xs text-[#6B7280] mt-1.5">
            Unweighted potential across pipeline
          </p>
        </div>
      </div>
    </div>
  );
}
