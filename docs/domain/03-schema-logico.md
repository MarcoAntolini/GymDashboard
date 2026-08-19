# Schema logico — GymDashboard

**Fonti:** `02-schema-er.md`, linee guida `docs/db-guidelines/06-progettazione-logica.md` e `07-normalizzazione.md`.  
**Target implementativo:** `gym-dashboard/prisma/schema.prisma` (MySQL).

## Quando usare questo documento

Tradurre lo schema E/R in relazioni, motivare ristrutturazioni/ridondanze e documentare vincoli non esprimibili solo in DDL — materiale per la relazione d’esame e per la migrazione Prisma.

## Ristrutturazione E/R

### Gerarchie

| Gerarchia | Scelta | Motivazione |
|---|---|---|
| PRODOTTO → ABBONAMENTO \| PACCHETTO | **Sostituzione con associazioni** (padre + figlie 1:1) | Accessi alle figlie separati (listino vs validazione ingresso); copertura (t,e) |
| PAGAMENTO → STIPENDIO \| … | **Collasso verso l’alto** del selettore `Tipo` sul padre + **sostituzione** delle figlie come tabelle 1:1 | Filtri per tipo sul padre; attributi propri sulle figlie |

Invarianti ISA (non solo FK):

- Prodotto: esattamente una riga in `abbonamenti` XOR `pacchetti_ingressi`.
- Pagamento: esattamente una figlia tra `stipendi` / `bollette` / `attrezzature` / `interventi`, coerente con `pagamenti.tipo`.

MySQL/Prisma non garantiscono XOR; enforcement in applicazione (transazione di insert padre+figlia) e documentazione in relazione. CHECK SQL se il dialect lo supporta in modo affidabile.

### Multivalore / composti

Indirizzo composto → attributi aplanati (`via`, `civico`, `città`, `provincia`) su Cliente e Dipendente.

### Identificatori eventi

Vendita e Ingresso usano **PK surrogate** (`id`), non `(cliente, data)`:

- collisioni se due eventi condividono lo stesso timestamp (o arrotondamento);
- pattern visite (`03-modello-er.md`): non forzare `{partecipanti + data}` come PK se le FD non lo richiedono.

Contratto e Timbratura restano deboli con PK esterna composta (stabile e sufficiente al dominio).

## Analisi ridondanze

| Candidato | Decisione | Motivazione |
|---|---|---|
| `Cliente.ingressi_rimanenti` | **Eliminato** | Derivabile; contatore globale senza allocazione per-vendita → anomalie di aggiornamento; non in 3NF rispetto alle FD di consumo |
| Contatore residuo su Vendita pacchetto | **Non introdotto** (decisione stabile) | Residuo = `Vendita.numero_ingressi − COUNT(ingressi.id_vendita)`; denormalizzare solo se tavola volumi reale lo impone (`06`) |
| Entità `fornitori` | **Non introdotta** | `fornitore` resta stringa su bollette/attrezzature; report per nome ok; identità canonica fuori scope |
| `PERSONA` come superclasse | **Non nello schema** | Variante didattica in relazione; vedi `02-schema-er.md` |
| `clientId` su Ingresso | **Non introdotto** | FD `id_vendita → id_cliente`; tenere entrambi sarebbe ridondanza di associazione (ciclo Cliente–Vendita–Ingresso) |
| `tipo` su Vendita / Listino | **Eliminato** | Determinato dalla specializzazione del Prodotto (`codice → tipo`) — violazione 3NF se lasciato |

### Residuo pacchetto (definizione formale)

Per una Vendita `A` di Pacchetto con snapshot `A.numero_ingressi = N` (fissato alla vendita; **non** il valore corrente in `pacchetti_ingressi`):

```
residuo(A) = N − |{ I ∈ ingressi | I.id_vendita = A.id }|
```

Un ingresso su pacchetto è ammesso solo se `residuo(A) > 0` prima dell’insert (nella stessa transazione del insert).

### Validità abbonamento e tie-break (definizione formale)

Per una Vendita `A` di Abbonamento con snapshot `A.durata = D` giorni (fissato alla vendita; **non** il valore corrente in `abbonamenti`) e `A.data = t0`, la finestra di validità è `[t0, t0 + D giorni)`.  
Un Ingresso con `data = t` può essere giustificato da `A` se `t ∈ [t0, t0 + D)`.

Algoritmo di scelta (regola 9 in `02-schema-er.md`), deterministico:

1. Sia `M` l’insieme delle Vendite di Abbonamento del Cliente valide in `t`. Se `M ≠ ∅`, scegli `arg max` su `(data, id)` (più recente; poi id maggiore).
2. Altrimenti sia `P` l’insieme delle Vendite di Pacchetto del Cliente con `residuo > 0`. Se `P ≠ ∅`, scegli `arg min` su `(data, id)` (FIFO; poi id minore).
3. Altrimenti rifiuta.

