import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, ChevronRight } from 'lucide-react';
import { formatINR } from '../utils/formatCurrency';

/**
 * Deterministic Logistic Regression win probability fallback calculation
 */
export function calculateLogisticRegressionProbability(deal) {
  if (deal.closureProbability !== undefined && deal.closureProbability !== null) {
    return Number(deal.closureProbability);
  }
  if (deal.mlProbability !== undefined && deal.mlProbability !== null) {
    return Number(deal.mlProbability);
  }
  if (deal.aiProbability !== undefined && deal.aiProbability !== null) {
    return Number(deal.aiProbability);
  }
  if (deal.probability !== undefined && deal.probability !== null) {
    return Number(deal.probability);
  }

  // Logistic regression logit formulation
  const stage = (deal.stage || '').toLowerCase();
  let z = 0.5; // base logit ~62%
  if (stage.includes('contract') || stage.includes('ordered') || stage.includes('won')) {
    z = 2.4; // ~92%
  } else if (stage.includes('pilot') || stage.includes('quoted') || stage.includes('proposal') || stage.includes('negotiat')) {
    z = 1.25; // ~78%
  } else if (stage.includes('discover') || stage.includes('new')) {
    z = -0.2; // ~45%
  }

  const daysInStage = Number(deal.daysInStage || 10);
  if (daysInStage > 20) z -= 0.85;
  if (deal.divergenceDetected) z -= 1.1;
  if ((deal.healthScore || 80) < 50) z -= 0.7;

  // Sigmoid activation: 1 / (1 + exp(-z))
  const prob = 1 / (1 + Math.exp(-z));
  return Math.min(99, Math.max(5, Math.round(prob * 100)));
}

