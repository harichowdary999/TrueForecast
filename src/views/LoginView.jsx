import React, { useState } from 'react';
import { Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

export function LoginView({ onLoginSuccess }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('TrueForecast@2026');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      // Validate credentials
      if (username.trim() === 'admin' && password === 'TrueForecast@2026') {
        const authData = {
          user: 'admin',
          name: 'RevOps Administrator',
          email: 'admin@trueforecast.in',
          role: 'SuperAdmin',
          token: 'tf_session_' + Date.now(),
        };
        localStorage.setItem('trueforecast_auth', JSON.stringify(authData));
        setLoading(false);
        if (onLoginSuccess) {
          onLoginSuccess(authData);
        }
      } else {
        setError('Invalid admin credentials. Please check your username and password.');
        setLoading(false);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#eee6da] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-[#c86d51] selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* 3-Bar Diagonal Hexagon Icon */}
        <div className="flex justify-center mb-4">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2.5L4.5 6.8V10.6L14.8 4.65L12 2.5Z" fill="#1f1d1a" />
            <path d="M19.5 6.8L4.5 15.45V17.2L7.2 18.75L19.5 11.65V6.8Z" fill="#1f1d1a" />
            <path d="M19.5 14.3L10.2 19.65L12 21.5L19.5 17.2V14.3Z" fill="#1f1d1a" />
          </svg>
        </div>

        <h2 className="text-center text-2xl font-bold tracking-tight text-[#1f1d1a]">
          TrueForecast
        </h2>
        <p className="mt-1 text-center text-xs text-[#6b645c]">
          Admin Portal Sign In · Machine Learning Revenue Intelligence
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-8 border border-[#dcd1c1] rounded-2xl shadow-[0_1px_3px_rgba(31,29,26,0.05)]">
          {error && (
            <div className="mb-4 p-3 bg-[#fae3e3] border border-[#f5c6c6] rounded-lg flex items-start gap-2 text-xs text-[#9e2a2b]">
              <AlertCircle className="w-4 h-4 text-[#9e2a2b] shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-[#1f1d1a] uppercase tracking-wider mb-1.5">
                Admin Username
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8c827a] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#f7f3ed] border border-[#dcd1c1] rounded-lg text-[#1f1d1a] placeholder-[#8c827a] focus:outline-none focus:border-[#157f68] focus:bg-white focus:ring-1 focus:ring-[#157f68] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1f1d1a] uppercase tracking-wider mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#8c827a] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#f7f3ed] border border-[#dcd1c1] rounded-lg text-[#1f1d1a] placeholder-[#8c827a] focus:outline-none focus:border-[#157f68] focus:bg-white focus:ring-1 focus:ring-[#157f68] transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#c86d51] hover:bg-[#b35c42] active:bg-[#9e4c34] text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
                {!loading && <ArrowRight className="w-3.5 h-3.5 ml-0.5" />}
              </button>
            </div>
          </form>

          {/* Default Credentials Hint Box */}
          <div className="mt-6 pt-5 border-t border-[#dcd1c1] text-center">
            <p className="text-[11px] text-[#6b645c]">
              Default Administrator Credentials:
            </p>
            <div className="mt-1.5 inline-flex items-center gap-2 px-3 py-1 bg-[#f7f3ed] border border-[#dcd1c1] rounded-md text-[11px] font-mono text-[#6b645c]">
              <span>Username: <strong className="text-[#1f1d1a]">admin</strong></span>
              <span>·</span>
              <span>Password: <strong className="text-[#1f1d1a]">TrueForecast@2026</strong></span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-center text-[11px] text-[#8c827a]">
          © 2026 TrueForecast. Protected by Enterprise RBAC & Audit Logging.
        </p>
      </div>
    </div>
  );
}
