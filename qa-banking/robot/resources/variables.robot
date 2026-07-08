*** Variables ***
# ─── URLs ────────────────────────────────────────────────────────────────────
${BASE_URL}             https://parabank.parasoft.com
${PARABANK_URL}         ${BASE_URL}/parabank
${API_BASE}             ${BASE_URL}/parabank/services/bank

# ─── Configuração do browser ─────────────────────────────────────────────────
${BROWSER}              chrome
${TIMEOUT}              15s
${SHORT_TIMEOUT}        5s

# ─── Credenciais padrão de teste ─────────────────────────────────────────────
${VALID_USERNAME}       john
${VALID_PASSWORD}       demo

# ─── Banco de dados (Docker PostgreSQL) ──────────────────────────────────────
${DB_HOST}              localhost
${DB_PORT}              5432
${DB_NAME}              banking_db
${DB_USER}              qa_user
${DB_PASS}              qa_password

# ─── Valores de transferência ────────────────────────────────────────────────
${TRANSFER_AMOUNT}      100.00
${MIN_AMOUNT}           0.01
${ZERO_AMOUNT}          0.00

# ─── Locators — Login (index.htm) ────────────────────────────────────────────
${LOC_USERNAME}         name:username
${LOC_PASSWORD}         name:password
${LOC_BTN_LOGIN}        css:input[value='Log In']
${LOC_ERROR_MSG}        css:.error
${LOC_TITLE}            css:.title
${LOC_LINK_REGISTER}    link:Register

# ─── Locators — Barra de navegação ───────────────────────────────────────────
${LOC_LINK_LOGOUT}          link:Log Out
${LOC_LINK_OVERVIEW}        link:Accounts Overview
${LOC_LINK_TRANSFER}        link:Transfer Funds
${LOC_LINK_BILLPAY}         link:Bill Pay
${LOC_LINK_OPEN_ACCOUNT}    link:Open New Account

# ─── Locators — Account Overview (overview.htm) ──────────────────────────────
${LOC_ACC_TABLE}        id:accountTable
${LOC_ACC_ROWS}         css:#accountTable tbody tr
${LOC_ACC_TOTAL}        css:#accountTable tfoot td:nth-child(2)
${LOC_ACC_LINKS}        css:#accountTable tbody tr td:first-child a

# ─── Locators — Account Activity (activity.htm) ──────────────────────────────
${LOC_BALANCE}          id:balance
${LOC_AVAIL_BALANCE}    id:availableBalance
${LOC_TRANS_TABLE}      id:transactionTable
${LOC_TRANS_ROWS}       css:#transactionTable tbody tr
${LOC_PERIOD_SELECT}    id:month
${LOC_TYPE_SELECT}      id:transactionType
${LOC_BTN_GO}           css:input[value='Go']

# ─── Locators — Transfer Funds (transfer.htm) ────────────────────────────────
${LOC_AMOUNT}           id:amount
${LOC_FROM_ACCOUNT}     id:fromAccountId
${LOC_TO_ACCOUNT}       id:toAccountId
${LOC_BTN_TRANSFER}     css:input[value='Transfer']
${LOC_SHOW_RESULT}      id:showResult

# ─── Locators — Registro (register.htm) ──────────────────────────────────────
${LOC_FIRST_NAME}       id:customer.firstName
${LOC_LAST_NAME}        id:customer.lastName
${LOC_REG_ADDRESS}      id:customer.address.street
${LOC_REG_CITY}         id:customer.address.city
${LOC_REG_STATE}        id:customer.address.state
${LOC_REG_ZIP}          id:customer.address.zipCode
${LOC_REG_PHONE}        id:customer.phoneNumber
${LOC_REG_SSN}          id:customer.ssn
${LOC_REG_USERNAME}     id:customer.username
${LOC_REG_PASSWORD}     id:customer.password
${LOC_CONFIRM_PASS}     id:repeatedPassword
${LOC_BTN_REGISTER}     css:input[value='Register']

# ─── Locators — Open Account (openaccount.htm) ───────────────────────────────
${LOC_ACC_TYPE}         id:type
${LOC_BTN_OPEN}         css:input[value='Open New Account']
${LOC_NEW_ACC_ID}       id:newAccountId
${LOC_FROM_ACC_OPT}     css:#fromAccountId option

# ─── Locators — Bill Pay (billpay.htm) ───────────────────────────────────────
${LOC_PAYEE_NAME}       name:payee.name
${LOC_PAYEE_ADDR}       name:payee.address.street
${LOC_PAYEE_CITY}       name:payee.address.city
${LOC_PAYEE_STATE}      name:payee.address.state
${LOC_PAYEE_ZIP}        name:payee.address.zipCode
${LOC_PAYEE_PHONE}      name:payee.phoneNumber
${LOC_PAYEE_ACCOUNT}    name:payee.accountNumber
${LOC_VERIFY_ACCOUNT}   name:verifyAccount
${LOC_PAY_AMOUNT}       name:amount
${LOC_BTN_SEND}         css:input[value='Send Payment']
${LOC_FROM_PAY_OPT}     css:select[name='fromAccountId'] option
