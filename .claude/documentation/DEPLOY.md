# Deploy Guide
> Vercel + Neon + Sanity + Cloudflare + Razorpay. Bootstrap: ../CLAUDE.md

## §0 Environments

| Env | Branch | Database | Sanity dataset | Razorpay | Purpose |
|---|---|---|---|---|---|
| Production | `main` | Neon `main` | `production` | live keys | Live site |
| Staging | `develop` | Neon branch `staging` | `staging` | test keys | Client UAT |
| Preview | any PR | Neon branch per PR | `staging` | test keys | Review |

The production Sanity dataset is **never** written to from a preview deploy. Preview deploys read
`staging`.

## §1 Account setup order

1. **Neon** — project, then a `staging` branch. Copy `DATABASE_URL` (pooled) per environment.
2. **Sanity** — project + `production` and `staging` datasets. Create a read token and a webhook
   secret. CORS-allow the Vercel preview and production domains.
3. **Cloudflare** — Stream (get account ID, API token, and a signing key pair) and R2 (bucket +
   access keys). Stream signing key PEM goes in the env as a single line with `\n` escapes.
4. **Razorpay** — sandbox first. **Live activation requires live Terms and Refund Policy pages**
   (task P3-05). Set the webhook URL to `https://<domain>/api/webhooks/razorpay`, subscribe to
   `payment.captured`, and copy the webhook secret.
5. **Resend** — verify the sending domain. Without verification, mail lands in spam.
6. **Upstash Redis** — one database, REST URL + token.
7. **Cloudflare Turnstile** — site key + secret for the lead forms.
8. **Plausible** — add the domain. No cookie banner needed.

## §2 Environment variables

```
DATABASE_URL=
NEXTAUTH_SECRET=            # openssl rand -base64 32
NEXTAUTH_URL=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=
SANITY_API_READ_TOKEN=
SANITY_WEBHOOK_SECRET=

CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_STREAM_TOKEN=
CLOUDFLARE_STREAM_SIGNING_KEY_ID=
CLOUDFLARE_STREAM_SIGNING_KEY_PEM=
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

RESEND_API_KEY=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

YOUTUBE_API_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
NEXT_PUBLIC_WHATSAPP_NUMBER=
NEXT_PUBLIC_SITE_URL=
```

`.env` is gitignored. `.env.example` is committed with every key present and every value blank.

## §3 Known deploy traps

- **PDF routes on Edge fail.** `@react-pdf/renderer` needs Node. Declare
  `export const runtime = 'nodejs'` on `/api/certificate/issue` and the invoice route.
- **Razorpay HMAC breaks if you parse the body first.** Use `req.text()`, hash that, then
  `JSON.parse`. This is the single most common webhook bug.
- **Prisma in edge middleware fails at build time.** Middleware does session checks only.
- **Sanity webhook must be re-pointed per environment.** A staging webhook hitting production
  revalidates the wrong cache.
- **Neon pooled vs direct URL.** Prisma migrations need the **direct** URL; the app uses the
  **pooled** one. Getting this backwards produces connection-limit errors under load.
- **Stream signing key newlines.** Store the PEM with literal `\n` and `.replace(/\\n/g, '\n')`
  on read, or signing silently fails.

## §4 Pre-launch checklist

- [ ] Forbidden-claim grep clean on the **production build**, not just source
- [ ] Razorpay switched to live keys; a real ₹1 transaction tested and refunded
- [ ] Webhook reachable in production (check Razorpay's delivery log, not just a local tunnel)
- [ ] Sanity production dataset populated; staging webhook not pointing at production
- [ ] `sitemap.xml` and `robots.txt` return 200 and list the real routes
- [ ] Google Search Console verified, sitemap submitted
- [ ] Google Business Profile claimed
- [ ] Lighthouse ≥90 mobile on `/`, `/posh-act`, `/courses/[slug]`
- [ ] axe-core clean on all public routes
- [ ] Legal pages live and linked in the footer
- [ ] A test certificate issued, downloaded, and verified at `/verify/[certId]`
- [ ] Client has the Sanity editing guide and a Studio login
