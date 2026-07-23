# Il modello relazionale

**Fonte:** `05-ModelloRelazionale.pdf` — Corso di Basi di Dati (Annalisa Franco, Dario Maio, Università di Bologna)

## Quando usare questo documento

Dopo lo schema E/R e durante/dopo la traduzione logica: capire schemi, tuple, chiavi, NULL, vincoli e FK prima di scrivere DDL.

## Idee chiave

- Introdotto da Codd (1970) per l’**indipendenza dei dati**.
- Solo **valori** (niente puntatori logici); teoria per progettazione, linguaggi, ottimizzazione.
- Modello **logico**: utenti/programmatori non specificano percorsi fisici.
- Non ha costrutti E/R (entità, associazioni, gerarchie): vanno tradotti in relazioni.

## Relazione: definizione operativa

- Attributi con **nomi** (ruolo del dominio) → struttura non posizionale.
- **Tupla** su X: funzione che associa a ogni attributo un valore del dominio.
- **Schema** `R(X)`; **stato/estensione** `r` = insieme di tuple.
- Schema DB = insieme di schemi con nomi distinti + vincoli.

Proprietà (come insieme):

- tuple distinte; ordine delle tuple irrilevante; ordine attributi irrilevante (con nomi).

**Tabella ≠ relazione:** SQL può ammettere duplicati; `DISTINCT` riporta verso relazione.

## 1NF

Domini **atomici** (no array/set/liste come domini generici; eccezioni tipiche: date, stringhe). Strutture nidificate → normalizzare in 1NF (è già progettazione).

## Valori nulli

- `NULL` = assenza di valore (**non** è nel dominio). Preferire a sentinel (`01/01/00`, `-1`, …).
- `NULL ≠ NULL` in logica a 3 valori; per unicità/duplicati i DBMS trattano i NULL in modi specifici — non basarsi su uguaglianza semantica.
- Restrizioni: spesso NOT NULL su chiavi e attributi obbligatori del dominio.

## Vincoli di integrità

Proprietà che ogni stato ammissibile deve soddisfare.

| Tipo | Ambito | Esempi |
|---|---|---|
| Dominio | singolo attributo | voto ∈ [18,30] |
| Tupla | una tupla | lode solo se voto=30; lordo=netto+ritenute |
| Chiave | intra-relazionale | unicità |
| Referenziale (FK) | inter-relazionale | valori Y ⊆ PK referenziata |

### Chiavi

- **Superchiave:** nessun due tuple distinte uguali su K.
- **Chiave:** superchiave **minimale**.
- X intero è sempre superchiave → esiste sempre almeno una chiave.
- I vincoli di chiave sono sullo **schema** (realtà), non su un’estensione fortuita.

**Chiave primaria:** una chiave scelta **senza NULL**. Se nessuna chiave naturale è sempre disponibile → introdurre codice surrogato.

### Foreign key

Y in R2 sottoinsieme dei valori della chiave (di solito primaria) di R1. Nomi attributi possono differire; FK può essere verso la stessa relazione. NULL sulla FK può rilassare parzialmente il vincolo.

Notazione tipica negli schemi di progetto:

```
IMPIEGATI(CodImpiegato, Cognome, Nome, CodAgenzia)
FK: CodAgenzia REFERENCES AGENZIE
```

`*` a volte denota nullable; `Unique(A)` unicità non primaria.

## Naming

- E/R: singolare; SQL/tabelle: spesso plurale (scuola del corso nelle slide successive).
- Priorità: nomi parlanti e consistenti col glossario; allinearsi allo stack (ORM spesso vuole plurale collezione / singolare classe).

## Checklist GymDashboard

- [ ] Ogni relazione in 1NF
- [ ] PK dichiarata, NOT NULL
- [ ] Chiavi alternative → UNIQUE
- [ ] FK per ogni legame basato su valori (cliente↔contratto, listino↔acquisto, …)
- [ ] Vincoli di dominio/tupla documentati (anche se poi in CHECK/trigger/app)
- [ ] Politica NULL esplicita (niente sentinel date/stipendi)
