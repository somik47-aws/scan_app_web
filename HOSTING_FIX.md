# Fix: config-check shows openaiConfigured false

Your `/api/config-check` showed:

```json
"knownEnvKeys": [],
"openaiEnvVarVisible": false
```

That means **Firebase is not passing console env vars to the running server** (Cloud Run). This is a known App Hosting quirk.

## Fix (implemented in code)

During **build**, Firebase *does* have your env vars. The build now:

1. Writes `env.baked.json` from `OPENAI_API_KEY`, `PAYMENT_TOKEN_SECRET`, etc.
2. Copies it into the standalone server bundle
3. At **runtime**, the app reads `env.baked.json` if `process.env` is empty

## What you must do

1. **Push latest code** to GitHub (includes this fix).
2. Confirm **Environment variables** in Firebase still has `OPENAI_API_KEY` (All branches).
3. **Create a new rollout** in Firebase App Hosting.
4. Wait for build — it will **fail** if `OPENAI_API_KEY` is missing at build time (good).
5. Open: https://scan.tinyhands.co.in/api/config-check

Expected after deploy:

```json
{
  "openaiConfigured": true,
  "bakedEnvAvailable": true,
  "knownEnvKeys": ["OPENAI_API_KEY", "PAYMENT_TOKEN_SECRET", "NEXT_PUBLIC_APP_URL"],
  "hint": "OpenAI is configured correctly."
}
```

6. Test **Analyze document** on `/scan-preview`.

## If build fails on Firebase

Build log will say `OPENAI_API_KEY missing during build`. Re-save the key in Environment variables (full `sk-proj-...`, no quotes) and rollout again.

## Reference

[Firebase App Hosting environment variables](https://firebase.google.com/docs/app-hosting/configure)
