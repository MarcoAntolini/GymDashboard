# Snapshot e propagazione modifiche

**Type:** grilling

**Status:** resolved

## Question

Quando si modifica il Listino (prezzo) o il Prodotto (durata/N ingressi), cosa succede agli Acquisti già registrati? Come gestiamo casi analoghi (Contratto/costo orario, anagrafiche)?

## Answer

- **Listino / prezzo:** policy già in dominio — `acquisti.importo` è snapshot alla vendita; update Listino = solo vendite future; mai riscrivere Acquisti passati (`03-schema-logico.md`).
- **Durata abbonamento / N ingressi:** policy **A** (come gestionali reali) — snapshot su **Acquisto** alla vendita, oltre all’importo; edit Prodotto non altera titoli già venduti.
- **Stipendi:** importo su Pagamento è fatto storico; “calcola guadagni” usa Contratto corrente solo per stime, non riscrive Pagamenti registrati.
- **Anagrafica Cliente/Dipendente:** propagazione identità via FK (nome aggiornato si vede ovunque); non è snapshot.
- **Delete:** Restrict su Cliente/Acquisto con storia Ingressi — confermato.
