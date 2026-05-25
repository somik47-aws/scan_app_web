'use client';

import Script from 'next/script';
import { useCallback, useEffect, useRef, useState } from 'react';

import { setExportAuth } from '@/lib/paymentAuth';

type PaymentCreateResponse = {
  mode: 'razorpay' | 'razorpay_qr' | 'direct_upi';
  orderId: string;
  qrCodeId?: string;
  amount: number;
  currency: string;
  keyId: string | null;
  documentId: string;
  payeeName?: string;
  upiOpenUrl?: string;
  qrCodeUrl?: string;
  instructions?: string;
  autoPoll?: boolean;
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
  const [showManualUtr, setShowManualUtr] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(false);
  const [polling, setPolling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setPolling(false);
  }, []);

  const completePayment = useCallback(
    (token: string, orderId: string, expiresAt: number) => {
      setExportAuth({ token, documentId, orderId, expiresAt });
      setPaidSuccess(true);
      stopPolling();
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1800);
    },
    [documentId, onClose, onSuccess, stopPolling]
  );

  const verifyPayment = useCallback(
    async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Verification failed');
      completePayment(data.token, data.orderId, data.expiresAt);
    },
    [completePayment]
  );

  const checkPaymentStatus = useCallback(
    async (current: PaymentCreateResponse) => {
      const params = new URLSearchParams({
        documentId,
        orderId: current.orderId,
      });
      if (current.qrCodeId) params.set('qrCodeId', current.qrCodeId);

      const res = await fetch(`/api/payment/status?${params}`);
      const data = await res.json();
      if (data.paid && data.token) {
        completePayment(data.token, data.orderId, data.expiresAt);
        return true;
      }
      return false;
    },
    [documentId, completePayment]
  );

  const startPolling = useCallback(
    (current: PaymentCreateResponse) => {
      stopPolling();
      setPolling(true);
      void checkPaymentStatus(current);
      pollRef.current = setInterval(() => {
        void checkPaymentStatus(current);
      }, 2500);
    },
    [checkPaymentStatus, stopPolling]
  );

  const initPayment = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPaidSuccess(false);
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId }),
      });
      const data = (await res.json()) as PaymentCreateResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Could not start payment');
      setOrder(data);
      if (data.autoPoll && data.mode === 'razorpay_qr') {
        startPolling(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [documentId, startPolling]);

  useEffect(() => {
    if (open) {
      setOrder(null);
      setUtr('');
      setShowManualUtr(false);
      setError(null);
      setPaidSuccess(false);
      void initPayment();
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [open, initPayment, stopPolling]);

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

  if (paidSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-3xl text-teal-700">
            ✓
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">Payment successful</h2>
          <p className="mt-2 text-sm text-slate-600">Your download is starting…</p>
        </div>
      </div>
    );
  }

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

              {(order.mode === 'direct_upi' || order.mode === 'razorpay_qr') && order.qrCodeUrl && (
                <div className="mt-4 space-y-4">
                  {order.mode === 'razorpay_qr' && (
                    <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-900">
                      {polling
                        ? 'Waiting for payment… Download unlocks automatically after UPI payment.'
                        : 'Scan the QR and pay with any UPI app.'}
                    </p>
                  )}

                  {order.mode === 'direct_upi' && (
                    <p className="text-sm text-slate-600">
                      Scan the QR or open your UPI app. For automatic unlock, configure Razorpay
                      on the server.
                    </p>
                  )}

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
                    {polling && (
                      <p className="mt-3 flex items-center gap-2 text-sm text-teal-700">
                        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-teal-600" />
                        Checking payment status…
                      </p>
                    )}
                  </div>

                  {order.upiOpenUrl && order.mode === 'direct_upi' && (
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

                  {order.mode === 'direct_upi' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowManualUtr((v) => !v)}
                        className="text-sm text-teal-700 underline"
                      >
                        {showManualUtr ? 'Hide manual confirmation' : 'Paid? Enter UTR manually'}
                      </button>
                      {showManualUtr && (
                        <>
                          <label className="block">
                            <span className="text-sm font-medium text-slate-700">UTR / reference</span>
                            <input
                              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                              placeholder="From UPI receipt"
                              value={utr}
                              onChange={(e) => setUtr(e.target.value)}
                              inputMode="numeric"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => void confirmDirectUpi()}
                            disabled={loading || utr.replace(/\s/g, '').length < 8}
                            className="w-full rounded-lg border border-teal-600 py-2.5 text-sm font-medium text-teal-800 hover:bg-teal-50 disabled:opacity-50"
                          >
                            Confirm payment
                          </button>
                        </>
                      )}
                    </>
                  )}
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
