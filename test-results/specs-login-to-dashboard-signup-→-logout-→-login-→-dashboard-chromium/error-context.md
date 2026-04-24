# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: specs/login-to-dashboard.spec.ts >> signup → logout → login → dashboard
- Location: tests/frontend-e2e/specs/login-to-dashboard.spec.ts:6:5

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: write EPIPE
```

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Click a hub marker')
Expected: visible
Timeout: 60000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 60000ms
  - waiting for locator('text=Click a hub marker')

```

```
Error: browserContext.close: Test timeout of 90000ms exceeded.
Browser logs:

<launching> /Users/Hoang.Dang16/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-arm64/chrome-headless-shell --disable-field-trial-config --disable-background-networking --disable-background-timer-throttling --disable-backgrounding-occluded-windows --disable-back-forward-cache --disable-breakpad --disable-client-side-phishing-detection --disable-component-extensions-with-background-pages --disable-component-update --no-default-browser-check --disable-default-apps --disable-dev-shm-usage --disable-extensions --disable-features=AvoidUnnecessaryBeforeUnloadCheckSync,BoundaryEventDispatchTracksNodeRemoval,DestroyProfileOnBrowserClose,DialMediaRouteProvider,GlobalMediaControls,HttpsUpgrades,LensOverlay,MediaRouter,PaintHolding,ThirdPartyStoragePartitioning,Translate,AutoDeElevate,RenderDocument,OptimizationHints --enable-features=CDPScreenshotNewSurface --allow-pre-commit-input --disable-hang-monitor --disable-ipc-flooding-protection --disable-popup-blocking --disable-prompt-on-repost --disable-renderer-backgrounding --force-color-profile=srgb --metrics-recording-only --no-first-run --password-store=basic --use-mock-keychain --no-service-autorun --export-tagged-pdf --disable-search-engine-choice-screen --unsafely-disable-devtools-self-xss-warnings --edge-skip-compat-layer-relaunch --enable-automation --disable-infobars --disable-search-engine-choice-screen --disable-sync --enable-unsafe-swiftshader --headless --hide-scrollbars --mute-audio --blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4 --no-sandbox --user-data-dir=/var/folders/vd/9_x1_cqs4kdgfxp69xqk3rq80000gn/T/playwright_chromiumdev_profile-qY09al --remote-debugging-pipe --no-startup-window
<launched> pid=55176
[pid=55176][err] [0424/052418.372479:INFO:CONSOLE:2298] "%cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools font-weight:bold", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/052418.413883:INFO:CONSOLE:2298] "[HMR] connected", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/052418.663393:INFO:CONSOLE:2298] "%c[Vercel Web Analytics]%c Debug mode is enabled by default in development. No requests will be sent to the server. color: rgb(120, 120, 120) color: inherit", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/052418.663788:INFO:CONSOLE:2298] "%c[Vercel Web Analytics]%c Running queued event color: rgb(120, 120, 120) color: inherit pageview [object Object]", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/052418.664051:INFO:CONSOLE:2298] "%c[Vercel Web Analytics]%c [view] http://localhost:3000/register color: rgb(120, 120, 120) color: inherit [object Object] /_vercel/insights/view", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/052419.414288:INFO:CONSOLE:2298] "%c[Vercel Web Analytics]%c [view] http://localhost:3000/dashboard color: rgb(120, 120, 120) color: inherit [object Object] /_vercel/insights/view", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/053148.884443:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/053148.893117:INFO:CONSOLE:2298] "[Fast Refresh] done in 109ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/053302.828508:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/053302.838204:INFO:CONSOLE:2298] "[Fast Refresh] done in 111ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/060051.208737:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/060051.221234:INFO:CONSOLE:2298] "[Fast Refresh] done in 114ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/060105.143383:INFO:CONSOLE:2298] "[HMR] connected", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/103657.084166:INFO:CONSOLE:2298] "[HMR] connected", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/104416.936624:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/104416.972033:INFO:CONSOLE:2298] "[Fast Refresh] done in 137ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/104418.468331:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/104418.469300:INFO:CONSOLE:2298] "[Fast Refresh] done in 102ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/104548.261259:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/104548.287048:INFO:CONSOLE:2298] "[Fast Refresh] done in 126ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/104715.908826:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/104715.917210:INFO:CONSOLE:2298] "[Fast Refresh] done in 110ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/104756.854172:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/104756.946255:INFO:CONSOLE:2298] "[Fast Refresh] done in 194ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/104809.593593:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/104809.603083:INFO:CONSOLE:2298] "[Fast Refresh] done in 110ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/104823.370058:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/104823.372369:INFO:CONSOLE:2298] "[Fast Refresh] done in 104ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/104831.867075:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/104831.868868:INFO:CONSOLE:2298] "[Fast Refresh] done in 102ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/104840.429797:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/104840.475425:INFO:CONSOLE:2298] "[Fast Refresh] done in 147ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/104845.364448:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/104845.368045:INFO:CONSOLE:2298] "[Fast Refresh] done in 103ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/104900.263263:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/104900.281223:INFO:CONSOLE:2298] "[Fast Refresh] done in 120ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/104913.489637:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/104913.489764:INFO:CONSOLE:2298] "[Fast Refresh] done in 100ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105116.107362:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105116.526138:INFO:CONSOLE:2298] "[Fast Refresh] done in 378ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105116.954926:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105116.962198:INFO:CONSOLE:2298] "[Fast Refresh] done in 109ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105117.066413:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105117.110934:INFO:CONSOLE:2298] "[Fast Refresh] done in 145ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105117.214997:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105117.607223:INFO:CONSOLE:2298] "[Fast Refresh] done in 493ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105118.352062:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105118.664244:INFO:CONSOLE:2298] "[Fast Refresh] done in 198ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105118.804667:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105119.172889:INFO:CONSOLE:2298] "[Fast Refresh] done in 468ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105120.333974:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105120.365183:INFO:CONSOLE:2298] "[Fast Refresh] done in 133ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105121.946562:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105121.965045:INFO:CONSOLE:2298] "[Fast Refresh] done in 118ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105124.417757:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105124.598015:INFO:CONSOLE:2298] "[Fast Refresh] done in 187ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105124.877938:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105125.262043:INFO:CONSOLE:2298] "[Fast Refresh] done in 485ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105126.873276:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105127.019303:INFO:CONSOLE:2298] "[Fast Refresh] done in 154ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105127.120110:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105127.530744:INFO:CONSOLE:2298] "[Fast Refresh] done in 511ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105134.223851:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105134.248669:INFO:CONSOLE:2298] "[Fast Refresh] done in 125ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105138.018651:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105138.278156:INFO:CONSOLE:2298] "[Fast Refresh] done in 361ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105138.387879:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105138.411137:INFO:CONSOLE:2298] "[Fast Refresh] done in 124ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105138.797963:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105138.979514:INFO:CONSOLE:2298] "[Fast Refresh] done in 282ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105139.227479:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105139.883974:INFO:CONSOLE:2298] "[Fast Refresh] done in 757ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105140.123185:INFO:CONSOLE:2298] "[Fast Refresh] rebuilding", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176][err] [0424/105140.325618:INFO:CONSOLE:2298] "[Fast Refresh] done in 318ms", source: http://localhost:3000/_next/static/chunks/node_modules_next_dist_f3530cac._.js (2298)
[pid=55176] <gracefully close start>
```