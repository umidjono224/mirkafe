// Format price in Uzbek sum
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price) + " so'm";
}

// Format phone number
export function formatPhone(phone: string): string {
  // Ensure starts with +998
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `+998 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('998')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10)}`;
  }
  return phone;
}

// Validate Uzbek phone number
export function isValidUzPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  // Accept 9 digits or 12 digits starting with 998
  return (cleaned.length === 9) || (cleaned.length === 12 && cleaned.startsWith('998'));
}

// Normalize phone to standard format
export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `+998${cleaned}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith('998')) {
    return `+${cleaned}`;
  }
  return phone;
}
