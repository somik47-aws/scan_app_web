import { NextRequest, NextResponse } from 'next/server';

import {
  formatInr,
  getExportPriceInrPaise,
  getPaymentFlowMode,
  MERCHANT_UPI_PAYEE_NAME,
} from '@/lib/paymentConfig';
import { createMockOrderId } from '@/lib/exportToken';
import { getRazorpayClient } from '@/lib/razorpayServer';
import { createUpiPaymentToken } from '@/lib/upiPaymentToken';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { documentId?: string };
    if (!body.documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 });
    }

    const amount = getExportPriceInrPaise();
    const flow = getPaymentFlowMode();

    if (flow === 'razorpay_qr') {
      const razorpay = getRazorpayClient();
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!.trim();

      const order = await razorpay.orders.create({
        amount,
        currency: 'INR',
        receipt: `export_${body.documentId.slice(0, 8)}_${Date.now()}`,
        notes: { documentId: body.documentId, purpose: 'document_export' },
      });

      const qr = await razorpay.qrCode.create({
        type: 'upi_qr',
        name: 'Scan App Export',
        usage: 'single_use',
        fixed_amount: true,
        payment_amount: amount,
        description: `Export: ${body.documentId.slice(0, 8)}`,
        notes: {
          documentId: body.documentId,
          orderId: order.id,
        },
        close_by: Math.floor(Date.now() / 1000) + 30 * 60,
      });

      return NextResponse.json({
        mode: 'razorpay_qr',
        orderId: order.id,
        qrCodeId: qr.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
        documentId: body.documentId,
        qrCodeUrl: qr.image_url,
        autoPoll: true,
        instructions: `Pay ${formatInr(amount)} by scanning the QR. Download unlocks automatically when payment is received.`,
      });
    }

    if (flow === 'razorpay_checkout') {
      const razorpay = getRazorpayClient();
      const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!.trim();
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
        autoPoll: false,
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
      autoPoll: false,
      instructions: `Pay ${formatInr(amount)} using the QR code. For automatic confirmation, add Razorpay keys (see DEPLOY.md).`,
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
