import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Capture an ID card element as a high-resolution canvas
 * Target 300 DPI: scale factor ~3 to produce ~874 x 1181 px
 */
export const captureCardCanvas = async (element: HTMLElement): Promise<HTMLCanvasElement> => {
  return await html2canvas(element, {
    scale: 3, // High-resolution 300 DPI multiplier
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#FFFDF5',
    logging: false,
    imageTimeout: 15000,
  });
};

/**
 * Download ID card as 300 DPI PNG
 * Approximately 874 × 1181 pixels
 */
export const downloadCardAsPng = async (element: HTMLElement, filename = 'BAPS-ID-Card.png') => {
  try {
    const canvas = await captureCardCanvas(element);
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
 * Zero unwanted margins, preserved color and Gujarati fonts
 */
export const downloadCardAsPdf = async (element: HTMLElement, filename = 'BAPS-ID-Card.pdf') => {
  try {
    const canvas = await captureCardCanvas(element);
    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // jsPDF with exact 74mm x 100mm portrait dimensions
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [74, 100],
      compress: true,
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, 74, 100);
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('PDF ડાઉનલોડ કરવામાં ભૂલ થઈ. કૃપા કરીને ફરી પ્રયાસ કરો.');
  }
};

/**
 * Print ID card directly
 * Generates print iframe with @page styling { size: 74mm 100mm; margin: 0; }
 */
export const printCard = async (element: HTMLElement) => {
  try {
    const canvas = await captureCardCanvas(element);
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
