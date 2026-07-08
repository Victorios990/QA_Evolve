const SEL = {
  auth: {
    username: '[data-cy=username]',
    password: '[data-cy=password]',
    btnLogin: '[data-cy=btn-login]',
    errorMsg: '[data-cy=error-message]',
    tenantSelector: '[data-cy=tenant-select]',
  },
  wallet: {
    balance: '[data-cy=wallet-balance]',
    inputDeposit: '[data-cy=input-deposit]',
    inputWithdraw: '[data-cy=input-withdraw]',
    btnDeposit: '[data-cy=btn-deposit]',
    btnWithdraw: '[data-cy=btn-withdraw]',
    confirmModal: '[data-cy=confirm-modal]',
    btnConfirm: '[data-cy=btn-confirm]',
    successMsg: '[data-cy=success-message]',
    errorMsg: '[data-cy=error-message]',
  },
  sportsbook: {
    searchEvent: '[data-cy=search-event]',
    eventCard: '[data-cy=event-card]',
    oddValue: '[data-cy=odd-value]',
    betSlip: '[data-cy=bet-slip]',
    betAmount: '[data-cy=bet-amount]',
    btnPlaceBet: '[data-cy=btn-place-bet]',
    btnCancelBet: '[data-cy=btn-cancel-bet]',
    potentialWin: '[data-cy=potential-win]',
    oddChangeAlert: '[data-cy=odd-change-alert]',
  },
  casino: {
    gameGrid: '[data-cy=game-grid]',
    gameCard: '[data-cy=game-card]',
    launchGame: '[data-cy=btn-launch-game]',
    gameFrame: '[data-cy=game-iframe]',
    btnExit: '[data-cy=btn-exit-game]',
  },
  history: {
    table: '[data-cy=transaction-table]',
    row: '[data-cy=transaction-row]',
    filterType: '[data-cy=filter-type]',
    filterDate: '[data-cy=filter-date]',
    filterStatus: '[data-cy=filter-status]',
    btnExport: '[data-cy=btn-export-csv]',
    pagination: '[data-cy=pagination]',
  },
  multitenant: {
    tenantBadge: '[data-cy=tenant-badge]',
    tenantSwitch: '[data-cy=tenant-switch]',
  },
}

module.exports = SEL
