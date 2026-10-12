# whoop-web

A web dashboard for WHOOP data.

It reads from the Convex backend of [willzeng274/whoop-ios](https://github.com/willzeng274/whoop-ios/tree/william/feature-additions), a fork of Harley Zhang's [harleyhzhang/whoop-ios](https://github.com/harleyhzhang/whoop-ios). The phone app keeps the full data locally and syncs a compact daily summary to Convex. This site shows that summary: recovery, sleep, strain, steps, HRV, resting heart rate, activities with heart-rate zones, and strap status.

## Setup

```sh
npm install
npm run dev
```

Environment variables (`.env.local` locally, project settings on Vercel):

| Name | Purpose |
| --- | --- |
| `CONVEX_SITE_URL` | HTTP actions URL of the whoop-ios Convex deployment |
| `WHOOP_WEB_READ_TOKEN` | Bearer token for `/v1/web/dashboard` and `/v1/web/attempt` |
| `SITE_PASSCODE` | 4-digit passcode for the login screen |
| `SESSION_SECRET` | Signs the 30-day session cookie |
| `WHOOP_TIME_ZONE` | Optional, defaults to `America/Toronto` |

## Access

The site is behind a 4-digit passcode that is checked on the server. Convex limits wrong attempts to 2 per IP address and 10 overall per UTC day. Crawlers are blocked through `robots.txt`, `X-Robots-Tag` headers, and noindex meta tags.
