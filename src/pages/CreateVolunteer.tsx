import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SevaVibhag } from '../types';
import { KSHETRA_LIST } from '../constants/kshetra';
import { IdCard } from '../components/IdCard';
import { PhotoCropModal } from '../components/PhotoCropModal';
import { downloadCardAsPdf, downloadCardAsPng, printCard } from '../utils/exportCard';
import {
  Camera,
  Download,
  Printer,
  Save,
  X,
  Eye,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

export const CreateVolunteer: React.FC = () => {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);

  // Form State
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [villageName, setVillageName] = useState('');
  const [xetraName, setXetraName] = useState('');
  const [sevaVibhagId, setSevaVibhagId] = useState('');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);

  // Generated Unique ID
  const [volunteerId, setVolunteerId] = useState('');

  // Department list
  const [departments, setDepartments] = useState<SevaVibhag[]>([]);
  const [selectedDeptName, setSelectedDeptName] = useState('સ્વયંસેવક દળ');

  // Modal and Process states
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  // Generate Unique ID on mount: e.g. BAPS-74930-TNL
  const generateNewId = () => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `BAPS-${randomNum}-TNL`;
  };

  useEffect(() => {
    setVolunteerId(generateNewId());
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      if (!isSupabaseConfigured) {
        // Default example departments
        const defaults: SevaVibhag[] = [
          { id: '1', name: 'સ્વયંસેવક દળ', is_active: true },
          { id: '2', name: 'પાર્કિંગ સેવા', is_active: true },
          { id: '3', name: 'ભોજન સેવા', is_active: true },
          { id: '4', name: 'ઉતારા સેવા', is_active: true },
          { id: '5', name: 'વ્યવસ્થા સેવા', is_active: true },
          { id: '6', name: 'સ્વાગત સેવા', is_active: true },
          { id: '7', name: 'મહિલા સેવા', is_active: true },
          { id: '8', name: 'સભા સંચાલન', is_active: true },
          { id: '9', name: 'ડેકોરેશન વિભાગ', is_active: true },
          { id: '10', name: 'રસોડા વિભાગ', is_active: true },
        ];
        setDepartments(defaults);
        setSevaVibhagId(defaults[0].id);
        setSelectedDeptName(defaults[0].name);
        return;
      }

      const { data, error } = await supabase
        .from('seva_vibhag')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (!error && data && data.length > 0) {
        setDepartments(data);
        setSevaVibhagId(data[0].id);
        setSelectedDeptName(data[0].name);
      }
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  };

  const handleDeptChange = (id: string) => {
    setSevaVibhagId(id);
    const found = departments.find((d) => d.id === id);
    if (found) {
      setSelectedDeptName(found.name);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'કૃપા કરીને સ્વયંસેવકનું પૂરું નામ લખો.';
    }

    const cleanMobile = mobileNumber.trim();
    if (!cleanMobile) {
      newErrors.mobileNumber = 'મોબાઇલ નંબર જરૂરી છે.';
    } else if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      newErrors.mobileNumber = 'માન્ય 10 આંકડાનો ભારતીય મોબાઇલ નંબર દાખલ કરો.';
    }

    if (!villageName.trim()) {
      newErrors.villageName = 'ગામનું નામ જરૂરી છે.';
    }

    if (!xetraName.trim()) {
      newErrors.xetraName = 'ક્ષેત્રનું નામ જરૂરી છે.';
    }

    if (!sevaVibhagId) {
      newErrors.sevaVibhagId = 'સેવા વિભાગ પસંદ કરવો ફરજિયાત છે.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      let photoPath: string | null = null;

      if (photoBlob) {
        if (isSupabaseConfigured) {
          // Upload to Supabase Storage
          const fileExt = 'jpg';
          const fileName = `${volunteerId}_${Date.now()}.${fileExt}`;
          const filePath = `${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('volunteer-photos')
            .upload(filePath, photoBlob, {
              contentType: 'image/jpeg',
              upsert: true,
            });

          if (uploadError) {
            console.error('Photo upload error:', uploadError);
          } else {
            photoPath = filePath;
          }
        } else {
          // Fallback data url
          photoPath = photoPreviewUrl;
        }
      }

      if (isSupabaseConfigured) {
        const { error: insertError } = await supabase.from('volunteers').insert({
          volunteer_id: volunteerId,
          name: name.trim(),
          mobile_number: mobileNumber.trim(),
          village_name: villageName.trim(),
          xetra_name: xetraName.trim(),
          seva_vibhag_id: sevaVibhagId,
          photo_path: photoPath,
        });

        if (insertError) throw insertError;
      } else {
        // Save in local storage mock list
        const existing = JSON.parse(localStorage.getItem('baps_mock_volunteers') || '[]');
        const newRecord = {
          id: Date.now().toString(),
          volunteer_id: volunteerId,
          name: name.trim(),
          mobile_number: mobileNumber.trim(),
          village_name: villageName.trim(),
          xetra_name: xetraName.trim(),
          seva_vibhag_id: sevaVibhagId,
          photo_path: photoPath,
          created_at: new Date().toISOString(),
          seva_vibhag: { id: sevaVibhagId, name: selectedDeptName, is_active: true },
        };
        localStorage.setItem('baps_mock_volunteers', JSON.stringify([newRecord, ...existing]));
      }

      setSuccessMessage('આઈડી કાર્ડ સફળતાપૂર્વક બની ગયું છે અને સેવ થઈ ગયું છે!');
      setTimeout(() => {
        navigate('/volunteers');
      }, 1500);
    } catch (err: any) {
      console.error('Error saving volunteer:', err);
      alert(err.message || 'માહિતી સેવ કરવામાં ભૂલ આવી.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            નવું આઈડી કાર્ડ બનાવો (Create Volunteer ID Card)
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-0.5">
            વિગતો ભરો અને સાથે જ 74mm × 100mm પ્રમાણસરનું લાઈવ પ્રિવ્યૂ જુઓ.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-amber-900 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-700" />
            કાર્ડ આઈડી: {volunteerId}
          </span>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-600 rounded-lg flex items-center gap-3 text-emerald-800 text-sm font-bold shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Grid: Form Left, Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* FORM (7 COLS) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 shadow-md border border-slate-200">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* PHOTO UPLOAD BOX */}
            <div>
              <label className="block text-sm font-extrabold text-slate-800 mb-2">
                સ્વયંસેવક ફોટો (Photograph) *
              </label>

              <div className="flex flex-wrap items-center gap-4">
                <div className="w-24 h-28 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50/40 overflow-hidden flex items-center justify-center relative shadow-sm">
                  {photoPreviewUrl ? (
                    <img
                      src={photoPreviewUrl}
                      alt="Volunteer Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-2 text-amber-800">
                      <Camera className="w-7 h-7 mx-auto opacity-70 mb-1" />
                      <span className="text-[10px] font-bold block">ફોટો નથી</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsPhotoModalOpen(true)}
                    className="px-4 py-2.5 bg-gradient-to-r from-amber-700 to-amber-800 hover:from-amber-800 hover:to-amber-900 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2 transition"
                  >
                    <Camera className="w-4 h-4 text-amber-200" />
                    ફોટો પસંદ કરો / કેમેરા લો
                  </button>
                  <p className="text-[11px] text-slate-500">
                    મોબાઇલ ગેલેરી, કેમેરા કે ડેસ્કટોપ વેબકેમથી ફોટો લઈને ક્રોપ કરો.
                  </p>
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
                placeholder="દા.ત. ભાવેશ ગણપતસિંહ દેસાઈ"
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 transition ${
                  errors.name ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                }`}
              />
              {errors.name && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.name}
                </p>
              )}
            </div>

            {/* MOBILE NUMBER */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">
                મોબાઇલ નંબર (Mobile Number) *
              </label>
              <input
                type="tel"
                maxLength={10}
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                placeholder="9662510539"
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 transition tracking-wider ${
                  errors.mobileNumber ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                }`}
              />
              {errors.mobileNumber && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {errors.mobileNumber}
                </p>
              )}
            </div>

            {/* VILLAGE & XETRA IN 2 COLS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  ગામ (Village) *
                </label>
                <input
                  type="text"
                  value={villageName}
                  onChange={(e) => setVillageName(e.target.value)}
                  placeholder="દા.ત. કાપરીયા / જોરાવાસણ"
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 transition ${
                    errors.villageName ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                  }`}
                />
                {errors.villageName && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.villageName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1">
                  ક્ષેત્ર (Kshetra) *
                </label>
                <select
                  value={xetraName}
                  onChange={(e) => setXetraName(e.target.value)}
                  className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 transition font-medium text-slate-800 ${
                    errors.xetraName ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                  }`}
                >
                  <option value="">-- ક્ષેત્ર પસંદ કરો --</option>
                  {KSHETRA_LIST.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                {errors.xetraName && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {errors.xetraName}
                  </p>
                )}
              </div>
            </div>

            {/* SEVA VIBHAG SELECTOR */}
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1">
                સેવા વિભાગ (Seva Vibhag) *
              </label>
              <select
                value={sevaVibhagId}
                onChange={(e) => handleDeptChange(e.target.value)}
                className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-600 transition font-bold text-[#1E3A8A] ${
                  errors.sevaVibhagId ? 'border-red-500 bg-red-50/30' : 'border-slate-300'
                }`}
              >
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                સેવા વિભાગ પસંદ કરવાથી કાર્ડના બ્લૂ બેનરમાં તે નામ આપોઆપ આવી જશે.
              </p>
            </div>

            {/* BUTTONS */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 px-5 bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white font-black rounded-xl shadow-lg flex items-center justify-center gap-2 text-sm transition disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    સેવ થઈ રહ્યું છે...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    સેવ કરો (Save Volunteer)
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/volunteers')}
                className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition"
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
              <span className="text-xs font-extrabold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Eye className="w-4 h-4 text-amber-700" />
                કાર્ડનું લાઈવ પ્રિવ્યૂ (74mm × 100mm)
              </span>
              <span className="text-[11px] font-bold text-slate-400">1:1 પ્રમાણસર</span>
            </div>

            {/* Master Card Component Rendered Live */}
            <div className="my-2 transition-all duration-200 transform scale-95 sm:scale-100">
              <IdCard
                ref={cardRef}
                volunteerId={volunteerId}
                name={name || 'સ્વયંસેવકનું નામ'}
                mobileNumber={mobileNumber || '9876543210'}
                villageName={villageName || 'ગામ'}
                xetraName={xetraName || 'ક્ષેત્ર'}
                sevaVibhagName={selectedDeptName}
                photoUrl={photoPreviewUrl}
                size="full"
              />
            </div>

            {/* Quick Export Controls */}
            <div className="w-full mt-6 pt-4 border-t border-slate-200 space-y-2">
              <p className="text-xs text-center font-bold text-slate-500 mb-2">
                ઇન્સ્ટન્ટ ડાઉનલોડ અને પ્રિન્ટ
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (cardRef.current) {
                      downloadCardAsPdf(cardRef.current, `${volunteerId}_${name || 'Card'}.pdf`);
                    }
                  }}
                  className="py-2 px-2 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 transition shadow-sm"
                >
                  <Download className="w-4 h-4 text-rose-700" />
                  <span>PDF ડાઉનલોડ</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (cardRef.current) {
                      downloadCardAsPng(cardRef.current, `${volunteerId}_${name || 'Card'}.png`);
                    }
                  }}
                  className="py-2 px-2 bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-800 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 transition shadow-sm"
                >
                  <Download className="w-4 h-4 text-blue-700" />
                  <span>PNG ડાઉનલોડ</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (cardRef.current) {
                      printCard(cardRef.current);
                    }
                  }}
                  className="py-2 px-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 transition shadow-sm"
                >
                  <Printer className="w-4 h-4 text-amber-700" />
                  <span>પ્રિન્ટ કરો</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Crop Modal */}
      <PhotoCropModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onCropComplete={(blob, previewUrl) => {
          setPhotoBlob(blob);
          setPhotoPreviewUrl(previewUrl);
        }}
      />
    </div>
  );
};
