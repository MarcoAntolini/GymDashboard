# Introduzione ai Sistemi Informativi e alle Basi di Dati

**Fonte:** `01-IntroduzioneSIeBD.pdf` — Corso di Basi di Dati (Annalisa Franco, Dario Maio, Università di Bologna)

## Quando usare questo documento

Prima della modellazione: chiarisce perché usare un DBMS, cosa rende utile un’informazione, e la sequenza progettazione concettuale → logica → fisica.

## Sistema informatico ≠ sistema informativo

- **Sistema informativo:** raccolta e classificazione delle informazioni con procedure integrate, per produrre in tempo utile le sintesi necessarie a decisioni e controllo delle attività.
- **Sistema informatico:** supporto tecnologico; non coincide col SI (gran parte del SI moderno usa IT, ma il SI è più ampio).

## Classificazione dei SI

| Livello | Tipo | Decisioni | Caratteristiche tipiche delle info |
|---|---|---|---|
| Operativo | Transaction Processing System (TPS) | Strutturate | Predeterminate, dettagliate, frequenti, storiche, interne, focalizzate |
| Tattico | Management Information System (MIS) / ERP | Semi-strutturate | Integrazione processi, raccolta centralizzata |
| Direzionale | DSS / Executive Support | Non strutturate | Ad hoc, sintetiche, poco frequenti, previsionali, esterne, ampio spettro |

GymDashboard è principalmente un **TPS** (operazioni quotidiane) con possibili viste gestionali (statistiche).

## Dato vs informazione

- **Dato:** ciò che è immediatamente presente prima di ogni elaborazione (numeri, testo, immagini, …); va attribuito un significato.
- **Informazione:** elemento che consente conoscenza di fatti/situazioni.
- Dai dati alle informazioni: coreferenza, identificazione di istanze di classi, identificazione di relazioni.

### Qualità dell’informazione nel processo decisionale

- Soggettività, rilevanza, tempestività, accuratezza, presentazione, accessibilità, completezza.

## Gerarchia dei dati (file system)

Applicazione → logica di controllo → logica di gestione dati → file / record / field / byte.

## Perché non basarsi sul solo file system

Necessità: grandi quantità di dati persistenti e **condivisi**, scalabili, con esigenze applicative che cambiano nel tempo.

Limiti tipici del file system:

- astrazione povera (percorsi di accesso e modalità nel codice);
- ogni nuova esigenza richiede nuovo modulo;
- condivisione/concorrenza deboli o da implementare a mano;
- protezione da guasti insufficiente;
- vincoli di integrità “cablati” nel codice;
- assenza dei servizi di amministrazione di un DBMS.

Accettabile solo per sistemi piccoli, personali, con scarsa condivisione.

## Problemi dei sistemi informatici settoriali

- Progettazione locale → incompatibilità tra settori
- Vincoli di integrità frammentati
- **Ridondanza** → spreco memoria, inconsistenza, costi di propagazione delle modifiche
- Difficoltà di accesso, flessibilità, sicurezza, concorrenza

## Peculiarità di un DBMS

Un DBMS:

- gestisce grandi quantità di dati **persistenti e condivisi**;
- supporta almeno un **modello dei dati**;
- attua **indipendenza** programmi–dati e programmi–operazioni;
- mira a efficienza ed efficacia;
- fornisce affidabilità (fault tolerance), controllo accessi e concorrenza.

## Progettazione: punti chiave

- Analisi requisiti **incrementale** → documenti/schemi non ambigui (aspetti statici, dinamici, funzionali).
- **Divario percettivo** tra mondo reale e modello: riduce la performance del SI se non colmato.
- Costo di correzione cresce lungo il ciclo (analisi ≪ manutenzione): errori sui requisiti costano meno se trovati presto.
- **Progettazione guidata dai dati:** i dati sono più stabili delle applicazioni e sono condivisi → progettare bene il DB prima/insieme alle app.

### Pipeline progettazione DB

```
Requisiti del SI
    → Progettazione concettuale  → SCHEMA CONCETTUALE
    → Progettazione logica       → SCHEMA LOGICO
    → Progettazione fisica        → SCHEMA FISICO
```

Utenti interattivi e applicazioni consumano lo schema logico/fisico implementato.

## Implicazioni per GymDashboard

- Un solo modello dati condiviso (clienti, contratti, listino, personale, movimenti) evita silos e copie inconsistenti.
- Vincoli (unicità CF, FK abbonamento–cliente, cardinalità ingressi, …) nel DBMS, non solo nell’UI.
- Investire tempo sull’analisi requisiti e sullo schema concettuale prima del codice.
