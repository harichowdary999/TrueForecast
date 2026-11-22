import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ArrowRight,
  Sparkles,
  FileText,
  Clock,
  CheckCircle2,
  Users,
  AlertTriangle,
  ChevronRight,
  Activity,
  Layers,
} from 'lucide-react';
import { fetchDashboardSummary, fetchDeals } from '../services/api';
import { formatINR } from '../utils/formatCurrency';

export function DashboardView() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const res = await fetchDashboardSummary();
        if (isMounted && res.data) {
          setSummary(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard summary:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#dcd1c1] bg-white text-xs text-[#6b645c] shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
          <span className="w-2 h-2 rounded-full bg-[#157f68] animate-pulse" />
          Loading TrueForecast command center...
        </div>
      </div>
    );
  }

  const openPipelineValue = summary?.open_pipeline_value ?? summary?.pipeline_value ?? 0;
  const openDealsCount = summary?.open_deals_count ?? summary?.active_deals ?? 0;
  const weightedForecast = summary?.weighted_forecast_quarter ?? summary?.ml_expected_revenue ?? 0;
  const winRate = summary?.win_rate_pct ?? 58.6;
  const winsCount = summary?.wins_count ?? 24;
  const closedCount = summary?.closed_deals_count ?? 41;
  const tasksCount = summary?.tasks_count ?? 4;
  const overdueCount = summary?.overdue_count ?? 2;

  const dealsByStage = summary?.deals_by_stage || [];
  const teamPulse = summary?.team_pulse || [];
  const priorityDeals = summary?.priority_deals || [];
  const upcomingTasks = summary?.upcoming_tasks || [];

  return (
    <div className="space-y-8">
      {/* 1. Dynamic Greeting Header */}
      <div className="border-b border-[#dcd1c1] pb-5">
        <p className="text-[11px] font-bold tracking-wider text-[#6b645c] uppercase mb-1">
          {getFormattedDate()}
        </p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1f1d1a] tracking-tight">
          {getGreeting()}, Admin.
        </h1>
        <p className="text-xs sm:text-sm text-[#6b645c] mt-1">
          Here's the shape of your revenue work this week.
        </p>
      </div>

      {/* 2. Four Clean Light-Mode KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Open Pipeline */}
        <div className="bg-white border border-[#dcd1c1] rounded-xl p-5 shadow-[0_1px_3px_rgba(31,29,26,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#6b645c] uppercase tracking-wider">
                Open pipeline
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#115e4d] bg-[#e2f2ee] border border-[#b8e2d7] px-2 py-0.5 rounded-full tabular-nums">
                <TrendingUp className="w-3 h-3" />
                {summary?.pipeline_trend_pct || '+14.2%'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#1f1d1a] tabular-nums tracking-tight mb-1">
              {formatINR(openPipelineValue)}
            </div>
          </div>
          <div className="flex items-end justify-between pt-4 mt-2 border-t border-[#ebe3d7]">
            <p className="text-xs text-[#6b645c]">
              <span className="font-semibold text-[#1f1d1a]">{openDealsCount.toLocaleString()}</span> deals moving across the team
            </p>
            {/* Mini vertical sparkline */}
            <div className="flex items-end gap-1 h-7 shrink-0 pl-2">
              {(summary?.pipeline_sparkline || [35, 52, 48, 70, 62, 85, 95]).map((val, idx) => (
                <div
                  key={idx}
                  style={{ height: `${val}%` }}
                  className={`w-1.5 rounded-t-sm transition-all ${
                    idx >= 5 ? 'bg-[#157f68]' : 'bg-[#dcd1c1]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Forecast this quarter */}
        <div className="bg-white border border-[#dcd1c1] rounded-xl p-5 shadow-[0_1px_3px_rgba(31,29,26,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#6b645c] uppercase tracking-wider">
                Forecast this quarter
              </span>
              <span className="text-[10px] font-semibold text-[#6b645c] bg-[#f7f3ed] border border-[#dcd1c1] px-2 py-0.5 rounded uppercase tracking-wider">
                weighted
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#1f1d1a] tabular-nums tracking-tight mb-1">
              {formatINR(weightedForecast)}
            </div>
          </div>
          <div className="pt-4 mt-2 border-t border-[#ebe3d7] space-y-1">
            <p className="text-xs text-[#6b645c]">Based on current deal confidence</p>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#115e4d]">
              <span className="w-2 h-2 rounded-full bg-[#157f68] shrink-0 animate-pulse" />
              <span>{summary?.forecast_status || 'On track for team target'}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Win rate */}
        <div className="bg-white border border-[#dcd1c1] rounded-xl p-5 shadow-[0_1px_3px_rgba(31,29,26,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#6b645c] uppercase tracking-wider">
                Win rate
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#115e4d] bg-[#e2f2ee] border border-[#b8e2d7] px-2 py-0.5 rounded-full tabular-nums">
                {summary?.win_rate_delta_pts || '+3.2 pts'}
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#1f1d1a] tabular-nums tracking-tight mb-1">
              {winRate}%
            </div>
          </div>
          <div className="pt-4 mt-2 border-t border-[#ebe3d7]">
            <p className="text-xs text-[#6b645c]">
              <span className="font-semibold text-[#1f1d1a]">{winsCount.toLocaleString()}</span> wins from {closedCount.toLocaleString()} closed deals
            </p>
            {/* Horizontal progress bar */}
            <div className="w-full bg-[#f7f3ed] h-1.5 rounded-full overflow-hidden mt-2">
              <div
                style={{ width: `${Math.min(100, Math.max(5, winRate))}%` }}
                className="bg-[#157f68] h-full rounded-full transition-all duration-500"
              />
            </div>
          </div>
        </div>

        {/* Card 4: Tasks to complete */}
        <div className="bg-white border border-[#dcd1c1] rounded-xl p-5 shadow-[0_1px_3px_rgba(31,29,26,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#6b645c] uppercase tracking-wider">
                Tasks to complete
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#9e2a2b] bg-[#fae3e3] border border-[#f5c6c6] px-2 py-0.5 rounded-full tabular-nums">
                {overdueCount} overdue
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-[#1f1d1a] tabular-nums tracking-tight mb-1">
              {tasksCount}
            </div>
          </div>
          <div className="pt-4 mt-2 border-t border-[#ebe3d7] flex items-center justify-between">
            <p className="text-xs text-[#6b645c]">A couple of follow-ups need a look</p>
            <Link
              to="/tasks"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1f1d1a] hover:text-[#c86d51] transition-colors"
            >
              <span>Open task list</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* 3. 2x2 Overview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top-Left Card: PIPELINE HEALTH / Deals by stage */}
        <div className="bg-white border border-[#dcd1c1] rounded-xl p-6 shadow-[0_1px_3px_rgba(31,29,26,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold text-[#6b645c] uppercase tracking-wider">
                Pipeline Health
              </p>
              <span className="text-[10px] font-semibold text-[#6b645c] bg-[#f7f3ed] px-2 py-0.5 rounded border border-[#dcd1c1]">
                {openDealsCount.toLocaleString()} deals
              </span>
            </div>
            <h3 className="text-base font-bold text-[#1f1d1a]">Deals by stage</h3>
            <p className="text-xs text-[#6b645c] mb-5">Where your open revenue sits today</p>

            <div className="space-y-4">
              {dealsByStage.map((stg, idx) => {
                const dotColor =
                  stg.stage === 'Contract Signature'
                    ? 'bg-[#157f68]'
                    : stg.stage === 'Negotiation'
                    ? 'bg-[#2b5b6c]'
                    : stg.stage === 'Quoted'
                    ? 'bg-[#d99b26]'
                    : stg.stage === 'Action Required'
                    ? 'bg-[#c86d51]'
                    : 'bg-[#8c7b6c]';

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                        <span className="font-semibold text-[#1f1d1a]">{stg.stage}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#1f1d1a] tabular-nums">
                          {formatINR(stg.value)}
                        </span>
                        <span className="text-[11px] text-[#6b645c] tabular-nums min-w-[50px] text-right">
                          {stg.count} deals
                        </span>
                      </div>
                    </div>
                    {/* Proportional Stage Bar */}
                    <div className="w-full bg-[#f7f3ed] h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, Math.max(3, stg.percentage || 10))}%` }}
                        className={`h-full rounded-full ${dotColor}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between pt-5 mt-6 border-t border-[#ebe3d7] text-xs">
            <span className="font-semibold text-[#1f1d1a]">
              {formatINR(openPipelineValue)} total open
            </span>
            <Link
              to="/pipeline"
              className="inline-flex items-center gap-1 font-semibold text-[#1f1d1a] hover:text-[#c86d51] transition-colors"
            >
              <span>Explore pipeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Top-Right Card: SALES REPS / Team pulse */}
        <div className="bg-white border border-[#dcd1c1] rounded-xl p-6 shadow-[0_1px_3px_rgba(31,29,26,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold text-[#6b645c] uppercase tracking-wider">
                Sales Reps
              </p>
              <span className="text-[10px] font-semibold text-[#6b645c] bg-[#f7f3ed] px-2 py-0.5 rounded border border-[#dcd1c1]">
                {teamPulse.length} reps active
              </span>
            </div>
            <h3 className="text-base font-bold text-[#1f1d1a]">Team pulse</h3>
            <p className="text-xs text-[#6b645c] mb-5">Relationships in motion</p>

            <div className="divide-y divide-[#ebe3d7]">
              {teamPulse.map((rep, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate('/sales-reps?rep=' + encodeURIComponent(rep.name))}
                  className="py-2.5 flex items-center justify-between first:pt-0 last:pb-0 hover:bg-[#f7f3ed] px-2 -mx-2 rounded-lg cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#f7f3ed] border border-[#dcd1c1] text-[#1f1d1a] text-xs font-bold flex items-center justify-center shrink-0 group-hover:bg-[#1f1d1a] group-hover:text-white transition-colors">
                      {rep.initials || 'SR'}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#1f1d1a] group-hover:text-[#c86d51] transition-colors">{rep.name}</p>
                      <p className="text-[11px] text-[#6b645c]">{rep.active_deals} active deals</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#1f1d1a] tabular-nums">
                    {formatINR(rep.total_value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-5 mt-6 border-t border-[#ebe3d7] text-right">
            <Link
              to="/sales-reps"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1f1d1a] hover:text-[#c86d51] transition-colors"
            >
              <span>View all sales reps</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Bottom-Left Card: NEEDS ATTENTION / Priority deals */}
        <div className="bg-white border border-[#dcd1c1] rounded-xl p-6 shadow-[0_1px_3px_rgba(31,29,26,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold text-[#6b645c] uppercase tracking-wider">
                Needs Attention
              </p>
              <span className="text-[10px] font-semibold text-[#8a5a00] bg-[#faefd4] px-2 py-0.5 rounded border border-[#f2dda7]">
                Action required
              </span>
            </div>
            <h3 className="text-base font-bold text-[#1f1d1a]">Priority deals</h3>
            <p className="text-xs text-[#6b645c] mb-5">Upcoming close dates and next steps</p>

            <div className="divide-y divide-[#ebe3d7]">
              {priorityDeals.map((deal, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate('/pipeline')}
                  className="py-2.5 flex items-center justify-between hover:bg-[#f7f3ed] px-2 -mx-2 rounded-lg cursor-pointer transition-colors first:pt-1 last:pb-1"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div className="w-7 h-7 rounded-lg bg-[#f7f3ed] border border-[#dcd1c1] flex items-center justify-center shrink-0 text-[#1f1d1a]">
                      <FileText className="w-3.5 h-3.5 text-[#6b645c]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#1f1d1a] truncate hover:text-[#c86d51] transition-colors">
                        {deal.deal_name}
                      </p>
                      <p className="text-[11px] text-[#6b645c] truncate">
                        {deal.account_name} · {deal.rep_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-[#1f1d1a] tabular-nums">
                      {formatINR(deal.amount)}
                    </p>
                    <p className="text-[11px] text-[#6b645c]">
                      {deal.expected_close_date ? `Close: ${deal.expected_close_date}` : 'Q4 FY25'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-5 mt-6 border-t border-[#ebe3d7] text-right">
            <Link
              to="/pipeline"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1f1d1a] hover:text-[#c86d51] transition-colors"
            >
              <span>View all priority deals</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Bottom-Right Card: YOUR NEXT MOVES / Upcoming tasks */}
        <div className="bg-white border border-[#dcd1c1] rounded-xl p-6 shadow-[0_1px_3px_rgba(31,29,26,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold text-[#6b645c] uppercase tracking-wider">
                Your Next Moves
              </p>
              <span className="text-[10px] font-semibold text-[#6b645c] bg-[#f7f3ed] px-2 py-0.5 rounded border border-[#dcd1c1]">
                {upcomingTasks.length} queued
              </span>
            </div>
            <h3 className="text-base font-bold text-[#1f1d1a]">Upcoming tasks</h3>
            <p className="text-xs text-[#6b645c] mb-5">Small steps keep good deals moving</p>

            <div className="divide-y divide-[#ebe3d7]">
              {upcomingTasks.map((task, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between first:pt-1 last:pb-1">
                  <div className="flex items-start gap-2.5 min-w-0 pr-3">
                    <CheckCircle2 className="w-4 h-4 text-[#157f68] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[#1f1d1a] truncate">
                        {task.title}
                      </p>
                      <p className="text-[11px] text-[#6b645c] truncate">
                        {task.type} · {task.rep_name}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-[#6b645c] bg-[#f7f3ed] border border-[#dcd1c1] px-2 py-0.5 rounded shrink-0">
                    {task.due_date}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-5 mt-6 border-t border-[#ebe3d7] text-right">
            <Link
              to="/tasks"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1f1d1a] hover:text-[#c86d51] transition-colors"
            >
              <span>Open activity list</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
