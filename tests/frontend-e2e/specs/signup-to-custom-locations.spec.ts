import { test, expect } from "@playwright/test";
import { AuthPage } from "../pages/auth.page";
import { testUser } from "../fixtures/test-data";

test("custom location full flow (signup to analyze)", async ({ page }) => {
  test.setTimeout(120000);

  const auth = new AuthPage(page);

  await page.goto("/signup");
  await auth.goToSignup();
  await auth.signup(testUser.name, testUser.email, testUser.password);
  await page.waitForURL(/dashboard/, { timeout: 30000 });
  await page.getByRole("link", { name: /custom location/i }).click();

  await page.waitForURL(/custom-location/, { timeout: 60000 });
  await expect(page.getByText("Analyze Custom Location")).toBeVisible();

  await page.getByLabel("Location Name").fill("Sydney Warehouse");
  await page.getByLabel("Latitude").fill("-33.8688");
  await page.getByLabel("Longitude").fill("151.2093");

  await page.getByRole("button", { name: /analyze location/i }).click();
  await expect(page.getByText(/creating the hub/i)).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByText("Sydney Warehouse")).toBeVisible({
    timeout: 90000,
  });

  await expect(page.getByText(/overview/i)).toBeVisible();
});
