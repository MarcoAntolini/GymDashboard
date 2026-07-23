# Colonne native vs derivate in tabella

**Type:** grilling

**Status:** resolved

## Question

Nelle tabelle CRUD mostriamo solo attributi nativi dell’entità o anche dati estrapolati da altre tabelle? Quale regola seguiamo?

## Answer

Uniformarsi alle **guidelines DB**: colonne **native** dell’entità + **derivati di sola lettura** calcolati in query/vista dove il dominio lo richiede (es. tipo Prodotto via specializzazione, Ingressi rimanenti = `N − COUNT`, nome Cliente via join). Nessun derivato persistito solo per comodità UI; niente colonne derivate editabili.
