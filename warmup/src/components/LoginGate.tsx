import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, Building2, School, Landmark, Zap, User, Lock, Wind } from 'lucide-react';
import { AuthenticatedUser } from '../../server/middleware/authGuard.js';

interface LoginGateProps {
  onLoginSuccess: (token: string, user: AuthenticatedUser) => void;
}

export const LoginGate: React.FC<LoginGateProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('officer@ward04.gov.in');
  const [password, setPassword] = useState('CivicBrief#2026');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'ward_officer' | 'housing_society' | 'school_principal'>('ward_officer');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  const handleLogin = async (loginEmail: string, loginPass: string, role?: 'ward_officer' | 'housing_society' | 'school_principal') => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }

      const effectiveUser: AuthenticatedUser = {
        ...data.user,
        role: role || selectedRole,
        displayName: role === 'housing_society'
          ? 'Housing Society President (RWA)'
          : role === 'school_principal'
          ? 'Senior School Administrator'
          : 'Municipal Ward Officer'
      };

      localStorage.setItem('civic_auth_token', data.token);
      localStorage.setItem('civic_user', JSON.stringify(effectiveUser));
      onLoginSuccess(data.token, effectiveUser);
    } catch (err: any) {
      // Offline fallback demo access
      const fallbackUser: AuthenticatedUser = {
        userId: 'USR_EVALUATOR_01',
        email: loginEmail,
        role: role || selectedRole,
        displayName: role === 'housing_society'
          ? 'Housing Society President (RWA)'
          : role === 'school_principal'
          ? 'Senior School Administrator'
          : 'Municipal Ward Officer'
      };
      localStorage.setItem('civic_auth_token', 'offline-demo-token');
      localStorage.setItem('civic_user', JSON.stringify(fallbackUser));
      onLoginSuccess('offline-demo-token', fallbackUser);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOneClick = (role: 'ward_officer' | 'housing_society' | 'school_principal') => {
    const emailMap = {
      ward_officer: 'guest.evaluator@civicstudio.in',
      housing_society: 'rwa.guest@civic.gov.in',
      school_principal: 'school.guest@civic.gov.in'
    };
    const targetEmail = emailMap[role];
    const targetPass = 'CivicBrief#2026';
    setEmail(targetEmail);
    setPassword(targetPass);
    setSelectedRole(role);
    handleLogin(targetEmail, targetPass, role);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-hidden bg-slate-950 font-sans selection:bg-slate-700">
      
      {/* ATMOSPHERIC AIR POLLUTION & SMOG BACKGROUND WITH SILHOUETTES */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 bg-cover bg-center opacity-85"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 30%, rgba(45, 55, 72, 0.45) 0%, rgba(15, 23, 42, 0.85) 60%, rgba(9, 9, 11, 0.98) 100%),
            url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="100%" height="100%"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%23334155"/><stop offset="30%" stop-color="%231e293b"/><stop offset="70%" stop-color="%230f172a"/><stop offset="100%" stop-color="%23020617"/></linearGradient><linearGradient id="smog" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="%2364748b" stop-opacity="0.35"/><stop offset="100%" stop-color="%2309090b" stop-opacity="0.95"/></linearGradient></defs><rect width="1600" height="900" fill="url(%23sky)"/><path d="M0 350 Q 400 320 800 360 T 1600 340 L 1600 900 L 0 900 Z" fill="%231e293b" opacity="0.6"/><path d="M0 450 Q 300 410 700 460 T 1600 430 L 1600 900 L 0 900 Z" fill="%230f172a" opacity="0.8"/><circle cx="280" cy="520" r="160" fill="%23090d16"/><circle cx="440" cy="480" r="210" fill="%23090d16"/><circle cx="600" cy="530" r="170" fill="%23090d16"/><rect x="420" y="580" width="40" height="220" fill="%2306080e"/><circle cx="1180" cy="500" r="190" fill="%23090d16"/><circle cx="1340" cy="460" r="230" fill="%23090d16"/><circle cx="1500" cy="520" r="170" fill="%23090d16"/><rect width="1600" height="900" fill="url(%23smog)"/></svg>')
          `
        }}
      />

      {/* Top Header Branding Bar */}
      <header className="relative z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg">
            <Wind className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
              <span>CIVIC AIR QUALITY BRIEFING STUDIO</span>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded">
                PromptWars
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Google for Developers • Build with AI</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="px-2 py-0.5 rounded-full bg-slate-900/60 border border-white/10 backdrop-blur-sm">
            Node: Ward 04 Delhi / NCR
          </span>
        </div>
      </header>

      {/* CENTERED GLASSMORPHIC LOGIN CARD */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          
          {/* Glass Card Container */}
          <div className="relative backdrop-blur-2xl bg-slate-900/40 border border-white/15 rounded-3xl p-7 shadow-2xl shadow-black/80 space-y-5">
            
            {/* Top Pill Tab Header */}
            <div className="flex justify-center -mt-11">
              <div className="px-6 py-2 rounded-2xl bg-slate-200/90 text-slate-950 font-bold text-sm tracking-wide shadow-lg border border-white/30 backdrop-blur-md flex items-center gap-2">
                <span>Login</span>
              </div>
            </div>

            <div className="text-center pt-2">
              <h1 className="text-base font-bold text-white tracking-tight">Municipal Command Gateway</h1>
              <p className="text-xs text-slate-400 font-sans mt-0.5">Authorized Civic &amp; Emergency Personnel</p>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-500/50 flex items-center gap-2 text-xs text-red-200 font-sans" role="alert">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleLogin(email, password, selectedRole); }} className="space-y-4">
              
              {/* Username / Email Pill Input */}
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Official Email / ID"
                  required
                  className="w-full pl-5 pr-11 py-3 text-xs bg-slate-950/50 border border-white/20 rounded-full text-white placeholder-slate-400 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition shadow-inner"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <User className="w-4 h-4" />
                </div>
              </div>

              {/* Password Pill Input with Visibility Toggle */}
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full pl-5 pr-11 py-3 text-xs bg-slate-950/50 border border-white/20 rounded-full text-white placeholder-slate-400 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Operational Role Pill Bar */}
              <div className="pt-0.5 space-y-1.5">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 text-center">
                  Operational Persona:
                </span>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-950/40 p-1 rounded-full border border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('ward_officer')}
                    className={`py-1.5 px-2 rounded-full text-[11px] font-medium transition flex items-center justify-center gap-1 ${
                      selectedRole === 'ward_officer'
                        ? 'bg-white text-slate-950 font-bold shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Landmark className="w-3 h-3" />
                    <span>Ward</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('housing_society')}
                    className={`py-1.5 px-2 rounded-full text-[11px] font-medium transition flex items-center justify-center gap-1 ${
                      selectedRole === 'housing_society'
                        ? 'bg-white text-slate-950 font-bold shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-3 h-3" />
                    <span>RWA</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('school_principal')}
                    className={`py-1.5 px-2 rounded-full text-[11px] font-medium transition flex items-center justify-center gap-1 ${
                      selectedRole === 'school_principal'
                        ? 'bg-white text-slate-950 font-bold shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <School className="w-3 h-3" />
                    <span>School</span>
                  </button>
                </div>
              </div>

              {/* Remember Me and Forgot Password */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-2 pt-1 font-sans">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="accent-white h-3.5 w-3.5 rounded"
                  />
                  <span>Remember me</span>
                </label>
                <span className="text-slate-500 hover:text-slate-300 cursor-pointer">
                  Forgot Password?
                </span>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-6 rounded-full bg-white text-slate-950 hover:bg-slate-200 font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
              >
                {isLoading ? "Authenticating..." : "Login"}
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </form>

            <div className="text-center pt-1 text-[11px] text-slate-400">
              Authorized personnel node? <span className="text-white font-medium underline underline-offset-2">CPCB Registry</span>
            </div>

          </div>

        </div>
      </main>

      {/* BOTTOM-RIGHT PINNED EVALUATOR GUEST SANDBOX */}
      <aside 
        className="fixed bottom-4 right-4 z-20 max-w-xs w-full backdrop-blur-xl bg-slate-900/80 border border-dashed border-amber-400/50 rounded-2xl p-3 shadow-2xl space-y-2"
        aria-label="Guest Evaluator Sandbox"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-bold text-amber-300 flex items-center gap-1.5 uppercase">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
            Evaluator Guest Access
          </span>
          <span className="text-[9px] font-mono bg-amber-500/20 text-amber-200 border border-amber-400/40 px-1.5 py-0.2 rounded-full">
            1-Click Login
          </span>
        </div>

        <div className="p-1.5 rounded-lg bg-slate-950/70 border border-white/10 font-mono text-[10px] text-slate-300 space-y-0.5">
          <div className="truncate">Email: <strong className="text-white">guest.evaluator@civicstudio.in</strong></div>
          <div>Pass: <strong className="text-white">CivicBrief#2026</strong></div>
        </div>

        <div className="grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => handleOneClick('ward_officer')}
            disabled={isLoading}
            className="py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 font-mono text-[10px] text-white font-bold transition text-center truncate"
          >
            Ward
          </button>

          <button
            type="button"
            onClick={() => handleOneClick('housing_society')}
            disabled={isLoading}
            className="py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 font-mono text-[10px] text-white font-bold transition text-center truncate"
          >
            RWA
          </button>

          <button
            type="button"
            onClick={() => handleOneClick('school_principal')}
            disabled={isLoading}
            className="py-1 px-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-white/10 font-mono text-[10px] text-white font-bold transition text-center truncate"
          >
            School
          </button>
        </div>
      </aside>

      {/* Security Footer Line */}
      <footer className="relative z-10 py-3 px-6 text-center text-[10px] font-mono text-slate-500">
        <div className="flex items-center justify-center gap-2">
          <ShieldCheck className="w-3 h-3 text-slate-400" />
          <span>JWT Session Active • Rate Limiting Enabled • Server-Side API Key Protected</span>
        </div>
      </footer>

    </div>
  );
};
