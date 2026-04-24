import { expect, test } from "@playwright/test";
import { AuthPage } from "../pages/auth.page";
import { DashboardPage } from "../pages/dashboard.page";
import { testUser } from "../fixtures/test-data";

test("signup to logout to login to dashboard", async ({ page }) => {
  test.setTimeout(90000); // 90 seconds

  const auth = new AuthPage(page);
  const dashboard = new DashboardPage(page);
  const email = `test_${Date.now()}@mail.com`;

  // SIGNUP
  await auth.goToSignup();
  await auth.signup(testUser.name, email, testUser.password);
  await dashboard.expectLoaded();

  // LOGOUT
  await auth.logout();
  await page.waitForURL(/login/);

  await expect(page.getByLabel("Email")).toBeVisible();

  // LOGIN (NO goto)
  await auth.login(email, testUser.password);

  await dashboard.expectLoaded();
});
