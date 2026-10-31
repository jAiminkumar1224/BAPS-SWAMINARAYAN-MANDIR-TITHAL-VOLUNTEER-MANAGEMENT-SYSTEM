import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  Lock,
  Mail,
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  User,
  Phone,
  Laptop,
  ArrowRight,
  Clock,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';

export const Login: React.FC = () => {
  const { signIn, resetPassword } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'login' | 'it_register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isInitialSetup, setIsInitialSetup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Switch tabs and immediately empty all fields
  const switchTab = (tab: 'login' | 'it_register') => {
    setActiveTab(tab);
    setEmail('');
    setPassword('');
    setFullName('');
    setMobileNumber('');
    setErrorMsg('');
    setSuccessMsg('');
    setShowLoginPassword(false);
    setShowRegisterPassword(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const { error } = await signIn(email.trim(), password);
      if (error) {
        setErrorMsg(error.message || 'ખોટો ઈમેઇલ અથવા પાસવર્ડ દાખલ કર્યો છે.');
      } else {
        // Save plain_password & email in admin_profiles so Super Admin can always view their own / admin password
        if (isSupabaseConfigured) {
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user) {
            await supabase
              .from('admin_profiles')
              .update({
                plain_password: password,
                email: email.trim(),
              })
              .eq('id', userData.user.id);
          }
        }
        navigate('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'લોગિન કરવામાં ભૂલ આવી.');
    } finally {
      setLoading(false);
    }
  };

  const handleItRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (!isSupabaseConfigured) {
        // Mock fallback
        setSuccessMsg(
          'તમારી SSD IT સ્વયંસેવક વિનંતી સફળતાપૂર્વક સુપર એડમિનને મોકલાઈ ગઈ છે! સુપર એડમિન દ્વારા મંજૂરી (Approval) મળ્યા પછી જ તમે લોગિન કરી શકશો.'
        );
        switchTab('login');
        setLoading(false);
        return;
      }

      if (!fullName.trim()) {
        setErrorMsg('કૃપા કરીને તમારું પૂરું નામ દાખલ કરો.');
        setLoading(false);
        return;
      }

      if (!mobileNumber.trim()) {
        setErrorMsg('કૃપા કરીને તમારો મોબાઇલ નંબર દાખલ કરો.');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setErrorMsg('પાસવર્ડ ઓછામાં ઓછા 6 અક્ષરનો હોવો જોઈએ.');
        setLoading(false);
        return;
      }

      // Call secure database RPC which registers user in auth.users and admin_profiles
      // with email_confirmed_at = now() - bypassing Supabase email rate limits completely!
      const { data: rpcRes, error: rpcError } = await supabase.rpc('register_it_volunteer', {
        p_full_name: fullName.trim(),
        p_email: email.trim(),
        p_mobile_number: mobileNumber.trim(),
        p_password: password,
        p_status: 'pending',
      });

      if (rpcError) {
        throw rpcError;
      }

      if (rpcRes && !rpcRes.success) {
        setErrorMsg(rpcRes.message || 'આ ઈમેઇલ પહેલેથી નોંધાયેલ છે.');
        return;
      }

      // Always clear fields and switch to login tab with clear instructions
      switchTab('login');
      setSuccessMsg(
        'તમારી SSD IT સ્વયંસેવક વિનંતી સફળતાપૂર્વક સુપર એડમિનને મોકલાઈ ગઈ છે! સુપર એડમિન દ્વારા મંજૂરી (Approval) મળ્યા પછી જ તમે લોગિન કરી શકશો.'
      );
    } catch (err: any) {
      console.error('Error during IT volunteer registration:', err);
      setErrorMsg(err.message || 'વિનંતી મોકલવામાં ભૂલ આવી. કૃપા કરીને ફરી પ્રયાસ કરો.');
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
        setErrorMsg('Supabase કનેક્ટેડ નથી.');
        setLoading(false);
        return;
      }

      const { count } = await supabase
        .from('admin_profiles')
        .select('*', { count: 'exact', head: true });

      if (count && count > 0) {
        setErrorMsg('સુપર એડમિન પહેલેથી સેટઅપ કરેલ છે. કૃપા કરીને લોગિન કરો.');
        setIsInitialSetup(false);
        setLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim() || 'સુપર એડમિન',
          },
        },
      });

      if (authError) throw authError;

      if (!authData.session) {
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
      }

      if (authData.user) {
        await supabase.from('admin_profiles').upsert({
          id: authData.user.id,
          full_name: fullName.trim() || 'સુપર એડમિન',
          role: 'super_admin',
          status: 'approved',
        });

        setSuccessMsg('સુપર એડમિન એકાઉન્ટ તૈયાર થઈ ગયું છે! હવે લોગિન કરો.');
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
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-600 text-red-700 text-xs sm:text-sm rounded flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-800 text-xs sm:text-sm rounded flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB SELECTOR: Login vs SSD IT Svayamsevak Request */}
          {!isForgotPassword && !isInitialSetup && (
            <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200">
              <button
                type="button"
                onClick={() => switchTab('login')}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition ${
                  activeTab === 'login'
                    ? 'bg-amber-700 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                લોગિન (Login)
              </button>
              <button
                type="button"
                onClick={() => switchTab('it_register')}
                className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'it_register'
                    ? 'bg-amber-700 text-white shadow'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span>SSD IT સ્વયંસેવક</span>
              </button>
            </div>
          )}

          {/* VIEW 1: STANDARD LOGIN FORM */}
          {!isForgotPassword && !isInitialSetup && activeTab === 'login' && (
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
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                    title={showLoginPassword ? 'પાસવર્ડ છુપાવો' : 'પાસવર્ડ જુઓ'}
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-5 h-5 text-slate-600" />
                    ) : (
                      <Eye className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
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

          {/* VIEW 2: SSD IT SVAYAMSEVAK REGISTRATION / ACCESS REQUEST */}
          {!isForgotPassword && !isInitialSetup && activeTab === 'it_register' && (
            <form onSubmit={handleItRegister} className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-xs text-amber-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>SSD IT સ્વયંસેવક નોંધણી સૂચના:</span>
                </div>
                <p>
                  અહીંથી વિનંતી મોકલ્યા બાદ તમારી વિનંતી <strong>સુપર એડમિન</strong> પાસે જશે. સુપર એડમિન મંજૂર કરશે ત્યાર બાદ જ તમે લોગિન કરી શકશો.
                </p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  સ્વયંસેવકનું પૂરું નામ (Full Name) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="દા.ત. અક્ષય પટેલ"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  મોબાઇલ નંબર (Mobile Number) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    placeholder="દા.ત. 9876543210"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  ઈમેઇલ (Email) *
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
                    placeholder="તમારો ઈમેઇલ દાખલ કરો"
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  પાસવર્ડ (Password - ઓછામાં ઓછા 6 અક્ષર) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showRegisterPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                    title={showRegisterPassword ? 'પાસવર્ડ છુપાવો' : 'પાસવર્ડ જુઓ'}
                  >
                    {showRegisterPassword ? (
                      <EyeOff className="w-5 h-5 text-slate-600" />
                    ) : (
                      <Eye className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-900 hover:from-emerald-800 hover:to-emerald-950 text-white font-extrabold rounded-lg shadow-md transition duration-150 flex items-center justify-center gap-2 text-base disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    વિનંતી મોકલાઈ રહી છે...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-amber-300" />
                    SSD IT સ્વયંસેવક વિનંતી મોકલો
                  </>
                )}
              </button>
            </form>
          )}

          {/* VIEW 3: FORGOT PASSWORD */}
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

          {/* VIEW 4: INITIAL SUPER ADMIN SETUP */}
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

        </div>
      </div>
    </div>
  );
};
