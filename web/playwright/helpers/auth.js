const path = require('path')

const STORAGE_STATES = {
  'operator-a': path.resolve(__dirname, '../fixtures/storage-state-a.json'),
  'operator-b': path.resolve(__dirname, '../fixtures/storage-state-b.json'),
}

async function loginAndSaveState(page, tenant, users) {
  const user = users[tenant]
  await page.goto('/login')
  await page.selectOption('[data-cy=tenant-select]', tenant)
  await page.fill('[data-cy=username]', user.username)
  await page.fill('[data-cy=password]', user.password)
  await page.click('[data-cy=btn-login]')
  await page.waitForURL('**/dashboard')
  await page.context().storageState({ path: STORAGE_STATES[tenant] })
}

module.exports = { loginAndSaveState, STORAGE_STATES }
