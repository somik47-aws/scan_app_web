import { NextRequest, NextResponse } from 'next/server';

import { buildUpiPayUrl, buildUpiQrImageUrl } from '@/lib/paymentConfig';
import { verifyUpiPaymentToken } from '@/lib/upiPaymentToken';

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get('t');
  if (!token) {
    return NextResponse.json({ error: 'Invalid QR' }, { status: 400 });
  }

  const payload = verifyUpiPaymentToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'QR expired' }, { status: 410 });
  }

  const upiUrl = buildUpiPayUrl({
    amountPaise: payload.amountPaise,
    transactionNote: `Scan export ${payload.documentId.slice(0, 8)}`,
    transactionRef: payload.orderId,
  });

  return NextResponse.redirect(buildUpiQrImageUrl(upiUrl));
}
