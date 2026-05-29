import { getRuntimeEnv } from '@/lib/runtimeEnv';

export type PaymentMethodId = 'direct_upi' | 'razorpay' | 'stripe';

export const MERCHANT_UPI_VPA =
  getRuntimeEnv('MERCHANT_UPI_VPA') || '9481657016@upi';

export const MERCHANT_UPI_PAYEE_NAME =
  getRuntimeEnv('MERCHANT_UPI_PAYEE_NAME') || 'Scan App';

/** ₹10 default */
export function getExportPriceInrPaise(): number {
  return Number(getRuntimeEnv('EXPORT_PRICE_PAISE') ?? 1000);
}

/** ~₹10 equivalent for international (Stripe) */
export function getExportPriceUsdCents(): number {
  return Number(process.env.EXPORT_PRICE_USD_CENTS ?? 12);
}

export function formatInr(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function isRazorpayConfigured(): boolean {
  const keyId = getRuntimeEnv('NEXT_PUBLIC_RAZORPAY_KEY_ID');
  const secret = getRuntimeEnv('RAZORPAY_KEY_SECRET');
  if (!keyId || !secret) return false;
  if (keyId.includes('...') || secret.includes('...')) return false;
  if (!keyId.startsWith('rzp_')) return false;
  if (secret.length < 16) return false;
  return true;
}

export function isStripeConfigured(): boolean {
  const secret = getRuntimeEnv('STRIPE_SECRET_KEY');
  const publishable = getRuntimeEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
  if (!secret || !publishable) return false;
  if (secret.includes('...') || publishable.includes('...')) return false;
  if (!secret.startsWith('sk_') && !secret.startsWith('rk_')) return false;
  if (!publishable.startsWith('pk_')) return false;
  return true;
}

export type PaymentMethodInfo = {
  id: PaymentMethodId;
  label: string;
  description: string;
  enabled: boolean;
  currency: 'INR' | 'USD';
  amount: number;
  amountLabel: string;
  setupHint?: string;
};

export function getAvailablePaymentMethods(): PaymentMethodInfo[] {
  const inrPaise = getExportPriceInrPaise();
  const usdCents = getExportPriceUsdCents();

  return [
    {
      id: 'direct_upi',
      label: 'UPI',
      description: 'Google Pay, PhonePe, Paytm, BHIM',
      enabled: Boolean(MERCHANT_UPI_VPA),
      currency: 'INR',
      amount: inrPaise,
      amountLabel: formatInr(inrPaise),
    },
    {
      id: 'razorpay',
      label: 'Card & Indian methods',
      description: 'Debit/credit card, netbanking, wallets, UPI via Razorpay',
      enabled: isRazorpayConfigured(),
      currency: 'INR',
      amount: inrPaise,
      amountLabel: formatInr(inrPaise),
      setupHint: isRazorpayConfigured()
        ? undefined
        : 'Add Razorpay API keys in .env.local (see PAYMENT_SETUP.md)',
    },
    {
      id: 'stripe',
      label: 'International',
      description: 'Visa, Mastercard, Amex — outside India',
      enabled: isStripeConfigured(),
      currency: 'USD',
      amount: usdCents,
      amountLabel: formatUsd(usdCents),
      setupHint: isStripeConfigured()
        ? undefined
        : 'Add Stripe API keys in .env.local (see PAYMENT_SETUP.md)',
    },
  ];
}

export function buildUpiPayUrl(options: {
  amountPaise: number;
  payeeName?: string;
  transactionNote: string;
  transactionRef: string;
}): string {
  const amountInr = (options.amountPaise / 100).toFixed(2);
  const params = new URLSearchParams({
    pa: MERCHANT_UPI_VPA,
    pn: options.payeeName ?? MERCHANT_UPI_PAYEE_NAME,
    am: amountInr,
    cu: 'INR',
    tn: options.transactionNote.slice(0, 80),
    tr: options.transactionRef.slice(0, 35),
  });
  return `upi://pay?${params.toString()}`;
}

export function buildUpiQrImageUrl(upiPayUrl: string, size = 220): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(upiPayUrl)}`;
}

export function getAppBaseUrl(): string {
  const raw =
    getRuntimeEnv('NEXT_PUBLIC_APP_URL') ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000';
  return raw.replace(/\/$/, '');
}

export type PaymentFlowMode = 'razorpay_qr' | 'razorpay_checkout' | 'direct_upi';

/** Razorpay UPI QR enables automatic payment detection after scan. */
export function getPaymentFlowMode(): PaymentFlowMode {
  const forced = getRuntimeEnv('PAYMENT_MODE');
  if (isRazorpayConfigured()) {
    if (forced === 'razorpay_checkout') return 'razorpay_checkout';
    if (forced === 'direct_upi' && getRuntimeEnv('FORCE_DIRECT_UPI') === 'true') {
      return 'direct_upi';
    }
    return 'razorpay_qr';
  }
  return 'direct_upi';
}

/** @deprecated Use getPaymentFlowMode */
export function getPaymentMode(): 'razorpay' | 'direct_upi' {
  const flow = getPaymentFlowMode();
  if (flow === 'razorpay_checkout') return 'razorpay';
  if (flow === 'razorpay_qr') return 'razorpay';
  return 'direct_upi';
}
