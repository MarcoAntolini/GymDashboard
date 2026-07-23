# Product

## Register

product

## Platform

web

## Users

**Primary — Dipendente (ruolo Account `Employee`):** opera al bancone o in ufficio durante la giornata. Compiti tipici: registrare **Ingressi** di un **Cliente**, inserire **Acquisti** (Abbonamento o Pacchetto ingressi), consultare **Listino** / **Prodotti**, registrare **Pagamenti** in uscita (Bolletta, Attrezzatura, Intervento). Contesto: alta frequenza su Ingressi, poca tolleranza per frizione UI.

**Secondary — Amministratore (ruolo Account `Admin`):** stesso shell dashboard con privilegi completi. In più: **Account** (Approvazione), anagrafica **Dipendenti**, **Contratti**, **Timbrature**, **Stipendi**. Contesto: amministrazione e controllo, non marketing.

Entrambi accedono solo con **Account** approvato legato a un **Dipendente**. Non c’è audience esterna (Cliente non usa il sistema).

## Product Purpose

GymDashboard è un gestionale **OLTP** per una palestra: anagrafica (**Cliente**, **Dipendente**), listino (**Prodotto** → Abbonamento / Pacchetto ingressi, **Listino** annuale), operazioni quotidiane (**Ingresso**, **Acquisto**), uscite tipizzate (**Pagamento**: Stipendio, Bolletta, Attrezzatura, Intervento), e supporto al personale (**Contratto**, **Timbratura**, **Account** / Approvazione).

Successo = registrare e consultare questi eventi in modo affidabile e veloce (tabelle, filtri, form), non convincere visitatori o vendere un SaaS.

## Positioning

Un’unica dashboard operativa dove Ingressi, Acquisti e Pagamenti restano allineati al modello di dominio della palestra — non una vetrina, non un report vanity.

## Brand Personality

Operativo, sobrio, diretto. Voce da strumento di lavoro: etichette di dominio (Ingresso, Acquisto, Pagamento), non copy da landing. Emozione desiderata: controllo e chiarezza sotto pressione operativa.

## Anti-references

- Landing / marketing pages (hero, CTA di conversione, brand-as-product)
- Dashboard SaaS “hero-metric” (numero gigante + label + strip di KPI decorative)
- Template purple-on-white / indigo gradient, cream/sand editorial AI, glassmorphism decorativo
- Glossario anglofonico generico (member, check-in, staff) al posto di Cliente, Ingresso, Dipendente

## Design Principles

1. **Design serves the task** — ogni schermata ottimizza un’operazione OLTP (registra Ingresso, inserisci Acquisto, filtra Pagamenti), non impressiona.
2. **Dominio italiano prima** — etichette e copy usano i termini di `CONTEXT.md`; evitare sinonimi che confondono il modello.
3. **Ruoli espliciti** — Amministratore vede tutto; Dipendente solo le sezioni operative consentite; non nascondere lo stato di Approvazione Account.
4. **Densità utile** — tabelle, toolbar e form battono card decorative e empty-state teatrali.
5. **Niente vetrina** — niente hero, social proof o metriche vanity sul percorso autenticato.

## Accessibility & Inclusion

Supportare light/dark via tema di sistema già presente. Preferire contrasto leggibile su tabelle e form (testo muted solo per metadati, non per contenuto primario). Rispettare `prefers-reduced-motion` su eventuali animazioni. Target pratico: WCAG 2.2 AA su testo e controlli interattivi delle viste CRUD.

## Surface notes

**Panoramica (`/`):** home post-login (Admin e Dipendente). Strip cassa (Entrate/Uscite/Saldo/Ingressi) + ripartizioni + mix prodotti; densità operativa, niente hero-KPI. Navbar: sezione Operazioni prima (Panoramica in cima).
