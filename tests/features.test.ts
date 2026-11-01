import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  calculatePrayerTimes,
  formatMalaysiaTime,
  planReminders,
  PRAYER_KEYS,
  PRAYER_ZONES,
  type PrayerKey,
} from '../services/prayer-times';
import { buildReportHtml, escapeHtml, summarizeReport, type ReportInput } from '../services/report';

const KL = PRAYER_ZONES.find((zone) => zone.id === 'kl')!;
const ALL_ON = Object.fromEntries(PRAYER_KEYS.map((key) => [key, true])) as Record<PrayerKey, boolean>;

const minutesOf = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

describe('prayer times', () => {
  // Reference: typical JAKIM times for Kuala Lumpur in early November. A wide window on purpose:
  // this catches a broken formula, while the screen tells parents to follow JAKIM's timetable.
  it('is close to known Kuala Lumpur times', () => {
    const times = calculatePrayerTimes(2026, 11, 1, KL);
    const expected: Record<PrayerKey, string> = {
      fajr: '05:45',
      dhuhr: '12:58',
      asr: '16:16',
      maghrib: '18:57',
      isha: '20:07',
    };
    for (const key of PRAYER_KEYS) {
      const diff = Math.abs(minutesOf(formatMalaysiaTime(times[key])) - minutesOf(expected[key]));
      assert.ok(diff <= 6, `${key} was ${formatMalaysiaTime(times[key])}, expected about ${expected[key]}`);
    }
  });

  it('keeps the prayers in order in every state, all year', () => {
    for (const zone of PRAYER_ZONES) {
      for (let month = 1; month <= 12; month++) {
        const times = calculatePrayerTimes(2027, month, 15, zone);
        for (let i = 1; i < PRAYER_KEYS.length; i++) {
          assert.ok(
            times[PRAYER_KEYS[i]] > times[PRAYER_KEYS[i - 1]],
            `${zone.id} month ${month}: ${PRAYER_KEYS[i]} before ${PRAYER_KEYS[i - 1]}`,
          );
        }
      }
    }
  });

  it('gives East Malaysia earlier times than the Peninsula, as the sun rises there first', () => {
    const sabah = PRAYER_ZONES.find((zone) => zone.id === 'sabah')!;
    assert.ok(calculatePrayerTimes(2027, 3, 1, sabah).maghrib < calculatePrayerTimes(2027, 3, 1, KL).maghrib);
  });
});

describe('reminder plan', () => {
  it('only schedules future prayers, soonest first', () => {
    const now = new Date(Date.UTC(2026, 10, 1, 6, 0)); // 14:00 in Malaysia, after Zohor
    const plan = planReminders(now, KL, ALL_ON, 2, 40);
    assert.equal(plan[0].key, 'asr');
    assert.ok(plan.every((reminder) => reminder.date > now));
    assert.equal(plan.length, 8);
    plan.slice(1).forEach((reminder, i) => assert.ok(reminder.date > plan[i].date));
  });

  it('leaves out switched-off prayers', () => {
    const plan = planReminders(new Date(Date.UTC(2026, 10, 1, 0, 0)), KL, { ...ALL_ON, isha: false }, 1, 40);
    assert.ok(plan.every((reminder) => reminder.key !== 'isha'));
  });

  it('never goes over the alarm limit', () => {
    assert.equal(planReminders(new Date(Date.UTC(2026, 10, 1, 0, 0)), KL, ALL_ON, 30, 40).length, 40);
  });
});

describe('progress report', () => {
  const base: ReportInput = {
    childName: 'Test',
    ramadanLabel: 'Ramadan 2027 — 1448H',
    ramadanDates: ['2027-02-08', '2027-02-09', '2027-02-10'],
    year: 2027,
    daysElapsed: 10,
    generatedOn: '2027-01-10',
    fasting: [
      { id: '1', child_id: 'c', date: '2027-02-08', status: 'full' },
      { id: '2', child_id: 'c', date: '2027-02-09', status: 'half' },
      { id: '3', child_id: 'c', date: '2026-03-01', status: 'full' },
    ],
    prayer: [
      { id: '1', child_id: 'c', date: '2027-01-02', fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
      { id: '2', child_id: 'c', date: '2027-01-03', fajr: true, dhuhr: false, asr: false, maghrib: false, isha: false },
      { id: '3', child_id: 'c', date: '2026-12-31', fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
    ],
    sunat: [
      { id: '1', child_id: 'c', date: '2027-01-04', type: 'isnin_khamis', completed: true },
      { id: '2', child_id: 'c', date: '2027-01-07', type: 'isnin_khamis', completed: false },
    ],
    quran: [{ id: '1', child_id: 'c', date: '2027-01-02', pages_read: 4 }],
    doa: [{
      id: '1', child_id: 'c', date: '2027-01-02',
      doa_makan: true, doa_tidur: true, doa_masuk_rumah: false, doa_keluar_rumah: false, doa_tandas: false, doa_kenderaan: false,
    }],
    doaItemCount: 6,
  };

  it('counts only this Ramadan and this year', () => {
    const summary = summarizeReport(base);
    assert.equal(summary.fastingFull, 1);
    assert.equal(summary.fastingHalf, 1);
    assert.equal(summary.prayerDone, 6);
    assert.equal(summary.prayerPossible, 50);
    assert.equal(summary.prayerPercent, 12);
    assert.equal(summary.perfectDays, 1);
    assert.equal(summary.sunatDone, 1);
    assert.equal(summary.quranPages, 4);
    assert.equal(summary.doaDone, 2);
    assert.equal(summary.monthlyPrayers[0], 6);
  });

  it('never exceeds 100%', () => {
    assert.equal(summarizeReport({ ...base, daysElapsed: 1 }).prayerPercent, 100);
  });

  it('escapes a child name so it cannot inject markup', () => {
    const html = buildReportHtml({ ...base, childName: '<img src=x onerror=alert(1)>' });
    assert.ok(!html.includes('<img'));
    assert.ok(html.includes('&lt;img'));
    assert.equal(escapeHtml(`a&b"'`), 'a&amp;b&quot;&#39;');
  });
});
