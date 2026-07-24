# 10 — Viste: colonne native vs derivate

**What to build:** Per ogni vista lista/dettaglio, ogni colonna è classificata: nativa, join/label, derivata/aggregata, snapshot storico. Le derivate non vengono inventate come colonne persistite sulla tabella sbagliata.

**Blocked by:** 02 — Snapshot durata e N ingressi su Acquisto

**Status:** resolved

- [x] Esiste una matrice entità → colonna → classe (nativa | join | derivata | snapshot) per le viste CRUD principali
- [x] Nessun attributo falso persistito solo per la UI (es. residuo sul Cliente)
- [x] Liste/dettaglio espongono join e derivate dove servono; in UI/DTO sono distinguibili da quelle native
- [x] Audit delle pagine/DTO attuali: violazioni corrette o documentate con motivo

**Source:** `docs/.scratch/data-policy/issues/22-viste-colonne-native-vs-derivate.md`

## Comments

- 2026-07-24 19:08 — claimed by implement loop

## Done

- Matrice + audit in `docs/domain/04-viste-colonne.md` (classi `native` | `join` | `derived` | `snapshot`); link in `docs/domain/README.md`.
- Distinzione in codice: `src/lib/domain/column-class.ts` → `ColumnDef.meta.columnClass` su Clienti, Acquisti, Ingressi, Listino, Prodotti.
- Join/derivate esposte: Cliente su Acquisti; Type derivato su Prodotti; Importo Acquisto etichettato come snapshot (allineato a durata/N).
- Nessun attributo falso persistito: schema già ok; rimossi `remainingEntrances` da `docs/resume.txt`.
- Deferral documentato: colonne join ISA (stipendi/bollette/…) caricate ma non in UI; residuo pacchetto resta domain-only.