### Contratti non sovrapposti

Due contratti `C1`, `C2` dello stesso `id_dipendente` sono illegali se gli intervalli semiaperti si intersecano, con `data_fine` NULL = +∞. Enforcement in applicazione (prima di insert/update); eventuale trigger MySQL. La sola PK `(id_dipendente, data_inizio)` non basta.

### Importo vendita vs listino (snapshot)

`vendite.importo` **non** è ridondanza da eliminare rispetto a `listini.prezzo`:

- il listino è il prezzo corrente/per anno;
- l’vendita fissa l’importo **al momento della vendita** (requisito di storicizzazione, `03-modello-er.md` — tempo e snapshot).

All’inserimento l’applicazione propone di default il prezzo di `listini` per `(YEAR(data), codice_prodotto)`; scostamenti solo per sconto/deroga. Nessuna FK Vendita→Listino (il listino dell’anno può mancare o essere aggiornato dopo).

### Durata / N ingressi su Vendita (snapshot)

`vendite.durata` e `vendite.numero_ingressi` sono lo **snapshot** dei parametri di accesso alla vendita (uno dei due valorizzato secondo la specializzazione del Prodotto):

- giustificazione Ingressi e residuo pacchetto leggono **solo** questi campi sulla Vendita;
- aggiornare `abbonamenti.durata` / `pacchetti_ingressi.numero_ingressi` non altera titoli già venduti.

## Tavola volumi (ordine di grandezza)

| Relazione | Cardinalità stimata |
|---|---|
| clienti / dipendenti | 10²–10³ |
| prodotti / listini | 10¹ |
| vendite | 10³–10⁴ |
| ingressi | 10⁴–10⁵ (operazione più frequente) |
| pagamenti + figlie | 10²–10³ |
| contratti / timbrature | 10³–10⁴ |

Operazione dominante in scrittura: registrazione Ingresso (I, alta frequenza) — navigazione Vendita → specializzazione Prodotto → eventuale COUNT ingressi.

## Mapping E/R → relazioni

Notazione: PK sottolineata; FK indicate.

| Relazione | Attributi | Note |
|---|---|---|
| `account` | **username**, password, ruolo, approvato, id_dipendente UK → dipendenti | 1:1 opzionale lato Dipendente |
| `dipendenti` | **id**, codice_fiscale UK, anagrafica…, data_assunzione | |
| `contratti` | **id_dipendente**, **data_inizio**, tipo, costo_orario, data_fine? | debole; FK CASCADE su dipendente |
| `timbrature` | **id_dipendente**, **entrata**, uscita? | debole |
| `pagamenti` | **id**, data, importo, tipo | selettore ISA |
| `stipendi` | **id_pagamento** → pagamenti, id_dipendente → dipendenti | |
| `bollette` / `attrezzature` | **id_pagamento**, descrizione, fornitore | |
| `interventi` | **id_pagamento**, descrizione, attuatore, data_inizio, data_fine | |
| `clienti` | **id**, codice_fiscale UK, anagrafica…, data_iscrizione | senza ingressi_rimanenti |
| `prodotti` | **codice** | |
| `abbonamenti` | **codice_prodotto** → prodotti, durata | |
| `pacchetti_ingressi` | **codice_prodotto** → prodotti, numero_ingressi | |
| `listini` | **anno**, **codice_prodotto** → prodotti, prezzo | PK senza tipo |
| `vendite` | **id**, id_cliente → clienti, data, importo, codice_prodotto → prodotti, durata?, numero_ingressi? | snapshot durata/N alla vendita; onDelete Client/Product: **Restrict** |
| `ingressi` | **id**, data, id_vendita → vendite | onDelete Sale: **Restrict** |

Soldi (`importo`, `prezzo`, `costo_orario`): tipo **Decimal** (non Float) — evita errori di rappresentazione su moneta.

### Politiche di cancellazione (sintesi)

| FK | onDelete | Motivo |
|---|---|---|
| vendite → prodotti | Restrict | non cancellare storia di cassa con il prodotto |
| vendite → clienti | Restrict | non cancellare il cliente se ha movimenti di cassa / titoli usati |
| ingressi → vendite | Restrict | non cancellare una vendita già usata come giustificazione |
| figlie pagamento → pagamenti | Cascade | figlia non ha senso senza padre |
| contratti/timbrature → dipendenti | Cascade | ciclo di vita dipendente |
| account → dipendenti | Cascade | |

