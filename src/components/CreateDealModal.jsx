import React, { useState, useEffect, useMemo } from 'react';
import { X, Loader2 } from 'lucide-react';
import { createDeal, fetchSalesReps } from '../services/api';

export function CreateDealModal({
  isOpen,
  onClose,
  initialStage = 'New',
  ownersList = [],
  onSuccess,
}) {
  const [dealName, setDealName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState('');
  const [stage, setStage] = useState('New');
  const [winProbability, setWinProbability] = useState(50);
  const [expectedClose, setExpectedClose] = useState('');
  const [dealOwner, setDealOwner] = useState('Unassigned');
  const [leadSource, setLeadSource] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [salesReps, setSalesReps] = useState([]);

  // Fetch live sales reps from backend
  useEffect(() => {
    let isMounted = true;
    async function loadReps() {
      try {
        const res = await fetchSalesReps();
        if (isMounted && res.data && res.data.length > 0) {
          const names = res.data.map((r) => r.name).filter(Boolean);
          setSalesReps(names);
        }
      } catch (err) {
        console.error('Failed to fetch sales reps for deal creation:', err);
      }
    }
    loadReps();
    return () => {
      isMounted = false;
    };
  }, []);

  // Merge live reps from /api/sales-reps, ownersList, and known core reps
  const allOwners = useMemo(() => {
    const coreReps = [
      'Hari Chowdary',
      'Vamsi Krishna',
      'Akash J',
      'Vijay Vardhan',
      'Thippeswamy',
    ];
    const set = new Set();
    coreReps.forEach((r) => set.add(r));
    salesReps.forEach((r) => set.add(r));
    ownersList.forEach((o) => {
      if (o && o !== 'Unassigned') set.add(o);
    });
    return Array.from(set).sort();
  }, [salesReps, ownersList]);

  // Sync stage and reset fields whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setStage(initialStage || 'New');
      setDealName('');
      setAccountName('');
      setAmount('');
      setWinProbability(50);
      setLeadSource('');
      setNextStep('');
      setErrorMessage(null);

      // Default expected close to 45 days from today
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 45);
      setExpectedClose(defaultDate.toISOString().split('T')[0]);

      setDealOwner('Unassigned');
    }
  }, [isOpen, initialStage]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dealName.trim()) {
      setErrorMessage('Deal name is required.');
      return;
    }
    if (!accountName.trim()) {
      setErrorMessage('Account name is required.');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setErrorMessage('Please enter a valid deal value.');
      return;
    }
    if (!nextStep.trim()) {
      setErrorMessage('Next step is required to keep deal momentum clear.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    const payload = {
      deal_name: dealName.trim(),
      name: dealName.trim(),
      account_name: accountName.trim(),
      account: accountName.trim(),
      amount: parseFloat(amount),
      stage: stage,
      win_probability: parseInt(winProbability, 10),
      expected_close_date: expectedClose,
      close_date: expectedClose,
      sales_rep_name: dealOwner !== 'Unassigned' ? dealOwner : null,
      sales_rep: dealOwner !== 'Unassigned' ? dealOwner : null,
      lead_source: leadSource.trim() || null,
      next_step: nextStep.trim() || null,
    };

    try {
      const res = await createDeal(payload);
      if (res.success && res.data) {
        if (onSuccess) {
          onSuccess(res.data);
        }
        onClose();
      } else {
        setErrorMessage(res.error || 'Failed to create deal. Please try again.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1f1d1a]/40 backdrop-blur-xs">
      <div className="bg-white border border-[#dcd1c1] rounded-2xl w-full max-w-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#dcd1c1]">
          <div>
            <h3 className="text-base font-bold text-[#1f1d1a]">Create a deal</h3>
            <p className="text-xs text-[#6b645c] mt-0.5">
              Keep the value, owner, and next step current.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#6b645c] hover:text-[#1f1d1a] rounded-lg hover:bg-[#f7f3ed] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error notification */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-[#fae3e3] border border-[#f5c6c6] text-xs text-[#9e2a2b] rounded-lg">
            {errorMessage}
          </div>
        )}

        {/* 2-Column Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Row 1: Deal name * | Account * */}
            <div>
              <label className="block text-xs font-semibold text-[#1f1d1a] mb-1">
                Deal name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Regional data platform"
                value={dealName}
                onChange={(e) => setDealName(e.target.value)}
                className="w-full text-xs bg-[#f7f3ed] border border-[#dcd1c1] rounded-lg px-3 py-2 text-[#1f1d1a] placeholder-[#8c827a] focus:outline-none focus:border-[#157f68] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1f1d1a] mb-1">
                Account *
              </label>
              <input
                type="text"
                required
                placeholder="Company name"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="w-full text-xs bg-[#f7f3ed] border border-[#dcd1c1] rounded-lg px-3 py-2 text-[#1f1d1a] placeholder-[#8c827a] focus:outline-none focus:border-[#157f68] focus:bg-white transition-all"
              />
            </div>

            {/* Row 2: Deal value (₹) * | Pipeline stage */}
            <div>
              <label className="block text-xs font-semibold text-[#1f1d1a] mb-1">
                Deal value (₹) *
              </label>
              <input
                type="number"
                required
                min="0"
                step="1000"
                placeholder="25000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-xs bg-[#f7f3ed] border border-[#dcd1c1] rounded-lg px-3 py-2 text-[#1f1d1a] placeholder-[#8c827a] focus:outline-none focus:border-[#157f68] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1f1d1a] mb-1">
                Pipeline stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full text-xs bg-[#f7f3ed] border border-[#dcd1c1] rounded-lg px-3 py-2 text-[#1f1d1a] font-medium focus:outline-none focus:border-[#157f68] focus:bg-white cursor-pointer transition-all"
              >
                <option value="New">New</option>
                <option value="Quoted">Quoted</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Contract Signature">Contract Signature</option>
                <option value="Ordered / Won">Ordered / Won</option>
                <option value="Action Required">Action Required</option>
              </select>
            </div>

            {/* Row 3: Win probability | Expected close * */}
            <div className="bg-[#f7f3ed] border border-[#dcd1c1] rounded-lg p-2.5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-[#1f1d1a]">
                  Win probability
                </label>
                <span className="text-xs font-bold text-[#115e4d] bg-[#e2f2ee] border border-[#b8e2d7] px-2 py-0.5 rounded tabular-nums">
                  {winProbability}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={winProbability}
                onChange={(e) => setWinProbability(Number(e.target.value))}
                className="w-full h-1.5 bg-[#dcd1c1] rounded-lg appearance-none cursor-pointer accent-[#157f68]"
              />
              <div className="flex justify-between text-[10px] text-[#6b645c] mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1f1d1a] mb-1">
                Expected close *
              </label>
              <input
                type="date"
                required
                value={expectedClose}
                onChange={(e) => setExpectedClose(e.target.value)}
                className="w-full text-xs bg-[#f7f3ed] border border-[#dcd1c1] rounded-lg px-3 py-2 text-[#1f1d1a] focus:outline-none focus:border-[#157f68] focus:bg-white transition-all cursor-pointer"
              />
            </div>

            {/* Row 4: Deal owner | Lead source */}
            <div>
              <label className="block text-xs font-semibold text-[#1f1d1a] mb-1">
                Deal owner
              </label>
              <select
                value={dealOwner}
                onChange={(e) => setDealOwner(e.target.value)}
                className="w-full text-xs bg-[#f7f3ed] border border-[#dcd1c1] rounded-lg px-3 py-2 text-[#1f1d1a] font-medium focus:outline-none focus:border-[#157f68] focus:bg-white cursor-pointer transition-all"
              >
                <option value="Unassigned">Unassigned</option>
                {allOwners.map((owner, idx) => (
                  <option key={idx} value={owner}>
                    {owner}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1f1d1a] mb-1">
                Lead source
              </label>
              <input
                type="text"
                placeholder="e.g. Partner referral"
                value={leadSource}
                onChange={(e) => setLeadSource(e.target.value)}
                className="w-full text-xs bg-[#f7f3ed] border border-[#dcd1c1] rounded-lg px-3 py-2 text-[#1f1d1a] placeholder-[#8c827a] focus:outline-none focus:border-[#157f68] focus:bg-white transition-all"
              />
            </div>

            {/* Row 5 (full width): Next step * */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#1f1d1a] mb-1">
                Next step *
              </label>
              <input
                type="text"
                required
                placeholder="What happens next?"
                value={nextStep}
                onChange={(e) => setNextStep(e.target.value)}
                className="w-full text-xs bg-[#f7f3ed] border border-[#dcd1c1] rounded-lg px-3 py-2 text-[#1f1d1a] placeholder-[#8c827a] focus:outline-none focus:border-[#157f68] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#dcd1c1]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-[#6b645c] bg-white border border-[#dcd1c1] hover:bg-[#f7f3ed] hover:text-[#1f1d1a] rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#c86d51] hover:bg-[#b35c42] rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating deal...</span>
                </>
              ) : (
                <span>Create deal</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
