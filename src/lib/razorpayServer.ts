import Razorpay from 'razorpay';

import { isRazorpayConfigured } from '@/lib/paymentConfig';
import { getRuntimeEnv } from '@/lib/runtimeEnv';

export function getRazorpayClient(): Razorpay {
  if (!isRazorpayConfigured()) {
    throw new Error('Razorpay is not configured');
  }
  return new Razorpay({
    key_id: getRuntimeEnv('NEXT_PUBLIC_RAZORPAY_KEY_ID')!,
    key_secret: getRuntimeEnv('RAZORPAY_KEY_SECRET')!,
  });
}
