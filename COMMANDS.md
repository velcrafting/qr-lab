# Commands (qr-generator)

## Dev and build
npm run dev
npm run build
npm run preview

## Init and push
git init -b main
git add -A && git commit -m "init"
gh repo create velcrafting/qr-generator --public --source=. --push

## URLs
Pages: https://velcrafting.github.io/qr-generator/
Proxy:  https://velcrafting.com/labs/qr-generator/

## Rewrites (Next.js)
- "/labs/qr-generator" -> "https://velcrafting.github.io/qr-generator/index.html"
- "/labs/qr-generator/:path*" -> "https://velcrafting.github.io/qr-generator/:path*"

## Health checks
curl -I https://velcrafting.github.io/qr-generator/lab.json
curl -I https://velcrafting.com/labs/qr-generator/lab.json
