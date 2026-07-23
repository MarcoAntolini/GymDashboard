# Introduzione al corso

**Fonte:** `00-IntroduzioneCorso.pdf` — Corso di Basi di Dati (Annalisa Franco, Università di Bologna)

## Quando usare questo documento

All’avvio del progetto GymDashboard: inquadra ruolo del DB nel sistema informativo, obiettivi dell’elaborato e perimetro (OLTP relazionale).

## Sistema informativo e base di dati

- **Sistema informativo:** insieme di procedure (informatizzate e non) che gestiscono le informazioni utili ai processi aziendali. Richiede conoscenza di processi, informazioni necessarie e struttura organizzativa.
- **Base di dati:** componente del SI dedicata alla **memorizzazione strutturata** delle informazioni; nucleo dei sistemi informativi.

## Database e DBMS

- **Database (nel corso):** collezione di dati gestita tramite DBMS, strutturati e collegati a livello logico secondo un modello (es. relazionale), residenti su strutture fisiche; interazione tipicamente via SQL.
- **DBMS:** software che gestisce le informazioni in forma **integrata**, secondo un modello logico, garantendo **persistenza**, **condivisione**, **affidabilità** e **riservatezza**.

## Tipologie di applicazioni (perimetro del corso)

| | OLTP | OLAP |
|---|---|---|
| Dati | Operazionali recenti | Storici |
| Volume | Relativamente ridotto | Grandi quantità |
| Obiettivo | Operazioni ordinarie | Decisioni strategiche |
| Esecuzione | Alta velocità, online | Tipicamente offline |
| Operazioni | Lettura/scrittura | Prevalentemente lettura |
| Tecnologia tipica | DBMS relazionali | Data warehouse |

GymDashboard è un’applicazione **OLTP** (gestione clienti, abbonamenti, timbrature, movimenti economici).

Cenni NoSQL/big data (scalabilità, replicazione, sharding, dati semi-strutturati, linguaggi meno espressivi): fuori dal focus primario del corso/elaborato.

## Attori

- **DBA:** oggetti logici, utenti/privilegi, sicurezza, integrità, monitoraggio, backup/recovery.
- **Database Designer:** modello concettuale, logico e fisico documentato.
- **Software Engineer:** requisiti, specifiche delle transazioni, implementazione.
- **End user:** naïve (solo UI/query preconfezionate) vs sophisticated (conosce struttura/DBMS).

## Obiettivi formativi rilevanti per l’elaborato

Fornire linee guida, metodi e strumenti per:

1. progettare e realizzare basi di dati relazionali;
2. interagire con basi di dati relazionali;
3. realizzare applicazioni database / moduli di SI.

## Pipeline di progettazione (indice del corso)

1. Introduzione SI / DB / DBMS
2. Progettazione concettuale (requisiti + modello E/R)
3. Modello relazionale (schemi, istanze, vincoli)
4. Forme normali e normalizzazione
5. Progettazione logica (ristrutturazione + traduzione E/R → relazionale)
6. Algebra relazionale e SQL (DDL/DML/DCL)
7. Funzionalità DBMS, transazioni (ACID, concorrenza)
8. Organizzazioni fisiche e indici
9. Accesso ai dati (JDBC, ORM, ecc.)

## Requisiti dell’elaborato (vincoli di progetto)

Realizzare significa:

1. **Progettare** il database e **documentare tutte le fasi** in una relazione;
2. **Creare** il database su un DBMS **relazionale**;
3. **Realizzare** un’applicazione che si interfacci col DB per le operazioni previste.

Tecnologie: qualsiasi DBMS relazionale; qualsiasi linguaggio (o Access).

## Checklist iniziale GymDashboard

- [ ] Dominio palestra modellato come SI OLTP (non data warehouse)
- [ ] Documentazione delle fasi: concettuale → logica → (fisica se richiesta) → implementazione
- [ ] Schema implementato su DBMS relazionale
- [ ] Applicazione che esegue le operazioni previste dalla proposta
