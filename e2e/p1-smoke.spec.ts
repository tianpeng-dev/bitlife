import { expect, test } from "@playwright/test";

test("P1 mobile flow reaches and uses activity surfaces", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "开始新人生" }).click();

  for (let index = 0; index < 18; index += 1) {
    const ageButton = page.getByRole("button", { name: "年龄+1" });
    await ageButton.click();

    const choices = page.locator(".event-modal .choice-grid button");
    if ((await choices.count()) > 0) {
      await choices.first().click();
    }
  }

  await page.getByRole("button", { name: "活动" }).click();
  await expect(page.getByRole("heading", { name: "活动" })).toBeVisible();
  await expect(page.getByText("资产").first()).toBeVisible();
  await expect(page.getByText("犯罪").first()).toBeVisible();
  await expect(page.getByText("宠物").first()).toBeVisible();

  await page.getByRole("button", { name: /金戒指/ }).click();
  await expect(page.locator(".error-text")).not.toBeVisible();
});
