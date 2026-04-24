import { test } from "@playwright/test";
import { AuthPage } from "../pages/auth.page";
import { DashboardPage } from "../pages/dashboard.page";
import { testUser } from "../fixtures/test-data";

test("signup to dashboard", async ({ page }) => {
  const auth = new AuthPage(page);
  const dashboard = new DashboardPage(page);

  await auth.goToSignup();
  await auth.signup(testUser.name, testUser.email, testUser.password);

  await auth.expectAuthenticated();

  await dashboard.goto();
  await dashboard.waitForInitialization();
  await dashboard.expectLoaded();
});
