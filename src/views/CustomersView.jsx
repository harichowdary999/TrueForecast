import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Loader2, UploadCloud, ChevronRight, Filter } from 'lucide-react';
import { fetchCustomers } from '../services/api';
import { formatINR } from '../utils/formatCurrency';

export function CustomersView() {
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState({
    totalRelationships: 0,
    activeConversations: 0,
    newLeads: 0,
    customersCount: 0,
  });
  const [ownersList, setOwnersList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOwner, setSelectedOwner] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await fetchCustomers();
        if (isMounted) {
          const custList = Array.isArray(res.data) ? res.data : (res.customers || []);
          setCustomers(custList);
          if (res.summary) {
            setSummary(res.summary);
          } else {
            setSummary({
              totalRelationships: custList.length,
              activeConversations: custList.filter(c => c.activeDealsCount > 0).length,
              newLeads: custList.filter(c => (c.stage || '').toLowerCase().includes('discovery')).length,
              customersCount: custList.length,
            });
          }
          if (Array.isArray(res.owners) && res.owners.length > 0) {
            setOwnersList(res.owners);
          } else {
            const extracted = Array.from(new Set(custList.map(c => c.owner || c.salesRep).filter(Boolean)));
            setOwnersList(extracted);
          }
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

  const getStagePill = (stage) => {
    const s = (stage || '').toLowerCase();
    if (s.includes('contract') || s.includes('ordered') || s.includes('won')) {
      return 'bg-[#e2f2ee] text-[#115e4d] border-[#b8e2d7]';
    }
    if (s.includes('pilot') || s.includes('quoted')) {
      return 'bg-[#faefd4] text-[#8a5a00] border-[#f2dda7]';
    }
    if (s.includes('negotiat')) {
      return 'bg-[#e8f1f5] text-[#2b5b6c] border-[#c0d8e2]';
    }
    if (s.includes('action') || s.includes('lost')) {
      return 'bg-[#fae3e3] text-[#9e2a2b] border-[#f5c6c6]';
    }
    return 'bg-[#f7f3ed] text-[#6b645c] border-[#dcd1c1]';
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((cust) => {
      // Owner filter
      if (selectedOwner !== 'All') {
        const ownerName = cust.owner || cust.salesRep || '';
        if (ownerName !== selectedOwner) return false;
      }

      // Status filter
      if (selectedStatus !== 'All') {
        const stg = (cust.stage || '').toLowerCase();
        const target = selectedStatus.toLowerCase();
        if (target === 'discovery' && !stg.includes('discovery') && !stg.includes('new')) return false;
        if (target === 'quoted' && !stg.includes('quoted') && !stg.includes('pilot')) return false;
        if (target === 'negotiation' && !stg.includes('negotiat')) return false;
        if (target === 'contract signature' && !stg.includes('contract') && !stg.includes('security')) return false;
        if (target === 'ordered' && !stg.includes('ordered') && !stg.includes('won')) return false;
        if (target === 'action required' && !stg.includes('action') && !stg.includes('lost')) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (cust.name || '').toLowerCase().includes(q);
        const industryMatch = (cust.industry || '').toLowerCase().includes(q);
        const contactMatch = (cust.contactName || '').toLowerCase().includes(q);
        const emailMatch = (cust.contactEmail || '').toLowerCase().includes(q);
        const ownerMatch = (cust.owner || cust.salesRep || '').toLowerCase().includes(q);
        return nameMatch || industryMatch || contactMatch || emailMatch || ownerMatch;
      }

      return true;
    });
  }, [customers, searchQuery, selectedOwner, selectedStatus]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#1f1d1a]" />
        <span className="text-xs font-medium text-[#6b645c]">Loading customer organizations...</span>
      </div>
    );
  }

  const totalRelationships = summary.totalRelationships ?? summary.total_relationships ?? customers.length;
  const activeConversations = summary.activeConversations ?? summary.active_conversations ?? 0;
  const newLeads = summary.newLeads ?? summary.new_leads ?? 0;
  const customersCount = summary.customersCount ?? summary.customers_count ?? customers.length;

  return (
    <div className="space-y-6">
      {/* 1. Row 1: Top 4 Summary Metrics Card */}
      <div className="bg-white border border-[#dcd1c1] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#dcd1c1]">
          {/* Col 1: Total relationships */}
          <div className="p-5 sm:p-6">
            <p className="text-xs font-semibold text-[#6b645c] uppercase tracking-wider mb-2">
              Total relationships
            </p>
            <div className="text-2xl sm:text-3xl font-black text-[#1f1d1a] tabular-nums tracking-tight">
              {totalRelationships.toLocaleString()}
            </div>
            <p className="text-xs text-[#6b645c] mt-1.5">Enterprise accounts on record</p>
          </div>

          {/* Col 2: Active conversations */}
          <div className="p-5 sm:p-6">
            <p className="text-xs font-semibold text-[#6b645c] uppercase tracking-wider mb-2">
              Active conversations
            </p>
            <div className="text-2xl sm:text-3xl font-black text-[#1f1d1a] tabular-nums tracking-tight">
              {activeConversations.toLocaleString()}
            </div>
            <p className="text-xs text-[#6b645c] mt-1.5">Open pipeline engagements</p>
          </div>

          {/* Col 3: New leads */}
          <div className="p-5 sm:p-6">
            <p className="text-xs font-semibold text-[#6b645c] uppercase tracking-wider mb-2">
              New leads
            </p>
            <div className="text-2xl sm:text-3xl font-black text-[#1f1d1a] tabular-nums tracking-tight">
              {newLeads.toLocaleString()}
            </div>
            <p className="text-xs text-[#6b645c] mt-1.5">Discovery & qualification stage</p>
          </div>

          {/* Col 4: Customers */}
          <div className="p-5 sm:p-6">
            <p className="text-xs font-semibold text-[#6b645c] uppercase tracking-wider mb-2">
              Customers
            </p>
            <div className="text-2xl sm:text-3xl font-black text-[#1f1d1a] tabular-nums tracking-tight">
              {customersCount.toLocaleString()}
            </div>
            <p className="text-xs text-[#6b645c] mt-1.5">Won accounts & active contracts</p>
          </div>
        </div>
      </div>

      {/* 2. Row 2: Filter Bar Card */}
      <div className="bg-white border border-[#dcd1c1] rounded-xl p-4 shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 text-[#8c827a] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search people, accounts, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-[#f7f3ed] border border-[#dcd1c1] rounded-lg text-[#1f1d1a] placeholder-[#8c827a] focus:outline-none focus:border-[#157f68] focus:bg-white transition-all"
              />
            </div>

            {/* Owner Dropdown */}
            <div className="flex items-center gap-1.5">
              <select
                value={selectedOwner}
                onChange={(e) => setSelectedOwner(e.target.value)}
                className="py-2 pl-3 pr-8 text-xs bg-[#f7f3ed] border border-[#dcd1c1] rounded-lg text-[#1f1d1a] font-medium focus:outline-none focus:border-[#157f68] focus:bg-white cursor-pointer transition-all"
              >
                <option value="All">All owners</option>
                {ownersList.map((owner, idx) => (
                  <option key={idx} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Dropdown */}
            <div className="flex items-center gap-1.5">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="py-2 pl-3 pr-8 text-xs bg-[#f7f3ed] border border-[#dcd1c1] rounded-lg text-[#1f1d1a] font-medium focus:outline-none focus:border-[#157f68] focus:bg-white cursor-pointer transition-all"
              >
                <option value="All">All relationships</option>
                <option value="Discovery">Discovery</option>
                <option value="Quoted">Quoted / Pilot</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Contract Signature">Contract Signature</option>
                <option value="Ordered">Ordered / Won</option>
                <option value="Action Required">Action Required</option>
              </select>
            </div>
          </div>

          {/* Right-aligned Live Counter */}
          <div className="text-xs font-semibold text-[#6b645c] tabular-nums self-end md:self-center">
            {filteredCustomers.length.toLocaleString()} {filteredCustomers.length === 1 ? 'result' : 'results'}
          </div>
        </div>
      </div>

      {/* 3. Table of Accounts */}
      {customers.length === 0 ? (
        <div className="bg-white border border-[#dcd1c1] rounded-xl p-12 text-center shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
          <div className="w-12 h-12 bg-[#f7f3ed] border border-[#dcd1c1] rounded-xl flex items-center justify-center mx-auto mb-4 text-[#1f1d1a]">
            <UploadCloud className="w-6 h-6 text-[#1f1d1a]" />
          </div>
          <h3 className="text-base font-bold text-[#1f1d1a]">No customer accounts found</h3>
          <p className="text-xs text-[#6b645c] max-w-md mx-auto mt-1 mb-6">
            Upload your CRM pipeline CSV file to populate customer accounts, primary contacts, and contract values.
          </p>
          <Link
            to="/crm-analysis"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#c86d51] text-white text-xs font-semibold rounded-lg hover:bg-[#b35c42] transition-colors"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload CRM Data</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-[#dcd1c1] rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f7f3ed] text-[#6b645c] font-semibold border-b border-[#dcd1c1] uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-5">Account Name</th>
                  <th className="py-3 px-4">Industry & Tier</th>
                  <th className="py-3 px-4 text-right">Contract ARR</th>
                  <th className="py-3 px-4">Primary Contact</th>
                  <th className="py-3 px-4">Account Health</th>
                  <th className="py-3 px-4">Active Pipeline Stage</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ebe3d7]">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-[#6b645c]">
                      No accounts matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => {
                    const initials = (cust.name || 'AC')
                      .split(' ')
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();
                    const pillClass = getStagePill(cust.stage);
                    const targetId = cust.dealId || cust.id;

                    return (
                      <tr
                        key={cust.id}
                        onClick={() => navigate(`/customers/${targetId}`)}
                        className="hover:bg-[#f7f3ed] cursor-pointer transition-colors group"
                      >
                        {/* Account Name with Initials Avatar */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#f7f3ed] border border-[#dcd1c1] text-[#1f1d1a] flex items-center justify-center font-semibold text-xs tracking-wider shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="font-semibold text-[#1f1d1a] group-hover:text-[#c86d51] transition-colors">
                                {cust.name}
                              </div>
                              <div className="text-[11px] text-[#6b645c]">
                                {cust.owner || cust.salesRep ? `${cust.owner || cust.salesRep} · ` : ''}
                                {cust.activeDealsCount || 1} {(cust.activeDealsCount || 1) === 1 ? 'deal' : 'deals'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Industry & Tier */}
                        <td className="py-3.5 px-4">
                          <div className="text-[#1f1d1a] font-medium">{cust.industry || '—'}</div>
                          {cust.tier && <div className="text-[11px] text-[#6b645c]">{cust.tier}</div>}
                        </td>

                        {/* Contract ARR */}
                        <td className="py-3.5 px-4 text-right font-bold text-[#1f1d1a] tabular-nums">
                          {formatINR(cust.amount || cust.totalContractValue || 0)}
                        </td>

                        {/* Primary Contact */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-[#1f1d1a]">{cust.contactName || '—'}</div>
                          {cust.contactEmail && (
                            <div className="text-[11px] text-[#6b645c]">{cust.contactEmail}</div>
                          )}
                        </td>

                        {/* Account Health */}
                        <td className="py-3.5 px-4">
                          {cust.healthScore != null ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-[#f7f3ed] h-1.5 rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${cust.healthScore}%` }}
                                  className={`h-full rounded-full ${
                                    cust.healthScore >= 75
                                      ? 'bg-[#157f68]'
                                      : cust.healthScore >= 50
                                      ? 'bg-[#d99b26]'
                                      : 'bg-[#c86d51]'
                                  }`}
                                />
                              </div>
                              <span className="text-[11px] font-semibold text-[#1f1d1a] tabular-nums">
                                {cust.healthScore}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[#8c827a]">—</span>
                          )}
                        </td>

                        {/* Active Pipeline Stage */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${pillClass}`}
                          >
                            {cust.stage || '—'}
                          </span>
                        </td>

                        {/* Action Link */}
                        <td className="py-3.5 px-5 text-right">
                          <span className="inline-flex items-center text-xs font-semibold text-[#1f1d1a] group-hover:text-[#c86d51] transition-colors">
                            View Dossier
                            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
