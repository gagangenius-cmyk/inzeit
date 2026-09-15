# Meta Lead Ads → CRM Integration

## Overview

This integration captures leads from Facebook/Meta Lead Ads in real time, enriches them with full lead details from the Meta Graph API, maps custom form fields to CRM payload fields, and delivers them to the configured CRM endpoint (`https://cmgone.org/api/web-to-leads`).

## Architecture Flow

```
Meta Lead Form submitted
        ↓
Meta sends Webhook POST → /api/webhooks/meta
        ↓
HMAC-SHA256 signature validated
        ↓
Raw event stored in dm_meta_webhook_events (HTTP 200 returned immediately)
        ↓
Async processor: fetch full lead from Meta Graph API
        ↓
Parse field_data, apply field mappings from dm_meta_lead_mappings
        ↓
Build normalized CRM payload
        ↓
POST to https://cmgone.org/api/web-to-leads
        ↓
Store delivery result in dm_meta_lead_deliveries
        ↓
On failure → schedule retry with exponential backoff
        ↓
Cron: /api/cron/meta-leads-retry retries pending deliveries every 5 min
```

## Database Tables

Run the migration before using the integration:

```bash
mysql -u <user> -p <database> < migrations/20260628_meta_leads_integration.sql
```

Tables created:
- `dm_meta_settings` — integration configuration (one row)
- `dm_meta_webhook_events` — raw incoming webhook events (queue)
- `dm_meta_leads` — normalized lead records with raw + mapped data
- `dm_meta_lead_mappings` — field mapping rules (global / campaign / form)
- `dm_meta_lead_deliveries` — CRM delivery attempts with retry state
- `dm_meta_campaign_cache` — cached campaign data from Meta Marketing API

## Required Environment Variables

Copy `.env.example` and fill in:

| Variable | Description |
|---|---|
| `META_APP_ID` | Your Meta App ID |
| `META_APP_SECRET` | Your Meta App Secret (used for HMAC signature validation) |
| `META_WEBHOOK_VERIFY_TOKEN` | A random string you choose; must match Meta webhook config |
| `META_PAGE_ACCESS_TOKEN` | Long-lived Page Access Token for fetching lead details |
| `META_PAGE_ID` | Facebook Page ID |
| `META_AD_ACCOUNT_ID` | Ad Account ID (without `act_` prefix) |
| `META_GRAPH_API_VERSION` | e.g. `v21.0` |
| `META_LEADS_CRM_ENDPOINT` | `https://cmgone.org/api/web-to-leads` |
| `META_INTEGRATION_ENABLED` | `true` or `false` |
| `CRON_SECRET` | Random secret to protect cron endpoints |

## Meta App Setup

### 1. Create a Meta App
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click **My Apps → Create App**
3. Choose **Business** type
4. Complete the form

### 2. Required Permissions
Your app needs these permissions (request via App Review for production):
- `ads_management`
- `ads_read`
- `leads_retrieval`
- `pages_show_list`
- `pages_read_engagement`

### 3. Configure Webhooks
1. In your app dashboard go to **Webhooks → Page**
2. Set Callback URL: `https://your-domain.com/api/webhooks/meta`
3. Set Verify Token: the value you put in `META_WEBHOOK_VERIFY_TOKEN`
4. Subscribe to the **`leadgen`** field
5. Click **Verify and Save**

### 4. Subscribe your Facebook Page
1. In **Webhooks**, find your subscribed page
2. Or via API:
```bash
curl -X POST "https://graph.facebook.com/v21.0/{PAGE_ID}/subscribed_apps" \
  -d "subscribed_fields=leadgen" \
  -d "access_token={PAGE_ACCESS_TOKEN}"
```

### 5. Generate a Long-Lived Page Access Token
Short-lived user tokens expire in 1 hour. For production you need a never-expiring Page token:

```bash
# Step 1: Get a long-lived user token (60 days)
curl "https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={SHORT_USER_TOKEN}"

# Step 2: Get page tokens (these never expire)
curl "https://graph.facebook.com/me/accounts?access_token={LONG_LIVED_USER_TOKEN}"
```

Use the `access_token` from the response for your page as `META_PAGE_ACCESS_TOKEN`.

