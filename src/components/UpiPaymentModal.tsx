'use client';

import Script from 'next/script';
import { useCallback, useEffect, useState } from 'react';

import { setExportAuth } from '@/lib/paymentAuth';

type PaymentCreateResponse = {
  mode: 'razorpay' | 'direct_upi';
  orderId: string;
  amount: number;
  currency: string;
  keyId: string | null;
  documentId: string;
  payeeName?: string;
  upiOpenUrl?: string;
  qrCodeUrl?: string;
  instructions?: string;
};

type RazorpayHandlerResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type Props = {
  open: boolean;
  documentId: string;
  documentTitle: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function UpiPaymentModal({
  open,
  documentId,
  documentTitle,
  onClose,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<PaymentCreateResponse | null>(null);
  const [utr, setUtr] = useState('');
  const [scriptReady, setScriptReady] = useState(false);

  const verifyPayment = useCallback(
    async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Verification failed');
      setExportAuth({
        token: data.token,
        documentId,
        orderId: data.orderId,
        expiresAt: data.expiresAt,
      });
      onSuccess();
      onClose();
    },
    [documentId, onClose, onSuccess]
  );

  const initPayment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });
      const data = (await res.json()) as PaymentCreateResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Could not start payment');
      setOrder(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    if (open) {
      setOrder(null);
      setUtr('');
      setError(null);
      void initPayment();
    }
  }, [open, initPayment]);

  const confirmDirectUpi = async () => {
    if (!order) return;
    setLoading(true);
    setError(null);
    try {
      await verifyPayment({
        documentId,
        orderId: order.orderId,
        mode: 'direct_upi',
        upiUtr: utr,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const openRazorpay = () => {
    if (!order || order.mode !== 'razorpay' || !order.keyId) return;
    if (!window.Razorpay) {
      setError('Razorpay is loading. Wait a moment and try again.');
      return;
    }
    const rzp = new window.Razorpay({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: 'Scan App',
      description: `Export: ${documentTitle}`,
      order_id: order.orderId,
      handler: async (response: RazorpayHandlerResponse) => {
        try {
          await verifyPayment({
            documentId,
            orderId: order.orderId,
            mode: 'razorpay',
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Verification failed');
        }
      },
      theme: { color: '#0d9488' },
      method: { upi: true, card: true, netbanking: true, wallet: true },
    });
    rzp.open();
  };

  if (!open) return null;

  const amountInr = order ? (order.amount / 100).toFixed(2) : '—';

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => setScriptReady(true)}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-slate-900">Pay to export</h2>
          <p className="mt-1 text-sm text-slate-600">{documentTitle}</p>

          {loading && !order && (
            <p className="mt-4 text-sm text-slate-500">Preparing payment…</p>
          )}

          {order && (
            <>
              <div className="mt-4 rounded-xl bg-teal-50 p-4 text-center">
                <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
                  Amount to pay
                </p>
                <p className="text-3xl font-bold text-teal-900">₹{amountInr}</p>
              </div>

              {order.mode === 'direct_upi' && (
                <div className="mt-4 space-y-4">
                  <p className="text-sm text-slate-600">
                    Complete payment in your UPI app (Google Pay, PhonePe, Paytm, etc.). Your
                    merchant UPI ID is not shown here for privacy.
                  </p>

                  {order.qrCodeUrl && (
                    <div className="flex flex-col items-center rounded-xl border border-slate-200 p-4">
                      <p className="mb-2 text-sm font-medium text-slate-700">Scan to pay</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={order.qrCodeUrl}
                        alt="Payment QR code"
                        width={220}
                        height={220}
                        className="rounded-lg"
                      />
                    </div>
                  )}

                  {order.upiOpenUrl && (
                    <a
                      href={order.upiOpenUrl}
                      className="flex w-full justify-center rounded-lg bg-teal-600 py-2.5 text-sm font-medium text-white hover:bg-teal-700"
                    >
                      Open UPI app
                    </a>
                  )}

                  {order.instructions && (
                    <p className="text-sm text-slate-500">{order.instructions}</p>
                  )}

                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">
                      Transaction reference / UTR (after payment)
                    </span>
                    <input
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      placeholder="From your UPI app receipt"
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                      inputMode="numeric"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => void confirmDirectUpi()}
                    disabled={loading || utr.replace(/\s/g, '').length < 8}
                    className="w-full rounded-lg bg-teal-600 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
                  >
                    {loading ? 'Verifying…' : 'I paid — unlock export'}
                  </button>
                </div>
              )}

              {order.mode === 'razorpay' && (
                <button
                  type="button"
                  onClick={openRazorpay}
                  disabled={!scriptReady || loading}
                  className="mt-4 w-full rounded-lg bg-teal-600 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-50"
                >
                  Pay with card / UPI / wallet
                </button>
              )}
            </>
          )}

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="mt-4 flex gap-2">
            {error && (
              <button
                type="button"
                onClick={() => void initPayment()}
                disabled={loading}
                className="flex-1 rounded-lg border border-teal-200 py-2 text-sm text-teal-800"
              >
                Retry
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
