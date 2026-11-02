import { jsPDF } from 'jspdf';

// ─────────────────────────────────────────────────────────────────────────────
// NOTE: html2canvas has been replaced by a direct Canvas 2D API renderer.
// The new approach draws the PNG template natively at 6× scale (2268×3072 px),
// producing zero-artifact, lossless output at ~778 DPI for a 74×100mm print.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Loads an image element (cross-origin safe, fails gracefully on CORS error)
 */
const loadImg = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load: ${src}`));
    img.src = src;
  });

/**
 * Draws a rounded-rectangle path (does not fill/stroke — caller does that).
 */
const rrect = (
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number
): void => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

/**
 * Capture an ID card element as a pristine high-resolution canvas.
 *
 * Strategy — direct Canvas 2D renderer:
 *   • Works in the same 378 × 512 CSS-px coordinate space as IdCard.tsx so all
 *     percentage positions map 1-to-1.
 *   • Renders at 6× scale (2268 × 3072 px ≈ 778 DPI at 74 × 100 mm physical).
 *   • Draws the PNG template natively — no JPEG artefacts, no html2canvas blur.
 *   • Draws volunteer photo with object-cover / object-top clipping (matches CSS).
 *   • Serialises the QR SVG as a vector image → pixel-perfect at any size.
 *   • All text is drawn by the Canvas text API with the loaded Noto Sans Gujarati
 *     font using the SAME px size the browser computed for the live element.
 */
export const captureVolunteerCard = async (element: HTMLElement): Promise<HTMLCanvasElement> => {

  // ── 1. Ensure Noto Sans Gujarati is loaded at every weight we use ─────────
  try {
    await document.fonts.load('800 14px "Noto Sans Gujarati"');
    await document.fonts.load('900 27px "Noto Sans Gujarati"');
    await document.fonts.ready;
  } catch {
    // Continue — the font is very likely already cached from the live page
  }

  // ── 2. Extract card data from the rendered DOM ─────────────────────────────

  // Volunteer name + its computed CSS font size (px, same coordinate space as canvas)
  const nameSpan    = element.querySelector<HTMLElement>('[data-card-name-box="true"] span');
  const name        = nameSpan?.textContent?.trim() ?? '';
  const nameFontPx  = nameSpan
    ? parseFloat(window.getComputedStyle(nameSpan).fontSize)
    : 21;

  // Volunteer photo <img> element (may be absent if no photo uploaded)
  const photoImgEl  = element.querySelector<HTMLImageElement>('[data-card-photo-box="true"] img');

  // Details box: extract the three value spans (children[2] of each flex row)
  const detailsEl   = element.querySelector<HTMLElement>('[data-card-details-box="true"]');
  const leftColEl   = detailsEl?.firstElementChild as HTMLElement | null;
  const detailRows  = leftColEl ? (Array.from(leftColEl.children) as HTMLElement[]) : [];
  const mobile      = detailRows[0]?.children[2]?.textContent?.trim() ?? '—';
  const village     = detailRows[1]?.children[2]?.textContent?.trim() ?? '—';
  const kshetra     = detailRows[2]?.children[2]?.textContent?.trim() ?? '—';

  // QR code SVG element (inside the details box)
  const qrSvgEl     = detailsEl?.querySelector('svg');

  // Seva Vibhag text + its computed CSS font size
  const vibhagSpan  = element.querySelector<HTMLElement>('[data-card-vibhag-box="true"] span');
  const sevaVibhag  = vibhagSpan?.textContent?.trim() ?? '';
  const vibhagFontPx = vibhagSpan
    ? parseFloat(window.getComputedStyle(vibhagSpan).fontSize)
    : 26.5;

  // ── 3. Canvas setup ────────────────────────────────────────────────────────
  // Coordinate space: 378 × 512 CSS-px (identical to IdCard.tsx).
  // Scale × 6 → final bitmap: 2268 × 3072 px  ≈ 778 DPI at 74 × 100 mm.
  const CARD_W = 378;
  const CARD_H = 512;
  const SCALE  = 6;

  const canvas       = document.createElement('canvas');
  canvas.width       = CARD_W * SCALE;
  canvas.height      = CARD_H * SCALE;
  const ctx          = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);
  ctx.imageSmoothingEnabled  = true;
  ctx.imageSmoothingQuality  = 'high';

  // ── STEP 1 · PNG template background (object-cover, object-top) ───────────
  // Mirrors the CSS: `object-cover object-top` on the <img> in IdCard.tsx.
  const template = await loadImg('/id-template.png');
  {
    // Scale to cover CARD_W × CARD_H, anchored to top (no top crop, slight bottom crop)
    const coverScale = Math.max(CARD_W / template.naturalWidth, CARD_H / template.naturalHeight);
    const srcW = CARD_W / coverScale;
    const srcH = CARD_H / coverScale;
    const srcX = (template.naturalWidth - srcW) / 2; // centre horizontally
    const srcY = 0;                                    // anchor to top
    ctx.drawImage(template, srcX, srcY, srcW, srcH, 0, 0, CARD_W, CARD_H);
  }

  // ── STEP 2 · Volunteer photo — circular clip, object-cover object-top ─────
  // Matches IdCard.tsx: center (50%, 52.37%), width 21.8%, height 16.0%
  const PHOTO_CX = CARD_W * 0.50;
  const PHOTO_CY = CARD_H * 0.5237;
  const PHOTO_R  = (CARD_W * 0.218) / 2; // ≈ 41 px

  if (photoImgEl?.src) {
    try {
      const photo = await loadImg(photoImgEl.src);
      ctx.save();
      ctx.beginPath();
      ctx.arc(PHOTO_CX, PHOTO_CY, PHOTO_R, 0, Math.PI * 2);
      ctx.clip();
      const d  = PHOTO_R * 2;
      // object-cover: scale to cover the circle; object-top: anchor to top
      const sc = Math.max(d / photo.naturalWidth, d / photo.naturalHeight);
      const sw = d / sc;
      const sh = d / sc;
      const sx = (photo.naturalWidth - sw) / 2; // centre horizontally
      const sy = 0;                              // anchor to top
      ctx.drawImage(photo, sx, sy, sw, sh, PHOTO_CX - PHOTO_R, PHOTO_CY - PHOTO_R, d, d);
      ctx.restore();
    } catch {
      // Photo unavailable or CORS blocked — template's dark circle shows through
    }
  }

  // ── STEP 3 · Volunteer name in the template's white name-box ─────────────
  // top: '65.30%' + transform: translate(-50%, -50%) → centre at 65.30% height
  const NAME_CY  = CARD_H * 0.653;
  const NAME_BOX_TOP = CARD_H * 0.626;
  const NAME_BOX_H   = CARD_H * 0.065;
  const NAME_BOX_W   = CARD_W * 0.88;
  const NAME_BOX_X   = (CARD_W - NAME_BOX_W) / 2;

  ctx.save();
  ctx.rect(NAME_BOX_X, NAME_BOX_TOP, NAME_BOX_W, NAME_BOX_H);
  ctx.clip();
  ctx.font         = `900 ${nameFontPx}px "Noto Sans Gujarati", sans-serif`;
  ctx.fillStyle    = '#0C3260';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, CARD_W / 2, NAME_CY);
  ctx.restore();

  // ── STEP 4 · Dark-blue details box overlay ────────────────────────────────
  // Matches IdCard.tsx: top 67.5%, left 2.8%, width 94.4%, height 19.5%
  const DB_TOP  = CARD_H * 0.675;  // ≈ 346 px
  const DB_LEFT = CARD_W * 0.028;  // ≈  11 px
  const DB_W    = CARD_W * 0.944;  // ≈ 357 px
  const DB_H    = CARD_H * 0.195;  // ≈ 100 px
  const DB_R    = 7;               // border-radius (matches rounded-xl at this scale)

  ctx.save();
  rrect(ctx, DB_LEFT, DB_TOP, DB_W, DB_H, DB_R);
  ctx.fillStyle   = '#00366C';
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth   = 1.5;
  ctx.stroke();
  ctx.restore();

  // ── STEP 5 · QR code (white background + SVG rendered as vector image) ────
  const QR_PAD  = 3;
  const QR_SIZE = DB_H - QR_PAD * 2;              // ≈ 94 px — fills full box height
  const QR_X    = DB_LEFT + DB_W - QR_SIZE - QR_PAD - 1; // flush to right edge
  const QR_Y    = DB_TOP  + QR_PAD;

  // White rounded bg for QR
  ctx.save();
  rrect(ctx, QR_X - 2, QR_Y - 2, QR_SIZE + 4, QR_SIZE + 4, 6);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.restore();

  // Serialise the React QRCodeSVG element → Blob URL → draw as vector image
  if (qrSvgEl) {
    try {
      // Ensure the SVG has the required XML namespace
      if (!qrSvgEl.getAttribute('xmlns')) {
        qrSvgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      }
      const svgStr  = new XMLSerializer().serializeToString(qrSvgEl);
      const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl  = URL.createObjectURL(svgBlob);
      const qrImg   = await loadImg(svgUrl);
      ctx.drawImage(qrImg, QR_X, QR_Y, QR_SIZE, QR_SIZE);
      URL.revokeObjectURL(svgUrl);
    } catch {
      // QR render failed — white box remains
    }
  }

  // ── STEP 6 · Detail row text (Mobile · Village · Kshetra) ─────────────────
  // Three rows with justify-around distribution inside the DB_H container.
  // Row centres at DB_TOP + DB_H × (1/6), (3/6), (5/6) — matches CSS justify-around.
  //
  // Column layout (mirrors IdCard.tsx flex row widths):
  //   label:  w-[36px]  → 36 px
  //   colon:  w-[12px]  → 12 px + mr-1.5 (6 px gap after)
  //   value:  remainder
  const DETAIL_FONT = 13.5; // CSS px — same coordinate space, no scaling needed
  const ROW_LEFT    = DB_LEFT + 6;     // ≈  17 px (matches p-2.5 left padding)
  const LABEL_W     = 36;
  const COLON_W     = 12;
  const COLON_GAP   = 6;
  const VALUE_X     = ROW_LEFT + LABEL_W + COLON_W + COLON_GAP; // ≈ 71 px

  ctx.font         = `800 ${DETAIL_FONT}px "Noto Sans Gujarati", sans-serif`;
  ctx.fillStyle    = '#FFFFFF';
  ctx.textBaseline = 'middle';

  [
    { label: 'મો.',    value: mobile  },
    { label: 'ગામ',   value: village },
    { label: 'ક્ષેત્ર', value: kshetra },
  ].forEach(({ label, value }, i) => {
    const ROW_CY = DB_TOP + DB_H * ((2 * i + 1) / 6);
    ctx.textAlign = 'left';
    ctx.fillText(label, ROW_LEFT, ROW_CY);
    ctx.textAlign = 'center';
    ctx.fillText(':', ROW_LEFT + LABEL_W + COLON_W / 2, ROW_CY);
    ctx.textAlign = 'left';
    ctx.fillText(value, VALUE_X, ROW_CY);
  });

  // ── STEP 7 · Seva Vibhag text ─────────────────────────────────────────────
  // Matches IdCard.tsx: top 91.5% + transform translate(-50%,-50%) → centre at 91.5%
  const VIBHAG_CY = CARD_H * 0.915;
  const VB_W      = CARD_W * 0.92;
  const VB_X      = (CARD_W - VB_W) / 2;

  ctx.save();
  ctx.rect(VB_X, CARD_H * 0.875, VB_W, CARD_H * 0.08);
  ctx.clip();
  ctx.font         = `900 ${vibhagFontPx}px "Noto Sans Gujarati", sans-serif`;
  ctx.fillStyle    = '#063D69';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(sevaVibhag, CARD_W / 2, VIBHAG_CY);
  ctx.restore();

  return canvas;
};

// Backwards-compatible alias for existing imports
export const captureCardCanvas = captureVolunteerCard;

/**
 * Download ID card as a lossless 300 DPI+ PNG (2268 × 3072 px).
 */
export const downloadCardAsPng = async (element: HTMLElement, filename = 'BAPS-ID-Card.png') => {
  try {
    const canvas  = await captureVolunteerCard(element);
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link    = document.createElement('a');
    link.href     = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error generating PNG:', error);
    alert('PNG ડાઉનલોડ કરવામાં ભૂલ થઈ. કૃપા કરીને ફરી પ્રયાસ કરો.');
  }
};

/**
 * Download ID card as an exact 74 mm × 100 mm PDF with lossless PNG embedding.
 * Zero JPEG compression, zero stretching, zero text clipping.
 */
export const downloadCardAsPdf = async (element: HTMLElement, filename = 'BAPS-ID-Card.pdf') => {
  try {
    const canvas  = await captureVolunteerCard(element);
    const imgData = canvas.toDataURL('image/png', 1.0);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [74, 100],
      compress: false, // Disable lossy stream compression — preserve lossless quality
    });

    // Embed PNG at exact physical card size with 'NONE' compression
    pdf.addImage(imgData, 'PNG', 0, 0, 74, 100, undefined, 'NONE');
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('PDF ડાઉનલોડ કરવામાં ભૂલ થઈ. કૃપા કરીને ફરી પ્રયાસ કરો.');
  }
};

/**
 * Print ID card directly to the system print dialog.
 * The printed image is the same high-res canvas as PDF/PNG export.
 */
export const printCard = async (element: HTMLElement) => {
  try {
    const canvas  = await captureVolunteerCard(element);
    const dataUrl = canvas.toDataURL('image/png', 1.0);

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('પ્રિન્ટ વિન્ડો ખોલવાની પરવાનગી આપો.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>BAPS Swaminarayan Mandir Tithal - ID Card Print</title>
          <style>
            @page {
              size: 74mm 100mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              background-color: #ffffff;
            }
            img {
              width: 74mm;
              height: 100mm;
              display: block;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  } catch (error) {
    console.error('Error printing card:', error);
    alert('પ્રિન્ટ કરવામાં ભૂલ થઈ. કૃપા કરીને ફરી પ્રયાસ કરો.');
  }
};


/**
 * 12 × 18 inch Sheet Print & Layout Specifications
 * ------------------------------------------------
 * Sheet Dimensions: 12 × 18 inches = 304.8 × 457.2 mm
 * Inner Layout Box: 11.5 × 17.5 inches = 292.1 × 444.5 mm (0.25 in / 6.35 mm margins)
 * Card Dimensions:  74 × 100 mm
 * Spacing / Gap:    2 mm
 * Capacity:         12 cards per page (3 columns × 4 rows)
 * Total Grid Width: 3 × 74 + 2 × 2 = 226 mm (< 292.1 mm)
 * Total Grid Height: 4 × 100 + 3 × 2 = 406 mm (< 444.5 mm)
 * Horizontal Margin: (304.8 - 226) / 2 = 39.4 mm (> 6.35 mm)
 * Vertical Margin:   (457.2 - 406) / 2 = 25.6 mm (> 6.35 mm)
 */
export const SHEET_12X18_WIDTH_MM  = 304.8;
export const SHEET_12X18_HEIGHT_MM = 457.2;
export const INNER_BOX_WIDTH_MM    = 292.1;
export const INNER_BOX_HEIGHT_MM   = 444.5;
export const CARD_WIDTH_MM         = 74;
export const CARD_HEIGHT_MM        = 100;
export const CARD_GAP_MM           = 2;
export const CARDS_PER_PAGE        = 12;
export const GRID_COLS             = 3;
export const GRID_ROWS             = 4;
export const START_X_MM            = 39.4;
export const START_Y_MM            = 25.6;

/**
 * Preload photos into browser cache before batch processing
 */
export const preloadPhotos = async (urls: (string | undefined | null)[]): Promise<void> => {
  const validUrls = Array.from(new Set(urls.filter((u): u is string => Boolean(u))));
  if (validUrls.length === 0) return;

  await Promise.allSettled(
    validUrls.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload  = () => resolve();
          img.onerror = () => resolve();
          img.src     = url;
        })
    )
  );
};

/**
 * Creates a jsPDF document calibrated for 12 × 18 inch sheets
 * with Print Scaling Protection (PrintScaling: None).
 */
export const create12x18BatchPdf = (): jsPDF => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [SHEET_12X18_WIDTH_MM, SHEET_12X18_HEIGHT_MM],
    compress: false,
  });

  // Explicitly set /PrintScaling /None so Adobe Acrobat and browser viewers
  // default to 100% / Actual Size without any scaling prompt
  if (typeof (pdf as any).viewerPreferences === 'function') {
    (pdf as any).viewerPreferences({ PrintScaling: 'None' }, true);
  }

  return pdf;
};

/**
 * Adds an ID card to the 12 × 18 inch sheet PDF at its exact grid position.
 * Preserves exact 74 × 100 mm card dimensions and 2 mm gaps.
 */
export const addCardTo12x18BatchPdf = (
  pdf: jsPDF,
  imgData: string,
  cardIndex: number
) => {
  const slotIndex = cardIndex % CARDS_PER_PAGE;

  // Add a new 12 × 18 page when starting a new page beyond page 1
  if (cardIndex > 0 && slotIndex === 0) {
    pdf.addPage([SHEET_12X18_WIDTH_MM, SHEET_12X18_HEIGHT_MM], 'portrait');
  }

  // Calculate 3-column × 4-row grid placement
  const col = slotIndex % GRID_COLS;
  const row = Math.floor(slotIndex / GRID_COLS);

  // Exact coordinates: 39.4 mm left margin, 25.6 mm top margin, 2 mm gaps
  const x = START_X_MM + col * (CARD_WIDTH_MM + CARD_GAP_MM);
  const y = START_Y_MM + row * (CARD_HEIGHT_MM + CARD_GAP_MM);

  // Embed lossless PNG at exact physical measurements (74 mm × 100 mm)
  pdf.addImage(imgData, 'PNG', x, y, CARD_WIDTH_MM, CARD_HEIGHT_MM, undefined, 'NONE');
};
