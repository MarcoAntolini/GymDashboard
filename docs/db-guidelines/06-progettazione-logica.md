# Progettazione logica

**Fonte:** `06-ProgettazioneLogica.pdf` — Corso di Basi di Dati (Annalisa Franco, Dario Maio, Università di Bologna)

## Quando usare questo documento

Tradurre lo schema E/R di GymDashboard in schema relazionale: ristrutturazione (gerarchie, multivalore, ridondanze) + regole di mapping + scelta PK.

## Obiettivo

Da schema concettuale → schema logico **fedele** ed **efficiente**.

- Fedeltà ≈ stessa capacità informativa / stessi stati legali (equivalenza).
- Struttura che preserva informazione + vincoli che garantiscono equivalenza (alcuni vincoli non esprimibili solo in DDL SQL).

## Due fasi

1. **Ristrutturazione** dello schema E/R (eliminare costrutti non direttamente rappresentabili / ottimizzare).
2. **Traduzione** dei costrutti residui in relazioni.

### Indicatori di carico (ristrutturazione)

- Tavola dei **volumi** (istanze stimate per entità/associazioni).
- Operazioni: tipo I/B, frequenza, schema di navigazione, tavola accessi (L/S; scrittura ≈ 2× lettura).
- Regola **80-20**: ~20% operazioni → ~80% carico.

## Analisi delle ridondanze

Ridondanza = informazione significativa ma **derivabile**.

| Se si mantiene | Effetto |
|---|---|
| Pro | query più semplici/veloci |
| Contro | aggiornamenti più pesanti, più spazio |

Tipi: attributi derivabili; associazioni derivabili (cicli). Decidere confrontando accessi×frequenza (± spazio).

## Eliminazione delle gerarchie

Il relazionale non le rappresenta direttamente. Tre alternative (+ ibridi):

| Alternativa | Idea | Quando conviene |
|---|---|---|
| **Collasso verso l’alto** | Figlie nel padre + selettore Tipo / flag | Accessi padre+figlie contestuali |
| **Collasso verso il basso** | Padre nelle figlie | Accessi alle figlie distinti; solo se copertura **totale** (e attenzione se sovrapposta → ridondanza) |
| **Sostituzione con associazioni** | Padre e figlie restano; figlie identificate esternamente | Accessi figlie separati dal padre; sempre applicabile |

Copertura e selettori:

- (T,E): N valori di Tipo
- (P,E): N+1 valori
- Sovrapposta: N flag booleani (o equivalenti)

Associazioni delle figlie migrano sul padre nel collasso alto; min-card spesso → 0.

## Partizionamenti e accorpamenti

Principio: **tieni insieme ciò che si usa insieme**.

- Partizionamento verticale entità (anagrafici vs lavorativi)
- Partizionamento orizzontale associazioni
- Accorpamenti entità/associazioni ad accesso congiunto

## Eliminazione attributi multivalore

1. Nuova entità + associazione (1:N o N:M)
2. Se max noto = K → K attributi monovalore (rigido)
3. Se il valore è unico nell’estensione → può identificare la nuova entità
4. Se i valori possono ripetersi → numero d’ordine / meglio modellare l’evento (es. gol con minuto)

Duplicati in multivalore spesso segnalano modello incompleto.

## Scelta degli identificatori principali

Tra gli identificatori E/R, sceglierne uno come **chiave primaria** (preferire interni semplici, stabili, senza NULL). Altri → UNIQUE.

## Traduzione E/R → relazionale (regole operative)

Dopo ristrutturazione tipica:

1. **Entità forte** → relazione con attributi semplici; PK = identificatore interno scelto.
2. **Entità debole** → relazione con attributi + PK che include PK del dominante (FK).
3. **Associazione 1:1** → FK su uno dei due lati (preferire lato con partecipazione obbligatoria / meno NULL); UNIQUE sulla FK se 1:1 stretto.
4. **Associazione 1:N** → FK sul lato “N”.
5. **Associazione N:M** → relazione ponte con PK composta (o surrogato + UNIQUE sui partecipanti) + FK verso entrambe; attributi dell’associazione sulla ponte.
6. **n-aria** → relazione con FK verso tutti i partecipanti (+ attributi); PK secondo le FD/cardinalità.
7. **Attributi composti** → aplanare in attributi semplici (o relazione dedicata se necessario).
8. Documentare vincoli non esprimibili in SQL (XOR, regole aziendali) nella relazione di progetto.

> **Nota:** le slide della lezione sviluppano esempi grafici passo-passo; in caso di dubbio, verificare equivalenza locale (stati legali) e vincoli FK/UNIQUE/CHECK.

## Checklist GymDashboard

- [ ] Tavola volumi + operazioni frequenti (ingressi, CRUD clienti, listino)
- [ ] Decisione ridondanze (es. conteggi abbonamenti attivi)
- [ ] Gerarchie listino/utenti ristrutturate con motivazione
- [ ] Multivalore (telefoni, …) eliminati
- [ ] Schema relazionale con PK/FK/UNIQUE allineato agli identificatori E/R
- [ ] Vincoli residui documentati
