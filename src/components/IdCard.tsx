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

    // Standardized typography for Volunteer Name
    const getNameFontSize = (text: string) => {
      const len = text ? text.length : 0;
      if (len > 24) return 'text-[14px]';
      if (len > 18) return 'text-[16px]';
      if (len > 12) return 'text-[18.5px]';
      return 'text-[21px]';
    };

    // Standardized typography for Seva Vibhag at bottom
    const getVibhagFontSize = (text: string) => {
      const len = text ? text.length : 0;
      if (len > 24) return 'text-[17.5px]';
      if (len > 16) return 'text-[20.5px]';
      return 'text-[24px]';
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
        {/* BACKGROUND TEMPLATE IMAGE (756 x 1024) - Bottom filigree touches edge completely */}
        <img
          src="/id-template.jpg"
          alt="BAPS Tithal ID Card Template"
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
          crossOrigin="anonymous"
        />

        {/* 1. CENTERED CIRCULAR VOLUNTEER PHOTO */}
        {/* Exact concentric geometric center: X: 50.0%, Y: 52.37% */}
        <div
          data-card-photo-box="true"
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

        {/* 2. VOLUNTEER NAME (IN THE PROMINENT WHITE BOX BELOW PHOTO) */}
        {/* Preserves exact optical center for website preview */}
        <div
          data-card-name-box="true"
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
            className={`font-black tracking-wide text-[#0C3260] text-center leading-[1.15] whitespace-nowrap overflow-visible ${getNameFontSize(
              name || 'સ્વયંસેવક'
            )}`}
            style={{
              fontFamily: "'Noto Sans Gujarati', sans-serif",
            }}
            title={name}
          >
            {name || 'સ્વયંસેવક'}
          </span>
        </div>

        {/* 3. PERSONAL DETAILS BLUE BOX (3 LINES: મો., ગામ, ક્ષેત્ર + QR CODE) */}
        {/* TASK 1: Increased 2mm on left and 2mm on right */}
        {/* 74mm physical width => 2mm = 2.703%. Left moves from 5.5% to 2.8%, right margin from 5.5% to 2.8%, Width = 94.4% */}
        {/* Solid #00366C background completely covers the pre-printed box, labels and QR code */}
        {/* The 2 dots (:) are dedicated elements with identical width, perfectly locked in a single straight vertical line */}
        <div
          data-card-details-box="true"
          className="absolute z-10 rounded-xl border-[2px] border-white flex items-center justify-between p-2.5 sm:p-3 shadow-md"
          style={{
            top: '68.5%',
            left: '2.8%',
            width: '94.4%',
            height: '19.5%',
            backgroundColor: '#00366C',
            boxSizing: 'border-box',
          }}
        >
          {/* Left Column: 3 Detail Rows (Mobile, Village, Kshetra) */}
          <div className="flex-1 h-full flex flex-col justify-around pr-2.5 min-w-0">
            {/* Line 1: Mobile - overflow-visible & whitespace-nowrap so digits are NEVER clipped */}
            <div className="flex items-center min-w-0">
              <span
                className="font-extrabold text-white text-[13.5px] tracking-wide shrink-0 w-[36px]"
                style={{ fontFamily: "'Noto Sans Gujarati', sans-serif" }}
              >
                મો.
              </span>
              <span
                className="font-extrabold text-white text-[13.5px] shrink-0 w-[12px] text-center mr-1.5"
                style={{ fontFamily: "'Noto Sans Gujarati', sans-serif" }}
              >
                :
              </span>
              <span
                className="font-extrabold text-white text-[13.5px] tracking-wide whitespace-nowrap overflow-visible select-text"
                style={{ fontFamily: "'Noto Sans Gujarati', sans-serif" }}
              >
                {mobileNumber || '—'}
              </span>
            </div>

            {/* Line 2: Village */}
            <div className="flex items-center min-w-0">
              <span
                className="font-extrabold text-white text-[13.5px] tracking-wide shrink-0 w-[36px]"
                style={{ fontFamily: "'Noto Sans Gujarati', sans-serif" }}
              >
                ગામ
              </span>
              <span
                className="font-extrabold text-white text-[13.5px] shrink-0 w-[12px] text-center mr-1.5"
                style={{ fontFamily: "'Noto Sans Gujarati', sans-serif" }}
              >
                :
              </span>
              <span
                className="font-extrabold text-white text-[13.5px] truncate select-text"
                style={{
                  fontFamily: "'Noto Sans Gujarati', sans-serif",
                  letterSpacing: 'normal',
                }}
              >
                {villageName || '—'}
              </span>
            </div>

            {/* Line 3: Kshetra */}
            <div className="flex items-center min-w-0">
              <span
                className="font-extrabold text-white text-[13.5px] tracking-wide shrink-0 w-[36px]"
                style={{ fontFamily: "'Noto Sans Gujarati', sans-serif" }}
              >
                ક્ષેત્ર
              </span>
              <span
                className="font-extrabold text-white text-[13.5px] shrink-0 w-[12px] text-center mr-1.5"
                style={{ fontFamily: "'Noto Sans Gujarati', sans-serif" }}
              >
                :
              </span>
              <span
                className="font-extrabold text-white text-[13.5px] truncate select-text"
                style={{
                  fontFamily: "'Noto Sans Gujarati', sans-serif",
                  letterSpacing: 'normal',
                }}
              >
                {xetraName || '—'}
              </span>
            </div>
          </div>

          {/* Right Column: Dynamic QR Code Container */}
          <div className="shrink-0 h-full aspect-square flex items-center justify-center p-1 bg-white rounded-lg shadow-sm">
            <QRCodeSVG
              value={verificationUrl}
              size={120}
              level="M"
              includeMargin={false}
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* 4. DYNAMIC SEVA VIBHAG */}
        {/* Exact optical center: X: 50.0%, Y: 92.8% */}
        <div
          data-card-vibhag-box="true"
          className="absolute z-10 flex items-center justify-center text-center pointer-events-none overflow-visible"
          style={{
            top: '92.8%',
            left: '50.0%',
            width: '92.0%',
            height: '6.0%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span
            className={`font-black tracking-wider text-[#063D69] text-center leading-[1.15] whitespace-nowrap overflow-visible ${getVibhagFontSize(
              sevaVibhagName || 'સ્વયંસેવક દળ'
            )}`}
            style={{
              fontFamily: "'Noto Sans Gujarati', sans-serif",
            }}
          >
            {sevaVibhagName || 'સ્વયંસેવક દળ'}
          </span>
        </div>
      </div>
    );
  }
);

IdCard.displayName = 'IdCard';
