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
      (typeof window !== 'undefined' ? window.location.origin : 'https://baps-tithal-svayamsevakdal.netlify.app');

    const cleanVolunteerId = (volunteerId || 'BAPS-74930-TNL').trim();
    const verificationUrl = `${baseUrl.replace(/\/$/, '')}/verify/${cleanVolunteerId}`;

    // Auto font size for Seva Vibhag inside the White Text Box (with safe clearance for upper matras)
    const getVibhagFontSize = (text: string) => {
      const len = text ? text.length : 0;
      if (len > 24) return 'text-[11.5px] sm:text-[13px]';
      if (len > 18) return 'text-[13px] sm:text-[15px]';
      if (len > 12) return 'text-[15px] sm:text-[17px]';
      return 'text-[17px] sm:text-[19.5px]';
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
        {/* Exact concentric geometric center: X: 50.0%, Y: 52.37%, Width: 21.8%, Height: 16.0% */}
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

        {/* 2. DYNAMIC SEVA VIBHAG IN WHITE TEXT BOX */}
        {/* Optical center: X: 50.0%, Y: 65.30%, Width: 88.0%, Height: 6.5%, overflow-visible prevents any vowel clipping */}
        <div
          className="absolute z-10 flex items-center justify-center text-center pointer-events-none overflow-visible"
          style={{
            top: '65.30%',
            left: '50.0%',
            width: '88.0%',
            height: '6.5%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span
            className={`font-black tracking-wide text-[#0C3260] text-center leading-[1.15] whitespace-nowrap overflow-visible ${getVibhagFontSize(
              sevaVibhagName || 'સ્વયંસેવક દળ'
            )}`}
            style={{
              fontFamily: "'Noto Sans Gujarati', sans-serif",
            }}
          >
            {sevaVibhagName || 'સ્વયંસેવક દળ'}
          </span>
        </div>

        {/* 3. DYNAMIC VOLUNTEER DETAILS - EXACT BASELINE AND FONT AS LABELS */}
        {/* All values are aligned directly to the pre-printed title baselines and colon dots */}

        {/* Line 1: ID (baseline alignment: top = 72.10%) */}
        <div
          className="absolute z-10 flex items-center"
          style={{
            top: '72.10%',
            left: '19.5%',
            width: '52.0%',
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

        {/* Line 2: Name (baseline alignment: top = 75.20%) */}
        <div
          className="absolute z-10 flex items-center"
          style={{
            top: '75.20%',
            left: '19.5%',
            width: '52.0%',
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

        {/* Line 3: Mobile (baseline alignment: top = 78.30%) */}
        <div
          className="absolute z-10 flex items-center"
          style={{
            top: '78.30%',
            left: '19.5%',
            width: '52.0%',
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

        {/* Line 4: Village (baseline alignment: top = 81.30%) */}
        <div
          className="absolute z-10 flex items-center"
          style={{
            top: '81.30%',
            left: '19.5%',
            width: '52.0%',
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

        {/* Line 5: Kshetra (baseline alignment: top = 84.50%) */}
        <div
          className="absolute z-10 flex items-center"
          style={{
            top: '84.50%',
            left: '19.5%',
            width: '52.0%',
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

        {/* 4. DYNAMIC QR CODE CONTAINER (MOVED ~2.6mm LEFT SO IT DOES NOT TOUCH RIGHT BORDER) */}
        {/* Center: X: 82.0%, Y: 78.0%, Width: 16.5%, Height: 13.5% */}
        <div
          className="absolute z-10 flex items-center justify-center p-1 bg-white rounded-lg shadow-sm"
          style={{
            top: '78.0%',
            left: '82.0%',
            width: '16.5%',
            height: '13.5%',
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
