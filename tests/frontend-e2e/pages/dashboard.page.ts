import { Page, expect } from "@playwright/test";

export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/dashboard");
  }

  async waitForInitialization() {
    // 1. wait for app root
    await this.page.waitForSelector("body");

    // 2. wait for ANY dashboard UI element that always exists
    await expect(this.page.locator("main")).toBeVisible({
      timeout: 60000,
    });

    // 3. wait for loading to disappear IF it exists
    const loading = this.page.getByText("Initializing IntelliSupply");

    if (await loading.count()) {
      await expect(loading).toBeHidden({ timeout: 60000 });
    }
  }
  async expectLoaded() {
    // 1. page must be in app shell
    await expect(this.page.locator("main")).toBeVisible({ timeout: 60000 });

    // 2. dashboard must NOT be in loading state
    await expect(this.page.getByText("Initializing IntelliSupply")).toBeHidden({
      timeout: 60000,
    });

    // 3. verify ANY dashboard content exists (map or instruction text)
    await expect(this.page.locator("text=Click a hub marker")).toBeVisible({
      timeout: 60000,
    });
  }
}
