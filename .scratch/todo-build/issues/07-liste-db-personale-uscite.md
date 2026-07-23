# 07 — Liste DB: Timbrature, Account e uscite tipizzate

**What to build:** Timbrature, Account, Bollette, Attrezzatura, Interventi e Stipendi filtrano/paginano lato DB, rispettando il RBAC già in vigore (Admin dove richiesto).

**Blocked by:** 05 — Expand: ListQuery + DataTable server-mode + pilota Clienti

**Status:** ready-for-agent

- [ ] `/clockings`, `/accounts`, `/bills`, `/equipment`, `/interventions`, `/salaries` usano `listX(ListQuery)`
- [ ] Stessi requisiti di auth/role delle `getAll*` precedenti
- [ ] Filtri su id/testo/provider/maker mappati a predicati DB (niente includes solo-client)
