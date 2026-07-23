# Linee guida DB — indice

Reference operative estratte dalle dispense del corso di **Basi di Dati** (Annalisa Franco / Dario Maio, Università di Bologna) per progettare e documentare il database di **GymDashboard**.

I PDF originali restano fuori repo (`…/Universita/DB/Lezioni/`). Qui ci sono sintesi metodologiche, non trascrizioni slide-per-slide.

## Come usarli nel progetto

Dominio GymDashboard (requisiti + E/R): `docs/domain/` e glossario `CONTEXT.md`.

Ordine consigliato per l’elaborato:

1. Requisiti dominio → `docs/domain/01-requisiti.md` (fonti: `proposta.txt`, `relazione.txt`)
2. Contesto SI/DB → `00`, `01`, `02`
3. Schema concettuale E/R → `03`, `04` + `docs/domain/02-schema-er.md`
4. Schema logico relazionale → `05`, `06`, `07`
5. Interrogazioni e implementazione SQL → `08`, `09`
6. Runtime DBMS → `10`, `11`
7. Fisico / indici (se richiesto o per tuning) → `12`, `15`, `16`
8. Accesso da applicazione → `13`, `14`

## Documenti

| File | Fonte PDF | Fase |
|---|---|---|
| [00-introduzione-corso.md](./00-introduzione-corso.md) | `00-IntroduzioneCorso.pdf` | Perimetro elaborato, OLTP |
| [01-introduzione-si-bd.md](./01-introduzione-si-bd.md) | `01-IntroduzioneSIeBD.pdf` | Perché DBMS, pipeline |
| [02-progettazione-db.md](./02-progettazione-db.md) | `02-ProgettazioneDB.pdf` | Astrazioni, cardinalità |
| [03-modello-er.md](./03-modello-er.md) | `03-ModelloER.pdf` | Costrutti E/R |
| [04-progettazione-concettuale.md](./04-progettazione-concettuale.md) | `04-ProgettazioneConcettuale.pdf` | Requisiti → E/R, qualità |
| [05-modello-relazionale.md](./05-modello-relazionale.md) | `05-ModelloRelazionale.pdf` | Relazioni, chiavi, FK, NULL |
| [06-progettazione-logica.md](./06-progettazione-logica.md) | `06-ProgettazioneLogica.pdf` | Ristrutturazione + mapping |
| [07-normalizzazione.md](./07-normalizzazione.md) | `07-Normalizzazione.pdf` | FD, 1NF–BCNF |
| [08-algebra-relazionale.md](./08-algebra-relazionale.md) | `08-AlgebraRelazionale.pdf` | Operatori, ragionamento query |
| [09-sql.md](./09-sql.md) | `09-SQL.pdf` | DDL/DML/viste |
| [10-funzionalita-dbms.md](./10-funzionalita-dbms.md) | `10-FunzionalitàDBMS.pdf` | Servizi DBMS, indipendenza |
| [11-transazioni.md](./11-transazioni.md) | `11-Transazioni.pdf` | ACID, isolamento |
| [12-livello-fisico.md](./12-livello-fisico.md) | `12-LivelloFisicoDB.pdf` | Pagine, record, I/O |
| [13-jdbc.md](./13-jdbc.md) | `13-JDBC.pdf` | Principi data-access |
| [14-orm.md](./14-orm.md) | `14-ORM.pdf` | Mapping oggetti↔relazioni |
| [15-organizzazioni-primarie.md](./15-organizzazioni-primarie.md) | `15-OrganizzazioniPrimarie.pdf` | Heap/ordinato/hash |
| [16-indici.md](./16-indici.md) | `16-Indici.pdf` | B-tree/B+-tree, quando indicizzare |

## Note

- Cartella `_raw/`: testo estratto dai PDF (supporto alla stesura; non è materiale da citare nella relazione).
- In caso di dubbio tra questa sintesi e le slide ufficiali, prevalgono le dispense del corso su Virtuale.
