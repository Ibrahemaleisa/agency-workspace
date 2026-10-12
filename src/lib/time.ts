/** Minutes as "h:mm" (e.g. 95 → "1:35"). */
export const formatMinutes = (m: number) => `${Math.floor(m / 60)}:${String(Math.abs(m % 60)).padStart(2, "0")}`;

/** Minutes as decimal hours with up to two decimals (e.g. 95 → "1.58"), for reports and CSV. */
export const hoursOf = (m: number) => String(Math.round((m / 60) * 100) / 100);
