import type { DoaLog, FastingLog, PrayerLog, QuranLog, SunatLog } from '../types';

export interface ReportInput {
  childName: string;
  ramadanLabel: string;
  ramadanDates: string[];
  year: number;
  daysElapsed: number;
  generatedOn: string;
  fasting: FastingLog[];
  prayer: PrayerLog[];
  sunat: SunatLog[];
  quran: QuranLog[];
  doa: DoaLog[];
  doaItemCount: number;
}

export interface ReportSummary {
  fastingFull: number;
  fastingHalf: number;
  fastingTotal: number;
  prayerDone: number;
  prayerPossible: number;
  prayerPercent: number;
  perfectDays: number;
  sunatDone: number;
  quranPages: number;
  doaDone: number;
  monthlyPrayers: number[];
}

const PRAYERS_PER_DAY = 5;
const DOA_KEYS = ['doa_makan', 'doa_tidur', 'doa_masuk_rumah', 'doa_keluar_rumah', 'doa_tandas', 'doa_kenderaan'] as const;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const countPrayers = (log: PrayerLog) =>
  [log.fajr, log.dhuhr, log.asr, log.maghrib, log.isha].filter(Boolean).length;

export const summarizeReport = (input: ReportInput): ReportSummary => {
  const prefix = `${input.year}-`;
  const inYear = <T extends { date: string }>(rows: T[]) => rows.filter((row) => row.date.startsWith(prefix));
  const ramadan = input.fasting.filter((row) => input.ramadanDates.includes(row.date));

  const prayer = inYear(input.prayer);
  const prayerDone = prayer.reduce((sum, log) => sum + countPrayers(log), 0);
  const prayerPossible = Math.max(1, input.daysElapsed) * PRAYERS_PER_DAY;

  const monthlyPrayers = Array.from({ length: 12 }, () => 0);
  prayer.forEach((log) => {
    monthlyPrayers[Number(log.date.slice(5, 7)) - 1] += countPrayers(log);
  });

  return {
    fastingFull: ramadan.filter((row) => row.status === 'full').length,
    fastingHalf: ramadan.filter((row) => row.status === 'half').length,
    fastingTotal: input.ramadanDates.length,
    prayerDone,
    prayerPossible,
    prayerPercent: Math.min(100, Math.round((prayerDone / prayerPossible) * 100)),
    perfectDays: prayer.filter((log) => countPrayers(log) === PRAYERS_PER_DAY).length,
    sunatDone: inYear(input.sunat).filter((row) => row.completed).length,
    quranPages: inYear(input.quran).reduce((sum, row) => sum + row.pages_read, 0),
    doaDone: inYear(input.doa).reduce((sum, row) => sum + DOA_KEYS.filter((key) => row[key]).length, 0),
    monthlyPrayers,
  };
};

// A child's name is typed by a parent and ends up in HTML, so it must never be able to inject markup.
export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const buildReportHtml = (input: ReportInput): string => {
  const summary = summarizeReport(input);
  const name = escapeHtml(input.childName);

  const stat = (label: string, value: string, sub = '') => `
    <div class="stat">
      <div class="value">${escapeHtml(value)}</div>
      <div class="label">${escapeHtml(label)}</div>
      ${sub ? `<div class="sub">${escapeHtml(sub)}</div>` : ''}
    </div>`;

  const monthRows = summary.monthlyPrayers
    .map((count, month) => ({ count, month }))
    .filter(({ count }) => count > 0)
    .map(({ count, month }) => `<tr><td>${MONTHS[month]} ${input.year}</td><td>${count}</td></tr>`)
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<title>${name} — MyLittleMuslim</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Segoe UI', Roboto, Arial, sans-serif; color: #1F1B3A; margin: 32px; }
  h1 { font-size: 26px; margin: 0 0 4px; }
  h2 { font-size: 16px; margin: 24px 0 8px; color: #5B3FD6; }
  .meta { color: #5B5970; font-size: 13px; margin: 0 0 16px; }
  .stats { display: flex; flex-wrap: wrap; gap: 12px; }
  .stat { flex: 1 1 140px; border: 1px solid #E6E2F5; border-radius: 12px; padding: 12px; background: #F9F8FD; }
  .value { font-size: 22px; font-weight: 700; }
  .label { font-size: 13px; font-weight: 600; }
  .sub { font-size: 12px; color: #5B5970; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #E6E2F5; }
  .footer { margin-top: 24px; color: #5B5970; font-size: 12px; }
</style>
</head>
<body>
  <h1>${name}</h1>
  <p class="meta">MyLittleMuslim progress report · ${input.year} · ${escapeHtml(input.generatedOn)}</p>

  <h2>${escapeHtml(input.ramadanLabel)}</h2>
  <div class="stats">
    ${stat('Full days', String(summary.fastingFull), `of ${summary.fastingTotal}`)}
    ${stat('Half days', String(summary.fastingHalf))}
  </div>

  <h2>Solat ${input.year}</h2>
  <div class="stats">
    ${stat('Prayers', `${summary.prayerDone} / ${summary.prayerPossible}`, `${summary.prayerPercent}%`)}
    ${stat('Days with all 5', String(summary.perfectDays))}
  </div>

  <h2>Other habits ${input.year}</h2>
  <div class="stats">
    ${stat('Puasa Sunat', String(summary.sunatDone))}
    ${stat('Quran pages', String(summary.quranPages))}
    ${stat('Doa', String(summary.doaDone))}
  </div>

  ${monthRows ? `<h2>Solat by month</h2><table><tr><th>Month</th><th>Prayers</th></tr>${monthRows}</table>` : ''}

  <p class="footer">Made with MyLittleMuslim. Every small step counts.</p>
</body>
</html>`;
};
