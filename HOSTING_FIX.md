# Fix: OpenAI key set in Firebase but scan still fails

Your screenshot shows variables are set correctly in **Firebase App Hosting → Environment variables**. The app still fails because:

1. **A new rollout is required** — saving variables does not update the live site until you deploy again.
2. **The build must see the key** — `npm run build` now checks for `OPENAI_API_KEY` and fails if it is missing during build.

## Do this now (Firebase console)

1. Confirm these three variables exist for **All branches** (you already have them):

   | Variable | Value |
   |----------|--------|
   | `OPENAI_API_KEY` | full `sk-proj-...` key (no quotes, no spaces) |
   | `PAYMENT_TOKEN_SECRET` | any long random string |
   | `NEXT_PUBLIC_APP_URL` | `https://scan.tinyhands.co.in` |

2. **Push latest code** to GitHub (includes `apphosting.yaml`, build check, `/api/config-check`).

3. **Create a new rollout**:
   - Firebase console → **App Hosting** → your backend → **Rollouts**
   - Click **Create rollout** (or **Redeploy** latest commit)

4. Wait for build to finish. If build fails with `OPENAI_API_KEY is missing during build`, the variable is not visible to the build — re-save it in Environment variables and retry.

5. Verify:

   ```
   https://scan.tinyhands.co.in/api/config-check
   ```

   Expected:

   ```json
   { "openaiConfigured": true, "openaiEnvVarVisible": true }
   ```

6. Test scan on `/scan-preview` → **Analyze document**.

## Check which rollout is live

In Firebase → Rollouts → open the **live** rollout → scroll to **Environment variables in this build**. Confirm `OPENAI_API_KEY` is listed.

## Common mistakes

| Problem | Fix |
|---------|-----|
| Vars added after last deploy | New rollout |
| Key truncated when pasted | Re-paste full key |
| Extra `"` quotes around value | Store raw key only |
| Old code still live | Push + rollout latest commit |

## Reference

[Firebase App Hosting — environment variables](https://firebase.google.com/docs/app-hosting/configure)
