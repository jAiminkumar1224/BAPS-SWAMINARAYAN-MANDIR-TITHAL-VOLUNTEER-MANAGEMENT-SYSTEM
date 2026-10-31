import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured, getStoragePublicUrl } from '../lib/supabase';
import { VerificationData } from '../types';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Building2,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export const VerifyVolunteer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (id) {
      verifyId(id.trim());
    }
  }, [id]);

  const verifyId = async (volunteerIdQuery: string) => {
    setLoading(true);
    setNotFound(false);

    try {
      if (!isSupabaseConfigured) {
        // Fallback for mock/local verification
        const saved = localStorage.getItem('baps_mock_volunteers');
        const list = saved ? JSON.parse(saved) : [];
        const found = list.find(
          (v: any) =>
            v.volunteer_id.toUpperCase() === volunteerIdQuery.toUpperCase() ||
            v.id === volunteerIdQuery
        );

        if (found) {
          setData({
            volunteer_id: found.volunteer_id,
            name: found.name,
            village_name: found.village_name,
            xetra_name: found.xetra_name,
            seva_vibhag_name: found.seva_vibhag?.name || 'સ્વયંસેવક દળ',
            photo_path: found.photo_path,
            created_at: found.created_at,
            is_valid: true,
            email: found.email || null,
            mobile_number: found.mobile_number || null,
            group_name: found.group_name || null,
            duty_start_date: found.duty_start_date || null,
            duty_end_date: found.duty_end_date || null,
          });
        } else {
          setNotFound(true);
        }
        setLoading(false);
        return;
      }

      // Call secure Supabase database function: verify_volunteer_v2(p_volunteer_id)
      const { data: rpcData, error } = await supabase.rpc('verify_volunteer_v2', {
        p_volunteer_id: volunteerIdQuery,
      });

      if (!error && rpcData && rpcData.length > 0) {
        setData(rpcData[0] as VerificationData);
      } else {
        // Fallback: try legacy verify_volunteer
        const { data: legacyData, error: legacyErr } = await supabase.rpc('verify_volunteer', {
          p_volunteer_id: volunteerIdQuery,
        });

        if (!legacyErr && legacyData && legacyData.length > 0) {
          setData(legacyData[0] as VerificationData);
        } else {
          setNotFound(true);
        }
      }
    } catch (err) {
      console.error('Error during verification:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format YYYY-MM-DD into DD/MM/YYYY
  const formatDisplayDate = (dStr?: string | null): string => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dStr;
  };

  // Real-time Date Window & Status Evaluation
  const evaluateDutyStatus = () => {
    if (!data?.duty_start_date || !data?.duty_end_date) {
      return {
        status: 'active' as const,
        title: 'સત્તાવાર પ્રમાણિત સ્વયંસેવક',
        badgeText: 'સક્રિય / પ્રમાણિત',
        message: 'BAPS સ્વામિનારાયણ મંદિર તીથલ - માન્ય ઓળખકાર્ડ',
        color: 'emerald',
      };
    }

    // Get current date string in IST (Asia/Kolkata) as YYYY-MM-DD
    const todayStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    const startStr = data.duty_start_date;
    const endStr = data.duty_end_date;

    const formattedStart = formatDisplayDate(startStr);
    const formattedEnd = formatDisplayDate(endStr);

    if (todayStr < startStr) {
      // 1. BEFORE DUTY WINDOW (e.g. 1/11 to 9/11 for Group Keshav)
      return {
        status: 'upcoming' as const,
        title: 'આગામી સેવા સમયગાળો (Upcoming Duty)',
        badgeText: 'આગામી સેવા',
        message: `આપ ની સેવા ${formattedStart} થી લઈ ને ${formattedEnd} સુધી છે, આપે આ તારીખ દરમિયાન સેવામાં જોડાઈ ને સ્વામીશ્રી ના રાજીપા નો લાભ લેવો.`,
        color: 'amber',
      };
    } else if (todayStr >= startStr && todayStr <= endStr) {
      // 2. ACTIVE DUTY WINDOW (Real-time active)
      return {
        status: 'active' as const,
        title: 'સક્રિય સેવા આઈડી (Active Volunteer)',
        badgeText: 'સક્રિય સેવા (Active)',
        message: `સેવા સમયગાળો: ${formattedStart} થી ${formattedEnd} - સેવા કાર્ય ચાલુ છે.`,
        color: 'emerald',
      };
    } else {
      // 3. AFTER DUTY WINDOW (DEACTIVATED)
      return {
        status: 'deactivated' as const,
        title: 'સેવા પૂર્ણ થયેલ છે (Deactivated ID)',
        badgeText: 'સેવા પૂર્ણ / નિષ્ક્રિય',
        message: 'આપ ની સેવા પૂર્ણ થયેલ છે, આપ હવે સ્વામીશ્રી નો લાભ લેવા વિનંતી.',
        color: 'rose',
      };
    }
  };

  const dutyEvaluation = data ? evaluateDutyStatus() : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFFDF5] via-[#FAF6E9] to-[#ECE3C8] flex flex-col justify-between p-4 sm:p-6 font-gujarati">
      {/* Top Bar with Temple Logo */}
      <header className="max-w-xl mx-auto w-full flex items-center justify-between pb-6 border-b border-amber-900/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full p-1.5 bg-white shadow-md border-2 border-[#C59B27] flex items-center justify-center">
            <img src="/logo.png" alt="BAPS" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="font-black text-base sm:text-lg text-[#800000] leading-tight">
              BAPS સ્વામિનારાયણ મંદિર
            </h1>
            <p className="text-xs text-[#8A6818] font-bold">તીથલ - વલસાડ</p>
          </div>
        </div>

        <Link
          to="/login"
          className="text-xs font-bold text-amber-900 hover:text-amber-950 px-3 py-1.5 rounded-lg bg-amber-100/60 border border-amber-300/40"
        >
          એડમિન પોર્ટલ &rarr;
        </Link>
      </header>

      {/* Main Verification Card */}
      <main className="max-w-xl mx-auto w-full my-6">
        <div className="bg-white rounded-3xl shadow-2xl border-2 border-[#C59B27] overflow-hidden">
          {/* Top Status Header */}
          {loading ? (
            <div className="bg-slate-100 p-8 text-center text-slate-500 font-bold text-sm">
              <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              આઈડી કાર્ડ ચકાસણી થઈ રહી છે...
            </div>
          ) : notFound || !data ? (
            <div className="bg-gradient-to-r from-rose-700 via-rose-800 to-rose-900 text-white p-6 text-center">
              <div className="w-14 h-14 bg-white/20 rounded-full mx-auto flex items-center justify-center mb-2">
                <XCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-black">અમાન્ય આઈડી કાર્ડ (Invalid ID)</h2>
              <p className="text-xs text-rose-100 mt-1">
                આ આઈડી નંબર ધરાવતું કોઈ સત્તાવાર કાર્ડ BAPS તીથલ સિસ્ટમમાં મળ્યું નથી.
              </p>
            </div>
          ) : (
            <div
              className={`text-white p-6 text-center border-b-2 ${
                dutyEvaluation?.color === 'rose'
                  ? 'bg-gradient-to-r from-rose-700 via-rose-800 to-rose-900 border-rose-500'
                  : dutyEvaluation?.color === 'amber'
                  ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 border-amber-400'
                  : 'bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-900 border-emerald-500'
              }`}
            >
              <div className="w-14 h-14 bg-white/20 rounded-full mx-auto flex items-center justify-center mb-2 shadow-inner">
                {dutyEvaluation?.color === 'rose' ? (
                  <Clock className="w-8 h-8 text-rose-200" />
                ) : dutyEvaluation?.color === 'amber' ? (
                  <Clock className="w-8 h-8 text-amber-200" />
                ) : (
                  <ShieldCheck className="w-8 h-8 text-emerald-200" />
                )}
              </div>
              <h2 className="text-xl font-black tracking-tight text-white flex items-center justify-center gap-2">
                {dutyEvaluation?.color === 'rose' ? (
                  <AlertTriangle className="w-5 h-5 text-rose-300" />
                ) : dutyEvaluation?.color === 'amber' ? (
                  <Clock className="w-5 h-5 text-amber-300" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-300" />
                )}
                {dutyEvaluation?.title}
              </h2>

              {/* Exact Gujarati Duty Window Notification Message */}
              <div className="mt-3 p-3 bg-black/25 rounded-xl border border-white/20 text-xs sm:text-sm font-bold text-white shadow-inner max-w-md mx-auto leading-relaxed">
                {dutyEvaluation?.message}
              </div>
            </div>
          )}

          {/* Verification Details */}
          {!loading && data && (
            <div className="p-6 sm:p-8 space-y-6">
              {/* Photo & Primary ID */}
              <div className="flex flex-col sm:flex-row items-center gap-5 pb-6 border-b border-slate-100">
                <div className="w-24 h-32 rounded-xl p-1 bg-gradient-to-b from-[#C59B27] to-[#8A6818] shadow-md flex-shrink-0">
                  <div className="w-full h-full rounded-[6px] overflow-hidden bg-slate-100 flex items-center justify-center">
                    {data.photo_path ? (
                      <img
                        src={getStoragePublicUrl(data.photo_path)}
                        alt={data.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs text-slate-400 font-bold">ફોટો નથી</span>
                    )}
                  </div>
                </div>

                <div className="text-center sm:text-left flex-1">
                  <span className="text-xs font-bold text-[#800000] tracking-wider uppercase block">
                    આઈડી નંબર: {data.volunteer_id}
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mt-1">
                    {data.name}
                  </h3>

                  <div className="mt-2.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    {/* Seva Vibhag Badge */}
                    <div className="bg-gradient-to-r from-[#172554] to-[#1E40AF] text-amber-100 font-bold text-xs px-3.5 py-1 rounded-full border border-amber-300 shadow-sm">
                      {data.seva_vibhag_name}
                    </div>

                    {/* Group Badge */}
                    {data.group_name && (
                      <div className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-xs px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        {data.group_name}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Read-Only Details Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block">ગામ</span>
                    <span className="text-sm font-extrabold text-slate-800">
                      {data.village_name}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Building2 className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block">ક્ષેત્ર</span>
                    <span className="text-sm font-extrabold text-slate-800">
                      {data.xetra_name}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Layers className="w-5 h-5 text-purple-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block">સેવા વિભાગ</span>
                    <span className="text-sm font-extrabold text-slate-800">
                      {data.seva_vibhag_name}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Calendar className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 block">ચકાસણી સ્થિતિ</span>
                    <span
                      className={`text-xs font-extrabold ${
                        dutyEvaluation?.color === 'rose'
                          ? 'text-rose-700'
                          : dutyEvaluation?.color === 'amber'
                          ? 'text-amber-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {dutyEvaluation?.badgeText}
                    </span>
                  </div>
                </div>
              </div>

              {/* Duty Window Details Box */}
              {data.duty_start_date && data.duty_end_date && (
                <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                    <div>
                      <span className="text-[11px] text-slate-500 font-semibold block">માન્ય સેવા તારીખ ગાળો:</span>
                      <span className="font-extrabold text-slate-900 font-mono">
                        {formatDisplayDate(data.duty_start_date)} થી {formatDisplayDate(data.duty_end_date)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold">ચકાસણી સમય:</span>
                    <span className="font-mono text-[11px] font-bold text-slate-700">
                      {new Date().toLocaleDateString('gu-IN')} {new Date().toLocaleTimeString('gu-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )}

              {/* Privacy Notice */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 text-center">
                સુરક્ષા અને ગોપનીયતાના નિયમો હેઠળ સ્વયંસેવકનો વ્યક્તિગત મોબાઇલ નંબર જાહેરમાં દર્શાવવામાં આવતો નથી.
              </div>

              {/* Mahant Swami Maharaj Sacred Blessing */}
              <div className="text-center pt-2">
                <p className="text-xs font-bold text-[#800000] italic">
                  " સેવા મોક્ષ માટે કરવી " - મહંતસ્વામી મહારાજ
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">
                  સ્વયંસેવક દળ • BAPS સ્વામિનારાયણ મંદિર તીથલ
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-500 pt-4 border-t border-slate-200/60 max-w-xl mx-auto w-full">
        © 2026 BAPS Swaminarayan Mandir, Tithal - Valsad. All Rights Reserved.
      </footer>
    </div>
  );
};
