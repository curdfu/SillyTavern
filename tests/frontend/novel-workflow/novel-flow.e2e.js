import { test, expect } from '@playwright/test';

test('novel workflow opens as an independent workbench', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SillyTavern/i);

    await page.locator('#extensionsMenuButton').click();
    await page.getByRole('button', { name: /小说工作流/ }).click();

    await expect(page.locator('#novel_workflow_workbench')).toBeVisible();
    await expect(page.getByRole('heading', { name: /我的小说/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /空白小说/ })).toBeVisible();

    await page.locator('#novel_workflow_workbench').getByRole('button', { name: /关闭/ }).click();
    await expect(page.locator('#novel_workflow_workbench')).toBeHidden();
});

test('creates a blank novel without current chat assets', async ({ page }) => {
    await page.goto('/');
    await page.locator('#extensionsMenuButton').click();
    await page.getByRole('button', { name: /小说工作流/ }).click();
    const workbench = page.locator('#novel_workflow_workbench');
    await workbench.getByRole('button', { name: /空白小说/ }).click();

    await workbench.getByLabel(/标题/).fill('Zero Start Novel');
    await workbench.getByLabel(/类型/).fill('Fantasy');
    await workbench.getByLabel(/主线剧情/).fill('A nobody builds a kingdom from nothing');
    await workbench.getByRole('button', { name: /创建空白小说/ }).click();

    await expect(workbench.getByRole('heading', { name: /Zero Start Novel/i })).toBeVisible();
    await expect(workbench.getByText(/未关联聊天/)).toBeVisible();

    const navigation = workbench.locator('.novel-workflow__nav');

    await navigation.getByRole('button', { name: /角色/ }).click();
    await expect(workbench.getByRole('heading', { name: /角色/ })).toBeVisible();
    await workbench.getByLabel(/名称/).fill('Aren');
    await workbench.getByLabel(/目标/).fill('Recover his name');
    await workbench.getByRole('button', { name: /添加角色/ }).click();
    await expect(workbench.getByText('Aren')).toBeVisible();

    await navigation.getByRole('button', { name: /场景/ }).click();
    await expect(workbench.getByRole('heading', { name: /场景/ })).toBeVisible();
    await workbench.getByLabel(/标题/).fill('First Camp');
    await workbench.getByLabel(/目标/).fill('Find shelter');
    await workbench.getByRole('button', { name: /添加场景/ }).click();
    await expect(workbench.getByText(/First Camp - 已规划/)).toBeVisible();

    await navigation.getByRole('button', { name: /上下文/ }).click();
    await expect(workbench.getByRole('heading', { name: /上下文预览/ })).toBeVisible();
    await expect(workbench.getByText(/已用 Token：/)).toBeVisible();

    await navigation.getByRole('button', { name: /写作/ }).click();
    await expect(workbench.getByRole('heading', { name: /写作/ })).toBeVisible();
    await expect(workbench.getByPlaceholder(/在这里起草场景或章节正文/)).toBeVisible();

    await navigation.getByRole('button', { name: /审阅/ }).click();
    await expect(workbench.getByRole('heading', { name: /章节审阅/ })).toBeVisible();
    await expect(workbench.getByText(/状态：待处理/)).toBeVisible();
});
