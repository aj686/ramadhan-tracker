// Shared by create-payment and payment-callback, so the price charged and the price
// checked can never drift apart.

export const PLANS = {
  monthly: { label: 'MyLittleMuslim Premium (Monthly)', amountSen: 990, months: 1 },
  yearly: { label: 'MyLittleMuslim Premium (Yearly)', amountSen: 4990, months: 12 },
} as const;

export type PlanId = keyof typeof PLANS;

export const toyyibpayBase = (): string =>
  Deno.env.get('TOYYIBPAY_SANDBOX') === 'false' ? 'https://toyyibpay.com' : 'https://dev.toyyibpay.com';

export interface VerifiedPayment {
  paidSen: number;
  externalReference: string;
}

const STATUS_SUCCESS = '1';

// Asks ToyyibPay directly, because the callback endpoint is public and its body can be forged.
// Returns null when there is no successful payment on this bill.
export const fetchVerifiedPayment = async (
  billCode: string,
  fetcher: typeof fetch = fetch,
): Promise<VerifiedPayment | null> => {
  const response = await fetcher(`${toyyibpayBase()}/index.php/api/getBillTransactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ billCode, billpaymentStatus: STATUS_SUCCESS }).toString(),
  });

  if (!response.ok) throw new Error(`getBillTransactions returned ${response.status}`);

  const transactions: unknown = await response.json();
  if (!Array.isArray(transactions)) return null;

  const paid = transactions.find((transaction) => transaction?.billpaymentStatus === STATUS_SUCCESS);
  if (!paid) return null;

  // ToyyibPay reports this amount in ringgit, for example "9.90".
  const paidSen = Math.round(parseFloat(String(paid.billpaymentAmount)) * 100);
  if (!Number.isFinite(paidSen)) return null;

  return { paidSen, externalReference: String(paid.billExternalReferenceNo ?? '') };
};

// The customer may also pay a gateway charge, so paying more than the price is fine. Less is not.
export const isPaymentValid = (
  payment: VerifiedPayment,
  plan: PlanId,
  orderId: string,
): boolean => payment.paidSen >= PLANS[plan].amountSen && payment.externalReference === orderId;

// Renewing early adds to the time already paid for, instead of throwing it away.
export const calculateExpiry = (plan: PlanId, now: Date, currentExpiry: Date | null): Date => {
  const start = currentExpiry && currentExpiry > now ? currentExpiry : now;
  const expiry = new Date(start);
  expiry.setMonth(expiry.getMonth() + PLANS[plan].months);
  return expiry;
};
