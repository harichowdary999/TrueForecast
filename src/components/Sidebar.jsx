import React, { useState } from 'react';
import { 
  Home, 
  Layers, 
  TrendingUp, 
  User, 
  Users, 
  FileText, 
  RefreshCw,
} from 'lucide-react';

export const Sidebar = ({
  activeView,
  onSelectView,
  lastSyncTime,
  onTriggerSync,
  isSyncing,
}) => {
  const [syncSuccess, setSyncSuccess] = useState(false);

  const handleManualSync = () => {
    onTriggerSync();
    setSyncSuccess(true);
    setTimeout(() => setSyncSuccess(false), 3000);
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
    },
    {
      id: 'pipeline',
      label: 'Pipeline',
      icon: Layers,
    },
    {
      id: 'forecast',
      label: 'Forecast',
      icon: TrendingUp,
    },
    {
      id: 'sales-reps',
      label: 'Sales Reps',
      icon: User,
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
    },
  ];

  return (
    <aside className="w-60 bg-[#0c1424] text-white flex flex-col justify-between shrink-0 min-h-screen select-none border-r border-[#1e293b]">
      <div>
        {/* Brand: TrueForecast with 3 vertical blue bars */}
        <div className="p-5 flex items-center gap-3">
          <div className="flex items-end gap-1 h-6">
            <span className="w-1.5 h-3 bg-[#2563eb] rounded-xs" />
            <span className="w-1.5 h-4.5 bg-[#2563eb] rounded-xs" />
            <span className="w-1.5 h-6 bg-[#2563eb] rounded-xs" />
          </div>
          <span className="font-display font-extrabold text-[20px] text-white tracking-tight">
            TrueForecast
          </span>
        </div>

        {/* 6 Nav Items */}
        <nav className="px-3 pt-2 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[14px] font-medium transition-all text-left ${
                  isActive
                    ? 'bg-[#2563eb] text-white shadow-md shadow-[#2563eb]/30 font-semibold'
                    : 'text-[#94a3b8] hover:text-white hover:bg-[#162238]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#94a3b8]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer CRM Ingestion status */}
      <div className="p-4 border-t border-[#1e293b] m-3 bg-[#131d33] rounded-xl text-xs space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-white">CRM Synced</span>
          </div>
          <span className="text-[10px] text-[#94a3b8] tabular-nums">{lastSyncTime}</span>
        </div>

        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-[#1e293b] hover:bg-[#27354f] text-[#cbd5e1] hover:text-white rounded-lg text-[11px] font-medium transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-[#2563eb]' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : syncSuccess ? 'Refreshed!' : 'Sync CRM Now'}</span>
        </button>
      </div>
    </aside>
  );
};
