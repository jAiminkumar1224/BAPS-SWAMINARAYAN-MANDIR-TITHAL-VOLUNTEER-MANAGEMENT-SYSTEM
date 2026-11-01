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
 * - Sets exact scale multiplier (3x) for 300 DPI (1134 × 1536 px).
 */
export const captureVolunteerCard = async (element: HTMLElement): Promise<HTMLCanvasElement> => {
  // 1. Wait for web fonts (Noto Sans Gujarati) and all card images to finish loading
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue if font ready check fails
    }
  }
  await waitForImages(element);

  // 2. Use canonical element bounds (378 x 512, matching 756 x 1024 template) to avoid modal scale skew
  const width = 378;
  const height = 512;

  // 3. Render high-res canvas via html2canvas
  return await html2canvas(element, {
    scale: 3, // 300 DPI multiplier (378*3 = 1134, 512*3 = 1536)
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

      // PDF Generator Fix: Adjust cloned element coordinates for 100% visual parity with website
      // 1. Volunteer Name: place dead-center in white box with EQUAL padding above and below
      const nameBox = clonedElement.querySelector<HTMLElement>('[data-card-name-box="true"]');
      if (nameBox) {
        nameBox.style.transform = 'none';
        nameBox.style.top = '60.6%';
        nameBox.style.left = '5.0%';
        nameBox.style.width = '90.0%';
        nameBox.style.height = '6.0%';
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

      // 2. Circular Photo: maintain exact concentric alignment
      const photoBox = clonedElement.querySelector<HTMLElement>('[data-card-photo-box="true"]');
      if (photoBox) {
        photoBox.style.transform = 'none';
        photoBox.style.top = '44.37%';
        photoBox.style.left = '39.1%';
        photoBox.style.width = '21.8%';
        photoBox.style.height = '16.0%';
      }

      // 3. Details Blue Box: position exactly matching website preview
      // Ensures all rows (Mobile, Village, Kshetra) are TOP-ALIGNED and completely visible
      const detailsBox = clonedElement.querySelector<HTMLElement>('[data-card-details-box="true"]');
      if (detailsBox) {
        detailsBox.style.transform = 'none';
        detailsBox.style.top = '68.2%';
        detailsBox.style.left = '2.8%';
        detailsBox.style.width = '94.4%';
        detailsBox.style.height = '19.2%';
        detailsBox.style.boxSizing = 'border-box';
        detailsBox.style.padding = '6px 10px 6px 12px';

        // Ensure all text spans in details box are visible and never clipped
        const allSpans = detailsBox.querySelectorAll<HTMLElement>('span');
        allSpans.forEach((s) => {
          s.style.overflow = 'visible';
          s.style.textOverflow = 'clip';
          s.style.whiteSpace = 'nowrap';
          s.style.lineHeight = '1.25';
          s.style.display = 'inline-block';
        });

        // Ensure left column is TOP-ALIGNED as requested
        const leftCol = detailsBox.firstElementChild as HTMLElement;
        if (leftCol) {
          leftCol.style.display = 'flex';
          leftCol.style.flexDirection = 'column';
          leftCol.style.justifyContent = 'flex-start';
          leftCol.style.height = '100%';
          leftCol.style.paddingTop = '1px';
          leftCol.style.paddingBottom = '1px';
          leftCol.style.paddingLeft = '0';
          leftCol.style.paddingRight = '0';
          leftCol.style.margin = '0';

          const rows = Array.from(leftCol.children) as HTMLElement[];
          rows.forEach((row, idx) => {
            if (idx < rows.length - 1) {
              row.style.marginBottom = '6px';
            }
          });
        }
      }

      // 4. Seva Vibhag: comfortable padding below blue box and above card bottom line
      const vibhagBox = clonedElement.querySelector<HTMLElement>('[data-card-vibhag-box="true"]');
      if (vibhagBox) {
        vibhagBox.style.transform = 'none';
        vibhagBox.style.top = '91.2%';
        vibhagBox.style.left = '4.0%';
        vibhagBox.style.width = '92.0%';
        vibhagBox.style.height = '5.5%';
        vibhagBox.style.display = 'flex';
        vibhagBox.style.alignItems = 'center';
        vibhagBox.style.justifyContent = 'center';
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
 * Download ID card as 300 DPI lossless PNG (1134 × 1536 px)
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
    // Use lossless PNG instead of lossy JPEG
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
