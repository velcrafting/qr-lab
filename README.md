# qr-generator

Tiny micro-site built with Vite + Tailwind.

- Live: https://velcrafting.github.io/qr-generator/
- Proxy: https://velcrafting.com/labs/qr-generator/

## Scripts
- npm run dev
- npm run build
- npm run preview

## GitHub
gh repo create velcrafting/qr-generator --public --source=. --push

## Next.js rewrites (paste into your main site's next.config.ts)
{
  source: "/labs/qr-generator",
  destination: "https://velcrafting.github.io/qr-generator/index.html"
},
{
  source: "/labs/qr-generator/:path*",
  destination: "https://velcrafting.github.io/qr-generator/:path*"
}

## Labs registry row (add to config/labs.json in your main site)
{ "slug": "qr-generator", "base": "https://velcrafting.github.io/qr-generator" }
