# Farcaster Mini App Integration Guide — Chessxu

Chessxu is setup to be integrated as a [Farcaster Mini App](https://miniapps.farcaster.xyz/docs/getting-started). Farcaster Mini Apps are full-screen interactive web experiences that load directly inside clients like Warpcast.

## Features

### 🖼️ Frame and Mini App Configuration
- **Frame Headers** — `<meta property="fc:frame">` are added to your HTML to render as an interactive frame within Farcaster feeds.
- **App Launch** — A "Play Chessxu" action button opens the Mini App.
- **Domain Verification** — Contains the `/.well-known/farcaster.json` manifest template for domains.

### 📱 Mini App Lifecycle
- **Splash Screen Logic** — Implemented `@farcaster/miniapp-sdk`.
- **Ready Signal** — React component `<FarcasterMiniAppReady />` calls `sdk.actions.ready()` right after app load to prevent infinite loading screens.

## Technical Architecture

### Key Files

| File | Purpose |
|------|---------|
| `frontend/src/components/FarcasterMiniAppReady.tsx` | Calls `sdk.actions.ready()` when the app mounts, dismissing the loading splash. |
| `frontend/public/.well-known/farcaster.json` | Farcaster domain verification manifest. Needs signature from developer dashboard. |
| `frontend/index.html` | Embeds `fc:frame` OpenGraph meta tags required to let the app run as a mini app. |
| `frontend/src/app/app.tsx` | Mounts the `<FarcasterMiniAppReady />` component. |

## Completing the Integration

To finalize integration, you must verify your domain using Farcaster developer tools:

1. Deploy the site to your production URL (e.g. `https://chessxu.vercel.app/`).
2. Go to the Farcaster Developer Portal in Warpcast Desktop by navigating here: [https://farcaster.xyz/~/settings/developer-tools](https://farcaster.xyz/~/settings/developer-tools).
3. Generate your mini app domain payload and signature using your connected Farcaster wallet.
4. Paste the generated `signature`, `header`, and `payload` into `frontend/public/.well-known/farcaster.json`.
5. Update your domain URL in both `index.html` and `farcaster.json` files if you deploy to a different custom domain.
6. Share a link to your domain on Warpcast to test the app!

---

**Built with ♟️ for the Farcaster ecosystem!**
