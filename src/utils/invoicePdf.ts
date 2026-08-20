import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Transaction, Language } from '../types';

interface StoreInfo {
  shopName?: string;
  ownerPhone?: string;
  wilaya?: string;
}

/**
 * Generate and download a PDF Invoice from an HTML element element
 */
export async function exportInvoiceToPdf(
  elementId: string, 
  filename: string
): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Invoice element not found:', elementId);
    return false;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution crisp PDF render
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [canvas.width * 0.264583, canvas.height * 0.264583] // Exact fitting
    });

    pdf.addImage(
      imgData, 
      'PNG', 
      0, 
      0, 
      canvas.width * 0.264583, 
      canvas.height * 0.264583
    );

    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    return false;
  }
}

/**
 * Direct print of the invoice container using native browser printing with thermal printer support (58mm / 80mm)
 */
export function printInvoiceDirect(elementId: string, paperWidth: '58mm' | '80mm' = '80mm'): void {
  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

  // Create a hidden print iframe to isolate invoice styles
  const printIframe = document.createElement('iframe');
  printIframe.style.position = 'fixed';
  printIframe.style.right = '0';
  printIframe.style.bottom = '0';
  printIframe.style.width = '0';
  printIframe.style.height = '0';
  printIframe.style.border = '0';
  document.body.appendChild(printIframe);

  const pri = printIframe.contentWindow;
  if (!pri) {
    window.print();
    return;
  }

  const is58 = paperWidth === '58mm';
  const pageWidthCss = is58 ? '58mm' : '80mm';
  const bodyWidthCss = is58 ? '54mm' : '76mm';

  const doc = pri.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>طباعة فاتورة - فينَك المحلي</title>
      <style>
        @page {
          size: ${pageWidthCss} auto;
          margin: 0;
        }
        @media print {
          html, body {
            width: ${pageWidthCss};
            margin: 0 auto;
            padding: 0;
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          margin: 0 auto;
          padding: ${is58 ? '4px' : '8px'};
          width: ${bodyWidthCss};
          background: #ffffff;
          color: #000000;
          direction: rtl;
          font-size: ${is58 ? '10px' : '11px'};
          line-height: 1.25;
        }
        /* Logo formatting for thermal printers */
        img {
          max-width: ${is58 ? '38mm' : '52mm'} !important;
          height: auto !important;
          display: block !important;
          margin: 0 auto 4px auto !important;
          object-fit: contain;
          image-rendering: -webkit-optimize-contrast;
          image-rendering: crisp-edges;
        }
        .no-print, button, svg.lucide-x, svg.lucide-printer, svg.lucide-download {
          display: none !important;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 4px 0;
          font-size: ${is58 ? '9.5px' : '11px'};
        }
        th, td {
          padding: ${is58 ? '2px 1px' : '3px 2px'};
          word-break: break-word;
        }
        th {
          border-bottom: 1px solid #000;
          font-weight: 800;
        }
        td {
          border-bottom: 1px dashed #ccc;
        }
        .text-center { text-align: center !important; }
        .text-left { text-align: left !important; }
        .text-right { text-align: right !important; }
        .font-mono { font-family: monospace, monospace; }
        .font-bold { font-weight: bold; }
        .font-black { font-weight: 900; }
        .border-dashed { border-style: dashed !important; }
        .border-t { border-top: 1px solid #000 !important; }
        .border-b { border-bottom: 1px solid #000 !important; }
        /* Clean card styles in receipt mode */
        #printable-invoice-receipt {
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          background: transparent !important;
        }
      </style>
    </head>
    <body>
      ${element.outerHTML}
      <script>
        window.onload = function() {
          window.focus();
          window.print();
          setTimeout(function() {
            if (window.frameElement && window.frameElement.parentNode) {
              window.frameElement.parentNode.removeChild(window.frameElement);
            }
          }, 800);
        };
      </script>
    </body>
    </html>
  `);
  doc.close();
}

/**
 * Direct print for standard A4 commercial documents (Bon de Livraison, Wholesale Invoice)
 */
export function printDocumentA4(elementId: string): void {
  const element = document.getElementById(elementId);
  if (!element) {
    window.print();
    return;
  }

  const printIframe = document.createElement('iframe');
  printIframe.style.position = 'fixed';
  printIframe.style.right = '0';
  printIframe.style.bottom = '0';
  printIframe.style.width = '0';
  printIframe.style.height = '0';
  printIframe.style.border = '0';
  document.body.appendChild(printIframe);

  const pri = printIframe.contentWindow;
  if (!pri) {
    window.print();
    return;
  }

  const doc = pri.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <title>سند تسليم وفاتورة بيع بالجملة</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        @media print {
          html, body {
            width: 100%;
            margin: 0;
            padding: 0;
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          margin: 0;
          padding: 8px;
          background: #ffffff;
          color: #0f172a;
          direction: rtl;
          font-size: 12px;
          line-height: 1.4;
        }
        .no-print, button, svg.lucide-x, svg.lucide-printer, svg.lucide-download {
          display: none !important;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 8px 0;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 6px 8px;
        }
        th {
          background-color: #f1f5f9 !important;
          font-weight: 800;
          color: #0f172a;
        }
        .text-center { text-align: center !important; }
        .text-left { text-align: left !important; }
        .text-right { text-align: right !important; }
        .font-bold { font-weight: bold; }
        .font-black { font-weight: 900; }
        #printable-wholesale-doc {
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          margin: 0 !important;
          width: 100% !important;
          background: transparent !important;
        }
      </style>
    </head>
    <body>
      ${element.outerHTML}
      <script>
        window.onload = function() {
          window.focus();
          window.print();
          setTimeout(function() {
            if (window.frameElement && window.frameElement.parentNode) {
              window.frameElement.parentNode.removeChild(window.frameElement);
            }
          }, 800);
        };
      </script>
    </body>
    </html>
  `);
  doc.close();
}
