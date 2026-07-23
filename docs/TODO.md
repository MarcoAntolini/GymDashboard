# TODO

## Bug fix

- le analisi entrate sono sbagliate (dovrei scegliere un tipo [giornaliero, settimanale, mensile, annuale] e poi fare l'analisi per quel tipo)
- nel grafico analisi entrate c'è una voce in inglese
- se un contratto è a tempo indeterminato, la data di fine contratto non dovrebbe essere visibile (quindi in corso), mentre se è a tempo determinato dovrebbe avere sia data inizio che data fine. attualmente sembra che sia il contrario
- nascondere password nella tabella?

## New feature

- query statistiche
- gestione profilo (foto profilo nei dipendenti?)
- dashboard admin per accettare o rifiutare l'approvazione di un account

## UI refinement

- nel calcola guadagni dei dipendenti potremmo mostrare anche il nome o altri dati del dipendente
- migliorare la pagina panoramica
- riordinare la navbar
- migliorare azioni tabella
- aggiungere context menu in tabella di shadcn/ui
- allineare a destra tutte le colonne numeriche (quindi prezzi, quantità, etc. NON gli id)
- sarebbe bello poter resizare e riordinare le colonne della tabella
- sarebbe bello poter fissare una o più colonne per renderle sempre visibili anche se si scrolla orizzontalmente
- se si usano tooltip, usare tooltip di shadcn/ui
- search highlight in tabella?
- multi-select in tabella?
- per aprire le schermate di modifica dati magari usare sheet di shadcn/ui
- se si usano colori o simboli nelle tabelle per mostrare dei dati particolari, usarli anche in caso di creazione/modifica dati
- possibilità di fissare una o più righe della tabella per renderle sempre visibili anche se si scrolla verticalmente in caso si voglia comparare i dati con altre righe della tabella?

## Architecture / data access

- i filtri devono essere lato DB, non lato frontend/shadcn, per implementare le query proposte

## Clarification

- quali sono attualmente le differenze tra admin e dipendente?
- in alcune tabelle mostriamo dati estrapolati da altre tabelle o sempre e solo i dati propri di quella tabella?
- le modifiche ai dati devono essere propagate anche nelle altre tabelle?
- bisogna controllare attentamente che permettiamo solo modifiche ai dati che possono essere modificati e che ha senso modificare
