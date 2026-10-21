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
python tools/serve.py
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
- The user has supplied the training address (Uellendahler Straße 23, 42107 Wuppertal), group start times (Mon/Wed/Fri, 17:00 and 18:00), coach biography, photos and a UKF 1st Dan certificate. Exact age limits, session duration and regular prices are still unknown. Free trial training is confirmed.
- `tools/school-details.mjs` renders the confirmed timetable, biography, certificate, new gallery photos and address in each language. New original photographs are kept in `src/photos/`, excluded from the public Pages output; optimized variants and the certificate PDF are in `assets/`.

See `SEO-REPORT.md` for this implementation and competitor research; `SEO-PLAN.md` for remaining account and business-information tasks.


## Karate runner

The optional game is rendered in DE/RU/UK by `tools/runner-section.mjs`. `runner-game.js` is imported only after Start, relative to `script.js`, so language subdirectories use the same module. The local preview server explicitly serves JavaScript modules with the correct MIME type on Windows. Run `npm run test:game` against the preview server; set `SITE_URL` if using a different port.

Space/Arrow Up and tapping jump; Escape and the Pause button pause. Animation stops when the tab loses focus or the canvas leaves view. The best score is stored locally in `shelest-runner-best`; no tracking or backend is used. Game-over CTAs are contained inside the game stage and use each page’s localized WhatsApp message. No part of the school information requires playing the game.


The running cycle now uses six unmodified frames extracted from the user-supplied `src/photos/37lJP8S.gif` (60 ms each). `python tools/extract-runner.py` repacks them into a lossless atlas in `assets/game/` and verifies pixel equality against the GIF. The source atlas keeps its original black-on-white pixels; `runner-game.js` applies the yellow color and transparent background at runtime. The atlas and timing module load only after Start. The airborne flying-kick pose remains drawn in canvas.
