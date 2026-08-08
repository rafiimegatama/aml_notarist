// Waktu server = waktu kantor notaris (FR-6A, app cuma jalan di 127.0.0.1
// lokal) — jadi cukup pakai jam lokal server, tidak perlu konversi zona
// waktu eksplisit. Rentang persis: 00:00-09:00 Pagi, 09:01-15:00 Siang,
// 15:01-18:00 Sore, 18:01-23:59 Malam.
export function greetingForTime(date: Date): string {
  const minutesSinceMidnight = date.getHours() * 60 + date.getMinutes();
  if (minutesSinceMidnight <= 9 * 60) return "Selamat Pagi";
  if (minutesSinceMidnight <= 15 * 60) return "Selamat Siang";
  if (minutesSinceMidnight <= 18 * 60) return "Selamat Sore";
  return "Selamat Malam";
}
