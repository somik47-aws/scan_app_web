import { createHmac } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

import { isRazorpayConfigured } from '@/lib/paymentConfig';
import { createExportToken, verifyExportToken } from '@/lib/exportToken';

function isDirectUpiOrder(orderId: string, mode?: string): boolean {
  return mode === 'direct_upi' || mode === 'mock' || orderId.startsWith('mock_order_');
}

function normalizeUtr(utr: string): string {
  return utr.replace(/\s/g, '').toUpperCase();
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      documentId?: string;
      orderId?: string;
      mode?: 'razorpay' | 'direct_upi' | 'mock';
      razorpay_payment_id?: string;
      razorpay_order_id?: string;
      razorpay_signature?: string;
      upiUtr?: string;
      mockUtr?: string;
    };

    if (!body.documentId || !body.orderId) {
      return NextResponse.json({ error: 'documentId and orderId required' }, { status: 400 });
    }

    if (isDirectUpiOrder(body.orderId, body.mode)) {
      const utr = normalizeUtr(body.upiUtr ?? body.mockUtr ?? '');
      if (utr.length < 8) {
        return NextResponse.json(
          {
            error:
              'Enter your UPI transaction reference (UTR / UPI Ref No.) from your payment app — usually 12 digits.',
          },
          { status: 400 }
        );
      }

      const { token, expiresAt } = createExportToken(body.documentId, body.orderId);
      return NextResponse.json({
        verified: true,
        token,
        expiresAt,
        orderId: body.orderId,
        upiUtr: utr,
      });
    }

    if (!isRazorpayConfigured()) {
      return NextResponse.json({ error: 'Razorpay is not configured' }, { status: 503 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET!.trim();
    if (!body.razorpay_payment_id || !body.razorpay_order_id || !body.razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment verification payload' }, { status: 400 });
    }

    const sign = `${body.razorpay_order_id}|${body.razorpay_payment_id}`;
    const expected = createHmac('sha256', secret).update(sign).digest('hex');

    if (expected !== body.razorpay_signature) {
      return NextResponse.json({ error: 'Payment signature mismatch' }, { status: 400 });
    }

    if (body.razorpay_order_id !== body.orderId) {
      return NextResponse.json({ error: 'Order ID mismatch' }, { status: 400 });
    }

    const { token, expiresAt } = createExportToken(body.documentId, body.orderId);
    return NextResponse.json({
      verified: true,
      token,
      expiresAt,
      orderId: body.orderId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const documentId = searchParams.get('documentId');
  const orderId = searchParams.get('orderId');

  if (!token || !documentId || !orderId) {
    return NextResponse.json({ valid: false }, { status: 400 });
  }

  return NextResponse.json({
    valid: verifyExportToken(token, documentId, orderId),
  });
}
