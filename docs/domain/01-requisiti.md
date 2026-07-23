# Requisiti ristrutturati — GymDashboard

**Fonti:** `docs/proposta.txt`, `docs/relazione.txt`, schema target (`prisma/schema.prisma` + `02-schema-er.md` / `03-schema-logico.md`), linee guida in `docs/db-guidelines/`.

**Metodologia:** `04-progettazione-concettuale.md` (glossario, frasi per concetto, tabella operazioni).

## Frasi di carattere generale

Si vuole realizzare una base di dati per la gestione di una palestra. Si rappresentano clienti, dipendenti (con account, contratti e timbrature), prodotti del listino (abbonamenti e pacchetti ingressi), acquisti dei clienti, ingressi in palestra e uscite economiche (stipendi, bollette, attrezzature, interventi). Il sistema è OLTP: operazioni quotidiane di anagrafica, cassa e accesso.

## Frasi sui clienti

Per ogni Cliente si rappresentano codice fiscale, nome, cognome, data di nascita, indirizzo (via, civico, città, provincia), telefono, email e data di iscrizione. Un Cliente può effettuare zero o più Acquisti. Gli Ingressi del Cliente si ottengono navigando gli Acquisti che li giustificano. Un Cliente può entrare più volte nello stesso giorno; ogni Ingresso è un evento distinto con timestamp.

## Frasi sui dipendenti e sull’accesso al sistema

Per ogni Dipendente si rappresentano codice fiscale, nome, cognome, data di nascita, indirizzo, telefono, email e data di assunzione. Un Dipendente può avere zero o un Account. L’Account ha username, password, ruolo (Amministratore o Dipendente) e flag di Approvazione. Alla registrazione l’Account non è approvato; solo l’Amministratore può approvarlo. Senza Approvazione non è consentito l’accesso operativo.

## Frasi sui contratti

Un Dipendente può avere più Contratti nel tempo (reassunzione / nuova stipula). Ogni Contratto ha tipo (tempo determinato o indeterminato), costo orario, data di inizio e data di fine opzionale. Un Dipendente non ha due Contratti con la stessa data di inizio, né Contratti con periodi sovrapposti.

## Frasi sulle timbrature

Si registrano Timbrature di entrata e uscita dei Dipendenti. La chiave temporale è l’istante di entrata (non il solo giorno solare), così da ammettere spezzati. L’uscita può essere assente finché il turno è in corso. Si assume che il tornello impedisca la sequenza entrata–entrata senza uscita.

## Frasi sul listino

Un Prodotto è identificato da un codice e appartiene esattamente a una specializzazione: Abbonamento (durata in giorni) oppure Pacchetto ingressi (numero di ingressi). Il Listino associa a ogni Prodotto, per un dato anno, un prezzo. Il tipo (abbonamento vs pacchetto) si ottiene dalla specializzazione del Prodotto. Si devono poter filtrare i prodotti per tipo (via specializzazione) e per anno di listino.

## Frasi sugli acquisti e sugli ingressi

Un Acquisto lega un Cliente a un Prodotto in una data, con importo fissato alla vendita (snapshot rispetto al Listino dell’anno; eventuali sconti espliciti). Il tipo è quello della specializzazione del Prodotto. Gli Acquisti costituiscono le entrate economiche da clienti. Un Ingresso registra l’accesso in palestra e **deve** riferirsi all’Acquisto che lo giustifica, scelto con regole di priorità deterministiche (abbonamento valido più recente; altrimenti pacchetto con residuo in FIFO) in una transazione atomica.

## Frasi sui pagamenti (uscite)

Un Pagamento ha data, importo e tipo. Ogni Pagamento appartiene esattamente a una specializzazione: Stipendio (legato a un Dipendente), Bolletta (descrizione, fornitore), Attrezzatura (descrizione, fornitore; spesa, non inventario pezzi), Intervento (descrizione, attuatore, inizio e fine). Si devono poter filtrare le uscite per tipo e per periodo; analogamente le entrate (Acquisti).

## Frasi sulle statistiche

Il sistema deve consentire viste aggregate su entrate/uscite, abbonamenti/pacchetti e altre misure rilevanti (da definire sulle operazioni frequenti).

## Glossario dei termini

