// Seletores centralizados — única fonte de verdade para todos os specs
// Ao ajustar o HTML, basta alterar aqui; os testes não precisam de mudança

export const SEL = {

  // ── Login ────────────────────────────────────────────────────────────────
  login: {
    username:    '#username',
    password:    '#password',
    btnLogin:    '#btn-login',
    errorMsg:    '.alert-danger',
  },

  // ── Wallet ───────────────────────────────────────────────────────────────
  wallet: {
    balance:          '#wallet-balance',
    availableBalance: '#available-balance',
    depositTab:       '#btn-deposit-tab',
    withdrawalTab:    '#btn-withdrawal-tab',
    depositAmount:    '#deposit-amount',
    withdrawalAmount: '#withdrawal-amount',
    paymentMethod:    '#payment-method',
    btnDeposit:       '#btn-deposit',
    btnWithdrawal:    '#btn-withdrawal',
    successMsg:       '.alert-success',
    errorMsg:         '.alert-danger',
  },

  // ── Sportsbook ───────────────────────────────────────────────────────────
  sportsbook: {
    searchEvents:    '#search-events',
    eventList:       '.event-list',
    firstEvent:      '.event-list .event-item:first-child',
    firstEventOdds:  '.event-item:first-child .odds-value',
    betSlip:         '.bet-slip',
    betAmount:       '#bet-amount',
    btnPlaceBet:     '#btn-place-bet',
    btnCancelBet:    '#btn-cancel-bet',
    openBetsTab:     '#open-bets-tab',
    firstOpenBet:    '#open-bets-list .bet-item:first-child',
    betStatus:       '.bet-status',
    successMsg:      '.alert-success',
    errorMsg:        '.alert-danger',
    oddsChanged:     '.odds-changed-warning',
    eventUnavailable:'.event-unavailable',
  },

  // ── Histórico de Transações ──────────────────────────────────────────────
  historico: {
    table:            '#transaction-table',
    tableRows:        '#transaction-table tbody tr',
    firstRowAmount:   '#transaction-table tbody tr:first-child td.amount',
    firstRowType:     '#transaction-table tbody tr:first-child td.type',
    filterType:       '#filter-type',
    filterDateFrom:   '#filter-date-from',
    filterDateTo:     '#filter-date-to',
    filterAmountMin:  '#filter-amount-min',
    filterAmountMax:  '#filter-amount-max',
    btnApplyFilter:   '#btn-apply-filter',
    btnClearFilter:   '#btn-clear-filter',
    btnExportCsv:     '#btn-export-csv',
    noResults:        '.no-results-message',
    nextPage:         '#pagination-next',
    successMsg:       '.alert-success',
    errorMsg:         '.alert-danger',
  },

  // ── Multi-Tenant ─────────────────────────────────────────────────────────
  multitenant: {
    tenantSelector:  '#tenant-selector',
    currentTenant:   '#current-tenant-name',
    btnSwitch:       '#btn-switch-tenant',
    userCount:       '#tenant-user-count',
    balanceTotal:    '#tenant-balance-total',
    accessDenied:    '.access-denied-message',
    successMsg:      '.alert-success',
    errorMsg:        '.alert-danger',
  },

  // ── Tema ─────────────────────────────────────────────────────────────────
  tema: {
    toggle: '#theme-toggle',
  },

  // ── SpinWheel ─────────────────────────────────────────────────────────────
  spinwheel: {
    ticketBalance:    '#ticket-balance',
    btnSpin:          '#btn-spin',
    canvas:           '#spinwheel-canvas',
    resultModal:      '#spin-result-modal',
    resultPrizeName:  '#result-prize-name',
    resultPrizeValue: '#result-prize-value',
    btnRedeem:        '#btn-redeem',
    goalsSection:     '#goals-section',
    goalItem:         '.goal-item',
    goalProgressBar:  '.goal-progress-bar',
    historySection:   '#history-section',
    historyTable:     '#history-table',
    historyRow:       '.history-row',
  },
};
