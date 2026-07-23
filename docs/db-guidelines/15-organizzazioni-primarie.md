# Organizzazioni primarie dei file

**Fonte:** `15-OrganizzazioniPrimarie.pdf` — Corso di Basi di Dati (Annalisa Franco, Dario Maio, Università di Bologna)

## Quando usare questo documento

Scelte di organizzazione fisica del file dati (heap, ordinato, hash, …) quando si ragiona su costi di ricerca/inserimento — tipicamente dopo lo schema logico, insieme agli indici.

## Idea

L’**organizzazione primaria** riguarda come sono disposti i record nel file dati principale. Influenza:

- costo ricerca per chiave / range;
- costo inserimenti e cancellazioni;
- utilità di indici clustered vs unclustered.

## Tipologie tipiche (corso)

Organizzazioni sequenziali e ad accesso diretto (citazioni anche in `00`):

- **Heap / seriale non ordinato:** insert economici; ricerca per scansione.
- **Ordinato (sorted):** range query e ricerca binaria favorite; insert costosi (mantenere ordine / overflow).
- **Hash (accesso diretto):** ottimo per uguaglianza su chiave di hash; debole sui range.
- Varianti con overflow, packing, factor di blocco, ecc. (dettaglio nelle slide).

## Criteri di scelta (operativi)

| Pattern di accesso dominante | Orientamento |
|---|---|
| Insert frequenti, poche ricerche | Heap (+ indici secondari) |
| Range su attributo (date ingressi, periodi) | Ordinamento / indice clustered su quell’attributo |
| Lookup puntuale per chiave | Hash o indice su uguaglianza |

Nella pratica moderna il DBMS sceglie spesso heap/B+tree clustered; le organizzazioni restano utili per **spiegare costi** e scelte di indice.

## GymDashboard

- Ingressi e movimenti per intervallo di date → beneficiare di ordinamento/indice su timestamp.
- Lookup cliente per CF/codice → indice su uguaglianza.
- Non forzare organizzazioni esotiche se il DBMS non le espone: documentare l’intento (clustered index, …).
