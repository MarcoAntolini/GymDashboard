# GymDashboard

Software gestionale OLTP per una palestra: anagrafica clienti e dipendenti, listino, ingressi, timbrature, movimenti economici.

## Language

### Persone e accesso

**Cliente**:
Persona iscritta alla palestra che può acquistare prodotti del listino e registrare ingressi.
_Avoid_: Membro, utente, member

**Dipendente**:
Persona assunta dalla palestra, eventualmente titolare di un account per usare il sistema.
_Avoid_: Staff, employee (nei documenti di progetto usare Dipendente)

**Amministratore**:
Ruolo di account con privilegi completi sul sistema; è sempre legato a un Dipendente.
_Avoid_: Superuser, root

**Account**:
Credenziali di accesso al sistema associate a un Dipendente, con ruolo e stato di approvazione.
_Avoid_: User, login, utente di sistema

**Approvazione**:
Stato booleano dell’Account: solo se vero il Dipendente può autenticarsi e operare.
_Avoid_: Attivazione, conferma account (sinonimi ammessi in prosa, termine canonico Approvazione)

### Rapporto di lavoro

**Contratto**:
Accordo lavorativo tra palestra e Dipendente, con tipo, costo orario e periodo di validità.
_Avoid_: Assunzione (l’assunzione è l’evento; il Contratto è l’istanza storicizzata)

**Timbratura**:
Registrazione di un’entrata (e relativa uscita) di un Dipendente dal posto di lavoro; consente spezzati nello stesso giorno.
_Avoid_: Presenza, clock-in (termine UI ammissibile; nel modello usare Timbratura)

### Listino e vendite

**Prodotto**:
Voce vendibile del listino, specializzata in Abbonamento o Pacchetto ingressi.
_Avoid_: Offerta, piano, plan

**Abbonamento**:
Prodotto a durata temporale (giorni di validità) che abilita l’accesso in palestra nel periodo coperto.
_Avoid_: Membership, subscription

**Pacchetto ingressi**:
Prodotto che concede un numero finito di ingressi consumabili.
_Avoid_: Entrance set, carnet (sinonimo informale ammissibile in UI)

**Listino**:
Prezzo di un Prodotto per un dato anno.
_Avoid_: Catalogo prezzi (sinonimo); Catalog (nome tecnico codice)

**Acquisto**:
Evento in cui un Cliente compra un Prodotto in una data; l’importo registrato è lo snapshot alla vendita (di norma allineato al Listino dell’anno) ed è il titolo che giustifica gli Ingressi collegati.
_Avoid_: Ordine, vendita (nel modello: Acquisto lato cliente); TitoloAccesso (non introdotto: coinciderebbe 1:1 con Acquisto)

### Accesso in palestra

**Ingresso**:
Evento di entrata in palestra in un istante, giustificato da un Acquisto; può ripetersi più volte nello stesso giorno.
_Avoid_: Check-in, entrata cliente (sinonimi; preferire Ingresso)

**Ingressi rimanenti**:
Residuo di un Acquisto di Pacchetto: numero ingressi del prodotto meno gli Ingressi già collegati a quell’Acquisto; non è un attributo del Cliente.
_Avoid_: Credito ingressi, saldo (ambigui con cassa); contatore globale su Cliente

### Movimenti economici in uscita

**Pagamento**:
Uscita economica della palestra, specializzata per tipo (Stipendio, Bolletta, Attrezzatura, Intervento).
_Avoid_: Spesa, movement (usare Pagamento per le uscite; Acquisto per le entrate da clienti)

**Stipendio**:
Pagamento erogato a un Dipendente.
_Avoid_: Salary

**Bolletta**:
Pagamento verso un fornitore di utenza/servizio ricorrente, con descrizione e fornitore (stringa; stessa forma di Attrezzatura, semantica diversa — non collassate).
_Avoid_: Utenza (troppo generico)

**Attrezzatura**:
Pagamento per acquisto di attrezzatura da un fornitore (etichetta testuale; non anagrafica fornitori; non è magazzino/inventario pezzi).
_Avoid_: Equipment inventory, macchinario (come giacenza)

**Intervento**:
Pagamento per un lavoro eseguito da un attuatore in un intervallo temporale.
_Avoid_: Manutenzione (può esserlo, ma il concetto è Intervento)

### Vincoli di dominio (termini)

**Tornello**:
Vincolo di processo: un Dipendente non può timbrare due entrate consecutive senza uscita (garantito operativamente, non solo dall’UI).

**Spezzato**:
Più Timbrature dello stesso Dipendente nello stesso giorno solare, ciascuna con propria entrata/uscita.
