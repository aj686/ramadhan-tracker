import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getCurrentSeason,
  getRamadanDates,
  getRamadanLabel,
  getSeason,
  getSelectableSeasons,
  getSunatFestivalDates,
  getSyawalDates,
  RAMADAN_DAYS,
} from '../services/islamic-calendar';

const day = (year: number, month: number, date: number) => new Date(year, month - 1, date);

describe('current Ramadan', () => {
  it('keeps last Ramadan until 60 days before the next one', () => {
    assert.equal(getCurrentSeason(day(2026, 11, 1)).hijriYear, 1447);
    assert.equal(getCurrentSeason(day(2026, 12, 9)).hijriYear, 1447);
    assert.equal(getCurrentSeason(day(2026, 12, 10)).hijriYear, 1448);
    assert.equal(getCurrentSeason(day(2027, 2, 8)).hijriYear, 1448);
  });

  it('never goes before the first known season', () => {
    assert.equal(getCurrentSeason(day(2020, 1, 1)).hijriYear, 1447);
  });

  it('still works well past the end of the table', () => {
    const season = getCurrentSeason(day(2045, 6, 1));
    assert.ok(season.hijriYear > 1452);
    assert.equal(season.confirmed, false);
    assert.equal(season.ramadanStart.slice(0, 2), '20');
  });

  it('only offers seasons up to the current one', () => {
    assert.deepEqual(getSelectableSeasons(day(2026, 11, 1)).map((s) => s.hijriYear), [1447]);
    assert.deepEqual(getSelectableSeasons(day(2027, 3, 1)).map((s) => s.hijriYear), [1447, 1448]);
  });
});

describe('Ramadan dates', () => {
  it('keeps 2026 on the dates its logs were saved against', () => {
    const dates = getRamadanDates(getSeason(1447));
    assert.equal(dates.length, RAMADAN_DAYS);
    assert.equal(dates[0], '2026-02-18');
    assert.equal(dates[29], '2026-03-19');
  });

  it('crosses a month boundary correctly in 2027', () => {
    const dates = getRamadanDates(getSeason(1448));
    assert.equal(dates[0], '2027-02-08');
    assert.equal(dates[20], '2027-02-28');
    assert.equal(dates[21], '2027-03-01');
  });

  it('builds a label from the season, not a fixed year', () => {
    assert.equal(getRamadanLabel(getSeason(1448)), 'Ramadan 2027 — 1448H');
  });
});

describe('sunat dates', () => {
  it('starts Syawal the day after Eid, never on Eid', () => {
    const dates = getSyawalDates(getSeason(1448));
    assert.equal(dates[0], '2027-03-11');
    assert.ok(!dates.includes('2027-03-10'));
    assert.equal(dates.length, 28);
  });

  it('corrects the old 2026 April and June dates', () => {
    const { syawal, arafah } = getSunatFestivalDates(2026);
    assert.equal(syawal[0], '2026-03-22');
    assert.deepEqual(arafah, ['2026-05-26']);
  });

  it('is not empty after 2026', () => {
    for (const year of [2027, 2028, 2029, 2035]) {
      const { syawal, arafah } = getSunatFestivalDates(year);
      assert.ok(syawal.length > 0, `Syawal ${year}`);
      assert.ok(arafah.length > 0, `Arafah ${year}`);
    }
  });

  it('only returns dates inside the asked year', () => {
    const { syawal, arafah } = getSunatFestivalDates(2031);
    for (const date of [...syawal, ...arafah]) assert.ok(date.startsWith('2031-'), date);
  });
});
