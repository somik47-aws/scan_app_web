import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

import {
  formatInr,
  getExportPriceInrPaise,
  getPaymentMode,
  MERCHANT_UPI_PAYEE_NAME,
} from '@/lib/paymentConfig';
import { createMockOrderId } from '@/lib/exportToken';
import { createUpiPaymentToken } from '@/lib/upiPaymentToken';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { documentId?: string };
    if (!body.documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 });
    }

    const amount = getExportPriceInrPaise();
    const mode = getPaymentMode();

    if (mode === 'razorpay') {
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!.trim();
      const keySecret = process.env.RAZORPAY_KEY_SECRET!.trim();
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const order = await razorpay.orders.create({
        amount,
        currency: 'INR',
        receipt: `export_${body.documentId.slice(0, 8)}_${Date.now()}`,
        notes: { documentId: body.documentId, purpose: 'document_export' },
      });

      return NextResponse.json({
        mode: 'razorpay',
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
        documentId: body.documentId,
      });
    }

    const directOrderId = createMockOrderId();
    const upiToken = createUpiPaymentToken(directOrderId, body.documentId, amount);

    return NextResponse.json({
      mode: 'direct_upi',
      orderId: directOrderId,
      amount,
      currency: 'INR',
      keyId: null,
      documentId: body.documentId,
      payeeName: MERCHANT_UPI_PAYEE_NAME,
      upiOpenUrl: `/api/payment/upi-open?t=${encodeURIComponent(upiToken)}`,
      qrCodeUrl: `/api/payment/upi-qr?t=${encodeURIComponent(upiToken)}`,
      instructions: `Pay ${formatInr(amount)} using the QR code or UPI app button, then enter your transaction reference (UTR) below.`,
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null && 'error' in err
          ? String((err as { error: unknown }).error)
          : 'Payment init failed';
    console.error('[payment/create]', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
