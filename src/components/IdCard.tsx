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

    // Auto font size for Volunteer Name inside the prominent White Box below photo
    const getNameFontSize = (text: string) => {
      const len = text ? text.length : 0;
      if (len > 24) return 'text-[13px] sm:text-[15.5px]';
      if (len > 18) return 'text-[15px] sm:text-[18px]';
      if (len > 12) return 'text-[17px] sm:text-[20.5px]';
      return 'text-[19px] sm:text-[23px]';
    };

    // Auto font size for Seva Vibhag at the bottom (replacing the quote)
    const getVibhagFontSize = (text: string) => {
      const len = text ? text.length : 0;
      if (len > 24) return 'text-[13px] sm:text-[15px]';
      if (len > 18) return 'text-[15px] sm:text-[17.5px]';
      return 'text-[17px] sm:text-[20px]';
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

        {/* 2. VOLUNTEER NAME (IN THE PROMINENT WHITE BOX BELOW PHOTO) */}
        {/* Optical center: X: 50.0%, Y: 65.30%, Width: 88.0%, Height: 6.5%, overflow-visible prevents clipping */}
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
        {/* Bounds: Left: 5.5%, Top: 68.5%, Width: 89.0%, Height: 19.5% */}
        {/* Solid #00366C background completely covers the old pre-printed box, labels and QR code */}
        {/* Titles and values are in the same flex row, guaranteeing 100% exact alignment in English or Gujarati! */}
        <div
          className="absolute z-10 rounded-xl border-[2px] border-white flex items-center justify-between p-2.5 sm:p-3 shadow-md"
          style={{
            top: '68.5%',
            left: '5.5%',
            width: '89.0%',
            height: '19.5%',
            backgroundColor: '#00366C',
            boxSizing: 'border-box',
          }}
        >
          {/* Left Column: 3 Detail Rows (Mobile, Village, Kshetra) */}
          <div className="flex-1 h-full flex flex-col justify-around pr-2.5 min-w-0">
            {/* Line 1: Mobile */}
            <div className="flex items-center min-w-0">
              <span className="font-extrabold text-white text-[12px] sm:text-[14px] tracking-wide shrink-0 w-[42px] sm:w-[48px]">
                મો. :
              </span>
              <span className="font-extrabold text-white text-[12px] sm:text-[14px] tracking-widest truncate select-text">
                {mobileNumber || '—'}
              </span>
            </div>

            {/* Line 2: Village */}
            <div className="flex items-center min-w-0">
              <span className="font-extrabold text-white text-[12px] sm:text-[14px] tracking-wide shrink-0 w-[42px] sm:w-[48px]">
                ગામ :
              </span>
              <span className="font-extrabold text-white text-[12px] sm:text-[14px] truncate select-text">
                {villageName || '—'}
              </span>
            </div>

            {/* Line 3: Kshetra */}
            <div className="flex items-center min-w-0">
              <span className="font-extrabold text-white text-[12px] sm:text-[14px] tracking-wide shrink-0 w-[42px] sm:w-[48px]">
                ક્ષેત્ર :
              </span>
              <span className="font-extrabold text-white text-[12px] sm:text-[14px] truncate select-text">
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

        {/* 4. DYNAMIC SEVA VIBHAG (AT THE BOTTOM, REPLACING THE LAST QUOTE) */}
        {/* Optical center: X: 50.0%, Y: 93.0%, Width: 90.0%, Height: 5.5% */}
        <div
          className="absolute z-10 flex items-center justify-center text-center pointer-events-none overflow-visible"
          style={{
            top: '93.0%',
            left: '50.0%',
            width: '90.0%',
            height: '5.5%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span
            className={`font-black tracking-wide text-[#0C3260] text-center leading-[1.15] whitespace-nowrap overflow-visible drop-shadow-sm ${getVibhagFontSize(
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
