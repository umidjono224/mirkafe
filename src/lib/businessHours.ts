// Business hours configuration
const OPEN_HOUR = 9;  // 09:00
const CLOSE_HOUR = 24; // 00:00 (midnight)

/**
 * Check if the restaurant is currently open for orders
 * Uses device local time - no internet required
 */
export function isWithinBusinessHours(): boolean {
  const now = new Date();
  const currentHour = now.getHours();
  
  // Open from 09:00 to 24:00 (midnight)
  // Closed from 00:00 to 09:00
  return currentHour >= OPEN_HOUR && currentHour < CLOSE_HOUR;
}

/**
 * Get the business hours message in Uzbek
 */
export function getClosedMessage(): string {
  return "Ish vaqti tugadi. Buyurtmalar tonggi 9:00 dan tungi 12:00 gacha qabul qilinadi.";
}
