import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  TrendingUp, 
  Target, 
  RefreshCw, 
  Briefcase, 
  Award,
  ChevronRight,
  Filter
} from 'lucide-react';
import { fetchSalesReps } from '../services/api';
import { formatINR } from '../utils/formatCurrency';

export function SalesRepsView() {
  const [reps, setReps] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pacingFilter, setPacingFilter] = useState('All');
  const [searchParams] = useSearchParams();
  const highlightedRep = searchParams.get('rep');

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetchSalesReps();
      if (res.data) {
        setReps(res.data);
      }
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err) {
      console.error('Failed to fetch sales reps:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered reps
  const filteredReps = useMemo(() => {
    return reps.filter((rep) => {
      // Pacing filter
      if (pacingFilter !== 'All' && rep.pacing_status !== pacingFilter && rep.pacingStatus !== pacingFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (rep.name || '').toLowerCase().includes(q);
        const emailMatch = (rep.email || '').toLowerCase().includes(q);
        const phoneMatch = (rep.phone || '').toLowerCase().includes(q);
        const titleMatch = (rep.title || '').toLowerCase().includes(q);
        return nameMatch || emailMatch || phoneMatch || titleMatch;
      }

      return true;
    });
  }, [reps, pacingFilter, searchQuery]);

  // Overall metrics calculation
  const totalPipeline = useMemo(() => {
    return reps.reduce((sum, r) => sum + (Number(r.active_pipeline_value || r.activePipelineValue) || 0), 0);
  }, [reps]);

  const avgAttainment = useMemo(() => {
    if (!reps.length) return 0;
    const total = reps.reduce((sum, r) => sum + (Number(r.attainment_pct || r.attainmentPct) || 0), 0);
    return Math.round((total / reps.length) * 10) / 10;
  }, [reps]);

  // Render Pacing Status Badge
  const renderPacingBadge = (status) => {
    switch (status) {
      case 'Target Exceeded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#e2f2ee] text-[#115e4d] border border-[#b8e2d7]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#157f68] animate-pulse" />
            Target Exceeded
          </span>
        );
      case 'On Track':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#e2f2ee] text-[#115e4d] border border-[#b8e2d7]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#157f68]" />
            On Track
          </span>
        );
      case 'Pacing OK':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#faefd4] text-[#8a5a00] border border-[#f2dda7]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d99b26]" />
            Pacing OK
          </span>
        );
      case 'At Risk':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#fae3e3] text-[#9e2a2b] border border-[#f5c6c6]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c86d51]" />
            At Risk
          </span>
        );
    }
  };

  // Render Attainment Color
  const getAttainmentColor = (pct) => {
    if (pct >= 85) return 'text-[#115e4d] bg-[#e2f2ee] border-[#b8e2d7]';
    if (pct >= 55) return 'text-[#8a5a00] bg-[#faefd4] border-[#f2dda7]';
    return 'text-[#9e2a2b] bg-[#fae3e3] border-[#f5c6c6]';
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#dcd1c1] bg-white text-xs text-[#6b645c] shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
          <span className="w-2 h-2 rounded-full bg-[#157f68] animate-pulse"></span>
          Loading Sales Representatives from Neon PostgreSQL...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Card */}
      <div className="bg-white border border-[#dcd1c1] rounded-2xl p-6 shadow-[0_1px_3px_rgba(31,29,26,0.05)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#1f1d1a] flex items-center justify-center shrink-0 shadow-xs">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-wider text-[#6b645c] uppercase mb-1">
              TEAM REVENUE OPS · {reps.length} EXECUTIVES
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-[#1f1d1a]">
              Cohort & Account Executive Performance
            </h1>
            <p className="text-xs text-[#6b645c] mt-1">
              Rep pipeline attainment and live contact directory.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1f1d1a] bg-[#f7f3ed] hover:bg-white border border-[#dcd1c1] rounded-lg transition-colors cursor-pointer"
            title="Refresh reps"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#dcd1c1] rounded-xl p-4 shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
          <p className="text-xs text-[#6b645c] font-medium">Active Representatives</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-[#1f1d1a] tabular-nums">
              {reps.length}
            </span>
            <span className="text-xs text-[#6b645c]">executives</span>
          </div>
          <p className="text-[11px] text-[#6b645c] mt-1">
            Neon PostgreSQL directory
          </p>
        </div>

        <div className="bg-white border border-[#dcd1c1] rounded-xl p-4 shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
          <p className="text-xs text-[#6b645c] font-medium">Total Active Pipeline</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-[#1f1d1a] tabular-nums">
              {formatINR(totalPipeline)}
            </span>
          </div>
          <p className="text-[11px] text-[#6b645c] mt-1">
            Across open pipeline deals
          </p>
        </div>

        <div className="bg-white border border-[#dcd1c1] rounded-xl p-4 shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
          <p className="text-xs text-[#6b645c] font-medium">Average Attainment</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-[#1f1d1a] tabular-nums">
              {avgAttainment}%
            </span>
            <span className="text-xs text-[#157f68] font-semibold">team average</span>
          </div>
          <p className="text-[11px] text-[#6b645c] mt-1">
            Against individual targets
          </p>
        </div>

        <div className="bg-white border border-[#dcd1c1] rounded-xl p-4 shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
          <p className="text-xs text-[#6b645c] font-medium">On Track or Exceeded</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-[#157f68] tabular-nums">
              {reps.filter(r => r.pacing_status === 'Target Exceeded' || r.pacing_status === 'On Track').length}
            </span>
            <span className="text-xs text-[#6b645c]">of {reps.length} reps</span>
          </div>
          <p className="text-[11px] text-[#6b645c] mt-1">
            Healthy pacing velocity
          </p>
        </div>
      </div>

      {/* 3. Main Table Card */}
      <div className="bg-white border border-[#dcd1c1] rounded-xl shadow-[0_1px_3px_rgba(31,29,26,0.05)] overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-[#dcd1c1] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Pacing Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#f7f3ed] p-1 rounded-lg border border-[#dcd1c1] shrink-0 overflow-x-auto">
            {['All', 'Target Exceeded', 'On Track', 'Pacing OK', 'At Risk'].map((status) => (
              <button
                key={status}
                onClick={() => setPacingFilter(status)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  pacingFilter === status
                    ? 'bg-white text-[#1f1d1a] font-semibold shadow-xs'
                    : 'text-[#6b645c] hover:text-[#1f1d1a]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-[#8c827a] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reps by name, email, phone..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#dcd1c1] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#157f68] focus:border-[#157f68] placeholder:text-[#8c827a] text-[#1f1d1a]"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#dcd1c1] bg-[#f7f3ed] text-[10px] font-bold text-[#6b645c] uppercase tracking-wider">
                <th className="py-3 px-5">SALES REPRESENTATIVE</th>
                <th className="py-3 px-5">ACTIVE PIPELINE</th>
                <th className="py-3 px-5">EMAIL</th>
                <th className="py-3 px-5">MOBILE NUMBER</th>
                <th className="py-3 px-5">ATTAINMENT %</th>
                <th className="py-3 px-5">PACING STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebe3d7] text-xs">
              {filteredReps.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-[#6b645c]">
                    No sales representatives matching current filter.
                  </td>
                </tr>
              ) : (
                filteredReps.map((rep) => {
                  const isHighlighted = highlightedRep && rep.name.toLowerCase() === highlightedRep.toLowerCase();
                  const pipelineVal = rep.active_pipeline_value || rep.activePipelineValue || 0;
                  const dealsCount = rep.active_deals_count || rep.activeDealsCount || 0;
                  const attainmentPct = rep.attainment_pct || rep.attainmentPct || 0;
                  const pacingStatus = rep.pacing_status || rep.pacingStatus || 'On Track';

                  const repParts = (rep.name || '').trim().split(' ');
                  const initials = repParts.length
                    ? (repParts[0][0] + (repParts[1]?.[0] || '')).toUpperCase()
                    : 'SR';

                  return (
                    <tr
                      key={rep.id}
                      className={`hover:bg-[#f7f3ed] transition-colors ${
                        isHighlighted ? 'bg-[#faefd4]/60 border-l-4 border-l-[#d99b26]' : ''
                      }`}
                    >
                      {/* 1. SALES REPRESENTATIVE */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#1f1d1a] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div>
                            <p className="font-semibold text-[#1f1d1a]">
                              {rep.name}
                            </p>
                            <p className="text-[11px] text-[#6b645c]">
                              {rep.title || 'Account Executive'} · {dealsCount} active {dealsCount === 1 ? 'deal' : 'deals'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. ACTIVE PIPELINE */}
                      <td className="py-3.5 px-5">
                        <div>
                          <p className="font-bold text-[#1f1d1a] tabular-nums">
                            {formatINR(pipelineVal)}
                          </p>
                          <p className="text-[10px] text-[#6b645c]">
                            Target: {formatINR(rep.quota_target || rep.quota || 8500000)}
                          </p>
                        </div>
                      </td>

                      {/* 3. EMAIL */}
                      <td className="py-3.5 px-5">
                        <a
                          href={`mailto:${rep.email}`}
                          className="inline-flex items-center gap-1.5 text-[#1f1d1a] hover:text-[#c86d51] hover:underline transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5 text-[#8c827a]" />
                          <span>{rep.email || '—'}</span>
                        </a>
                      </td>

                      {/* 4. MOBILE NUMBER */}
                      <td className="py-3.5 px-5">
                        <a
                          href={`tel:${rep.phone}`}
                          className="inline-flex items-center gap-1.5 text-[#1f1d1a] hover:text-[#c86d51] hover:underline font-mono text-[11px] transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#8c827a]" />
                          <span>{rep.phone || '—'}</span>
                        </a>
                      </td>

                      {/* 5. ATTAINMENT % */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold tabular-nums border ${getAttainmentColor(attainmentPct)}`}>
                            {attainmentPct}%
                          </span>
                        </div>
                      </td>

                      {/* 6. PACING STATUS */}
                      <td className="py-3.5 px-5">
                        {renderPacingBadge(pacingStatus)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
