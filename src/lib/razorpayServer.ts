import Razorpay from 'razorpay';

import { isRazorpayConfigured } from '@/lib/paymentConfig';

export function getRazorpayClient(): Razorpay {
  if (!isRazorpayConfigured()) {
    throw new Error('Razorpay is not configured');
  }
  return new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!.trim(),
    key_secret: process.env.RAZORPAY_KEY_SECRET!.trim(),
  });
}
