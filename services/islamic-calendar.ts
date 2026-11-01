import { parseDateKey, toDateKey } from './dates';

// Malaysia's dates come from JAKIM and moon sighting, so each year is a row here.
// `confirmed: false` is an expected date: replace it once JAKIM announces.
//
// 1447 keeps its 18 Feb start even though Malaysia began on 19 Feb, because fasting
// logs from Ramadan 2026 were saved against these date keys.

export interface IslamicSeason {
  hijriYear: number;
  ramadanStart: string; // first fasting day
  eidFitr: string;      // 1 Syawal
  arafah: string;       // 9 Zulhijjah
  confirmed: boolean;
}

export const RAMADAN_DAYS = 30;

const SEASONS: IslamicSeason[] = [
  { hijriYear: 1447, ramadanStart: '2026-02-18', eidFitr: '2026-03-21', arafah: '2026-05-26', confirmed: true },
  { hijriYear: 1448, ramadanStart: '2027-02-08', eidFitr: '2027-03-10', arafah: '2027-05-16', confirmed: false },
  { hijriYear: 1449, ramadanStart: '2028-01-28', eidFitr: '2028-02-26', arafah: '2028-05-04', confirmed: false },
  { hijriYear: 1450, ramadanStart: '2029-01-16', eidFitr: '2029-02-14', arafah: '2029-04-23', confirmed: false },
  { hijriYear: 1451, ramadanStart: '2030-01-06', eidFitr: '2030-02-04', arafah: '2030-04-13', confirmed: false },
  { hijriYear: 1452, ramadanStart: '2030-12-26', eidFitr: '2031-01-24', arafah: '2031-04-02', confirmed: false },
];

// A Hijri year is about 354.37 days. Only used past the end of the table.
const HIJRI_YEAR_DAYS = 354.37;

// The tracker moves to the coming Ramadan this many days before it starts,
// so parents can see it early and last year's reward stays visible until then.
const SEASON_LEAD_DAYS = 60;

// 2 to 29 Syawal: 1 Syawal is Eid, when fasting is not allowed.
const SYAWAL_FIRST_OFFSET = 1;
const SYAWAL_LAST_OFFSET = 28;

const addDays = (key: string, days: number): string => {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
};

const estimateSeason = (hijriYear: number): IslamicSeason => {
  const last = SEASONS[SEASONS.length - 1];
  const shift = Math.round((hijriYear - last.hijriYear) * HIJRI_YEAR_DAYS);
  return {
    hijriYear,
    ramadanStart: addDays(last.ramadanStart, shift),
    eidFitr: addDays(last.eidFitr, shift),
    arafah: addDays(last.arafah, shift),
    confirmed: false,
  };
};

export const getSeason = (hijriYear: number): IslamicSeason => {
  const known = SEASONS.find((season) => season.hijriYear === hijriYear);
  if (known) return known;
  return hijriYear < SEASONS[0].hijriYear ? SEASONS[0] : estimateSeason(hijriYear);
};

export const getCurrentSeason = (today: Date = new Date()): IslamicSeason => {
  const todayKey = toDateKey(today);
  let current = SEASONS[0];
  for (let hijriYear = SEASONS[0].hijriYear; ; hijriYear++) {
    const season = getSeason(hijriYear);
    if (addDays(season.ramadanStart, -SEASON_LEAD_DAYS) > todayKey) return current;
    current = season;
  }
};

// Oldest first, ending at the current season. Future seasons are not selectable.
export const getSelectableSeasons = (today: Date = new Date()): IslamicSeason[] => {
  const current = getCurrentSeason(today);
  const seasons: IslamicSeason[] = [];
  for (let hijriYear = SEASONS[0].hijriYear; hijriYear <= current.hijriYear; hijriYear++) {
    seasons.push(getSeason(hijriYear));
  }
  return seasons;
};

export const getRamadanDates = (season: IslamicSeason): string[] =>
  Array.from({ length: RAMADAN_DAYS }, (_, i) => addDays(season.ramadanStart, i));

export const getSeasonYear = (season: IslamicSeason): number =>
  parseDateKey(season.ramadanStart).getFullYear();

export const getRamadanLabel = (season: IslamicSeason): string =>
  `Ramadan ${getSeasonYear(season)} — ${season.hijriYear}H`;

export const getSyawalDates = (season: IslamicSeason): string[] => {
  const dates: string[] = [];
  for (let offset = SYAWAL_FIRST_OFFSET; offset <= SYAWAL_LAST_OFFSET; offset++) {
    dates.push(addDays(season.eidFitr, offset));
  }
  return dates;
};

// Syawal and Arafah that fall in a calendar year. Most years have one of each,
// but the Hijri year is shorter, so some years hold two Ramadans.
export const getSunatFestivalDates = (year: number): { syawal: string[]; arafah: string[] } => {
  const prefix = `${year}-`;
  const syawal: string[] = [];
  const arafah: string[] = [];

  for (let hijriYear = SEASONS[0].hijriYear; ; hijriYear++) {
    const season = getSeason(hijriYear);
    if (parseDateKey(season.ramadanStart).getFullYear() > year) break;
    syawal.push(...getSyawalDates(season).filter((date) => date.startsWith(prefix)));
    if (season.arafah.startsWith(prefix)) arafah.push(season.arafah);
  }

  return { syawal, arafah };
};
