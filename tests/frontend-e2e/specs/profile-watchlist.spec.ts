import { test, expect } from "@playwright/test";
import { testUser } from "../fixtures/test-data";
import { AuthPage } from "../pages/auth.page";

test.describe("Profile page - full auth flow", () => {
  test("signup to login to profile to watchlist flow", async ({ page }) => {
    test.setTimeout(120000); // 60 seconds
    const auth = new AuthPage(page);
    await auth.goToSignup();
    await auth.signup(testUser.name, testUser.email, testUser.password);

    // should land somewhere authenticated
    await page.waitForURL("**/dashboard");

    await page.goto("/profile");
    await expect(page.getByText("Edit Profile")).toBeVisible();
    await expect(page.getByText(testUser.email)).toBeVisible();

    const hubSelector = page.getByRole("combobox");
    await expect(hubSelector).toBeVisible();
    await hubSelector.click();

    // pick first hub in dropdown
    const firstHub = page.getByRole("option").first();
    await expect(firstHub).toBeVisible();
    await firstHub.click();

    const subscribeBtn = page.getByRole("button", { name: /subscribe/i });
    await expect(subscribeBtn).toBeEnabled();
    await subscribeBtn.click();

    await expect(page.getByText("Subscribed Hubs").first()).toBeVisible();

    const viewRiskBtn = page
      .getByRole("button", { name: /view risk/i })
      .first();
    await expect(viewRiskBtn).toBeVisible();
    await viewRiskBtn.click();

    // risk panel should appear
    await expect(page.getByText("Risk Score")).toBeVisible();
    const unsubscribeBtn = page
      .getByRole("button", { name: /unsubscribe/i })
      .first();
    await expect(unsubscribeBtn).toBeVisible();
    await unsubscribeBtn.click();

    // confirm removed
    await expect(page.getByText(/you have not subscribed/i)).toBeVisible();
  });

  test("profile empty state loads correctly", async ({ page }) => {
    test.setTimeout(120000); // 60 seconds
    const auth = new AuthPage(page);
    await auth.goToSignup();
    await auth.signup(testUser.name, testUser.email, testUser.password);

    // should land somewhere authenticated
    await page.waitForURL("**/dashboard");

    // go profile
    await page.goto("/profile");

    await expect(page.getByText("Watchlist").first()).toBeVisible();
    await expect(page.getByText(/not subscribed/i).first()).toBeVisible();
  });
});
