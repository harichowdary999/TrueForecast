import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Sparkles, User, Settings, LogOut, CheckCircle } from 'lucide-react';

export function TopHeader({ onLogout }) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(true);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Dashboard', path: '/' },
    { label: 'Pipeline', path: '/pipeline' },
    { label: 'Forecast', path: '/forecast' },
    { label: 'Customers', path: '/customers' },
    { label: 'Sales Reps', path: '/sales-reps' },
    { label: 'Tasks', path: '/tasks' },
    { label: 'CRM Analysis', path: '/crm-analysis' },
  ];

  const handleSignOut = () => {
    setIsUserMenuOpen(false);
    localStorage.removeItem('trueforecast_auth');
    if (onLogout) {
      onLogout();
    } else {
      navigate('/login');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#f8f2e8] border-b border-[#E7D8C4]">
      <div className="w-full px-6 h-14 flex items-center justify-between gap-4">
        {/* Left: 3-Bar Diagonal Hexagon Icon + Brand Wordmark */}
        <div 
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 cursor-pointer group select-none shrink-0"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <path d="M12 2.5L4.5 6.8V10.6L14.8 4.65L12 2.5Z" fill="#1f1d1a" />
            <path d="M19.5 6.8L4.5 15.45V17.2L7.2 18.75L19.5 11.65V6.8Z" fill="#1f1d1a" />
            <path d="M19.5 14.3L10.2 19.65L12 21.5L19.5 17.2V14.3Z" fill="#1f1d1a" />
          </svg>
          <span className="font-bold text-base tracking-tight text-[#1f1d1a]">
            TrueForecast
          </span>
        </div>

        {/* Center: Navigation Links */}
        <nav className="flex items-center overflow-x-auto scrollbar-none py-1 space-x-1 sm:space-x-3 lg:space-x-5">
          {navLinks.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/'}
              className={({ isActive }) =>
                `text-xs sm:text-sm whitespace-nowrap transition-colors py-1 px-1.5 ${
                  isActive
                    ? 'font-bold text-[#1f1d1a]'
                    : 'font-normal text-[#786f65] hover:text-[#1f1d1a]'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Actions: Clean outline bell icon + Admin (AD) dropdown */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotificationPopup(!showNotificationPopup);
                setHasNotifications(false);
              }}
              className="p-1.5 text-[#1f1d1a] hover:bg-[#ebe1d1]/50 rounded-lg transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-[#1f1d1a]" />
              {hasNotifications && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#157f68] rounded-full ring-2 ring-[#f8f2e8]" />
              )}
            </button>

            {showNotificationPopup && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E7D8C4] rounded-lg shadow-lg p-3 z-50 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center justify-between pb-2 border-b border-[#E7D8C4]">
                  <span className="text-xs font-semibold text-[#1f1d1a] uppercase tracking-wider">Signals & Alerts</span>
                  <span className="text-[11px] text-[#157f68] font-medium bg-[#e2f2ee] px-1.5 py-0.5 rounded">3 New</span>
                </div>
                <div className="mt-2 space-y-2 text-xs text-[#786f65]">
                  <div className="p-2 bg-[#f7f3ed] rounded border border-[#E7D8C4]/80">
                    <p className="font-medium text-[#1f1d1a]">Divergence Alert: CloudScale</p>
                    <p className="text-[#786f65] mt-0.5">Rep gut 90% vs ML 38%. Legal inactivity detected.</p>
                  </div>
                  <div className="p-2 bg-[#f7f3ed] rounded border border-[#E7D8C4]/80">
                    <p className="font-medium text-[#1f1d1a]">Pipeline Sync Complete</p>
                    <p className="text-[#786f65] mt-0.5">75 deals calibrated against Q3 FY25 targets.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Vertical Hairline Divider */}
          <div className="h-4 w-[1px] bg-[#E7D8C4]" />

          {/* User Profile Avatar with Chevron */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1.5 p-1 hover:bg-[#ebe1d1]/50 rounded-lg transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-[#1f1d1a] text-white flex items-center justify-center text-xs font-semibold tracking-wider">
                AD
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#786f65]" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E7D8C4] rounded-lg shadow-lg py-1.5 z-50 text-xs">
                <div className="px-3 py-2 border-b border-[#E7D8C4]">
                  <p className="font-semibold text-[#1f1d1a]">Admin User</p>
                  <p className="text-[#786f65] truncate">admin@trueforecast.in</p>
                </div>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    navigate('/pipeline');
                  }}
                  className="w-full text-left px-3 py-2 text-[#1f1d1a] hover:bg-[#f7f3ed] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#157f68]" />
                  <span>Pipeline ML Calibration</span>
                </button>
                <button
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full text-left px-3 py-2 text-[#1f1d1a] hover:bg-[#f7f3ed] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Settings className="w-3.5 h-3.5 text-[#786f65]" />
                  <span>Settings & Integrations</span>
                </button>
                <div className="my-1 border-t border-[#E7D8C4]" />
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 text-[#9e2a2b] hover:bg-[#fae3e3] flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
