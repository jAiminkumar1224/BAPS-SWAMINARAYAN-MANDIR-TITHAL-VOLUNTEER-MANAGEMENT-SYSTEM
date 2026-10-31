import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase, isSupabaseConfigured, getStoragePublicUrl } from '../lib/supabase';
import { SevaVibhag, Volunteer } from '../types';
import { KSHETRA_LIST } from '../constants/kshetra';
import { IdCard } from '../components/IdCard';
import { PhotoCropModal } from '../components/PhotoCropModal';
import { downloadCardAsPdf, downloadCardAsPng, printCard } from '../utils/exportCard';
import {
  Camera,
  Download,
  Printer,
  Save,
  Eye,
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

export const EditVolunteer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);

  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [villageName, setVillageName] = useState('');
  const [xetraName, setXetraName] = useState('');
  const [sevaVibhagId, setSevaVibhagId] = useState('');
  const [selectedDeptName, setSelectedDeptName] = useState('સ્વયંસેવક દળ');
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [newPhotoBlob, setNewPhotoBlob] = useState<Blob | null>(null);

  const [departments, setDepartments] = useState<SevaVibhag[]>([]);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!isSupabaseConfigured) {
        const saved = localStorage.getItem('baps_mock_volunteers');
        const list: Volunteer[] = saved ? JSON.parse(saved) : [];
        const found = list.find((v) => v.id === id);
        if (found) {
          setVolunteer(found);
          setName(found.name);
          setMobileNumber(found.mobile_number);
          setVillageName(found.village_name);
          setXetraName(found.xetra_name);
          setSevaVibhagId(found.seva_vibhag_id || '1');
          setSelectedDeptName(found.seva_vibhag?.name || 'સ્વયંસેવક દળ');
          setPhotoPreviewUrl(found.photo_path);
        }
        setDepartments([
          { id: '1', name: 'સ્વયંસેવક દળ', is_active: true },
          { id: '2', name: 'પાર્કિંગ સેવા', is_active: true },
          { id: '3', name: 'ભોજન સેવા', is_active: true },
          { id: '4', name: 'ઉતારા સેવા', is_active: true },
          { id: '5', name: 'વ્યવસ્થા સેવા', is_active: true },
          { id: '6', name: 'સ્વાગત સેવા', is_active: true },
          { id: '7', name: 'મહિલા સેવા', is_active: true },
        ]);
        setLoading(false);
        return;
      }

      // Fetch Departments
      const { data: deptData } = await supabase
        .from('seva_vibhag')
        .select('*')
        .order('name');
      setDepartments(deptData || []);

      // Fetch Volunteer
      const { data: volData, error: volError } = await supabase
        .from('volunteers')
        .select(`
          *,
          seva_vibhag:seva_vibhag_id (id, name, is_active)
        `)
        .eq('id', id)
        .single();

      if (!volError && volData) {
        const v = volData as unknown as Volunteer;
        setVolunteer(v);
        setName(v.name);
        setMobileNumber(v.mobile_number);
        setVillageName(v.village_name);
        setXetraName(v.xetra_name);
        setSevaVibhagId(v.seva_vibhag_id || '');
        setSelectedDeptName(v.seva_vibhag?.name || 'સ્વયંસેવક દળ');
        if (v.photo_path) {
          setPhotoPreviewUrl(getStoragePublicUrl(v.photo_path));
        }
      }
    } catch (err) {
      console.error('Error fetching volunteer for edit:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeptChange = (deptId: string) => {
    setSevaVibhagId(deptId);
    const found = departments.find((d) => d.id === deptId);
    if (found) setSelectedDeptName(found.name);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'સ્વયંસેવકનું નામ જરૂરી છે.';
    if (!/^[6-9]\d{9}$/.test(mobileNumber.trim())) {
      newErrors.mobileNumber = 'માન્ય 10 આંકડાનો ભારતીય મોબાઇલ નંબર દાખલ કરો.';
    }
    if (!villageName.trim()) newErrors.villageName = 'ગામનું નામ જરૂરી છે.';
    if (!xetraName.trim()) newErrors.xetraName = 'ક્ષેત્રનું નામ જરૂરી છે.';
    if (!sevaVibhagId) newErrors.sevaVibhagId = 'સેવા વિભાગ જરૂરી છે.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !volunteer) return;

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      let finalPhotoPath = volunteer.photo_path;

      if (newPhotoBlob) {
        if (isSupabaseConfigured) {
          const fileName = `${volunteer.volunteer_id}_${Date.now()}.jpg`;
          const { error: uploadError } = await supabase.storage
            .from('volunteer-photos')
            .upload(fileName, newPhotoBlob, {
              contentType: 'image/jpeg',
              upsert: true,
            });

          if (!uploadError) {
            // Delete old photo if existed
            if (volunteer.photo_path) {
              await supabase.storage
                .from('volunteer-photos')
                .remove([volunteer.photo_path]);
            }
            finalPhotoPath = fileName;
          }
        } else {
          finalPhotoPath = photoPreviewUrl;
        }
      }

      if (isSupabaseConfigured) {
        const { error: updateError } = await supabase
          .from('volunteers')
          .update({
            name: name.trim(),
            mobile_number: mobileNumber.trim(),
            village_name: villageName.trim(),
            xetra_name: xetraName.trim(),
            seva_vibhag_id: sevaVibhagId,
            photo_path: finalPhotoPath,
          })
          .eq('id', volunteer.id);

        if (updateError) throw updateError;
      } else {
        const saved = localStorage.getItem('baps_mock_volunteers');
        const list: Volunteer[] = saved ? JSON.parse(saved) : [];
        const updated = list.map((v) =>
          v.id === volunteer.id
            ? {
                ...v,
                name: name.trim(),
                mobile_number: mobileNumber.trim(),
                village_name: villageName.trim(),
                xetra_name: xetraName.trim(),
                seva_vibhag_id: sevaVibhagId,
                photo_path: finalPhotoPath,
                seva_vibhag: { id: sevaVibhagId, name: selectedDeptName, is_active: true },
              }
            : v
        );
        localStorage.setItem('baps_mock_volunteers', JSON.stringify(updated));
      }

      setSuccessMessage('માહિતી સફળતાપૂર્વક અપડેટ થઈ ગઈ છે!');
      setTimeout(() => {
        navigate('/volunteers');
      }, 1500);
    } catch (err: any) {
      console.error('Error updating volunteer:', err);
      alert(err.message || 'અપડેટ કરવામાં ભૂલ આવી.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-500">માહિતી લોડ થઈ રહી છે...</div>;
  }

  if (!volunteer) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 font-bold mb-4">સ્વયંસેવક રેકોર્ડ મળ્યો નથી.</p>
        <button
          onClick={() => navigate('/volunteers')}
          className="px-4 py-2 bg-amber-700 text-white rounded-lg text-xs font-bold"
        >
          તમામ સ્વયંસેવકો જુઓ
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/volunteers')}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            આઈડી કાર્ડમાં સુધારો કરો (Edit ID Card)
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm">
            આઈડી નંબર: <strong className="text-[#800000]">{volunteer.volunteer_id}</strong>
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-600 rounded-lg flex items-center gap-3 text-emerald-800 text-sm font-bold shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* FORM (7 COLS) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 shadow-md border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* PHOTO */}
            <div>
              <label className="block text-sm font-extrabold text-slate-800 mb-2">
                સ્વયંસેવક ફોટો (Photo)
              </label>
              <div className="flex items-center gap-4">
                <div className="w-24 h-28 rounded-xl border-2 border-amber-400 bg-slate-100 overflow-hidden shadow-sm flex items-center justify-center">
                  {photoPreviewUrl ? (
                    <img src={photoPreviewUrl} alt="Volunteer" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-400 font-bold">ફોટો નથી</span>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setIsPhotoModalOpen(true)}
                    className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4 text-amber-200" />
                    ફોટો બદલો / નવો ક્રોપ કરો
                  </button>
                </div>
              </div>
            </div>

            {/* NAME */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">
                નામ (Full Name) *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm ${
                  errors.name ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.name && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.name}
                </p>
              )}
            </div>

            {/* MOBILE */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">
                મોબાઇલ નંબર (Mobile) *
              </label>
              <input
                type="tel"
                maxLength={10}
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm ${
                  errors.mobileNumber ? 'border-red-500' : 'border-slate-300'
                }`}
              />
              {errors.mobileNumber && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.mobileNumber}
                </p>
              )}
            </div>

            {/* VILLAGE & XETRA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  ગામ (Village) *
                </label>
                <input
                  type="text"
                  value={villageName}
                  onChange={(e) => setVillageName(e.target.value)}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm ${
                    errors.villageName ? 'border-red-500' : 'border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  ક્ષેત્ર (Kshetra) *
                </label>
                <select
                  value={xetraName}
                  onChange={(e) => setXetraName(e.target.value)}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium text-slate-800 ${
                    errors.xetraName ? 'border-red-500' : 'border-slate-300'
                  }`}
                >
                  <option value="">-- ક્ષેત્ર પસંદ કરો --</option>
                  {KSHETRA_LIST.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                  {/* If existing volunteer had a custom/old Kshetra not in the 19 list, still preserve it */}
                  {xetraName && !KSHETRA_LIST.includes(xetraName as any) && (
                    <option value={xetraName}>{xetraName}</option>
                  )}
                </select>
              </div>
            </div>

            {/* SEVA VIBHAG */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">
                સેવા વિભાગ (Seva Vibhag) *
              </label>
              <select
                value={sevaVibhagId}
                onChange={(e) => handleDeptChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-[#1E3A8A]"
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* BUTTONS */}
            <div className="pt-4 border-t border-slate-200 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 px-5 bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    અપડેટ થાય છે...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    સુધારો સેવ કરો (Update)
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/volunteers')}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm"
              >
                રદ કરો
              </button>
            </div>
          </form>
        </div>

        {/* LIVE CARD PREVIEW (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full bg-white rounded-2xl p-6 shadow-md border border-slate-200 flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5 uppercase">
                <Eye className="w-4 h-4 text-amber-700" />
                કાર્ડનું લાઈવ પ્રિવ્યૂ
              </span>
            </div>

            <div className="my-2 transform scale-95 sm:scale-100">
              <IdCard
                ref={cardRef}
                volunteerId={volunteer.volunteer_id}
                name={name || 'સ્વયંસેવકનું નામ'}
                mobileNumber={mobileNumber || '9876543210'}
                villageName={villageName || 'ગામ'}
                xetraName={xetraName || 'ક્ષેત્ર'}
                sevaVibhagName={selectedDeptName}
                photoUrl={photoPreviewUrl}
                size="full"
              />
            </div>

            <div className="w-full mt-6 pt-4 border-t border-slate-200 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (cardRef.current) {
                    downloadCardAsPdf(cardRef.current, `${volunteer.volunteer_id}_${name}.pdf`);
                  }
                }}
                className="py-2 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 shadow-sm"
              >
                <Download className="w-4 h-4 text-rose-700" />
                <span>PDF</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (cardRef.current) {
                    downloadCardAsPng(cardRef.current, `${volunteer.volunteer_id}_${name}.png`);
                  }
                }}
                className="py-2 bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-800 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 shadow-sm"
              >
                <Download className="w-4 h-4 text-blue-700" />
                <span>PNG</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (cardRef.current) printCard(cardRef.current);
                }}
                className="py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 shadow-sm"
              >
                <Printer className="w-4 h-4 text-amber-700" />
                <span>પ્રિન્ટ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <PhotoCropModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onCropComplete={(blob, previewUrl) => {
          setNewPhotoBlob(blob);
          setPhotoPreviewUrl(previewUrl);
        }}
      />
    </div>
  );
};
