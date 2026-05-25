# Scan App Web

Web version of the document scanner mobile app. Scan uploads, AI analysis (OpenAI Vision), rich-text editing, PIN-locked documents, and **UPI-gated export/download**.

## Features

- **Dashboard** — upload/capture images, view recent scans
- **AI scan** — multilingual OCR and structured output (passport, invoice, receipt, etc.)
- **Editor** — edit title and rich HTML body
- **History** — search, PIN lock/unlock, export
- **Export** — PDF, DOCX, HTML, TXT, MD, JSON, CSV, JPG, PNG
- **UPI payment** — required before export/download (Razorpay or demo mock flow)

## Setup

```bash
cd scan_app_web
cp .env.example .env.local
# Add OPENAI_API_KEY (required for scanning)
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Production:** See [DEPLOY.md](./DEPLOY.md) — set `OPENAI_API_KEY` on your host (Vercel, etc.), not only in `.env.local`.

## UPI / payments

### Direct UPI (default)

Set in `.env.local`:

```env
PAYMENT_MODE=direct_upi
MERCHANT_UPI_VPA=your-id@upi
```

Users pay via **QR scan** or **Open UPI app** — your UPI ID is **not shown** in the app (only on the server). After paying, they enter the **UTR / UPI reference** to unlock export for 30 minutes.

**Important:** Do not leave placeholder Razorpay keys (`rzp_test_...`) in `.env.local` — that breaks payment init. Remove them or use real keys with `PAYMENT_MODE=razorpay`.

### Razorpay (optional)

For automatic payment verification, use [Razorpay](https://razorpay.com) with `PAYMENT_MODE=razorpay` and valid `NEXT_PUBLIC_RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.

Price: `EXPORT_PRICE_PAISE` (default `1000` = ₹10).

## Security notes

- Keep `OPENAI_API_KEY` and `RAZORPAY_KEY_SECRET` on the server only (`.env.local`, never commit).
- Rotate any API key that was shared in chat or logs.
- Mock UPI must be disabled in production (`ALLOW_MOCK_UPI=false`).

## Related project

Mobile app: `../scan_app` (Expo React Native).
