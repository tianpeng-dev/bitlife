import { expect, test } from "@playwright/test";

test("mobile life loop smoke", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "开始新人生" }).click();
  await expect(page.getByText(/年龄：0/)).toBeVisible();
  await page.getByRole("button", { name: "年龄+1" }).click();
  await expect(page.getByText(/年龄：1/)).toBeVisible();
  await page.getByRole("button", { name: "活动" }).click();
  await expect(page.getByRole("heading", { name: "活动" })).toBeVisible();
});
