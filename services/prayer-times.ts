// Estimated prayer times for reminders. Calculated on the device using JAKIM's published
// parameters: Subuh at 20° and Isyak at 18° below the horizon, Asar by the Shafi'i shadow rule,
// plus a safety margin. JAKIM's own timetable stays the authority, so screens label these
// "estimated". A reminder needs only the parent's chosen state, never a precise location.

export type PrayerKey = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export type PrayerTimes = Record<PrayerKey, Date>;

export const PRAYER_KEYS: PrayerKey[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export const PRAYER_LABELS: Record<PrayerKey, { ms: string; en: string }> = {
  fajr: { ms: 'Subuh', en: 'Fajr' },
  dhuhr: { ms: 'Zohor', en: 'Dhuhr' },
  asr: { ms: 'Asar', en: 'Asr' },
  maghrib: { ms: 'Maghrib', en: 'Maghrib' },
  isha: { ms: 'Isyak', en: 'Isha' },
};

export const PRAYER_ZONES: PrayerZone[] = [
  { id: 'kl', name: 'Kuala Lumpur', latitude: 3.14, longitude: 101.69 },
  { id: 'putrajaya', name: 'Putrajaya', latitude: 2.93, longitude: 101.69 },
  { id: 'selangor', name: 'Selangor (Shah Alam)', latitude: 3.07, longitude: 101.52 },
  { id: 'johor', name: 'Johor (Johor Bahru)', latitude: 1.49, longitude: 103.74 },
  { id: 'kedah', name: 'Kedah (Alor Setar)', latitude: 6.12, longitude: 100.37 },
  { id: 'kelantan', name: 'Kelantan (Kota Bharu)', latitude: 6.13, longitude: 102.24 },
  { id: 'melaka', name: 'Melaka', latitude: 2.19, longitude: 102.25 },
  { id: 'n9', name: 'Negeri Sembilan (Seremban)', latitude: 2.73, longitude: 101.94 },
  { id: 'pahang', name: 'Pahang (Kuantan)', latitude: 3.81, longitude: 103.33 },
  { id: 'perak', name: 'Perak (Ipoh)', latitude: 4.6, longitude: 101.08 },
  { id: 'perlis', name: 'Perlis (Kangar)', latitude: 6.44, longitude: 100.2 },
  { id: 'penang', name: 'Pulau Pinang (George Town)', latitude: 5.41, longitude: 100.33 },
  { id: 'sabah', name: 'Sabah (Kota Kinabalu)', latitude: 5.98, longitude: 116.07 },
  { id: 'sarawak', name: 'Sarawak (Kuching)', latitude: 1.55, longitude: 110.34 },
  { id: 'terengganu', name: 'Terengganu (Kuala Terengganu)', latitude: 5.33, longitude: 103.14 },
  { id: 'labuan', name: 'Labuan', latitude: 5.28, longitude: 115.24 },
];

export const DEFAULT_ZONE_ID = 'kl';

const MALAYSIA_UTC_OFFSET_HOURS = 8;
const FAJR_ANGLE = 20;
const ISHA_ANGLE = 18;
const SUNSET_ANGLE = 0.833;
const ASR_SHADOW_FACTOR = 1;
const SAFETY_MARGIN_MINUTES = 2;

const rad = (degrees: number) => (degrees * Math.PI) / 180;
const deg = (radians: number) => (radians * 180) / Math.PI;
const fixHour = (hour: number) => ((hour % 24) + 24) % 24;
const fixAngle = (angle: number) => ((angle % 360) + 360) % 360;

const julianDay = (year: number, month: number, day: number): number => {
  const y = month <= 2 ? year - 1 : year;
  const m = month <= 2 ? month + 12 : month;
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5;
};

const sunPosition = (jd: number) => {
  const d = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * d);
  const q = fixAngle(280.459 + 0.98564736 * d);
  const l = fixAngle(q + 1.915 * Math.sin(rad(g)) + 0.02 * Math.sin(rad(2 * g)));
  const e = 23.439 - 0.00000036 * d;
  const ra = deg(Math.atan2(Math.cos(rad(e)) * Math.sin(rad(l)), Math.cos(rad(l)))) / 15;
  return {
    declination: deg(Math.asin(Math.sin(rad(e)) * Math.sin(rad(l)))),
    equation: q / 15 - fixHour(ra),
  };
};

