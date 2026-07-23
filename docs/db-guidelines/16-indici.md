# Indici

**Fonte:** `16-Indici.pdf` — Corso di Basi di Dati (Annalisa Franco, Dario Maio, Università di Bologna)

## Quando usare questo documento

Tuning fisico e giustificazione degli indici nello schema di GymDashboard: cosa indicizzare, clustered vs unclustered, B-tree / B+-tree.

## Cos’è un indice

Struttura per ottimizzare l’accesso: entry tipiche `[valore chiave di ricerca → riferimento/i al record]`.

- Se l’indice ordinato **contiene** i record → organizzazione/indice **primario** (clustered).
- Altrimenti punta ai record del file dati → indice **secondario** (unclustered).

## Classificazione (slide)

Combinazioni tipiche: dense/sparse, primary/secondary, clustered/unclustered, mono/multi-livello. Quasi tutte le combinazioni sono possibili in teoria; i DBMS espongono un sottoinsieme.

- **Dense:** una entry per (quasi) ogni record.
- **Sparse:** entry per gruppi/pagine (spesso su file ordinato).
- Indice su chiave primaria vs su attributi non univoci.

## Indici multi-livello e B-tree

Requisiti tipici memoria secondaria: bilanciamento, occupancy minima, aggiornamenti locali.

- **B-tree:** chiavi e dati/puntatori nei nodi interni e foglie; buono per ricerca e update puntuali.
- **B+-tree** (molto usato in pratica): dati (o RID) solo nelle **foglie**; interni = separatori; foglie spesso collegate → range scan efficienti.
- Varianti RID vs PID; clustered vs unclustered B+-tree.

Costo ricerca ≈ altezza dell’albero (nodi letti). Split/catenation mantengono invarianti di riempimento.

## Linee guida pratiche

1. Indicizzare attributi in `WHERE` / `JOIN` / `ORDER BY` frequenti (regola 80-20 della lezione 06).
2. PK e FK sono candidati naturali.
3. Indici aiutano le letture, **appesantiscono** insert/update/delete e occupano spazio.
4. Evitare indici ridondanti (prefissi uguali).
5. Per range su date (ingressi, periodi contabili) privilegiare strutture ordinate (B+-tree), non hash.
6. Misurare: spiegare (`EXPLAIN`) prima di aggiungere indici “a sensazione”.

## GymDashboard — candidati tipici

- Cliente: codice/CF (lookup)
- Contratto/acquisto: `id_cliente`, date validità
- Ingresso/timbratura: `id_cliente` / `id_dipendente` + timestamp
- Movimenti economici: data, tipo
- Listino: tipo prodotto, anno (se richiesto dai filtri della proposta)
