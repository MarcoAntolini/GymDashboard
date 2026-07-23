# Funzionalità e architetture dei DBMS

**Fonte:** `10-FunzionalitàDBMS.pdf` — Corso di Basi di Dati (Annalisa Franco, Università di Bologna)

## Quando usare questo documento

Per inquadrare cosa offre il DBMS oltre tabelle/SQL, l’architettura a 3 livelli, viste, privilegi e dove colloca GymDashboard (app web 3-tier su RDBMS).

## Cos’è un DBMS

Insieme di programmi per **definire**, **costruire**, **manipolare** e **condividere** una base di dati:

- specificare tipi, struttura, vincoli;
- memorizzare su supporto gestito dal DBMS;
- interrogare e aggiornare;
- accesso concorrente multiutente.

### Funzionalità principali

| Area | Contenuto |
|---|---|
| Memorizzare | Uno o più modelli dei dati; grandi volumi persistenti e condivisi |
| Descrivere | Catalogo / metadati (schemi, vincoli, formati) |
| Usare | Viste multiple; linguaggi alto livello (DDL/DML/DCL) |
| Separare | Indipendenza programmi–dati e dati–operazioni |
| Affidabilità | Controllo accessi, concorrenza, fault tolerance |

## Modelli dei dati e famiglie di sistemi

Un modello dei dati descrive dati, associazioni e vincoli (meccanismi di strutturazione diversi).

| Famiglia | Caratteristiche |
|---|---|
| **RDBMS** | Tabelle, SQL, forti garanzie ACID |
| **NoSQL** | Document/key-value/column/graph; scalabilità orizzontale; schema flessibile; consistenza spesso rilassata |
| **NewSQL / Distributed SQL** | Relazionale + SQL + ACID in ambienti distribuiti/cloud |

Esempio slide: modello a documenti (JSON) aggrega dati (meno join, più performance locali) ma introduce ridondanza/inconsistenza possibili — vs schema relazionale normalizzato con FK.

**GymDashboard / elaborato:** perimetro **RDBMS**.

## Natura autodescrittiva e catalogo

Il DB contiene dati **e** metadati (struttura file, tipi, vincoli). Il catalogo (tabelle, attributi, indici, …) è usato dal DBMS e dagli utenti per conoscere l’organizzazione.

## Indipendenza e architettura a 3 livelli

| Indipendenza | Significato |
|---|---|
| **Fisica** | Cambiare file/indici/strutture senza cambiare schema logico, programmi, viste |
| **Logica** | Cambiare schema logico senza (idealmente) cambiare viste esterne e applicazioni |

Livelli:

1. **Esterno** — viste per utenti/applicazioni
2. **Logico** — modello dei dati integrato
3. **Interno/fisico** — file, indici, strutture (responsabilità DBA)

Ogni livello protegge quelli superiori dai cambiamenti inferiori.

### Utilità delle viste

- Visione personalizzata
- Mascherare ristrutturazioni dello schema
- Controllo accessi (nascondere dati riservati)
- Calcolare dati derivati senza ridondanza memorizzata

### Condivisione e privilegi

Utenti diversi → autorizzazioni diverse (es. studente / docente / segreteria). DBA concede privilegi; DCL SQL semplifica `GRANT`/`REVOKE`.

## Concorrenza, guasti, ACID

Accessi concorrenti non devono violare integrità. Modifiche multi-step incomplete → annullare (transazione = sequenza R/W da stato consistente a stato consistente).

ACID (sintesi): Atomicity, Consistency, Isolation, Durability — dettaglio in `11-transazioni.md`.

## Linguaggi

- **DDL** — schemi (logici, esterni, interni)
- **DML** — interrogare/modificare
- **DCL** — accessi e amministrazione

SQL riunisce le tre tipologie nei RDBMS.

## Applicazioni e accesso al DB

L’app non “vede” il disco: passa da driver/API, ORM, o (in casi specifici) stored procedure/trigger.

## Moduli tipici di un DBMS

Query manager · Transaction manager · DDL compiler · Storage manager · Logging & Recovery · Concurrency manager.

## Utenti

- **DBA:** schema, privilegi, sicurezza, backup/recovery, performance
- **Application programmers:** API/driver/ORM
- **End users:** naïve / occasional / power

## Architetture applicative

| | Idea | Note |
|---|---|---|
| **1-tier** | Tutto sulla stessa macchina; accesso diretto | Solo locali/prototipi/didattica |
| **2-tier** | Client ↔ DB | Client spesso con logica |
| **3-tier** | Client ↔ Application server ↔ DB | Riferimento per web/cloud: scalabilità, sicurezza (no accesso diretto DB), manutenibilità; più complessità |

Evoluzioni: distribuzione, DB centralizzato vs distribuito, replicato, federato, **cloud / DBaaS** (alta disponibilità e scalabilità vs dipendenza provider, latenza, compliance).

## Implicazioni GymDashboard

- App Next.js tipicamente **3-tier** (browser → server app → RDBMS).
- Schema logico stabile; indici/fisico come ottimizzazione successiva.
- Ruoli: amministratore vs dipendente confermato (privilegi / controlli applicativi + DB se possibile).
- Transazioni e vincoli nel DBMS, non solo in UI.