**Perché non Cascade su Cliente→Vendita:** con `ingressi → vendite` Restrict, un `DELETE` cliente in cascata sulle vendite **fallirebbe** (o lascerebbe stati ambigui) non appena esistono ingressi. Restrict su entrambi i lati rende esplicita la regola: la storia non si cancella “di passaggio”.

Procedura amministrativa (fuori DDL): esportare/archiviare, poi cancellare ingressi → vendite → cliente solo se policy di privacy lo richiede — mai un cascade silenzioso.

## Transazione: registrazione Ingresso

Riferimento: `docs/db-guidelines/11-transazioni.md`.

Use case multi-step (letture + scrittura) → **una sola transazione**. Non basarsi sull’UI per atomicità/consistenza del residuo.

Passi (pseudo):

1. `BEGIN` (isolamento consigliato: `REPEATABLE READ` o almeno `READ COMMITTED`; InnoDB).
2. Caricare i candidati Vendita del Cliente (Abbonamento / Pacchetto) rilevanti per `t = now()` (o timestamp richiesto).
3. Per i pacchetti, calcolare `residuo` con `COUNT` degli ingressi per `id_vendita` **nella stessa transazione** (lock sulle righe Vendita o gap lock sul predicato — mitigare phantom: due ingressi concorrenti sullo stesso pacchetto non devono entrambi vedere `residuo = 1`).
4. Applicare il tie-break (sezione sopra); se nessun candidato → `ROLLBACK` / errore applicativo.
5. `INSERT` in `ingressi` con `id_vendita` scelto.
6. `COMMIT`.

Anomalie da evitare: lost update / phantom sul conteggio residuo; dirty read di vendite non committed. Transazione **corta** (niente I/O UI dentro il `BEGIN`…`COMMIT`).

Test minimo: due client concorrenti che registrano ingresso sullo stesso pacchetto con residuo 1 → esattamente un successo e un rifiuto.

## Forme normali (verifica mirata)

### `listini(anno, codice_prodotto, prezzo)`

- Chiave: `{anno, codice_prodotto}`
- FD: chiave → prezzo
- **3NF / BCNF** (niente `tipo`: sarebbe `codice_prodotto → tipo` transitiva sulla chiave composta)

### `vendite(id, id_cliente, data, importo, codice_prodotto)`

- Chiave: `{id}`
- FD: id → tutti; nessun `tipo` ridondante
- `importo` non dipende funzionalmente da `(anno listino, codice)` nello schema memorizzato: è fatto storico (può discostarsi dal listino per sconto)
- **3NF / BCNF**

### `ingressi(id, data, id_vendita)`

- Chiave: `{id}`
- FD: id → data, id_vendita; id_vendita → id_cliente (via join, non attributo locale)
- **3NF / BCNF**

### Consumo pacchetto

La FD “residuo” non è un attributo memorizzato; nessun rischio di anomalia da contatore denormalizzato. La correttezza sotto concorrenza dipende dalla **transazione** di registrazione ingresso, non dalla forma normale.

## Equivalenza con lo schema Prisma

`gym-dashboard/prisma/schema.prisma` deve rispecchiare le relazioni sopra. Breaking rispetto allo schema precedente:

1. Drop `clienti.ingressi_rimanenti`
2. Drop `vendite.tipo`, `listini.tipo`; PK listini = `(anno, codice_prodotto)`
3. `vendite` / `ingressi`: PK surrogata `id`; `ingressi` perde `id_cliente`, guadagna `id_vendita` obbligatorio
4. `Float` → `Decimal` su importi/prezzi/costo orario
5. `vendite` → `prodotti` e `vendite` → `clienti`: `onDelete: Restrict`; `ingressi` → `vendite`: `Restrict`
6. Enum `SaleType` resta utile in applicazione per filtri UI derivati dal join a Membership/EntranceSet, non come colonna denormalizzata su Vendita/Listino

**Migrazione dati** (passata successiva, non in questo step):

- backfill `ingressi.id_vendita` scegliendo la vendita giustificatrice per cliente/data (euristica = regola 9 / tie-break);
- drop colonne obsolete;
- riscrivere CRUD ingresso (transazione + tie-break; niente decremento su Cliente).

## Checklist corso

- [x] Tavola volumi + operazione dominante (ingresso)
- [x] Decisione ridondanze (`ingressi_rimanenti`, `tipo`, `clientId` su ingresso; snapshot `importo`)
- [x] Gerarchie ristrutturate con motivazione
- [x] Multivalore/composti aplanati
- [x] Schema relazionale PK/FK allineato
- [x] Vincoli residui documentati (ISA XOR, contratti non sovrapposti, tie-break, residuo, RESTRICT, transazione ingresso)
