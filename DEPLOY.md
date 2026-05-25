# Deploying to production (e.g. https://scan.tinyhands.co.in)

`.env.local` is **not** uploaded when you deploy. Set these in your hosting panel (Vercel, Netlify, VPS, etc.) and **redeploy**.

## Required

| Variable | Example | Purpose |
|----------|---------|---------|
| `OPENAI_API_KEY` | `sk-proj-...` | AI document scan (server only) |
| `PAYMENT_TOKEN_SECRET` | long random string | Export unlock tokens after payment |
| `NEXT_PUBLIC_APP_URL` | `https://scan.tinyhands.co.in` | Stripe redirects / absolute URLs |

## UPI auto-confirm after QR scan (recommended)

Static UPI QR **cannot** detect payment automatically. Use **Razorpay**:

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_live_...` or `rzp_test_...` |
| `RAZORPAY_KEY_SECRET` | Secret from Razorpay dashboard |

With Razorpay set, the app uses a **Razorpay UPI QR** and polls every 2.5s. When payment is captured, users see **Payment successful** and the file downloads automatically.

Optional: `PAYMENT_MODE=direct_upi` and `FORCE_DIRECT_UPI=true` only if you must use a static UPI ID (manual UTR entry).

## Pricing

| Variable | Default |
|----------|---------|
| `EXPORT_PRICE_PAISE` | `1000` (= ₹10) |

## After adding variables

1. Save environment variables in the host dashboard.
2. Trigger a **new deploy** / restart the Node process.
3. Test scan on `/scan-preview` and export payment.

## Vercel

Project → **Settings** → **Environment Variables** → add `OPENAI_API_KEY` → **Production** → Redeploy.
