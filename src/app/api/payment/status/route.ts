import { NextRequest, NextResponse } from 'next/server';

import { getExportPriceInrPaise, isRazorpayConfigured } from '@/lib/paymentConfig';
import { createExportToken } from '@/lib/exportToken';
import { getRazorpayClient } from '@/lib/razorpayServer';

type RazorpayPayment = {
  id: string;
  status: string;
  amount: number;
  order_id?: string;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const orderId = searchParams.get('orderId');
    const qrCodeId = searchParams.get('qrCodeId');

    if (!documentId || !orderId) {
      return NextResponse.json({ error: 'documentId and orderId required' }, { status: 400 });
    }

    if (!isRazorpayConfigured()) {
      return NextResponse.json({ paid: false, reason: 'razorpay_not_configured' });
    }

    const razorpay = getRazorpayClient();
    const expectedAmount = getExportPriceInrPaise();

    let payments: RazorpayPayment[] = [];

    if (qrCodeId) {
      const qrPayments = await razorpay.qrCode.fetchAllPayments(qrCodeId, { count: 10 });
      payments = (qrPayments.items ?? []) as RazorpayPayment[];
    } else {
      const orderPayments = await razorpay.orders.fetchPayments(orderId);
      payments = (orderPayments.items ?? []) as RazorpayPayment[];
    }

    const captured = payments.find(
      (p) => p.status === 'captured' && Number(p.amount) >= expectedAmount
    );

    if (!captured) {
      return NextResponse.json({ paid: false });
    }

    const { token, expiresAt } = createExportToken(documentId, orderId);

    return NextResponse.json({
      paid: true,
      paymentId: captured.id,
      token,
      expiresAt,
      orderId,
    });
  } catch (err) {
    console.error('[payment/status]', err);
    return NextResponse.json({ paid: false, error: 'status_check_failed' });
  }
}
