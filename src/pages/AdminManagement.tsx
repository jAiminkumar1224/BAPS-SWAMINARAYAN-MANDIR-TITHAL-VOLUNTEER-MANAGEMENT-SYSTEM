import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AdminProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  UserPlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Mail,
  User,
  Shield,
  Laptop,
  Check,
  Ban,
  Clock,
  Phone,
  Search,
} from 'lucide-react';

export const AdminManagement: React.FC = () => {
  const { isSuperAdmin, user: currentUser } = useAuth();
  const [profiles, setProfiles] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab: 'it_volunteers' | 'admins'
  const [activeTab, setActiveTab] = useState<'it_volunteers' | 'admins'>('it_volunteers');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Invite/Add User Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'super_admin' | 'it_volunteer'>('it_volunteer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Delete User
  const [deletingProfile, setDeletingProfile] = useState<AdminProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Processing Action (Approve / Reject)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        setProfiles([
          {
            id: 'mock-super-admin',
            full_name: 'BAPS Tithal Super Admin',
            role: 'super_admin',
            status: 'approved',
            email: 'admin@bapstithal.org',
            created_at: new Date().toISOString(),
          },
          {
            id: 'mock-it-pending-1',
            full_name: 'અક્ષય પટેલ',
            role: 'it_volunteer',
            status: 'pending',
            email: 'akshay@example.com',
            mobile_number: '9876543210',
            created_at: new Date(Date.now() - 3600000).toISOString(),
          },
        ]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('admin_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setProfiles(data as AdminProfile[]);
      }
    } catch (err) {
      console.error('Error fetching admin profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  // Approve a pending IT volunteer request
  const handleApprove = async (prof: AdminProfile) => {
    setActionLoadingId(prof.id);
    setErrorMsg('');
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('admin_profiles')
          .update({ status: 'approved' })
          .eq('id', prof.id);

        if (error) throw error;
      }

      setProfiles((prev) =>
        prev.map((p) => (p.id === prof.id ? { ...p, status: 'approved' } : p))
      );
      setSuccessMsg(`"${prof.full_name}" ને SSD IT સ્વયંસેવક તરીકે સફળતાપૂર્વક મંજૂર (Approved) કરવામાં આવ્યા! હવે તેઓ લોગિન કરી શકશે.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Error approving profile:', err);
      setErrorMsg(err.message || 'મંજૂર કરવામાં ભૂલ આવી.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reject a pending IT volunteer request
  const handleReject = async (prof: AdminProfile) => {
    setActionLoadingId(prof.id);
    setErrorMsg('');
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('admin_profiles')
          .update({ status: 'rejected' })
          .eq('id', prof.id);

        if (error) throw error;
      }

      setProfiles((prev) =>
        prev.map((p) => (p.id === prof.id ? { ...p, status: 'rejected' } : p))
      );
      setSuccessMsg(`"${prof.full_name}" ની વિનંતી નામંજૂર (Rejected) કરવામાં આવી.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Error rejecting profile:', err);
      setErrorMsg(err.message || 'નામંજૂર કરવામાં ભૂલ આવી.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (!isSupabaseConfigured) {
        const newProf: AdminProfile = {
          id: Date.now().toString(),
          full_name: fullName.trim(),
          email: email.trim(),
          mobile_number: mobileNumber.trim() || null,
          role,
          status: 'approved',
          created_at: new Date().toISOString(),
        };
        setProfiles((prev) => [newProf, ...prev]);
        setSuccessMsg(`"${fullName}" સફળતાપૂર્વક ઉમેરાયા!`);
        setIsModalOpen(false);
        setIsSubmitting(false);
        setTimeout(() => setSuccessMsg(''), 3000);
        return;
      }

      // Create Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Insert admin profile directly as approved
        const { error: profileError } = await supabase.from('admin_profiles').upsert({
          id: authData.user.id,
          full_name: fullName.trim(),
          email: email.trim(),
          mobile_number: mobileNumber.trim() || null,
          role,
          status: 'approved',
        });

        if (profileError) throw profileError;

        setSuccessMsg(`"${fullName}" ને સીધા મંજૂર એકાઉન્ટ સાથે ઉમેરવામાં આવ્યા!`);
        setIsModalOpen(false);
        fetchProfiles();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err: any) {
      console.error('Error adding user:', err);
      setErrorMsg(err.message || 'એકાઉન્ટ ઉમેરવામાં ભૂલ આવી.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!deletingProfile) return;
    if (deletingProfile.id === currentUser?.id) {
      alert('તમે તમારું પોતાનું સુપર એડમિન એકાઉન્ટ ડિલીટ કરી શકતા નથી.');
      setDeletingProfile(null);
      return;
    }

    setIsDeleting(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('admin_profiles')
          .delete()
          .eq('id', deletingProfile.id);
        if (error) throw error;
      }

      setProfiles((prev) => prev.filter((a) => a.id !== deletingProfile.id));
      setDeletingProfile(null);
      setSuccessMsg('એકાઉન્ટ સફળતાપૂર્વક દૂર કરવામાં આવ્યું.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error('Error deleting profile:', err);
      alert(err.message || 'ડિલીટ કરવામાં ભૂલ આવી.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <ShieldCheck className="w-12 h-12 text-amber-700 mx-auto mb-3" />
        <h2 className="text-lg font-black text-slate-800">અધિકાર મર્યાદિત છે</h2>
        <p className="text-xs text-slate-500 mt-1">
          આ પેજ ફક્ત સુપર એડમિન (Super Admin) માટે જ ઉપલબ્ધ છે.
        </p>
      </div>
    );
  }

  // Segmenting profiles
  const pendingItRequests = profiles.filter(
    (p) => p.role === 'it_volunteer' && p.status === 'pending'
  );
  const approvedItVolunteers = profiles.filter(
    (p) => p.role === 'it_volunteer' && p.status === 'approved'
  );
  const rejectedItRequests = profiles.filter(
    (p) => p.role === 'it_volunteer' && p.status === 'rejected'
  );
  const systemAdmins = profiles.filter(
    (p) => p.role === 'super_admin' || p.role === 'admin'
  );

  // Search filter applied to current tab
  const filteredApprovedIt = approvedItVolunteers.filter(
    (p) =>
      p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredAdmins = systemAdmins.filter(
    (p) =>
      p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-amber-700" />
            એડમિન અને IT સ્વયંસેવક વ્યવસ્થાપન
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
            SSD IT સ્વયંસેવકોની એક્સેસ વિનંતીઓ મંજૂર કરો અને સિસ્ટમ એડમિન્સનું સંચાલન કરો.
          </p>
        </div>

        <button
          onClick={() => {
            setFullName('');
            setEmail('');
            setMobileNumber('');
            setPassword('');
            setRole(activeTab === 'it_volunteers' ? 'it_volunteer' : 'admin');
            setErrorMsg('');
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow flex items-center gap-2 transition"
        >
          <UserPlus className="w-4 h-4 text-amber-200" />
          નવું એકાઉન્ટ ઉમેરો
        </button>
      </div>

      {/* Global Success / Error Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-600 rounded-xl text-emerald-800 text-xs sm:text-sm flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded-xl text-red-700 text-xs sm:text-sm flex items-center gap-2 shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* MAIN TABS */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4">
        <button
          onClick={() => setActiveTab('it_volunteers')}
          className={`pb-3 px-3 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition relative ${
            activeTab === 'it_volunteers'
              ? 'border-amber-700 text-amber-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Laptop className="w-4 h-4" />
          <span>SSD IT સ્વયંસેવકો</span>
          {pendingItRequests.length > 0 && (
            <span className="px-2 py-0.5 text-xs font-black bg-red-600 text-white rounded-full shadow animate-pulse">
              {pendingItRequests.length} પેન્ડિંગ
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('admins')}
          className={`pb-3 px-3 font-bold text-sm sm:text-base flex items-center gap-2 border-b-2 transition ${
            activeTab === 'admins'
              ? 'border-amber-700 text-amber-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>સિસ્ટમ એડમિન્સ ({systemAdmins.length})</span>
        </button>
      </div>

      {/* TAB 1: SSD IT VOLUNTEERS */}
      {activeTab === 'it_volunteers' && (
        <div className="space-y-6">
          {/* SECTION A: PENDING APPROVAL REQUESTS */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-amber-950">
                    મંજૂરી માટે પેન્ડિંગ વિનંતીઓ (Pending IT Volunteer Requests)
                  </h2>
                  <p className="text-xs text-amber-800">
                    નીચેના સ્વયંસેવકોએ લોગિન એક્સેસ માટે વિનંતી કરી છે. મંજૂર કર્યા પછી જ તેઓ લોગિન કરી શકશે.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-200 text-amber-900 rounded-full text-xs font-extrabold">
                {pendingItRequests.length} વિનંતીઓ
              </span>
            </div>

            {pendingItRequests.length === 0 ? (
              <div className="p-4 bg-white/70 rounded-xl text-center text-xs sm:text-sm text-slate-600 font-medium">
                હાલમાં કોઈ પેન્ડિંગ વિનંતી નથી. તમામ વિનંતીઓ મંજૂર થયેલી છે.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                {pendingItRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white rounded-xl border border-amber-300/80 p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                          SSD IT સ્વયંસેવક
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(req.created_at).toLocaleTimeString('gu-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-base">
                        {req.full_name}
                      </h3>
                      {req.email && (
                        <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1 truncate">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{req.email}</span>
                        </p>
                      )}
                      {req.mobile_number && (
                        <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{req.mobile_number}</span>
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">
                        તારીખ: {new Date(req.created_at).toLocaleDateString('gu-IN')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleApprove(req)}
                        disabled={actionLoadingId === req.id}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow transition disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>મંજૂર કરો (Approve)</span>
                      </button>
                      <button
                        onClick={() => handleReject(req)}
                        disabled={actionLoadingId === req.id}
                        className="py-2 px-3 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition disabled:opacity-50"
                        title="નામંજૂર કરો"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>નામંજૂર</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION B: APPROVED IT VOLUNTEERS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  મંજૂર થયેલ SSD IT સ્વયંસેવકો ({approvedItVolunteers.length})
                </h3>
                <p className="text-xs text-slate-500">
                  આ સ્વયંસેવકો આઈડી કાર્ડ માટે ફોટો પાડીને સ્વયંસેવક ઉમેરી શકે છે. તેઓ સ્વયંસેવક ડિલીટ કરી શકતા નથી.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="નામ અથવા ઈમેઇલ શોધો..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>
            </div>

            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold">
                <tr>
                  <th className="p-3.5">પૂરું નામ</th>
                  <th className="p-3.5">ઈમેઇલ / મોબાઈલ</th>
                  <th className="p-3.5">સ્થિતિ (Status)</th>
                  <th className="p-3.5">મંજૂરી તારીખ</th>
                  <th className="p-3.5 text-center">ક્રિયા</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApprovedIt.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-500">
                      કોઈ મંજૂર થયેલ IT સ્વયંસેવક મળ્યા નથી.
                    </td>
                  </tr>
                ) : (
                  filteredApprovedIt.map((adm) => (
                    <tr key={adm.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                          {adm.full_name.charAt(0)}
                        </div>
                        <div>
                          <span>{adm.full_name}</span>
                          <span className="block text-[11px] font-normal text-slate-500">
                            SSD IT સ્વયંસેવક
                          </span>
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        <div>{adm.email || '—'}</div>
                        {adm.mobile_number && (
                          <div className="text-xs text-slate-400">{adm.mobile_number}</div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Check className="w-3 h-3" />
                          મંજૂર / સક્રિય
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-500 text-xs">
                        {new Date(adm.created_at).toLocaleDateString('gu-IN')}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => setDeletingProfile(adm)}
                          title="એક્સેસ દૂર કરો"
                          className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* SECTION C: REJECTED REQUESTS (IF ANY) */}
          {rejectedItRequests.length > 0 && (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
              <h4 className="font-bold text-xs text-slate-600 mb-2">
                નામંજૂર થયેલ વિનંતીઓ ({rejectedItRequests.length})
              </h4>
              <div className="space-y-1">
                {rejectedItRequests.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between text-xs p-2 bg-white rounded-lg border border-slate-200"
                  >
                    <div>
                      <span className="font-bold text-slate-800">{r.full_name}</span>
                      <span className="text-slate-500 ml-2">({r.email})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApprove(r)}
                        className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded font-bold hover:bg-emerald-200 text-[11px]"
                      >
                        ફરી મંજૂર કરો
                      </button>
                      <button
                        onClick={() => setDeletingProfile(r)}
                        className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                        title="કાયમી કાઢી નાખો"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SYSTEM ADMINS */}
      {activeTab === 'admins' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-700" />
                સિસ્ટમ એડમિન્સ ({systemAdmins.length})
              </h3>
              <p className="text-xs text-slate-500">
                આ એડમિન્સ સમગ્ર પોર્ટલ, સેવા વિભાગો અને સ્વયંસેવકોનું સંચાલન કરી શકે છે.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="નામ અથવા ઈમેઇલ શોધો..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
            </div>
          </div>

          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold">
              <tr>
                <th className="p-3.5">પૂરું નામ</th>
                <th className="p-3.5">ઈમેઇલ</th>
                <th className="p-3.5">રોલ (Role)</th>
                <th className="p-3.5">બનાવ્યા તારીખ</th>
                <th className="p-3.5 text-center">ક્રિયા</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-500">
                    કોઈ એડમિન મળ્યા નથી.
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((adm) => (
                  <tr key={adm.id} className="hover:bg-amber-50/20 transition">
                    <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                        {adm.full_name.charAt(0)}
                      </div>
                      <span>{adm.full_name}</span>
                    </td>
                    <td className="p-3.5 text-slate-600">
                      {adm.email || '—'}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          adm.role === 'super_admin'
                            ? 'bg-purple-100 text-purple-900 border border-purple-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        {adm.role === 'super_admin' ? 'સુપર એડમિન' : 'એડમિન'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500 text-xs">
                      {new Date(adm.created_at).toLocaleDateString('gu-IN')}
                    </td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => setDeletingProfile(adm)}
                        disabled={adm.id === currentUser?.id}
                        className={`p-1.5 rounded-lg transition ${
                          adm.id === currentUser?.id
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-rose-700 hover:bg-rose-50'
                        }`}
                        title="એકાઉન્ટ ડિલીટ કરો"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD USER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-5 py-4 bg-gradient-to-r from-amber-700 to-amber-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-200" />
                નવું એકાઉન્ટ ઉમેરો
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-amber-100 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  પૂરું નામ (Full Name) *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="દા.ત. અક્ષય પટેલ"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  મોબાઇલ નંબર (Mobile Number)
                </label>
                <input
                  type="tel"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="દા.ત. 9876543210"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  ઈમેઇલ (Email) *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@bapstithal.org"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  પાસવર્ડ (Password - ઓછામાં ઓછા 6 અક્ષર) *
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

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  રોલ (Role) *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold"
                >
                  <option value="it_volunteer">SSD IT સ્વયંસેવક (IT Volunteer - ફોટો અને વિગત ઉમેરવા)</option>
                  <option value="admin">એડમિન (Admin)</option>
                  <option value="super_admin">સુપર એડમિન (Super Admin)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  * SSD IT સ્વયંસેવક માત્ર ફોટો પાડીને વિગત ઉમેરી શકે છે, કોઈ ડેટા ડિલીટ કરી શકતા નથી.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl text-sm transition shadow flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'ઉમેરાઈ રહ્યું છે...' : 'એકાઉન્ટ બનાવો'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-sm transition"
                >
                  રદ કરો
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-700 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                એકાઉન્ટ ડિલીટ કરવું છે?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                શું તમે ખરેખર "{deletingProfile.full_name}" નું એકાઉન્ટ ડિલીટ કરવા માંગો છો? તેઓ ભવિષ્યમાં લોગિન કરી શકશે નહીં.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleDeleteProfile}
                disabled={isDeleting}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs sm:text-sm transition shadow"
              >
                {isDeleting ? 'ડિલીટ થાય છે...' : 'હા, ડિલીટ કરો'}
              </button>
              <button
                onClick={() => setDeletingProfile(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition"
              >
                રદ કરો
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
