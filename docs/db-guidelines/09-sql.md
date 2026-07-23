# SQL — linee guida

**Fonte:** `09-SQL.pdf` — Corso di Basi di Dati (Annalisa Franco, Dario Maio, Università di Bologna)

## Quando usare questo documento

Implementazione dello schema e delle operazioni di GymDashboard: DDL (tabelle/vincoli), DML, viste, pattern di query.

## Caratteristiche generali

- Standard de facto: **DDL + DML + DCL**.
- Dichiarativo; relazionalmente completo rispetto all’algebra.
- Modello a **tabelle** (duplicati ammessi; a volte ordine colonne rilevante) — pragmatico.
- Logica a **3 valori** (TRUE / FALSE / UNKNOWN) con NULL.

## DDL — definizione schema

`CREATE TABLE`: attributi (dominio, DEFAULT, vincoli di colonna) + vincoli di tabella.

Vincoli tipici da portare dallo schema logico:

| Vincolo | Uso |
|---|---|
| `PRIMARY KEY` | Chiave primaria (NOT NULL implicito) |
| `UNIQUE` | Chiavi candidate / identificatori alternativi |
| `NOT NULL` | Attributi obbligatori |
| `FOREIGN KEY … REFERENCES` | Integrità referenziale (+ azioni ON DELETE/UPDATE se supportate) |
| `CHECK` | Vincoli di dominio/tupla |
| Domini / DEFAULT | Valori ammissibili e default |

`ALTER TABLE` / `DROP` per evoluzione schema. Indici e viste fanno parte del DDL “ampio”.

## DML — interrogazione e aggiornamento

- `SELECT` ≈ selezione + proiezione (+ join); `DISTINCT` per avvicinarsi alle relazioni.
- Predicati: confronti, `BETWEEN`, `IN`, `LIKE`, espressioni, alias.
- NULL: confronti con NULL → UNKNOWN; usare `IS NULL` / `IS NOT NULL`.
- Join: implicito in `WHERE`, o esplicito (`JOIN` / `OUTER JOIN`); self-join con alias.
- Operatori insiemistici: `UNION`, `INTERSECT`, `EXCEPT` (schemi compatibili).
- Aggiornamento: `INSERT` (singolo/multiplo), `UPDATE`, `DELETE`.
- Aggregati: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`; `GROUP BY`; filtri gruppi con `HAVING`.
- Subquery: scalari, `EXISTS`, correlate; spesso riscrivibili con join (“unnesting”).
- Divisione relazionale esprimibile con subquery / conteggi (attenzione: conteggio semplice non sempre corretto).

## Viste

Tabelle virtuali (`CREATE VIEW`).

Scopi tipici:

- indipendenza logica;
- semplificare query complesse;
- sicurezza/proiezione di dati.

Aggiornabilità limitata (dipende da join/aggregati). `WITH CHECK OPTION` per vincolare gli update via vista. CTE (`WITH`) e ricorsione per chiusure / gerarchie.

## Checklist schema GymDashboard

- [ ] `CREATE TABLE` allineati a PK/FK/UNIQUE/CHECK dello schema logico
- [ ] Politica NULL coerente con E/R (opzionali vs obbligatori)
- [ ] Query delle operazioni della proposta esprimibili (e testabili) in SQL
- [ ] Viste per report/statistiche se semplificano senza rompere aggiornamenti critici
