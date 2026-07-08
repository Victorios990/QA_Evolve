package com.banking.qa.utils;

public final class Messages {

    private Messages() {}

    // ── Carteira / Wallet ────────────────────────────────────────────────────
    public static final String DEPOSIT_SUCCESS        = "Depósito realizado com sucesso";
    public static final String WITHDRAWAL_SUCCESS     = "Saque realizado com sucesso";
    public static final String INSUFFICIENT_BALANCE   = "Saldo insuficiente para esta operação";
    public static final String DAILY_LIMIT_EXCEEDED   = "Limite diário de saque excedido";
    public static final String INVALID_AMOUNT         = "Valor inválido informado";
    public static final String WALLET_BALANCE_UPDATED = "Saldo atualizado";
    public static final String DUPLICATE_TRANSACTION  = "Transação duplicada detectada";

    // ── Sportsbook / Apostas ─────────────────────────────────────────────────
    public static final String BET_PLACED_SUCCESS    = "Aposta registrada com sucesso";
    public static final String BET_CANCELLED_SUCCESS = "Aposta cancelada com sucesso";
    public static final String BET_SETTLED_WIN       = "Aposta liquidada — Ganhou";
    public static final String BET_SETTLED_LOSS      = "Aposta liquidada — Perdeu";
    public static final String ODDS_CHANGED          = "As odds foram alteradas";
    public static final String EVENT_NOT_AVAILABLE   = "Evento não disponível para apostas";
    public static final String BET_BELOW_MINIMUM     = "Valor abaixo do mínimo permitido para apostas";
    public static final String BET_ABOVE_MAXIMUM     = "Valor acima do máximo permitido para apostas";

    // ── Histórico de Transações ──────────────────────────────────────────────
    public static final String NO_TRANSACTIONS_FOUND = "Nenhuma transação encontrada";
    public static final String EXPORT_SUCCESS        = "Exportação concluída com sucesso";
    public static final String INVALID_DATE_RANGE    = "Período de datas inválido";

    // ── Multi-tenant ─────────────────────────────────────────────────────────
    public static final String ACCESS_DENIED         = "Acesso negado";
    public static final String TENANT_SWITCH_SUCCESS = "Tenant alternado com sucesso";
    public static final String UNAUTHORIZED_TENANT   = "Você não tem permissão para acessar este tenant";
    public static final String DATA_ISOLATION_OK     = "Isolamento de dados entre tenants validado";

    // ── Login / Autenticação ─────────────────────────────────────────────────
    public static final String LOGIN_SUCCESS         = "Login realizado com sucesso";
    public static final String LOGIN_FAILED          = "Usuário ou senha inválidos";
    public static final String SESSION_EXPIRED       = "Sessão expirada, faça login novamente";
    public static final String LOGOUT_SUCCESS        = "Logout realizado com sucesso";

    // ── Genéricas ────────────────────────────────────────────────────────────
    public static final String REQUIRED_FIELD        = "Campo obrigatório não preenchido";
    public static final String OPERATION_SUCCESS     = "Operação realizada com sucesso";
    public static final String UNEXPECTED_ERROR      = "Erro inesperado. Tente novamente";
    public static final String NETWORK_ERROR         = "Erro de conexão. Verifique sua rede";
}
