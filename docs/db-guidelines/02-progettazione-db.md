# Progettazione di un database

**Fonte:** `02-ProgettazioneDB.pdf` — Corso di Basi di Dati (Annalisa Franco, Dario Maio, Università di Bologna)

## Quando usare questo documento

Nella fase di analisi del dominio palestra: scegliere l’orientamento di modellazione, applicare i meccanismi di astrazione e definire le cardinalità delle associazioni prima dello schema E/R dettagliato.

## Tipologia delle applicazioni

| Orientamento | Cosa conta di più |
|---|---|
| **Agli oggetti / ai dati** | Le informazioni; funzioni spesso non molto complesse |
| **Alle funzioni** | Complessità della trasformazione input→output |
| **Al controllo** | Sincronizzazione tra attività cooperanti |

Un SI di media complessità usa più strumenti. UML + metodi di progettazione DB rispondono all’esigenza; i diagrammi delle classi UML **non** sostituiscono tutti i costrutti E/R.

## Tassonomia dei metodi di analisi

L’orientamento (oggetti, funzioni, stati) dipende dalla tipologia di SI e dall’enfasi del team. Tendenza: integrare modelli (UML come standard de facto) per aspetti statici, funzionali e dinamici.

### Analisi orientata agli oggetti

- Identificare oggetti e classificarli; modellare interrelazioni.
- Le proprietà strutturali restano relativamente stabili; l’uso può cambiare.

### Analisi orientata alle funzioni

- Sistema come rete di processi e flussi informativi (es. DFD).
- Costruzione di una gerarchia funzionale.

### Analisi orientata agli stati

- Stati operativi e transizioni (utile per UI/workflow: login, menu, conferma uscita, …).

## Meccanismi di astrazione (obbligatori in analisi)

1. **Classificazione** — raggruppare oggetti in classi per proprietà comuni.
2. **Generalizzazione** — relazione «è un»; sottoclassi ereditano e possono specializzare. Specializzazione = processo inverso.
3. **Aggregazione** — relazione «parte di» (tra oggetti, funzioni o stati).
4. **Proiezione** — vista strutturale diversa a seconda del punto di vista (operatore, installatore, …).

### Copertura delle generalizzazioni

Confrontare unione delle specializzazioni con la superclasse, e le specializzazioni tra loro:

| | Esclusiva (disgiunte) | Sovrapposta (intersezione possibile) |
|---|---|---|
| **Totale** | (T,E) — unione = superclasse, disgiunte | (T,S) — unione = superclasse, overlapping |
| **Parziale** | (P,E) — unione ⊆ superclasse, disgiunte | (P,S) — unione ⊆ superclasse, overlapping |

Esempi tipici:

- Dipendenti → amministrazione / produzione / marketing: **(T,E)**
- Veicoli → auto / barche: **(P,E)**
- Lavoratori → sede / smart working / trasferta: **(T,S)**
- Laureati → ingegneri / medici: **(P,S)**

## Associazioni e vincoli di cardinalità

Le associazioni sono corrispondenze tra classi (aggregazioni i cui componenti sono le classi). Vanno caratterizzate con cardinalità.

Sia `A` un’associazione fra `C1` e `C2`:

- **min-card(C1, A):** minimo numero di istanze di A a cui ogni istanza di C1 deve partecipare.
- **max-card(C1, A):** massimo numero di istanze di A a cui ogni istanza di C1 può partecipare.

### Partecipazione

- **Opzionale:** `min-card(C1, A) = 0`
- **Obbligatoria (totale):** `min-card(C1, A) > 0`

I vincoli devono valere per **qualunque stato estensionale** (non solo su un esempio).

### Tipi di associazioni binarie (per max-card)

| Tipo | Condizione |
|---|---|
| Uno a uno (1:1) | `max-card(C1,A)=1` e `max-card(C2,A)=1` |
| Uno a molti (1:N) | un lato max=1, l’altro max=N |
| Molti a molti (N:M) | entrambi i lati max > 1 |

### Esempio (dal corso)

Associazione `ASSEGNAZIONE` tra `DIPENDENTE` e `MANSIONE`:

- un dipendente svolge da 1 a 3 mansioni → min=1, max=3 su DIPENDENTE;
- una mansione può non essere assegnata, al più a 5 dipendenti → min=0, max=5 su MANSIONE.

## Linee guida operative per GymDashboard

1. Partire dall’**orientamento ai dati** (clienti, abbonamenti, pacchetti, dipendenti, movimenti).
2. Classificare entità candidate; applicare generalizzazioni solo dove c’è vera relazione «è un» (es. prodotto listino → abbonamento vs pacchetto entrate).
3. Dichiarare esplicitamente copertura (T/P, E/S) per ogni generalizzazione.
4. Per ogni associazione scrivere min/max card su **entrambi** i lati e validarle con scenari (cliente senza abbonamento? ingresso senza pacchetto attivo?).
5. Complementare con vista funzionale (use case / operazioni della proposta) e, se serve, stati (timbratura entrata/uscita dipendente).
