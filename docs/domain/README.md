# Dominio GymDashboard

Documentazione di analisi e progettazione concettuale/logica, allineata alle linee guida in `docs/db-guidelines/` e al glossario in [`CONTEXT.md`](../../CONTEXT.md).

| Documento | Contenuto |
|---|---|
| [01-requisiti.md](./01-requisiti.md) | Requisiti ristrutturati, glossario tabellare, operazioni, decisioni su `relazione.txt` |
| [02-schema-er.md](./02-schema-er.md) | Schema E/R: entità, gerarchie, cardinalità, identificatori, regole aziendali |
| [03-schema-logico.md](./03-schema-logico.md) | Schema logico: ristrutturazione, ridondanze, NF, mapping Prisma, breaking changes |
| [04-viste-colonne.md](./04-viste-colonne.md) | Matrice viste CRUD: colonne `native` \| `join` \| `derived` \| `snapshot` |
| [05-mutazioni-allowlist.md](./05-mutazioni-allowlist.md) | Allowlist create/update: `create` \| `update` \| `immutable` \| Admin-only \| write-only |

Pipeline corso: requisiti → concettuale → logica (qui) → fisica/SQL / migrazione applicativa (`docs/db-guidelines/`).
