/**
 * Format Date menjadi YYYY-MM-DD
 * menggunakan local timezone browser.
 */
export function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Mengembalikan tanggal hari ini.
 */
export function getToday() {
  return formatDateLocal(new Date());
}

/**
 * This Week
 *
 * Senin → hari ini
 *
 * Contoh:
 * Senin 28 Sep → 28 Sep
 * Kamis 1 Okt → 28 Sep → 1 Okt
 */
export function getCurrentWeekRange() {
  const today = new Date();
  const day = today.getDay();

  // Sunday = 0
  // Monday = 1
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(today);

  monday.setDate(today.getDate() + diffToMonday);

  return {
    startDate: formatDateLocal(monday),
    endDate: formatDateLocal(today),
  };
}

/**
 * Last 7 Days
 *
 * Termasuk hari ini.
 *
 * Contoh:
 * 28 Sep → 22 Sep - 28 Sep
 */
export function getLast7DaysRange() {
  const today = new Date();

  const startDate = new Date(today);

  startDate.setDate(today.getDate() - 6);

  return {
    startDate: formatDateLocal(startDate),
    endDate: formatDateLocal(today),
  };
}

/**
 * Last 30 Days
 *
 * Termasuk hari ini.
 *
 * Contoh:
 * 28 Sep → 30 hari terakhir termasuk hari ini.
 */
export function getLast30DaysRange() {
  const today = new Date();

  const startDate = new Date(today);

  startDate.setDate(today.getDate() - 29);

  return {
    startDate: formatDateLocal(startDate),
    endDate: formatDateLocal(today),
  };
}

/**
 * Custom range.
 *
 * Dipakai ketika user memilih tanggal sendiri.
 */
export function getCustomRange(startDate, endDate) {
  return {
    startDate,
    endDate,
  };
}

/**
 * Mendapatkan range berdasarkan preset.
 *
 * Supported presets:
 *
 * - this_week
 * - last_7_days
 * - last_30_days
 * - custom
 */
export function getDateRange(preset, customStartDate = "", customEndDate = "") {
  switch (preset) {
    case "this_week":
      return getCurrentWeekRange();

    case "last_7_days":
      return getLast7DaysRange();

    case "last_30_days":
      return getLast30DaysRange();

    case "custom":
      return getCustomRange(customStartDate, customEndDate);

    default:
      return getCurrentWeekRange();
  }
}