### 6. Assign Page / Ad Account to App
1. In **Meta Business Manager → Business Settings → Accounts → Pages**
2. Add your page and grant **Manage Page** permission to your app
3. Similarly for **Ad Accounts → Assign Assets**

## Admin Panel

Access via sidebar **Meta Lead Ads** section (visible to admins and marketing managers):

| Route | Description |
|---|---|
| `/admin/meta-leads` | Dashboard with stats and recent activity |
| `/admin/meta-leads/leads` | All captured leads with filters and detail drawer |
| `/admin/meta-leads/campaigns` | Cached campaign data from Meta |
| `/admin/meta-leads/mappings` | Field mapping configuration |
| `/admin/meta-leads/settings` | Integration settings + connection tests |
| `/admin/meta-leads/logs` | CRM delivery attempt log |

## Field Mapping System

Mapping priority (highest wins): **Form** > **Campaign** > **Global**

### Default Global Mappings (seeded automatically)

| Meta Field | CRM Field | Notes |
|---|---|---|
| `full_name` | `lastName` | Constructed from first+last if full_name missing |
| `email` | `email` | |
| `phone_number` | `phone` | |
| `age_range` | `AgeRange` | |
| `immigration_type` | `ImmigrationType` | Custom question label |
| `country` | `ResidentCountry` | |
| `education` | `Education` | Custom question label |
| `destination_country` | `DestinationCountry` | Custom question label |
| `__utm_source` | `UTMSource` | Fallback: "Facebook Lead Ads" |
| `__lead_source` | `LeadSource` | Fallback: "Facebook Lead Ads" |
| `__roundrobin` | `roundrobin` | Fallback: "true" |

### Custom Question Mapping
When your Meta lead form has a custom question like "Preferred Destination", map it by entering the exact question label as the **Meta Field Key**:
- Meta Field Key: `Preferred Destination`
- CRM Field Key: `DestinationCountry`
- Fallback: `Canada`

### Campaign-Level Defaults
To set a default Branch for a specific campaign:
1. Go to `/admin/meta-leads/mappings`
2. Add Mapping → Scope: **Campaign**, Campaign ID: `<your campaign ID>`
3. Meta Field Key: `__utm_source`, CRM Field Key: `Branch`, Fallback: `Dubai`

## CRM Payload Format

```json
{
  "lastName": "John Smith",
  "email": "john@example.com",
  "phone": "+971501234567",
  "AgeRange": "25-34",
  "ImmigrationType": "Student Visa",
  "Branch": "Dubai",
  "ResidentCountry": "UAE",
  "UTMSource": "Facebook Lead Ads",
  "Education": "Bachelor",
  "DestinationCountry": "Canada",
  "LeadSource": "Facebook Lead Ads",
  "roundrobin": "true"
}
```

## Retry Logic

Failed CRM deliveries are automatically retried with exponential backoff:

| Retry # | Delay |
|---|---|
| 1 | 5 minutes |
| 2 | 15 minutes |
| 3 | 1 hour |
| 4 | 6 hours |
| 5 | 24 hours |

After 5 retries the delivery is marked **failed** (permanent) but remains available for manual retry from the admin panel.

## Cron Configuration

### Vercel

Create `vercel.json` at project root:
```json
{
  "crons": [
    {
      "path": "/api/cron/meta-leads-retry",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/meta-campaign-sync",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

Vercel automatically sends requests from its cron infrastructure. Protect the endpoints by checking `CRON_SECRET` against the `Authorization` header (already implemented).

### VPS / PM2 / Docker

Add to system crontab:
```bash
# Retry failed CRM deliveries every 5 minutes
*/5 * * * * curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/meta-leads-retry >> /var/log/meta-retry.log 2>&1

# Sync campaigns every 6 hours
0 */6 * * * curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/meta-campaign-sync >> /var/log/meta-sync.log 2>&1
```

## Local Development

### Testing Webhooks Locally
Meta cannot send webhooks to `localhost`. Use a tunnel:
```bash
npx localtunnel --port 3000 --subdomain your-app
# Tunnel URL: https://your-app.loca.lt
```
Set callback URL in Meta to: `https://your-app.loca.lt/api/webhooks/meta`

