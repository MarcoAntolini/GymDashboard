# 26 — Liste server-side: Listino

**What to build:** La lista Listino usa le fondamenta del ticket 19: filtri applicati su Conferma, ordinamento colonna via nuova query DB, paginazione server-side. Demoabile da sola su questa entità.

**Blocked by:** 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**Status:** ready-for-agent

- [ ] List Listino non filtra più l’intero dataset solo in frontend
- [ ] Conferma/Filtra esegue la query; keystroke nei filtri non martellano il backend
- [ ] Sort colonna → re-query con ORDER BY + paginazione corretta
- [ ] Paginazione server-side con totale/count usabile in UI
- [ ] Empty da filtri distinto da dataset vuoto (se già supportato dalla shell)
