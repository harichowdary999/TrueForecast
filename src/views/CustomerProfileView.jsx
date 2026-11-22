import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { fetchDealById, fetchDeals } from '../services/api';
import { formatINR, formatINRAbbreviated } from '../utils/formatCurrency';
import { calculateLogisticRegressionProbability } from '../components/InteractiveDealsTable';

export function CustomerProfileView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checklist, setChecklist] = useState([
    { id: 1, text: 'Confirm security evaluation and standard SOC2 agreement with VP Infosec', done: true },
    { id: 2, text: 'Validate budget allocation signoff with Economic Buyer (CFO)', done: true },
    { id: 3, text: 'Distribute mutual execution plan & redlined master services agreement', done: false },
    { id: 4, text: 'Schedule final signing ceremony before quarter-end pipeline cutoff', done: false },
  ]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await fetchDealById(id);
        if (isMounted && res.data) {
          setDeal(res.data);
          return;
        }

        // Secondary fallback search in all deals
        const allRes = await fetchDeals();
        const found = (allRes.data || []).find((d) => String(d.id) === String(id));
        if (isMounted) {
          setDeal(found || null);
        }
      } catch (err) {
        console.error('Failed to load customer dossier:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#1f1d1a]" />
        <span className="text-xs font-medium text-[#6b645c]">Loading customer dossier...</span>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="space-y-6">
        <div>
          <button
            onClick={() => navigate('/customers')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6b645c] hover:text-[#1f1d1a] transition-colors py-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Customers</span>
          </button>
        </div>
        <div className="bg-white border border-[#dcd1c1] rounded-xl p-12 text-center shadow-[0_1px_3px_rgba(31,29,26,0.05)] space-y-4">
          <h3 className="text-base font-bold text-[#1f1d1a]">Customer dossier not found</h3>
          <p className="text-xs text-[#6b645c] max-w-sm mx-auto">
            The requested opportunity could not be found in the current CRM pipeline database.
          </p>
          <button
            onClick={() => navigate('/customers')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#c86d51] text-white text-xs font-semibold rounded-lg hover:bg-[#b35c42] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Customers</span>
          </button>
        </div>
      </div>
    );
  }

  const initials = (deal.account || deal.name || 'AC')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const toggleChecklistItem = (itemId) => {
    setChecklist((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, done: !item.done } : item))
    );
  };

  // Logistic regression win probability
  const mlWinProb = calculateLogisticRegressionProbability(deal);

  // Target pacing contribution
  const estTarget = 15000000;
  const contributionPct = (((deal.amount || 0) / estTarget) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <button
          onClick={() => navigate('/customers')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6b645c] hover:text-[#1f1d1a] transition-colors py-1 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Customers</span>
        </button>
      </div>

      {/* Top Summary Card */}
      <div className="bg-white border border-[#dcd1c1] rounded-xl p-6 shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Badge, Opportunity ID, Title, Metadata Row */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#1f1d1a] text-white flex items-center justify-center font-bold text-lg tracking-wider shrink-0 shadow-xs">
              {initials}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#6b645c] bg-[#f7f3ed] border border-[#dcd1c1] px-2 py-0.5 rounded">
                  {String(deal.id).toUpperCase()}
                </span>
                <span className="text-[11px] font-semibold text-[#115e4d] bg-[#e2f2ee] border border-[#b8e2d7] px-2 py-0.5 rounded-full">
                  {deal.stage}
                </span>
                {deal.divergenceDetected && (
                  <span className="text-[11px] font-semibold text-[#9e2a2b] bg-[#fae3e3] border border-[#f5c6c6] px-2 py-0.5 rounded-full">
                    Divergence Detected
                  </span>
                )}
              </div>

              <h1 className="text-xl font-bold tracking-tight text-[#1f1d1a]">
                {deal.name}
              </h1>

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-2 text-xs text-[#6b645c]">
                <div>
                  <span className="text-[#8c827a]">Account:</span>{' '}
                  <span className="font-semibold text-[#1f1d1a]">{deal.account || '—'}</span>
                </div>
                <div>
                  <span className="text-[#8c827a]">Owner:</span>{' '}
                  <span className="font-semibold text-[#1f1d1a]">{deal.salesRep || '—'}</span>
                </div>
                <div>
                  <span className="text-[#8c827a]">Target Close:</span>{' '}
                  <span className="font-semibold text-[#1f1d1a]">{deal.closeDate || '—'}</span>
                </div>
                <div>
                  <span className="text-[#8c827a]">Time in Stage:</span>{' '}
                  <span className="font-semibold text-[#1f1d1a]">
                    {deal.daysInStage != null ? `${deal.daysInStage} days` : '—'}
                  </span>
                </div>
                {deal.region && (
                  <div>
                    <span className="text-[#8c827a]">Region:</span>{' '}
                    <span className="font-semibold text-[#1f1d1a]">{deal.region}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right-aligned Metric Box: Total Deal ARR vs ML Expected Value */}
          <div className="bg-[#f7f3ed] border border-[#dcd1c1] rounded-xl p-4 flex items-center gap-6 self-start lg:self-auto shrink-0">
            <div>
              <p className="text-[11px] font-medium text-[#6b645c] uppercase tracking-wider">
                Total Deal ARR
              </p>
              <p className="text-2xl font-bold text-[#1f1d1a] tabular-nums mt-0.5">
                {formatINR(deal.amount || 0)}
              </p>
            </div>

            <div className="h-10 w-[1px] bg-[#dcd1c1]" />

            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-medium text-[#6b645c] uppercase tracking-wider">
                  ML Expected Value
                </p>
                <Sparkles className="w-3 h-3 text-[#157f68]" />
              </div>
              <p className="text-2xl font-bold text-[#157f68] tabular-nums mt-0.5">
                {formatINR(deal.expectedRevenue || Math.round((deal.amount || 0) * (mlWinProb / 100)))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Column Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: ML Win Probability */}
        <div className="bg-white border border-[#dcd1c1] rounded-xl p-5 shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6b645c]">
              ML Win Probability
            </span>
            <span className="text-[10px] font-semibold text-[#115e4d] bg-[#e2f2ee] px-2 py-0.5 rounded border border-[#b8e2d7]">
              Logistic Reg
            </span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-[#1f1d1a] tabular-nums mb-1">
            {mlWinProb}%
          </div>
          <p className="text-xs text-[#6b645c] mb-3">
            {mlWinProb >= 75 ? 'High Confidence (75-99%)' : mlWinProb >= 45 ? 'Moderate Confidence (45-74%)' : 'At Risk (<45%)'}
          </p>
          <div className="w-full bg-[#f7f3ed] h-1.5 rounded-full overflow-hidden">
            <div
              style={{ width: `${mlWinProb}%` }}
              className="h-full bg-[#157f68] rounded-full"
            />
          </div>
        </div>

        {/* Card 2: Rep Gut Commit */}
        <div className="bg-white border border-[#dcd1c1] rounded-xl p-5 shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6b645c]">
              Rep Gut Commit
            </span>
            <span className="text-[10px] font-semibold text-[#6b645c] bg-[#f7f3ed] px-2 py-0.5 rounded border border-[#dcd1c1]">
              AE Input
            </span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-[#1f1d1a] tabular-nums mb-1">
            {deal.repCommit != null ? `${deal.repCommit}%` : '—'}
          </div>
          <p className="text-xs text-[#6b645c] mb-3">
            Assigned AE Input{deal.salesRep ? ` · ${deal.salesRep}` : ''}
          </p>
          <div className="w-full bg-[#f7f3ed] h-1.5 rounded-full overflow-hidden">
            <div
              style={{ width: `${deal.repCommit != null ? deal.repCommit : 0}%` }}
              className="h-full bg-[#1f1d1a] rounded-full"
            />
          </div>
        </div>

        {/* Card 3: Pipeline Health Score */}
        <div className="bg-white border border-[#dcd1c1] rounded-xl p-5 shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6b645c]">
              Pipeline Health Score
            </span>
            {deal.healthScore != null && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                deal.healthScore >= 70
                  ? 'text-[#115e4d] bg-[#e2f2ee] border-[#b8e2d7]'
                  : 'text-[#8a5a00] bg-[#faefd4] border-[#f2dda7]'
              }`}>
                {deal.healthScore >= 70 ? 'Optimal' : 'Needs Action'}
              </span>
            )}
          </div>
          <div className="text-3xl font-bold tracking-tight text-[#1f1d1a] tabular-nums mb-1">
            {deal.healthScore != null ? (
              <>
                {deal.healthScore}
                <span className="text-base text-[#8c827a] font-normal">/100</span>
              </>
            ) : (
              '—'
            )}
          </div>
          <p className="text-xs text-[#6b645c] mb-3">
            Engagement telemetry score
          </p>
          <div className="w-full bg-[#f7f3ed] h-1.5 rounded-full overflow-hidden">
            <div
              style={{ width: `${deal.healthScore != null ? deal.healthScore : 0}%` }}
              className={`h-full rounded-full ${
                (deal.healthScore || 0) >= 70 ? 'bg-[#157f68]' : 'bg-[#d99b26]'
              }`}
            />
          </div>
        </div>

        {/* Card 4: Contribution to Quarter */}
        <div className="bg-white border border-[#dcd1c1] rounded-xl p-5 shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6b645c]">
              Contribution to Quarter
            </span>
            <span className="text-[10px] font-semibold text-[#2b5b6c] bg-[#e8f1f5] px-2 py-0.5 rounded border border-[#c0d8e2]">
              Active FY
            </span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-[#1f1d1a] tabular-nums mb-1">
            {contributionPct}%
          </div>
          <p className="text-xs text-[#6b645c] mb-3">
            Target Pacing Contribution
          </p>
          <div className="w-full bg-[#f7f3ed] h-1.5 rounded-full overflow-hidden">
            <div
              style={{ width: `${Math.min(100, Math.max(5, Number(contributionPct) * 4))}%` }}
              className="h-full bg-[#2b5b6c] rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Deep Dossier Subsections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: ML Feature Attribution & Playbook */}
        <div className="lg:col-span-7 space-y-6">
          {/* Logistic Regression Feature Attribution (ML) */}
          <div className="bg-white border border-[#dcd1c1] rounded-xl p-6 shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#1f1d1a] uppercase tracking-wider">
                Logistic Regression Feature Attribution (ML)
              </h2>
              <span className="text-xs text-[#6b645c]">Coefficient Impact</span>
            </div>

            <div className="space-y-3">
              {(deal.keyDrivers || [
                { prefix: '+', type: 'positive', text: 'Multi-threaded stakeholder alignment', impactPercent: 18 },
                { prefix: '✓', type: 'positive', text: 'Verified executive buying sponsorship', impactPercent: 14 },
                { prefix: '!', type: 'neutral', text: `Opportunity has spent ${deal.daysInStage || 8} days in ${deal.stage}`, impactPercent: -6 },
              ]).map((driver, i) => (
                <div
                  key={i}
                  className="p-3 bg-[#f7f3ed] rounded-lg border border-[#dcd1c1] flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-xs ${
                      driver.impactPercent > 0
                        ? 'bg-[#e2f2ee] text-[#115e4d]'
                        : 'bg-[#faefd4] text-[#8a5a00]'
                    }`}>
                      {driver.prefix || (driver.impactPercent > 0 ? '+' : '-')}
                    </span>
                    <span className="text-[#1f1d1a] font-medium">{driver.text}</span>
                  </div>
                  <span className={`font-semibold tabular-nums ${
                    driver.impactPercent > 0 ? 'text-[#157f68]' : 'text-[#c86d51]'
                  }`}>
                    {driver.impactPercent > 0 ? `+${driver.impactPercent}%` : `${driver.impactPercent}%`}
                  </span>
                </div>
              ))}
            </div>

            {deal.recommendedAction && (
              <div className="mt-4 p-3 bg-[#e8f1f5] border border-[#c0d8e2] rounded-lg text-xs text-[#2b5b6c]">
                <span className="font-semibold">Recommended ML Action:</span> {deal.recommendedAction}
              </div>
            )}
          </div>

          {/* RevOps Next-Best-Actions Checklist */}
          <div className="bg-white border border-[#dcd1c1] rounded-xl p-6 shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
            <h2 className="text-sm font-bold text-[#1f1d1a] uppercase tracking-wider mb-4">
              RevOps Deal Execution Checklist
            </h2>
            <div className="space-y-2.5">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleChecklistItem(item.id)}
                  className="flex items-start gap-3 p-3 rounded-lg border border-[#dcd1c1] hover:bg-[#f7f3ed] cursor-pointer transition-colors text-xs"
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => {}}
                    className="mt-0.5 rounded border-[#dcd1c1] accent-[#157f68] text-[#157f68] focus:ring-0 cursor-pointer"
                  />
                  <span className={`leading-relaxed ${
                    item.done ? 'line-through text-[#8c827a]' : 'text-[#1f1d1a] font-medium'
                  }`}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Buying Committee & Activity Log */}
        <div className="lg:col-span-5 space-y-6">
          {/* Buying Committee Stakeholders */}
          <div className="bg-white border border-[#dcd1c1] rounded-xl p-6 shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
            <h2 className="text-sm font-bold text-[#1f1d1a] uppercase tracking-wider mb-4">
              Buying Committee Multi-Threading
            </h2>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#f7f3ed] rounded-lg border border-[#dcd1c1] flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#1f1d1a]">{deal.account} Executive Lead</p>
                  <p className="text-[11px] text-[#6b645c]">Economic Buyer</p>
                </div>
                <span className="text-[10px] font-semibold text-[#115e4d] bg-[#e2f2ee] px-2 py-0.5 rounded border border-[#b8e2d7]">
                  Champion
                </span>
              </div>
              <div className="p-3 bg-[#f7f3ed] rounded-lg border border-[#dcd1c1] flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#1f1d1a]">Technical Stakeholder</p>
                  <p className="text-[11px] text-[#6b645c]">Infrastructure & Architecture</p>
                </div>
                <span className="text-[10px] font-semibold text-[#115e4d] bg-[#e2f2ee] px-2 py-0.5 rounded border border-[#b8e2d7]">
                  Signed Off
                </span>
              </div>
              <div className="p-3 bg-[#f7f3ed] rounded-lg border border-[#dcd1c1] flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[#1f1d1a]">Legal & Procurement Counsel</p>
                  <p className="text-[11px] text-[#6b645c]">Commercial Master Agreement</p>
                </div>
                <span className="text-[10px] font-semibold text-[#2b5b6c] bg-[#e8f1f5] px-2 py-0.5 rounded border border-[#c0d8e2]">
                  In Review
                </span>
              </div>
            </div>
          </div>

          {/* Opportunity Activity History */}
          <div className="bg-white border border-[#dcd1c1] rounded-xl p-6 shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
            <h2 className="text-sm font-bold text-[#1f1d1a] uppercase tracking-wider mb-4">
              Engagement Telemetry & Signals
            </h2>
            <div className="relative pl-4 space-y-4 text-xs border-l border-[#dcd1c1]">
              <div>
                <span className="text-[11px] font-mono text-[#8c827a]">Recent Telemetry</span>
                <p className="font-medium text-[#1f1d1a] mt-0.5">Stage velocity logged: {deal.stage}</p>
                <p className="text-[#6b645c] text-[11px]">Assigned sales representative: {deal.salesRep || 'Account Executive'}</p>
              </div>
              <div>
                <span className="text-[11px] font-mono text-[#8c827a]">Status Verification</span>
                <p className="font-medium text-[#1f1d1a] mt-0.5">Contract ARR: {formatINR(deal.amount || 0)}</p>
                <p className="text-[#6b645c] text-[11px]">ML win probability computed at {mlWinProb}%.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
