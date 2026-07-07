*** Variables ***
# ── URLs iGaming ──────────────────────────────────────────────────────────────
${IGAMING_BASE_URL}         https://igaming-qa.example.com
${IGAMING_WALLET_URL}       ${IGAMING_BASE_URL}/account/wallet
${IGAMING_HISTORY_URL}      ${IGAMING_BASE_URL}/account/transactions
${IGAMING_SPORTSBOOK_URL}   ${IGAMING_BASE_URL}/sportsbook
${IGAMING_ADMIN_URL}        ${IGAMING_BASE_URL}/admin/tenants

# ── Credenciais de teste iGaming ──────────────────────────────────────────────
${IGAMING_USER}             player01
${IGAMING_PASS}             Senha@123
${IGAMING_ADMIN_USER}       admin_qa
${IGAMING_ADMIN_PASS}       Admin@Seguro1

# ── Configurações de browser ──────────────────────────────────────────────────
${TIMEOUT}                  15s
${SHORT_TIMEOUT}            5s
${BROWSERS}                 chrome    firefox    edge

# ── Valores padrão ────────────────────────────────────────────────────────────
${DEPOSIT_AMOUNT}           200.00
${WITHDRAWAL_AMOUNT}        50.00
${BET_AMOUNT}               25.00
${ZERO_AMOUNT}              0.00
${OVER_LIMIT_AMOUNT}        50000.00

# ── Locators — Login iGaming ──────────────────────────────────────────────────
${LOC_LOGIN_USERNAME}       id:username
${LOC_LOGIN_PASSWORD}       id:password
${LOC_LOGIN_BTN}            id:btn-login
${LOC_LOGIN_ERROR}          css:.alert-danger

# ── Locators — Wallet ─────────────────────────────────────────────────────────
${LOC_WALLET_BALANCE}       id:wallet-balance
${LOC_DEPOSIT_TAB}          id:btn-deposit-tab
${LOC_WITHDRAWAL_TAB}       id:btn-withdrawal-tab
${LOC_DEPOSIT_AMOUNT}       id:deposit-amount
${LOC_WITHDRAWAL_AMOUNT}    id:withdrawal-amount
${LOC_PAYMENT_METHOD}       id:payment-method
${LOC_CONFIRM_DEPOSIT}      id:btn-deposit
${LOC_CONFIRM_WITHDRAWAL}   id:btn-withdrawal
${LOC_WALLET_SUCCESS}       css:.alert-success
${LOC_WALLET_ERROR}         css:.alert-danger

# ── Locators — Sportsbook ─────────────────────────────────────────────────────
${LOC_SEARCH_EVENTS}        id:search-events
${LOC_FIRST_EVENT}          css:.event-list .event-item:first-child
${LOC_ODDS_VALUE}           css:.event-item:first-child .odds-value
${LOC_BET_AMOUNT}           id:bet-amount
${LOC_PLACE_BET}            id:btn-place-bet
${LOC_CANCEL_BET}           id:btn-cancel-bet
${LOC_OPEN_BETS_TAB}        id:open-bets-tab
${LOC_FIRST_OPEN_BET}       css:#open-bets-list .bet-item:first-child
${LOC_SB_SUCCESS}           css:.alert-success
${LOC_SB_ERROR}             css:.alert-danger

# ── Locators — Histórico ──────────────────────────────────────────────────────
${LOC_TRANS_TABLE}          id:transaction-table
${LOC_FILTER_TYPE}          id:filter-type
${LOC_FILTER_DATE_FROM}     id:filter-date-from
${LOC_FILTER_DATE_TO}       id:filter-date-to
${LOC_APPLY_FILTER}         id:btn-apply-filter
${LOC_TRANS_ROWS}           css:#transaction-table tbody tr
${LOC_NO_RESULTS}           css:.no-results-message
${LOC_EXPORT_CSV}           id:btn-export-csv

# ── Mensagens esperadas ────────────────────────────────────────────────────────
${MSG_DEPOSIT_OK}           Depósito realizado com sucesso
${MSG_WITHDRAWAL_OK}        Saque realizado com sucesso
${MSG_BET_OK}               Aposta registrada com sucesso
${MSG_BET_CANCELLED}        Aposta cancelada com sucesso
${MSG_INSUFFICIENT}         Saldo insuficiente para esta operação
${MSG_DAILY_LIMIT}          Limite diário de saque excedido
${MSG_INVALID_AMOUNT}       Valor inválido informado
${MSG_ACCESS_DENIED}        Acesso negado
${MSG_NO_TRANSACTIONS}      Nenhuma transação encontrada
