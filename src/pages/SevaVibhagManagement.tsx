import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, getStoragePublicUrl } from '../lib/supabase';
import { SevaVibhag, Volunteer } from '../types';
import { DEFAULT_MOCK_SEVA_VIBHAGS } from '../constants/sevaVibhag';
import { useAuth } from '../context/AuthContext';
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  Save,
  X,
  AlertCircle,
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  Home,
  Calendar,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export const SevaVibhagManagement: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [departments, setDepartments] = useState<SevaVibhag[]>([]);
  const [volunteerCounts, setVolunteerCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Form Modal (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<SevaVibhag | null>(null);
  const [deptName, setDeptName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Delete Confirmation
  const [deletingDept, setDeletingDept] = useState<SevaVibhag | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // View Volunteers Modal Drilldown
  const [selectedDeptForVolunteers, setSelectedDeptForVolunteers] = useState<SevaVibhag | null>(null);
  const [deptVolunteers, setDeptVolunteers] = useState<Volunteer[]>([]);
  const [loadingVolunteers, setLoadingVolunteers] = useState(false);
  const [volunteerSearchTerm, setVolunteerSearchTerm] = useState('');

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        const saved = localStorage.getItem('baps_mock_depts');
        const list: SevaVibhag[] = saved
          ? JSON.parse(saved)
          : DEFAULT_MOCK_SEVA_VIBHAGS;
        setDepartments(list);
        setVolunteerCounts({ '1': 1, '2': 1, '3': 1 });
        setLoading(false);
        return;
      }

      const { data: deptData, error: deptError } = await supabase
        .from('seva_vibhag')
        .select('*')
        .order('name');

      if (!deptError && deptData) {
        setDepartments(deptData);

        // Fetch counts of volunteers assigned to each department
        const { data: volData } = await supabase
          .from('volunteers')
          .select('seva_vibhag_id');

        if (volData) {
          const counts: Record<string, number> = {};
          volData.forEach((v) => {
            if (v.seva_vibhag_id) {
              counts[v.seva_vibhag_id] = (counts[v.seva_vibhag_id] || 0) + 1;
            }
          });
          setVolunteerCounts(counts);
        }
      }
    } catch (err) {
      console.error('Error fetching seva vibhag:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch volunteers assigned to a specific department and open drilldown modal
  const handleViewDeptVolunteers = async (dept: SevaVibhag) => {
    setSelectedDeptForVolunteers(dept);
    setVolunteerSearchTerm('');
    setLoadingVolunteers(true);

    try {
      if (!isSupabaseConfigured) {
        const saved = localStorage.getItem('baps_mock_volunteers');
        const list: Volunteer[] = saved ? JSON.parse(saved) : [];
        const filtered = list.filter((v) => v.seva_vibhag_id === dept.id);
        setDeptVolunteers(filtered);
        setLoadingVolunteers(false);
        return;
      }

      const { data, error } = await supabase
        .from('volunteers')
        .select('*')
        .eq('seva_vibhag_id', dept.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setDeptVolunteers(data as Volunteer[]);
      } else {
        setDeptVolunteers([]);
      }
    } catch (err) {
      console.error('Error fetching department volunteers:', err);
      setDeptVolunteers([]);
    } finally {
      setLoadingVolunteers(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingDept(null);
    setDeptName('');
    setIsActive(true);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: SevaVibhag) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setIsActive(dept.is_active);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptName.trim()) {
      setErrorMsg('સેવા વિભાગનું નામ જરૂરી છે.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      if (isSupabaseConfigured) {
        if (editingDept) {
          // Update
          const { error } = await supabase
            .from('seva_vibhag')
            .update({
              name: deptName.trim(),
              is_active: isActive,
            })
            .eq('id', editingDept.id);

          if (error) throw error;
        } else {
          // Insert
          const { error } = await supabase.from('seva_vibhag').insert({
            name: deptName.trim(),
            is_active: isActive,
          });

          if (error) throw error;
        }
      } else {
        // Mock storage
        if (editingDept) {
          const updated = departments.map((d) =>
            d.id === editingDept.id ? { ...d, name: deptName.trim(), is_active: isActive } : d
          );
          setDepartments(updated);
          localStorage.setItem('baps_mock_depts', JSON.stringify(updated));
        } else {
          const newDept = {
            id: Date.now().toString(),
            name: deptName.trim(),
            is_active: isActive,
          };
          const updated = [...departments, newDept];
          setDepartments(updated);
          localStorage.setItem('baps_mock_depts', JSON.stringify(updated));
        }
      }

      setSuccessMsg('સેવા વિભાગ સફળતાપૂર્વક સેવ થયો!');
      setIsModalOpen(false);
      fetchDepartments();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error('Error saving department:', err);
      setErrorMsg(err.message || 'સેવ કરવામાં ભૂલ આવી.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isSuperAdmin) {
      alert('સેવા વિભાગ ડિલીટ કરવાનો અધિકાર ફક્ત સુપર એડમિન પાસે છે.');
      setDeletingDept(null);
      return;
    }
    if (!deletingDept) return;

    // Guard: check if volunteers exist
    const count = volunteerCounts[deletingDept.id] || 0;
    if (count > 0) {
      alert(`આ સેવા વિભાગમાં ${count} સ્વયંસેવકો જોડાયેલા હોવાથી તેને ડિલીટ કરી શકાતો નથી. તમે તેને નિષ્ક્રિય (Deactivate) કરી શકો છો.`);
      setDeletingDept(null);
      return;
    }

    setIsDeleting(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('seva_vibhag')
          .delete()
          .eq('id', deletingDept.id);
        if (error) throw error;
      } else {
        const updated = departments.filter((d) => d.id !== deletingDept.id);
        setDepartments(updated);
        localStorage.setItem('baps_mock_depts', JSON.stringify(updated));
      }

      setDepartments((prev) => prev.filter((d) => d.id !== deletingDept.id));
      setDeletingDept(null);
      setSuccessMsg('સેવા વિભાગ ડિલીટ થઈ ગયો.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      console.error('Error deleting department:', err);
      alert(err.message || 'ડિલીટ કરવામાં ભૂલ આવી.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (dept: SevaVibhag) => {
    try {
      const nextActive = !dept.is_active;
      if (isSupabaseConfigured) {
        await supabase
          .from('seva_vibhag')
          .update({ is_active: nextActive })
          .eq('id', dept.id);
      }
      setDepartments((prev) =>
        prev.map((d) => (d.id === dept.id ? { ...d, is_active: nextActive } : d))
      );
    } catch (err) {
      console.error('Error toggling active state:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-amber-700" />
            સેવા વિભાગ વ્યવસ્થાપન (Seva Vibhag Management)
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
            નવા વિભાગો ઉમેરો, સુધારો, સક્રિય/નિષ્ક્રિય કરો અથવા બિનઉપયોગી વિભાગો કાઢી નાખો.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white rounded-xl text-xs sm:text-sm font-bold shadow flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4 text-amber-200" />
          નવો સેવા વિભાગ ઉમેરો
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border-l-4 border-emerald-600 text-emerald-800 text-sm font-semibold rounded flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid of Departments */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">વિભાગો લોડ થઈ રહ્યા છે...</div>
        ) : departments.length === 0 ? (
          <div className="text-center py-12 text-slate-500">હજુ કોઈ સેવા વિભાગ ઉમેરાયો નથી.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => {
              const assignedCount = volunteerCounts[dept.id] || 0;
              return (
                <div
                  key={dept.id}
                  className={`p-4 rounded-xl border transition flex flex-col justify-between shadow-sm hover:shadow-md ${
                    dept.is_active
                      ? 'bg-gradient-to-br from-amber-50/30 to-white border-slate-200 hover:border-amber-400'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div
                    onClick={() => handleViewDeptVolunteers(dept)}
                    className="cursor-pointer group"
                    title="આ વિભાગના તમામ સ્વયંસેવકોની યાદી જોવા માટે ક્લિક કરો"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                          dept.is_active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {dept.is_active ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> સક્રિય
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-500" /> નિષ્ક્રિય
                          </>
                        )}
                      </span>

                      <span className="text-xs text-blue-800 bg-blue-50 group-hover:bg-blue-100 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 border border-blue-200 transition">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        <span>{assignedCount} સ્વયંસેવકો</span>
                        <ExternalLink className="w-3 h-3 text-blue-500" />
                      </span>
                    </div>

                    {/* Department Name in Royal Blue Banner preview */}
                    <div className="my-2 p-2.5 bg-gradient-to-r from-[#172554] via-[#1E40AF] to-[#172554] text-white rounded-lg text-center font-bold text-sm border-y-2 border-[#DFC15D] tracking-wide shadow transition group-hover:scale-[1.01]">
                      {dept.name}
                    </div>

                    <p className="text-[11px] text-center text-slate-500 group-hover:text-amber-800 font-medium">
                      👆 સ્વયંસેવકોની યાદી જોવા અહીં ક્લિક કરો
                    </p>
                  </div>

                  <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleActive(dept)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                      {dept.is_active ? 'નિષ્ક્રિય કરો' : 'સક્રિય કરો'}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(dept)}
                        title="સુધારો (Edit)"
                        className="p-1.5 rounded-lg text-blue-700 hover:bg-blue-100 transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      {isSuperAdmin && (
                        <button
                          onClick={() => setDeletingDept(dept)}
                          title="ડિલીટ કરો (Delete)"
                          disabled={assignedCount > 0}
                          className={`p-1.5 rounded-lg transition ${
                            assignedCount > 0
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-rose-700 hover:bg-rose-100'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-5 py-4 bg-gradient-to-r from-amber-700 to-amber-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingDept ? 'સેવા વિભાગમાં સુધારો કરો' : 'નવો સેવા વિભાગ ઉમેરો'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-amber-100 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  સેવા વિભાગનું નામ (Department Name) *
                </label>
                <input
                  type="text"
                  required
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  placeholder="દા.ત. પાર્કિંગ સેવા, ભોજન સેવા, મહિલા સેવા"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-amber-700 rounded border-slate-300 focus:ring-amber-600"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-semibold text-slate-700">
                  આ સેવા વિભાગ સક્રિય (Active) રાખવો
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg"
                >
                  રદ કરો
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-lg shadow flex items-center gap-1.5"
                >
                  {isSaving ? 'સેવ થાય છે...' : 'સેવ કરો'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deletingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6">
            <h3 className="text-base font-black text-rose-700 mb-2">
              સેવા વિભાગ ડિલીટ કરવાની ખાતરી
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-4">
              શું તમે ખરેખર સેવા વિભાગ <strong>"{deletingDept.name}"</strong> ને ડિલીટ કરવા માંગો
              છો?
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingDept(null)}
                className="px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
              >
                રદ કરો
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg shadow"
              >
                {isDeleting ? 'ડિલીટ થાય છે...' : 'હા, ડિલીટ કરો'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VOLUNTEER DRILLDOWN MODAL (TILES FORMAT) */}
      {selectedDeptForVolunteers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border-2 border-amber-300 overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#172554] via-[#1E40AF] to-[#172554] text-white flex items-center justify-between border-b-2 border-[#DFC15D]">
              <div>
                <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  સેવા વિભાગ સ્વયંસેવકો (Volunteer List)
                </div>
                <h3 className="font-black text-lg sm:text-xl text-white mt-0.5">
                  {selectedDeptForVolunteers.name}
                </h3>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-amber-400 text-slate-950 font-black text-xs rounded-full shadow">
                  કુલ: {deptVolunteers.length}
                </span>
                <button
                  onClick={() => setSelectedDeptForVolunteers(null)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                  title="બંધ કરો"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Subheader / Search */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={volunteerSearchTerm}
                  onChange={(e) => setVolunteerSearchTerm(e.target.value)}
                  placeholder="નામ, મોબાઇલ, ગામ, ક્ષેત્ર કે ગ્રુપ શોધો..."
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="text-xs text-slate-600 font-medium">
                {deptVolunteers.filter((v) => {
                  const q = volunteerSearchTerm.toLowerCase();
                  return (
                    v.name.toLowerCase().includes(q) ||
                    (v.mobile_number && v.mobile_number.includes(q)) ||
                    (v.village_name && v.village_name.toLowerCase().includes(q)) ||
                    (v.xetra_name && v.xetra_name.toLowerCase().includes(q)) ||
                    (v.group_name && v.group_name.toLowerCase().includes(q)) ||
                    (v.email && v.email.toLowerCase().includes(q)) ||
                    v.volunteer_id.toLowerCase().includes(q)
                  );
                }).length} સ્વયંસેવકો મળ્યા
              </div>
            </div>

            {/* Modal Body - Volunteers Tiles */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/60">
              {loadingVolunteers ? (
                <div className="text-center py-12 text-slate-500 font-bold">
                  <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  સ્વયંસેવકો લોડ થઈ રહ્યા છે...
                </div>
              ) : (
                (() => {
                  const filtered = deptVolunteers.filter((v) => {
                    const q = volunteerSearchTerm.toLowerCase();
                    return (
                      v.name.toLowerCase().includes(q) ||
                      (v.mobile_number && v.mobile_number.includes(q)) ||
                      (v.village_name && v.village_name.toLowerCase().includes(q)) ||
                      (v.xetra_name && v.xetra_name.toLowerCase().includes(q)) ||
                      (v.group_name && v.group_name.toLowerCase().includes(q)) ||
                      (v.email && v.email.toLowerCase().includes(q)) ||
                      v.volunteer_id.toLowerCase().includes(q)
                    );
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                        <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <h4 className="text-base font-bold text-slate-700">
                          આ સેવા વિભાગમાં કોઈ સ્વયંસેવક મળ્યા નથી
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                          નવું આઈડી કાર્ડ બનાવતી વખતે <strong>"{selectedDeptForVolunteers.name}"</strong> પસંદ કરો અથવા સ્વયંસેવક યાદીમાંથી વિભાગ અપડેટ કરો.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filtered.map((vol) => {
                        const photoSrc = vol.photo_path
                          ? (vol.photo_path.startsWith('http') || vol.photo_path.startsWith('/')
                              ? vol.photo_path
                              : getStoragePublicUrl(vol.photo_path))
                          : null;

                        return (
                          <div
                            key={vol.id}
                            className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-blue-400 hover:shadow-md transition flex flex-col justify-between"
                          >
                            {/* Top: Avatar + Name + ID */}
                            <div className="flex items-start gap-3.5 mb-3">
                              <div className="w-14 h-16 rounded-lg bg-amber-50 border border-amber-300 overflow-hidden flex-shrink-0 shadow-inner flex items-center justify-center">
                                {photoSrc ? (
                                  <img
                                    src={photoSrc}
                                    alt={vol.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="font-black text-amber-800 text-lg">
                                    {vol.name.charAt(0)}
                                  </div>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="inline-block px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-mono text-[11px] font-bold mb-1">
                                  {vol.volunteer_id}
                                </div>
                                <h4 className="text-sm sm:text-base font-extrabold text-slate-900 truncate" title={vol.name}>
                                  {vol.name}
                                </h4>
                                <div className="mt-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                    <Sparkles className="w-3 h-3 text-amber-700" />
                                    {vol.group_name || 'ગ્રુપ - A (કેશવ)'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Details Table */}
                            <div className="space-y-1.5 text-xs border-t border-slate-100 pt-3 text-slate-700">
                              {/* Mobile */}
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 flex items-center gap-1 font-medium">
                                  <Phone className="w-3.5 h-3.5 text-amber-700" /> મોબાઇલ:
                                </span>
                                <a
                                  href={`tel:${vol.mobile_number}`}
                                  className="font-bold text-blue-700 hover:underline font-mono"
                                >
                                  {vol.mobile_number || '—'}
                                </a>
                              </div>

                              {/* Email */}
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 flex items-center gap-1 font-medium">
                                  <Mail className="w-3.5 h-3.5 text-blue-700" /> ઈમેઇલ:
                                </span>
                                <span className="font-semibold text-slate-800 truncate max-w-[180px]">
                                  {vol.email || '—'}
                                </span>
                              </div>

                              {/* Kshetra */}
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 flex items-center gap-1 font-medium">
                                  <MapPin className="w-3.5 h-3.5 text-rose-700" /> ક્ષેત્ર:
                                </span>
                                <span className="font-bold text-slate-800">
                                  {vol.xetra_name || '—'}
                                </span>
                              </div>

                              {/* Village */}
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500 flex items-center gap-1 font-medium">
                                  <Home className="w-3.5 h-3.5 text-emerald-700" /> ગામનું નામ:
                                </span>
                                <span className="font-bold text-slate-800">
                                  {vol.village_name || '—'}
                                </span>
                              </div>

                              {/* Duty Dates */}
                              {vol.duty_start_date && vol.duty_end_date && (
                                <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-200">
                                  <span className="text-slate-500 flex items-center gap-1 font-medium">
                                    <Calendar className="w-3.5 h-3.5 text-indigo-700" /> સેવા તારીખ:
                                  </span>
                                  <span className="font-bold text-indigo-900 text-[11px]">
                                    {new Date(vol.duty_start_date).toLocaleDateString('gu-IN')} થી {new Date(vol.duty_end_date).toLocaleDateString('gu-IN')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-white border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                વિભાગ: <strong>{selectedDeptForVolunteers.name}</strong>
              </span>
              <button
                type="button"
                onClick={() => setSelectedDeptForVolunteers(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition shadow"
              >
                બંધ કરો (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
