# 16 — Coda Approvazione Account (vista separata)

**What to build:** Admin e Owner aprono una vista dedicata (sheet/modale), separata dalla tabella Account, con tutti gli Account in attesa di Approvazione e azioni accetta/rifiuta.

**Blocked by:** 13 — RBAC Admin/Employee + landing role-aware; 14 — Ruolo Owner + gerarchia

**Status:** resolved

- [x] Ingresso UI dedicato (pulsante) che apre sheet/modale — non mescolato come unica UX della tabella Account
- [x] Elenco solo Account non approvati
- [x] Azioni approva e rifiuta (o equivalenti) con feedback chiaro
- [x] Accessibile solo a Admin e Owner; Dipendente bloccato anche via URL/azione

## Comments

- 2026-07-23 — claimed by implement loop (cloud)

## Done

- Toolbar **Approvazione** on Accounts opens a dedicated bottom Sheet (not table-only UX).
- Sheet lists `approved: false` via `getPendingAccounts`; Approva / Rifiuta with toasts + reject confirm (delete).
- Server actions `approveAccount` / `rejectAccount` gated by `requireRole("Admin")` + ticket-14 hierarchy; Employee blocked by middleware on `/accounts`.
- Domain helpers `canActOnPendingAccount` / `filterApprovableAccounts` + unit tests.
