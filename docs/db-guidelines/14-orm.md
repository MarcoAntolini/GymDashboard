# ORM — Object-Relational Mapping

**Fonte:** `14-ORM.pdf` — Corso di Basi di Dati (Annalisa Franco, Dario Maio, Università di Bologna)

## Quando usare questo documento

Quando si sceglie come persistere il dominio applicativo rispetto allo schema relazionale: impedance mismatch, responsabilità ORM, approccio DB-first vs code-first.

## Object vs relational

| Mondo oggetti | Mondo relazionale |
|---|---|
| Identità, navigazione, ereditarietà, collezioni | Tuple, chiavi, join, 1NF, vincoli dichiarativi |
| Grafo in memoria | Insiemi e valori |

**ORM:** mappa classi ↔ tabelle, associazioni ↔ FK/join, riduce SQL ripetitivo ma non elimina il modello relazionale.

## Cosa deve restare chiaro (anche con ORM)

- Lo **schema logico** e i vincoli restano la fonte di verità per l’elaborato DB.
- L’ORM può generare schema (code-first) o mappare uno schema esistente (DB-first / scaffold).
- Query tipiche del corso (LINQ su EF Core nelle slide) equivalgono a algebra/SQL: filtrare, proiettare, join, aggregare, aggiornare.

## Approcci (EF Core nelle slide — principi generali)

- **DB first:** DB esistente → generare entità/context (scaffold).
- **Code first / model first:** modello oggetti → migrazioni verso il DB.

Tradeoff: controllo fine dello schema SQL vs velocità di sviluppo. Per un elaborato universitario di DB, spesso è preferibile **progettare lo schema relazionale esplicitamente**, poi mappare.

## Rischi da evitare

- Lasciare che l’ORM “inventi” tabelle senza passare da E/R → logico → normalizzazione.
- N+1 query / lazy loading incontrollato.
- Ignorare transazioni e isolamento perché “l’ORM salva gli oggetti”.
- Confondere ereditarietà OOP con gerarchie E/R già ristrutturate in logica.

## GymDashboard

Documentare nella relazione: schema relazionale indipendente dall’ORM; poi indicare come l’app (Prisma/Drizzle/query builder/SQL) lo usa. L’ORM non sostituisce le fasi di progettazione del corso.
