# LINGGUANG Pulse V0.1

Private, read-only traffic dashboard for the public website `lingguanghealth.com`.

## What it shows

- 1 / 7 / 30 day views
- Page views and Cloudflare visit metric
- Pages per visit
- Daily trend
- Top public pages
- Countries
- Browsers and device types
- Referrers
- Outside-Canada traffic as a simple geographic signal

## Privacy boundary

LINGGUANG Pulse is for **public website traffic only**.

It must not collect, query, display, infer, or store:

- patient names or identities
- contact-form contents
- assessment answers
- clinical notes or records
- appointment details
- diagnosis or treatment information
- Health OS authenticated application data
- IP addresses or visitor-level profiles

Cloudflare Web Analytics is used as the source. The dashboard performs read-only aggregate queries and does not expose the API token to browser code.

## Staged Cloudflare setup

The current Cloudflare account does not yet have `lingguanghealth.com` as an active zone, so V0.1 deliberately deploys first to the Worker's `workers.dev` address. This avoids changing the live website's DNS just to get analytics working.

1. In Cloudflare Web Analytics, add `lingguanghealth.com` as a site.
2. Since the public site is currently hosted outside Cloudflare, copy Cloudflare's generated Web Analytics snippet into the public site's site-builder/custom-code settings before the closing body tag.
3. Create a dedicated minimum-permission API token for analytics read access.
4. From this `pulse/` directory, store secrets with Wrangler:
   - `wrangler secret put CF_ANALYTICS_TOKEN`
   - `wrangler secret put CF_ACCOUNT_ID`
5. Deploy with `npm run deploy`. The initial address will be the `lingguang-pulse.<account-subdomain>.workers.dev` URL assigned by Cloudflare.
6. Confirm `/health` returns a healthy, read-only response.
7. In the Worker settings, enable Cloudflare Access for the `workers.dev` route and restrict access to the approved owner email(s).
8. Verify 1 / 7 / 30 day dashboard ranges.

## Later branded URL

A branded `pulse.lingguanghealth.com` Worker custom domain requires `lingguanghealth.com` to be an active Cloudflare zone. Do not change nameservers only for Pulse. If the domain is intentionally onboarded to Cloudflare later, preserve all existing website and mail DNS records first, then the Worker can be moved from `workers.dev` to `pulse.lingguanghealth.com`.

## Security

- `CF_ANALYTICS_TOKEN` and `CF_ACCOUNT_ID` are Worker secrets.
- The dashboard sends `noindex`, `nofollow`, and `noarchive` headers/meta.
- The dashboard is not intended for public navigation or the sitemap.
- Cloudflare Access is the authentication boundary.
- No write methods are implemented for analytics.
