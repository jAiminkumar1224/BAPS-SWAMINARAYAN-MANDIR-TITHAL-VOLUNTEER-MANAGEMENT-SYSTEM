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
} from 'lucide-react';

export const AdminManagement: React.FC = () => {
  const { isSuperAdmin, user: currentUser } = useAuth();
  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite/Add Admin Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'super_admin'>('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Delete Admin
  const [deletingAdmin, setDeletingAdmin] = useState<AdminProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        setAdmins([
          {
            id: 'mock-super-admin',
            full_name: 'BAPS Tithal Super Admin',
            role: 'super_admin',
            created_at: new Date().toISOString(),
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
        setAdmins(data as AdminProfile[]);
      }
    } catch (err) {
      console.error('Error fetching admins:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (!isSupabaseConfigured) {
        const newAdmin: AdminProfile = {
          id: Date.now().toString(),
          full_name: fullName.trim(),
          role,
          created_at: new Date().toISOString(),
        };
        setAdmins((prev) => [newAdmin, ...prev]);
        setSuccessMsg('નવો એડમિન સફળતાપૂર્વક ઉમેરાયો!');
        setIsModalOpen(false);
        setIsSubmitting(false);
        setTimeout(() => setSuccessMsg(''), 3000);
        return;
      }

      // Create Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        // Insert admin profile
        const { error: profileError } = await supabase.from('admin_profiles').insert({
          id: authData.user.id,
          full_name: fullName.trim(),
          role,
        });

        if (profileError) throw profileError;

        setSuccessMsg(`નવો એડમિન "${fullName}" સફળતાપૂર્વક ઉમેરાયો!`);
        setIsModalOpen(false);
        fetchAdmins();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err: any) {
      console.error('Error adding admin:', err);
      setErrorMsg(err.message || 'એડમિન ઉમેરવામાં ભૂલ આવી.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deletingAdmin) return;
    if (deletingAdmin.id === currentUser?.id) {
      alert('તમે તમારું પોતાનું સુપર એડમિન એકાઉન્ટ ડિલીટ કરી શકતા નથી.');
      setDeletingAdmin(null);
      return;
    }

    setIsDeleting(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('admin_profiles')
          .delete()
          .eq('id', deletingAdmin.id);
        if (error) throw error;
      } else {
        setAdmins((prev) => prev.filter((a) => a.id !== deletingAdmin.id));
      }

      setAdmins((prev) => prev.filter((a) => a.id !== deletingAdmin.id));
      setDeletingAdmin(null);
      setSuccessMsg('એડમિન પ્રોફાઇલ ડિલીટ થઈ ગઈ.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error('Error deleting admin:', err);
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
          માત્ર સુપર એડમિન જ અન્ય એડમિન મેનેજમેન્ટ જોઈ શકે છે.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-700" />
            એડમિન વ્યવસ્થાપન (Admin Management)
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
            નવા એડમિન ઉમેરો અને સુરક્ષા રોલ (Super Admin / Admin) નિયંત્રિત કરો.
          </p>
        </div>

        <button
          onClick={() => {
            setFullName('');
            setEmail('');
            setPassword('');
            setRole('admin');
            setErrorMsg('');
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow flex items-center gap-2 transition"
        >
          <UserPlus className="w-4 h-4 text-amber-200" />
          નવા એડમિન ઉમેરો
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-800 text-sm font-semibold rounded flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Admin List Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-gradient-to-r from-slate-100 to-amber-50/60 border-b border-slate-200 text-slate-700 font-extrabold">
            <tr>
              <th className="p-3.5">પૂરું નામ</th>
              <th className="p-3.5">રોલ (Role)</th>
              <th className="p-3.5">બનાવ્યા તારીખ</th>
              <th className="p-3.5 text-center">ક્રિયા</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-slate-500">
                  એડમિન લોડ થઈ રહ્યા છે...
                </td>
              </tr>
            ) : admins.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-slate-500">
                  કોઈ એડમિન મળ્યા નથી.
                </td>
              </tr>
            ) : (
              admins.map((adm) => (
                <tr key={adm.id} className="hover:bg-amber-50/20 transition">
                  <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                      {adm.full_name.charAt(0)}
                    </div>
                    <span>{adm.full_name}</span>
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
                      onClick={() => setDeletingAdmin(adm)}
                      disabled={adm.id === currentUser?.id}
                      className={`p-1.5 rounded-lg transition ${
                        adm.id === currentUser?.id
                          ? 'text-slate-300 cursor-not-allowed'
                          : 'text-rose-700 hover:bg-rose-50'
                      }`}
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

      {/* ADD ADMIN MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-5 py-4 bg-gradient-to-r from-amber-700 to-amber-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-200" />
                નવા એડમિન ઉમેરો
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-amber-100 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="p-6 space-y-4">
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
                  placeholder="દા.ત. જીતેન્દ્ર પટેલ"
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
                  placeholder="admin@bapstithal.org"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  પાસવર્ડ (Password) *
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
                  <option value="admin">એડમિન (Admin)</option>
                  <option value="super_admin">સુપર એડમિન (Super Admin)</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-lg shadow"
                >
                  {isSubmitting ? 'ઉમેરાય છે...' : 'એડમિન બનાવો'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deletingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6">
            <h3 className="text-base font-black text-rose-700 mb-2">
              એડમિન ડિલીટ કરવાની ખાતરી
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-4">
              શું તમે ખરેખર એડમિન <strong>"{deletingAdmin.full_name}"</strong> ને ડિલીટ કરવા માંગો
              છો?
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingAdmin(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
              >
                રદ કરો
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteAdmin}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg shadow"
              >
                {isDeleting ? 'ડિલીટ થાય છે...' : 'હા, ડિલીટ કરો'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