export const calculatePrayerTimes = (year: number, month: number, day: number, zone: PrayerZone): PrayerTimes => {
  // Solar position is taken near each event's own time of day, which is accurate enough for reminders.
  const jd = julianDay(year, month, day) - zone.longitude / (15 * 24);

  const noonAt = (dayFraction: number) => fixHour(12 - sunPosition(jd + dayFraction).equation);

  const hourAngleTime = (angle: number, dayFraction: number, beforeNoon: boolean) => {
    const { declination } = sunPosition(jd + dayFraction);
    const noon = noonAt(dayFraction);
    const cosine =
      (-Math.sin(rad(angle)) - Math.sin(rad(declination)) * Math.sin(rad(zone.latitude))) /
      (Math.cos(rad(declination)) * Math.cos(rad(zone.latitude)));
    const offset = deg(Math.acos(Math.max(-1, Math.min(1, cosine)))) / 15;
    return noon + (beforeNoon ? -offset : offset);
  };

  const asrTime = (dayFraction: number) => {
    const { declination } = sunPosition(jd + dayFraction);
    const angle = -deg(Math.atan(1 / (ASR_SHADOW_FACTOR + Math.tan(rad(Math.abs(zone.latitude - declination))))));
    return hourAngleTime(angle, dayFraction, false);
  };

  const solarHours: Record<PrayerKey, number> = {
    fajr: hourAngleTime(FAJR_ANGLE, 5 / 24, true),
    dhuhr: noonAt(12 / 24),
    asr: asrTime(13 / 24),
    maghrib: hourAngleTime(SUNSET_ANGLE, 18 / 24, false),
    isha: hourAngleTime(ISHA_ANGLE, 18 / 24, false),
  };

  const toDate = (solarHour: number): Date => {
    const localHour = solarHour + MALAYSIA_UTC_OFFSET_HOURS - zone.longitude / 15;
    const totalMinutes = Math.ceil(localHour * 60) + SAFETY_MARGIN_MINUTES;
    // Built in UTC, so a reminder fires at the right moment even on a phone set to another time zone.
    return new Date(Date.UTC(year, month - 1, day, 0, totalMinutes - MALAYSIA_UTC_OFFSET_HOURS * 60));
  };

  return {
    fajr: toDate(solarHours.fajr),
    dhuhr: toDate(solarHours.dhuhr),
    asr: toDate(solarHours.asr),
    maghrib: toDate(solarHours.maghrib),
    isha: toDate(solarHours.isha),
  };
};

export const formatMalaysiaTime = (date: Date): string => {
  const malaysia = new Date(date.getTime() + MALAYSIA_UTC_OFFSET_HOURS * 3600000);
  const hours = String(malaysia.getUTCHours()).padStart(2, '0');
  const minutes = String(malaysia.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export interface PlannedReminder {
  key: PrayerKey;
  date: Date;
}

// The next reminders from `now`, soonest first, capped because phones limit scheduled alarms.
export const planReminders = (
  now: Date,
  zone: PrayerZone,
  enabled: Record<PrayerKey, boolean>,
  days: number,
  limit: number,
): PlannedReminder[] => {
  const malaysiaNow = new Date(now.getTime() + MALAYSIA_UTC_OFFSET_HOURS * 3600000);
  const planned: PlannedReminder[] = [];

  for (let offset = 0; offset < days; offset++) {
    const day = new Date(Date.UTC(
      malaysiaNow.getUTCFullYear(),
      malaysiaNow.getUTCMonth(),
      malaysiaNow.getUTCDate() + offset,
    ));
    const times = calculatePrayerTimes(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), zone);
    PRAYER_KEYS.forEach((key) => {
      if (enabled[key] && times[key].getTime() > now.getTime()) {
        planned.push({ key, date: times[key] });
      }
    });
  }

  return planned.slice(0, limit);
};
