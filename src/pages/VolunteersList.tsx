import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase, isSupabaseConfigured, getStoragePublicUrl } from '../lib/supabase';
import { Volunteer, SevaVibhag } from '../types';
import { KSHETRA_LIST } from '../constants/kshetra';
import { DEFAULT_MOCK_SEVA_VIBHAGS } from '../constants/sevaVibhag';
import { IdCard } from '../components/IdCard';
import { useAuth } from '../context/AuthContext';
import { downloadCardAsPdf, downloadCardAsPng, printCard } from '../utils/exportCard';
import {
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  Printer,
  X,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  CheckSquare,
  Square,
  RefreshCw,
} from 'lucide-react';

export const VolunteersList: React.FC = () => {
  const { isSuperAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const previewModalCardRef = useRef<HTMLDivElement>(null);

  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [departments, setDepartments] = useState<SevaVibhag[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');
  const [selectedVillageFilter, setSelectedVillageFilter] = useState('');
  const [selectedXetraFilter, setSelectedXetraFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal Card Preview
  const [viewingVolunteer, setViewingVolunteer] = useState<Volunteer | null>(null);

  // Delete Confirmation
  const [deletingVolunteer, setDeletingVolunteer] = useState<Volunteer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Multi-card selection for batch printing
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchPrinting, setIsBatchPrinting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Check URL query param to open preview directly
  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId && volunteers.length > 0) {
      const found = volunteers.find((v) => v.id === viewId || v.volunteer_id === viewId);
      if (found) setViewingVolunteer(found);
    }
  }, [searchParams, volunteers]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        // Load from mock localStorage
        const saved = localStorage.getItem('baps_mock_volunteers');
        let initialList: Volunteer[] = saved ? JSON.parse(saved) : [];
        if (initialList.length === 0) {
          initialList = [
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
            {
              id: '3',
              volunteer_id: 'BAPS-74932-TNL',
              name: 'યુગ પટેલ',
              mobile_number: '6356511350',
              village_name: 'જોરાવાસણ',
              xetra_name: 'તિથલ',
              seva_vibhag_id: '3',
              photo_path: null,
              created_at: new Date(Date.now() - 7200000).toISOString(),
              seva_vibhag: { id: '3', name: 'ભોજન સેવા', is_active: true },
            },
          ];
          localStorage.setItem('baps_mock_volunteers', JSON.stringify(initialList));
        }

        setVolunteers(initialList);
        setDepartments(DEFAULT_MOCK_SEVA_VIBHAGS);
        setLoading(false);
        return;
      }

      // Fetch Seva Vibhags
      const { data: deptData } = await supabase
        .from('seva_vibhag')
        .select('*')
        .order('name');
      setDepartments(deptData || []);

      // Fetch Volunteers
      const { data: volData, error: volError } = await supabase
        .from('volunteers')
        .select(`
          *,
          seva_vibhag:seva_vibhag_id (id, name, is_active)
        `)
        .order('created_at', { ascending: false });

      if (!volError && volData) {
        setVolunteers(volData as unknown as Volunteer[]);
      }
    } catch (err) {
      console.error('Error fetching volunteers list:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isSuperAdmin) {
      alert('સ્વયંસેવક ડિલીટ કરવાનો અધિકાર ફક્ત સુપર એડમિન પાસે છે.');
      setDeletingVolunteer(null);
      return;
    }
    if (!deletingVolunteer) return;
    setIsDeleting(true);

    try {
      if (isSupabaseConfigured) {
        // Delete photo if exists
        if (deletingVolunteer.photo_path) {
          await supabase.storage
            .from('volunteer-photos')
            .remove([deletingVolunteer.photo_path]);
        }

        const { error } = await supabase
          .from('volunteers')
          .delete()
          .eq('id', deletingVolunteer.id);

        if (error) throw error;
      } else {
        const updated = volunteers.filter((v) => v.id !== deletingVolunteer.id);
        localStorage.setItem('baps_mock_volunteers', JSON.stringify(updated));
      }

      setVolunteers((prev) => prev.filter((v) => v.id !== deletingVolunteer.id));
      setDeletingVolunteer(null);
    } catch (err: any) {
      console.error('Error deleting volunteer:', err);
      alert(err.message || 'ડિલીટ કરવામાં ભૂલ થઈ.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter & Search Logic
  const filteredVolunteers = volunteers.filter((vol) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      vol.name.toLowerCase().includes(q) ||
      vol.volunteer_id.toLowerCase().includes(q) ||
      vol.mobile_number.includes(q) ||
      vol.village_name.toLowerCase().includes(q) ||
      vol.xetra_name.toLowerCase().includes(q);

    const matchesDept =
      !selectedDeptFilter || vol.seva_vibhag_id === selectedDeptFilter;
    const matchesVillage =
      !selectedVillageFilter ||
      vol.village_name.toLowerCase() === selectedVillageFilter.toLowerCase();
    const matchesXetra =
      !selectedXetraFilter ||
      vol.xetra_name.toLowerCase() === selectedXetraFilter.toLowerCase();

    return matchesSearch && matchesDept && matchesVillage && matchesXetra;
  });

  // Extract unique villages and xetras for filter dropdowns
  const uniqueVillages = Array.from(new Set(volunteers.map((v) => v.village_name))).filter(Boolean);
  const uniqueXetras = Array.from(
    new Set([...KSHETRA_LIST, ...volunteers.map((v) => v.xetra_name)])
  ).filter(Boolean);

  // Pagination calculation
  const totalPages = Math.ceil(filteredVolunteers.length / pageSize) || 1;
  const paginatedVolunteers = filteredVolunteers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedVolunteers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedVolunteers.map((v) => v.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePrintBatch = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            તમામ સ્વયંસેવકો (All Volunteers)
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
            કુલ {filteredVolunteers.length} સ્વયંસેવકો નોંધાયેલા છે.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fetchInitialData}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition border border-slate-300"
            title="નવો ડેટા રીફ્રેશ કરો"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
            <span>રીફ્રેશ</span>
          </button>

          {selectedIds.length > 0 && (
            <button
              onClick={handlePrintBatch}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              પસંદ કરેલા {selectedIds.length} કાર્ડ પ્રિન્ટ કરો
            </button>
          )}

          <Link
            to="/create"
            className="px-4 py-2 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2 transition"
          >
            <UserPlus className="w-4 h-4 text-amber-200" />
            નવું આઈડી કાર્ડ બનાવો
          </Link>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="નામ, મોબાઈલ, ગામ, આઈડી શોધો..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDeptFilter}
              onChange={(e) => {
                setSelectedDeptFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 font-medium"
            >
              <option value="">તમામ સેવા વિભાગ</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Village Filter */}
          <div>
            <select
              value={selectedVillageFilter}
              onChange={(e) => {
                setSelectedVillageFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 font-medium"
            >
              <option value="">તમામ ગામ</option>
              {uniqueVillages.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Kshetra Filter */}
          <div>
            <select
              value={selectedXetraFilter}
              onChange={(e) => {
                setSelectedXetraFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 font-medium"
            >
              <option value="">તમામ ક્ષેત્ર</option>
              {uniqueXetras.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gradient-to-r from-slate-100 to-amber-50/60 border-b border-slate-200 text-slate-700 font-extrabold">
              <tr>
                <th className="p-3 text-center w-10">
                  <button onClick={toggleSelectAll} className="text-slate-500 hover:text-slate-800">
                    {selectedIds.length === paginatedVolunteers.length && paginatedVolunteers.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-amber-700" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-3">આઈડી નંબર</th>
                <th className="p-3">ફોટો</th>
                <th className="p-3">સ્વયંસેવકનું નામ</th>
                <th className="p-3">મોબાઇલ નંબર</th>
                <th className="p-3">ગામ / ક્ષેત્ર</th>
                <th className="p-3">સેવા વિભાગ</th>
                <th className="p-3 text-center">ક્રિયાઓ (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500 font-medium">
                    માહિતી લોડ થઈ રહી છે...
                  </td>
                </tr>
              ) : paginatedVolunteers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    કોઈ સ્વયંસેવક મળ્યા નથી.
                  </td>
                </tr>
              ) : (
                paginatedVolunteers.map((vol) => {
                  const isSelected = selectedIds.includes(vol.id);
                  return (
                    <tr
                      key={vol.id}
                      className={`hover:bg-amber-50/30 transition ${
                        isSelected ? 'bg-amber-50/60' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <button
                          onClick={() => toggleSelectOne(vol.id)}
                          className="text-slate-500 hover:text-slate-800"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-amber-700" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="p-3 font-bold text-[#800000] whitespace-nowrap">
                        {vol.volunteer_id}
                      </td>

                      <td className="p-3">
                        <div className="w-10 h-12 rounded-md border border-[#C59B27] bg-slate-100 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-sm">
                          {vol.photo_path ? (
                            <img
                              src={getStoragePublicUrl(vol.photo_path)}
                              alt={vol.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[9px] text-slate-400 font-bold">ફોટો</span>
                          )}
                        </div>
                      </td>

                      <td className="p-3 font-extrabold text-slate-900">
                        {vol.name}
                      </td>

                      <td className="p-3 font-mono text-slate-700">
                        {vol.mobile_number}
                      </td>

                      <td className="p-3 text-slate-700">
                        <span className="font-semibold">{vol.village_name}</span>
                        <span className="text-slate-400 mx-1">/</span>
                        <span className="text-slate-500">{vol.xetra_name}</span>
                      </td>

                      <td className="p-3">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200">
                          {vol.seva_vibhag?.name || 'સ્વયંસેવક દળ'}
                        </span>
                        {vol.group_name && (
                          <span className="block mt-1 text-[11px] font-bold text-amber-900">
                            {vol.group_name}
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setViewingVolunteer(vol)}
                            title="આઈડી કાર્ડ જુઓ"
                            className="p-1.5 rounded-lg text-amber-800 hover:bg-amber-100 transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <Link
                            to={`/volunteers/edit/${vol.id}`}
                            title="એડિટ કરો"
                            className="p-1.5 rounded-lg text-blue-700 hover:bg-blue-100 transition"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>

                          {isSuperAdmin && (
                            <button
                              onClick={() => setDeletingVolunteer(vol)}
                              title="ડિલીટ કરો"
                              className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-100 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {!loading && filteredVolunteers.length > pageSize && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              પેજ {currentPage} / {totalPages}
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-2 rounded-lg border border-slate-300 hover:bg-white text-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-2 rounded-lg border border-slate-300 hover:bg-white text-slate-700 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* VIEW ID CARD MODAL */}
      {viewingVolunteer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 bg-gradient-to-r from-amber-700 to-amber-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm sm:text-base flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-300" />
                આઈડી કાર્ડ: {viewingVolunteer.name} ({viewingVolunteer.volunteer_id})
              </span>
              <button
                onClick={() => setViewingVolunteer(null)}
                className="text-amber-100 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto flex flex-col items-center justify-center bg-slate-100/60">
              <div className="transform scale-95 sm:scale-100">
                <IdCard
                  ref={previewModalCardRef}
                  volunteerId={viewingVolunteer.volunteer_id}
                  name={viewingVolunteer.name}
                  mobileNumber={viewingVolunteer.mobile_number}
                  villageName={viewingVolunteer.village_name}
                  xetraName={viewingVolunteer.xetra_name}
                  sevaVibhagName={viewingVolunteer.seva_vibhag?.name || 'સ્વયંસેવક દળ'}
                  photoUrl={getStoragePublicUrl(viewingVolunteer.photo_path)}
                  size="full"
                />
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (previewModalCardRef.current) {
                      downloadCardAsPdf(
                        previewModalCardRef.current,
                        `${viewingVolunteer.volunteer_id}_${viewingVolunteer.name}.pdf`
                      );
                    }
                  }}
                  className="px-3 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <Download className="w-4 h-4" /> PDF
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (previewModalCardRef.current) {
                      downloadCardAsPng(
                        previewModalCardRef.current,
                        `${viewingVolunteer.volunteer_id}_${viewingVolunteer.name}.png`
                      );
                    }
                  }}
                  className="px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <Download className="w-4 h-4" /> PNG (300 DPI)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (previewModalCardRef.current) {
                      printCard(previewModalCardRef.current);
                    }
                  }}
                  className="px-3 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" /> પ્રિન્ટ
                </button>
              </div>

              <button
                type="button"
                onClick={() => setViewingVolunteer(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold"
              >
                બંધ કરો
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingVolunteer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6">
            <h3 className="text-lg font-black text-rose-700 mb-2">
              આઈડી કાર્ડ ડિલીટ કરવાની ખાતરી
            </h3>
            <p className="text-sm text-slate-600 mb-4">
              શું તમે ખરેખર સ્વયંસેવક <strong>{deletingVolunteer.name}</strong> (આઈડી:{' '}
              {deletingVolunteer.volunteer_id}) નું રેકોર્ડ અને આઈડી કાર્ડ કાયમ માટે ડિલીટ કરવા
              માંગો છો?
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingVolunteer(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg text-sm"
              >
                રદ કરો
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg text-sm shadow flex items-center gap-2"
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
