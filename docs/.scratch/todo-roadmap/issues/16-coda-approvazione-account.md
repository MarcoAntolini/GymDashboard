# 16 — Coda Approvazione Account (vista separata)

**What to build:** Admin e Owner aprono una vista dedicata (sheet/modale), separata dalla tabella Account, con tutti gli Account in attesa di Approvazione e azioni accetta/rifiuta.

**Blocked by:** 13 — RBAC Admin/Employee + landing role-aware; 14 — Ruolo Owner + gerarchia

**Status:** resolved

- [x] Ingresso UI dedicato (pulsante) che apre sheet/modale — non mescolato come unica UX della tabella Account
- [x] Elenco solo Account non approvati
- [x] Azioni approva e rifiuta (o equivalenti) con feedback chiaro
- [x] Accessibile solo a Admin e Owner; Dipendente bloccato anche via URL/azione

## Comments

- 2026-07-24 21:38 — claimed by implement loop

## Done

- Pulsante toolbar **Coda approvazione** su `/accounts` apre uno Sheet bottom dedicato (non la tabella Account).
- Server actions `getPendingAccounts` / `approveAccount` / `rejectPendingAccount` gated con `requireAdminActor` + gerarchia ruoli.
- Approva: `approved: true` + toast; Rifiuta: delete solo se ancora non approvato + toast; lista filtrata `approved === false`.
- Dipendente: `/accounts` gia Admin+ in middleware; azioni server e bottone UI rifiutano chi non e Admin+.
- Smoke: `node scripts/smoke-approval-queue.mjs`.