| Termine | Descrizione | Sinonimi | Collegamenti |
|---|---|---|---|
| Cliente | Persona iscritta che acquista e entra in palestra | Membro | Acquisto, Ingresso |
| Dipendente | Persona assunta dalla palestra | Staff | Account, Contratto, Timbratura, Stipendio |
| Account | Credenziali e ruolo di un Dipendente | User, login | Dipendente, Amministratore |
| Amministratore | Ruolo Account con privilegi completi | Admin | Account |
| Contratto | Periodo di rapporto lavorativo | — | Dipendente |
| Timbratura | Entrata/uscita dal posto di lavoro | Presenza | Dipendente |
| Prodotto | Voce vendibile del listino | Offerta | Abbonamento, Pacchetto ingressi, Listino, Acquisto |
| Abbonamento | Prodotto a durata | Membership | Prodotto |
| Pacchetto ingressi | Prodotto a numero finito di accessi | Carnet | Prodotto, Ingresso |
| Listino | Prezzo annuale di un Prodotto | Catalogo | Prodotto |
| Acquisto | Entrata economica da Cliente | Vendita | Cliente, Prodotto, Ingresso |
| Ingresso | Accesso in palestra giustificato da un Acquisto | Check-in | Acquisto |
| Ingressi rimanenti | Residuo derivabile per Acquisto di pacchetto | Credito/saldo (evitare) | Pacchetto ingressi, Ingresso |
| Pagamento | Uscita economica tipizzata | Spesa | Stipendio, Bolletta, Attrezzatura, Intervento |
| Stipendio | Pagamento a Dipendente | — | Pagamento, Dipendente |
| Bolletta | Pagamento utenza/servizio | — | Pagamento |
| Attrezzatura | Pagamento per attrezzatura | — | Pagamento |
| Intervento | Pagamento per lavoro a tempo | Manutenzione | Pagamento |

Definizioni canoniche anche in `CONTEXT.md` (radice repo).

## Tabella delle operazioni (stima)

Frequenze indicative per ristrutturazione logica / indici (da rivedere con dati reali).

| Operazione | Tipo | Frequenza stimata |
|---|---|---|
| Registrazione Ingresso cliente | I | Alta (decine–centinaia/giorno) |
| Timbratura entrata/uscita dipendente | I | Media |
| Inserimento/modifica Cliente | I | Bassa |
| Acquisto abbonamento/pacchetto | I | Media-bassa |
| CRUD listino / prodotti | I | Bassa |
| Registrazione Pagamento (stipendio/bolletta/…) | I | Bassa |
| Approvazione Account | I | Molto bassa |
| Report entrate/uscite per periodo | I/B | Bassa |
| Statistiche dashboard | I | Media |

## Decisioni sui requisiti aperti (`relazione.txt`)

| Domanda / nota | Decisione di progetto |
|---|---|
| Spezzato senza “solo data” | Timbratura identificata da (Dipendente, istante entrata); uscita opzionale |
| Stipula contratto / reassunzione | Più Contratti per Dipendente; id (Dipendente, data inizio) |
| Tipo abbonamento vs pacchetto | Generalizzazione esclusiva su Prodotto |
| Bug entrata–entrata dipendente | Vincolo di processo (tornello) + regola: non due entrate aperte |
| Cliente più ingressi stesso giorno? | **Sì**: più Ingressi lo stesso giorno, ciascuno con timestamp distinto |
| Contatore ingressi sul Cliente? | **No**: residuo per Acquisto di pacchetto (derivato); Ingresso → Acquisto |
| TitoloAccesso separato da Acquisto? | **No**: Acquisto è il titolo; FK diretta Ingresso → Acquisto |
| Contratti sovrapposti? | **No**: intervalli `[inizio, fine)` disgiunti per Dipendente (`DataFine` NULL = +∞) |
| Più abbonamenti validi? | Tie-break: Acquisto di Abbonamento più recente (poi `Id` max); pacchetti in FIFO |
| Importo ≠ prezzo listino? | Importo = snapshot alla vendita; default dal listino dell’anno; sconto solo esplicito |
| Delete Cliente/Acquisto con storia? | **Restrict** (niente cascade su cassa / ingressi) |
| Entità Fornitore? | **No**: stringa su Bolletta/Attrezzatura; reificare solo con anagrafica/identità canonica |
| Contatore residuo su Acquisto? | **No**: solo derivato `N − COUNT` |
| Generalizzazione PERSONA? | **No nello schema**; variante (t,e) ammissibile in relazione (limite: stessa persona fisica in entrambi i ruoli) |
| Collasso Bolletta≈Attrezzatura? | **No**: figlie ISA separate (semantica diversa) |

## Schema scheletro (inside-out / misto)

```
CLIENTE —— ACQUISTO —— PRODOTTO —— LISTINO
               |           |
            INGRESSO   ABBONAMENTO | PACCHETTO

DIPENDENTE —— CONTRATTO
    |—————— TIMBRATURA
    |—————— ACCOUNT
    |—————— STIPENDIO —— PAGAMENTO —— (BOLLETTA | ATTREZZATURA | INTERVENTO)
```

Dettaglio completo: `02-schema-er.md`. Mapping logico: `03-schema-logico.md`.