export function InteractiveDealsTable({ deals = [] }) {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState('All Statuses');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedDealIds, setSelectedDealIds] = useState([]);

  const tabs = [
    'All Statuses',
    'New',
    'Quoted',
    'Negotiation',
    'Contract Signature',
    'Ordered',
    'Action Required',
  ];

  // Helper to normalize deal status into one of the 6 buckets
  const getMappedStatus = (deal) => {
    if (deal.divergenceDetected || (deal.healthScore !== undefined && deal.healthScore < 50) || deal.stage === 'Action Required' || (deal.stage || '').toLowerCase().includes('lost')) {
      return 'Action Required';
    }
    const stage = (deal.stage || '').toLowerCase();
    if (stage.includes('ordered') || stage.includes('won')) {
      return 'Ordered';
    }
    if (stage.includes('contract') || stage.includes('security') || stage.includes('legal') || stage.includes('closing')) {
      return 'Contract Signature';
    }
    if (stage.includes('negotiat')) {
      return 'Negotiation';
    }
    if (stage.includes('pilot') || stage.includes('quoted') || stage.includes('proposal') || stage.includes('evaluation')) {
      return 'Quoted';
    }
    return 'New';
  };

  // Status pill styling
  const getStatusPill = (status) => {
    switch (status) {
      case 'Ordered':
        return {
          bg: 'bg-[#e2f2ee] text-[#115e4d] border-[#b8e2d7]',
          dot: 'bg-[#157f68]',
          label: 'Ordered',
        };
      case 'Contract Signature':
        return {
          bg: 'bg-[#e2f2ee] text-[#115e4d] border-[#b8e2d7]',
          dot: 'bg-[#157f68]',
          label: 'Contract Signature',
        };
      case 'Negotiation':
        return {
          bg: 'bg-[#e8f1f5] text-[#2b5b6c] border-[#c0d8e2]',
          dot: 'bg-[#2b5b6c]',
          label: 'Negotiation',
        };
      case 'Quoted':
        return {
          bg: 'bg-[#faefd4] text-[#8a5a00] border-[#f2dda7]',
          dot: 'bg-[#d99b26]',
          label: 'Quoted',
        };
      case 'Action Required':
        return {
          bg: 'bg-[#fae3e3] text-[#9e2a2b] border-[#f5c6c6]',
          dot: 'bg-[#c86d51]',
          label: 'Action Required',
        };
      case 'New':
      default:
        return {
          bg: 'bg-[#f7f3ed] text-[#6b645c] border-[#dcd1c1]',
          dot: 'bg-[#8c7b6c]',
          label: 'New',
        };
    }
  };

  // Probability badge & bar style
  const getProbabilityStyle = (prob) => {
    if (prob >= 75) {
      return {
        badge: 'text-[#115e4d] bg-[#e2f2ee] border-[#b8e2d7]',
        bar: 'bg-[#157f68]',
      };
    }
    if (prob >= 45) {
      return {
        badge: 'text-[#8a5a00] bg-[#faefd4] border-[#f2dda7]',
        bar: 'bg-[#d99b26]',
      };
    }
    return {
      badge: 'text-[#9e2a2b] bg-[#fae3e3] border-[#f5c6c6]',
      bar: 'bg-[#c86d51]',
    };
  };

  // Filtered and sorted deals
  const filteredDeals = useMemo(() => {
    let result = deals.filter((deal) => {
      const mappedStatus = getMappedStatus(deal);
      if (selectedTab !== 'All Statuses' && mappedStatus !== selectedTab) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = (deal.name || '').toLowerCase().includes(query);
        const accountMatch = (deal.account || '').toLowerCase().includes(query);
        const repMatch = (deal.salesRep || '').toLowerCase().includes(query);
        return nameMatch || accountMatch || repMatch;
      }
      return true;
    });

    // Apply sorting
    if (sortBy === 'value-desc') {
      result = [...result].sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
    } else if (sortBy === 'value-asc') {
      result = [...result].sort((a, b) => (Number(a.amount) || 0) - (Number(b.amount) || 0));
    } else if (sortBy === 'prob-desc') {
      result = [...result].sort((a, b) => calculateLogisticRegressionProbability(b) - calculateLogisticRegressionProbability(a));
    } else if (sortBy === 'newest') {
      result = [...result].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
    }

    return result;
  }, [deals, selectedTab, searchQuery, sortBy]);

  // Master checkbox selection
  const isAllSelected = filteredDeals.length > 0 && selectedDealIds.length === filteredDeals.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedDealIds([]);
    } else {
      setSelectedDealIds(filteredDeals.map((d) => d.id));
    }
  };

  const handleToggleSelectDeal = (e, dealId) => {
    e.stopPropagation();
    setSelectedDealIds((prev) =>
      prev.includes(dealId) ? prev.filter((id) => id !== dealId) : [...prev, dealId]
    );
  };

  // Export CSV
  const handleExportCsv = () => {
    const dealsToExport = selectedDealIds.length > 0
      ? deals.filter((d) => selectedDealIds.includes(d.id))
      : filteredDeals;

    const headers = ['Deal ID', 'Account Name', 'Deal Title', 'Status', 'Deal Value (INR)', 'ML Probability (%)', 'Sales Rep', 'Health Score'];
    const rows = dealsToExport.map((d) => [
      `"${d.id || ''}"`,
      `"${d.account || ''}"`,
      `"${d.name || ''}"`,
      `"${getMappedStatus(d)}"`,
      d.amount || 0,
      `${calculateLogisticRegressionProbability(d)}%`,
      `"${d.salesRep || 'AE Team'}"`,
      d.healthScore ?? '—',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `trueforecast_deals_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white border border-[#dcd1c1] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
      {/* Controls Header - Clean overflow-x-auto with zero vertical clipping */}
      <div className="px-5 py-3 border-b border-[#dcd1c1] flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Status Filter Tabs with Active Deep Espresso Underline */}
        <div className="flex items-center gap-6 overflow-x-auto py-1">
          {tabs.map((tab) => {
            const isActive = selectedTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`py-2 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap -mb-[5px] ${
                  isActive
                    ? 'border-[#1f1d1a] text-[#1f1d1a] font-semibold'
                    : 'border-transparent text-[#6b645c] hover:text-[#1f1d1a]'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Right: Search Input + Sort Dropdown + Export Button */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#8c827a] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search deals, reps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-[#f7f3ed] border border-[#dcd1c1] rounded-lg text-[#1f1d1a] placeholder-[#8c827a] focus:outline-none focus:border-[#157f68] focus:bg-white w-40 sm:w-56 transition-all"
            />
          </div>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="py-1.5 pl-2.5 pr-7 text-xs bg-[#f7f3ed] border border-[#dcd1c1] rounded-lg text-[#1f1d1a] font-medium focus:outline-none focus:border-[#157f68] focus:bg-white cursor-pointer transition-all shrink-0"
          >
            <option value="newest">Sort by: Newest / Updated</option>
            <option value="value-desc">Sort by: Value: High to Low</option>
            <option value="value-asc">Sort by: Value: Low to High</option>
            <option value="prob-desc">Sort by: Closure Probability: High to Low</option>
          </select>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1f1d1a] bg-white border border-[#dcd1c1] rounded-lg hover:bg-[#f7f3ed] hover:border-[#c86d51] transition-colors shadow-2xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#6b645c]" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Deals Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f7f3ed] text-[#6b645c] font-semibold border-b border-[#dcd1c1] uppercase tracking-wider text-[11px]">
            <tr>
              <th className="py-3 px-4 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleToggleSelectAll}
                  className="rounded border-[#dcd1c1] accent-[#157f68] text-[#157f68] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
              </th>
              <th className="py-3 px-4">Deal / Account</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Value</th>
              <th className="py-3 px-4">Closure Probability</th>
              <th className="py-3 px-4">Rep / Region</th>
              <th className="py-3 px-4">Updated</th>
              <th className="py-3 px-4 text-right w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ebe3d7]">
            {filteredDeals.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-12 text-center text-[#6b645c]">
                  No deals found matching the current filter.
                </td>
              </tr>
            ) : (
              filteredDeals.map((deal) => {
                const status = getMappedStatus(deal);
                const pill = getStatusPill(status);
                const prob = calculateLogisticRegressionProbability(deal);
                const probStyle = getProbabilityStyle(prob);
                const isSelected = selectedDealIds.includes(deal.id);
                const initials = (deal.account || deal.name || 'DE')
                  .split(' ')
                  .map((w) => w[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                return (
                  <tr
                    key={deal.id}
                    onClick={() => navigate(`/customers/${deal.id}`)}
                    className="hover:bg-[#f7f3ed] cursor-pointer transition-colors group"
                  >
                    {/* Checkbox */}
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleToggleSelectDeal(e, deal.id)}
                        className="rounded border-[#dcd1c1] accent-[#157f68] text-[#157f68] focus:ring-0 cursor-pointer"
                      />
                    </td>

                    {/* Initials Avatar + Deal/Account Name */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#f7f3ed] border border-[#dcd1c1] text-[#1f1d1a] flex items-center justify-center font-semibold text-xs tracking-wider shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="font-semibold text-[#1f1d1a] group-hover:text-[#c86d51] transition-colors">
                            {deal.name || '—'}
                          </div>
                          <div className="text-[11px] text-[#6b645c]">
                            {deal.account || '—'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Pastel Status Pill (with colored dot) */}
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${pill.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${pill.dot}`} />
                        {pill.label}
                      </span>
                    </td>

                    {/* Deal Value in INR */}
                    <td className="py-3.5 px-4 text-right font-bold text-[#1f1d1a] tabular-nums">
                      {formatINR(deal.amount || 0)}
                    </td>

                    {/* Closure Probability Column (ML Logistic Regression) */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tabular-nums border ${probStyle.badge}`}>
                          {prob}%
                        </span>
                        <div className="w-16 bg-[#f7f3ed] h-1.5 rounded-full overflow-hidden shrink-0 hidden sm:block">
                          <div
                            style={{ width: `${prob}%` }}
                            className={`h-full rounded-full ${probStyle.bar}`}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Rep / Region */}
                    <td className="py-3.5 px-4">
                      <div className="text-[#1f1d1a] font-medium">
                        {deal.salesRep || '—'}
                      </div>
                      <div className="text-[11px] text-[#6b645c]">
                        {deal.region || deal.crmSource || '—'}
                      </div>
                    </td>

                    {/* Updated / Close Date */}
                    <td className="py-3.5 px-4 text-[#6b645c] tabular-nums">
                      {deal.closeDate || '—'}
                    </td>

                    {/* Chevron Link */}
                    <td className="py-3.5 px-4 text-right text-[#8c827a] group-hover:text-[#1f1d1a]">
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer showing count */}
      <div className="p-3 bg-[#f7f3ed] border-t border-[#dcd1c1] text-[11px] text-[#6b645c] flex items-center justify-between px-5">
        <span>Showing {filteredDeals.length} of {deals.length} deals</span>
        <span className="font-medium text-[#1f1d1a]">Click any row to view deal details</span>
      </div>
    </div>
  );
}
