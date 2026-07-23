# Transazioni

**Fonte:** `11-Transazioni.pdf` — Corso di Basi di Dati (Annalisa Franco, Università di Bologna)

## Quando usare questo documento

Operazioni multi-step di GymDashboard che devono riuscire o fallire insieme: registrazione ingresso + decremento pacchetto; pagamento stipendio; conferma dipendente; movimenti economici correlati.

## Cos’è una transazione

Unità logica di elaborazione: sequenza di operazioni sul DB trattata come tutto-o-niente rispetto alle proprietà ACID.

## Proprietà ACID

| | Significato operativo |
|---|---|
| **Atomicity** | O tutte le modifiche della transazione sono rese permanenti, o nessuna (abort → undo) |
| **Consistency** | Da stato consistente a stato consistente (vincoli rispettati) |
| **Isolation** | Effetto come se le transazioni concorrenti fossero eseguite in isolamento |
| **Durability** | Dopo commit, gli effetti sopravvivono ai guasti |

## Anomalie di concorrenza (da prevenire)

- **Lost update** — aggiornamento perso (dipendenza write→write)
- **Dirty read** — lettura di dati non committed (+ rischio cascading abort)
- **Non-repeatable read** — due letture diverse nella stessa transazione
- **Phantom row** — nuove tuple appaiono in riesecuzione di un predicato di range

## Controllo di concorrenza (sintesi)

- Lock condivisi/esclusivi; matrici di compatibilità.
- **2PL** (two-phase locking): fase crescente di acquisizione, poi solo rilascio.
- **Strict 2PL:** lock tenuti fino a commit/abort → evita lost update e dirty read; supporta repeatable read.
- Phantom: richiede locking su predicati/indici (non solo su tuple già lette).

## Livelli di isolamento SQL

Dal meno al più restrittivo (nomi standard):

1. `READ UNCOMMITTED` — consente dirty read
2. `READ COMMITTED` — no dirty read; possibili non-repeatable / phantom
3. `REPEATABLE READ` — no dirty / non-repeatable; phantom possibili (InnoDB li mitiga in parte)
4. `SERIALIZABLE` — isolamento più forte

Tradeoff: più isolamento ⇒ meno anomalie, più contesa/blocchi.

In MySQL/InnoDB: `BEGIN`/`COMMIT`/`ROLLBACK`; savepoint; row-level locking + intention lock.

## Affidabilità (Atomicity + Durability)

- Log, protocollo **WAL** (Write Ahead Log)
- Undo di transazioni abortite; recovery da transaction/system/media failure
- Checkpoint; politiche buffer STEAL/NO STEAL, FORCE/NO FORCE

## Linee guida GymDashboard

1. Ogni use case che modifica più tabelle → **una transazione**.
2. Scegliere isolamento adeguato (per OLTP tipico: almeno `READ COMMITTED` / `REPEATABLE READ`).
3. Tenere le transazioni **corte** (meno lock prolungati).
4. Non basarsi solo sull’UI per “atomicità” di ingresso+saldo pacchetto.
5. Testare scenari concorrenti (due ingressi simultanei sullo stesso pacchetto).
