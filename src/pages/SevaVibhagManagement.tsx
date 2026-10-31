import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SevaVibhag } from '../types';
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
                  className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                    dept.is_active
                      ? 'bg-amber-50/20 border-slate-200 hover:border-amber-400'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div>
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

                      <span className="text-xs text-slate-500 font-semibold flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        {assignedCount} સ્વયંસેવકો
                      </span>
                    </div>

                    {/* Department Name in Royal Blue Banner preview */}
                    <div className="my-2 p-2 bg-gradient-to-r from-[#172554] via-[#1E40AF] to-[#172554] text-white rounded text-center font-bold text-sm border-y border-[#DFC15D] tracking-wide shadow-sm">
                      {dept.name}
                    </div>
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
    </div>
  );
};
