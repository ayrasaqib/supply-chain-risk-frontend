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

<launching> /Users/Hoang.Dang16/Library/Caches/ms-playwright/firefox-1511/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /var/folders/vd/9_x1_cqs4kdgfxp69xqk3rq80000gn/T/playwright_firefoxdev_profile-7VOvvp -juggler-pipe -silent
<launched> pid=55175
[pid=55175][err] *** You are running in headless mode.
[pid=55175][err] JavaScript warning: resource://services-settings/Utils.sys.mjs, line 116: unreachable code after return statement
[pid=55175][out] console.warn: services.settings: Ignoring preference override of remote settings server
[pid=55175][out] console.warn: services.settings: Allow by setting MOZ_REMOTE_SETTINGS_DEVTOOLS=1 in the environment
[pid=55175][out] 
[pid=55175][out] Juggler listening to the pipe
[pid=55175][out] console.warn: services.settings: #fetchAttachment: Forcing fallbackToDump to false due to Utils.LOAD_DUMPS being false
[pid=55175][out] console.error: (new NotFoundError("Could not find fa0fc42c-d91d-fca7-34eb-806ff46062dc in cache or dump", "resource://services-settings/Attachments.sys.mjs", 48))
[pid=55175][out] console.warn: "Unable to find the attachment for" "fa0fc42c-d91d-fca7-34eb-806ff46062dc"
[pid=55175][out] console.error: services.settings: 
[pid=55175][out]   Message: EmptyDatabaseError: "main/nimbus-desktop-experiments" has not been synced yet
[pid=55175][out]   Stack:
[pid=55175][out]     EmptyDatabaseError@resource://services-settings/Database.sys.mjs:19:5
[pid=55175][out] list@resource://services-settings/Database.sys.mjs:96:13
[pid=55175][out] 
[pid=55175][out] console.warn: LoginRecipes: "Falling back to a synchronous message for: http://localhost:3000."
[pid=55175][out] console.warn: LoginRecipes: "Falling back to a synchronous message for: http://localhost:3000."
[pid=55175][out] console.warn: LoginRecipes: "Falling back to a synchronous message for: http://localhost:3000."
[pid=55175][err] JavaScript warning: resource://gre/modules/UpdateService.sys.mjs, line 4026: unreachable code after return statement
[pid=55175][out] console.error: "Could not download new icon" (new ServerInfoError("Server response is invalid SyntaxError: XMLHttpRequest.open: '/' is not a valid URL.", "resource://services-settings/Attachments.sys.mjs", 40))
[pid=55175] <gracefully close start>
```