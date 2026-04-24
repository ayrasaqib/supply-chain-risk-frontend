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

<launching> /Users/Hoang.Dang16/Library/Caches/ms-playwright/webkit-2272/pw_run.sh --inspector-pipe --headless --no-startup-window
<launched> pid=55177
[pid=55177] <gracefully close start>
[pid=55177] <process did exit: exitCode=0, signal=null>
[pid=55177] starting temporary directories cleanup
```