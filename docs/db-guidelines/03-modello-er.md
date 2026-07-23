# Il modello Entity-Relationship

**Fonte:** `03-ModelloER.pdf` — Corso di Basi di Dati (Annalisa Franco, Dario Maio, Università di Bologna)

## Quando usare questo documento

Durante la progettazione concettuale di GymDashboard: notazione, costrutti, cardinalità, identificatori, entità deboli, gerarchie, pattern (visite ripetute, reificazione), ternarie.

## Modelli logici vs concettuali

- **Modello dei dati:** concetti per descrivere dati, associazioni e vincoli.
- **Modelli logici:** usati nei DBMS; indipendenti dal fisico; usati dai programmi.
- **Modelli concettuali:** indipendenti dal DBMS; descrivono il mondo reale; fasi preliminari; tipicamente grafici. E/R è lo standard de facto (Chen 1976; dialetti/EER).

## Costrutti fondamentali

Entità, associazione (relationship), attributo; più: vincoli di cardinalità, identificatore, gerarchia di generalizzazione.

### Entità

Classe di oggetti con caratteristiche comuni ed **esistenza autonoma**. Rettangolo + nome parlante (no sigle tipo E001). Singolare MAIUSCOLO preferito nel corso.

- **Intensionale:** struttura/prototipo (classificazione).
- **Estensionale:** insieme di istanze in un certo stato.

### Associazione

Legame logico tra entità. Istanza = ennupla di istanze (una per partecipante). Rombo + nome parlante (sostantivo, non verbo né “STUDENTE-CORSO”).

- Istanze = sottoinsieme del prodotto cartesiano → **niente duplicati** sulla stessa combinazione di partecipanti.
- **Grado:** binaria (2), ternaria (3), n-aria.
- Più associazioni tra le stesse entità sono ammesse se semanticamente diverse (RESIDENZA vs LAVORO).

### Associazioni ad anello

Legano un’entità a sé stessa. Possono essere simmetriche/riflessive/transitive. Se non simmetriche → **ruoli** obbligatori (supervisore/subalterno). Possibili anche in n-arie.

### Attributi

Proprietà elementari di entità o associazioni; nome univoco nel costrutto; dominio. Default cardinalità attributo **(1,1)**.

| Tipo | min/max tipico |
|---|---|
| Opzionale | min = 0 |
| Monovalore | max = 1 |
| Multivalore/ripetuto | max = N |

**Composti:** aggregazione di sotto-attributi (dominio = prodotto cartesiano).  
Attributi multivalore semanticamente correlati → **un solo composto multivalore** (non N attributi multivalore separati).

**Dove metterli:** Data/Voto appartengono a ESAME, non a STUDENTE o CORSO.

### Vincoli

- **Impliciti:** istanze di associazione riferiscono istanze esistenti; combinazioni partecipanti uniche.
- **Espliciti:** cardinalità, identificazione.

## Cardinalità delle associazioni

`(min-card, max-card)` per ogni partecipante.

- Partecipazione **opzionale** se min=0; **obbligatoria** se min>0.
- Max=1 → a valore singolo; max>1 → a valore multiplo.
- Tipi binari: 1:1, 1:N, N:M (come in `02-progettazione-db.md`).

## Identificatori

Ogni entità ha **almeno un** identificatore (può averne più). Minimalità: nessun sottoinsieme proprio è ancora identificatore.

| Tipo | Come |
|---|---|
| Interno | uno o più attributi di E |
| Esterno | altre entità collegate + eventuali attributi di E (a volte detto misto) |
| Semplice / composto | 1 elemento vs più |

Con identificatore esterno via A: `min-card(E,A)=max-card(E,A)=1`.

Se E1 sola basta a identificare E: `max-card(E1,A)=1`; altrimenti max=N.

**Errori tipici:** duplicare l’attributo dell’entità dominante sull’entità identificata (la semantica E/R non li “lega”); scegliere identificatori che non rispettano i vincoli (es. linee d’ordine).

In logica: uno diventa PK; gli altri → UNIQUE.

## Entità debole

Esistenza dipendente da entità dominante; all’eliminazione del dominante → eliminare i deboli. Identificatore include quello del dominante; partecipazione totale + identificazione. Esempio: MOVIMENTO debole rispetto a CONTO.

## Gerarchie di generalizzazione

Copertura (T/P) × (E/S) come in lezione 02. Ereditarietà delle proprietà verso la superclasse. Evitare gerarchie su istanze specifiche o su ruoli puramente temporali senza necessità.

## Pattern: attributi ripetuti su associazioni

Se la stessa coppia di partecipanti deve ripetere l’associazione nel tempo (visite, esami, ingressi palestra):

1. Non basta l’associazione N:M senza attributo “ripetibile” adeguato.
2. Soluzione tipica: **reificare** l’associazione in entità + identificazione esterna (e attributi Data, Esito, …).

Pattern “matrimonio / visita”: se servono più eventi tra le stesse istanze → reificazione; attenzione a non usare come PK l’intero insieme {partecipanti + data} se i vincoli FD sono diversi.

## Associazioni ternarie

Analizzare dipendenze funzionali tra i partecipanti. Se un lato ha max-card=1 → spesso **falsa ternaria** → decomporre in binarie. Preferire binarie quando equivalenti e più chiare.

## Tempo e snapshot

Schema E/R spesso “fotografia” (es. un A.A.). Storico (ritardi, prenotazioni, prestiti, ingressi ripetuti) richiede modellazione esplicita degli eventi nel tempo. Distinguere concetti omonimi (libro ≠ copia di libro).

## Qualità / errori comuni

Errori spesso da analisi requisiti scarsa. Astrazioni E/R: classificazione, generalizzazione, aggregazione, proiezione.

Uno schema E/R è più espressivo del relazionale ma **non** basta per tutti gli aspetti (operazioni, dinamiche, regole complesse → documentazione aggiuntiva).

## Checklist GymDashboard

- [ ] Nomi univoci e parlanti per entità/associazioni/attributi
- [ ] Cardinalità su ogni ramo; scenari limite (cliente senza abbonamento, dipendente in spezzato, …)
- [ ] Identificatori (interni/esterni) su ogni entità; deboli evidenziate dove serve
- [ ] Generalizzazioni con copertura dichiarata (es. prodotto listino)
- [ ] Eventi ripetuti (ingresso, timbrature, stipendi) modellati con reificazione se necessario
- [ ] Attributi sull’associazione/entità corretta (non “appiccicati” al partecipante sbagliato)
