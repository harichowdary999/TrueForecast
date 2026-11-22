import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { InteractiveDealsTable } from '../components/InteractiveDealsTable';
import { CreateDealModal } from '../components/CreateDealModal';
import { fetchDeals, fetchDashboardSummary, updateDealStage } from '../services/api';
import { formatINR } from '../utils/formatCurrency';
import {
  UploadCloud,
  Loader2,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
  Plus,
  Check,
  X
} from 'lucide-react';

const KANBAN_STAGES = [
  { id: 'New', label: 'New', dotColor: 'bg-[#8c7b6c]', headerBg: 'border-[#dcd1c1]' },
  { id: 'Quoted', label: 'Quoted', dotColor: 'bg-[#d99b26]', headerBg: 'border-[#f2dda7]' },
  { id: 'Negotiation', label: 'Negotiation', dotColor: 'bg-[#2b5b6c]', headerBg: 'border-[#a8c5cf]' },
  { id: 'Contract Signature', label: 'Contract Signature', dotColor: 'bg-[#157f68]', headerBg: 'border-[#b8e2d7]' },
  { id: 'Ordered / Won', label: 'Ordered / Won', dotColor: 'bg-[#157f68]', headerBg: 'border-[#b8e2d7]' },
  { id: 'Action Required', label: 'Action Required', dotColor: 'bg-[#c86d51]', headerBg: 'border-[#f5c6c6]' },
];

