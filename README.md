# Karateschule Shelest

Static German, Russian and Ukrainian site deployed by GitHub Pages from `main`.

## Editing

- Edit layout in `src/template.html`, translated text and metadata in `src/translations.json`, styling in `styles.css`.
- Run `npm run build` to regenerate `index.html`, `ru/index.html`, `uk/index.html` and `sitemap.xml`. Commit the generated pages together with source changes.
- Do not edit generated pages directly: the next build overwrites them.
- `script.js` handles interactions only. The content is readable without JavaScript.
- `legacy-language.js` handles previously shared `?lang=de|ru|uk` URLs. It preserves other query parameters and the fragment. This is a client-side compatibility redirect, not an HTTP 301.

## Local tools (keep on D:)

Project and dependencies: `D:\карате`.

```powershell
Set-Location D:\карате
npm ci --cache D:/карате/.npm-cache
npm run build
python -m http.server 8765 --bind 127.0.0.1
```

In another terminal run `npm test`. The test uses the already installed Chrome executable and does not install a browser. Reports and screenshots go to `.qa/`, excluded from Git. Set `SITE_URL` to test a deployment; the default is the local server.

`tools/optimize-images.py` uses the existing Pillow installation to generate WebP variants and `src/images.json`. It keeps the original source photos. Only re-run when images change. `sizes` and `srcset` are produced by the HTML build.

`assets/fonts/` contains local WOFF2 fonts and their OFL licenses; `assets/vendor/` contains Bootstrap 5.3.8 and its MIT license. `tools/vendor-assets.py` refreshes these files from their upstream sources; it is not part of the regular HTML build.

## SEO

- German: `/karate-shelest-wuppertal/`
- Russian: `/karate-shelest-wuppertal/ru/`
- Ukrainian: `/karate-shelest-wuppertal/uk/`
- Each language has its own canonical, description and translated HTML, and reciprocal `hreflang` links. German is `x-default`.
- Search Console verification is not configured. Add the supplied verification method once account access or a verification token is available.
- `robots.txt` is controlled at the domain root on GitHub Pages, not in this project subdirectory.
- Unknown address, age groups, schedule, regular prices and trainer credentials must be confirmed before publishing them. Free trial training has been confirmed by the user.

See `SEO-REPORT.md` for this implementation and competitor research; `SEO-PLAN.md` for remaining account and business-information tasks.
