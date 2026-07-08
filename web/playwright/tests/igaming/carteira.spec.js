const { test, expect } = require('@playwright/test')
const users = require('../../fixtures/users.json')
const data = require('../../fixtures/igaming.json')

test.describe('Carteira — Playwright Mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.selectOption('[data-cy=tenant-select]', 'operator-a')
    await page.fill('[data-cy=username]', users['operator-a'].username)
    await page.fill('[data-cy=password]', users['operator-a'].password)
    await page.click('[data-cy=btn-login]')
    await page.waitForURL('**/dashboard')
    await page.goto('/wallet')
  })

  test('depósito válido atualiza saldo', async ({ page }) => {
    const balanceBefore = await page.locator('[data-cy=wallet-balance]').innerText()
    const before = parseFloat(balanceBefore.replace(/[^0-9.]/g, ''))

    await page.fill('[data-cy=input-deposit]', String(data.wallet.validAmount))
    await page.click('[data-cy=btn-deposit]')
    await page.click('[data-cy=btn-confirm]')

    await expect(page.locator('[data-cy=success-message]')).toContainText(data.messages.depositSuccess)

    const balanceAfter = await page.locator('[data-cy=wallet-balance]').innerText()
    const after = parseFloat(balanceAfter.replace(/[^0-9.]/g, ''))
    expect(after).toBe(before + data.wallet.validAmount)
  })

  test('toque em botão de saque funciona em mobile (touch event)', async ({ page }) => {
    await page.fill('[data-cy=input-deposit]', '200')
    await page.click('[data-cy=btn-deposit]')
    await page.click('[data-cy=btn-confirm]')

    await page.fill('[data-cy=input-withdraw]', String(data.wallet.withdrawMin))
    await page.tap('[data-cy=btn-withdraw]')
    await page.tap('[data-cy=btn-confirm]')

    await expect(page.locator('[data-cy=success-message]')).toContainText(data.messages.withdrawSuccess)
  })

  test('layout de carteira está responsivo em mobile — elementos visíveis e não sobrepostos', async ({ page }) => {
    await expect(page.locator('[data-cy=wallet-balance]')).toBeVisible()
    await expect(page.locator('[data-cy=btn-deposit]')).toBeVisible()
    await expect(page.locator('[data-cy=btn-withdraw]')).toBeVisible()

    const depositBtn = await page.locator('[data-cy=btn-deposit]').boundingBox()
    const withdrawBtn = await page.locator('[data-cy=btn-withdraw]').boundingBox()
    expect(depositBtn.y).not.toBe(withdrawBtn.y)
  })

  test('simula falha de rede e garante saldo intacto', async ({ page }) => {
    await page.route('**/api/wallet/deposit', (route) => route.fulfill({ status: 500, body: '{}' }))

    const balanceBefore = await page.locator('[data-cy=wallet-balance]').innerText()
    await page.fill('[data-cy=input-deposit]', String(data.wallet.validAmount))
    await page.click('[data-cy=btn-deposit]')
    await page.click('[data-cy=btn-confirm]')

    await expect(page.locator('[data-cy=error-message]')).toBeVisible()
    const balanceAfter = await page.locator('[data-cy=wallet-balance]').innerText()
    expect(balanceBefore).toBe(balanceAfter)
  })
})