export function PipelineView() {
  const [deals, setDeals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('All');
  const [sortBy, setSortBy] = useState('close-date');
  const [movingDealId, setMovingDealId] = useState(null);
  const [expandedColumns, setExpandedColumns] = useState({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalInitialStage, setCreateModalInitialStage] = useState('New');
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [dealsRes, summaryRes] = await Promise.all([
          fetchDeals(),
          fetchDashboardSummary(),
        ]);
        if (isMounted) {
          setDeals(dealsRes.data || []);
          setSummary(summaryRes.data || null);
        }
      } catch (err) {
        // error handled silently; loading cleared in finally
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Helper to map deal stage into one of the 6 Kanban buckets
  const getDealColumn = (deal) => {
    const rawStage = (deal.stage || '').trim();
    const stage = rawStage.toLowerCase();

    // 1. Check exact/explicit stage matches first
    if (rawStage === 'Ordered / Won' || stage.includes('ordered') || stage.includes('won')) {
      return 'Ordered / Won';
    }
    if (rawStage === 'Contract Signature' || stage.includes('contract') || stage.includes('signature') || stage.includes('legal') || stage.includes('closing')) {
      return 'Contract Signature';
    }
    if (rawStage === 'Negotiation' || stage.includes('negotiat')) {
      return 'Negotiation';
    }
    if (rawStage === 'Quoted' || stage.includes('pilot') || stage.includes('quoted') || stage.includes('proposal') || stage.includes('evaluat')) {
      return 'Quoted';
    }
    if (rawStage === 'New' || stage.includes('new') || stage.includes('prospect') || stage.includes('qualif') || stage.includes('discover')) {
      return 'New';
    }
    if (rawStage === 'Action Required' || stage.includes('action') || stage.includes('lost')) {
      return 'Action Required';
    }

    // 2. Fallback check for action required if no explicit stage match
    if (
      deal.divergenceDetected ||
      (deal.healthScore !== undefined && deal.healthScore < 50)
    ) {
      return 'Action Required';
    }

    return 'New';
  };

  // Move deal to new stage via PATCH /api/deals/{id}/stage
  const handleMoveStage = async (dealId, targetStage) => {
    if (!targetStage) return;
    const dealToMove = deals.find((d) => d.id === dealId);
    const dealName = dealToMove?.name || 'Deal';

    setMovingDealId(dealId);
    try {
      const res = await updateDealStage(dealId, targetStage);
      if (res.success && res.data) {
        setDeals((prevDeals) =>
          prevDeals.map((d) =>
            d.id === dealId
              ? {
                  ...d,
                  ...res.data,
                  stage: targetStage,
                  divergenceDetected: targetStage === 'Action Required',
                  divergence_detected: targetStage === 'Action Required',
                }
              : d
          )
        );

        // Show Toast Notification
        setToast({
          id: Date.now(),
          message: `"${dealName}" moved to ${targetStage}.`,
        });

        // Refresh summary metrics in background
        fetchDashboardSummary().then((sRes) => {
          if (sRes.data) setSummary(sRes.data);
        });
      }
    } catch (err) {
      console.error('Failed to move deal stage:', err);
    } finally {
      setMovingDealId(null);
    }
  };

  const handleOpenCreateModal = (stageId) => {
    const stageLabel = stageId === 'Ordered' ? 'Ordered / Won' : stageId;
    setCreateModalInitialStage(stageLabel);
    setIsCreateModalOpen(true);
  };

  const handleDealCreated = (newDeal) => {
    const dealStage = newDeal?.stage || createModalInitialStage || 'New';
    const dealName = newDeal?.name || newDeal?.deal_name || 'New deal';

    const normalizedNewDeal = {
      ...newDeal,
      id: newDeal.id,
      name: dealName,
      account: newDeal.account || newDeal.account_name || 'Enterprise Account',
      stage: dealStage,
      amount: Number(newDeal.amount) || 0,
      closeDate: newDeal.closeDate || newDeal.close_date || newDeal.expected_close_date || '',
      salesRep: newDeal.salesRep || newDeal.sales_rep || newDeal.sales_rep_name || 'Unassigned',
      nextStep: newDeal.nextStep || newDeal.next_step || '',
      closureProbability: Number(
        newDeal.closureProbability ??
        newDeal.closure_probability ??
        newDeal.mlProbability ??
        newDeal.aiProbability ??
        50
      ),
    };

    setDeals((prev) => [normalizedNewDeal, ...prev]);

    // Show Confirmation Toast
    setToast({
      id: Date.now(),
      message: `"${dealName}" created in ${dealStage}.`,
    });

    // Re-fetch all deals & summary from Neon PostgreSQL in the background to ensure complete sync
    Promise.all([fetchDeals(), fetchDashboardSummary()]).then(([dealsRes, summaryRes]) => {
      if (dealsRes?.data?.length) {
        setDeals(dealsRes.data);
      }
      if (summaryRes?.data) {
        setSummary(summaryRes.data);
      }
    });
  };

  const toggleColumnExpand = (colId) => {
    setExpandedColumns((prev) => ({
      ...prev,
      [colId]: !prev[colId],
    }));
  };

  // Distinct sales reps for Owner dropdown
  const ownersList = useMemo(() => {
    const reps = new Set();
    deals.forEach((d) => {
      if (d.salesRep) reps.add(d.salesRep);
    });
    return Array.from(reps).sort();
  }, [deals]);

  // Filtered and sorted deals for Kanban board
  const filteredDeals = useMemo(() => {
    let result = deals.filter((deal) => {
      if (ownerFilter !== 'All' && deal.salesRep !== ownerFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (deal.name || '').toLowerCase().includes(q);
        const accountMatch = (deal.account || '').toLowerCase().includes(q);
        const repMatch = (deal.salesRep || '').toLowerCase().includes(q);
        return nameMatch || accountMatch || repMatch;
      }
      return true;
    });

    if (sortBy === 'value-desc') {
      result = [...result].sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
    } else if (sortBy === 'prob-desc') {
      result = [...result].sort(
        (a, b) =>
          Number(b.closureProbability ?? b.mlProbability ?? 50) -
          Number(a.closureProbability ?? a.mlProbability ?? 50)
      );
    } else if (sortBy === 'close-date') {
      result = [...result].sort((a, b) => {
        if (!a.closeDate) return 1;
        if (!b.closeDate) return -1;
        return a.closeDate.localeCompare(b.closeDate);
      });
    }

    return result;
  }, [deals, ownerFilter, searchQuery, sortBy]);

  // Group filtered deals by Kanban stage
  const dealsByColumn = useMemo(() => {
    const map = {
      New: [],
      Quoted: [],
      Negotiation: [],
      'Contract Signature': [],
      'Ordered / Won': [],
      'Action Required': [],
    };
    filteredDeals.forEach((d) => {
      const col = getDealColumn(d);
      if (map[col]) {
        map[col].push(d);
      } else {
        map['New'].push(d);
      }
    });
    return map;
  }, [filteredDeals]);

  // Summary strip metrics
  const openDeals = useMemo(() => {
    return deals.filter((d) => {
      const s = (d.stage || '').toLowerCase();
      return !s.includes('won') && !s.includes('lost') && !s.includes('ordered');
    });
  }, [deals]);

  const openPipelineValue = useMemo(() => {
    return openDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
  }, [openDeals]);

  const closedWonCount = useMemo(() => {
    return deals.filter((d) => {
      const s = (d.stage || '').toLowerCase();
      return s.includes('won') || s.includes('ordered');
    }).length;
  }, [deals]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#1f1d1a]" />
        <span className="text-xs font-medium text-[#6b645c]">Loading active sales pipeline...</span>
      </div>
    );
  }

  const hasDeals = deals.length > 0;

  return (
    <div className="space-y-6">
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#dcd1c1]">
        <div>
          <p className="text-[11px] font-bold tracking-wider text-[#6b645c] uppercase mb-1">
            REVENUE OPERATIONS · {deals.length.toLocaleString()} DEALS
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1f1d1a]">
            Sales pipeline
          </h1>
          <p className="text-xs text-[#6b645c] mt-1">
            Keep the next move clear, from first conversation to close.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleOpenCreateModal('New')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#c86d51] hover:bg-[#b35c42] rounded-lg transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New deal</span>
          </button>
          <Link
            to="/crm-analysis"
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#c86d51] hover:bg-[#b35c42] rounded-lg transition-colors shadow-2xs"
          >
            <UploadCloud className="w-4 h-4" />
            <span>+ Add CRM Data</span>
          </Link>
        </div>
      </div>

      {!hasDeals ? (
        <div className="bg-white border border-[#dcd1c1] rounded-xl p-12 text-center shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
          <div className="w-12 h-12 bg-[#f7f3ed] border border-[#dcd1c1] rounded-xl flex items-center justify-center mx-auto mb-4 text-[#1f1d1a]">
            <UploadCloud className="w-6 h-6 text-[#1f1d1a]" />
          </div>
          <h3 className="text-base font-bold text-[#1f1d1a]">No deals in pipeline</h3>
          <p className="text-xs text-[#6b645c] max-w-md mx-auto mt-1 mb-6">
            Upload your CRM pipeline CSV file to populate live deals, track stage distribution, and inspect deal probabilities.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenCreateModal('New')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#c86d51] text-white text-xs font-semibold rounded-lg hover:bg-[#b35c42] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ New deal</span>
            </button>
            <Link
              to="/crm-analysis"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#dcd1c1] text-[#1f1d1a] text-xs font-semibold rounded-lg hover:bg-[#f7f3ed] transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload CRM Data</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* 2. Summary Strip Card */}
          <div className="bg-white border border-[#dcd1c1] rounded-xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(31,29,26,0.05)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="grid grid-cols-3 gap-6 sm:gap-10">
              <div>
                <p className="text-[11px] font-semibold text-[#6b645c] uppercase tracking-wider mb-1">
                  Open pipeline
                </p>
                <p className="text-xl sm:text-2xl font-black text-[#1f1d1a] tabular-nums tracking-tight">
                  {formatINR(openPipelineValue)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#6b645c] uppercase tracking-wider mb-1">
                  Active deals
                </p>
                <p className="text-xl sm:text-2xl font-black text-[#1f1d1a] tabular-nums tracking-tight">
                  {openDeals.length.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-[#6b645c] uppercase tracking-wider mb-1">
                  Closed won
                </p>
                <p className="text-xl sm:text-2xl font-black text-[#157f68] tabular-nums tracking-tight">
                  {closedWonCount.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="text-xs font-medium text-[#6b645c] flex items-center gap-1.5 self-start md:self-center">
              <span>→ Move deals forward with a stage update</span>
            </div>
          </div>

          {/* 3. Kanban Filter Bar */}
          <div className="bg-white border border-[#dcd1c1] rounded-xl p-3 sm:p-3.5 shadow-[0_1px_3px_rgba(31,29,26,0.05)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative min-w-[200px] sm:min-w-[240px]">
                <Search className="w-3.5 h-3.5 text-[#8c827a] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Find a deal or account..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f7f3ed] border border-[#dcd1c1] rounded-lg text-[#1f1d1a] placeholder-[#8c827a] focus:outline-none focus:border-[#157f68] focus:bg-white transition-all"
                />
              </div>

              {/* Owner Dropdown */}
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                className="py-1.5 pl-2.5 pr-7 text-xs bg-[#f7f3ed] border border-[#dcd1c1] rounded-lg text-[#1f1d1a] font-medium focus:outline-none focus:border-[#157f68] focus:bg-white cursor-pointer transition-all"
              >
                <option value="All">All owners</option>
                {ownersList.map((owner, idx) => (
                  <option key={idx} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>

              {/* Sort By Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-1.5 pl-2.5 pr-7 text-xs bg-[#f7f3ed] border border-[#dcd1c1] rounded-lg text-[#1f1d1a] font-medium focus:outline-none focus:border-[#157f68] focus:bg-white cursor-pointer transition-all"
              >
                <option value="close-date">Sort: Close Date</option>
                <option value="value-desc">Sort: Value: High to Low</option>
                <option value="prob-desc">Sort: Win Probability</option>
              </select>
            </div>

            <div className="text-xs font-semibold text-[#6b645c] tabular-nums self-end sm:self-center">
              {filteredDeals.length.toLocaleString()} shown
            </div>
          </div>

          {/* 4. Horizontal Scrollable Kanban Columns */}
          <div className="overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-[1280px]">
              {KANBAN_STAGES.map((col) => {
                const colDeals = dealsByColumn[col.id] || [];
                const colTotal = colDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
                const isExpanded = Boolean(expandedColumns[col.id]);
                const displayDeals = isExpanded ? colDeals : colDeals.slice(0, 8);
                const hasMore = colDeals.length > 8;

                return (
                  <div
                    key={col.id}
                    className="flex-1 min-w-[210px] max-w-[240px] bg-[#f7f3ed] border border-[#dcd1c1] rounded-xl p-3 flex flex-col justify-between"
                  >
                    {/* Column Header */}
                    <div>
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#dcd1c1]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor} shrink-0`} />
                          <h4 className="text-xs font-bold text-[#1f1d1a] truncate">
                            {col.label}
                          </h4>
                        </div>
                        <span className="text-[10px] font-semibold text-[#6b645c] bg-white border border-[#dcd1c1] px-1.5 py-0.5 rounded-full tabular-nums">
                          {colDeals.length}
                        </span>
                      </div>
                      <div className="text-[11px] font-bold text-[#6b645c] tabular-nums mb-3">
                        {formatINR(colTotal)}
                      </div>

                      {/* Deal Cards Container */}
                      <div className="space-y-3">
                        {displayDeals.map((deal) => {
                          const prob = Number(
                            deal.closureProbability ??
                              deal.closure_probability ??
                              deal.mlProbability ??
                              deal.aiProbability ??
                              50
                          );
                          const isProbHigh = prob >= 70;
                          const isProbMid = prob >= 45;

                          const rawRep = (deal.salesRep || deal.sales_rep_name || deal.sales_rep || '').trim();
                          const hasRep = rawRep && rawRep.toLowerCase() !== 'unassigned' && rawRep.toLowerCase() !== 'sales ae';
                          const repName = hasRep ? rawRep : 'Unassigned';
                          const repParts = hasRep ? rawRep.split(/\s+/).filter(Boolean) : [];
                          const repInitials = repParts.length >= 2
                            ? (repParts[0][0] + repParts[1][0]).toUpperCase()
                            : repParts.length === 1
                            ? repParts[0].slice(0, 2).toUpperCase()
                            : 'UA';

                          const nextStepText = deal.nextStep || deal.next_step;

                          return (
                            <div
                              key={deal.id}
                              className="bg-white border border-[#dcd1c1] rounded-xl p-3 shadow-[0_1px_3px_rgba(31,29,26,0.05)] hover:shadow-xs transition-shadow flex flex-col justify-between"
                            >
                              <div>
                                {/* Top Badge Row */}
                                <div className="flex items-center justify-between gap-1 mb-1.5">
                                  <span className="text-[9px] font-mono font-medium text-[#6b645c] bg-[#f7f3ed] border border-[#dcd1c1] px-1.5 py-0.5 rounded">
                                    {deal.id.replace('deal-', '#')}
                                  </span>
                                  <span
                                    className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums border ${
                                      isProbHigh
                                        ? 'text-[#115e4d] bg-[#e2f2ee] border-[#b8e2d7]'
                                        : isProbMid
                                        ? 'text-[#8a5a00] bg-[#faefd4] border-[#f2dda7]'
                                        : 'text-[#9e2a2b] bg-[#fae3e3] border-[#f5c6c6]'
                                    }`}
                                  >
                                    {prob}% likely
                                  </span>
                                </div>

                                {/* Mini visual probability bar */}
                                <div className="w-full bg-[#f7f3ed] h-1 rounded-full overflow-hidden mb-2">
                                  <div
                                    style={{ width: `${Math.min(100, Math.max(5, prob))}%` }}
                                    className={`h-full rounded-full ${
                                      isProbHigh ? 'bg-[#157f68]' : isProbMid ? 'bg-[#d99b26]' : 'bg-[#c86d51]'
                                    }`}
                                  />
                                </div>

                                {/* Deal Name & Account */}
                                <h5 className="font-bold text-xs text-[#1f1d1a] line-clamp-1 mb-0.5">
                                  {deal.name}
                                </h5>
                                <p className="text-[11px] text-[#6b645c] truncate mb-2">
                                  {deal.account || 'Enterprise Account'}
                                </p>

                                {/* Value */}
                                <p className="text-xs font-black text-[#1f1d1a] tabular-nums mb-2">
                                  {formatINR(deal.amount || 0)}
                                </p>

                                {/* Rep & Close Date */}
                                <div className="flex items-center justify-between text-[10px] text-[#6b645c] pt-2 border-t border-[#ebe3d7]">
                                  <div className="flex items-center gap-1.5 min-w-0 max-w-[130px]">
                                    <div className="w-4 h-4 rounded-full bg-[#f7f3ed] border border-[#dcd1c1] text-[8px] font-bold text-[#1f1d1a] flex items-center justify-center shrink-0">
                                      {repInitials}
                                    </div>
                                    <span className="truncate" title={repName}>{repName}</span>
                                  </div>
                                  <span className="shrink-0">{deal.closeDate || 'Q4 FY25'}</span>
                                </div>

                                {/* Next Step (if present) */}
                                {nextStepText && (
                                  <div className="mt-2 text-[10px] text-[#6b645c] bg-[#f7f3ed] border border-[#dcd1c1] rounded-md px-2 py-1 flex items-start gap-1 line-clamp-2">
                                    <span className="font-semibold text-[#1f1d1a] shrink-0">Next:</span>
                                    <span className="truncate">{nextStepText}</span>
                                  </div>
                                )}
                              </div>

                              {/* Upgraded Move to Row with Current Stage Dropdown */}
                              <div className="mt-2.5 pt-2 border-t border-[#ebe3d7] flex items-center justify-between gap-1.5">
                                <span className="text-[10px] font-semibold text-[#6b645c] shrink-0">
                                  Move to
                                </span>
                                <div className="relative flex-1 max-w-[135px]">
                                  <select
                                    value={getDealColumn(deal)}
                                    disabled={movingDealId === deal.id}
                                    onChange={(e) => handleMoveStage(deal.id, e.target.value)}
                                    className="w-full text-[10px] font-semibold bg-[#f7f3ed] border border-[#dcd1c1] rounded px-2 py-1 text-[#1f1d1a] focus:outline-none focus:border-[#157f68] cursor-pointer appearance-none pr-5 truncate"
                                  >
                                    <option value="New">New</option>
                                    <option value="Quoted">Quoted</option>
                                    <option value="Negotiation">Negotiation</option>
                                    <option value="Contract Signature">Contract Signature</option>
                                    <option value="Ordered / Won">Ordered / Won</option>
                                    <option value="Action Required">Action Required</option>
                                  </select>
                                  <ChevronDown className="w-3 h-3 text-[#6b645c] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Column Footer: Show More Toggle & + Add a deal Button */}
                    <div className="mt-3 space-y-2">
                      {hasMore && (
                        <button
                          onClick={() => toggleColumnExpand(col.id)}
                          className="w-full py-1 text-[11px] font-semibold text-[#1f1d1a] bg-white border border-[#dcd1c1] hover:bg-[#f7f3ed] rounded-lg transition-colors cursor-pointer text-center"
                        >
                          {isExpanded ? 'Show less' : `+ Show ${colDeals.length - 8} more`}
                        </button>
                      )}

                      {/* Clean Light-Mode Dashed + Add a deal Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenCreateModal(col.id)}
                        className="w-full py-2 px-3 border border-dashed border-[#dcd1c1] hover:border-[#c86d51] bg-[#f7f3ed] hover:bg-white text-xs font-semibold text-[#6b645c] hover:text-[#1f1d1a] rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add a deal</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Upgraded Deals Table Directly Below the Kanban Board */}
          <div className="pt-4 border-t border-[#dcd1c1] space-y-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#1f1d1a]">
                Deals Directory & Full Audit
              </h3>
              <p className="text-xs text-[#6b645c] mt-0.5">
                Full tabular view with all 6 stage filter tabs, multi-criteria sorting, and instant CSV export.
              </p>
            </div>
            <InteractiveDealsTable deals={deals} />
          </div>
        </>
      )}

      {/* Light-Mode Create a deal Modal */}
      <CreateDealModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialStage={createModalInitialStage}
        ownersList={ownersList}
        onSuccess={handleDealCreated}
      />

      {/* Dismissible Top-Right Toast Notification */}
      {toast && (
        <div className="fixed top-18 right-6 z-50 flex items-center gap-3 bg-white border border-[#dcd1c1] rounded-xl px-4 py-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 max-w-sm">
          <div className="w-5 h-5 rounded-full bg-[#e2f2ee] border border-[#b8e2d7] flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 text-[#157f68]" />
          </div>
          <p className="text-xs font-semibold text-[#1f1d1a] flex-1">
            {toast.message}
          </p>
          <button
            onClick={() => setToast(null)}
            className="text-[#8c827a] hover:text-[#1f1d1a] p-1 transition-colors"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
