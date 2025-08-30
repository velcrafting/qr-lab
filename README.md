# QR Generator

Generate QR codes (URL, text, WiFi, vCard, event), style them (colors, gradients, embedded logo/watermark), and export to PNG or SVG.

Built with Vite, React, and Tailwind CSS. The Vite base is set to `./` so you can host from any subpath (e.g., GitHub Pages project sites or subfolders on your domain).

## Features
- URL, free text, WiFi, vCard, and calendar event payloads
- Error correction levels (L/M/Q/H)
- Color and gradient fills with angle control
- Margin and size controls
- Optional center logo or default branding watermark
- Export to PNG and SVG

## Quick Start
- Install: `npm ci` (or `npm install`)
- Dev server: `npm run dev` then open the local URL
- Build: `npm run build` (outputs to `dist/`)
- Preview build: `npm run preview`

## Usage Notes
- WiFi: supports `WPA`, `WEP`, or `nopass`, with proper escaping of SSID/password and an option for hidden networks.
- vCard: generates vCard 3.0 fields (name, org, title, phone, email, URL, address).
- Event: emits a minimal VCALENDAR/VEVENT with DTSTART/DTEND; datetimes are treated as local and a `Z` suffix is appended for simplicity.
- Branding/logo: if you import a logo, it’s embedded at the center; otherwise an optional watermark area is drawn. If `public/logo.svg` exists, it is used as the default branding mark.

## Scripts
- `npm run dev` — start Vite dev server
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build

## Deploy Options

### A) Standalone public repo (recommended for individual micros)
1. Initialize (if not already): `git init`
2. Create a new GitHub repo (public) and push:
   - Using GitHub CLI: `gh repo create <owner>/qr-lab --public --source=. --remote=origin --push`
   - Or manually: `git remote add origin git@github.com:<owner>/qr-lab.git && git branch -M main && git push -u origin main`
3. Enable GitHub Pages (Settings → Pages → Source: GitHub Actions). This repo ships a basic workflow you can adapt at the parent level if desired.

The `vite.config.ts` uses `base: "./"`, so assets resolve correctly on a project site like `https://<owner>.github.io/qr-lab/` and when embedded under a subpath.

### B) Host under a parent site/subpath
- If your main site is on Next.js, add a rewrite to proxy this micro (example):
  - `/labs/qr-lab` → `https://<owner>.github.io/qr-lab/index.html`
  - `/labs/qr-lab/:path*` → `https://<owner>.github.io/qr-lab/:path*`
- If self-hosting, deploy the contents of `dist/` to the desired path and ensure the site serves static assets with correct content types.

## Configuration
- Base URL: `vite.config.ts` sets `base: "./"` so no extra config is needed for subpath hosting.
- Default logo: place your branding at `public/logo.svg` to be used automatically when watermarking is enabled and no custom logo is selected.
- Accessibility: colors and contrasts are up to the user; for best scanning reliability, prefer strong contrast and consider higher ECC when embedding large logos.

## License
MIT — see `LICENSE`.

## Credits
- QR generation powered by `qrcode-generator` (loaded via CDN in `index.html`).
