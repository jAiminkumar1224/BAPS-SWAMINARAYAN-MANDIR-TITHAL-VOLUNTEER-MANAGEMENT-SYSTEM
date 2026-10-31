import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { Lock, Mail, ShieldAlert, KeyRound, CheckCircle2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { signIn, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isInitialSetup, setIsInitialSetup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        setErrorMsg('ખોટો ઈમેઇલ અથવા પાસવર્ડ દાખલ કર્યો છે.');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'લોગિન કરવામાં ભૂલ આવી.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg('કૃપા કરીને તમારો ઈમેઇલ દાખલ કરો.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const { error } = await resetPassword(email.trim());
      if (error) {
        setErrorMsg('પાસવર્ડ રીસેટ લિંક મોકલવામાં ભૂલ થઈ.');
      } else {
        setSuccessMsg('તમારા ઈમેઇલ પર પાસવર્ડ રીસેટ કરવાની લિંક મોકલી દેવાઈ છે.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'પાસવર્ડ રીસેટ લિંક મોકલવામાં ભૂલ થઈ.');
    } finally {
      setLoading(false);
    }
  };

  const handleInitialSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (!isSupabaseConfigured) {
        setErrorMsg('Supabase કનેક્ટેડ નથી. કૃપા કરીને પહેલા .env ફાઇલમાં Supabase પ્રોજેક્ટ કનેક્ટ કરો.');
        setLoading(false);
        return;
      }

      // Check if any admin already exists
      const { count } = await supabase
        .from('admin_profiles')
        .select('*', { count: 'exact', head: true });

      if (count && count > 0) {
        setErrorMsg('સુપર એડમિન પહેલેથી સેટઅપ કરેલ છે. કૃપા કરીને લોગિન કરો.');
        setIsInitialSetup(false);
        setLoading(false);
        return;
      }

      // Create initial user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Create initial Super Admin profile
        const { error: profileError } = await supabase.from('admin_profiles').insert({
          id: authData.user.id,
          full_name: fullName.trim() || 'સુપર એડમિન',
          role: 'super_admin',
        });

        if (profileError) throw profileError;

        setSuccessMsg('સુપર એડમિન એકાઉન્ટ સફળતાપૂર્વક બની ગયું છે! કૃપા કરીને હવે લોગિન કરો.');
        setIsInitialSetup(false);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'એડમિન સેટઅપમાં ભૂલ આવી.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFDF5] via-[#F7F3E3] to-[#ECE3C8] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border-2 border-[#C59B27] overflow-hidden">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#7F1D1D] text-white p-6 text-center border-b-2 border-[#DFC15D]">
          <div className="w-20 h-20 mx-auto mb-3 bg-white/10 rounded-full p-2 border-2 border-amber-300 flex items-center justify-center shadow-inner">
            <img src="/logo.png" alt="BAPS Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-amber-100">
            BAPS સ્વામિનારાયણ મંદિર
          </h2>
          <p className="text-sm text-amber-200/90 font-semibold mt-0.5">
            તીથલ - વલસાડ
          </p>
          <div className="mt-2 inline-block px-3 py-1 bg-black/25 rounded-full text-xs font-bold text-amber-300 border border-amber-400/30">
            સ્વયંસેવક આઈડી કાર્ડ એડમિન પોર્ટલ
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-8">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-600 text-red-700 text-sm rounded flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-700 text-sm rounded flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {!isForgotPassword && !isInitialSetup && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  ઈમેઇલ (Email)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@bapstithal.org"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-bold text-slate-700">
                    પાસવર્ડ (Password)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPassword(true)}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-900 transition"
                  >
                    પાસવર્ડ ભૂલી ગયા?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white font-extrabold rounded-lg shadow-md transition duration-150 flex items-center justify-center gap-2 text-base disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    લોગિન થાય છે...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-5 h-5 text-amber-300" />
                    લોગિન (Login)
                  </>
                )}
              </button>
            </form>
          )}

          {/* Forgot Password View */}
          {isForgotPassword && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  તમારો રજીસ્ટર્ડ ઈમેઇલ દાખલ કરો
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@bapstithal.org"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg shadow text-sm transition"
                >
                  પાસવર્ડ રીસેટ લિંક મોકલો
                </button>
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-sm transition"
                >
                  પાછા જાઓ
                </button>
              </div>
            </form>
          )}

          {/* Initial Super Admin Setup View */}
          {isInitialSetup && (
            <form onSubmit={handleInitialSetup} className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-300 text-xs text-amber-900 mb-3">
                <strong>પ્રથમ વખત સેટઅપ:</strong> અહીંથી તમારા મંદિર માટે પ્રથમ સુપર એડમિન એકાઉન્ટ સુરક્ષિત રીતે બનાવો.
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  પૂરું નામ (Full Name)
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="સુપર એડમિન તીથલ"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  ઈમેઇલ (Email)
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bapstithal.org"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  પાસવર્ડ (Password - ઓછામાં ઓછા 6 અક્ષર)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow text-sm transition"
                >
                  સુપર એડમિન બનાવો
                </button>
                <button
                  type="button"
                  onClick={() => setIsInitialSetup(false)}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-sm transition"
                >
                  રદ કરો
                </button>
              </div>
            </form>
          )}

          {/* Initial Super Admin Link Toggle */}
          {!isForgotPassword && !isInitialSetup && (
            <div className="mt-6 pt-4 border-t border-slate-200 text-center">
              <button
                type="button"
                onClick={() => setIsInitialSetup(true)}
                className="text-xs font-semibold text-slate-500 hover:text-amber-800 transition"
              >
                નવો સુપર એડમિન સેટઅપ કરવો છે? (પ્રથમ સેટઅપ)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
