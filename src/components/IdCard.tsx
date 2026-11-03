import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { normalizeSevaVibhagName } from '../constants/sevaVibhag';

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
    // Canonical Production Base URL for Verification QR Code
    const canonicalProductionUrl = 'https://baps-tithal-svayamsevakdal.netlify.app';
    const rawUrl = appUrl || import.meta.env.VITE_APP_URL || canonicalProductionUrl;
    const baseUrl =
      rawUrl.includes('baps-tithal.netlify.app') || rawUrl.includes('localhost')
        ? canonicalProductionUrl
        : rawUrl;

    const cleanVolunteerId = (volunteerId || 'BAPS-74930-TNL').trim();
    const cleanVibhagName = normalizeSevaVibhagName(sevaVibhagName);
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
      if (len > 24) return 'text-[19.5px]';
      if (len > 16) return 'text-[22.5px]';
      return 'text-[26.5px]';
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
          aspectRatio: '74 / 100',
        }}
      >
        {/* SINGLE HIGH-RESOLUTION PNG TEMPLATE BACKGROUND */}
        <img
          src="/Main ID Card BG.png"
          alt="BAPS Tithal ID Card Template"
          className="absolute inset-0 w-full h-full object-fill z-0 pointer-events-none"
          crossOrigin="anonymous"
          style={{ imageRendering: '-webkit-optimize-contrast' }}
        />

        {/* 1. DYNAMIC PROFILE PHOTO INSIDE CIRCULAR PLACEHOLDER */}
        {/* Exact concentric geometric center: X: 50.0%, Y: 60.16% */}
        {/* Sized at 26.8% x 18.0% with 3px solid white border to completely mask the pre-printed dark blue circle with zero blue lines */}
        <div
          data-card-photo-box="true"
          className="absolute z-10 flex items-center justify-center pointer-events-none"
          style={{
            top: '60.16%',
            left: '50.0%',
            width: '26.8%',
            height: '18.0%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="w-full h-full rounded-full overflow-hidden bg-[#08456D] border-[3px] border-white flex items-center justify-center shadow-md">
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

        {/* 2. DYNAMIC MEMBER NAME INSIDE WHITE RECTANGLE PLACEHOLDER */}
        {/* Exact measured center: X: 50.0%, Y: 72.41%, Width: 92.26%, Height: 7.13% */}
        <div
          data-card-name-box="true"
          className="absolute z-10 flex items-center justify-center text-center pointer-events-none overflow-visible"
          style={{
            top: '71.19%',
            left: '50.0%',
            width: '91.24%',
            height: '9.57%',
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

        {/* 3. DYNAMIC DETAILS: NO DUPLICATE BOX, LABELS ARE PRE-PRINTED IN PNG */}
        {/* Line 1: Mobile Number — aligned after pre-printed 'મોબાઇલ :' at Y: 78.71% */}
        <div
          data-card-mobile="true"
          className="absolute z-10 flex items-center select-text overflow-visible"
          style={{
            top: '78.86%',
            left: '25.0%',
            width: '48.0%',
            height: '24px',
            transform: 'translateY(-50%)',
          }}
        >
          <span
            className="font-extrabold text-white text-[13.5px] tracking-wide whitespace-nowrap overflow-visible select-text"
            style={{
              fontFamily: "'Noto Sans Gujarati', sans-serif",
              lineHeight: '1.2',
            }}
          >
            {mobileNumber || '—'}
          </span>
        </div>

        {/* Line 2: Village Name — aligned after pre-printed 'ગામ :' at Y: 83.00% */}
        <div
          data-card-village="true"
          className="absolute z-10 flex items-center select-text overflow-visible"
          style={{
            top: '82.96%',
            left: '25.0%',
            width: '48.0%',
            height: '24px',
            transform: 'translateY(-50%)',
          }}
        >
          <span
            className="font-extrabold text-white text-[13.5px] whitespace-nowrap overflow-visible select-text"
            style={{
              fontFamily: "'Noto Sans Gujarati', sans-serif",
              letterSpacing: 'normal',
              lineHeight: '1.2',
            }}
          >
            {villageName || '—'}
          </span>
        </div>

        {/* Line 3: Area (Kshetra) — aligned after pre-printed 'ક્ષેત્ર :' at Y: 87.01% */}
        <div
          data-card-kshetra="true"
          className="absolute z-10 flex items-center select-text overflow-visible"
          style={{
            top: '87.01%',
            left: '25.0%',
            width: '48.0%',
            height: '24px',
            transform: 'translateY(-50%)',
          }}
        >
          <span
            className="font-extrabold text-white text-[13.5px] whitespace-nowrap overflow-visible select-text"
            style={{
              fontFamily: "'Noto Sans Gujarati', sans-serif",
              letterSpacing: 'normal',
              lineHeight: '1.2',
            }}
          >
            {xetraName || '—'}
          </span>
        </div>

        {/* 4. DYNAMIC QR CODE INSIDE PRE-PRINTED WHITE SQUARE PLACEHOLDER */}
        {/* Exact measured bounds: Left: 74.01%, Top: 77.54%, Width: 14.89%, Height: 9.96% */}
        <div
          data-card-qr-box="true"
          className="absolute z-10 flex items-center justify-center p-0.5"
          style={{
            top: '77.54%',
            left: '74.01%',
            width: '15.04%',
            height: '10.06%',
          }}
        >
          <QRCodeSVG
            value={verificationUrl}
            size={120}
            level="M"
            includeMargin={false}
            className="w-full h-full object-contain"
          />
        </div>

        {/* 5. DYNAMIC SEVA VIBHAG IN BOTTOM SECTION */}
        {/* Positioned exactly 5mm (5.0%) below the blue box (which ends at 88.4%) */}
        {/* Top of title: 88.4% + 5.0% = 93.4% */}
        <div
          data-card-vibhag-box="true"
          className="absolute z-10 flex items-start justify-center text-center pointer-events-none overflow-visible"
          style={{
            top: '89.5%',
            left: '50.0%',
            width: '92.0%',
            transform: 'translateX(-50%)',
          }}
        >
          <span
            className={`font-black tracking-wider text-[#063D69] text-center leading-none whitespace-nowrap overflow-visible ${getVibhagFontSize(cleanVibhagName)}`}
            style={{
              fontFamily: "'Noto Sans Gujarati', sans-serif",
              lineHeight: '1',
              margin: 0,
              padding: 0,
            }}
          >
            {cleanVibhagName}
          </span>
        </div>
      </div>
    );
  }
);

IdCard.displayName = 'IdCard';
