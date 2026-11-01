import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { calculateExpiry, fetchVerifiedPayment, isPaymentValid } from '../supabase/functions/_shared/toyyibpay';

// The shared module runs on Deno in production and reads only its sandbox flag from the environment.
declare global {
  var Deno: { env: { get: (key: string) => string | undefined } };
}
globalThis.Deno = { env: { get: () => undefined } };

const respond = (body: unknown, ok = true) =>
  (async () => ({ ok, status: ok ? 200 : 500, json: async () => body })) as unknown as typeof fetch;

describe('payment verification', () => {
  it('reads a paid transaction and converts ringgit to sen', async () => {
    const payment = await fetchVerifiedPayment(
      'bill',
      respond([{ billpaymentStatus: '1', billpaymentAmount: '49.90', billExternalReferenceNo: 'order' }]),
    );
    assert.deepEqual(payment, { paidSen: 4990, externalReference: 'order' });
  });

  it('finds no payment when the bill has none, or only unpaid ones', async () => {
    assert.equal(await fetchVerifiedPayment('bill', respond([])), null);
    assert.equal(await fetchVerifiedPayment('bill', respond({ error: 'none' })), null);
    assert.equal(await fetchVerifiedPayment('bill', respond([{ billpaymentStatus: '3', billpaymentAmount: '9.90' }])), null);
  });

  it('throws on a gateway error, so the callback asks for a retry', async () => {
    await assert.rejects(fetchVerifiedPayment('bill', respond([], false)));
  });
});

describe('payment validity', () => {
  it('accepts the right price for the right order', () => {
    assert.ok(isPaymentValid({ paidSen: 990, externalReference: 'o' }, 'monthly', 'o'));
  });

  it('accepts a price plus the gateway charge', () => {
    assert.ok(isPaymentValid({ paidSen: 1090, externalReference: 'o' }, 'monthly', 'o'));
  });

  it('rejects paying the monthly price for the yearly plan', () => {
    assert.ok(!isPaymentValid({ paidSen: 990, externalReference: 'o' }, 'yearly', 'o'));
  });

  it('rejects a real payment that belongs to a different order', () => {
    assert.ok(!isPaymentValid({ paidSen: 4990, externalReference: 'other' }, 'yearly', 'o'));
  });
});

describe('subscription expiry', () => {
  const now = new Date('2026-11-01T00:00:00Z');

  it('runs from today for a new subscriber', () => {
    assert.equal(calculateExpiry('monthly', now, null).toISOString(), '2026-12-01T00:00:00.000Z');
    assert.equal(calculateExpiry('yearly', now, null).toISOString(), '2027-11-01T00:00:00.000Z');
  });

  it('adds to remaining time when renewing early', () => {
    const remaining = new Date('2026-11-20T00:00:00Z');
    assert.equal(calculateExpiry('monthly', now, remaining).toISOString(), '2026-12-20T00:00:00.000Z');
  });

  it('ignores an expiry already in the past', () => {
    const lapsed = new Date('2026-01-01T00:00:00Z');
    assert.equal(calculateExpiry('monthly', now, lapsed).toISOString(), '2026-12-01T00:00:00.000Z');
  });
});
