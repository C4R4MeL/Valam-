export function whatsappNumber(value: string | null | undefined): string | null {
  if (!value) return null;
  const digits = value.replace(/[\s()+-]/g, '');
  const normalized = digits.startsWith('0') ? '62' + digits.slice(1) : digits;
  return /^[1-9]\d{7,14}$/.test(normalized) ? normalized : null;
}

export function sampleRequestUrl(contact: string | null | undefined, batchCode: string, batchUrl: string): string | null {
  const phone = whatsappNumber(contact);
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(`Saya ingin menanyakan ketersediaan sampel untuk batch ${batchCode}. Referensi: ${batchUrl}`)}`;
}
