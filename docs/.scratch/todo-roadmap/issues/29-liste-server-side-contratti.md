# 29 — Liste server-side: Contratti

**What to build:** La lista Contratti usa le fondamenta del ticket 19: filtri applicati su Conferma, ordinamento colonna via nuova query DB, paginazione server-side. Demoabile da sola su questa entità.

**Blocked by:** 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**Status:** ready-for-agent

- [ ] List Contratti non filtra più l’intero dataset solo in frontend
- [ ] Conferma/Filtra esegue la query; keystroke nei filtri non martellano il backend
- [ ] Sort colonna → re-query con ORDER BY + paginazione corretta
- [ ] Paginazione server-side con totale/count usabile in UI
- [ ] Empty da filtri distinto da dataset vuoto (se già supportato dalla shell)
