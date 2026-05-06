import QRCode from 'qrcode';

// Build the QR payload from a measure. Kept tiny for fast scanning.
export function buildQRPayload(measure) {
  if (!measure) return null;
  return JSON.stringify({
    barcode: measure.barcode,
    weight: measure.weight,
    len: measure.len,
    width: measure.width,
    height: measure.height,
    vol: measure.vol,
  });
}

export async function renderQRDataURL(payload, opts = {}) {
  if (!payload) return null;
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: opts.width ?? 320,
    color: { dark: '#0b1c3a', light: '#ffffff' },
  });
}
