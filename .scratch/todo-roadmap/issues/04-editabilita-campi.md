# Campi editabili vs read-only

**Type:** grilling

**Status:** resolved

## Question

Quali campi possono essere modificati in create/edit e quali devono restare bloccati?

## Answer

- **Read-only / non editabili:** PK/surrogate id, snapshot di vendita su Acquisto (importo default da Listino ma override sconto ammesso alla creazione; post-vendita snapshot immutabile salvo regole esplicite), Acquisto con Ingressi collegati (delete Restrict, edit limitato).
- **Editabili:** anagrafica Cliente/Dipendente, Listino corrente (effetto solo su vendite future), Contratti nuovi, Pagamenti/Stipendi in bozza, Account (Admin).
- **UI:** form e tabella devono concordare — se read-only in dominio, disabilitare/nascondere in edit (es. password hash mai in chiaro; mascherare in tabella Account).
