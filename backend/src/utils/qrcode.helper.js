const QRCode = require('qrcode');

/**
 * Generate QR code as a Buffer (for embedding in PDFs)
 */
async function generateQRBuffer(data, options = {}) {
  return QRCode.toBuffer(data, {
    type: 'png',
    width: options.width || 150,
    margin: 1,
    errorCorrectionLevel: 'H',  // High — survives print damage
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    ...options
  });
}

/**
 * Generate QR code as Base64 Data URL (for JSON API responses / HTML)
 */
async function generateQRDataURL(data, options = {}) {
  return QRCode.toDataURL(data, {
    width: options.width || 200,
    margin: 1,
    errorCorrectionLevel: 'H',
    ...options
  });
}

module.exports = { generateQRBuffer, generateQRDataURL };
