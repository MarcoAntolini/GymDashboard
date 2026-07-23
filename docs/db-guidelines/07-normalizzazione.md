# Normalizzazione

**Fonte:** `07-Normalizzazione.pdf` — Corso di Basi di Dati (Annalisa Franco, Dario Maio, Università di Bologna)

## Quando usare questo documento

Verifica qualità dello schema relazionale (e, in anticipo, dello schema E/R) di GymDashboard: FD, 1NF–BCNF, decomposizione.

## Perché normalizzare

Ridondanza logica → anomalie di inserimento, aggiornamento, cancellazione. Dipendenze funzionali (FD) spiegano le anomalie.

### Dipendenza funzionale

`X → Y` su `R(T)`: in ogni stato legale, tuple uguali su X sono uguali su Y.

- Superchiave ↔ determina tutti gli attributi.
- Chiave = superchiave minimale.

## Forme normali (riepilogo)

| Forma | Condizione (sintesi corso) |
|---|---|
| **1NF** | Domini atomici; un solo valore di dominio per attributo in tupla |
| **2NF** | (in 1NF e) ogni attributo **non-primo** dipende **completamente** da ogni chiave candidata (niente dipendenza parziale) |
| **3NF** | Ogni attributo non-primo **non** dipende **transitivamente** da una chiave |
| **BCNF** | Per ogni FD non banale `X → Y`, X è **superchiave** |

Definizione equivalente 3NF: per ogni FD non banale `X → Y`, X è superchiave **oppure** ogni attributo in Y è **primo**.

Gerarchia: … ⊆ BCNF ⊆ 3NF ⊆ 2NF ⊆ 1NF.

Attributo **primo** = appartiene ad almeno una chiave.

Nota: se tutte le chiavi sono semplici (un attributo), 1NF ⇒ 2NF.

## Qualità di una decomposizione

1. **Senza perdita** (lossless) — si ricostruiscono le informazioni originarie con join.
2. **Preservazione delle dipendenze** — ogni FD ha tutti gli attributi in almeno uno schema decomposto (altrimenti servono query/trigger di verifica).

3NF è il livello **comunemente accettato** in pratica. Sempre possibile sintesi 3NF lossless + preservazione FD.

## Approccio pratico (dal corso)

1. Se non normalizzata → decomporre in **3NF**.
2. Verificare se è anche **BCNF** (con una sola chiave, 3NF≡BCNF).
3. Se non BCNF: lasciare e gestire anomalie; oppure decomporre BCNF con verifiche; oppure **rimodellare** a monte (E/R).

Normalizzare **non è un obbligo assoluto**: bilanciare anomalie vs costo dei join, frequenza aggiornamenti, spazio della ridondanza. Relazioni quasi statiche tollerano meglio denormalizzazioni.

## Algoritmo di sintesi 3NF (idea)

1. Minimizzare l’insieme di FD.
2. Per ogni gruppo di FD con stesso determinante → uno schema con quegli attributi.
3. Fondere schemi se determinanti si determinano a vicenda (chiavi alternative).
4. Assicurare uno schema la cui chiave è chiave dello schema originario (crearlo se manca).

## FD e modello E/R

Leggere le cardinalità massime come FD tra identificatori. Usare la normalizzazione anche in fase concettuale per smascherare entità nascoste (es. fornitore vs prodotto).

Analisi di associazioni n-arie: le FD tra partecipanti guidano se tenere la n-aria o spezzarla.

## Checklist GymDashboard

- [ ] Elenco FD rilevanti per ogni relazione (da cardinalità E/R + regole aziendali)
- [ ] Schema almeno in 3NF (idealmente BCNF dove non costa troppo)
- [ ] Decomposizioni lossless; FD preservate o verifiche documentate
- [ ] Eventuali denormalizzazioni motivate da carico (lezione 06)
