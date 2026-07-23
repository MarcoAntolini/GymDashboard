# 07 — Loading, error, and empty states on entity shell

**What to build:** La shell condivisa delle pagine entità gestisce caricamento, fallimento fetch e lista vuota senza lasciare l’operatore bloccato: niente spinner infinito, empty che insegna la prossima azione, errore con recovery.

**Blocked by:** 04 — Core entity tables: columns, filters, formatting; 05 — CRUD actions and form feedback

**Status:** ready-for-agent

## Agent workflow (Impeccable) — obbligatorio

1. Caricare Impeccable + `context.mjs`.
2. `$impeccable critique` o `$impeccable audit` sulla shell entità (stati, a11y feedback).
3. Fix con `$impeccable harden` e `$impeccable onboard` (empty / first-run guidance sulla shell tabella).
4. `$impeccable polish` sulla shell condivisa.
5. Verificare: successo, empty, errore simulato/forzato sul fetch lista.

## Acceptance criteria

- [ ] Se il caricamento lista fallisce, lo spinner non resta indefinito: compare stato errore con possibilità di riprovare o messaggio actionable
- [ ] Loading state è coerente sulla shell condivisa (stesso pattern tra entità toccate)
- [ ] Empty state (zero record, non solo filtri) spiega cosa fare dopo (es. crea Cliente / registra Ingresso) senza jargon tecnico
- [ ] Empty da filtri resta distinto da empty dataset, se entrambi esistono
- [ ] Critique/audit Impeccable eseguito; P0/P1 su stati risolti o deferred con motivo

## Glossary

Allineare copy empty/error ai termini di dominio della pagina (Cliente, Ingresso, …).
