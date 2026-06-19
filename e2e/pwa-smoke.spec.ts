import { expect, test } from "@playwright/test";

test("mobile life loop smoke", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "开始新人生" }).click();
  await expect(page.locator(".life-card__meta").getByText("0岁")).toBeVisible();
  await page.getByRole("button", { name: "主菜单" }).click();
  await expect(page.getByRole("menu", { name: "菜单" })).toBeVisible();
  await expect(page.getByText("退出游戏")).toBeVisible();
  await expect(page.getByText("声音设置")).toBeVisible();
  await page.getByRole("button", { name: "主菜单" }).click();
  await page.getByRole("button", { name: "年龄+1" }).click();
  await expect(page.locator(".life-card__meta").getByText("1岁")).toBeVisible();
  await page.getByRole("button", { name: "活动" }).click();
  await expect(page.getByRole("heading", { name: "活动" })).toBeVisible();
});
