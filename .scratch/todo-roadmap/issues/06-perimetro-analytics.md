# Perimetro query analytics business

**Type:** grilling

**Status:** resolved

## Question

Oltre alla Panoramica cassa esistente, quali famiglie di statistiche entrano in scope per uno “studio dell’andamento del business”?

## Answer

Set chiuso in scope (query aggregate lato DB, granularità giorno/settimana/mese/anno dove sensato):

1. **Cassa** — Entrate (Acquisti) / Uscite (Pagamenti) per periodo e tipo
2. **Mix prodotti** — Abbonamenti vs Pacchetti; ranking prodotti per ricavo e quantità venduta
3. **Frequenza** — Ingressi per ora del giorno / giorno settimana / mese (picchi affluenza)
4. **Fidelizzazione (proxy OLTP)** — clienti attivi; rinnovi/riacquisti; a rischio (nessun Ingresso da N giorni con titolo valido o scaduto di recente)
5. **Operazioni bancone** — volume Ingressi e Acquisti per giorno

**Fuori scope** di questa mappa: ML churn, LTV predittivo, export BI, multi-sede, cohort avanzate.
