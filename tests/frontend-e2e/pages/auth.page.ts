import { Page, expect } from "@playwright/test";

export class AuthPage {
  constructor(private page: Page) {}

  async goToSignup() {
    await this.page.goto("/register");
  }

  async goToLogin() {
    if (!this.page.url().includes("/login")) {
      await this.page.goto("/login");
    }
  }

  async signup(name: string, email: string, password: string) {
    await this.page.getByLabel("Name").fill(name);
    await this.page.getByLabel("Email").fill(email);
    await this.page.getByLabel("Password", { exact: true }).fill(password);
    await this.page.getByLabel("Confirm Password").fill(password);

    await this.page.getByRole("button", { name: "Create account" }).click();
  }

  async login(email: string, password: string) {
    await this.page.getByLabel("Email").fill(email);
    await this.page.getByLabel("Password", { exact: true }).fill(password);

    await this.page.getByRole("button", { name: /sign in|login/i }).click();
  }
  async logout() {
    const menuButton = this.page.getByTestId("user-menu-button");

    await menuButton.click();

    const logoutButton = this.page.getByRole("button", { name: /log out/i });

    await expect(logoutButton).toBeVisible();

    await Promise.all([this.page.waitForURL(/\/|login/), logoutButton.click()]);
  }
  async expectAuthenticated() {
    await this.page.waitForURL(/dashboard/, { timeout: 60000 });
  }
}