### Simulating a Webhook
```bash
# First compute the HMAC-SHA256 of the payload
BODY='{"object":"page","entry":[{"id":"PAGE_ID","time":1234567890,"changes":[{"field":"leadgen","value":{"leadgen_id":"TEST_LEAD_ID","page_id":"PAGE_ID","form_id":"FORM_ID"}}]}]}'
SIG=$(echo -n "$BODY" | openssl dgst -sha256 -hmac "$META_APP_SECRET" | awk '{print $2}')

curl -X POST http://localhost:3000/api/webhooks/meta \
  -H "Content-Type: application/json" \
  -H "X-Hub-Signature-256: sha256=$SIG" \
  -d "$BODY"
```

### Testing with Meta Lead Ads Testing Tool
1. In your Meta app → **Lead Ads Testing Tool**
2. Select your Page and Lead Form
3. Click **Preview Form** → fill and submit
4. The lead will trigger a real webhook to your endpoint

## Troubleshooting

### Webhook not verified
- Ensure `META_WEBHOOK_VERIFY_TOKEN` exactly matches what you entered in Meta Webhooks configuration
- Check that your server is accessible from the internet (not localhost)
- Check server logs for `[Meta Webhook]` messages

### Lead arrives in Meta but not in CRM
1. Check `/admin/meta-leads/logs` for delivery status
2. If status is `failed` or `retry_scheduled` → click Retry All Failed
3. Check `last_error` column for the actual error message
4. Verify `META_LEADS_CRM_ENDPOINT` is correct
5. Use `/admin/meta-leads/settings → Test CRM Delivery` to verify connectivity

### Invalid access token
- Long-lived page tokens don't expire unless the user changes password or revokes access
- If expired, regenerate following Step 5 above
- Verify with `/admin/meta-leads/settings → Test Meta API Connection`

### Missing permissions
- Your app needs `leads_retrieval` permission to fetch lead details
- Submit for App Review at `developers.facebook.com → App → App Review`
- Without App Review, only test users can submit lead ads

### CRM delivery failure
- Test the CRM endpoint manually: `POST https://cmgone.org/api/web-to-leads` with sample JSON
- Check CRM-side logs for error messages stored in `response_body`
- Ensure your server can reach `cmgone.org` (no firewall blocking outbound HTTPS)

### Duplicate lead concerns
- Primary dedup: `meta_lead_id` unique constraint — the same Meta lead will never be stored twice
- Secondary dedup: `event_hash` unique constraint on webhook events
- If you're seeing duplicates in your CRM, check if the CRM itself deduplicates on email/phone

### Campaign data not syncing
- Verify `META_AD_ACCOUNT_ID` is set correctly (without `act_` prefix)
- Ensure your Page Access Token has `ads_read` and `ads_management` permissions
- Check logs when clicking **Sync from Meta** button

## Security Notes

- **Secrets never leave the server** — `META_APP_SECRET`, `META_PAGE_ACCESS_TOKEN`, and `CRON_SECRET` are only read server-side
- **Webhook signatures** are validated with HMAC-SHA256 and timing-safe comparison
- **Admin routes** require valid JWT session token
- **Cron routes** require `CRON_SECRET` in `Authorization: Bearer` header
- **Test CRM endpoint** is restricted to admin/super-admin roles
- **Response bodies** from CRM are capped at 2000 chars in storage and 500 chars in API responses
- **Lead data** in the UI never exposes raw tokens or internal system secrets

## Deployment Checklist

- [ ] Run `migrations/20260628_meta_leads_integration.sql` on production database
- [ ] Set all `META_*` environment variables in production
- [ ] Set `CRON_SECRET` in production
- [ ] Set `META_LEADS_CRM_ENDPOINT` (or leave as default)
- [ ] Deploy the application
- [ ] Verify webhook URL is accessible: `GET https://your-domain.com/api/webhooks/meta?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test`
- [ ] Configure Meta Webhooks callback URL and verify token in Meta Developer Portal
- [ ] Subscribe Facebook Page to `leadgen` field
- [ ] Configure Page Access Token in `dm_meta_settings` or environment
- [ ] Enable integration via `/admin/meta-leads/settings`
- [ ] Test with Meta Lead Ads Testing Tool
- [ ] Verify lead appears in `/admin/meta-leads/leads`
- [ ] Verify lead appears in CRM
- [ ] Set up cron jobs (Vercel cron or VPS crontab)
- [ ] Test CRM delivery from Settings page
