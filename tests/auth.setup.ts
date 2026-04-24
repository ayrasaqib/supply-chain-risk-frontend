import { test as setup, expect } from "@playwright/test";

setup("create storage state", async ({ page }) => {
  await page.goto("/login");

  await page.fill("#email", "test@example.com");
  await page.fill("#password", "password123");

  await page.click("button[type=submit]");

  await expect(page).toHaveURL(/dashboard/);

  // IMPORTANT: create folder first if needed
  await page.context().storageState({
    path: "tests/.auth/storageState.json",
  });
});
