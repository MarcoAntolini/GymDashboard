# Livello fisico del database

**Fonte:** `12-LivelloFisicoDB.pdf` — Corso di Basi di Dati (Annalisa Franco, Dario Maio, Università di Bologna)

## Quando usare questo documento

Dopo lo schema logico, in fase di tuning o per capire costi I/O: pagine, record, buffer — non per riscrivere il modello concettuale.

## Perché conta

Le operazioni I/O sono spesso il collo di bottiglia. Ottimizzazione fisica tramite:

- organizzazione delle tuple sui dispositivi;
- strutture di accesso (indici);
- gestione buffer;
- strategie di esecuzione query.

Il file system da solo non conosce correlazioni logiche (es. join frequenti) → il DBMS gestisce layout propri.

## Astrazioni

Applicazione (record logici) → buffer → dispositivo (blocchi/settori).

- Trasferimento per **pagine/blocchi**, non per singola tupla.
- Pagine piccole → più I/O; grandi → più frammentazione interna e buffer più grandi.
- Tipico: qualche KB (4–64 KB).

A livello fisico un DB ≈ insieme di file DBMS visti come collezioni di pagine a dimensione fissa; ogni pagina contiene più record (tuple); record = campi (attributi) fissi/variabili.

## Esempio MySQL/InnoDB (dalle slide)

- Dati/indici in `.ibd`; tablespace general vs file-per-table.
- Extent (pagine contigue), segment, header con liste extent liberi/pieni.

## Record

- Tipi SQL → formati interni (`CHAR` padded, `VARCHAR` con lunghezza, date packed, enum come interi).
- Record a lunghezza fissa (offset fissi) vs variabile (campi fissi prima, poi variabili con puntatori/prefix).
- Header record: lunghezza, id relazione, id record, timestamp, bit NULL, ecc.

## Linee guida GymDashboard

1. Non modellare “a pagine” in E/R: resta al livello logico.
2. Dopo aver misurato query lente: indici (`16-indici.md`) e organizzazioni (`15-organizzazioni-primarie.md`).
3. Tipi colonna realistici (`VARCHAR` dimensionati, date native) influenzano spazio e I/O.
4. Capire che ogni “riga letta” in piano query ≈ pagine → selettività e indici contano.
