# TODO

IMPORTANTE: non aggiungere commenti al codice, se c'è qualcosa da spiegare spiegarlo nella chat.

## Architecture / data access

- svolgere i task in `.docs/.scratch/align-prisma-app/`

- svolgere i task in `.docs/.scratch/db-decision/`

- i filtri delle tabelle devono essere lato DB, non lato frontend/shadcn, per implementare le query proposte. bisogna anche fare in modo che il backend possa gestire le query in modo efficiente e scalabile.
- attualmente usando il frontend per filtrare i dati, ad ogni input viene filtrato tutto il dataset. appena trasleremo tutto al backend, bisogna fare in modo che ci sia un pulsante conferma o filtra o qualcosa del genere per eseguire la query altrimenti rischiamo di fare un numero di query esagerato e di rendere il backend lento e poco scalabile.

- svolgere i task in `.docs/.scratch/data-policy/`

## Bug fix

- le query per le analisi entrate sono sbagliate (dovrei scegliere un tipo [giornaliero, settimanale, mensile, annuale] e poi fare l'analisi per quel tipo)
- se un contratto è a tempo indeterminato, la data di fine contratto non dovrebbe essere visibile (quindi in corso), mentre se è a tempo determinato dovrebbe avere sia data inizio che data fine. attualmente sembra che sia il contrario
- nascondere password nella tabella dei dipendenti (magari usando asterischi o qualcosa del genere). eventualmente aggiungere un pulsante per mostrare la singola password

## New feature

- inserire un maggior numero di query statistiche (task in `.docs/.scratch/analytics/`) e magari inserirle in modo organico all'interno della dashboard principale
- nella vista "calcola guadagni" dei dipendenti potremmo mostrare anche il nome o altri dati del dipendente

- ogni dipendente (a prescindere dal ruolo) deve avere la possibilità di gestire il proprio profilo (foto profilo, nome, cognome, email, telefono, etc.) ed eventualmente anche la possibilità di cambiare username e password. può essere inserito un pulsante che apre la pagina relativa per la gestione del profilo nel dropdown del profilo dell'utente (per intenderci in alto a sinistra della navbar)

- dashboard admin per accettare o rifiutare l'approvazione di un account (deve essere accessibile solo agli admin e separato dalla tabella degli account, deve essere un tasto che apre una view [modale, sheet, etc.] che mostra tutti gli account in attesa di approvazione)
- ruolo owner per gestire gli admin (quanti sono? si possono gestire tra di loro?), gli admin non possono gestire altri admin (owner > admin > dipendente)

- il bottone che genera mock data dorebbe generare dati "realistici" (dati che hanno senso e che possono essere usati per testare l'app) e italiani, non americani. inoltre dovrebbe generare un owner con le seguenti credenziali: `username:owner` e `password:Password1`

## UI refinement

- usare le skill /impeccable e /shadcn per migliorare la UI e svolgere le task in `.docs/.scratch/dashboard-data-ux/`

- Allinea i Separator orizzontali di sidebar user-block e toolbar pagina (layout.tsx / dashboard.tsx / home). Oggi c’è uno scalino: unifica l’altezza dei due header in modo che resti padding verticale intorno ai Button default (h-10), e allinea anche placeholder e Panoramica.
- DataTable larga / shell flex — scroll orizzontale di pagina: non mettere overflow-x-auto sul pane principale del dashboard; mantieni min-w-0 lungo la catena flex; avvolgi lo scroll delle `<table>` larghe con overflow-auto contain-paint (in Chromium le tabelle possono gonfiare document.scrollWidth anche con solo overflow:auto).

- tutta la UI deve essere in italiano, ogni singolo elemento
- riordinare la navbar secondo un layout più standard e intuitivo

- Migliora la leggibilità delle tabelle e delle viste dati senza cambiare il modello di dominio né aggiungere decorazione inutili.
  - Header colonne: aggiungi un’icona muted coerente a sinistra del titolo; tutti gli header (ordinabili e no) devono condividere lo stesso chrome (altezza, font-size, padding, dimensione icone, baseline). Non lasciare header “più piccoli” solo perché non sono sortable.
  - Categorie vs stati: per enum/categorie frequenti usa un chip leggero (outline neutra + quadratino/cerchio colorato laterale). Per stati azionabili (attivo/inattivo, approvato/in attesa, esaurito/ok) usa badge con fill soft + icona. Mai solo colore: etichetta sempre presente.
  - Semantica colore: mappa pochi toni a ruoli fissi (es. entrate/success, uscite/danger, warning, info) e riusali ovunque; niente rainbow casuale.
  - Date: formatta le date in locale con mese abbreviato testuale (non gg/mm/aaaa numerico), e allinea datetime allo stesso stile.
  - Densità: resta uno strumento operativo — densità da tabella, niente hero metric, card decorative o side-stripe colorati.
  - Preferisci componenti riusabili (header con icon, badge “dot” vs “status”, helper di formattazione) e aggiorna le colonne ad alta frequenza prima; mantieni light/dark e contrasto AA.
- usare questi principi per migliorare la UI anche in caso di creazione/modifica dati (es. se si usano colori o simboli nelle tabelle per mostrare dei dati particolari, usarli anche in caso di creazione/modifica dati)

- se si usano tooltip, usare tooltip di shadcn/ui (stessa cosa per i popover)
- per aprire le schermate di modifica o creazione dati magari usare sheet di shadcn/ui (quale può risultare più adatto?)

- allineare a destra tutte le colonne numeriche (quindi prezzi, quantità, etc. NON gli id)
- migliorare azioni tabella e aggiungere un context menu di shadcn/ui per le azioni (in tabella)
- multi-select in tabella (bisogna decidere quali azioni poi si possono fare su più righe contemporaneamente)
- possibilità di resizare e riordinare le colonne della tabella
- possibilità di fissare una o più colonne per renderle sempre visibili anche se si scrolla orizzontalmente (in tabella)
- possibilità di fissare una o più righe della tabella per renderle sempre visibili anche se si scrolla verticalmente in caso si voglia comparare i dati con altre righe della tabella (in tabella)
- search highlight in tabella avrebbe senso dato che vogliamo traslare al backend la logica di ricerca? (in tabella)
