# Deploying to production (e.g. https://scan.tinyhands.co.in)

**Using Firebase App Hosting?** Read **[FIREBASE_DEPLOY.md](./FIREBASE_DEPLOY.md)** first — console env vars alone often fail for `/api/scan`.

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

## Vercel (for scan.tinyhands.co.in)

1. Open [vercel.com](https://vercel.com) → your **scan_app_web** project.
2. **Settings** → **Environment Variables**.
3. Add:

   | Key | Value | Environments |
   |-----|--------|----------------|
   | `OPENAI_API_KEY` | `sk-proj-...` (full key, no quotes) | **Production** (and Preview if you test previews) |
   | `PAYMENT_TOKEN_SECRET` | random string (`openssl rand -hex 32`) | Production |
   | `NEXT_PUBLIC_APP_URL` | `https://scan.tinyhands.co.in` | Production |

4. Click **Save**.
5. **Deployments** tab → ⋮ on latest deployment → **Redeploy** (required — env vars are not applied to old builds until redeploy).

### Verify

Open: `https://scan.tinyhands.co.in/api/config-check`

You should see:

```json
{ "openaiConfigured": true, ... }
```

If `openaiConfigured` is `false`, the key is missing, misspelled, or the site was not redeployed after adding it.

### Common mistakes

- Variable named `OPENAI_API_KEY ` (trailing space) or `OpenAI_API_KEY` (wrong case — must be exact).
- Value wrapped in extra quotes: use `sk-proj-abc...` not `"sk-proj-abc..."`.
- Added only to **Development** in Vercel, not **Production**.
- Forgot to **Redeploy** after saving variables.
