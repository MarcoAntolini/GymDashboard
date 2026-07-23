# 01 — Capture product context with Impeccable init

**What to build:** Il progetto ha un contesto di prodotto catturato per la dashboard OLTP della palestra (chi la usa, compiti tipici, tono UI), così i critique/fix Impeccable successivi ragionano su audience e register corretti invece che a vuoto.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

## Agent workflow (Impeccable) — obbligatorio

1. Caricare la skill Impeccable e far girare `context.mjs` sul target della dashboard.
2. Eseguire `$impeccable init` e completare il flusso fino a contesto prodotto persistito.
3. Se il codice ha già un sistema visuale stabile e manca solo la documentazione design, usare `$impeccable document` solo dove init lo indica.
4. Non implementare fix UI in questo ticket.

## Acceptance criteria

- [ ] Esiste contesto prodotto persistito leggibile dai comandi Impeccable successivi (es. PRODUCT.md / Design Context)
- [ ] Il contesto riflette dominio palestra OLTP: Amministratore vs Dipendente, operazioni quotidiane (Ingressi, Acquisti, Pagamenti), non marketing landing
- [ ] Register impostato come product/dashboard (design serves the task)
- [ ] Nessun redesign UI in questo ticket

## Glossary

Usare termini da `CONTEXT.md` e `docs/domain/01-requisiti.md` (Cliente, Dipendente, Account, Ingresso, Acquisto, Pagamento, Listino, Abbonamento, Pacchetto ingressi).
