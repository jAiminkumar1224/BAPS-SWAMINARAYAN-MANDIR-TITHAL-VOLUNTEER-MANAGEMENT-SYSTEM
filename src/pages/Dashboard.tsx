import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured, getStoragePublicUrl } from '../lib/supabase';
import { Volunteer, SevaVibhag } from '../types';
import { DEFAULT_MOCK_SEVA_VIBHAGS, normalizeSevaVibhagName } from '../constants/sevaVibhag';
import { useAuth } from '../context/AuthContext';
import {
  CreditCard,
  Users,
  Layers,
  UserPlus,
  Eye,
  Calendar,
  ChevronRight,
  TrendingUp,
  Camera,
  Bell,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { profile, isSuperAdmin, isItVolunteer } = useAuth();
  const [totalVolunteers, setTotalVolunteers] = useState(0);
  const [totalDepartments, setTotalDepartments] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [recentVolunteers, setRecentVolunteers] = useState<Volunteer[]>([]);
  const [departments, setDepartments] = useState<SevaVibhag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        // Mock data when Supabase is in local/setup mode
        const savedVolunteersStr = localStorage.getItem('baps_mock_volunteers');
        const mockVolunteers: Volunteer[] = savedVolunteersStr
          ? JSON.parse(savedVolunteersStr)
          : [
              {
                id: '1',
                volunteer_id: 'BAPS-74930-TNL',
                name: 'ભાવેશ ગણપતસિંહ દેસાઈ',
                mobile_number: '9662510539',
                village_name: 'કાપરીયા',
                xetra_name: 'મરલા',
                seva_vibhag_id: '1',
                photo_path: '/sinhasan.jpeg',
                created_at: new Date().toISOString(),
                seva_vibhag: { id: '1', name: 'સ્વયંસેવક દળ', is_active: true },
              },
              {
                id: '2',
                volunteer_id: 'BAPS-74931-TNL',
                name: 'યશ પટેલ',
                mobile_number: '9313149595',
                village_name: 'જોરાવાસણ',
                xetra_name: 'તિથલ',
                seva_vibhag_id: '2',
                photo_path: null,
                created_at: new Date(Date.now() - 3600000).toISOString(),
                seva_vibhag: { id: '2', name: 'પાર્કિંગ સેવા', is_active: true },
              },
            ];

        setTotalVolunteers(mockVolunteers.length);
        setTotalDepartments(DEFAULT_MOCK_SEVA_VIBHAGS.length);
        setRecentVolunteers(mockVolunteers);
        setLoading(false);
        return;
      }

      // 1. Fetch total volunteers count
      const { count: volCount } = await supabase
        .from('volunteers')
        .select('*', { count: 'exact', head: true });
      setTotalVolunteers(volCount || 0);

      // 2. Fetch total active seva vibhag count
      const { data: vibhagData, count: vibhagCount } = await supabase
        .from('seva_vibhag')
        .select('*', { count: 'exact' });
      setTotalDepartments(vibhagCount || 0);
      setDepartments(vibhagData || []);

      // 3. Fetch 5 most recent volunteers with seva vibhag
      const { data: recentData } = await supabase
        .from('volunteers')
        .select(`
          *,
          seva_vibhag:seva_vibhag_id (id, name, is_active)
        `)
        .order('created_at', { ascending: false })
        .limit(6);

      setRecentVolunteers((recentData as unknown as Volunteer[]) || []);

      // 4. If super admin, fetch pending IT requests count
      if (isSuperAdmin) {
        const { count: pendingCount } = await supabase
          .from('admin_profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'it_volunteer')
          .eq('status', 'pending');
        setPendingRequestsCount(pendingCount || 0);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* SUPER ADMIN NOTIFICATION BANNER FOR PENDING IT REQUESTS */}
      {isSuperAdmin && pendingRequestsCount > 0 && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 rounded-2xl p-5 text-slate-950 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-amber-300 animate-pulse">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-white/30 rounded-2xl flex items-center justify-center font-bold text-xl shadow-inner shrink-0 text-white">
              <Bell className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg text-slate-950">
                🔔 {pendingRequestsCount} નવી SSD IT સ્વયંસેવક એક્સેસ વિનંતી(ઓ) પેન્ડિંગ છે!
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-slate-900/90">
                નવા IT સ્વયંસેવકોએ લોગિન માટે વિનંતી કરી છે. કૃપા કરીને તેમને મંજૂર (Approve) કરો જેથી તેઓ પોર્ટલમાં ફોટો પાડીને સ્વયંસેવક ઉમેરી શકે.
              </p>
            </div>
          </div>
          <Link
            to="/admins"
            className="px-5 py-2.5 bg-slate-950 hover:bg-black text-amber-300 font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition shrink-0 flex items-center gap-2"
          >
            <span>વિનંતીઓ જુઓ અને મંજૂર કરો</span>
            <ChevronRight className="w-4 h-4 text-amber-300" />
          </Link>
        </div>
      )}

      {/* IT VOLUNTEER BANNER */}
      {isItVolunteer && (
        <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-blue-900 rounded-2xl p-5 text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 border border-blue-400/40">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
              <Camera className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-amber-100">
                SSD IT સ્વયંસેવક પોર્ટલ
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                તમે કેમેરાથી સ્વયંસેવકનો ફોટો પાડીને નવી વિગતો ડેટાબેઝમાં સેવ કરી શકો છો.
              </p>
            </div>
          </div>
          <Link
            to="/create"
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition shrink-0 flex items-center gap-2"
          >
            <Camera className="w-4 h-4" />
            <span>નવો ફોટો પાડો અને સેવ કરો</span>
          </Link>
        </div>
      )}

      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#7F1D1D] rounded-2xl p-6 sm:p-8 text-white shadow-xl border-2 border-[#C59B27] relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-cover bg-center opacity-10 pointer-events-none" style={{ backgroundImage: `url('/mandir.jpeg')` }} />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 rounded-full border border-amber-300/40 text-amber-200 text-xs font-bold mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              BAPS સ્વામિનારાયણ મંદિર, તીથલ
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              સ્વયંસેવક આઈડી કાર્ડ મેનેજમેન્ટ
            </h1>
            <p className="text-amber-100/90 text-sm mt-1 max-w-xl">
              " સેવા મોક્ષ માટે કરવી " - મહંતસ્વામી મહારાજ. અહીંથી તમામ સ્વયંસેવકોના 74mm × 100mm આઈડી કાર્ડ તૈયાર કરો, ડાઉનલોડ કરો અને પ્રિન્ટ કરો.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/create"
              className="px-5 py-2.5 bg-gradient-to-r from-[#C59B27] to-[#DFC15D] text-slate-900 font-extrabold rounded-xl shadow-lg hover:from-[#DFC15D] hover:to-[#C59B27] transition flex items-center gap-2 text-sm"
            >
              <UserPlus className="w-4 h-4 text-slate-900" />
              નવું આઈડી કાર્ડ બનાવો
            </Link>
            <Link
              to="/volunteers"
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 transition flex items-center gap-2 text-sm"
            >
              <Users className="w-4 h-4 text-amber-300" />
              તમામ સ્વયંસેવકો
            </Link>
          </div>
        </div>
      </div>

      {/* METRIC COUNTERS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Total ID Cards */}
        <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-amber-600 border-x border-b border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              કુલ આઈડી કાર્ડ
            </p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">
              {loading ? '...' : totalVolunteers}
            </h3>
            <span className="text-xs text-emerald-600 font-semibold inline-flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> ડિજિટલ અને પ્રિન્ટ રેડી
            </span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shadow-sm">
            <CreditCard className="w-7 h-7" />
          </div>
        </div>

        {/* Card 2: Total Volunteers */}
        <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-blue-600 border-x border-b border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              કુલ સ્વયંસેવકો
            </p>
            <h3 className="text-3xl font-black text-slate-900 mt-1">
              {loading ? '...' : totalVolunteers}
            </h3>
            <span className="text-xs text-blue-600 font-semibold inline-flex items-center gap-1 mt-1">
              નોંધાયેલા સ્વયંસેવક ભાઈઓ/બહેનો
            </span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 shadow-sm">
            <Users className="w-7 h-7" />
          </div>
        </div>

        {/* Card 3: Total Seva Vibhag (Hidden for IT volunteer) */}
        {!isItVolunteer ? (
          <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-emerald-600 border-x border-b border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                કુલ સેવા વિભાગ
              </p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">
                {loading ? '...' : totalDepartments}
              </h3>
              <Link
                to="/departments"
                className="text-xs text-emerald-700 hover:underline font-semibold inline-flex items-center gap-1 mt-1"
              >
                સેવા વિભાગ વ્યવસ્થાપન &rarr;
              </Link>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-sm">
              <Layers className="w-7 h-7" />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-purple-600 border-x border-b border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                તમારો રોલ
              </p>
              <h3 className="text-xl font-black text-purple-900 mt-1">
                SSD IT સ્વયંસેવક
              </h3>
              <span className="text-xs text-purple-700 font-medium block mt-1">
                કેમેરા અને ડેટા એન્ટ્રી એક્સેસ
              </span>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200 shadow-sm">
              <Camera className="w-7 h-7" />
            </div>
          </div>
        )}
      </div>

      {/* RECENT ID CARDS SECTION */}
      <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-700" />
            <h3 className="font-extrabold text-slate-800 text-base">
              તાજેતરના આઈડી કાર્ડ (Recent ID Cards)
            </h3>
          </div>
          <Link
            to="/volunteers"
            className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1"
          >
            તમામ જુઓ <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-slate-500 text-sm">માહિતી લોડ થઈ રહી છે...</div>
          ) : recentVolunteers.length === 0 ? (
            <div className="text-center py-10">
              <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600">હજુ સુધી કોઈ કાર્ડ બન્યું નથી.</p>
              <Link
                to="/create"
                className="mt-3 inline-block px-4 py-2 bg-amber-700 text-white font-bold rounded-lg text-xs"
              >
                પ્રથમ આઈડી કાર્ડ બનાવો
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentVolunteers.map((vol) => (
                <div
                  key={vol.id}
                  className="p-4 rounded-xl border border-slate-200 bg-amber-50/20 hover:border-amber-400 hover:shadow-md transition flex items-center gap-3"
                >
                  <div className="w-14 h-16 rounded-lg border-2 border-[#C59B27] overflow-hidden bg-slate-100 flex-shrink-0 shadow-sm">
                    {vol.photo_path ? (
                      <img
                        src={getStoragePublicUrl(vol.photo_path)}
                        alt={vol.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                        ફોટો
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#800000] tracking-wide">
                        {vol.volunteer_id}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold truncate max-w-[100px]">
                        {normalizeSevaVibhagName(vol.seva_vibhag?.name)}
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900 truncate mt-0.5">
                      {vol.name}
                    </h4>
                    <p className="text-xs text-slate-600 truncate">
                      ગામ: {vol.village_name} | ક્ષેત્ર: {vol.xetra_name}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Link
                        to={`/volunteers?view=${vol.id}`}
                        className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> કાર્ડ જુઓ
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
