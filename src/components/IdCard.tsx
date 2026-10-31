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

    const cleanVolunteerId = (volunteerId || 'BAPS-74930-TNL').trim();
    const verificationUrl = `${baseUrl.replace(/\/$/, '')}/verify/${cleanVolunteerId}`;

    // Auto font size for Seva Vibhag inside the White Text Box
    const getVibhagFontSize = (text: string) => {
      const len = text ? text.length : 0;
      if (len > 24) return 'text-[12px] sm:text-[13px]';
      if (len > 18) return 'text-[14px] sm:text-[16px]';
      if (len > 12) return 'text-[16px] sm:text-[18px]';
      return 'text-[18px] sm:text-[21px]';
    };

    // Auto font size for Volunteer Name
    const getNameFontSize = (text: string) => {
      const len = text ? text.length : 0;
      if (len > 26) return 'text-[11px] sm:text-[12.5px]';
      if (len > 18) return 'text-[12.5px] sm:text-[14px]';
      return 'text-[14px] sm:text-[15.5px]';
    };

    return (
      <div
        ref={ref}
        id={`id-card-${cleanVolunteerId}`}
        className={`relative overflow-hidden select-none font-gujarati shadow-2xl rounded-2xl ${
          size === 'preview'
            ? 'w-[320px] h-[433px]'
            : size === 'print'
            ? 'w-[74mm] h-[100mm] shadow-none rounded-none'
            : 'w-[378px] h-[512px]'
        }`}
        style={{
          boxSizing: 'border-box',
          aspectRatio: '756 / 1024',
        }}
      >
        {/* BACKGROUND TEMPLATE IMAGE */}
        <img
          src="/id-template.jpg"
          alt="BAPS Tithal ID Card Template"
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
          crossOrigin="anonymous"
        />

        {/* 1. CENTERED CIRCULAR VOLUNTEER PHOTO */}
        {/* Template Circle bounds: Left: 50%, Top: 43.5%, Width: 22.8%, Height: 16.8% */}
        <div
          className="absolute z-10 flex items-center justify-center pointer-events-none"
          style={{
            top: '43.5%',
            left: '50%',
            width: '22.8%',
            height: '16.8%',
            transform: 'translateX(-50%)',
          }}
        >
          <div className="w-full h-full rounded-full overflow-hidden bg-[#0A2E5C] flex items-center justify-center shadow-inner">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={name || 'Volunteer'}
                className="w-full h-full object-cover object-top"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-amber-200">
                <svg
                  className="w-1/2 h-1/2 opacity-70"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                <span className="text-[9px] font-bold mt-0.5">ફોટો</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. DYNAMIC SEVA VIBHAG IN WHITE TEXT BOX */}
        {/* Template White Box bounds: Top: 60.5%, Height: 7.0%, Left: 4.8%, Right: 4.8% */}
        <div
          className="absolute z-10 flex items-center justify-center text-center px-4"
          style={{
            top: '60.5%',
            left: '4.8%',
            right: '4.8%',
            height: '7.0%',
          }}
        >
          <span
            className={`font-black tracking-wide text-[#0C3260] drop-shadow-sm truncate ${getVibhagFontSize(
              sevaVibhagName || 'સ્વયંસેવક દળ'
            )}`}
          >
            {sevaVibhagName || 'સ્વયંસેવક દળ'}
          </span>
        </div>

        {/* 3. DYNAMIC VOLUNTEER DETAILS (VALUES NEXT TO PRE-PRINTED LABELS) */}
        {/* Template Navy Box spans Top 69.5% to 88.0%. Labels are pre-printed on Left up to 24.5%. */}
        {/* Values are placed from Left 25.0% to 73.0% */}
        <div
          className="absolute z-10 flex flex-col justify-between text-white font-extrabold"
          style={{
            top: '70.8%',
            left: '25.0%',
            width: '48.0%',
            height: '16.2%',
          }}
        >
          {/* ID Value */}
          <div className="flex items-center h-[20%]">
            <span className="text-[12px] sm:text-[13.5px] font-black tracking-wider text-amber-200 drop-shadow">
              {cleanVolunteerId}
            </span>
          </div>

          {/* Name Value */}
          <div className="flex items-center h-[20%]">
            <span
              className={`font-black text-white drop-shadow truncate ${getNameFontSize(
                name || '—'
              )}`}
              title={name}
            >
              {name || '—'}
            </span>
          </div>

          {/* Mobile Value */}
          <div className="flex items-center h-[20%]">
            <span className="text-[12px] sm:text-[13px] font-bold tracking-widest text-white drop-shadow font-mono">
              {mobileNumber || '—'}
            </span>
          </div>

          {/* Village Value */}
          <div className="flex items-center h-[20%]">
            <span className="text-[12px] sm:text-[13px] font-extrabold text-white drop-shadow truncate">
              {villageName || '—'}
            </span>
          </div>

          {/* Kshetra Value */}
          <div className="flex items-center h-[20%]">
            <span className="text-[12px] sm:text-[13px] font-extrabold text-white drop-shadow truncate">
              {xetraName || '—'}
            </span>
          </div>
        </div>

        {/* 4. DYNAMIC QR CODE OVERLAY */}
        {/* Template QR Box bounds: Left: 75.4%, Top: 70.3%, Width: 17.5%, Height: 14.0% */}
        <div
          className="absolute z-10 flex items-center justify-center p-1 bg-white rounded-lg shadow-sm"
          style={{
            top: '70.5%',
            left: '75.3%',
            width: '17.6%',
            height: '14.2%',
          }}
        >
          <div className="w-full h-full flex items-center justify-center">
            <QRCodeSVG
              value={verificationUrl}
              size={120}
              level="M"
              includeMargin={false}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      </div>
    );
  }
);

IdCard.displayName = 'IdCard';
