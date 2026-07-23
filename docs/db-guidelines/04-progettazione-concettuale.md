# Progettazione concettuale

**Fonte:** `04-ProgettazioneConcettuale.pdf` — Corso di Basi di Dati (Annalisa Franco, Dario Maio, Università di Bologna)

## Quando usare questo documento

Durante l’analisi requisiti e la costruzione dello schema E/R di GymDashboard: glossario, ristrutturazione frasi, strategie di progettazione, criteri di qualità.

## Posizione nel ciclo

Raccolta e analisi requisiti si svolgono **congiuntamente** alla progettazione concettuale.

Attività principali:

1. Glossario dei termini
2. Eliminazione ambiguità (sinonimie, omonimie)
3. Raggruppamento requisiti omogenei
4. Schemi E/R parziali → integrazione in schema completo
5. Dizionario dei dati e documentazione regole aziendali (vincoli e derivazioni)
6. Documentazione a corredo dell’analisi

## Raccolta dei requisiti

### Fonti

- Utenti (interviste, documenti)
- Documentazione esistente (normative, regolamenti, procedure, sistemi preesistenti)
- Modulistica

Attività difficile e non standardizzabile; procede di pari passo con l’analisi.

### Interazione con gli utenti

- Utenti diversi → informazioni diverse sullo stesso tema
- Livelli alti → visione ampia ma meno dettagliata
- Verifiche frequenti di comprensione/coerenza
- Esempi generali e **casi limite**
- Chiedere definizioni e classificazioni
- Far evidenziare essenziale vs marginale

### Documentazione descrittiva — regole

- Corretto livello di astrazione
- Standardizzare struttura delle frasi
- Suddividere frasi articolate
- **Separare frasi sui dati da frasi sulle funzioni/operazioni**
- Glossario; unificare omonimi/sinonimi; riferimenti espliciti; riorganizzare per concetti

## Glossario dei termini

Per ogni concetto rilevante:

| Campo | Contenuto |
|---|---|
| Termine | Nome canonico |
| Descrizione | Breve definizione |
| Sinonimi | Termini equivalenti da abbandonare nel testo ristrutturato |
| Collegamenti | Altri concetti correlati |

**Omonimia:** stesso termine, concetti diversi (es. “posto” lavoro vs geografico).  
**Sinonimia:** termini diversi, stesso concetto (es. studente / partecipante).

## Tabella delle operazioni

Per ogni operazione: descrizione + **frequenza media** (es. volte/giorno).  
Serve soprattutto in progettazione logica (carichi, indici, scelte di ristrutturazione). Usare la terminologia del glossario.

## Ristrutturazione dei requisiti

1. Eliminare omonimie
2. Un termine univoco per concetto
3. Raggruppare frasi per concetto (generali, clienti, dipendenti, listino, …)

## Dai concetti allo schema E/R

Un concetto **non** è di per sé entità/attributo/associazione: dipende dal contesto.

| Rappresentare come… | Quando |
|---|---|
| **Entità** | Ha proprietà significative e esistenza autonoma |
| **Attributo** | Semplice (o composto) senza proprietà proprie |
| **Associazione** | Correla due o più concetti |
| **Generalizzazione** | Generalizza / specializza altri concetti |

## Strategie di progettazione

### Top-down

Schema astratto completo → raffinamenti successivi.

Primitive tipiche:

- Entità → gerarchia
- Entità → entità + associazioni
- Entità → entità + attributi
- Associazione → più associazioni
- Associazione → entità + associazioni

**+** non serve subito il dettaglio  
**−** richiede visione globale fin dall’inizio

### Bottom-up

Schemi parziali dettagliati → integrazione.

Primitive tipiche:

- Specifica su concetto → nuova entità
- Entità isolate → associazioni
- Entità isolate → gerarchia

**+** ripartizione del lavoro  
**−** fase di integrazione obbligatoria

### Inside-out

Partenza dai concetti principali, espansione “a macchia d’olio” (caso particolare di bottom-up).

**+** niente integrazione  
**−** a ogni passo riesaminare tutte le specifiche

### Approccio misto (consigliato in pratica)

1. Concetti principali → **schema scheletro**
2. Eventuale decomposizione sui pezzi dello scheletro
3. Raffinare, espandere, integrare

## Metodologia mista — checklist

1. **Analisi requisiti** — ambiguità, glossario, raggruppamento
2. **Passo base** — schema scheletro
3. **Decomposizione** (se utile)
4. **Passo iterativo** — raffinare + aggiungere concetti mancanti (fino a soddisfazione)
5. **Integrazione** (se decomposto) — riferirsi allo scheletro
6. **Analisi di qualità** — ripetuta e distribuita

## Qualità dello schema concettuale

| Criterio | Significato |
|---|---|
| **Correttezza** | Nessun errore sintattico né semantico |
| **Completezza** | Tutti i dati di interesse sono specificati |
| **Leggibilità** | Anche aspetti estetici dello schema |
| **Minimalità** | Individuare ridondanze; a volte sono scelte deliberate per performance |

## Applicazione a GymDashboard

1. Partire da `docs/proposta.txt` + `docs/relazione.txt` come requisiti grezzi.
2. Costruire glossario (Cliente, Dipendente, Amministratore, Abbonamento, PacchettoEntrate, Contratto, Ingresso, Timbratura, MovimentoEconomico, …).
3. Schema scheletro: Cliente / Dipendente / ProdottoListino / Movimento.
4. Raffinare con generalizzazioni (es. Abbonamento vs Pacchetto), associazioni (acquisto, ingresso, stipendio), attributi e cardinalità.
5. Tabella operazioni con frequenze stimate (ingresso quotidiano ≫ inserimento listino).
6. Verificare qualità prima della progettazione logica.
