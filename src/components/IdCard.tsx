import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export interface IdCardProps {
  volunteerId: string;
  name: string;
  mobileNumber: string;
  villageName: string;
  xetraName: string;
  sevaVibhagName: string;
  photoUrl?: string | null;
  appUrl?: string;
  size?: 'preview' | 'full' | 'print';
}

export const IdCard = forwardRef<HTMLDivElement, IdCardProps>(
  (
    {
      volunteerId,
      name,
      mobileNumber,
      villageName,
      xetraName,
      sevaVibhagName,
      photoUrl,
      appUrl,
      size = 'full',
    },
    ref
  ) => {
    // Current base URL for verification QR Code
    const baseUrl =
      appUrl ||
      import.meta.env.VITE_APP_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'https://baps-tithal.netlify.app');

    const verificationUrl = `${baseUrl.replace(/\/$/, '')}/verify/${volunteerId || 'BAPS-00000-TNL'}`;

    // Auto calculate font size for Seva Vibhag Banner based on length
    const getVibhagFontSize = (text: string) => {
      const len = text ? text.length : 0;
      if (len > 22) return 'text-[11px] leading-[13px]';
      if (len > 16) return 'text-[13px] leading-[15px]';
      if (len > 12) return 'text-[14px] leading-[16px]';
      return 'text-[16px] leading-[18px]';
    };

    // Auto calculate font size for Volunteer Name
    const getNameFontSize = (text: string) => {
      const len = text ? text.length : 0;
      if (len > 26) return 'text-[12px] leading-tight';
      if (len > 18) return 'text-[13.5px] leading-tight';
      return 'text-[14.5px] leading-tight';
    };

    // Container sizing classes
    // Exact 74mm x 100mm aspect ratio = 0.74
    // Standard full size: 370px x 500px (1:1.35135)
    // Target 300 DPI export size: 874px x 1181px
    return (
      <div
        ref={ref}
        id={`id-card-${volunteerId || 'preview'}`}
        className={`relative overflow-hidden select-none bg-[#FFFDF5] text-slate-900 border-[3px] border-[#C59B27] rounded-xl shadow-xl flex flex-col justify-between font-gujarati ${
          size === 'preview'
            ? 'w-[320px] h-[432px]'
            : size === 'print'
            ? 'w-[74mm] h-[100mm] shadow-none border-[1.5mm]'
            : 'w-[370px] h-[500px]'
        }`}
        style={{
          boxSizing: 'border-box',
          // Double golden border simulation
          outline: '2px solid #8A6818',
          outlineOffset: '-5px',
        }}
      >
        {/* Subtle Temple Background Watermark */}
        <div
          className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none opacity-[0.16] mix-blend-multiply"
          style={{ backgroundImage: `url('/mandir.jpeg')` }}
        />

        {/* Decorative Golden Corner Filigree Accents */}
        <div className="absolute top-1.5 left-1.5 w-4 h-4 border-t-2 border-l-2 border-[#C59B27] pointer-events-none z-10" />
        <div className="absolute top-1.5 right-1.5 w-4 h-4 border-t-2 border-r-2 border-[#C59B27] pointer-events-none z-10" />
        <div className="absolute bottom-1.5 left-1.5 w-4 h-4 border-b-2 border-l-2 border-[#C59B27] pointer-events-none z-10" />
        <div className="absolute bottom-1.5 right-1.5 w-4 h-4 border-b-2 border-r-2 border-[#C59B27] pointer-events-none z-10" />

        {/* TOP SECTION: Dual Logos + Header */}
        <div className="relative z-10 pt-2.5 px-3 flex flex-col items-center">
          <div className="w-full flex items-center justify-between gap-1">
            {/* Left BAPS Logo */}
            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="BAPS"
                className="w-full h-full object-contain filter drop-shadow-sm"
              />
            </div>

            {/* Central Organization Title */}
            <div className="flex-1 text-center px-0.5">
              <h1 className="text-[14.5px] font-extrabold text-[#800000] tracking-tight leading-[17px] drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                BAPS સ્વામિનારાયણ મંદિર
              </h1>
              <h2 className="text-[12.5px] font-bold text-[#8A6818] tracking-normal leading-[15px]">
                તીથલ - વલસાડ
              </h2>
            </div>

            {/* Right BAPS Logo */}
            <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="BAPS"
                className="w-full h-full object-contain filter drop-shadow-sm"
              />
            </div>
          </div>

          {/* DYNAMIC BLUE SEVA VIBHAG RIBBON */}
          <div className="w-full mt-2 relative">
            <div className="relative mx-auto w-[94%] bg-gradient-to-r from-[#172554] via-[#1E40AF] to-[#172554] text-white py-1 px-3 rounded shadow-md border-y border-[#DFC15D] text-center flex items-center justify-center min-h-[30px]">
              {/* Ribbon Gold Accents */}
              <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#F3E5AB]" />
              <span
                className={`font-bold tracking-wide text-amber-100 uppercase ${getVibhagFontSize(
                  sevaVibhagName || 'સ્વયંસેવક દળ'
                )}`}
              >
                {sevaVibhagName || 'સ્વયંસેવક દળ'}
              </span>
              <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#F3E5AB]" />
            </div>
          </div>
        </div>

        {/* MIDDLE SECTION: Centered Photograph & Details */}
        <div className="relative z-10 px-3 flex-1 flex flex-col justify-center items-center py-1">
          {/* Volunteer Photograph in Golden Frame */}
          <div className="relative mb-2">
            <div className="w-[108px] h-[130px] rounded-lg p-[3px] bg-gradient-to-b from-[#EAB308] via-[#CA8A04] to-[#A16207] shadow-md">
              <div className="w-full h-full rounded-[6px] overflow-hidden bg-slate-100 flex items-center justify-center border border-white">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={name || 'Volunteer'}
                    className="w-full h-full object-cover object-top"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-amber-50/70 text-[#8A6818]">
                    <svg
                      className="w-10 h-10 opacity-70"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                    <span className="text-[10px] font-semibold mt-1">ફોટો</span>
                  </div>
                )}
              </div>
            </div>
            {/* Small Gold Seal Tag */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#C59B27] rounded-full border border-white shadow flex items-center justify-center text-[10px] text-white font-bold">
              ✓
            </div>
          </div>

          {/* Volunteer Gujarati Details Grid + QR Code */}
          <div className="w-full flex items-center justify-between gap-2 px-1">
            {/* Personal Details */}
            <div className="flex-1 space-y-1 text-left">
              <div className="flex items-start">
                <span className="text-[13px] font-bold text-slate-700 min-w-[45px] inline-block">
                  નામ :
                </span>
                <span className={`font-extrabold text-slate-900 ${getNameFontSize(name)}`}>
                  {name || '—'}
                </span>
              </div>

              <div className="flex items-center">
                <span className="text-[13px] font-bold text-slate-700 min-w-[45px] inline-block">
                  મો. નં. :
                </span>
                <span className="text-[13px] font-bold tracking-wider text-slate-900">
                  {mobileNumber || '—'}
                </span>
              </div>

              <div className="flex items-center">
                <span className="text-[13px] font-bold text-slate-700 min-w-[45px] inline-block">
                  ગામ :
                </span>
                <span className="text-[13px] font-semibold text-slate-900">
                  {villageName || '—'}
                </span>
              </div>

              <div className="flex items-center">
                <span className="text-[13px] font-bold text-slate-700 min-w-[45px] inline-block">
                  ક્ષેત્ર :
                </span>
                <span className="text-[13px] font-semibold text-slate-900">
                  {xetraName || '—'}
                </span>
              </div>
            </div>

            {/* QR Code and Unique Volunteer ID */}
            <div className="flex flex-col items-center flex-shrink-0 bg-white/90 p-1 rounded-lg border border-[#DFC15D] shadow-sm">
              <div className="p-0.5 bg-white rounded">
                <QRCodeSVG
                  value={verificationUrl}
                  size={58}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <span className="text-[9px] font-bold tracking-tight text-[#800000] mt-0.5">
                {volunteerId || 'BAPS-XXXXX'}
              </span>
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION: Sacred Quote + Crimson Ribbon */}
        <div className="relative z-10 w-full flex flex-col items-center">
          {/* Sacred Mahant Swami Maharaj Blessing Quote */}
          <div className="w-full text-center py-0.5 px-2 bg-gradient-to-r from-transparent via-amber-100/70 to-transparent border-t border-[#DFC15D]/40">
            <p className="text-[11.5px] font-bold text-[#800000] italic leading-tight">
              " સેવા મોક્ષ માટે કરવી " - મહંતસ્વામી મહારાજ
            </p>
          </div>

          {/* Crimson Red Bottom Ribbon */}
          <div className="w-full bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#7F1D1D] text-white py-1.5 px-3 text-center border-t border-[#DFC15D] flex items-center justify-between">
            <span className="text-[10px] tracking-widest text-amber-200 uppercase font-semibold">
              BAPS TITHAL
            </span>
            <span className="text-[13px] font-bold text-white tracking-wide">
              સ્વયંસેવક દળ - Tithal
            </span>
            <span className="text-[10px] tracking-widest text-amber-200 uppercase font-semibold">
              2026
            </span>
          </div>
        </div>
      </div>
    );
  }
);

IdCard.displayName = 'IdCard';
