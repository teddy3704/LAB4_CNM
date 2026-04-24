import { expect, test } from "@playwright/test";

test("home page loads and shows core UI", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("link", { name: "Phan Văn Tiến ProMax Blog" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Latest posts" }),
  ).toBeVisible();
  await expect(page.getByPlaceholder("Search posts...")).toBeVisible();
});

test("header navigation works for auth links", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("link", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByRole("link", { name: "Create an account" }).click();
  await expect(page).toHaveURL(/\/register$/);
});
