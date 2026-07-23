# 14 — Ruolo Owner + gerarchia (Owner > Admin > Employee)

**What to build:** Esiste il ruolo Owner sopra Admin. Possono esserci più Owner. Ogni ruolo può creare/modificare/promuovere/degradare solo ruoli strettamente inferiori. Gli Admin non gestiscono altri Admin né Owner. L’Owner può nascere da qualsiasi percorso di creazione Account; chi ha accesso al DB gestisce eventuali promozioni a Owner.

**Blocked by:** 11 — Mutazioni: allowlist campi editabili; 13 — RBAC Admin/Employee + landing role-aware

**Status:** claimed

- [ ] Enum/ruolo Owner presente in schema, session e RBAC
- [ ] Owner gestisce Admin e Dipendente; Admin gestisce solo Dipendente; Dipendente non gestisce ruoli
- [ ] UI e server actions rifiutano tentativi di toccare pari grado o superiori
- [ ] Più Owner ammessi; nessuna auto-promozione a Owner dall’UI Admin
- [ ] Route/azioni riservate Owner (gestione Admin) protette anche via URL diretto

## Comments

- 2026-07-23 — claimed by ticket-loop cloud worker
