import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Loader2, UploadCloud } from 'lucide-react';
import { fetchForecast } from '../services/api';
import { formatINR, formatINRAbbreviated } from '../utils/formatCurrency';

export function ForecastView() {
  const [selectedScenario, setSelectedScenario] = useState('base'); // 'base' | 'conservative' | 'aggressive'
  const [forecastData, setForecastData] = useState({
    quarters: [],
    totalExecutiveTarget: 0,
    totalMlProjected: 0,
    variancePercent: 0,
    activeDealsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await fetchForecast();
        if (isMounted) {
          setForecastData(res.data || { quarters: [] });
        }
      } catch (err) {
        // error handled silently; loading cleared in finally
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const getMultiplier = () => {
    if (selectedScenario === 'conservative') return 0.94;
    if (selectedScenario === 'aggressive') return 1.06;
    return 1.0;
  };

  const multiplier = getMultiplier();
  const quarters = forecastData.quarters || [];

  // Summary calculations with scenario multiplier applied to active/projected quarters
  const totalExecutiveTarget = quarters.reduce((acc, q) => acc + (q.executiveTarget || 0), 0);
  const totalMlProjected = quarters.reduce(
    (acc, q) => acc + ((q.actualOrExpectedRevenue || 0) * (q.isActiveQuarter || q.status === 'PROJECTED' ? multiplier : 1)),
    0
  );
  const totalVariancePercent = totalExecutiveTarget > 0
    ? (((totalMlProjected - totalExecutiveTarget) / totalExecutiveTarget) * 100).toFixed(1)
    : '0.0';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#1f1d1a]" />
        <span className="text-xs font-medium text-[#6b645c]">Calculating revenue expectations...</span>
      </div>
    );
  }

  if (quarters.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-[#dcd1c1] rounded-xl p-6 shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
          <h1 className="text-xl font-bold tracking-tight text-[#1f1d1a]">
            Expected Revenue by Quarter
          </h1>
          <p className="text-xs text-[#6b645c] mt-1">
            Objective revenue expectations bridging CRM pipeline data, executive targets, and sales rep instinct.
          </p>
        </div>

        <div className="bg-white border border-[#dcd1c1] rounded-xl p-12 text-center shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
          <div className="w-12 h-12 bg-[#f7f3ed] border border-[#dcd1c1] rounded-xl flex items-center justify-center mx-auto mb-4 text-[#1f1d1a]">
            <UploadCloud className="w-6 h-6 text-[#1f1d1a]" />
          </div>
          <h3 className="text-base font-bold text-[#1f1d1a]">No forecasting data available</h3>
          <p className="text-xs text-[#6b645c] max-w-md mx-auto mt-1 mb-6">
            Upload your CRM pipeline CSV file to generate quarterly revenue forecasts, calibrate quota pacing, and review ML expected values.
          </p>
          <Link
            to="/crm-analysis"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#c86d51] text-white text-xs font-semibold rounded-lg hover:bg-[#b35c42] transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload CRM Data</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="bg-white border border-[#dcd1c1] rounded-xl p-6 shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-xl font-bold tracking-tight text-[#1f1d1a]">
              Expected Revenue by Quarter
            </h1>
            <p className="text-xs text-[#6b645c] mt-1 leading-relaxed">
              Objective revenue expectations bridging CRM pipeline data, executive targets, and sales rep instinct.
            </p>
          </div>

          {/* Right Metrics & Scenario Toggle */}
          <div className="flex flex-wrap items-center gap-6">
            {/* FY Target */}
            <div>
              <p className="text-[11px] font-semibold text-[#6b645c] uppercase tracking-wider">
                FY Target
              </p>
              <p className="text-xl font-bold text-[#1f1d1a] tabular-nums mt-0.5">
                {formatINRAbbreviated(totalExecutiveTarget)}
              </p>
            </div>

            <div className="h-8 w-[1px] bg-[#dcd1c1] hidden sm:block" />

            {/* ML Projected */}
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-semibold text-[#6b645c] uppercase tracking-wider">
                  ML Projected
                </p>
                <span className="text-[11px] font-semibold text-[#115e4d] bg-[#e2f2ee] px-1.5 py-0.2 rounded border border-[#b8e2d7]">
                  {Number(totalVariancePercent) >= 0 ? `+${totalVariancePercent}%` : `${totalVariancePercent}%`}
                </span>
              </div>
              <p className="text-xl font-bold text-[#1f1d1a] tabular-nums mt-0.5">
                {formatINRAbbreviated(totalMlProjected)}
              </p>
            </div>

            <div className="h-8 w-[1px] bg-[#dcd1c1] hidden sm:block" />

            {/* Scenario Selector */}
            <div className="flex items-center bg-[#f7f3ed] p-1 border border-[#dcd1c1] rounded-lg">
              {['conservative', 'base', 'aggressive'].map((sc) => (
                <button
                  key={sc}
                  onClick={() => setSelectedScenario(sc)}
                  className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors cursor-pointer ${
                    selectedScenario === sc
                      ? 'bg-white text-[#1f1d1a] shadow-xs font-semibold'
                      : 'text-[#6b645c] hover:text-[#1f1d1a]'
                  }`}
                >
                  {sc}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4-Column Quarterly Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {quarters.map((q) => {
          const isActive = q.isActiveQuarter;
          const status = isActive ? 'CURRENT ACTIVE' : q.status;
          const expectedRev = (q.actualOrExpectedRevenue || 0) * (isActive || q.status === 'PROJECTED' ? multiplier : 1);
          const pace = q.executiveTarget > 0 ? ((expectedRev / q.executiveTarget) * 100).toFixed(1) : '100.0';

          const closedPercent = q.closedPercent !== undefined ? q.closedPercent : (q.status?.includes('CLOSED') ? 100 : 0);
          const pipelinePercent = Math.max(0, 100 - closedPercent);
          const repCommitGap = (q.repGutCommit || 0) - (q.executiveTarget || 0);

          return (
            <div
              key={q.id}
              className={`bg-white rounded-xl p-5 transition-all relative shadow-[0_1px_3px_rgba(31,29,26,0.05)] ${
                isActive
                  ? 'border-2 border-[#1f1d1a]'
                  : 'border border-[#dcd1c1] hover:border-[#8c827a]'
              }`}
            >
              {isActive && (
                <span className="absolute -top-2.5 left-5 px-2 py-0.5 bg-[#1f1d1a] text-white text-[10px] font-bold uppercase tracking-wider rounded">
                  Current Quarter
                </span>
              )}

              {/* Top Row: Quarter label, status pill, and pace badge */}
              <div className="flex items-center justify-between mb-4 mt-1">
                <span className="text-sm font-bold text-[#1f1d1a] tracking-tight">
                  {q.label}
                </span>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      isActive
                        ? 'bg-[#e2f2ee] text-[#115e4d] border-[#b8e2d7]'
                        : q.status?.includes('CLOSED')
                        ? 'bg-[#f7f3ed] text-[#6b645c] border-[#dcd1c1]'
                        : 'bg-[#faefd4] text-[#8a5a00] border-[#f2dda7]'
                    }`}
                  >
                    {status}
                  </span>
                  <span className="text-[11px] font-semibold text-[#157f68] tabular-nums">
                    {pace}% Pace
                  </span>
                </div>
              </div>

              {/* Main Metric: Large Bold Expected Revenue */}
              <div className="mb-4">
                <p className="text-[11px] font-medium text-[#6b645c]">
                  {isActive || q.status === 'PROJECTED' ? 'ML Expected Revenue' : 'Actual Closed Revenue'}
                </p>
                <div className="text-2xl font-extrabold text-[#1f1d1a] tabular-nums tracking-tight mt-0.5">
                  {formatINR(expectedRev)}
                </div>
                <p className="text-[11px] font-medium text-[#157f68] flex items-center gap-1 mt-1">
                  <ArrowUpRight className="w-3 h-3" />
                  {q.targetDeltaLabel || '+0 above target'}
                </p>
              </div>

              {/* Bottom Rows: Executive Target vs Rep Gut Commit */}
              <div className="space-y-2 py-3 border-t border-[#ebe3d7] text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#6b645c]">Executive Target</span>
                  <span className="font-semibold text-[#1f1d1a] tabular-nums">
                    {formatINR(q.executiveTarget || 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#6b645c]">Rep Gut Commit</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-[#1f1d1a] tabular-nums">
                      {formatINR(q.repGutCommit || 0)}
                    </span>
                    {repCommitGap < 0 && (
                      <span className="text-[10px] text-[#8a5a00] bg-[#faefd4] px-1.5 py-0.2 rounded border border-[#f2dda7]">
                        {formatINR(Math.abs(repCommitGap))} gap
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar showing Closed vs Pipeline Split */}
              <div className="pt-3 border-t border-[#ebe3d7]">
                <div className="flex items-center justify-between text-[11px] text-[#6b645c] mb-1.5">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-xs bg-[#157f68]" />
                    Closed ({closedPercent}%)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-xs bg-[#d99b26]" />
                    Pipeline ({pipelinePercent}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full overflow-hidden flex bg-[#f7f3ed]">
                  <div
                    style={{ width: `${closedPercent}%` }}
                    className="h-full bg-[#157f68] transition-all duration-300"
                  />
                  <div
                    style={{ width: `${pipelinePercent}%` }}
                    className="h-full bg-[#d99b26] transition-all duration-300"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Model Calibration & Pacing Insights Panel */}
      <div className="bg-white border border-[#dcd1c1] rounded-xl p-6 shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
        <h3 className="text-sm font-bold text-[#1f1d1a] uppercase tracking-wider mb-4">
          Revenue Methodology & ML Forecast Bridge
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed text-[#6b645c]">
          <div className="p-4 bg-[#f7f3ed] rounded-lg border border-[#dcd1c1]">
            <p className="font-semibold text-[#1f1d1a] mb-1">1. Logistic Regression Calibration</p>
            <p>
              Trained on historical closed-won and closed-lost sales records stored in PostgreSQL. Calibrates deal closure probabilities using deal size, sales rep win-rates, and stage velocity.
            </p>
          </div>
          <div className="p-4 bg-[#f7f3ed] rounded-lg border border-[#dcd1c1]">
            <p className="font-semibold text-[#1f1d1a] mb-1">2. Multi-Signal Probability Scoring</p>
            <p>
              Integrates stage progression, stakeholder health, and historical conversion variance into the Scikit-Learn logistic sigmoid pipeline to score realistic confidence bands.
            </p>
          </div>
          <div className="p-4 bg-[#f7f3ed] rounded-lg border border-[#dcd1c1]">
            <p className="font-semibold text-[#1f1d1a] mb-1">3. Live Executive Quota Pacing</p>
            <p>
              {forecastData.activeDealsCount > 0
                ? `Currently pacing across ${forecastData.activeDealsCount} live deals in PostgreSQL, bridging rep gut commitments with statistical ML forecasts.`
                : 'Upload CRM exports to compute live quota pacing and evaluate scenario projections.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
