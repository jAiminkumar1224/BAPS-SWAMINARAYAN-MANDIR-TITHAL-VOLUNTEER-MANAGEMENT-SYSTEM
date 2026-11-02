import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Ensures all images inside an element are fully loaded and decoded before capture
 */
const waitForImages = async (element: HTMLElement): Promise<void> => {
  const images = Array.from(element.querySelectorAll('img'));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // don't block indefinitely on broken image
          }
        })
    )
  );
};

/**
 * Capture an ID card element as a pristine high-resolution canvas.
 * - Resolves all fonts and images before capture.
 * - In onclone (PDF/PNG generator):
 *   Neutralizes CSS translate transforms and explicitly positions the cloned elements
 *   so that the captured export visually matches the website preview 100%.
 * - Sets scale multiplier (4x) for 300+ DPI (1512 × 2048 px) print-ready quality.
 */
export const captureVolunteerCard = async (element: HTMLElement): Promise<HTMLCanvasElement> => {
  // 1. Wait for web fonts (Noto Sans Gujarati) and all card images to finish loading
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.load('800 14px "Noto Sans Gujarati"');
      await document.fonts.load('900 27px "Noto Sans Gujarati"');
      await document.fonts.ready;
    } catch {
      // Continue if font ready check fails
    }
  }
  await waitForImages(element);

  // 2. Canonical element bounds (378 x 512, matching 74mm x 100mm physical aspect ratio)
  const width = 378;
  const height = 512;

  // 3. Render high-res canvas via html2canvas at scale 4 (300+ DPI print ready)
  return await html2canvas(element, {
    scale: 4, // 4x multiplier: 378*4 = 1512, 512*4 = 2048 px (over 450 DPI at 74x100mm)
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#FFFDF5',
    logging: false,
    imageTimeout: 15000,
    width,
    height,
    windowWidth: 1200,
    onclone: (clonedDoc, clonedElement) => {
      // Inject Google Font stylesheet into cloned head if not present
      if (!clonedDoc.getElementById('noto-sans-gujarati-font')) {
        const link = clonedDoc.createElement('link');
        link.id = 'noto-sans-gujarati-font';
        link.rel = 'stylesheet';
        link.href =
          'https://fonts.googleapis.com/css2?family=Noto+Sans+Gujarati:wght@300;400;500;600;700;800;900&display=swap';
        clonedDoc.head.appendChild(link);
      }

      // Ensure all images are rendered crisp and sharp without interpolation blur
      const imgs = clonedElement.querySelectorAll<HTMLImageElement>('img');
      imgs.forEach((img) => {
        img.style.imageRendering = '-webkit-optimize-contrast';
      });

      // Remove any CSS transforms from the cloned card and all its ancestors
      let curr: HTMLElement | null = clonedElement;
      while (curr && curr !== clonedDoc.body) {
        curr.style.transform = 'none';
        curr.style.webkitTransform = 'none';
        curr.style.animation = 'none';
        curr.style.transition = 'none';
        curr = curr.parentElement;
      }

      // Enforce clean dimensions on the cloned element
      clonedElement.style.width = `${width}px`;
      clonedElement.style.height = `${height}px`;
      clonedElement.style.margin = '0';

      // ── PDF/PNG Export Fixes: Align cloned elements exactly to the new PNG layout ──

      // 1. Circular Photo: Center X: 50.0%, Center Y: 60.89%
      const photoBox = clonedElement.querySelector<HTMLElement>('[data-card-photo-box="true"]');
      if (photoBox) {
        photoBox.style.transform = 'none';
        photoBox.style.top = '51.46%';
        photoBox.style.left = '37.08%';
        photoBox.style.width = '25.84%';
        photoBox.style.height = '18.85%';
      }

      // 2. Volunteer Name: Center X: 50.0%, Center Y: 72.41% inside white rectangle
      const nameBox = clonedElement.querySelector<HTMLElement>('[data-card-name-box="true"]');
      if (nameBox) {
        nameBox.style.transform = 'none';
        nameBox.style.top = '68.85%';
        nameBox.style.left = '4.0%';
        nameBox.style.width = '92.0%';
        nameBox.style.height = '7.1%';
        nameBox.style.display = 'flex';
        nameBox.style.alignItems = 'center';
        nameBox.style.justifyContent = 'center';
        const nameSpan = nameBox.querySelector<HTMLElement>('span');
        if (nameSpan) {
          nameSpan.style.display = 'inline-block';
          nameSpan.style.lineHeight = '1';
          nameSpan.style.verticalAlign = 'middle';
          nameSpan.style.margin = '0';
          nameSpan.style.padding = '0';
        }
      }

      // 3. Dynamic Values (Mobile, Village, Kshetra) — aligned to pre-printed labels
      const mobileBox = clonedElement.querySelector<HTMLElement>('[data-card-mobile="true"]');
      if (mobileBox) {
        mobileBox.style.transform = 'none';
        mobileBox.style.top = '76.9%';
        mobileBox.style.left = '24.5%';
        mobileBox.style.width = '48.5%';
        mobileBox.style.height = '3.6%';
        mobileBox.style.display = 'flex';
        mobileBox.style.alignItems = 'center';
      }

      const villageBox = clonedElement.querySelector<HTMLElement>('[data-card-village="true"]');
      if (villageBox) {
        villageBox.style.transform = 'none';
        villageBox.style.top = '81.2%';
        villageBox.style.left = '24.5%';
        villageBox.style.width = '48.5%';
        villageBox.style.height = '3.6%';
        villageBox.style.display = 'flex';
        villageBox.style.alignItems = 'center';
      }

      const kshetraBox = clonedElement.querySelector<HTMLElement>('[data-card-kshetra="true"]');
      if (kshetraBox) {
        kshetraBox.style.transform = 'none';
        kshetraBox.style.top = '85.2%';
        kshetraBox.style.left = '24.5%';
        kshetraBox.style.width = '48.5%';
        kshetraBox.style.height = '3.6%';
        kshetraBox.style.display = 'flex';
        kshetraBox.style.alignItems = 'center';
      }

      // 4. QR Code Box — inside pre-printed white square
      const qrBox = clonedElement.querySelector<HTMLElement>('[data-card-qr-box="true"]');
      if (qrBox) {
        qrBox.style.transform = 'none';
        qrBox.style.top = '77.54%';
        qrBox.style.left = '74.01%';
        qrBox.style.width = '14.89%';
        qrBox.style.height = '9.96%';
      }

      // 5. Seva Vibhag Text — optical center at 94.68%
      const vibhagBox = clonedElement.querySelector<HTMLElement>('[data-card-vibhag-box="true"]');
      if (vibhagBox) {
        vibhagBox.style.transform = 'none';
        vibhagBox.style.top = '91.4%';
        vibhagBox.style.left = '4.0%';
        vibhagBox.style.width = '92.0%';
        vibhagBox.style.height = '6.5%';
        vibhagBox.style.display = 'flex';
        vibhagBox.style.alignItems = 'center';
        vibhagBox.style.justifyContent = 'center';
        vibhagBox.style.padding = '0';
        vibhagBox.style.margin = '0';
        const vibhagSpan = vibhagBox.querySelector<HTMLElement>('span');
        if (vibhagSpan) {
          vibhagSpan.style.display = 'inline-block';
          vibhagSpan.style.lineHeight = '1';
          vibhagSpan.style.verticalAlign = 'middle';
          vibhagSpan.style.margin = '0';
          vibhagSpan.style.padding = '0';
        }
      }
    },
  });
};

