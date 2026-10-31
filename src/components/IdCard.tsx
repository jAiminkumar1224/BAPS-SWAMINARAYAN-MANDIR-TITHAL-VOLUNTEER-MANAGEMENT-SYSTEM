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
    // Base URL for verification QR Code
    const baseUrl =
      appUrl ||
      import.meta.env.VITE_APP_URL ||
      (typeof window !== 'undefined' ? window.location.origin : 'https://baps-tithal.netlify.app');

    const cleanVolunteerId = (volunteerId || 'BAPS-74930-TNL').trim();
    const verificationUrl = `${baseUrl.replace(/\/$/, '')}/verify/${cleanVolunteerId}`;

    // Auto font size for Seva Vibhag inside the White Text Box
    const getVibhagFontSize = (text: string) => {
      const len = text ? text.length : 0;
      if (len > 24) return 'text-[12px] sm:text-[14px]';
      if (len > 18) return 'text-[14px] sm:text-[16px]';
      if (len > 12) return 'text-[16px] sm:text-[19px]';
      return 'text-[19px] sm:text-[22px]';
    };

    // Auto font size for Volunteer Name
    const getNameFontSize = (text: string) => {
      const len = text ? text.length : 0;
      if (len > 28) return 'text-[11px] sm:text-[12px]';
      if (len > 20) return 'text-[12px] sm:text-[13.5px]';
      return 'text-[13px] sm:text-[14.5px]';
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
        {/* BACKGROUND TEMPLATE IMAGE (756 x 1024) */}
        <img
          src="/id-template.jpg"
          alt="BAPS Tithal ID Card Template"
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
          crossOrigin="anonymous"
        />

        {/* 1. CENTERED CIRCULAR VOLUNTEER PHOTO */}
        {/* Exact mathematical geometric center of inner circular frame: X: 50.0%, Y: 52.37%, Width: 21.8%, Height: 16.0% */}
        <div
          className="absolute z-10 flex items-center justify-center pointer-events-none"
          style={{
            top: '52.37%',
            left: '50.0%',
            width: '21.8%',
            height: '16.0%',
            transform: 'translate(-50%, -50%)',
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

        {/* 2. DYNAMIC SEVA VIBHAG IN WHITE TEXT BOX (EXACT CENTER FROM ALL SIDES [LTRB]) */}
        {/* Center: X: 50.0%, Y: 64.50%, Width: 90.3%, Height: 5.96% */}
        <div
          className="absolute z-10 flex items-center justify-center text-center pointer-events-none"
          style={{
            top: '64.50%',
            left: '50.0%',
            width: '90.3%',
            height: '5.96%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span
            className={`font-black tracking-wide text-[#0C3260] text-center leading-none truncate ${getVibhagFontSize(
              sevaVibhagName || 'સ્વયંસેવક દળ'
            )}`}
            style={{
              fontFamily: "'Noto Sans Gujarati', sans-serif",
            }}
          >
            {sevaVibhagName || 'સ્વયંસેવક દળ'}
          </span>
        </div>

        {/* 3. DYNAMIC VOLUNTEER DETAILS - EXACT SAME BASELINE AND FONT AS LABELS */}
        {/* All values use the exact same 'Noto Sans Gujarati', pure white, bold font */}

        {/* Line 1: ID (center y = 71.39%) */}
        <div
          className="absolute z-10 flex items-center"
          style={{
            top: '71.39%',
            left: '19.5%',
            width: '54.0%',
            transform: 'translateY(-50%)',
          }}
        >
          <span
            className="font-extrabold text-white leading-none tracking-wider text-[12px] sm:text-[13.5px] select-text drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]"
            style={{ fontFamily: "'Noto Sans Gujarati', sans-serif" }}
          >
            {cleanVolunteerId}
          </span>
        </div>

        {/* Line 2: Name (center y = 74.41%) */}
        <div
          className="absolute z-10 flex items-center"
          style={{
            top: '74.41%',
            left: '19.5%',
            width: '54.0%',
            transform: 'translateY(-50%)',
          }}
        >
          <span
            className={`font-extrabold text-white leading-none truncate select-text drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)] ${getNameFontSize(
              name || '—'
            )}`}
            style={{ fontFamily: "'Noto Sans Gujarati', sans-serif" }}
            title={name}
          >
            {name || '—'}
          </span>
        </div>

        {/* Line 3: Mobile (center y = 77.59%) */}
        <div
          className="absolute z-10 flex items-center"
          style={{
            top: '77.59%',
            left: '19.5%',
            width: '54.0%',
            transform: 'translateY(-50%)',
          }}
        >
          <span
            className="font-extrabold text-white leading-none tracking-widest text-[12px] sm:text-[13px] select-text drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]"
            style={{ fontFamily: "'Noto Sans Gujarati', sans-serif" }}
          >
            {mobileNumber || '—'}
          </span>
        </div>

        {/* Line 4: Village (center y = 80.62%) */}
        <div
          className="absolute z-10 flex items-center"
          style={{
            top: '80.62%',
            left: '19.5%',
            width: '54.0%',
            transform: 'translateY(-50%)',
          }}
        >
          <span
            className="font-extrabold text-white leading-none truncate text-[12px] sm:text-[13.5px] select-text drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]"
            style={{ fontFamily: "'Noto Sans Gujarati', sans-serif" }}
          >
            {villageName || '—'}
          </span>
        </div>

        {/* Line 5: Kshetra (center y = 83.79%) */}
        <div
          className="absolute z-10 flex items-center"
          style={{
            top: '83.79%',
            left: '19.5%',
            width: '54.0%',
            transform: 'translateY(-50%)',
          }}
        >
          <span
            className="font-extrabold text-white leading-none truncate text-[12px] sm:text-[13.5px] select-text drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]"
            style={{ fontFamily: "'Noto Sans Gujarati', sans-serif" }}
          >
            {xetraName || '—'}
          </span>
        </div>

        {/* 4. DYNAMIC QR CODE CONTAINER */}
        {/* Center: X: 85.58%, Y: 77.59%, Width: 18.0%, Height: 14.55% */}
        <div
          className="absolute z-10 flex items-center justify-center p-1 bg-white rounded-lg shadow-sm"
          style={{
            top: '77.59%',
            left: '85.58%',
            width: '18.0%',
            height: '14.55%',
            transform: 'translate(-50%, -50%)',
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
