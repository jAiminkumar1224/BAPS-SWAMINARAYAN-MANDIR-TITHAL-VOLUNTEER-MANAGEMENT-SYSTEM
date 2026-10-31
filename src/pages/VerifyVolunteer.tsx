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
          });
        } else {
          setNotFound(true);
        }
        setLoading(false);
        return;
      }

      // Call secure Supabase database function: verify_volunteer(p_volunteer_id)
      const { data: rpcData, error } = await supabase.rpc('verify_volunteer', {
        p_volunteer_id: volunteerIdQuery,
      });

      if (!error && rpcData && rpcData.length > 0) {
        setData(rpcData[0] as VerificationData);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error('Error during verification:', err);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

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
            <div className="bg-slate-100 p-6 text-center text-slate-500 font-bold text-sm">
              આઈડી કાર્ડ ચકાસણી થઈ રહી છે...
            </div>
          ) : notFound || !data ? (
            <div className="bg-red-600 text-white p-6 text-center">
              <div className="w-14 h-14 bg-white/20 rounded-full mx-auto flex items-center justify-center mb-2">
                <XCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-black">અમાન્ય આઈડી કાર્ડ (Invalid ID)</h2>
              <p className="text-xs text-red-100 mt-1">
                આ આઈડી નંબર ધરાવતું કોઈ સત્તાવાર કાર્ડ BAPS તીથલ સિસ્ટમમાં મળ્યું નથી.
              </p>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-emerald-900 text-white p-6 text-center border-b-2 border-emerald-500">
              <div className="w-14 h-14 bg-white/20 rounded-full mx-auto flex items-center justify-center mb-2 shadow-inner">
                <ShieldCheck className="w-8 h-8 text-emerald-200" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-white flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-300" />
                સત્તાવાર પ્રમાણિત સ્વયંસેવક
              </h2>
              <p className="text-xs text-emerald-100 font-semibold mt-1">
                BAPS સ્વામિનારાયણ મંદિર તીથલ - માન્ય ઓળખકાર્ડ
              </p>
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

                  {/* Seva Vibhag Badge */}
                  <div className="mt-3 inline-block bg-gradient-to-r from-[#172554] to-[#1E40AF] text-amber-100 font-bold text-xs sm:text-sm px-4 py-1.5 rounded-full border border-amber-300 shadow-sm">
                    {data.seva_vibhag_name}
                  </div>
                </div>
              </div>

              {/* Read-Only Details Grid (NO MOBILE NUMBER EXPOSED) */}
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
                    <span className="text-xs font-extrabold text-emerald-700">
                      સક્રિય / પ્રમાણિત
                    </span>
                  </div>
                </div>
              </div>

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