// Backwards-compatible alias for existing imports
export const captureCardCanvas = captureVolunteerCard;

/**
 * Download ID card as 300+ DPI lossless PNG (1512 × 2048 px)
 */
export const downloadCardAsPng = async (element: HTMLElement, filename = 'BAPS-ID-Card.png') => {
  try {
    const canvas = await captureVolunteerCard(element);
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.href = dataUrl;
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
 * Download ID card as exact 74mm x 100mm PDF
 * Zero stretching, lossless PNG embedding, zero text clipping
 */
export const downloadCardAsPdf = async (element: HTMLElement, filename = 'BAPS-ID-Card.pdf') => {
  try {
    const canvas = await captureVolunteerCard(element);
    const imgData = canvas.toDataURL('image/png', 1.0);

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [74, 100],
      compress: false, // Turn off lossy stream compression to preserve 100% crisp visual quality
    });

    // Use compression 'NONE' so jsPDF embeds the uncompressed lossless PNG image without degradation
    pdf.addImage(imgData, 'PNG', 0, 0, 74, 100, undefined, 'NONE');
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('PDF ડાઉનલોડ કરવામાં ભૂલ થઈ. કૃપા કરીને ફરી પ્રયાસ કરો.');
  }
};

/**
 * Print ID card directly with exact @page dimensions
 */
export const printCard = async (element: HTMLElement) => {
  try {
    const canvas = await captureVolunteerCard(element);
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
 * 12 x 18 inch Sheet Print & Layout Specifications
 */
export const SHEET_12X18_WIDTH_MM = 304.8;
export const SHEET_12X18_HEIGHT_MM = 457.2;
export const INNER_BOX_WIDTH_MM = 292.1;
export const INNER_BOX_HEIGHT_MM = 444.5;
export const CARD_WIDTH_MM = 74;
export const CARD_HEIGHT_MM = 100;
export const CARD_GAP_MM = 2;
export const CARDS_PER_PAGE = 12;
export const GRID_COLS = 3;
export const GRID_ROWS = 4;
export const START_X_MM = 39.4;
export const START_Y_MM = 25.6;

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
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = url;
        })
    )
  );
};

/**
 * Creates a jsPDF document calibrated for 12x18 inch sheets with Print Scaling Protection
 */
export const create12x18BatchPdf = (): jsPDF => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [SHEET_12X18_WIDTH_MM, SHEET_12X18_HEIGHT_MM],
    compress: false,
  });

  if (typeof (pdf as any).viewerPreferences === 'function') {
    (pdf as any).viewerPreferences({ PrintScaling: 'None' }, true);
  }

  return pdf;
};

/**
 * Adds an ID card to the 12x18 inch sheet PDF at its exact grid position.
 */
export const addCardTo12x18BatchPdf = (
  pdf: jsPDF,
  imgData: string,
  cardIndex: number
) => {
  const slotIndex = cardIndex % CARDS_PER_PAGE;

  if (cardIndex > 0 && slotIndex === 0) {
    pdf.addPage([SHEET_12X18_WIDTH_MM, SHEET_12X18_HEIGHT_MM], 'portrait');
  }

  const col = slotIndex % GRID_COLS;
  const row = Math.floor(slotIndex / GRID_COLS);

  const x = START_X_MM + col * (CARD_WIDTH_MM + CARD_GAP_MM);
  const y = START_Y_MM + row * (CARD_HEIGHT_MM + CARD_GAP_MM);

  pdf.addImage(
    imgData,
    'PNG',
    x,
    y,
    CARD_WIDTH_MM,
    CARD_HEIGHT_MM,
    undefined,
    'NONE'
  );
};
