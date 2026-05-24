# Payment setup — what to provide

Export download costs **₹10** (India) or about **$0.12** (international via Stripe).

## Already configured (no extra details)

| Method | Status |
|--------|--------|
| **Direct UPI** | Uses `9481657016@upi` — money goes to this UPI ID |

---

## 1. Razorpay — Indian cards, netbanking, wallets, UPI (gateway)

Sign up: [https://razorpay.com](https://razorpay.com)

**You will need to complete KYC and add a settlement bank account** (Indian bank account in your name or business name).

**Send / add in `.env.local`:**

| Variable | Example | Where to find |
|----------|---------|----------------|
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_live_xxxxxxxx` | Dashboard → Settings → API Keys |
| `RAZORPAY_KEY_SECRET` | `xxxxxxxx` | Same page (keep secret) |

**Business details Razorpay typically asks for:**

- Legal name (individual or company)
- PAN
- Indian bank account (account number, IFSC)
- Registered address
- Phone & email
- Website URL (can use your deployed app URL)

**Optional:** Webhook URL for automatic payment confirmation (we can add later).

---

## 2. Stripe — international cards (Visa, Mastercard, Amex)

Sign up: [https://stripe.com](https://stripe.com)

Works for customers paying from **outside India** in USD (and many other currencies if enabled).

**Send / add in `.env.local`:**

| Variable | Example | Where to find |
|----------|---------|----------------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` or `pk_test_...` | Developers → API keys |
| `STRIPE_SECRET_KEY` | `sk_live_...` or `sk_test_...` | Same (secret) |

**Details Stripe typically asks for:**

- Full name
- Date of birth
- Country of residence
- Bank account for payouts (supports many countries)
- Business type (individual / company)
- Website or product description
- Tax ID where applicable (SSN, GSTIN, etc.)

**Optional (recommended for production):**

| Variable | Purpose |
|----------|---------|
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` from Stripe webhooks |

---

## 3. Direct UPI (current) — optional updates

Only if you change receiving UPI:

| Variable | Current |
|----------|---------|
| `MERCHANT_UPI_VPA` | `9481657016@upi` |
| `MERCHANT_UPI_PAYEE_NAME` | `Scan App` |

---

## 4. Pricing (optional)

| Variable | Default | Meaning |
|----------|---------|---------|
| `EXPORT_PRICE_PAISE` | `1000` | ₹10.00 |
| `EXPORT_PRICE_USD_CENTS` | `12` | $0.12 |

---

## 5. App URL (for Stripe redirects)

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` |

Use your real domain in production (not `localhost`).

---

## Quick checklist — paste what you have

Reply with any of these when ready (never post secrets in public chats; use `.env.local` locally):

```
[ ] Razorpay Key ID: rzp_test_... or rzp_live_...
[ ] Razorpay Secret: (in .env.local only)
[ ] Stripe Publishable: pk_test_... or pk_live_...
[ ] Stripe Secret: (in .env.local only)
[ ] Settlement bank IFSC + last 4 digits (for your reference)
[ ] Business/legal name for receipts
[ ] Production website URL
```

After you add keys, restart the dev server: `npm run dev`.
