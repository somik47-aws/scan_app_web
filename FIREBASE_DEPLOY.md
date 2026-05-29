# Firebase App Hosting — fix “OpenAI API key is not configured”

You use **Firebase App Hosting** (Environment variables under Hosting). Variables added only in the console are sometimes **not passed to the running server** unless they are also declared for **RUNTIME** in `apphosting.yaml`.

## Step 1 — Store secrets (required)

Console plain-text variables are not enough when using `apphosting.yaml` with `secret:` references. Create secrets:

```bash
source ~/.nvm/nvm.sh   # if firebase: command not found
npm install -g firebase-tools
firebase --version

firebase login
cd /Users/shrutimitra/Documents/projects/scan_app_web
```

**Important:** use two **different** values:

```bash
# 1) OpenAI key (starts with sk-proj-...)
firebase apphosting:secrets:set OPENAI_API_KEY

# 2) Random signing secret (NOT your OpenAI key). Example:
openssl rand -hex 32
firebase apphosting:secrets:set PAYMENT_TOKEN_SECRET
# Paste the openssl output when prompted
```

Do **not** pass the secret on the same line as the command — the CLI will prompt you interactively.

Grant your backend access (replace `BACKEND_ID` — find it in Firebase → App Hosting → your backend URL/settings):

```bash
firebase apphosting:secrets:grantaccess OPENAI_API_KEY --backend BACKEND_ID
firebase apphosting:secrets:grantaccess PAYMENT_TOKEN_SECRET --backend BACKEND_ID
```

## Step 2 — Commit and redeploy

Push `apphosting.yaml` to Git and trigger a **new rollout** in Firebase App Hosting (not just saving console vars).

## Step 3 — Verify

Open:

**https://scan.tinyhands.co.in/api/config-check**

Expected:

```json
{
  "openaiConfigured": true,
  "razorpayConfigured": false,
  "hint": "OpenAI is configured correctly."
}
```

If `openaiConfigured` is still `false`, the rollout did not pick up secrets — repeat Step 1–2.

## Console variables (what you already did)

Keep these in Firebase **Hosting → Environment variables** as well (optional duplicate):

| Variable | Value |
|----------|--------|
| `OPENAI_API_KEY` | sk-proj-... |
| `PAYMENT_TOKEN_SECRET` | random secret |
| `NEXT_PUBLIC_APP_URL` | https://scan.tinyhands.co.in |

After any change: **create a new deployment / rollout**.

## Reference

[Configure App Hosting backends](https://firebase.google.com/docs/app-hosting/configure)
