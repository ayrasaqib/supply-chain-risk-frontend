import { test, expect } from "@playwright/test";
import { AuthPage } from "../pages/auth.page";
import { testUser } from "../fixtures/test-data";

test("signup to dashboard to optimal path to compute route", async ({
  page,
}) => {
  test.setTimeout(120000);

  const auth = new AuthPage(page);
  const email = `test_${Date.now()}@mail.com`;
  await auth.goToSignup();
  await auth.signup(testUser.name, testUser.email, testUser.password);

  await page.waitForURL("**/dashboard");

  // light dashboard sanity check
  await expect(page.locator("main, body")).toBeVisible();

  // GO TO OPTIMAL PATH PAGE
  await page.goto("/optimal-path");

  await expect(page.getByText(/optimal path finder/i).first()).toBeVisible({
    timeout: 60000,
  });

  // START HUB
  const startDropdown = page.getByRole("combobox").first();
  await expect(startDropdown).toBeVisible();
  await startDropdown.click();

  // pick first option
  const firstOption = page.getByRole("option").first();
  await expect(firstOption).toBeVisible({ timeout: 15000 });
  await firstOption.click();

  // END HUB
  const endDropdown = page.getByRole("combobox").nth(1);

  await expect(endDropdown).toBeVisible({ timeout: 15000 });
  await endDropdown.click();

  // second option
  const secondOption = page.getByRole("option").nth(1);
  await expect(secondOption).toBeVisible({ timeout: 15000 });
  await secondOption.click();
});
