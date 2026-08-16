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

## Cloudflare setup

1. In Cloudflare Web Analytics, add `lingguanghealth.com`.
   - If the hostname is proxied through Cloudflare, automatic beacon injection can be enabled.
   - If it is not proxied, install Cloudflare's generated Web Analytics snippet in the public site's HTML/site-builder settings.
2. Create a dedicated minimum-permission API token for analytics read access.
3. From this `pulse/` directory, store secrets with Wrangler:
   - `wrangler secret put CF_ANALYTICS_TOKEN`
   - `wrangler secret put CF_ACCOUNT_ID`
4. Deploy with `npm run deploy`.
5. Confirm `https://pulse.lingguanghealth.com/health` returns a healthy, read-only response.
6. Protect `pulse.lingguanghealth.com` with Cloudflare Access before routine use.
7. Verify 1 / 7 / 30 day dashboard ranges.

## Security

- `CF_ANALYTICS_TOKEN` and `CF_ACCOUNT_ID` are Worker secrets.
- The dashboard sends `noindex`, `nofollow`, and `noarchive` headers/meta.
- The dashboard is not intended for public navigation or the sitemap.
- Cloudflare Access is the authentication boundary.
- No write methods are implemented for analytics.
